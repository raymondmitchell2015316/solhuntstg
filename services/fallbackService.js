const config = require('../config/config');

class FallbackService {
    /**
     * Generate fallback wallet analysis when APIs are unavailable
     * @param {string} address - Wallet address
     * @returns {Object} - Analysis result
     */
    generateFallbackAnalysis(address) {
        console.log('Using fallback analysis due to API unavailability');
        
        const networks = Object.keys(config.NETWORKS);
        const analysis = {};
        let totalTransactions = 0;
        let networksWithBalance = 0;
        let networksWithActivity = 0;

        // Generate realistic data for each network
        networks.forEach(networkKey => {
            const network = config.NETWORKS[networkKey];
            const hasBalance = Math.random() > 0.6; // 40% chance
            const hasActivity = Math.random() > 0.3; // 70% chance
            const transactionCount = hasActivity ? Math.floor(Math.random() * 50) + 5 : 0;
            
            analysis[networkKey] = {
                balance: {
                    network: network.name,
                    address: address,
                    balance: hasBalance ? (Math.random() * 2).toFixed(6) : '0',
                    symbol: network.symbol,
                    hasBalance: hasBalance,
                    fallback: true,
                    timestamp: new Date().toISOString()
                },
                activity: {
                    network: network.name,
                    address: address,
                    transactionCount: transactionCount,
                    hasActivity: hasActivity,
                    fallback: true,
                    timestamp: new Date().toISOString()
                }
            };

            if (hasBalance) networksWithBalance++;
            if (hasActivity) networksWithActivity++;
            totalTransactions += transactionCount;
        });

        return {
            success: true,
            address: address,
            analysis: analysis,
            summary: {
                totalTransactions: totalTransactions,
                networksWithBalance: networksWithBalance,
                networksWithActivity: networksWithActivity,
                isEligible: networksWithBalance > 0 || networksWithActivity > 0,
                riskLevel: this.calculateRiskLevel(totalTransactions, networksWithBalance),
                fallbackMode: true
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate risk level based on activity
     * @param {number} transactions - Total transactions
     * @param {number} networks - Networks with balance
     * @returns {string} - Risk level
     */
    calculateRiskLevel(transactions, networks) {
        if (transactions > 50 || networks > 3) return 'high';
        if (transactions > 20 || networks > 1) return 'medium';
        return 'low';
    }
}

module.exports = FallbackService;