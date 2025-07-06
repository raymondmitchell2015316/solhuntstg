# Quick Deployment Guide

## Essential Environment Variables Only

To run the bot, you only need these 2 variables:

```
BOT_TOKEN=7850472896:AAGzLJNz1p9sGNNTMt8dJhaDzW0fVYrCRvA
ADMIN_USERNAME=your_telegram_username
```

## Deploy to Render

1. Upload code to GitHub
2. Connect repository to Render
3. Add the 2 environment variables above
4. Deploy

## Optional Features

Add these for additional functionality:
- `NOTIFICATION_BOT_TOKEN` - Admin notifications
- `NOTIFICATION_CHAT_ID` - Your chat ID for alerts
- `BOT_NAME` - Custom bot name
- `CLAIM_URL` - Custom claim URL

The bot works with free public RPC endpoints - no API keys required.