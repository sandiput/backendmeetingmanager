const { AppError } = require('../utils/logger');

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Handle validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  return new AppError(`Invalid input data: ${errors.join(', ')}`, 400);
};

// Handle duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`Duplicate field value: ${field} = ${value}. Please use another value.`, 400);
};

// Handle cast errors
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

// Handle JWT expired error
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

// Handle multer errors
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size is 5MB.', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected field in file upload.', 400);
  }
  return new AppError('Error uploading file.', 400);
};

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    // Log error
    console.error('ERROR 💥:', err);

    // Send generic message
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle different types of errors
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.code === 11000) error = handleDuplicateKeyError(error);
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  notFound,
  errorHandler,
  catchAsync
};