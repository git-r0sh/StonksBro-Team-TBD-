from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    portfolios = relationship("Portfolio", back_populates="owner", cascade="all, delete-orphan")
    watchlists = relationship("Watchlist", back_populates="owner", cascade="all, delete-orphan")

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticker = Column(String, index=True)
    quantity = Column(Float)
    buy_price = Column(Float)
    source_app = Column(String, default="Manual")  # Zerodha, Groww, Upstox, Angel One, etc.
    bought_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="portfolios")

class Watchlist(Base):
    __tablename__ = "watchlists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticker = Column(String, index=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="watchlists")
