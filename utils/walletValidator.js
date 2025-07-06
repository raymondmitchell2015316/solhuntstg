const { Web3 } = require('web3');

class WalletValidator {
    constructor() {
        this.web3 = new Web3();
    }

    /**
     * Validate if the provided address is a valid Ethereum address
     * @param {string} address - The wallet address to validate
     * @returns {Object} - Validation result with isValid and error message
     */
    validateEthereumAddress(address) {
        try {
            // Remove any whitespace
            const cleanAddress = address.trim();
            
            // Check if it's a valid Ethereum address format
            if (!this.web3.utils.isAddress(cleanAddress)) {
                return {
                    isValid: false,
                    error: '❌ Invalid wallet address format. Please provide a valid Ethereum address (0x...)',
                    address: null
                };
            }

            // Convert to checksum address
            const checksumAddress = this.web3.utils.toChecksumAddress(cleanAddress);
            
            return {
                isValid: true,
                error: null,
                address: checksumAddress,
                type: 'ethereum'
            };
            
        } catch (error) {
            return {
                isValid: false,
                error: '❌ Error validating address. Please check the format and try again.',
                address: null
            };
        }
    }

    /**
     * Validate ENS domain
     * @param {string} domain - The ENS domain to validate
     * @returns {Object} - Validation result
     */
    validateENSDomain(domain) {
        const cleanDomain = domain.trim().toLowerCase();
        
        // Basic ENS domain validation
        if (!cleanDomain.endsWith('.eth')) {
            return {
                isValid: false,
                error: '❌ Invalid ENS domain. Domain must end with .eth',
                address: null
            };
        }

        // Check for valid characters
        const validPattern = /^[a-z0-9-]+\.eth$/;
        if (!validPattern.test(cleanDomain)) {
            return {
                isValid: false,
                error: '❌ Invalid ENS domain format. Use only lowercase letters, numbers, and hyphens.',
                address: null
            };
        }

        return {
            isValid: true,
            error: null,
            address: cleanDomain,
            type: 'ens'
        };
    }

    /**
     * Main validation function that determines address type and validates accordingly
     * @param {string} input - The wallet address or ENS domain
     * @returns {Object} - Validation result
     */
    validate(input) {
        if (!input || typeof input !== 'string') {
            return {
                isValid: false,
                error: '❌ Please provide a wallet address or ENS domain.',
                address: null
            };
        }

        const cleanInput = input.trim();

        // Check if it's an ENS domain
        if (cleanInput.toLowerCase().endsWith('.eth')) {
            return this.validateENSDomain(cleanInput);
        }

        // Check if it's an Ethereum address
        if (cleanInput.startsWith('0x')) {
            return this.validateEthereumAddress(cleanInput);
        }

        // If it doesn't match any pattern
        return {
            isValid: false,
            error: '❌ Invalid format. Please provide a valid Ethereum address (0x...) or ENS domain (.eth)',
            address: null
        };
    }

    /**
     * Validate multiple addresses at once
     * @param {Array} addresses - Array of addresses to validate
     * @returns {Array} - Array of validation results
     */
    validateMultiple(addresses) {
        if (!Array.isArray(addresses)) {
            return [{
                isValid: false,
                error: '❌ Expected an array of addresses.',
                address: null
            }];
        }

        return addresses.map(address => this.validate(address));
    }

    /**
     * Check if address format suggests it's from a specific network
     * @param {string} address - The wallet address
     * @returns {string} - Suggested network
     */
    suggestNetwork(address) {
        const validation = this.validate(address);
        
        if (!validation.isValid) {
            return 'unknown';
        }

        // For now, all valid addresses are treated as Ethereum-compatible
        // In the future, you could add more sophisticated network detection
        return 'ethereum';
    }
}

module.exports = new WalletValidator();
