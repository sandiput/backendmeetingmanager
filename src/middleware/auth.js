const { AppError } = require('../utils/logger');
const APP_CONSTANTS = require('../config/constants');

// Basic authentication middleware
const basicAuth = (req, res, next) => {
  // Get authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    // Extract credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Validate credentials
    if (
      username === process.env.API_USERNAME &&
      password === process.env.API_PASSWORD
    ) {
      next();
    } else {
      next(new AppError('Invalid credentials', 401));
    }
  } catch (error) {
    next(new AppError('Invalid authentication format', 401));
  }
};

// API key authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(new AppError('API key is required', 401));
  }

  if (apiKey !== process.env.API_KEY) {
    return next(new AppError('Invalid API key', 401));
  }

  next();
};

// IP whitelist middleware
const ipWhitelist = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const whitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];

  // Allow all if no whitelist is configured
  if (whitelist.length === 0) {
    return next();
  }

  if (!whitelist.includes(clientIp)) {
    return next(new AppError('Access denied from this IP address', 403));
  }

  next();
};

// Role-based access control middleware
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('User role not found', 403));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied for this role', 403));
    }

    next();
  };
};

// Request origin validation middleware
const validateOrigin = (req, res, next) => {
  const origin = req.get('origin');
  const allowedOrigins = APP_CONSTANTS.CORS.ORIGINS;

  if (!origin || allowedOrigins.includes(origin)) {
    next();
  } else {
    next(new AppError('Invalid origin', 403));
  }
};

// Request method validation middleware
const validateMethod = (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  if (!allowedMethods.includes(req.method)) {
    return next(new AppError(`Method ${req.method} not allowed`, 405));
  }

  next();
};

// Content type validation middleware
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return next(new AppError('Content-Type must be application/json', 415));
    }
  }

  next();
};

// Request size validation middleware
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');

  if (contentLength > APP_CONSTANTS.REQUEST.MAX_SIZE) {
    return next(new AppError('Request entity too large', 413));
  }

  next();
};

module.exports = {
  basicAuth,
  apiKeyAuth,
  ipWhitelist,
  checkRole,
  validateOrigin,
  validateMethod,
  validateContentType,
  validateRequestSize
};