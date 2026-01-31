"""
In-memory TTL cache for market data optimization.
Caches market-wide data with optimized TTLs.
"""
from cachetools import TTLCache
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Global cache instances
price_cache = TTLCache(maxsize=200, ttl=5)  # Stock prices - 5s TTL for real-time feel
analytics_cache = TTLCache(maxsize=100, ttl=120)  # Technical indicators - 120s TTL
news_cache = TTLCache(maxsize=50, ttl=300)  # News data - 5 min TTL


def cached(cache_instance, key_func=None):
    """Decorator to cache function results with TTL"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = str(args) + str(sorted(kwargs.items()))
            
            # Try to get from cache
            if cache_key in cache_instance:
                logger.debug(f"Cache hit for {cache_key}")
                return cache_instance[cache_key]
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            if result is not None:
                cache_instance[cache_key] = result
                logger.debug(f"Cached result for {cache_key}")
            
            return result
        return wrapper
    return decorator


def clear_cache(cache_name: str = "all"):
    """Clear specified cache or all caches"""
    if cache_name == "all":
        price_cache.clear()
        analytics_cache.clear()
        news_cache.clear()
    elif cache_name == "price":
        price_cache.clear()
    elif cache_name == "analytics":
        analytics_cache.clear()
    elif cache_name == "news":
        news_cache.clear()


def get_cache_stats():
    """Get cache statistics"""
    return {
        "price_cache": {
            "size": len(price_cache),
            "maxsize": price_cache.maxsize,
            "ttl": price_cache.ttl
        },
        "analytics_cache": {
            "size": len(analytics_cache),
            "maxsize": analytics_cache.maxsize,
            "ttl": analytics_cache.ttl
        },
        "news_cache": {
            "size": len(news_cache),
            "maxsize": news_cache.maxsize,
            "ttl": news_cache.ttl
        }
    }
