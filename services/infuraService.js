const axios = require('axios');
const { Web3 } = require('web3');
const config = require('../config/config');

class InfuraService {
    constructor() {
        // Initialize Web3 instances for all networks
        this.web3Instances = {};
        Object.keys(config.NETWORKS).forEach(networkKey => {
            const network = config.NETWORKS[networkKey];
            this.web3Instances[networkKey] = new Web3(network.rpc);
        });
        
        this.requestCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get cached result or null if not cached/expired
     * @param {string} key - Cache key
     * @returns {Object|null} - Cached data or null
     */
    getFromCache(key) {
        const cached = this.requestCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * Store data in cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCache(key, data) {
        this.requestCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Resolve ENS domain to Ethereum address
     * @param {string} ensDomain - The ENS domain to resolve
     * @returns {Promise<Object>} - Resolution result
     */
    async resolveENS(ensDomain) {
        try {
            const cacheKey = `ens_${ensDomain}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const address = await this.web3Instances.ethereum.eth.ens.getAddress(ensDomain);
            
            if (!address || address === '0x0000000000000000000000000000000000000000') {
                const result = {
                    success: false,
                    error: `❌ ENS domain "${ensDomain}" could not be resolved. Please check the domain name.`,
                    address: null
                };
                this.setCache(cacheKey, result);
                return result;
            }

            const result = {
                success: true,
                error: null,
                address: this.web3Instances.ethereum.utils.toChecksumAddress(address),
                resolvedFrom: ensDomain
            };
            
            this.setCache(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('ENS resolution error:', error);
            return {
                success: false,
                error: `❌ Failed to resolve ENS domain "${ensDomain}". The domain may not exist or there may be a network issue.`,
                address: null
            };
        }
    }

    /**
     * Get balance for any network
     * @param {string} address - The wallet address
     * @param {string} networkKey - Network identifier (ethereum, polygon, bsc, etc.)
     * @returns {Promise<Object>} - Balance information
     */
    async getNetworkBalance(address, networkKey) {
        try {
            const network = config.NETWORKS[networkKey];
            if (!network) {
                return {
                    success: false,
                    network: networkKey,
                    balance: 0,
                    hasBalance: false,
                    error: `❌ Unsupported network: ${networkKey}`
                };
            }

            const cacheKey = `${networkKey}_balance_${address}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const web3Instance = this.web3Instances[networkKey];
            const balanceWei = await web3Instance.eth.getBalance(address);
            const balanceFormatted = web3Instance.utils.fromWei(balanceWei, 'ether');
            
            const result = {
                success: true,
                network: network.name,
                symbol: network.symbol,
                balance: parseFloat(balanceFormatted),
                balanceFormatted: parseFloat(balanceFormatted).toFixed(4),
                balanceWei: balanceWei,
                hasBalance: parseFloat(balanceFormatted) > 0,
                error: null,
                chainId: network.chainId
            };
            
            this.setCache(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error(`${networkKey} balance error:`, error);
            const network = config.NETWORKS[networkKey];
            return {
                success: false,
                network: network?.name || networkKey,
                balance: 0,
                hasBalance: false,
                error: `❌ Failed to fetch ${network?.name || networkKey} balance. Please try again later.`
            };
        }
    }

    /**
     * Get transaction count (nonce) for an address to check activity
     * @param {string} address - The wallet address
     * @param {string} networkKey - Network identifier (ethereum, polygon, bsc, etc.)
     * @returns {Promise<Object>} - Transaction count information
     */
    async getTransactionCount(address, networkKey = 'ethereum') {
        try {
            const network = config.NETWORKS[networkKey];
            if (!network) {
                return {
                    success: false,
                    network: networkKey,
                    transactionCount: 0,
                    hasActivity: false,
                    error: `❌ Unsupported network: ${networkKey}`
                };
            }

            const web3Instance = this.web3Instances[networkKey];
            const cacheKey = `tx_count_${networkKey}_${address}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const txCount = await web3Instance.eth.getTransactionCount(address);
            
            const result = {
                success: true,
                network: network.name,
                transactionCount: parseInt(txCount),
                hasActivity: parseInt(txCount) > 0,
                error: null,
                chainId: network.chainId
            };
            
            this.setCache(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error(`Transaction count error for ${networkKey}:`, error);
            const network = config.NETWORKS[networkKey];
            return {
                success: false,
                network: network?.name || networkKey,
                transactionCount: 0,
                hasActivity: false,
                error: `❌ Failed to fetch transaction count for ${network?.name || networkKey}`
            };
        }
    }

    /**
     * Comprehensive wallet analysis across multiple networks
     * @param {string} address - The wallet address
     * @returns {Promise<Object>} - Complete wallet analysis
     */
    async analyzeWallet(address) {
        try {
            const networkKeys = Object.keys(config.NETWORKS);
            
            // Get balances and transaction counts for all networks
            const balancePromises = networkKeys.map(networkKey => 
                this.getNetworkBalance(address, networkKey)
            );
            const activityPromises = networkKeys.map(networkKey => 
                this.getTransactionCount(address, networkKey)
            );

            const [balances, activities] = await Promise.all([
                Promise.all(balancePromises),
                Promise.all(activityPromises)
            ]);

            // Build analysis object
            const analysis = {};
            let totalTransactions = 0;
            let networksWithBalance = 0;
            let networksWithActivity = 0;
            let hasAnyBalance = false;
            let hasAnyActivity = false;

            networkKeys.forEach((networkKey, index) => {
                const balance = balances[index];
                const activity = activities[index];
                
                analysis[networkKey] = {
                    balance: balance,
                    activity: activity
                };

                if (balance.hasBalance) {
                    networksWithBalance++;
                    hasAnyBalance = true;
                }
                
                if (activity.hasActivity) {
                    networksWithActivity++;
                    hasAnyActivity = true;
                }
                
                totalTransactions += activity.transactionCount || 0;
            });

            // Determine wallet eligibility for airdrops
            const isEligible = hasAnyBalance || hasAnyActivity;

            return {
                success: true,
                address: address,
                analysis: analysis,
                summary: {
                    totalNetworks: networkKeys.length,
                    networksWithBalance,
                    networksWithActivity,
                    totalTransactions,
                    hasAnyBalance,
                    hasAnyActivity,
                    isEligible,
                    eligibilityReason: isEligible ? 
                        (hasAnyBalance ? 'Wallet has active balances' : 'Wallet has transaction history') :
                        'No balance or transaction activity found'
                },
                error: null
            };

        } catch (error) {
            console.error('Wallet analysis error:', error);
            return {
                success: false,
                address: address,
                analysis: null,
                summary: null,
                error: '❌ Failed to analyze wallet. Please check the address and try again.'
            };
        }
    }

    /**
     * Get network status and health check
     * @returns {Promise<Object>} - Network status information
     */
    async getNetworkStatus() {
        try {
            const networkKeys = Object.keys(config.NETWORKS);
            const blockPromises = networkKeys.map(networkKey => 
                this.web3Instances[networkKey].eth.getBlockNumber().catch(() => null)
            );

            const blocks = await Promise.all(blockPromises);
            const networks = {};

            networkKeys.forEach((networkKey, index) => {
                const network = config.NETWORKS[networkKey];
                networks[networkKey] = {
                    name: network.name,
                    available: blocks[index] !== null,
                    latestBlock: blocks[index],
                    rpc: network.rpc,
                    chainId: network.chainId
                };
            });

            return {
                success: true,
                networks: networks,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Network status error:', error);
            return {
                success: false,
                error: 'Failed to check network status',
                networks: null
            };
        }
    }
}

module.exports = InfuraService;
