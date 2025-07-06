# Telegram Airdrop Hunter Bot

A comprehensive Telegram bot that analyzes cryptocurrency wallets across multiple blockchain networks and discovers unclaimed airdrop opportunities.

## Features

- **Multi-Network Analysis**: Scans Ethereum, Polygon, BSC, Arbitrum, and Optimism
- **Airdrop Detection**: Identifies eligible airdrops based on wallet activity and balances
- **Device-Specific Claims**: Optimized claiming flows for mobile and desktop devices
- **Automated Reminders**: Personalized notifications for unclaimed rewards
- **Admin Notifications**: Real-time alerts for wallet analysis and claim attempts
- **Database Integration**: PostgreSQL storage for user data and analytics

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `BOT_TOKEN`: Your Telegram bot token from @BotFather
- `DATABASE_URL`: PostgreSQL connection string
- `INFURA_PROJECT_ID`: Infura API key for blockchain access
- `CLAIM_URL`: Mobile claim interface URL
- `WIN_MAC_URL`: Desktop claim interface URL

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Bot

```bash
npm start
```

## Deployment

### Render Platform

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Web Service with build command: `npm install`
4. Start command: `npm start`

### Replit

1. Import project to Replit
2. Configure Secrets with environment variables
3. Run the bot using the Run button

## Architecture

### Core Services

- **InfuraService**: Blockchain network interactions and wallet analysis
- **AirdropGenerator**: Mock airdrop data generation based on wallet activity
- **DeviceDetectionService**: Platform-specific claim flows with fallback options
- **NotificationService**: Admin alerts with complete analysis data
- **UserService**: PostgreSQL database operations and user management
- **ReminderService**: Automated notification system with cron scheduling

### Handler Structure

- **MessageHandlers**: Process user input and coordinate wallet analysis
- **Keyboards**: Inline button configurations for user interactions
- **Config**: Centralized configuration management

## Usage

1. Start conversation with `/start`
2. Click "Analyze Wallet" button
3. Send Ethereum address or ENS domain
4. View analysis results and discovered airdrops
5. Follow device-specific claiming instructions

## Database Schema

The bot automatically creates required tables:
- `users`: User profiles and activity tracking
- Columns for reminder system: `last_wallet_address`, `pending_airdrop_amount`, etc.

## Configuration

### Network Settings

Modify `config/config.js` to add or update blockchain networks:

```javascript
NETWORKS: {
    ethereum: {
        name: 'Ethereum',
        rpcUrl: 'https://mainnet.infura.io/v3/PROJECT_ID',
        chainId: 1
    }
}
```

### Airdrop Templates

Add new project templates in `config/config.js`:

```javascript
AIRDROP_TEMPLATES: [
    {
        project: 'LayerZero',
        token: 'ZRO',
        description: 'Cross-chain interoperability protocol',
        minAmount: 2000,
        maxAmount: 15000
    }
]
```

## API Integration

### Infura Setup

1. Create account at infura.io
2. Create new project
3. Copy Project ID to `INFURA_PROJECT_ID`

### Telegram Bot Setup

1. Message @BotFather on Telegram
2. Create new bot with `/newbot`
3. Copy token to `BOT_TOKEN`

## Monitoring

The bot includes comprehensive logging:
- Database operations
- API requests and responses
- User interactions
- Error handling

## Security

- Environment variables for sensitive data
- Input validation for wallet addresses
- Rate limiting for API requests
- Error handling without data exposure

## Troubleshooting

### 409 Conflict Error
- Stop other bot instances using the same token
- Clear webhooks with the conflict resolution script

### Database Connection Issues
- Verify DATABASE_URL format
- Check PostgreSQL service status
- Ensure SSL configuration matches environment

### API Rate Limits
- Monitor Infura request quotas
- Implement caching for repeated requests
- Add delays between bulk operations