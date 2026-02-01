from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import stocks, sentiment, portfolio, analytics, auth
from cache import get_cache_stats, clear_cache
import models  # Import models to ensure they're registered with Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StonksBro Pro API",
    description="Professional-grade Fintech Platform API with JWT Authentication and Advanced Analytics",
    version="3.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.2.28.141:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(stocks.router)
app.include_router(sentiment.router)
app.include_router(portfolio.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to StonksBro Pro API",
        "version": "3.0.0",
        "docs": "/docs",
        "features": [
            "JWT Authentication",
            "Investment Management",
            "Technical Analysis",
            "Fundamentals",
            "Sector Heatmap",
            "Portfolio Analytics",
            "CSV Export"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "cache": get_cache_stats()}

@app.post("/cache/clear")
async def clear_all_cache():
    clear_cache("all")
    return {"message": "All caches cleared"}
