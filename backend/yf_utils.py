"""
YFinance Utility Module
Optimized data fetching with bulk downloads and timeouts.
"""
import yfinance as yf
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional
import logging
import concurrent.futures
from functools import lru_cache

logger = logging.getLogger(__name__)

# Default timeout for API calls (10 seconds for live data)
DEFAULT_TIMEOUT = 10

# Cache for bulk price data
_price_cache: Dict[str, dict] = {}
_cache_timestamp: Optional[datetime] = None
CACHE_TTL_SECONDS = 60  # Cache prices for 1 minute


def get_yf_ticker(ticker: str) -> str:
    """Convert ticker to yfinance NSE format."""
    ticker_upper = ticker.upper().replace(".NS", "")
    if ticker_upper == "NIFTY50":
        return "^NSEI"
    return f"{ticker_upper}.NS"


def _is_cache_valid() -> bool:
    """Check if cache is still valid."""
    global _cache_timestamp
    if _cache_timestamp is None:
        return False
    elapsed = (datetime.now() - _cache_timestamp).total_seconds()
    return elapsed < CACHE_TTL_SECONDS


def fetch_bulk_prices(tickers: List[str], timeout: int = DEFAULT_TIMEOUT) -> Dict[str, dict]:
    """
    Fetch prices for multiple tickers using individual Ticker calls.
    Returns dict mapping ticker -> price data.
    Falls back to cached/mock data if API is unavailable.
    """
    global _price_cache, _cache_timestamp
    
    # Check cache first - if cache is valid, use it entirely
    if _is_cache_valid():
        cached_results = {}
        all_cached = True
        for ticker in tickers:
            ticker_upper = ticker.upper().replace(".NS", "")
            if ticker_upper in _price_cache:
                cached_results[ticker_upper] = _price_cache[ticker_upper]
            else:
                all_cached = False
        
        if all_cached:
            return cached_results
    
    results = {}
    
    def fetch_single(ticker: str) -> Optional[dict]:
        """Fetch a single ticker's data."""
        ticker_upper = ticker.upper().replace(".NS", "")
        yf_ticker = get_yf_ticker(ticker)
        
        try:
            t = yf.Ticker(yf_ticker)
            hist = t.history(period="5d")
            
            if hist.empty or len(hist) < 1:
                return None
            
            close_prices = hist['Close'].dropna()
            if len(close_prices) == 0:
                return None
            
            current_price = float(close_prices.iloc[-1])
            previous_close = float(close_prices.iloc[-2]) if len(close_prices) > 1 else current_price
            
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close else 0
            
            return {
                "ticker": ticker_upper,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "previous_close": round(previous_close, 2),
                "timestamp": datetime.now().isoformat(),
                "source": "live"
            }
        except Exception as e:
            logger.warning(f"Error fetching {ticker}: {e}")
            return None
    
    # Fetch all tickers with thread pool for speed
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_ticker = {executor.submit(fetch_single, t): t for t in tickers}
        
        try:
            for future in concurrent.futures.as_completed(future_to_ticker, timeout=timeout):
                ticker = future_to_ticker[future]
                ticker_upper = ticker.upper().replace(".NS", "")
                try:
                    result = future.result()
                    if result:
                        results[ticker_upper] = result
                        _price_cache[ticker_upper] = result
                except Exception as e:
                    logger.warning(f"Future error for {ticker}: {e}")
        except concurrent.futures.TimeoutError:
            logger.warning("Ticker fetch timed out, using partial results")
    
    if results:
        _cache_timestamp = datetime.now()
    
    # Merge with fallback for any missing tickers
    fallback = _get_fallback_prices([t for t in tickers if t.upper().replace(".NS", "") not in results])
    return {**fallback, **results}


def fetch_single_price(ticker: str, timeout: int = DEFAULT_TIMEOUT) -> Optional[dict]:
    """
    Fetch price for a single ticker with timeout.
    Uses the bulk function for consistency.
    """
    results = fetch_bulk_prices([ticker], timeout=timeout)
    ticker_upper = ticker.upper().replace(".NS", "")
    return results.get(ticker_upper)


def fetch_history_with_timeout(ticker: str, period: str = "3mo", timeout: int = DEFAULT_TIMEOUT) -> Optional[pd.DataFrame]:
    """
    Fetch historical data with timeout.
    """
    yf_ticker = get_yf_ticker(ticker)
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                yf.download,
                tickers=yf_ticker,
                period=period,
                progress=False
            )
            
            try:
                data = future.result(timeout=timeout)
                if not data.empty:
                    return data
            except concurrent.futures.TimeoutError:
                logger.warning(f"History download timed out for {ticker}")
                return None
                
    except Exception as e:
        logger.error(f"History fetch failed for {ticker}: {e}")
        return None
    
    return None


def _get_fallback_prices(tickers: List[str]) -> Dict[str, dict]:
    """
    Return fallback/mock prices when API fails.
    """
    fallback_prices = {
        "RELIANCE": 1450.0, "TCS": 3800.0, "HDFCBANK": 1650.0, "INFY": 1550.0,
        "ICICIBANK": 1100.0, "HINDUNILVR": 2400.0, "SBIN": 780.0, "BHARTIARTL": 1650.0,
        "ITC": 470.0, "KOTAKBANK": 1750.0, "WIPRO": 480.0, "TATAMOTORS": 980.0,
        "MARUTI": 12500.0, "SUNPHARMA": 1850.0, "LT": 3600.0, "BEL": 320.0,
        "COALINDIA": 480.0, "NIFTY50": 22500.0, "AXISBANK": 1150.0,
    }
    
    results = {}
    for ticker in tickers:
        ticker_upper = ticker.upper().replace(".NS", "")
        if ticker_upper in _price_cache:
            results[ticker_upper] = _price_cache[ticker_upper]
        elif ticker_upper in fallback_prices:
            results[ticker_upper] = {
                "ticker": ticker_upper,
                "price": fallback_prices[ticker_upper],
                "change": 0,
                "change_percent": 0,
                "previous_close": fallback_prices[ticker_upper],
                "timestamp": datetime.now().isoformat(),
                "source": "fallback"
            }
    
    return results


def clear_price_cache():
    """Clear the price cache."""
    global _price_cache, _cache_timestamp
    _price_cache = {}
    _cache_timestamp = None
