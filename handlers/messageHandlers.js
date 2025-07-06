const walletValidator = require('../utils/walletValidator');
const InfuraService = require('../services/infuraService');
const AirdropGenerator = require('../utils/airdropGenerator');
const infuraService = new InfuraService();
const airdropGenerator = new AirdropGenerator();
const NotificationService = require('../services/notificationService');
const UserService = require('../services/userService');
const { walletResultKeyboard, claimKeyboard, errorKeyboard, shareKeyboard } = require('../keyboards/inlineKeyboards');
const { Markup } = require('telegraf');
const config = require('../config/config');

class MessageHandlers {
    constructor() {
        this.notificationService = new NotificationService();
        this.userService = new UserService();
    }

    /**
     * Handle start command
     * @param {Object} ctx - Telegram context
     */
    async handleStartCommand(ctx) {
        const welcomeMessage = `🌟 *Welcome to Airdrop Hunter!*

Discover hidden crypto opportunities by analyzing your wallet across multiple blockchain networks.

🔍 Get started by analyzing your wallet address!`;

        const keyboard = {
            inline_keyboard: [
                [{ text: '🔍 Analyze Wallet', callback_data: 'analyze_wallet' }],
                [{ text: '❓ Help & Support', callback_data: 'help_support' }]
            ]
        };

        await ctx.replyWithMarkdown(welcomeMessage, { reply_markup: keyboard });
    }
    /**
     * Handle wallet address input from user
     * @param {Object} ctx - Telegram context
     * @param {string} address - User provided wallet address
     */
    async handleWalletAddress(ctx, address) {
        const session = ctx.session || ctx.userSession;
        
        try {
            // Show loading message
            await ctx.reply('🔍 *Analyzing your wallet...*\n\n⏳ Please wait while I check your address and scan for airdrops...', 
                { 
                    parse_mode: 'Markdown',
                    reply_markup: Markup.removeKeyboard().reply_markup
                }
            );

            // Validate the address
            const validation = walletValidator.validate(address);
            
            if (!validation.isValid) {
                await ctx.reply(
                    `❌ *Address Validation Failed*\n\n${validation.error}\n\n💡 *Please try again with a valid address.*`,
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: errorKeyboard().reply_markup
                    }
                );
                session.state = 'idle';
                return;
            }

            let finalAddress = validation.address;

            // Handle ENS resolution if needed
            if (validation.type === 'ens') {
                await ctx.reply(
                    `🔍 *Resolving ENS Domain...*\n\n🌐 Resolving: \`${validation.address}\`\n⏳ Please wait...`,
                    { parse_mode: 'Markdown' }
                );

                const ensResult = await infuraService.resolveENS(validation.address);
                
                if (!ensResult.success) {
                    await ctx.reply(
                        `❌ *ENS Resolution Failed*\n\n${ensResult.error}\n\n💡 *Please check the domain and try again.*`,
                        { 
                            parse_mode: 'Markdown',
                            reply_markup: errorKeyboard().reply_markup
                        }
                    );
                    session.state = 'idle';
                    return;
                }

                finalAddress = ensResult.address;
                
                await ctx.reply(
                    `✅ *ENS Resolved Successfully*\n\n🌐 Domain: \`${validation.address}\`\n📍 Address: \`${finalAddress}\`\n\n🔍 Now analyzing wallet...`,
                    { parse_mode: 'Markdown' }
                );
            }

            // Store the final address in session
            session.walletAddress = finalAddress;

            // Perform wallet analysis
            await ctx.reply(
                `🔍 *Deep Wallet Analysis*\n\n💼 Wallet: \`${finalAddress.slice(0, 6)}...${finalAddress.slice(-6)}\`\n\n📊 Checking balances across networks...\n📈 Analyzing transaction history...\n🎯 Scanning for airdrop eligibility...`,
                { parse_mode: 'Markdown' }
            );

            const walletAnalysis = await infuraService.analyzeWallet(finalAddress);

            if (!walletAnalysis.success) {
                await ctx.reply(
                    `❌ *Wallet Analysis Failed*\n\n${walletAnalysis.error}\n\n🔄 *Please try again in a few moments.*`,
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: errorKeyboard().reply_markup
                    }
                );
                session.state = 'idle';
                return;
            }

