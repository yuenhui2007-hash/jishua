/**
 * Template Routes
 * GET /api/templates
 * GET /api/templates/:id
 * GET /api/templates/agent/:agent
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../models/database');
const { protect, premiumOnly } = require('../middleware/auth');

// @route   GET /api/templates
// @desc    Get all templates
// @access  Public
router.get('/', (req, res) => {
  const db = getDB();
  const { category, agent } = req.query;

  let query = 'SELECT * FROM templates WHERE is_active = 1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (agent) {
    query += ' AND agent = ?';
    params.push(agent);
  }

  query += ' ORDER BY usage_count DESC';

  const templates = db.prepare(query).all(...params);
  res.json({ success: true, count: templates.length, templates });
});

// @route   GET /api/templates/:id
// @desc    Get single template
// @access  Public
router.get('/:id', (req, res) => {
  const db = getDB();
  const template = db.prepare('SELECT * FROM templates WHERE id = ? OR slug = ?')
    .get(req.params.id, req.params.id);

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  res.json({ success: true, template });
});

// @route   GET /api/templates/agent/:agent
// @desc    Get templates by agent
// @access  Public
router.get('/agent/:agent', (req, res) => {
  const db = getDB();
  const templates = db.prepare('SELECT * FROM templates WHERE agent = ? AND is_active = 1')
    .all(req.params.agent);

  res.json({ success: true, count: templates.length, templates });
});

// @route   POST /api/templates/:id/use
// @desc    Mark template as used (increment count)
// @access  Private
router.post('/:id/use', protect, (req, res) => {
  const db = getDB();
  db.prepare('UPDATE templates SET usage_count = usage_count + 1 WHERE id = ? OR slug = ?')
    .run(req.params.id, req.params.id);

  res.json({ success: true, message: 'Template usage recorded' });
});

module.exports = router;
