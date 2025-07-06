# Upload Instructions for GitHub

## Repository: https://github.com/raymondmitchell2015316/dhunt

### Quick Upload Steps

1. **Download this entire `dhunt_download` folder**
2. **Go to your GitHub repository**: https://github.com/raymondmitchell2015316/dhunt
3. **Upload method options:**

#### Option A: Drag & Drop Upload
- Click "uploading an existing file" on GitHub
- Drag the entire folder contents maintaining structure
- Commit with message: "Add multi-chain Telegram airdrop bot"

#### Option B: Git Commands
```bash
git clone https://github.com/raymondmitchell2015316/dhunt.git
cd dhunt
# Copy all files from dhunt_download folder here
git add .
git commit -m "Add multi-chain Telegram airdrop bot"
git push origin main
```

### What's Included
- **Complete bot source code** (8 blockchain networks)
- **Production configuration** (render.yaml, Procfile)
- **Environment template** (.env.example)
- **Documentation** (README.md, DEPLOYMENT.md)
- **Dependencies** (package.json with all required packages)

### After Upload - Deploy to Render
1. Go to render.com
2. Connect GitHub repository
3. Add environment variables:
   - BOT_TOKEN (your Telegram bot token)
   - INFURA_PROJECT_ID (your Infura project ID)
   - ADMIN_USERNAME (your admin Telegram username)
   - NOTIFICATION_BOT_TOKEN (optional - for admin alerts)
   - NOTIFICATION_CHAT_ID (optional - admin chat ID for notifications)
4. Deploy automatically

### Your Bot Features
- Analyzes wallets across 8 major blockchains
- Uses real blockchain data via Infura API
- Generates airdrop opportunities ($5,000-$20,000)
- Supports ENS domain resolution
- Interactive Telegram interface
- Admin support system with direct contact
- Real-time admin notifications for wallet analyses and claims