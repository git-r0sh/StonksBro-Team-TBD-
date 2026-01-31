"""
Portfolio Management Router with full CRUD and CSV export
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import logging
import io
import csv

from database import get_db
from models import Portfolio as PortfolioModel, User as UserModel
from schemas import Portfolio, PortfolioCreate, PortfolioUpdate
from routers.auth import get_current_user
from cache import price_cache
from yf_utils import fetch_bulk_prices, fetch_single_price

router = APIRouter(prefix="/portfolio", tags=["portfolio"])
logger = logging.getLogger(__name__)

# Sector mapping for diversification analysis
STOCK_SECTORS = {
    "RELIANCE": {"sector": "Energy", "cap": "Large Cap"},
    "TCS": {"sector": "IT", "cap": "Large Cap"},
    "HDFCBANK": {"sector": "Banking", "cap": "Large Cap"},
    "INFY": {"sector": "IT", "cap": "Large Cap"},
    "ICICIBANK": {"sector": "Banking", "cap": "Large Cap"},
    "HINDUNILVR": {"sector": "FMCG", "cap": "Large Cap"},
    "SBIN": {"sector": "Banking", "cap": "Large Cap"},
    "BHARTIARTL": {"sector": "Telecom", "cap": "Large Cap"},
    "ITC": {"sector": "FMCG", "cap": "Large Cap"},
    "KOTAKBANK": {"sector": "Banking", "cap": "Large Cap"},
    "WIPRO": {"sector": "IT", "cap": "Large Cap"},
    "TATAMOTORS": {"sector": "Auto", "cap": "Large Cap"},
    "MARUTI": {"sector": "Auto", "cap": "Large Cap"},
    "SUNPHARMA": {"sector": "Pharma", "cap": "Large Cap"},
    "LT": {"sector": "Infra", "cap": "Large Cap"},
    "BEL": {"sector": "Defence", "cap": "Mid Cap"},
    "COALINDIA": {"sector": "Energy", "cap": "Large Cap"},
}

# Broker colors for visualization
BROKER_COLORS = {
    "Zerodha": "#387ed1",
    "Groww": "#00d09c",
    "Upstox": "#6950ff",
    "Angel One": "#ff6b00",
    "Kite": "#387ed1",
    "Manual": "#888888"
}


def get_live_price(ticker: str) -> float:
    """Fetch live price with timeout using optimized bulk download"""
    ticker_upper = ticker.upper().replace(".NS", "")
    cache_key = f"price_{ticker_upper}"
    
    if cache_key in price_cache:
        return price_cache[cache_key]
    
    # Use optimized single price fetch with timeout
    result = fetch_single_price(ticker_upper, timeout=5)
    if result and result.get("price", 0) > 0:
        price = result["price"]
        price_cache[cache_key] = price
        return price
    
    return 0.0


def enrich_holding(holding: PortfolioModel) -> dict:
    """Enrich holding with live price and calculations"""
    ticker = holding.ticker.upper().replace(".NS", "")
    current_price = get_live_price(ticker)
    invested_value = holding.quantity * holding.buy_price
    current_value = holding.quantity * current_price
    gain_loss = current_value - invested_value
    gain_loss_percent = (gain_loss / invested_value) * 100 if invested_value > 0 else 0
    
    stock_info = STOCK_SECTORS.get(ticker, {"sector": "Unknown", "cap": "Unknown"})
    
    return {
        "id": holding.id,
        "ticker": ticker,
        "quantity": holding.quantity,
        "buy_price": holding.buy_price,
        "source_app": holding.source_app or "Manual",
        "bought_at": holding.bought_at.isoformat() if holding.bought_at else None,
        "current_price": round(current_price, 2),
        "invested_value": round(invested_value, 2),
        "current_value": round(current_value, 2),
        "gain_loss": round(gain_loss, 2),
        "gain_loss_percent": round(gain_loss_percent, 2),
        "sector": stock_info["sector"],
        "cap_category": stock_info["cap"],
        "broker_color": BROKER_COLORS.get(holding.source_app, "#888888")
    }


# ===== CRUD ENDPOINTS =====

@router.get("/", response_model=List[dict])
async def get_portfolio(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all holdings for the authenticated user"""
    holdings = db.query(PortfolioModel).filter(
        PortfolioModel.user_id == current_user.id
    ).all()
    
    return [enrich_holding(h) for h in holdings]


