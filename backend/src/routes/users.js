/**
 * User Routes
 * GET /api/users/profile
 * PUT /api/users/profile
 * GET /api/users/stats
 * DELETE /api/users/account
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../models/database');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, (req, res) => {
  const db = getDB();
  const user = db.prepare(`
    SELECT id, email, first_name, last_name, avatar, role, plan,
           resumes_count, templates_count, ai_generations_used, ai_generations_limit,
           created_at
    FROM users WHERE id = ?
  `).get(req.user.id);

  res.json({ success: true, user });
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, (req, res) => {
  try {
    const { firstName, lastName, avatar } = req.body;
    const db = getDB();

    db.prepare(`
      UPDATE users
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          avatar = COALESCE(?, avatar),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(firstName, lastName, avatar, req.user.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    delete user.password;

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user stats/dashboard data
// @access  Private
router.get('/stats', protect, (req, res) => {
  const db = getDB();

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM resumes WHERE user_id = ?) as total_resumes,
      (SELECT COUNT(*) FROM resumes WHERE user_id = ? AND created_at >= date('now', '-30 days')) as recent_resumes,
      (SELECT COUNT(*) FROM ai_generations WHERE user_id = ?) as total_ai_generations,
      (SELECT SUM(tokens_used) FROM ai_generations WHERE user_id = ?) as total_tokens_used
  `).get(req.user.id, req.user.id, req.user.id, req.user.id);

  const recentResumes = db.prepare(`
    SELECT id, title, template_id, ats_score, created_at
    FROM resumes WHERE user_id = ?
    ORDER BY updated_at DESC LIMIT 5
  `).all(req.user.id);

  const recentActivity = db.prepare(`
    SELECT action, entity_type, created_at
    FROM activity_log WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 10
  `).all(req.user.id);

  res.json({
    success: true,
    stats,
    recentResumes,
    recentActivity,
  });
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all data
// @access  Private
router.delete('/account', protect, (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
