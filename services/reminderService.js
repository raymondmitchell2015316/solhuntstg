const cron = require('node-cron');
const config = require('../config/config');

class ReminderService {
    constructor(bot, userService) {
        this.bot = bot;
        this.userService = userService;
        this.unclaimedReminderMessages = [
            {
                title: "💰 ${amount} Still Unclaimed!",
                text: "Your ${project} airdrop worth $${amount} is ready to claim! Don't let this opportunity expire - many users have already claimed theirs.",
                cta: "🚀 Claim Now"
            },
            {
                title: "⏰ Claim Deadline Approaching!",
                text: "You have $${amount} waiting from ${project}! Airdrop claims often have time limits - secure your tokens before it's too late.",
                cta: "💎 Secure Tokens"
            },
            {
                title: "🔥 ${amount} Ready for Withdrawal!",
                text: "Your ${project} airdrop is confirmed and ready! Join thousands who've already claimed their rewards - don't miss out on your $${amount}.",
                cta: "✅ Withdraw Now"
            },
            {
                title: "🎯 Final Reminder: ${amount} Waiting",
                text: "Last chance to claim your ${project} tokens worth $${amount}! Your wallet analysis shows you're eligible - claim before others take the remaining pool.",
                cta: "⚡ Claim Fast"
            }
        ];
        this.generalReminderMessages = [
            {
                title: "💎 Hidden Airdrops Waiting!",
                text: "Don't miss out on potential crypto rewards! Analyze your wallet now to discover unclaimed airdrops worth thousands of dollars.",
                cta: "🔍 Check My Wallet"
            },
            {
                title: "🚀 New Airdrop Opportunities!",
                text: "Major projects are distributing tokens to early users. Your wallet might be eligible for exclusive airdrops - check now before they expire!",
                cta: "💰 Find My Rewards"
            },
            {
                title: "⚡ Quick Wallet Scan Available",
                text: "Get instant results! Our advanced scanner checks 8+ networks for airdrop eligibility. Many users found $5,000+ in unclaimed tokens.",
                cta: "🎯 Scan Now"
            },
            {
                title: "🎁 Free Money Alert!",
                text: "Crypto projects are giving away free tokens to active wallet holders. Check if you qualify for any rewards - it only takes 30 seconds!",
                cta: "🏆 Claim Rewards"
            }
        ];
        this.isRunning = false;
    }

    /**
     * Start the reminder service
     */
    start() {
        if (this.isRunning) {
            console.log('Reminder service already running');
            return;
        }

        // Run every 30 minutes
        this.cronJob = cron.schedule('*/30 * * * *', async () => {
            await this.sendReminders();
        });

        this.isRunning = true;
        console.log('📅 Reminder service started - sending notifications every 30 minutes');
    }

    /**
     * Stop the reminder service
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.destroy();
            this.isRunning = false;
            console.log('📅 Reminder service stopped');
        }
    }

    /**
     * Send reminders to all active users
     */
    async sendReminders() {
        try {
            // Get users with unclaimed airdrops for targeted reminders
            const unclaimedUsers = await this.userService.getUsersWithUnclaimedAirdrops();
            const generalUsers = await this.userService.getActiveUsersWithoutRecentAnalysis();
            
            console.log(`📢 Sending targeted reminders to ${unclaimedUsers.length} users with unclaimed airdrops`);
            console.log(`📢 Sending general reminders to ${generalUsers.length} users without recent analysis`);

            let successCount = 0;
            let errorCount = 0;

            // Send targeted reminders to users with unclaimed airdrops
            for (const user of unclaimedUsers) {
                try {
                    const reminderMessage = this.getPersonalizedReminderMessage(user);
                    await this.sendReminderToUser(user, reminderMessage, true);
                    successCount++;
                    await this.delay(100);
                } catch (error) {
                    errorCount++;
                    console.log(`Failed to send targeted reminder to user ${user.id}:`, error.message);
                    
                    if (error.message.includes('blocked') || error.message.includes('forbidden')) {
                        await this.userService.deactivateUser(user.id);
                    }
                }
            }

            // Send general reminders to users without recent analysis
            for (const user of generalUsers) {
                try {
                    const reminderMessage = this.getRandomGeneralReminderMessage();
                    await this.sendReminderToUser(user, reminderMessage, false);
                    successCount++;
                    await this.delay(100);
                } catch (error) {
                    errorCount++;
                    console.log(`Failed to send general reminder to user ${user.id}:`, error.message);
                    
                    if (error.message.includes('blocked') || error.message.includes('forbidden')) {
                        await this.userService.deactivateUser(user.id);
                    }
                }
            }

            console.log(`📊 Reminder summary: ${successCount} sent, ${errorCount} failed`);
        } catch (error) {
            console.error('Error sending reminders:', error);
        }
    }

