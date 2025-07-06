const axios = require('axios');
const config = require('../config/config');

class NotificationService {
    constructor() {
        this.notificationBotToken = config.NOTIFICATION_BOT_TOKEN;
        this.notificationChatId = config.NOTIFICATION_CHAT_ID;
    }

    /**
     * Send notification to admin about wallet analysis
     * @param {Object} data - Notification data
     */
    async sendWalletAnalysisNotification(data) {
        if (!this.notificationBotToken || !this.notificationChatId) {
            return; // Skip if notification not configured
        }

        try {
            const message = this.formatWalletAnalysisMessage(data);
            await this.sendNotification(message);
        } catch (error) {
            console.log('Notification send failed:', error.message);
        }
    }

    /**
     * Send notification to admin about claim attempt
     * @param {Object} data - Claim notification data
     */
    async sendClaimNotification(data) {
        if (!this.notificationBotToken || !this.notificationChatId) {
            return; // Skip if notification not configured
        }

        try {
            const message = this.formatClaimMessage(data);
            await this.sendNotification(message);
        } catch (error) {
            console.log('Claim notification send failed:', error.message);
        }
    }

    /**
     * Format wallet analysis notification message
     * @param {Object} data - Analysis data
     * @returns {string} - Formatted message
     */
    formatWalletAnalysisMessage(data) {
        const { userId, username, firstName, walletAddress, analysis, ensName } = data;
        
        let message = `🔍 *Wallet Analysis*\n\n`;
        message += `👤 User: ${firstName || 'Unknown'}`;
        if (username) message += ` (@${username})`;
        message += `\n📱 ID: \`${userId}\`\n`;
        message += `💳 Wallet: \`${walletAddress}\`\n`;
        
        if (ensName && ensName !== 'address') {
            message += `🏷️ ENS: ${ensName}\n`;
        }
        
        message += `\n📊 *Analysis Results:*\n`;
        
        if (analysis && analysis.success) {
            // Extract data from the correct structure (analysis.analysis contains network data)
            const networkData = analysis.analysis;
            const summary = analysis.summary;
            
            if (networkData && summary) {
                let totalBalance = 0;
                let activeNetworks = 0;
                let totalTransactions = summary.totalTransactions || 0;
                
                // Calculate totals from network data
                Object.entries(networkData).forEach(([network, data]) => {
                    if (data.balance && data.balance.hasBalance) {
                        activeNetworks++;
                        totalBalance += data.balance.usdValue || 0;
                    }
                });
                
                message += `💰 Total Balance: $${totalBalance.toFixed(2)}\n`;
                message += `🌐 Active Networks: ${activeNetworks}/${summary.totalNetworks || 0}\n`;
                message += `📈 Total Transactions: ${totalTransactions}\n`;
                message += `✅ Airdrop Eligible: ${summary.isEligible ? 'Yes' : 'No'}\n`;
                
                if (summary.eligibilityReason) {
                    message += `📝 Reason: ${summary.eligibilityReason}\n`;
                }
                
                // Show network breakdown
                message += `\n🌐 *Network Details:*\n`;
                Object.entries(networkData).forEach(([network, data]) => {
                    const networkName = data.balance?.network || network;
                    const balance = data.balance?.hasBalance ? `$${(data.balance.usdValue || 0).toFixed(2)}` : '$0.00';
                    const txCount = data.activity?.transactionCount || 0;
                    message += `• ${networkName}: ${balance} (${txCount} txs)\n`;
                });
            } else {
                message += `❌ No detailed analysis data available\n`;
            }
        } else {
            message += `❌ Analysis failed: ${analysis?.error || 'Unknown error'}\n`;
        }
        
        message += `\n⏰ ${new Date().toLocaleString()}`;
        
        return message;
    }

    /**
     * Format claim notification message
     * @param {Object} data - Claim data
     * @returns {string} - Formatted message
     */
    formatClaimMessage(data) {
        const { userId, username, firstName, walletAddress, airdropData } = data;
        
        let message = `🎯 *Airdrop Claim Attempt*\n\n`;
        message += `👤 User: ${firstName || 'Unknown'}`;
        if (username) message += ` (@${username})`;
        message += `\n📱 ID: \`${userId}\`\n`;
        message += `💳 Wallet: \`${walletAddress}\`\n`;
        
        if (airdropData) {
            message += `\n💎 *Airdrop Details:*\n`;
            message += `🏷️ Project: ${airdropData.projectName}\n`;
            message += `💰 Amount: $${airdropData.amount.toLocaleString()}\n`;
            message += `🪙 Token: ${airdropData.tokenAmount} ${airdropData.tokenSymbol}\n`;
            message += `📊 Status: ${airdropData.claimStatus.status}\n`;
        }
        
        message += `\n⏰ ${new Date().toLocaleString()}`;
        
        return message;
    }

    /**
     * Send notification message
     * @param {string} message - Message to send
     */
    async sendNotification(message) {
        if (!this.notificationBotToken || !this.notificationChatId) {
            console.log('📧 Admin Notification Preview:\n', message);
            return;
        }

        const url = `https://api.telegram.org/bot${this.notificationBotToken}/sendMessage`;
        
        const payload = {
            chat_id: this.notificationChatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        };

        await axios.post(url, payload);
        console.log('✅ Admin notification sent successfully');
    }

    /**
     * Test notification system with sample data
     */
    async testNotification() {
        const sampleData = {
            userId: 123456789,
            username: 'testuser',
            firstName: 'Test User',
            walletAddress: '0x742d35Cc6634C0532925a3b8D72a0c50B39beb6c',
            analysis: {
                networks: {
                    ethereum: { balance: { value: 1.5, usdValue: 3750 } },
                    polygon: { balance: { value: 100, usdValue: 85 } }
                },
                totalTransactions: 145
            },
            ensName: null
        };

        await this.sendWalletAnalysisNotification(sampleData);
    }
}

module.exports = NotificationService;