            // Send notification to admin about wallet analysis
            await this.notificationService.sendWalletAnalysisNotification({
                userId: ctx.from.id,
                username: ctx.from.username,
                firstName: ctx.from.first_name,
                walletAddress: finalAddress,
                analysis: walletAnalysis,
                ensName: validation.type === 'ens' ? validation.address : null
            });

            // Generate analysis summary message
            const analysisMessage = this.formatWalletAnalysis(finalAddress, walletAnalysis, validation.type === 'ens' ? validation.address : null);

            // Check if wallet is eligible for airdrops
            if (walletAnalysis.summary.isEligible) {
                // Generate airdrop data
                const airdropResult = airdropGenerator.generateAirdrop(finalAddress, walletAnalysis);
                
                if (airdropResult.success) {
                    session.airdropData = airdropResult.airdrop;
                    
                    // Save wallet analysis and airdrop data to database
                    await this.userService.saveWalletAnalysis(ctx.from.id, finalAddress, airdropResult);
                    
                    const airdropMessage = this.formatAirdropResults(airdropResult.airdrop);
                    const combinedMessage = `${analysisMessage}\n\n${airdropMessage}`;
                    
                    await ctx.reply(
                        combinedMessage,
                        { 
                            parse_mode: 'Markdown',
                            reply_markup: claimKeyboard(airdropResult.airdrop).reply_markup
                        }
                    );
                } else {
                    await ctx.reply(
                        `${analysisMessage}\n\n❌ *Airdrop Generation Failed*\n\n${airdropResult.error}`,
                        { 
                            parse_mode: 'Markdown',
                            reply_markup: walletResultKeyboard(false).reply_markup
                        }
                    );
                }
            } else {
                // Save wallet analysis without airdrop data
                await this.userService.saveWalletAnalysis(ctx.from.id, finalAddress, null);
                
                await ctx.reply(
                    `${analysisMessage}\n\n💡 *Tip:* To be eligible for airdrops, your wallet needs to have either:\n• Active token balances\n• Transaction history on supported networks\n\nTry using a more active wallet address!`,
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: walletResultKeyboard(false).reply_markup
                    }
                );
            }

            session.state = 'idle';

        } catch (error) {
            console.error('Wallet analysis error:', error);
            
            await ctx.reply(
                `❌ *Unexpected Error*\n\nSomething went wrong while analyzing your wallet. Please try again later.\n\n🔧 *Error:* Technical difficulties with blockchain data retrieval.`,
                { 
                    parse_mode: 'Markdown',
                    reply_markup: errorKeyboard().reply_markup
                }
            );
            
            session.state = 'idle';
        }
    }

    /**
     * Format wallet analysis results into a readable message
     * @param {string} address - Wallet address
     * @param {Object} analysis - Wallet analysis data
     * @param {string} ensName - ENS name if applicable
     * @returns {string} - Formatted message
     */
    formatWalletAnalysis(address, analysis, ensName = null) {
        const summary = analysis.summary;
        const config = require('../config/config');

        let message = `📊 *Wallet Analysis Complete*\n\n`;
        
        if (ensName) {
            message += `🌐 *ENS:* \`${ensName}\`\n`;
        }
        
        message += `💼 *Address:* \`${address.slice(0, 8)}...${address.slice(-8)}\`\n\n`;

        // Network Analysis - Dynamic for all networks
        message += `🌐 *Multi-Network Analysis:*\n`;
        
        // Network icons mapping
        const networkIcons = {
            ethereum: '🟦',
            polygon: '🟣',
            bsc: '🟡',
            arbitrum: '🔵',
            optimism: '🔴',
            avalanche: '🔺',
            base: '🔷',
            linea: '⚫'
        };

        // Show only networks with balance or activity
        const activeNetworks = Object.keys(analysis.analysis).filter(networkKey => {
            const networkData = analysis.analysis[networkKey];
            return networkData.balance.success && (networkData.balance.hasBalance || networkData.activity.hasActivity);
        });

        if (activeNetworks.length > 0) {
            activeNetworks.forEach(networkKey => {
                const networkData = analysis.analysis[networkKey];
                const icon = networkIcons[networkKey] || '⚪';
                
                if (networkData.balance.success) {
                    message += `${icon} *${networkData.balance.network}*\n`;
                    message += `   💰 Balance: ${networkData.balance.balanceFormatted} ${networkData.balance.symbol}\n`;
                    message += `   📈 Transactions: ${networkData.activity.transactionCount}\n`;
                }
            });
        } else {
            message += `⚪ No active networks found with balances or transactions\n`;
        }

        message += `\n📋 *Summary:*\n`;
        message += `• Networks scanned: ${summary.totalNetworks}\n`;
        message += `• Networks with balance: ${summary.networksWithBalance}\n`;
        message += `• Networks with activity: ${summary.networksWithActivity}\n`;
        message += `• Total transactions: ${summary.totalTransactions}\n`;
        message += `• Airdrop eligible: ${summary.isEligible ? '✅ Yes' : '❌ No'}\n`;
        
        if (summary.isEligible) {
            message += `• Eligibility reason: ${summary.eligibilityReason}\n`;
        }

        return message;
    }

    /**
     * Format airdrop results into a readable message
     * @param {Object} airdrop - Airdrop data
     * @returns {string} - Formatted airdrop message
     */
    formatAirdropResults(airdrop) {
        let message = `🎉 *Airdrop Found!*\n\n`;
        
        message += `${airdrop.statusColor} *${airdrop.template.name}*\n`;
        message += `💰 *Value:* $${airdrop.amount.toLocaleString()} USD\n`;
        message += `📋 *Category:* ${airdrop.template.category}\n`;
        message += `🎯 *Status:* ${airdrop.status}\n`;
        message += `⏰ *Expires:* ${airdrop.expiryFormatted}\n`;
        message += `🆔 *Claim ID:* \`${airdrop.id}\`\n\n`;

        message += `📝 *Description:*\n${airdrop.template.description}\n\n`;

        if (airdrop.eligibilityFactors.length > 0) {
            message += `✅ *Eligibility Factors:*\n`;
            airdrop.eligibilityFactors.forEach(factor => {
                message += `${factor}\n`;
            });
            message += `\n`;
        }

        if (airdrop.bonusMultiplier > 1.0) {
            const bonusPercent = Math.round((airdrop.bonusMultiplier - 1.0) * 100);
            message += `🚀 *Bonus Applied:* +${bonusPercent}% (Active user boost)\n\n`;
        }

        if (airdrop.claimable) {
            message += `🎯 *Ready to claim!* Click the button below to proceed.`;
        } else {
            message += `⏳ *${airdrop.status}* - Check back later for updates.`;
        }

        return message;
    }

    /**
     * Handle help and support requests
     * @param {Object} ctx - Telegram context
     */
    async handleHelpRequest(ctx) {
        const config = require('../config/config');
        
        const helpMessage = `
ℹ️ *${config.BOT_NAME} - Help & Support*

🔍 *How it works:*
1. Share your wallet address or ENS domain
2. We analyze your on-chain activity across 8 networks
3. Discover eligible airdrops based on your history
4. Claim available rewards instantly

💡 *Tips for better results:*
• Use wallets with transaction history
• Wallets with token balances have higher eligibility
• Multi-chain activity increases airdrop potential

🛠 *Supported Networks:*
• Ethereum (ETH)
• Polygon (MATIC)
• BNB Smart Chain (BNB)
• Arbitrum One (ETH)
• Optimism (ETH)
• Avalanche (AVAX)
• Base (ETH)
• Linea (ETH)

❓ *Common Issues:*
• Invalid address format → Use proper 0x... format
• No airdrops found → Try a more active wallet
• ENS not resolving → Check domain spelling

📞 *Need more help?*
Contact our support team:
• Telegram: @${config.ADMIN_USERNAME}
• Email: ${config.ADMIN_EMAIL}
        `;

        await ctx.replyWithMarkdown(helpMessage, require('../keyboards/inlineKeyboards').helpKeyboard());
    }

    /**
     * Handle unknown or unrecognized commands
     * @param {Object} ctx - Telegram context
     * @param {string} text - User input text
     */
    async handleUnknownCommand(ctx, text) {
        const unknownMessage = `
🤖 *I didn't understand that command.*

🔍 *Available actions:*
• /start - Welcome & main menu
• /analyze - Start wallet analysis
• /help - Get help and support
• /status - Check your session

💡 *Or simply send me a wallet address to analyze!*
        `;

        await ctx.replyWithMarkdown(unknownMessage, require('../keyboards/inlineKeyboards').mainMenuKeyboard());
    }
}

module.exports = MessageHandlers;
