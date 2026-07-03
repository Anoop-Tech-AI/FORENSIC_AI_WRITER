const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    getAllUsers,
    createUser, 
    updateUserRole, 
    deleteUser, 
    getProfile, 
    updateProfile, 
    uploadAvatar, 
    setPresetAvatar, 
    getRoles 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/authRole');

// User profile endpoints (restricted to authenticated users)
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/avatar/preset', protect, setPresetAvatar);
router.post('/avatar/upload', protect, uploadAvatar);
router.get('/roles', protect, getRoles);

// Admin-only user management endpoints
router.get('/', protect, checkRole(['admin']), getAllUsers);
router.post('/', protect, checkRole(['admin']), createUser);
router.put('/:id/role', protect, checkRole(['admin']), updateUserRole);
router.delete('/:id', protect, checkRole(['admin']), deleteUser);

module.exports = router;
