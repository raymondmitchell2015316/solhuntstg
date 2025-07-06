# GitHub Deployment Guide

## Repository: https://github.com/raymondmitchell2015316/dhunt

### Step 1: Clone Your Repository Locally
```bash
git clone https://github.com/raymondmitchell2015316/dhunt.git
cd dhunt
```

### Step 2: Copy All Bot Files
Copy these files from your Replit workspace to your local repository:

**Main Files:**
- `bot.js`
- `.env.example` (DO NOT copy .env - it contains secrets)
- `.gitignore`
- `README.md`
- `DEPLOYMENT.md`
- `render.yaml`
- `Procfile`

**Directories:**
- `config/config.js`
- `handlers/messageHandlers.js`
- `services/infuraService.js`
- `utils/walletValidator.js`
- `utils/airdropGenerator.js`
- `keyboards/inlineKeyboards.js`

### Step 3: Git Commands
```bash
# Add all files
git add .

# Commit changes
git commit -m "Add Telegram airdrop bot with multi-chain support"

# Push to GitHub
git push origin main
```

### Step 4: Alternative - Use GitHub CLI
If you have GitHub CLI installed:
```bash
gh auth login --with-token < your_token.txt
gh repo sync
```

### Step 5: Manual Upload (Alternative)
1. Go to https://github.com/raymondmitchell2015316/dhunt
2. Click "uploading an existing file"
3. Drag and drop all files maintaining the folder structure

## Important Notes
- Never commit the `.env` file (it's in .gitignore)
- Use `.env.example` as a template for others
- Your secrets are safe in the .env.example file (placeholders only)

## After Upload
1. Go to render.com
2. Connect this GitHub repository
3. Set environment variables in Render dashboard
4. Deploy automatically