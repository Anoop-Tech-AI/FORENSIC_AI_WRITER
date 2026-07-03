const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { ROLES, hasPermission, requireAdmin } = require('../utils/rbac');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure avatars directory exists
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

// Multer config for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${req.user?._id || 'unknown'}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        if (file.originalname) {
            const ext = allowed.test(path.extname(file.originalname).toLowerCase());
            const mime = allowed.test(file.mimetype);
            if (ext && mime) cb(null, true);
            else cb(new Error('Only image files are allowed'));
        } else {
            cb(null, true);
        }
    }
}).single('avatar');

// @desc    Get all users (Admin only)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user?._id } })
            .select('_id username name email role avatar')
            .sort('username');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });
        
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, username, email } = req.body;
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;

        if (username && username !== user.username) {
            const userExists = await User.findOne({ username });
            if (userExists) return res.status(400).json({ message: 'Username already taken' });
            user.username = username;
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ message: 'Email already registered' });
            user.email = email;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            avatar: updatedUser.avatar || ''
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Implement missing user management controller methods
const createUser = async (req, res) => {
    try {
        const { username, email, password, role, name } = req.body;
        if (!username || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await User.create({
            username,
            name: name || username,
            email,
            password: hashedPassword,
            role,
            isVerified: true
        });
        
        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!role) return res.status(400).json({ message: 'Role is required' });
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.role = role;
        await user.save();
        
        res.json({ message: 'Role updated successfully', role: user.role });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const uploadAvatar = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'Avatar upload failed', error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        try {
            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            
            user.avatar = `/uploads/avatars/${req.file.filename}`;
            await user.save();
            
            res.json({ message: 'Avatar uploaded successfully', avatar: user.avatar });
        } catch (dbErr) {
            res.status(500).json({ message: 'Server error', error: dbErr.message });
        }
    });
};

const setPresetAvatar = async (req, res) => {
    try {
        const { avatarKey } = req.body;
        if (!avatarKey) return res.status(400).json({ message: 'Avatar key is required' });
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.avatar = avatarKey;
        await user.save();
        
        res.json({ message: 'Avatar updated successfully', avatar: user.avatar });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getRoles = async (req, res) => res.status(200).json(['admin', 'investigator', 'legal_advisor']);

module.exports = {
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
};
