// Security configuration and utilities

const crypto = require('crypto');

// Security constants
const SECURITY_CONFIG = {
  // JWT settings
  JWT: {
    SECRET: process.env.JWT_SECRET,
    ALGORITHM: 'HS256',
    EXPIRES_IN: '24h',
    ISSUER: 'forensic-writer',
    AUDIENCE: 'forensic-writer-users'
  },

  // Password settings
  PASSWORD: {
    SALT_ROUNDS: 12,
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true
  },

  // Rate limiting
  RATE_LIMITING: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // requests per window
    OTP_MAX_REQUESTS: 5, // OTP specific limit
    LOGIN_MAX_ATTEMPTS: 5 // login attempts per window
  },

  // Session settings
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict'
  },

  // CORS settings
  CORS: {
    ALLOWED_ORIGINS: process.env.NODE_ENV === 'production' 
      ? ['https://your-production-domain.com']
      : ['http://localhost:5173', 'http://localhost:3000'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
    CREDENTIALS: true
  },

  // File upload settings
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  }
};

// Generate secure random string
const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate secure token
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('base64');
};

// Hash sensitive data
const hashSensitiveData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Validate JWT secret
const validateJWTSecret = () => {
  const secret = SECURITY_CONFIG.JWT.SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (secret === 'your_jwt_secret_here' || secret.length < 32) {
    throw new Error('JWT_SECRET must be a secure random string of at least 32 characters');
  }

  return true;
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\\w+=/gi, '') // Remove event handlers
    .replace(/[\\x00-\\x1F\\x7F]/g, '') // Remove control characters
    .trim();
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

// Check password strength
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= SECURITY_CONFIG.PASSWORD.MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  const strength = score / Object.keys(checks).length;

  return {
    score: score,
    strength: strength,
    checks: checks,
    isStrong: strength >= 0.8
  };
};

// Rate limiting helper
const createRateLimitKey = (identifier, action) => {
  return `rate_limit:${action}:${identifier}`;
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';");

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// Mask sensitive data for logging
const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'otp', 'authorization'];
  const masked = { ...data };

  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
};

// Validate file upload
const validateFileUpload = (file) => {
  const config = SECURITY_CONFIG.FILE_UPLOAD;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > config.MAX_SIZE) {
    return { valid: false, error: `File size exceeds limit of ${config.MAX_SIZE / 1024 / 1024}MB` };
  }

  if (!config.ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
};

// Generate audit log entry
const generateAuditLog = (action, userId, details = {}) => {
  return {
    timestamp: new Date().toISOString(),
    action: action,
    userId: userId,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    details: maskSensitiveData(details),
    sessionId: details.sessionId || 'unknown'
  };
};

// Initialize security configuration
const initializeSecurity = () => {
  try {
    validateJWTSecret();
    console.log('Security configuration initialized successfully');
    return true;
  } catch (error) {
    console.error('Security initialization failed:', error.message);
    return false;
  }
};

module.exports = {
  SECURITY_CONFIG,
  generateSecureRandom,
  generateSecureToken,
  hashSensitiveData,
  validateJWTSecret,
  sanitizeInput,
  validateEmail,
  checkPasswordStrength,
  createRateLimitKey,
  securityHeaders,
  maskSensitiveData,
  validateFileUpload,
  generateAuditLog,
  initializeSecurity
};
