const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Generate OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Create user (temporarily auto-verified for testing)
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'investigator',
            isVerified: true, // Temporarily set to true for testing
            otp,
            otpExpiry
        });

        // Store OTP for verification
        otpStore.set(email, { otp, expiry: otpExpiry });

        // Send OTP email
        try {
            await emailService.sendOTPEmail(email, otp);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Continue anyway - user can still verify with OTP
        }

        res.status(201).json({
            message: 'User registered successfully. Please verify your email with the OTP sent.',
            userId: user._id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Verify OTP and activate account
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Please provide email and OTP' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check OTP
        if (user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Verify user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Remove from OTP store
        otpStore.delete(email);

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'forensic_writer_secret_key_2026',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Account verified successfully',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar || ''
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { identifier, password, role } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide identifier and password' });
        }

        // Find user by email or username
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is verified (temporarily disabled for testing)
        // if (!user.isVerified) {
        //     return res.status(403).json({ message: 'Please verify your email first' });
        // }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check role if specified
        if (role && user.role !== role) {
            return res.status(403).json({ message: 'Unauthorized for this role' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'forensic_writer_secret_key_2026',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = {
    register,
    verifyOTP,
    login
};
