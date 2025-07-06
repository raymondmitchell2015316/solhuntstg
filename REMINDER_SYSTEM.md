# Automatic Reminder System

## Overview
The bot now includes an automatic reminder system that sends notifications to all active users every 30 minutes to encourage wallet analysis and airdrop discovery.

## Features

### Database Integration
- PostgreSQL database stores user information
- Tracks user activity and engagement metrics
- Monitors wallet analysis and airdrop claim counts
- Automatically deactivates users who block the bot

### Reminder Service
- Sends notifications every 30 minutes using cron scheduler
- 4 different engaging reminder messages to avoid repetition
- Users can opt-out by clicking "Stop Reminders" button
- Rate limiting to prevent Telegram API restrictions

### User Tracking
- Automatically registers users when they interact with the bot
- Updates last interaction timestamp on each activity
- Tracks wallet analysis count per user
- Tracks airdrop claim attempts per user

## Reminder Messages

### Message Variants
1. "💎 Hidden Airdrops Waiting!" - Focus on unclaimed rewards
2. "🚀 New Airdrop Opportunities!" - Emphasizes time-sensitive nature
3. "⚡ Quick Wallet Scan Available" - Highlights speed and results
4. "🎁 Free Money Alert!" - Direct appeal to potential rewards

### Message Structure
Each reminder includes:
- Engaging title and description
- Call-to-action button
- "Stop Reminders" option for user control

## Environment Variables

Required for reminder system:
```
DATABASE_URL=postgresql://username:password@host:port/database
BOT_TOKEN=your_telegram_bot_token
ADMIN_USERNAME=your_telegram_username
```

Optional for notifications:
```
NOTIFICATION_BOT_TOKEN=separate_bot_token_for_admin_alerts
NOTIFICATION_CHAT_ID=your_chat_id_for_admin_notifications
```

## Database Schema

### bot_users table
```sql
CREATE TABLE bot_users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet_count INTEGER DEFAULT 0,
    airdrop_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Admin Controls

### Stop Reminders
Users can disable reminders by:
1. Clicking "Stop Reminders" button in any reminder message
2. System automatically deactivates users who block the bot
3. Users remain in database but won't receive future reminders

### User Statistics
Admin can track:
- Total registered users
- Active users (interacted within 7 days)
- Total wallet analyses performed
- Total airdrop claims attempted

## Technical Implementation

### Services
- `UserService`: Database operations for user management
- `ReminderService`: Cron scheduling and message delivery
- `NotificationService`: Admin alerts for user activities

### Scheduling
- Uses node-cron for reliable scheduling
- Starts 5 seconds after bot initialization
- Automatically handles failures and rate limiting
- Includes 100ms delay between messages to prevent API limits

### Error Handling
- Graceful handling of blocked users
- Automatic deactivation of inactive accounts
- Comprehensive logging for monitoring
- Fallback mechanisms for service failures

## Deployment Notes

### Render Deployment
- Database provisioned automatically
- Environment variables configured in dashboard
- Health check endpoint ensures service reliability
- Automatic restarts on failure

### Performance
- Efficient database queries with indexing
- Minimal memory footprint
- Asynchronous operations to prevent blocking
- Built-in rate limiting for Telegram API compliance

## Monitoring

### Logs
- Database initialization status
- Reminder service start/stop events
- Message delivery success/failure counts
- User interaction tracking

### Metrics
- Active user count
- Message delivery rates
- Database query performance
- Service uptime statistics