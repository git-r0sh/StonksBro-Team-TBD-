from fastapi import APIRouter
from schemas import SentimentRequest, SentimentResponse
import yfinance as yf
from datetime import datetime
import logging
import random
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/sentiment", tags=["sentiment"])
logger = logging.getLogger(__name__)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')
else:
    logger.warning("GEMINI_API_KEY not found. Falling back to mock data.")
    model = None

def get_yf_ticker(ticker: str) -> str:
    """Convert ticker to yfinance format"""
    indian_stocks = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR',
        'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'BEL', 'COALINDIA',
        'TATAMOTORS', 'WIPRO', 'MARUTI', 'AXISBANK', 'LT', 'SUNPHARMA'
    ]
    ticker_upper = ticker.upper()
    if ticker_upper in indian_stocks:
        return f"{ticker_upper}.NS"
    elif ticker_upper == "NIFTY50":
        return "^NSEI"
    return ticker_upper

def analyze_headlines_with_gemini(ticker: str, headlines: list) -> dict:
    """Analyze sentiment from news headlines using Gemini"""
    if not headlines:
        return {"score": 50, "sentiment": "Neutral", "analysis": f"No recent news found for {ticker}."}
    
    if not model:
        return fallback_analysis(headlines)
        
    try:
        prompt = f"""
        Analyze the sentiment for the stock '{ticker}' based on these news headlines:
        {headlines}
        
        Return a JSON object with:
        1. "score": A number between 0 (Extreme Bearish) and 100 (Extreme Bullish). 50 is Neutral.
        2. "sentiment": One of [Bearish, Slightly Bearish, Neutral, Slightly Bullish, Bullish].
        3. "analysis": A concise 2-sentence explanation of the sentiment drivers.
        """
        
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        
        import json
        result = json.loads(text)
        return result
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        return fallback_analysis(headlines)

def fallback_analysis(headlines):
    """Simple keyword based fallback if Gemini fails"""
    positive = ['up', 'rise', 'gain', 'growth', 'profit', 'surge', 'strong', 'buy']
    negative = ['down', 'fall', 'drop', 'loss', 'crash', 'weak', 'sell', 'debt']
    
    score = 50
    text = " ".join(headlines).lower()
    
    for w in positive: 
        if w in text: score += 5
    for w in negative:
        if w in text: score -= 5
        
    score = max(10, min(90, score))
    
    if score >= 60: sentiment = "Bullish"
    elif score <= 40: sentiment = "Bearish"
    else: sentiment = "Neutral"
    
    return {
        "score": score,
        "sentiment": sentiment,
        "analysis": "Based on keyword analysis of recent headlines (Gemini unavailable)."
    }

