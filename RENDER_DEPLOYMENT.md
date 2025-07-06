# Render Deployment Guide

## Step 1: Create PostgreSQL Database

1. Go to Render dashboard
2. Click "New" → "PostgreSQL"
3. Choose a name for your database
4. Select free tier or paid plan
5. Click "Create Database"
6. Copy the "External Database URL" from the database dashboard

## Step 2: Deploy the Bot

1. Upload your code to GitHub repository
2. In Render dashboard, click "New" → "Web Service"
3. Connect your GitHub repository
4. Set these configuration options:

### Build Settings
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Environment Variables
Add these in the Environment section:

```
BOT_TOKEN=7850472896:AAGzLJNz1p9sGNNTMt8dJhaDzW0fVYrCRvA
ADMIN_USERNAME=your_telegram_username
DATABASE_URL=postgresql://user:pass@host:port/db_name
NODE_ENV=production
```

### Optional Variables
```
NOTIFICATION_BOT_TOKEN=your_notification_bot_token
NOTIFICATION_CHAT_ID=your_chat_id
BOT_NAME=Airdrop Hunter Bot
CLAIM_URL=https://your-claim-url.com
```

## Step 3: Get Database URL

From your PostgreSQL service in Render:
1. Go to your database service
2. Click on "Connect" tab
3. Copy the "External Database URL"
4. Paste it as DATABASE_URL in your web service environment variables

Example format:
```
postgresql://username:password@host:port/database_name
```

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically deploy your bot
3. Check logs for successful startup messages:
   - "Bot launched in production mode"
   - "Database initialized"
   - "Reminder service started"

## Features Included

### Automatic Reminders
- Sends notifications to all users every 30 minutes
- 4 different engaging message variants
- Users can opt-out with "Stop Reminders" button

### Database Features
- User registration and tracking
- Wallet analysis count tracking
- Airdrop claim attempt logging
- Activity monitoring

### Admin Features
- Direct contact through help buttons
- Complete notification system for user activities
- User statistics and engagement metrics

## Monitoring

### Health Check
- Available at: `https://your-app.onrender.com/health`
- Returns bot status and timestamp

### Logs
Check Render logs for:
- Database connection status
- Reminder service activity
- User interaction tracking
- Error messages

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correctly formatted
- Check database service is running
- Ensure IP restrictions allow Render connections

### Bot Not Responding
- Verify BOT_TOKEN is correct
- Check Telegram webhook settings
- Review application logs in Render dashboard

### Reminder System
- Check cron service is running in logs
- Verify user database has active users
- Monitor for rate limiting messages

## Security Notes

- Never commit environment variables to Git
- Use Render's environment variable system
- Keep bot token secure and private
- Monitor for unauthorized access attempts