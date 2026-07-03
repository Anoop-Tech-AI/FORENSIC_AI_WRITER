const bcrypt = require('bcryptjs');

class PasswordUtils {
    /**
     * Validates if a password hash is properly formatted and functional
     * @param {string} hash - The password hash to validate
     * @returns {boolean} - True if hash is valid, false otherwise
     */
    static isValidHash(hash) {
        if (!hash || typeof hash !== 'string') return false;
        
        // Check basic bcrypt format
        if (!hash.startsWith('$2b$') && !hash.startsWith('$2a$')) return false;
        
        // Check length (bcrypt hashes are typically 60 characters)
        if (hash.length < 50 || hash.length > 70) return false;
        
        return true;
    }

    /**
     * Tests if a password matches a hash
     * @param {string} password - Plain text password
     * @param {string} hash - Password hash
     * @returns {Promise<boolean>} - True if password matches
     */
    static async testPassword(password, hash) {
        try {
            if (!this.isValidHash(hash)) return false;
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.error('Password comparison error:', error);
            return false;
        }
    }

    /**
     * Creates a secure password hash
     * @param {string} password - Plain text password
     * @returns {Promise<string>} - Hashed password
     */
    static async createHash(password) {
        try {
            const salt = await bcrypt.genSalt(12);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            console.error('Password hashing error:', error);
            throw new Error('Failed to hash password');
        }
    }

    /**
     * Repairs a corrupted password hash by rehashing the password
     * @param {string} password - Plain text password
     * @param {string} oldHash - The corrupted hash (for logging)
     * @returns {Promise<string>} - New valid hash
     */
    static async repairHash(password, oldHash = null) {
        console.log('Repairing corrupted password hash...');
        if (oldHash) {
            console.log('Old hash:', oldHash.substring(0, 20) + '...');
        }
        
        const newHash = await this.createHash(password);
        console.log('New hash created:', newHash.substring(0, 20) + '...');
        
        return newHash;
    }

    /**
     * Validates password strength
     * @param {string} password - Plain text password
     * @returns {Object} - Validation result with reasons
     */
    static validatePasswordStrength(password) {
        const result = {
            isValid: true,
            errors: [],
            score: 0
        };

        if (!password) {
            result.isValid = false;
            result.errors.push('Password is required');
            return result;
        }

        if (password.length < 6) {
            result.isValid = false;
            result.errors.push('Password must be at least 6 characters');
        }

        if (password.length >= 8) result.score += 1;
        if (/[A-Z]/.test(password)) result.score += 1;
        if (/[a-z]/.test(password)) result.score += 1;
        if (/[0-9]/.test(password)) result.score += 1;
        if (/[^A-Za-z0-9]/.test(password)) result.score += 1;

        return result;
    }

    /**
     * Detects if a user needs password repair
     * @param {Object} user - User object with password field
     * @returns {boolean} - True if password needs repair
     */
    static needsPasswordRepair(user) {
        if (!user || !user.password) return true;
        return !this.isValidHash(user.password);
    }

    /**
     * Comprehensive password validation and repair
     * @param {Object} user - User object
     * @param {string} plainPassword - Plain text password for testing
     * @returns {Promise<Object>} - Result with repaired user if needed
     */
    static async validateAndRepair(user, plainPassword) {
        const result = {
            user: user,
            wasRepaired: false,
            isValid: false,
            message: ''
        };

        try {
            // Check if user exists and has password
            if (!user || !user.password) {
                result.message = 'User or password not found';
                return result;
            }

            // Test current password
            const isValid = await this.testPassword(plainPassword, user.password);
            
            if (isValid) {
                result.isValid = true;
                result.message = 'Password is valid';
                return result;
            }

            // If invalid, repair the hash
            console.log(`Password hash invalid for user: ${user.email}`);
            console.log('Repairing password hash...');
            
            const newHash = await this.repairHash(plainPassword, user.password);
            
            // Update user with new hash
            result.user.password = newHash;
            result.wasRepaired = true;
            result.isValid = true;
            result.message = 'Password hash was repaired';
            
            console.log('Password hash repaired successfully');
            return result;
            
        } catch (error) {
            console.error('Password validation error:', error);
            result.message = 'Password validation failed: ' + error.message;
            return result;
        }
    }
}

module.exports = PasswordUtils;
