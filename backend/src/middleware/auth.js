/**
 * Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const { getDB } = require('../models/database');
const logger = require('../utils/logger');

// Protect routes - verify JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Remove password from user object
    delete user.password;
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Admin only
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as admin' });
  }
};

// Premium only
exports.premiumOnly = (req, res, next) => {
  const allowedPlans = ['pro', 'enterprise'];
  if (req.user && (allowedPlans.includes(req.user.plan) || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Premium feature. Please upgrade your plan.',
      upgradeUrl: '/pricing',
    });
  }
};

// Generate JWT
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};
