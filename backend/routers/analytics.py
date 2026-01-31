"""
Advanced Market Analytics Router
Technical indicators, fundamentals, and sector performance.
"""
from fastapi import APIRouter, HTTPException
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
import logging
from cache import analytics_cache, cached
from yf_utils import fetch_bulk_prices, fetch_history_with_timeout

router = APIRouter(prefix="/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)

# Sector mapping for Indian stocks
SECTOR_STOCKS = {
    "IT": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"],
    "Banking": ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK"],
    "Energy": ["RELIANCE", "ONGC", "BPCL", "IOC", "NTPC"],
    "Pharma": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"],
    "Auto": ["TATAMOTORS", "MARUTI", "BAJAJ-AUTO", "EICHERMOT", "M&M"],
    "FMCG": ["HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "DABUR"],
    "Metals": ["TATASTEEL", "HINDALCO", "JSWSTEEL", "COALINDIA", "VEDL"],
    "Infra": ["LT", "ADANIENT", "ADANIPORTS", "ULTRACEMCO", "GRASIM"],
}

def get_yf_ticker(ticker: str) -> str:
    """Convert ticker to yfinance NSE format"""
    return f"{ticker.upper()}.NS"


def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    """Calculate Relative Strength Index"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return round(float(rsi.iloc[-1]), 2) if not pd.isna(rsi.iloc[-1]) else 50.0


def calculate_macd(prices: pd.Series) -> dict:
    """Calculate MACD (12, 26, 9)"""
    ema12 = prices.ewm(span=12, adjust=False).mean()
    ema26 = prices.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    histogram = macd_line - signal_line
    
    return {
        "macd": round(float(macd_line.iloc[-1]), 2),
        "signal": round(float(signal_line.iloc[-1]), 2),
        "histogram": round(float(histogram.iloc[-1]), 2),
        "trend": "Bullish" if macd_line.iloc[-1] > signal_line.iloc[-1] else "Bearish"
    }


def calculate_bollinger_bands(prices: pd.Series, period: int = 20, std_dev: int = 2) -> dict:
    """Calculate Bollinger Bands"""
    sma = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    current_price = prices.iloc[-1]
    
    # Calculate position within bands (0-100)
    band_width = upper.iloc[-1] - lower.iloc[-1]
    position = ((current_price - lower.iloc[-1]) / band_width * 100) if band_width > 0 else 50
    
    return {
        "upper": round(float(upper.iloc[-1]), 2),
        "middle": round(float(sma.iloc[-1]), 2),
        "lower": round(float(lower.iloc[-1]), 2),
        "position": round(float(position), 2),
        "signal": "Overbought" if position > 80 else "Oversold" if position < 20 else "Neutral"
    }


def calculate_ema(prices: pd.Series, periods: list = [50, 200]) -> dict:
    """Calculate Exponential Moving Averages"""
    result = {}
    current_price = float(prices.iloc[-1])
    
    for period in periods:
        if len(prices) >= period:
            ema = float(prices.ewm(span=period, adjust=False).mean().iloc[-1])
            result[f"ema{period}"] = round(ema, 2)
            result[f"above_ema{period}"] = bool(current_price > ema)  # Convert to Python bool
        else:
            result[f"ema{period}"] = None
            result[f"above_ema{period}"] = None
    
    # Golden/Death cross check
    if result.get("ema50") and result.get("ema200"):
        result["cross_signal"] = "Golden Cross" if result["ema50"] > result["ema200"] else "Death Cross"
    else:
        result["cross_signal"] = None
    
    return result


@router.get("/technical/{ticker}")
async def get_technical_indicators(ticker: str, period: str = "3mo"):
    """Get technical indicators for a stock: RSI, MACD, Bollinger Bands, EMAs"""
    ticker_upper = ticker.upper()
    yf_ticker = get_yf_ticker(ticker_upper)
    
    cache_key = f"tech_{ticker_upper}_{period}"
    if cache_key in analytics_cache:
        return analytics_cache[cache_key]
    
    try:
        stock = yf.Ticker(yf_ticker)
        hist = stock.history(period=period)
        
        if hist.empty or len(hist) < 20:
            # Return mock data with a note
            return {
                "ticker": ticker_upper,
                "current_price": 1000.0,
                "timestamp": datetime.now().isoformat(),
                "rsi": {"value": 50, "signal": "Neutral"},
                "macd": {"macd": 0, "signal": 0, "histogram": 0, "trend": "Neutral"},
                "bollinger": {"upper": 1050, "middle": 1000, "lower": 950, "position": 50, "signal": "Neutral"},
                "ema": {"ema50": 1000, "ema200": 980, "above_ema50": True, "above_ema200": True, "cross_signal": "Golden Cross"},
                "volume": {"current": 1000000, "avg_20d": 1000000, "ratio": 1.0},
                "overall_score": 50,
                "overall_signal": "Neutral",
                "note": "Insufficient historical data - showing placeholder values"
            }
        
        close_prices = hist['Close']
        current_price = float(close_prices.iloc[-1])
        
        rsi_value = calculate_rsi(close_prices)
        
        result = {
            "ticker": ticker_upper,
            "current_price": round(current_price, 2),
            "timestamp": datetime.now().isoformat(),
            "rsi": {
                "value": rsi_value,
                "signal": "Oversold" if rsi_value < 30 else "Overbought" if rsi_value > 70 else "Neutral"
            },
            "macd": calculate_macd(close_prices),
            "bollinger": calculate_bollinger_bands(close_prices),
            "ema": calculate_ema(close_prices),
            "volume": {
                "current": int(hist['Volume'].iloc[-1]) if not pd.isna(hist['Volume'].iloc[-1]) else 0,
                "avg_20d": int(hist['Volume'].tail(20).mean()) if len(hist) >= 20 else 0,
                "ratio": round(float(hist['Volume'].iloc[-1] / hist['Volume'].tail(20).mean()), 2) if hist['Volume'].tail(20).mean() > 0 else 1.0
            }
        }
        
        # Overall technical score (0-100)
        scores = []
        if result["rsi"]["value"] < 30:
            scores.append(80)  # Oversold = bullish
        elif result["rsi"]["value"] > 70:
            scores.append(20)  # Overbought = bearish
        else:
            scores.append(50)
        
        if result["macd"]["trend"] == "Bullish":
            scores.append(70)
        else:
            scores.append(30)
        
        if result["ema"].get("above_ema50"):
            scores.append(60)
        else:
            scores.append(40)
        
        result["overall_score"] = round(sum(scores) / len(scores))
        result["overall_signal"] = "Bullish" if result["overall_score"] >= 60 else "Bearish" if result["overall_score"] <= 40 else "Neutral"
        
        analytics_cache[cache_key] = result
        return result
        
    except Exception as e:
        logger.error(f"Error calculating technical indicators for {ticker_upper}: {e}")
        # Return fallback data instead of error
        return {
            "ticker": ticker_upper,
            "current_price": 0,
            "timestamp": datetime.now().isoformat(),
            "rsi": {"value": 50, "signal": "Neutral"},
            "macd": {"macd": 0, "signal": 0, "histogram": 0, "trend": "Neutral"},
            "bollinger": {"upper": 0, "middle": 0, "lower": 0, "position": 50, "signal": "Neutral"},
            "ema": {"ema50": None, "ema200": None, "cross_signal": None},
            "volume": {"current": 0, "avg_20d": 0, "ratio": 1.0},
            "overall_score": 50,
            "overall_signal": "Neutral",
            "error": str(e)
        }


@router.get("/fundamentals/{ticker}")
async def get_fundamentals(ticker: str):
    """Get fundamental data: P/E, Dividend Yield, Market Cap"""
    ticker_upper = ticker.upper()
    yf_ticker = get_yf_ticker(ticker_upper)
    
    cache_key = f"fund_{ticker_upper}"
    if cache_key in analytics_cache:
        return analytics_cache[cache_key]
    
    try:
        stock = yf.Ticker(yf_ticker)
        info = stock.info
        
        result = {
            "ticker": ticker_upper,
            "name": info.get("longName", ticker_upper),
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "pe_ratio": round(info.get("trailingPE", 0), 2) if info.get("trailingPE") else None,
            "forward_pe": round(info.get("forwardPE", 0), 2) if info.get("forwardPE") else None,
            "dividend_yield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else 0,
            "market_cap": info.get("marketCap", 0),
            "market_cap_formatted": format_market_cap(info.get("marketCap", 0)),
            "cap_category": get_cap_category(info.get("marketCap", 0)),
            "book_value": round(info.get("bookValue", 0), 2) if info.get("bookValue") else None,
            "price_to_book": round(info.get("priceToBook", 0), 2) if info.get("priceToBook") else None,
            "eps": round(info.get("trailingEps", 0), 2) if info.get("trailingEps") else None,
            "roe": round(info.get("returnOnEquity", 0) * 100, 2) if info.get("returnOnEquity") else None,
            "debt_to_equity": round(info.get("debtToEquity", 0), 2) if info.get("debtToEquity") else None,
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
            "timestamp": datetime.now().isoformat()
        }
        
        analytics_cache[cache_key] = result
        return result
        
    except Exception as e:
        logger.error(f"Error fetching fundamentals for {ticker_upper}: {e}")
        # Return fallback data instead of error
        fallback = {
            "ticker": ticker_upper,
            "name": ticker_upper,
            "sector": "Unknown",
            "industry": "Unknown",
            "pe_ratio": None,
            "forward_pe": None,
            "dividend_yield": 0.0,
            "market_cap": 0,
            "market_cap_formatted": "N/A",
            "cap_category": "Unknown",
            "book_value": None,
            "price_to_book": None,
            "eps": None,
            "roe": None,
            "debt_to_equity": None,
            "52_week_high": None,
            "52_week_low": None,
            "timestamp": datetime.now().isoformat(),
            "source": "fallback"
        }
        return fallback


def format_market_cap(cap: int) -> str:
    """Format market cap in human-readable format (Cr)"""
    if cap >= 10000000000000:  # 1 Lakh Cr+
        return f"₹{cap/10000000000000:.2f}L Cr"
    elif cap >= 100000000000:  # 1000 Cr+
        return f"₹{cap/10000000:.0f} Cr"
    elif cap >= 10000000:  # 1 Cr+
        return f"₹{cap/10000000:.2f} Cr"
    return f"₹{cap:,}"


def get_cap_category(cap: int) -> str:
    """Categorize by market cap"""
    if cap >= 500000000000:  # 50,000 Cr+
        return "Large Cap"
    elif cap >= 100000000000:  # 10,000 Cr+
        return "Mid Cap"
    return "Small Cap"


@router.get("/sectors")
async def get_sector_performance():
    """Get sector-wise performance heatmap data using BULK download"""
    cache_key = "sectors_performance"
    if cache_key in analytics_cache:
        return analytics_cache[cache_key]
    
    # Collect all tickers for bulk fetch
    all_tickers = []
    for sector, stocks in SECTOR_STOCKS.items():
        all_tickers.extend(stocks[:3])  # Top 3 per sector
    
    # BULK FETCH - single API call for all sector stocks
    bulk_data = fetch_bulk_prices(all_tickers, timeout=5)
    
    sectors_data = []
    
    for sector, stocks in SECTOR_STOCKS.items():
        sector_changes = []
        sector_stocks_data = []
        
        for ticker in stocks[:3]:
            stock_data = bulk_data.get(ticker.upper())
            if stock_data and stock_data.get("price", 0) > 0:
                change_pct = stock_data.get("change_percent", 0)
                sector_changes.append(change_pct)
                sector_stocks_data.append({
                    "ticker": ticker,
                    "price": stock_data.get("price", 0),
                    "change_percent": round(change_pct, 2)
                })
        
        avg_change = sum(sector_changes) / len(sector_changes) if sector_changes else 0
        
        sectors_data.append({
            "sector": sector,
            "change_percent": round(avg_change, 2),
            "trend": "up" if avg_change > 0 else "down",
            "intensity": min(abs(avg_change) / 3 * 100, 100),
            "stocks": sector_stocks_data
        })
    
    # Sort by performance
    sectors_data.sort(key=lambda x: x["change_percent"], reverse=True)
    
    result = {
        "sectors": sectors_data,
        "top_performer": sectors_data[0]["sector"] if sectors_data else None,
        "worst_performer": sectors_data[-1]["sector"] if sectors_data else None,
        "timestamp": datetime.now().isoformat()
    }
    
    analytics_cache[cache_key] = result
    return result


@router.get("/alerts/{ticker}")
async def check_alerts(ticker: str):
    """Check for technical alerts on a stock"""
    ticker_upper = ticker.upper()
    
    try:
        tech_data = await get_technical_indicators(ticker_upper)
        alerts = []
        
        # RSI alerts
        rsi = tech_data["rsi"]["value"]
        if rsi < 30:
            alerts.append({
                "type": "RSI_OVERSOLD",
                "severity": "high",
                "message": f"{ticker_upper} is Oversold! RSI: {rsi}",
                "action": "Potential BUY signal"
            })
        elif rsi > 70:
            alerts.append({
                "type": "RSI_OVERBOUGHT",
                "severity": "high",
                "message": f"{ticker_upper} is Overbought! RSI: {rsi}",
                "action": "Consider taking profits"
            })
        
        # MACD alerts
        if tech_data["macd"]["histogram"] > 0 and tech_data["macd"]["macd"] > tech_data["macd"]["signal"]:
            alerts.append({
                "type": "MACD_BULLISH",
                "severity": "medium",
                "message": f"{ticker_upper} MACD turned bullish",
                "action": "Momentum is positive"
            })
        
        # Bollinger Band alerts
        bb_position = tech_data["bollinger"]["position"]
        if bb_position < 10:
            alerts.append({
                "type": "BB_LOWER",
                "severity": "medium",
                "message": f"{ticker_upper} near lower Bollinger Band",
                "action": "Potential reversal zone"
            })
        elif bb_position > 90:
            alerts.append({
                "type": "BB_UPPER",
                "severity": "medium",
                "message": f"{ticker_upper} near upper Bollinger Band",
                "action": "Extended from mean"
            })
        
        # Volume alert
        if tech_data["volume"]["ratio"] > 2:
            alerts.append({
                "type": "HIGH_VOLUME",
                "severity": "medium",
                "message": f"{ticker_upper} trading at {tech_data['volume']['ratio']}x average volume",
                "action": "Unusual activity detected"
            })
        
        return {
            "ticker": ticker_upper,
            "alerts": alerts,
            "alert_count": len(alerts),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error checking alerts for {ticker_upper}: {e}")
        return {"ticker": ticker_upper, "alerts": [], "error": str(e)}
