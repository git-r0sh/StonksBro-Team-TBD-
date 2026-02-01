from fastapi import APIRouter
from pydantic import BaseModel
import logging
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
model = None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')
else:
    logger.warning("GEMINI_API_KEY not found. Chat will use mock fallback.")

class ChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/message")
async def chat_message(request: ChatRequest):
    """Get response from Gemini for user chat"""
    if not model:
        return {"response": "I am currently offline (Mode: Mock). Please configure GEMINI_API_KEY."}
        
    try:
        # Construct chat session
        chat = model.start_chat(history=[])
        
        # System instruction hack (since 1.5-flash might need context in prompt)
        context = """You are StonksBro AI, a professional trading assistant. 
        Answer questions about Indian Stock Market (NSE/BSE), trading strategies, and technical analysis. 
        Be concise, professional, and use emojis where appropriate.
        Do not give financial advice (buy/sell recommendations).
        """
        
        response = chat.send_message(f"{context}\n\nUser: {request.message}")
        return {"response": response.text}
        
    except Exception as e:
        logger.error(f"Gemini Chat Error: {e}")
        return {"response": "I'm having trouble connecting to the market brain right now. Please try again later."}
