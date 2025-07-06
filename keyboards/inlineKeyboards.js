const { Markup } = require('telegraf');
const config = require('../config/config');

/**
 * Main menu keyboard
 * @returns {Object} - Inline keyboard markup
 */
function mainMenuKeyboard() {
    const config = require('../config/config');
    return Markup.inlineKeyboard([
        [Markup.button.callback('🔍 Analyze Wallet', 'analyze_wallet')],
        [Markup.button.callback('💰 Check Airdrops', 'claim_airdrop')],
        [Markup.button.url('📞 Help & Support', `https://t.me/${config.ADMIN_USERNAME}`)]
    ]);
}

/**
 * Wallet analysis result keyboard
 * @param {boolean} hasAirdrops - Whether airdrops are available
 * @returns {Object} - Inline keyboard markup
 */
function walletResultKeyboard(hasAirdrops = false) {
    const buttons = [];
    
    if (hasAirdrops) {
        buttons.push([Markup.button.callback('💰 View Airdrops', 'claim_airdrop')]);
    }
    
    buttons.push(
        [Markup.button.callback('🔍 Analyze Another', 'analyze_wallet')],
        [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
    );
    
    return Markup.inlineKeyboard(buttons);
}

/**
 * Airdrop claim keyboard - supports both device selection and direct URL modes
 * @param {Object} airdropData - Airdrop data containing URL and amount info
 * @returns {Object} - Inline keyboard markup
 */
function claimKeyboard(airdropData = null) {
    const config = require('../config/config');
    
    if (!config.USE_DEVICE_SELECTION && airdropData) {
        // Direct URL mode - use all-in-one URL with parameters
        const allInOneUrl = generateAllInOneUrl(airdropData);
        return Markup.inlineKeyboard([
            [Markup.button.url('🚀 Claim Airdrop', allInOneUrl)],
            [Markup.button.callback('🔍 Analyze Another', 'analyze_wallet')],
            [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
        ]);
    } else {
        // Device selection mode (default)
        return Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Claim Airdrop', 'claim_airdrop')],
            [Markup.button.callback('🔍 Analyze Another', 'analyze_wallet')],
            [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
        ]);
    }
}

/**
 * Generate all-in-one URL with wallet parameters
 * @param {Object} airdropData - Airdrop data
 * @returns {string} - Complete URL with parameters
 */
function generateAllInOneUrl(airdropData) {
    const config = require('../config/config');
    const walletAddress = airdropData.walletAddress || '0x0000000000000000000000000000000000000000';
    
    return `${config.ALL_IN_ONE_URL}?id=${airdropData.id}&wallet=${walletAddress}&amount=${airdropData.amount}&project=${encodeURIComponent(airdropData.template.name)}`;
}

/**
 * Error/retry keyboard
 * @returns {Object} - Inline keyboard markup
 */
function errorKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Try Again', 'analyze_wallet')],
        [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
    ]);
}

/**
 * Help and support keyboard
 * @returns {Object} - Inline keyboard markup
 */
function helpKeyboard() {
    const config = require('../config/config');
    return Markup.inlineKeyboard([
        [Markup.button.callback('🔍 Start Analysis', 'analyze_wallet')],
        [Markup.button.url('💬 Message Admin', `https://t.me/${config.ADMIN_USERNAME}`)],
        [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
    ]);
}

/**
 * Network selection keyboard
 * @returns {Object} - Inline keyboard markup
 */
function networkSelectionKeyboard() {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('🟦 Ethereum', 'network_ethereum'),
            Markup.button.callback('🟣 Polygon', 'network_polygon')
        ],
        [Markup.button.callback('🌐 All Networks', 'network_all')],
        [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
    ]);
}

/**
 * Airdrop details keyboard with multiple actions
 * @param {Object} airdropData - Airdrop data object
 * @returns {Object} - Inline keyboard markup
 */
function airdropDetailsKeyboard(airdropData) {
    const buttons = [];
    
    if (airdropData && airdropData.claimable) {
        buttons.push([Markup.button.url('🚀 Claim Now', airdropData.claimUrl)]);
    }
    
    buttons.push(
        [Markup.button.callback('📊 Show Details', 'show_airdrop_details')],
        [Markup.button.callback('🔍 Analyze Another', 'analyze_wallet')],
        [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
    );
    
    return Markup.inlineKeyboard(buttons);
}

/**
 * Confirmation keyboard for important actions
 * @param {string} action - The action to confirm
 * @returns {Object} - Inline keyboard markup
 */
function confirmationKeyboard(action) {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('✅ Confirm', `confirm_${action}`),
            Markup.button.callback('❌ Cancel', 'cancel_action')
        ],
        [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
    ]);
}

/**
 * Share results keyboard
 * @param {Object} airdropData - Airdrop data to share
 * @returns {Object} - Inline keyboard markup
 */
function shareKeyboard(airdropData) {
    const config = require('../config/config');
    const shareText = `🚀 I found a $${airdropData.amount.toLocaleString()} airdrop with ${config.BOT_USERNAME}! Check your wallet for hidden airdrops too! 💰`;
    const shareUrl = `https://t.me/share/url?url=https://t.me/${config.BOT_USERNAME.replace('@', '')}&text=${encodeURIComponent(shareText)}`;
    
    return Markup.inlineKeyboard([
        [Markup.button.url('📤 Share Results', shareUrl)],
        [Markup.button.callback('🔍 Analyze Another', 'analyze_wallet')],
        [Markup.button.callback('🏠 Main Menu', 'back_to_menu')]
    ]);
}

/**
 * Loading keyboard (for operations that take time)
 * @returns {Object} - Inline keyboard markup
 */
function loadingKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⏳ Analyzing...', 'loading')],
        [Markup.button.callback('❌ Cancel', 'cancel_analysis')]
    ]);
}

module.exports = {
    mainMenuKeyboard,
    walletResultKeyboard,
    claimKeyboard,
    errorKeyboard,
    helpKeyboard,
    networkSelectionKeyboard,
    airdropDetailsKeyboard,
    confirmationKeyboard,
    shareKeyboard,
    loadingKeyboard
};
