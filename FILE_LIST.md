# Complete File Structure for GitHub Upload

## Repository: https://github.com/raymondmitchell2015316/dhunt

### Root Files
```
bot.js                 - Main bot application
.env.example          - Environment variables template
.gitignore           - Git ignore rules
README.md            - Project documentation
DEPLOYMENT.md        - Render deployment guide
render.yaml          - Render configuration
Procfile             - Process file for deployment
package.json         - Node.js dependencies (auto-generated)
```

### Directory Structure
```
config/
└── config.js        - Bot configuration and network settings

handlers/
└── messageHandlers.js - Message processing and wallet analysis

services/
└── infuraService.js  - Blockchain data service (8 networks)

utils/
├── walletValidator.js - Address validation and ENS support
└── airdropGenerator.js - Airdrop generation logic

keyboards/
└── inlineKeyboards.js - Telegram keyboard layouts
```

### Key Features in Codebase
- **8 Blockchain Networks**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Base, Linea
- **Real Blockchain Data**: Via Infura API integration
- **ENS Domain Support**: Resolves .eth domains to addresses
- **Environment Variables**: Fully configurable via .env
- **Production Ready**: Health checks, error handling, caching
- **Interactive UI**: Telegram inline keyboards and buttons

### Upload Method Options

#### Option 1: Git Commands
```bash
git clone https://github.com/raymondmitchell2015316/dhunt.git
cd dhunt
# Copy all files maintaining directory structure
git add .
git commit -m "Add multi-chain Telegram airdrop bot"
git push origin main
```

#### Option 2: GitHub Web Interface
1. Visit: https://github.com/raymondmitchell2015316/dhunt
2. Click "uploading an existing file"
3. Create folders: config/, handlers/, services/, utils/, keyboards/
4. Upload files to respective directories

#### Option 3: GitHub Desktop
1. Clone repository in GitHub Desktop
2. Copy files maintaining folder structure
3. Commit and push changes

### Environment Variables for Render
After upload, set these in Render dashboard:
- BOT_TOKEN (required)
- INFURA_PROJECT_ID (required)
- BOT_NAME (optional)
- BOT_USERNAME (optional)
- CLAIM_URL (optional)

### Deployment URL
Once deployed on Render, your bot will have:
- Health check endpoint at /health
- Multi-chain wallet analysis
- Real-time blockchain data
- Airdrop generation ($5,000-$20,000 range)