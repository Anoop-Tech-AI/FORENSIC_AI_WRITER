const jwt = require('jsonwebtoken');

// In production, we verify JWT tokens here
const protect = async (req, res, next) => {
  let token;

  // Check if JWT_SECRET is set in production
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set in production');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET || 'forensic_writer_secret_key_2026';
      const decoded = jwt.verify(token, secret);

      // Get user from the token
      const User = require('../models/User');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authMiddleware = protect;

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
       return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  protect,
  requireRole
};
