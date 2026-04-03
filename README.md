# RCB Ticket Monitor

Real-time monitoring tool for RCB ticket availability with Telegram alerts.

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your Telegram bot token and chat IDs to .env
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHAT_IDS` - Comma-separated list of chat IDs

## Features

- Polls RCB ticket API every 5 seconds
- Sends Telegram alert when tickets go live
- Web dashboard showing real-time status