    /**
     * Send reminder to individual user
     * @param {Object} user - User object
     * @param {Object} message - Reminder message
     * @param {boolean} isTargeted - Whether this is a targeted reminder for unclaimed airdrops
     */
    async sendReminderToUser(user, message, isTargeted = false) {
        const reminderText = `${message.title}\n\n${message.text}\n\n${isTargeted ? 'Your rewards are waiting!' : 'Ready to discover your rewards?'}`;
        
        let keyboard;
        
        if (isTargeted && user.pending_airdrop_claim_url) {
            // For users with unclaimed airdrops, use direct claim URL
            keyboard = {
                inline_keyboard: [
                    [{ text: message.cta, url: user.pending_airdrop_claim_url }],
                    [{ text: '🔕 Stop Reminders', callback_data: 'stop_reminders' }]
                ]
            };
        } else {
            // For general reminders or users without claim URL, use callback
            keyboard = {
                inline_keyboard: [
                    [{ text: message.cta, callback_data: isTargeted ? 'claim_airdrop' : 'analyze_wallet' }],
                    [{ text: '🔕 Stop Reminders', callback_data: 'stop_reminders' }]
                ]
            };
        }

        await this.bot.telegram.sendMessage(user.id, reminderText, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    /**
     * Get personalized reminder message for users with unclaimed airdrops
     * @param {Object} user - User object with airdrop data
     * @returns {Object} - Personalized reminder message
     */
    getPersonalizedReminderMessage(user) {
        const randomIndex = Math.floor(Math.random() * this.unclaimedReminderMessages.length);
        const template = this.unclaimedReminderMessages[randomIndex];
        
        const amount = user.pending_airdrop_amount.toLocaleString();
        const project = user.pending_airdrop_projects || 'Unknown Project';
        
        return {
            title: template.title.replace(/\${amount}/g, amount).replace(/\${project}/g, project),
            text: template.text.replace(/\${amount}/g, amount).replace(/\${project}/g, project),
            cta: template.cta
        };
    }

    /**
     * Get random general reminder message
     * @returns {Object} - Random general reminder message
     */
    getRandomGeneralReminderMessage() {
        const randomIndex = Math.floor(Math.random() * this.generalReminderMessages.length);
        return this.generalReminderMessages[randomIndex];
    }

    /**
     * Handle stop reminders request
     * @param {Object} ctx - Telegram context
     */
    async handleStopReminders(ctx) {
        try {
            await this.userService.deactivateUser(ctx.from.id);
            
            await ctx.editMessageText(
                '🔕 *Reminders Stopped*\n\nYou will no longer receive automatic airdrop notifications.\n\nYou can still use the bot anytime to check for new opportunities!',
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔍 Check Wallet Now', callback_data: 'analyze_wallet' }],
                            [{ text: '🏠 Main Menu', callback_data: 'back_to_menu' }]
                        ]
                    }
                }
            );
            
            await ctx.answerCbQuery('Reminders disabled successfully');
        } catch (error) {
            console.error('Error stopping reminders:', error);
            await ctx.answerCbQuery('Error updating preferences');
        }
    }

    /**
     * Send immediate test reminder
     * @param {number} userId - User ID to test
     */
    async sendTestReminder(userId) {
        try {
            const user = { id: userId, first_name: 'Test', username: 'test' };
            const message = this.getRandomReminderMessage();
            await this.sendReminderToUser(user, message);
            console.log(`Test reminder sent to user ${userId}`);
        } catch (error) {
            console.error('Error sending test reminder:', error);
        }
    }

    /**
     * Get reminder service status
     * @returns {Object} - Service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            totalMessages: this.reminderMessages.length,
            nextRun: this.cronJob ? 'Every 30 minutes' : 'Not scheduled'
        };
    }

    /**
     * Delay function for rate limiting
     * @param {number} ms - Milliseconds to delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ReminderService;