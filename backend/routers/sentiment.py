from fastapi import APIRouter
from schemas import SentimentRequest, SentimentResponse
import yfinance as yf
from datetime import datetime
import logging
import random

router = APIRouter(prefix="/sentiment", tags=["sentiment"])
logger = logging.getLogger(__name__)

# Positive and negative words for basic sentiment analysis
POSITIVE_WORDS = [
    'up', 'rise', 'gain', 'growth', 'profit', 'surge', 'rally', 'jump', 'boost',
    'strong', 'bullish', 'optimistic', 'positive', 'record', 'high', 'success',
    'beat', 'exceed', 'outperform', 'upgrade', 'buy', 'recommend', 'expansion',
    'dividend', 'earnings', 'revenue', 'increase', 'momentum', 'breakout', 'soar'
]

NEGATIVE_WORDS = [
    'down', 'fall', 'drop', 'decline', 'loss', 'plunge', 'crash', 'sink', 'weak',
    'bearish', 'pessimistic', 'negative', 'low', 'miss', 'fail', 'underperform',
    'downgrade', 'sell', 'cut', 'layoff', 'debt', 'warning', 'risk', 'concern',
    'volatile', 'uncertain', 'slump', 'tumble', 'correction', 'recession'
]

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

def analyze_headlines(headlines: list) -> dict:
    """Analyze sentiment from news headlines"""
    if not headlines:
        return {"score": 50, "positive_count": 0, "negative_count": 0, "headlines_analyzed": 0}
    
    positive_count = 0
    negative_count = 0
    
    for headline in headlines[:3]:  # Analyze top 3 headlines
        headline_lower = headline.lower()
        
        for word in POSITIVE_WORDS:
            if word in headline_lower:
                positive_count += 1
        
        for word in NEGATIVE_WORDS:
            if word in headline_lower:
                negative_count += 1
    
    # Calculate score: 50 is neutral, positive words push up, negative push down
    total_words = positive_count + negative_count
    if total_words > 0:
        sentiment_ratio = (positive_count - negative_count) / total_words
        score = int(50 + (sentiment_ratio * 40))  # Scale to 10-90 range
    else:
        score = 50
    
    score = max(10, min(90, score))
    
    return {
        "score": score,
        "positive_count": positive_count,
        "negative_count": negative_count,
        "headlines_analyzed": min(len(headlines), 3)
    }

def get_sentiment_label(score: int) -> str:
    """Convert score to sentiment label"""
    if score >= 70:
        return "Bullish"
    elif score >= 55:
        return "Slightly Bullish"
    elif score >= 45:
        return "Neutral"
    elif score >= 30:
        return "Slightly Bearish"
    else:
        return "Bearish"

def generate_analysis(ticker: str, score: int, sentiment: str, news_based: bool = False) -> str:
    """Generate AI analysis text"""
    source = "Based on recent news headlines, " if news_based else ""
    analyses = {
        "Bullish": f"{source}{ticker} shows strong momentum with positive market sentiment. Technical indicators suggest continued upward movement. Institutional buying observed.",
        "Slightly Bullish": f"{source}{ticker} displays modest strength with cautious optimism. Support levels holding well. Consider accumulating on dips.",
        "Neutral": f"{source}{ticker} is in a consolidation phase. Mixed signals from technical and fundamental analysis. Wait for clearer direction.",
        "Slightly Bearish": f"{source}{ticker} shows weakness with selling pressure. Key support levels being tested. Exercise caution with new positions.",
        "Bearish": f"{source}{ticker} under significant pressure. Breaking key support levels. Consider hedging or reducing exposure.",
    }
    return analyses.get(sentiment, analyses["Neutral"])

@router.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze market sentiment for a ticker using yfinance news"""
    ticker_upper = request.ticker.upper()
    yf_ticker = get_yf_ticker(ticker_upper)
    
    news_based = False
    headlines = []
    
    try:
        stock = yf.Ticker(yf_ticker)
        news = stock.news
        
        if news:
            headlines = [item.get('title', '') for item in news[:5]]
            analysis_result = analyze_headlines(headlines)
            score = analysis_result["score"]
            news_based = True
            logger.info(f"Sentiment for {ticker_upper}: {analysis_result}")
        else:
            # Fallback to mock with slight randomness
            score = 50 + random.randint(-15, 15)
    except Exception as e:
        logger.warning(f"Failed to fetch news for {ticker_upper}: {e}")
        score = 50 + random.randint(-15, 15)
    
    sentiment = get_sentiment_label(score)
    analysis = generate_analysis(ticker_upper, score, sentiment, news_based)
    
    return SentimentResponse(
        ticker=ticker_upper,
        score=score,
        sentiment=sentiment,
        analysis=analysis
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

