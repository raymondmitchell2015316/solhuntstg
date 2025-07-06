# Enhanced Reminder System - Update Documentation

## What's New

This update transforms the basic reminder system into a personalized engagement system that saves wallet analysis results and sends targeted reminders about specific unclaimed airdrop amounts.

## Key Features Added

### 1. Database Storage of Wallet Analysis
- All wallet analysis results are now saved to PostgreSQL database
- Stores wallet address, airdrop amount, project name, and claim URL
- Tracks claim status to prevent duplicate reminders
- Maintains user interaction history for targeting

### 2. Environment Variable Claim URL Integration
- Uses `CLAIM_URL` from environment variables (defaults to `https://claim.hunter.xyz`)
- Automatically appends claim ID and wallet address parameters
- Generated URLs: `${CLAIM_URL}?id=AH123ABC&wallet=0x123...`
- Customizable by setting `CLAIM_URL=https://your-domain.com` in `.env`

### 3. Personalized Reminder Messages
Instead of generic messages, users now receive:
```
💰 $2,850 Still Unclaimed!

Your Arbitrum Protocol airdrop worth $2,850 is ready to claim! 
Don't let this opportunity expire - many users have already claimed theirs.

Your rewards are waiting!

[🚀 Claim Now] [🔕 Stop Reminders]
```

### 4. Direct Claim URL Buttons
- Claim buttons now link directly to the actual claim page
- No intermediate steps or bot navigation required
- Users click and immediately access their claim portal
- URLs include unique claim ID and wallet address for verification

### 5. Smart Reminder Targeting
- **Targeted Reminders**: For users with unclaimed airdrops (references specific amounts)
- **General Reminders**: For users without recent analysis (discovery focused)
- **Rotation System**: 4 different message templates to prevent fatigue

## Database Schema Changes

New columns added to `bot_users` table:
```sql
ALTER TABLE bot_users 
ADD COLUMN last_wallet_address VARCHAR(255),
ADD COLUMN pending_airdrop_amount INTEGER DEFAULT 0,
ADD COLUMN pending_airdrop_projects TEXT,
ADD COLUMN pending_airdrop_claim_url TEXT,
ADD COLUMN last_analysis_date TIMESTAMP,
ADD COLUMN has_unclaimed_airdrops BOOLEAN DEFAULT false;
```

## Files Updated

### services/userService.js
- `saveWalletAnalysis()`: Saves complete airdrop data including claim URLs
- `getUsersWithUnclaimedAirdrops()`: Retrieves users with pending rewards
- `getActiveUsersWithoutRecentAnalysis()`: Gets users needing wallet analysis
- `markAirdropsClaimed()`: Updates claim status when users claim rewards

### services/reminderService.js
- Enhanced with 4 personalized reminder templates
- Smart button system using direct URLs vs callbacks
- Separate message generation for targeted vs general reminders
- Template variables for amount and project name substitution

### handlers/messageHandlers.js
- Integrated wallet analysis saving with airdrop data
- Saves claim URLs for future reminder targeting

### bot.js
- Updated claim callback to mark airdrops as claimed
- Enhanced claim flow for users coming from reminders

## Message Templates

### Personalized Templates (for unclaimed airdrops):
1. "💰 ${amount} Still Unclaimed!" - Direct urgency
2. "⏰ Claim Deadline Approaching!" - Time pressure  
3. "🔥 ${amount} Ready for Withdrawal!" - Social proof
4. "🎯 Final Reminder: ${amount} Waiting" - Last chance

### General Templates (for discovery):
1. "💎 Hidden Airdrops Waiting!" - Discovery focused
2. "🚀 New Airdrop Opportunities!" - FOMO driven
3. "⚡ Quick Wallet Scan Available" - Speed emphasis
4. "🎁 Free Money Alert!" - Immediate value

## User Flow

1. **Wallet Analysis**: User analyzes wallet → Results saved with airdrop data
2. **Claim URL Generation**: Uses `CLAIM_URL` environment variable + unique parameters
3. **Reminder Targeting**: Bot identifies users with unclaimed rewards
4. **Personalized Message**: Sends specific amount and project name
5. **Direct Access**: Claim button opens `${CLAIM_URL}?id=CLAIM_ID&wallet=ADDRESS`
6. **Claim Tracking**: Status updated when user claims rewards

## Testing

Run the test files to verify functionality:
```bash
node test_reminder_system.js     # Test full system
node test_claim_url_buttons.js   # Test direct URL buttons
```

## Deployment

The enhanced system is backward compatible. Existing users without saved airdrop data will receive general reminders until they analyze wallets again.

## Impact

This update significantly improves user engagement by:
- Making reminders personally relevant with specific dollar amounts
- Reducing friction with direct claim access
- Preventing reminder fatigue through smart targeting
- Increasing conversion rates from reminder to claim action