@router.post("/", response_model=dict)
async def add_investment(
    holding: PortfolioCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new investment to portfolio"""
    ticker = holding.ticker.upper().replace(".NS", "")
    
    # Validate ticker by trying to fetch price
    try:
        price = get_live_price(ticker)
        if price == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid ticker: {ticker}. Could not fetch price data."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error validating ticker: {str(e)}"
        )
    
    # Create new holding
    db_holding = PortfolioModel(
        user_id=current_user.id,
        ticker=ticker,
        quantity=holding.quantity,
        buy_price=holding.buy_price,
        source_app=holding.source_app or "Manual"
    )
    db.add(db_holding)
    db.commit()
    db.refresh(db_holding)
    
    return {
        "message": "Investment added successfully",
        "holding": enrich_holding(db_holding)
    }


@router.put("/{holding_id}", response_model=dict)
async def update_investment(
    holding_id: int,
    update_data: PortfolioUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing investment"""
    holding = db.query(PortfolioModel).filter(
        PortfolioModel.id == holding_id,
        PortfolioModel.user_id == current_user.id
    ).first()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    # Update fields if provided
    if update_data.ticker is not None:
        holding.ticker = update_data.ticker.upper().replace(".NS", "")
    if update_data.quantity is not None:
        holding.quantity = update_data.quantity
    if update_data.buy_price is not None:
        holding.buy_price = update_data.buy_price
    if update_data.source_app is not None:
        holding.source_app = update_data.source_app
    
    db.commit()
    db.refresh(holding)
    
    return {
        "message": "Investment updated successfully",
        "holding": enrich_holding(holding)
    }


@router.delete("/{holding_id}")
async def delete_investment(
    holding_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an investment from portfolio"""
    holding = db.query(PortfolioModel).filter(
        PortfolioModel.id == holding_id,
        PortfolioModel.user_id == current_user.id
    ).first()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    db.delete(holding)
    db.commit()
    
    return {"message": "Investment deleted successfully"}


# ===== ANALYTICS ENDPOINTS =====

@router.get("/summary")
async def get_portfolio_summary(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get portfolio summary with totals"""
    holdings = db.query(PortfolioModel).filter(
        PortfolioModel.user_id == current_user.id
    ).all()
    
    enriched = [enrich_holding(h) for h in holdings]
    
    total_invested = sum(h["invested_value"] for h in enriched)
    total_current = sum(h["current_value"] for h in enriched)
    total_gain_loss = total_current - total_invested
    total_gain_loss_percent = (total_gain_loss / total_invested) * 100 if total_invested > 0 else 0
    
    return {
        "holdings": enriched,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current": round(total_current, 2),
            "total_gain_loss": round(total_gain_loss, 2),
            "total_gain_loss_percent": round(total_gain_loss_percent, 2),
            "holdings_count": len(enriched)
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/diversification")
async def get_diversification(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get portfolio diversification breakdown"""
    holdings = db.query(PortfolioModel).filter(
        PortfolioModel.user_id == current_user.id
    ).all()
    
    enriched = [enrich_holding(h) for h in holdings]
    
    # Sector breakdown
    sector_totals = {}
    cap_totals = {}
    broker_totals = {}
    total_value = 0
    
    for holding in enriched:
        value = holding["current_value"]
        sector = holding["sector"]
        cap = holding["cap_category"]
        broker = holding["source_app"]
        total_value += value
        
        sector_totals[sector] = sector_totals.get(sector, 0) + value
        cap_totals[cap] = cap_totals.get(cap, 0) + value
        broker_totals[broker] = broker_totals.get(broker, 0) + value
    
    def get_sector_color(sector: str) -> str:
        colors = {
            "IT": "#06b6d4", "Banking": "#8b5cf6", "Energy": "#f59e0b",
            "FMCG": "#10b981", "Pharma": "#ef4444", "Auto": "#3b82f6",
            "Telecom": "#ec4899", "Infra": "#6366f1", "Defence": "#14b8a6"
        }
        return colors.get(sector, "#64748b")
    
    def get_cap_color(cap: str) -> str:
        colors = {"Large Cap": "#10b981", "Mid Cap": "#f59e0b", "Small Cap": "#ef4444"}
        return colors.get(cap, "#64748b")
    
    sector_breakdown = [
        {
            "name": sector,
            "value": round(value, 2),
            "percentage": round((value / total_value) * 100, 2) if total_value > 0 else 0,
            "color": get_sector_color(sector)
        }
        for sector, value in sorted(sector_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    cap_breakdown = [
        {
            "name": cap,
            "value": round(value, 2),
            "percentage": round((value / total_value) * 100, 2) if total_value > 0 else 0,
            "color": get_cap_color(cap)
        }
        for cap, value in sorted(cap_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    broker_breakdown = [
        {
            "name": broker,
            "value": round(value, 2),
            "percentage": round((value / total_value) * 100, 2) if total_value > 0 else 0,
            "color": BROKER_COLORS.get(broker, "#888888")
        }
        for broker, value in sorted(broker_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Risk analysis
    top_holding = max(enriched, key=lambda x: x["current_value"]) if enriched else None
    concentration_risk = (top_holding["current_value"] / total_value * 100) if top_holding and total_value > 0 else 0
    
    return {
        "sector_breakdown": sector_breakdown,
        "cap_breakdown": cap_breakdown,
        "broker_breakdown": broker_breakdown,
        "total_value": round(total_value, 2),
        "risk_analysis": {
            "concentration_risk": round(concentration_risk, 2),
            "top_holding": top_holding["ticker"] if top_holding else None,
            "diversification_score": round(100 - concentration_risk, 2),
            "recommendation": "Well diversified" if concentration_risk < 25 else "Consider rebalancing" if concentration_risk < 40 else "High concentration risk"
        },
        "timestamp": datetime.now().isoformat()
    }


# ===== EXPORT ENDPOINT =====

@router.get("/export/csv")
async def export_portfolio_csv(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export portfolio holdings to CSV"""
    holdings = db.query(PortfolioModel).filter(
        PortfolioModel.user_id == current_user.id
    ).all()
    
    enriched = [enrich_holding(h) for h in holdings]
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Ticker", "Quantity", "Buy Price", "Current Price", 
        "Invested Value", "Current Value", "Gain/Loss", "Gain/Loss %",
        "Sector", "Cap Category", "Source App", "Bought At"
    ])
    
    # Data rows
    for h in enriched:
        writer.writerow([
            h["ticker"], h["quantity"], h["buy_price"], h["current_price"],
            h["invested_value"], h["current_value"], h["gain_loss"], h["gain_loss_percent"],
            h["sector"], h["cap_category"], h["source_app"], h["bought_at"]
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=portfolio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


# ===== PUBLIC DEMO ENDPOINT (No auth required) =====

@router.get("/demo")
async def get_demo_portfolio():
    """Get demo portfolio for unauthenticated users"""
    demo_holdings = [
        {"ticker": "RELIANCE", "quantity": 10, "buy_price": 1350.00, "source_app": "Zerodha"},
        {"ticker": "TCS", "quantity": 5, "buy_price": 3750.50, "source_app": "Groww"},
        {"ticker": "HDFCBANK", "quantity": 15, "buy_price": 1580.25, "source_app": "Zerodha"},
        {"ticker": "INFY", "quantity": 20, "buy_price": 1480.00, "source_app": "Upstox"},
    ]
    
    result = []
    for h in demo_holdings:
        ticker = h["ticker"]
        current_price = get_live_price(ticker)
        invested = h["quantity"] * h["buy_price"]
        current = h["quantity"] * current_price
        gain_loss = current - invested
        gain_loss_pct = (gain_loss / invested) * 100 if invested > 0 else 0
        stock_info = STOCK_SECTORS.get(ticker, {"sector": "Unknown", "cap": "Unknown"})
        
        result.append({
            "id": len(result) + 1,
            "ticker": ticker,
            "quantity": h["quantity"],
            "buy_price": h["buy_price"],
            "source_app": h["source_app"],
            "current_price": round(current_price, 2),
            "invested_value": round(invested, 2),
            "current_value": round(current, 2),
            "gain_loss": round(gain_loss, 2),
            "gain_loss_percent": round(gain_loss_pct, 2),
            "sector": stock_info["sector"],
            "cap_category": stock_info["cap"],
            "broker_color": BROKER_COLORS.get(h["source_app"], "#888888")
        })
    
    return result


# ===== ALERTS ENDPOINT (No auth required) =====

@router.get("/alerts")
async def get_portfolio_alerts():
    """Get technical alerts for monitored stocks using optimized bulk fetch"""
    # Demo stocks to check for alerts
    watched_stocks = ["SBIN", "ITC", "RELIANCE", "TCS", "HDFCBANK", "INFY"]
    
    # Fetch all prices in bulk with timeout
    bulk_data = fetch_bulk_prices(watched_stocks, timeout=5)
    
    alerts = []
    
    for ticker in watched_stocks:
        stock_data = bulk_data.get(ticker)
        if not stock_data or stock_data.get("price", 0) == 0:
            continue
        
        # Use change_percent as a proxy for momentum (RSI-like signal)
        change_pct = stock_data.get("change_percent", 0)
        
        # Generate alerts based on price momentum
        if change_pct < -3:
            alerts.append({
                "ticker": ticker,
                "type": "OVERSOLD",
                "severity": "high",
                "message": f"{ticker} is down significantly! Change: {change_pct:.1f}%",
                "rsi": None,
                "action": "Consider adding to position"
            })
        elif change_pct < -1.5:
            alerts.append({
                "ticker": ticker,
                "type": "APPROACHING_OVERSOLD",
                "severity": "medium",
                "message": f"{ticker} showing weakness. Change: {change_pct:.1f}%",
                "rsi": None,
                "action": "Monitor closely"
            })
        elif change_pct > 3:
            alerts.append({
                "ticker": ticker,
                "type": "OVERBOUGHT",
                "severity": "high",
                "message": f"{ticker} is up significantly! Change: {change_pct:.1f}%",
                "rsi": None,
                "action": "Consider taking profits"
            })
        elif change_pct > 1.5:
            alerts.append({
                "ticker": ticker,
                "type": "APPROACHING_OVERBOUGHT",
                "severity": "medium",
                "message": f"{ticker} showing strength. Change: {change_pct:.1f}%",
                "rsi": None,
                "action": "Be cautious with new positions"
            })
    
    # Add a static alert if no dynamic ones found
    if len(alerts) == 0:
        alerts.append({
            "ticker": "SYSTEM",
            "type": "INFO",
            "severity": "low",
            "message": "All monitored stocks are in neutral territory",
            "rsi": None,
            "action": "No action needed"
        })
    
    return {"alerts": alerts}

