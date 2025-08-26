const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.dirname(process.env.LOG_FILE || './logs/app.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'meeting-manager' },
  transports: [
    // Write to all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log',
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Write all logs error (and below) to 'error.log'
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// If we're not in production, log to the console with custom format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create a stream object with a write function that will be used by morgan
const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Custom error handler
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : 'anonymous'
  });

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Production error response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Programming or unknown error
  return res.status(500).json({
    success: false,
    message: 'Something went wrong'
  });
};

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  logger,
  stream,
  AppError,
  errorHandler,
  catchAsync
};