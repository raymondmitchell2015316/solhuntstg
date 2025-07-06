const config = require('../config/config');

class AirdropGenerator {
    constructor() {
        this.airdropTemplates = [
            {
                name: "DeFi Rewards Program",
                description: "Early DeFi user rewards",
                category: "DeFi",
                multiplier: 1.2
            },
            {
                name: "Layer 2 Migration Bonus",
                description: "L2 adoption incentive",
                category: "Layer2",
                multiplier: 1.1
            },
            {
                name: "NFT Holder Benefit",
                description: "NFT community rewards",
                category: "NFT",
                multiplier: 1.3
            },
            {
                name: "Trading Volume Bonus",
                description: "High volume trader rewards",
                category: "Trading",
                multiplier: 1.0
            },
            {
                name: "Early Adopter Grant",
                description: "Pioneer user benefits",
                category: "Early",
                multiplier: 1.4
            },
            {
                name: "Cross-Chain Activity",
                description: "Multi-chain user rewards",
                category: "Cross-Chain",
                multiplier: 1.2
            },
            {
                name: "Arbitrum Ecosystem Grant",
                description: "Active Arbitrum user rewards",
                category: "Layer2",
                multiplier: 1.3
            },
            {
                name: "Optimism Governance Token",
                description: "OP network participation rewards",
                category: "Governance",
                multiplier: 1.2
            },
            {
                name: "Avalanche Rush Program",
                description: "AVAX ecosystem incentives",
                category: "Ecosystem",
                multiplier: 1.1
            },
            {
                name: "Base Builder Rewards",
                description: "Coinbase Base early adopter bonus",
                category: "Early",
                multiplier: 1.4
            },
            {
                name: "BNB Chain Validator",
                description: "BNB ecosystem participation rewards",
                category: "Staking",
                multiplier: 1.0
            },
            {
                name: "Linea Voyage NFT",
                description: "Consensys Linea network rewards",
                category: "NFT",
                multiplier: 1.2
            }
        ];

        this.claimStatuses = [
            { status: "Available", color: "🟢", weight: 70 },
            { status: "Pending Verification", color: "🟡", weight: 20 },
            { status: "Limited Time", color: "🔴", weight: 10 }
        ];
    }

    /**
     * Generate random airdrop amount within specified range
     * @param {number} min - Minimum amount
     * @param {number} max - Maximum amount
     * @returns {number} - Random amount
     */
    generateRandomAmount(min = config.MIN_AIRDROP_AMOUNT, max = config.MAX_AIRDROP_AMOUNT) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Select random airdrop template
     * @returns {Object} - Airdrop template
     */
    selectRandomTemplate() {
        const randomIndex = Math.floor(Math.random() * this.airdropTemplates.length);
        return this.airdropTemplates[randomIndex];
    }

    /**
     * Select claim status based on weighted probability
     * @returns {Object} - Claim status
     */
    selectClaimStatus() {
        const totalWeight = this.claimStatuses.reduce((sum, status) => sum + status.weight, 0);
        let randomNum = Math.random() * totalWeight;
        
        for (const status of this.claimStatuses) {
            randomNum -= status.weight;
            if (randomNum <= 0) {
                return status;
            }
        }
        
        return this.claimStatuses[0]; // Fallback
    }

    /**
     * Calculate bonus multiplier based on wallet analysis
     * @param {Object} walletAnalysis - Wallet analysis data
     * @returns {number} - Bonus multiplier
     */
    calculateBonusMultiplier(walletAnalysis) {
        let multiplier = 1.0;
        
        if (!walletAnalysis || !walletAnalysis.summary) {
            return multiplier;
        }

        const summary = walletAnalysis.summary;
        
        // Bonus for multiple networks with balance
        if (summary.networksWithBalance >= 2) {
            multiplier += 0.2;
        }
        
        // Bonus for high transaction activity
        if (summary.totalTransactions > 100) {
            multiplier += 0.3;
        } else if (summary.totalTransactions > 50) {
            multiplier += 0.2;
        } else if (summary.totalTransactions > 10) {
            multiplier += 0.1;
        }
        
        // Bonus for having both balance and activity
        if (summary.hasAnyBalance && summary.hasAnyActivity) {
            multiplier += 0.15;
        }
        
        return Math.min(multiplier, 1.8); // Cap at 1.8x multiplier
    }

