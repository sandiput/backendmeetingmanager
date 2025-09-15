const { AppError } = require('../utils/logger');
const APP_CONSTANTS = require('../config/constants');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

// Basic authentication middleware
const basicAuth = (req, res, next) => {
  // Get authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
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
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication format'
    });
  }
};

// API key authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
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
    return res.status(403).json({
      success: false,
      message: 'Access denied from this IP address'
    });
  }

  next();
};

// Role-based access control middleware
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not found'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this role'
      });
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
    return res.status(403).json({
      success: false,
      message: 'Invalid origin'
    });
  }
};

// Request method validation middleware
const validateMethod = (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  next();
};

// Content type validation middleware
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type must be application/json'
      });
    }
  }

  next();
};

// Request size validation middleware
const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');

  if (contentLength > APP_CONSTANTS.REQUEST.MAX_SIZE) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }

  next();
};

// Admin authentication middleware using HttpOnly cookies
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from HttpOnly cookie
    const token = req.cookies.admin_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin token required.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find admin by ID from token
    const admin = await Admin.findByPk(decoded.adminId);
    
    if (!admin || !admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin token.'
      });
    }

    // Store admin data in request object
    req.admin = admin;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Middleware to check admin role
const requireAdminRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Role tidak mencukupi.'
      });
    }

    next();
  };
};

// Middleware to check auth status (optional)
const checkAdminAuthStatus = async (req, res, next) => {
  try {
    const token = req.cookies.admin_token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const admin = await Admin.findByPk(decoded.adminId);
      
      if (admin && admin.is_active) {
        req.admin = admin;
      }
    }
    
    next();
  } catch (error) {
    // If error, continue without setting req.admin
    next();
  }
};

module.exports = {
  basicAuth,
  apiKeyAuth,
  ipWhitelist,
  checkRole,
  validateOrigin,
  validateMethod,
  validateContentType,
  validateRequestSize,
  authenticateAdmin,
  requireAdminRole,
  checkAdminAuthStatus
};