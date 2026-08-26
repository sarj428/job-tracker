const mongoose = require('mongoose');

/**
 * Centralized error handler middleware.
 * Produces consistent { success, message, errors? } responses.
 */
const errorHandler = (err, req, res, next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  // MongoDB duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `A record with this ${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Authentication token has expired' });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  if (statusCode === 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
