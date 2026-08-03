const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all resumes for user
router.get('/', authenticateToken, (req, res) => {
  const resumes = db.prepare(
    'SELECT id, title, template_id, ats_score, is_public, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.user.id);
  res.json({ resumes });
});

// Get single resume
router.get('/:id', authenticateToken, (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }
  res.json({ resume });
});

// Create resume
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('content').exists(),
  body('templateId').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content, templateId } = req.body;
  const result = db.prepare(
    'INSERT INTO resumes (user_id, title, content, template_id) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, title, content, templateId || 'default');

  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ resume });
});

// Update resume
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().exists(),
  body('templateId').optional().trim(),
  body('atsScore').optional().isInt({ min: 0, max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existing = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  const { title, content, templateId, atsScore } = req.body;
  db.prepare(
    'UPDATE resumes SET title = COALESCE(?, title), content = COALESCE(?, content), template_id = COALESCE(?, template_id), ats_score = COALESCE(?, ats_score), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(title, content, templateId, atsScore, req.params.id);

  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);
  res.json({ resume });
});

// Delete resume
router.delete('/:id', authenticateToken, (req, res) => {
  const result = db.prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Resume not found' });
  }
  res.json({ message: 'Resume deleted' });
});

module.exports = router;
