from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class UserLogin(BaseModel):
    email: str
    password: str

# Portfolio Schemas
class PortfolioBase(BaseModel):
    ticker: str
    quantity: float
    buy_price: float
    source_app: Optional[str] = "Manual"

class PortfolioCreate(PortfolioBase):
    pass

class PortfolioUpdate(BaseModel):
    ticker: Optional[str] = None
    quantity: Optional[float] = None
    buy_price: Optional[float] = None
    source_app: Optional[str] = None

class Portfolio(PortfolioBase):
    id: int
    user_id: int
    bought_at: datetime
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    gain_loss: Optional[float] = None
    gain_loss_percent: Optional[float] = None
    
    class Config:
        from_attributes = True

# Watchlist Schemas
class WatchlistBase(BaseModel):
    ticker: str

class WatchlistCreate(WatchlistBase):
    pass

class Watchlist(WatchlistBase):
    id: int
    user_id: int
    added_at: datetime
    
    class Config:
        from_attributes = True

# Stock Schemas
class StockPrice(BaseModel):
    ticker: str
    price: float
    change: float
    change_percent: float
    high: float
    low: float
    open: float
    previous_close: float
    volume: int

class StockHistoryPoint(BaseModel):
    date: str
    price: float

class StockHistory(BaseModel):
    ticker: str
    data: list[StockHistoryPoint]

# Sentiment Schemas
class SentimentRequest(BaseModel):
    ticker: str

class SentimentResponse(BaseModel):
    ticker: str
    score: int  # 0-100
    sentiment: str  # "Bullish", "Bearish", "Neutral"
    analysis: str
