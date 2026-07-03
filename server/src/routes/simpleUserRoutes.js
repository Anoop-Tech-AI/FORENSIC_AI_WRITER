const express = require('express');
const router = express.Router();

// Mock user data
let mockUsers = [{ username: 'User', email: 'user@example.com', role: 'investigator' }];
let mockUser = { username: 'User', email: 'user@example.com', role: 'investigator' };

// Get all users
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            users: mockUsers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Get user profile
router.get('/me', async (req, res) => {
    try {
        res.json(mockUser);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// Get user profile (legacy)
router.get('/profile', async (req, res) => {
    try {
        res.json({
            success: true,
            user: mockUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        mockUser = { ...mockUser, ...req.body };
        
        res.json({
            success: true,
            user: mockUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Update avatar with preset
router.put('/avatar/preset', async (req, res) => {
    try {
        const { avatarKey } = req.body;
        mockUser.avatar = `/uploads/avatars/${avatarKey}.svg`;
        
        res.json({
            success: true,
            avatar: mockUser.avatar
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update avatar'
        });
    }
});

// Upload custom avatar
router.post('/avatar/upload', async (req, res) => {
    try {
        // Mock upload - just return a mock path
        mockUser.avatar = `/uploads/avatars/custom_${Date.now()}.jpg`;
        
        res.json({
            success: true,
            avatar: mockUser.avatar
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to upload avatar'
        });
    }
});

// Get system stats for Admin
router.get('/stats', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }
        
        res.json({
            success: true,
            stats: {
                totalUsers: mockUsers.length,
                roleDistribution: {
                    admin: mockUsers.filter(u => u.role === 'admin').length,
                    investigator: mockUsers.filter(u => u.role === 'investigator').length,
                    legal_adviser: mockUsers.filter(u => u.role === 'legal_adviser').length
                },
                activeSessions: 4,
                systemPulse: 'Healthy'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin stats'
        });
    }
});

// Clear all users (for testing/reset)
router.delete('/clear', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }
        
        mockUsers = [];
        
        res.json({
            success: true,
            message: 'All users cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear users'
        });
    }
});

module.exports = router;
