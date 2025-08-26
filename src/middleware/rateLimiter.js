const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const APP_CONSTANTS = require('../config/constants');

// Create rate limiter middleware
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: APP_CONSTANTS.RATE_LIMIT.WINDOW_MS,
    max: APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS,
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP address as default key
      return req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for certain paths or conditions
      return false;
    }
  };

  // Merge default options with provided options
  const limiterOptions = { ...defaultOptions, ...options };

  return rateLimit(limiterOptions);
};

// Create specific rate limiters for different routes
const rateLimiters = {
  // General API rate limiter
  api: createRateLimiter(),

  // Authentication rate limiter (more strict)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    }
  }),

  // WhatsApp test rate limiter
  whatsapp: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per window
    message: {
      success: false,
      message: 'Too many WhatsApp test attempts, please try again later.'
    }
  }),

  // File upload rate limiter
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 requests per window
    message: {
      success: false,
      message: 'Too many file upload attempts, please try again later.'
    }
  }),

  // Search rate limiter
  search: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per window
    message: {
      success: false,
      message: 'Too many search requests, please try again later.'
    }
  })
};

// Dynamic rate limiter based on user role or other conditions
const dynamicRateLimiter = (req, res, next) => {
  // Example: Different limits based on user role
  const userRole = req.user ? req.user.role : 'guest';
  
  const limits = {
    admin: 1000,
    user: 100,
    guest: 50
  };

  const limiter = createRateLimiter({
    max: limits[userRole] || limits.guest
  });

  return limiter(req, res, next);
};

module.exports = {
  rateLimiters,
  createRateLimiter,
  dynamicRateLimiter
};