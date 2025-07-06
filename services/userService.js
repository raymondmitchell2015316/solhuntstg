const { Pool } = require('pg');

class UserService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
        this.initDatabase();
    }

    /**
     * Initialize database table for users and ensure all required columns exist
     */
    async initDatabase() {
        try {
            // Create base table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS bot_users (
                    id BIGINT PRIMARY KEY,
                    username VARCHAR(255),
                    first_name VARCHAR(255),
                    last_name VARCHAR(255),
                    is_active BOOLEAN DEFAULT true,
                    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    wallet_count INTEGER DEFAULT 0,
                    airdrop_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Check and add missing columns for enhanced reminder system
            await this.ensureEnhancedReminderColumns();
            
            console.log('✅ Database initialized with enhanced reminder columns');
        } catch (error) {
            console.error('Database initialization error:', error);
        }
    }

    /**
     * Ensure all enhanced reminder system columns exist
     */
    async ensureEnhancedReminderColumns() {
        const columnsToAdd = [
            { name: 'last_wallet_address', type: 'VARCHAR(255)' },
            { name: 'pending_airdrop_amount', type: 'INTEGER DEFAULT 0' },
            { name: 'pending_airdrop_projects', type: 'TEXT' },
            { name: 'pending_airdrop_claim_url', type: 'TEXT' },
            { name: 'last_analysis_date', type: 'TIMESTAMP' },
            { name: 'has_unclaimed_airdrops', type: 'BOOLEAN DEFAULT false' }
        ];

        for (const column of columnsToAdd) {
            try {
                await this.pool.query(`
                    ALTER TABLE bot_users 
                    ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
                `);
                console.log(`✓ Column ${column.name} verified/added`);
            } catch (error) {
                console.log(`⚠ Column ${column.name} check failed:`, error.message);
            }
        }

        // Create indexes for performance
        try {
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_bot_users_unclaimed_airdrops 
                ON bot_users (has_unclaimed_airdrops, is_active, last_interaction)
            `);
            
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_bot_users_last_analysis 
                ON bot_users (last_analysis_date, is_active, last_interaction)
            `);
            console.log('✓ Performance indexes verified/created');
        } catch (error) {
            console.log('⚠ Index creation failed:', error.message);
        }
    }

    /**
     * Add or update user in database
     * @param {Object} userData - User data from Telegram
     */
    async upsertUser(userData) {
        try {
            const { id, username, first_name, last_name } = userData;
            
            await this.pool.query(`
                INSERT INTO bot_users (id, username, first_name, last_name, last_interaction)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (id) 
                DO UPDATE SET 
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    last_interaction = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
            `, [id, username, first_name, last_name]);
            
        } catch (error) {
            console.error('Error upserting user:', error);
        }
    }

    /**
     * Get users with unclaimed airdrops for targeted reminders
     * @returns {Array} - Array of user objects with airdrop data
     */
    async getUsersWithUnclaimedAirdrops() {
        try {
            const result = await this.pool.query(`
                SELECT id, username, first_name, pending_airdrop_amount, pending_airdrop_projects,
                       last_wallet_address, last_analysis_date, pending_airdrop_claim_url
                FROM bot_users 
                WHERE is_active = true 
                AND has_unclaimed_airdrops = true
                AND last_interaction > NOW() - INTERVAL '7 days'
                ORDER BY pending_airdrop_amount DESC, last_analysis_date DESC
            `);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting users with unclaimed airdrops:', error);
            return [];
        }
    }

    /**
     * Get active users without recent analysis for general reminders
     * @returns {Array} - Array of user objects
     */
    async getActiveUsersWithoutRecentAnalysis() {
        try {
            const result = await this.pool.query(`
                SELECT id, username, first_name 
                FROM bot_users 
                WHERE is_active = true 
                AND last_interaction > NOW() - INTERVAL '7 days'
                AND (last_analysis_date IS NULL OR last_analysis_date < NOW() - INTERVAL '24 hours')
                ORDER BY last_interaction DESC
            `);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting active users without analysis:', error);
            return [];
        }
    }

    /**
     * Update user wallet analysis with airdrop data
     * @param {number} userId - User ID
     * @param {string} walletAddress - Wallet address analyzed
     * @param {Object} airdropData - Airdrop data if eligible
     */
    async saveWalletAnalysis(userId, walletAddress, airdropData = null) {
        try {
            const hasAirdrops = airdropData && airdropData.success;
            const airdropAmount = hasAirdrops ? airdropData.airdrop.amount : 0;
            const projectName = hasAirdrops ? airdropData.airdrop.template.name : null;
            const claimUrl = hasAirdrops ? airdropData.airdrop.claimUrl : null;
            
            await this.pool.query(`
                UPDATE bot_users 
                SET wallet_count = wallet_count + 1,
                    last_interaction = CURRENT_TIMESTAMP,
                    last_wallet_address = $2,
                    pending_airdrop_amount = $3,
                    pending_airdrop_projects = $4,
                    pending_airdrop_claim_url = $5,
                    last_analysis_date = CURRENT_TIMESTAMP,
                    has_unclaimed_airdrops = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [userId, walletAddress, airdropAmount, projectName, claimUrl, hasAirdrops]);
        } catch (error) {
            console.error('Error saving wallet analysis:', error);
        }
    }

    /**
     * Get user data with airdrop information
     * @param {number} userId - User ID
     * @returns {Object|null} - User data with airdrop info
     */
    async getUserWithAirdropData(userId) {
        try {
            const result = await this.pool.query(`
                SELECT id, username, first_name, 
                       last_wallet_address, pending_airdrop_amount, 
                       pending_airdrop_projects, pending_airdrop_claim_url,
                       has_unclaimed_airdrops, last_analysis_date
                FROM bot_users 
                WHERE id = $1
            `, [userId]);
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting user airdrop data:', error);
            return null;
        }
    }

    /**
     * Mark airdrops as claimed for user
     * @param {number} userId - User ID
     */
    async markAirdropsClaimed(userId) {
        try {
            await this.pool.query(`
                UPDATE bot_users 
                SET has_unclaimed_airdrops = false,
                    airdrop_count = airdrop_count + 1,
                    last_interaction = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [userId]);
        } catch (error) {
            console.error('Error marking airdrops as claimed:', error);
        }
    }

    /**
     * Update user airdrop claim count
     * @param {number} userId - User ID
     */
    async incrementAirdropCount(userId) {
        try {
            await this.pool.query(`
                UPDATE bot_users 
                SET airdrop_count = airdrop_count + 1,
                    last_interaction = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [userId]);
        } catch (error) {
            console.error('Error incrementing airdrop count:', error);
        }
    }

    /**
     * Deactivate user (opt-out from reminders)
     * @param {number} userId - User ID
     */
    async deactivateUser(userId) {
        try {
            await this.pool.query(`
                UPDATE bot_users 
                SET is_active = false,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [userId]);
        } catch (error) {
            console.error('Error deactivating user:', error);
        }
    }

    /**
     * Get user statistics
     * @returns {Object} - User statistics
     */
    async getUserStats() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                    SUM(wallet_count) as total_wallet_analyses,
                    SUM(airdrop_count) as total_airdrop_claims
                FROM bot_users
            `);
            
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {};
        }
    }
}

module.exports = UserService;