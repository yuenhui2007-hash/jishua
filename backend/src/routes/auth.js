const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, firstName, lastName } = req.body;
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, first_name, last_name, subscription_tier, subscription_status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(email, passwordHash, firstName || null, lastName || null, 'free', 'inactive');

    const token = generateToken(result.lastInsertRowid);
    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        firstName,
        lastName,
        role: 'user',
        subscriptionTier: 'free'
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      subscriptionTier: user.subscription_tier,
      subscriptionStatus: user.subscription_status
    }
  });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role,
      subscriptionTier: req.user.subscription_tier,
      subscriptionStatus: req.user.subscription_status
    }
  });
});

// Admin Login
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, 'admin');

  if (!user) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  // Check if using env hash or bcrypt hash
  let validPassword = false;
  if (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD_HASH.startsWith('$2')) {
    validPassword = bcrypt.compareSync(password, user.password_hash) || bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
  } else {
    validPassword = bcrypt.compareSync(password, user.password_hash);
  }

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, type: 'admin' },
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Store session
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  db.prepare('INSERT INTO admin_sessions (admin_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(user.id, token, req.ip, req.headers['user-agent'], expiresAt.toISOString());

  res.json({
    token,
    admin: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    }
  });
});

module.exports = router;