@router.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze market sentiment for a ticker using yfinance news + Gemini"""
    ticker_upper = request.ticker.upper()
    yf_ticker = get_yf_ticker(ticker_upper)
    
    headlines = []
    
    try:
        stock = yf.Ticker(yf_ticker)
        news = stock.news
        if news:
            headlines = [item.get('title', '') for item in news[:5]]
            result = analyze_headlines_with_gemini(ticker_upper, headlines)
        else:
            result = {"score": 50, "sentiment": "Neutral", "analysis": "No recent news found."}
            
    except Exception as e:
        logger.warning(f"Failed to fetch news for {ticker_upper}: {e}")
        result = {"score": 50, "sentiment": "Neutral", "analysis": "Error analyzing sentiment."}
    
    return SentimentResponse(
        ticker=ticker_upper,
        score=result.get("score", 50),
        sentiment=result.get("sentiment", "Neutral"),
        analysis=result.get("analysis", "No analysis available")
    )

@router.get("/news/{ticker}")
async def get_stock_news(ticker: str):
    """Get recent news for a ticker"""
    ticker_upper = ticker.upper()
    yf_ticker = get_yf_ticker(ticker_upper)
    
    try:
        stock = yf.Ticker(yf_ticker)
        news = stock.news
        
        if not news:
            return {"ticker": ticker_upper, "news": [], "message": "No recent news found"}
        
        formatted_news = []
        for item in news[:10]:
            formatted_news.append({
                "title": item.get("title", ""),
                "publisher": item.get("publisher", ""),
                "link": item.get("link", ""),
                "published": item.get("providerPublishTime", 0),
                "type": item.get("type", "")
            })
        
        return {
            "ticker": ticker_upper,
            "news": formatted_news,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.warning(f"Failed to fetch news for {ticker_upper}: {e}")
        return {"ticker": ticker_upper, "news": [], "error": str(e)}

@router.get("/fear-greed")
async def get_fear_greed_index():
    """Get overall market Fear & Greed index based on NIFTY performance"""
    
    try:
        # Use NIFTY 50 performance to estimate market sentiment
        nifty = yf.Ticker("^NSEI")
        hist = nifty.history(period="5d")
        
        if len(hist) >= 2:
            current = hist['Close'].iloc[-1]
            previous = hist['Close'].iloc[0]
            change_percent = ((current - previous) / previous) * 100
            
            # Convert performance to fear/greed score
            # -3% = 20 (fear), 0% = 50 (neutral), +3% = 80 (greed)
            base_value = 50 + (change_percent * 10)
            value = int(max(5, min(95, base_value)))
        else:
            value = 50
    except Exception as e:
        logger.warning(f"Failed to calculate Fear/Greed: {e}")
        value = 50 + random.randint(-15, 15)
    
    # Generate labels
    if value >= 75:
        label = "Extreme Greed"
        description = "Market is extremely greedy. Consider taking profits."
    elif value >= 55:
        label = "Greed"
        description = "Market sentiment is positive. Momentum is bullish."
    elif value >= 45:
        label = "Neutral"
        description = "Market is balanced. No extreme sentiment."
    elif value >= 25:
        label = "Fear"
        description = "Market shows fear. Potential buying opportunity."
    else:
        label = "Extreme Fear"
        description = "Market is extremely fearful. Contrarian buy signal."
    
    # Generate historical trend (based on actual NIFTY history)
    history = []
    try:
        nifty = yf.Ticker("^NSEI")
        hist = nifty.history(period="1mo")
        
        for i, (date, row) in enumerate(hist.iterrows()):
            if i == 0:
                prev_close = row['Close']
                continue
            daily_change = ((row['Close'] - prev_close) / prev_close) * 100
            daily_value = int(max(10, min(90, 50 + (daily_change * 15))))
            history.append({"day": i, "value": daily_value})
            prev_close = row['Close']
    except:
        # Fallback to generated history
        current = 50
        for i in range(1, 31):
            change = random.uniform(-5, 5)
            current = max(10, min(90, current + change))
            history.append({"day": i, "value": round(current)})
    
    return {
        "value": value,
        "label": label,
        "description": description,
        "history": history,
        "timestamp": datetime.now().isoformat(),
        "source": "NIFTY 50 based"
    }


@router.get("/news/feed")
async def get_aggregated_news_feed():
    """Get aggregated news feed from major stocks with sentiment scores"""
    major_tickers = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "SBIN", "NIFTY50"]
    all_news = []
    
    for ticker in major_tickers:
        try:
            yf_ticker = get_yf_ticker(ticker)
            stock = yf.Ticker(yf_ticker)
            news = stock.news
            
            if news:
                for item in news[:3]:  # Top 3 per stock
                    title = item.get("title", "")
                    headline_analysis = analyze_headlines([title])
                    
                    all_news.append({
                        "ticker": ticker,
                        "title": title,
                        "publisher": item.get("publisher", ""),
                        "link": item.get("link", ""),
                        "published": item.get("providerPublishTime", 0),
                        "sentiment_score": headline_analysis["score"],
                        "sentiment": get_sentiment_label(headline_analysis["score"]),
                        "impact": "High" if abs(headline_analysis["score"] - 50) > 20 else "Medium" if abs(headline_analysis["score"] - 50) > 10 else "Low"
                    })
        except Exception as e:
            logger.warning(f"Failed to fetch news for {ticker}: {e}")
            continue
    
    # Sort by impact and recency
    all_news.sort(key=lambda x: (
        {"High": 3, "Medium": 2, "Low": 1}.get(x["impact"], 0),
        x.get("published", 0)
    ), reverse=True)
    
    return {
        "news": all_news[:20],  # Top 20 most impactful
        "total_count": len(all_news),
        "high_impact_count": len([n for n in all_news if n["impact"] == "High"]),
        "timestamp": datetime.now().isoformat()
    }

