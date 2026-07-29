/**
 * Authentication Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * GET /api/auth/me
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();

const { getDB } = require('../models/database');
const { protect, generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, handleValidationErrors } = require('../middleware/validator');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const db = getDB();

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = db.prepare(`
      INSERT INTO users (email, password, first_name, last_name, verification_token)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, hashedPassword, firstName || null, lastName || null, verificationToken);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    delete user.password;

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to ResumeAI Pro!',
        html: `<h1>Welcome to ResumeAI Pro!</h1>
               <p>Hi ${firstName || 'there'},</p>
               <p>Your account has been created. Start building your AI-powered resume today!</p>
               <a href="${process.env.FRONTEND_URL}/app.html">Get Started</a>`,
      });
    } catch (e) {
      logger.warn('Failed to send welcome email:', e.message);
    }

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    delete user.password;
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const db = getDB();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
      .run(resetToken, resetTokenExpires.toISOString(), user.id);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset - ResumeAI Pro',
      html: `<h1>Password Reset</h1>
             <p>Click the link below to reset your password. This link expires in 1 hour.</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>If you didn't request this, please ignore this email.</p>`,
    });

    res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    const db = getDB();

    const user = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?')
      .get(token, new Date().toISOString());

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(password, salt);

    db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
      .run(hashedPassword, user.id);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
