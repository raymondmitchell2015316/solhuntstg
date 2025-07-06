# Latest Features Update

## New Admin Features Added

### 1. Admin Contact System
- Users can click "Contact Support" to get admin contact information
- Direct link to message admin via configured username
- Configurable admin username via ADMIN_USERNAME environment variable

### 2. Admin Notification System
- Real-time notifications sent to admin for every wallet analysis
- Notifications sent when users attempt to claim airdrops
- Includes detailed user information:
  - User ID, username, first name
  - Wallet address analyzed
  - Analysis results summary
  - Airdrop claim details

### 3. Environment Variables Added
```
ADMIN_USERNAME=your_admin_username
NOTIFICATION_BOT_TOKEN=your_notification_bot_token
NOTIFICATION_CHAT_ID=your_notification_chat_id
```

### 4. New Service Added
- `services/notificationService.js` - Handles all admin notifications
- Markdown formatted messages
- Error handling for failed notifications

### 5. Updated Files
- `bot.js` - Added claim tracking and admin contact handlers
- `config/config.js` - Added admin and notification configuration  
- `handlers/messageHandlers.js` - Integrated notification service
- `keyboards/inlineKeyboards.js` - Updated support button
- `.env.example` - Added new environment variables

## How It Works

1. **Wallet Analysis**: When a user analyzes a wallet, admin receives notification with:
   - User details
   - Wallet address
   - Analysis summary (balance, networks, transactions)

2. **Claim Attempts**: When a user clicks claim, admin receives notification with:
   - User details
   - Wallet address
   - Airdrop details (project, amount, token)

3. **Support Requests**: Users can click "Contact Support" to get admin contact info and direct message link

## Setup Instructions

1. Set ADMIN_USERNAME to your Telegram username (without @)
2. Optional: Create separate notification bot and set NOTIFICATION_BOT_TOKEN
3. Optional: Set NOTIFICATION_CHAT_ID to receive admin alerts
4. Deploy with updated environment variables

All features are backward compatible - bot works without notification setup.