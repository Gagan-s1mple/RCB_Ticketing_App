import os
from datetime import datetime
from typing import Optional
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RCB Ticket Monitor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_URL = "https://rcbscaleapi.ticketgenie.in/ticket/eventlist/O"
POLL_INTERVAL = 5

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://ticketgenie.in/",
}

current_status: Optional[str] = None
last_check: Optional[datetime] = None
telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
telegram_chat_ids = os.getenv("TELEGRAM_CHAT_IDS", "").split(",") if os.getenv("TELEGRAM_CHAT_IDS") else [os.getenv("TELEGRAM_CHAT_ID")]


class EventStatus(BaseModel):
    event_Code: int
    event_Name: str
    event_Button_Text: str
    event_Display_Date: str
    event_Date: str
    team_1: str
    team_2: str
    venue_Name: str
    city_Name: str
    event_Price_Range: str
    last_updated: datetime


class ApiResponse(BaseModel):
    status: str
    current_status: Optional[str]
    last_check: Optional[datetime]
    events: list[EventStatus]


async def fetch_events():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(API_URL, headers=HEADERS, timeout=10.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching events: {e}")
            return None


async def send_telegram_message(message: str):
    if not telegram_bot_token or not telegram_chat_ids:
        logger.warning("Telegram credentials not configured")
        return
    
    url = f"https://api.telegram.org/bot{telegram_bot_token}/sendMessage"
    async with httpx.AsyncClient() as client:
        for chat_id in telegram_chat_ids:
            chat_id = chat_id.strip()
            try:
                await client.post(url, json={"chat_id": chat_id, "text": message})
                logger.info(f"Telegram alert sent to {chat_id}")
            except Exception as e:
                logger.error(f"Error sending telegram message to {chat_id}: {e}")


async def poll_loop():
    global current_status, last_check
    
    while True:
        data = await fetch_events()
        
        if data and data.get("result"):
            result = data["result"]
            last_check = datetime.now()
            
            for event in result:
                new_status = event.get("event_Button_Text")
                
                if current_status is None:
                    current_status = new_status
                    logger.info(f"Initial status: {current_status}")
                elif new_status != current_status:
                    logger.info(f"Status changed: {current_status} -> {new_status}")
                    
                    if new_status in ["BOOK NOW", "BUY"]:
                        message = f"🚨 RCB TICKETS ARE LIVE!\n\n{event.get('event_Name')}\n{event.get('event_Display_Date')}\n{event.get('venue_Name')}\nPrice: {event.get('event_Price_Range')}\n\nQUICK RUN TO BOOK!"
                        await send_telegram_message(message)
                    
                    current_status = new_status
        
        await asyncio.sleep(POLL_INTERVAL)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(poll_loop())
    await send_telegram_message("Hey this is RCB ticket alerting app made by Gagan. Just for testing.")


@app.get("/status", response_model=ApiResponse)
async def get_status():
    data = await fetch_events()
    
    if not data or not data.get("result"):
        raise HTTPException(status_code=500, detail="Failed to fetch events")
    
    events = []
    for event in data["result"]:
        events.append(EventStatus(
            event_Code=event.get("event_Code"),
            event_Name=event.get("event_Name"),
            event_Button_Text=event.get("event_Button_Text"),
            event_Display_Date=event.get("event_Date"),
            event_Date=event.get("event_Date"),
            team_1=event.get("team_1"),
            team_2=event.get("team_2"),
            venue_Name=event.get("venue_Name"),
            city_Name=event.get("city_Name"),
            event_Price_Range=event.get("event_Price_Range"),
            last_updated=last_check or datetime.now()
        ))
    
    return ApiResponse(
        status="ok",
        current_status=current_status,
        last_check=last_check,
        events=events
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "last_check": last_check}