    /**
     * Generate mock airdrop data based on wallet analysis
     * @param {string} walletAddress - The wallet address
     * @param {Object} walletAnalysis - Wallet analysis results
     * @returns {Object} - Generated airdrop data
     */
    generateAirdrop(walletAddress, walletAnalysis) {
        // Check if wallet is eligible
        if (!walletAnalysis.summary.isEligible) {
            return {
                success: false,
                error: '❌ Wallet not eligible for airdrops. No balance or transaction activity found.',
                airdrop: null
            };
        }

        const template = this.selectRandomTemplate();
        const claimStatus = this.selectClaimStatus();
        const baseAmount = this.generateRandomAmount();
        const bonusMultiplier = this.calculateBonusMultiplier(walletAnalysis);
        const finalAmount = Math.floor(baseAmount * bonusMultiplier * template.multiplier);

        // Generate unique claim ID
        const claimId = this.generateClaimId(walletAddress);
        
        // Calculate expiry time (24-72 hours from now)
        const expiryHours = Math.floor(Math.random() * 48) + 24;
        const expiryTime = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        const airdropData = {
            id: claimId,
            walletAddress: walletAddress,
            template: template,
            amount: finalAmount,
            baseAmount: baseAmount,
            bonusMultiplier: bonusMultiplier,
            status: claimStatus.status,
            statusColor: claimStatus.color,
            claimable: claimStatus.status === "Available",
            expiryTime: expiryTime,
            expiryFormatted: this.formatTimeRemaining(expiryTime),
            generatedAt: new Date(),
            eligibilityFactors: this.getEligibilityFactors(walletAnalysis),
            claimUrl: `${config.CLAIM_URL}?id=${claimId}&wallet=${walletAddress}`
        };

        return {
            success: true,
            error: null,
            airdrop: airdropData
        };
    }

    /**
     * Generate unique claim ID
     * @param {string} walletAddress - Wallet address
     * @returns {string} - Claim ID
     */
    generateClaimId(walletAddress) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const addressSuffix = walletAddress.slice(-6);
        return `AH${timestamp.toString(36).toUpperCase()}${random.toUpperCase()}${addressSuffix.toUpperCase()}`;
    }

    /**
     * Get eligibility factors for display
     * @param {Object} walletAnalysis - Wallet analysis
     * @returns {Array} - Array of eligibility factors
     */
    getEligibilityFactors(walletAnalysis) {
        const factors = [];
        const summary = walletAnalysis.summary;

        if (summary.hasAnyBalance) {
            factors.push(`💰 Active balances across ${summary.networksWithBalance} network(s)`);
        }

        if (summary.hasAnyActivity) {
            factors.push(`📈 ${summary.totalTransactions} total transactions`);
        }

        if (summary.networksWithBalance >= 2) {
            factors.push("🌐 Multi-chain activity detected");
        }

        if (summary.totalTransactions > 100) {
            factors.push("🔥 High-volume user");
        } else if (summary.totalTransactions > 50) {
            factors.push("⚡ Active user");
        }

        return factors;
    }

    /**
     * Format time remaining until expiry
     * @param {Date} expiryTime - Expiry time
     * @returns {string} - Formatted time remaining
     */
    formatTimeRemaining(expiryTime) {
        const now = new Date();
        const diffMs = expiryTime.getTime() - now.getTime();
        
        if (diffMs <= 0) {
            return "Expired";
        }

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 24) {
            const days = Math.floor(diffHours / 24);
            const hours = diffHours % 24;
            return `${days}d ${hours}h remaining`;
        } else if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}m remaining`;
        } else {
            return `${diffMinutes}m remaining`;
        }
    }

    /**
     * Generate multiple airdrops for a wallet (if eligible)
     * @param {string} walletAddress - Wallet address
     * @param {Object} walletAnalysis - Wallet analysis
     * @param {number} maxAirdrops - Maximum number of airdrops to generate
     * @returns {Object} - Generated airdrops
     */
    generateMultipleAirdrops(walletAddress, walletAnalysis, maxAirdrops = 3) {
        if (!walletAnalysis.summary.isEligible) {
            return {
                success: false,
                error: '❌ Wallet not eligible for airdrops.',
                airdrops: []
            };
        }

        const numAirdrops = Math.min(
            Math.floor(Math.random() * maxAirdrops) + 1,
            walletAnalysis.summary.networksWithActivity + walletAnalysis.summary.networksWithBalance
        );

        const airdrops = [];
        const usedTemplates = new Set();

        for (let i = 0; i < numAirdrops; i++) {
            let template;
            let attempts = 0;
            
            // Try to get a unique template
            do {
                template = this.selectRandomTemplate();
                attempts++;
            } while (usedTemplates.has(template.name) && attempts < 10);
            
            usedTemplates.add(template.name);

            const airdropResult = this.generateAirdrop(walletAddress, walletAnalysis);
            if (airdropResult.success) {
                // Override template for variety
                airdropResult.airdrop.template = template;
                airdrops.push(airdropResult.airdrop);
            }
        }

        return {
            success: true,
            error: null,
            airdrops: airdrops,
            totalValue: airdrops.reduce((sum, airdrop) => sum + airdrop.amount, 0)
        };
    }
}

module.exports = AirdropGenerator;
