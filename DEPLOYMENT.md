# Deploying to Render

## Step-by-Step Deployment Guide

### 1. Prepare Your Repository
1. Create a new GitHub repository
2. Upload all your bot files to the repository:
   - `bot.js`
   - `config/config.js`
   - `handlers/messageHandlers.js`
   - `services/infuraService.js`
   - `utils/walletValidator.js`
   - `utils/airdropGenerator.js`
   - `keyboards/inlineKeyboards.js`
   - `render.yaml`
   - `Procfile`
   - `README.md`

### 2. Set Up Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### 3. Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `telegram-airdrop-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node bot.js`
   - **Plan**: Free (or paid for better performance)

### 4. Set Environment Variables
In the Render dashboard, add these environment variables:

**Required:**
- `BOT_TOKEN`: Your Telegram bot token from @BotFather
- `INFURA_PROJECT_ID`: Your Infura project ID

**Optional (Customizable):**
- `BOT_NAME`: Display name for your bot (default: "Airdrop Hunter Bot")
- `BOT_USERNAME`: Your bot's username (default: "@aidroperbot")
- `CLAIM_URL`: Where users claim airdrops (default: "https://claim.hunter.xyz")
- `MIN_AIRDROP_AMOUNT`: Minimum airdrop value (default: "5000")
- `MAX_AIRDROP_AMOUNT`: Maximum airdrop value (default: "20000")
- `NODE_ENV`: Set to "production"

### 5. Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your bot
3. The bot will start running on Render's servers

### 6. Production Notes
The bot uses polling mode which works perfectly for Telegram bots on Render:
- No webhook configuration needed
- Render automatically assigns the port
- Health check endpoint available at `/health`

## Important Notes

- The bot uses polling by default, which works fine for most use cases
- Free tier on Render may have some limitations (spins down after inactivity)
- For production use, consider upgrading to a paid plan
- Monitor logs in the Render dashboard for any issues

## Troubleshooting

### Bot Not Responding
- Check environment variables are set correctly
- Verify bot token is valid
- Check Render logs for error messages

### Network Issues
- Ensure Infura project ID is correct
- Check if RPC endpoints are accessible
- Verify all dependencies are installed

### Memory Issues
- Consider upgrading to a paid plan if you hit memory limits
- Optimize caching settings in the code

## Files Structure for Upload
```
telegram-airdrop-bot/
├── bot.js
├── config/
│   └── config.js
├── handlers/
│   └── messageHandlers.js
├── services/
│   └── infuraService.js
├── utils/
│   ├── walletValidator.js
│   └── airdropGenerator.js
├── keyboards/
│   └── inlineKeyboards.js
├── render.yaml
├── Procfile
├── README.md
└── DEPLOYMENT.md
```