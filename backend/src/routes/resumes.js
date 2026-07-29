/**
 * Resume Routes
 * CRUD operations for resumes
 * GET /api/resumes
 * POST /api/resumes
 * GET /api/resumes/:id
 * PUT /api/resumes/:id
 * DELETE /api/resumes/:id
 * POST /api/resumes/:id/duplicate
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../models/database');
const { protect } = require('../middleware/auth');
const { createResumeValidation, updateResumeValidation, handleValidationErrors } = require('../middleware/validator');
const logger = require('../utils/logger');

// @route   GET /api/resumes
// @desc    Get all resumes for logged-in user
// @access  Private
router.get('/', protect, (req, res) => {
  const db = getDB();
  const resumes = db.prepare(`
    SELECT id, title, slug, template_id, ats_score, is_public,
           view_count, download_count, created_at, updated_at
    FROM resumes WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(req.user.id);

  res.json({ success: true, count: resumes.length, resumes });
});

// @route   POST /api/resumes
// @desc    Create a new resume
// @access  Private
router.post('/', protect, createResumeValidation, handleValidationErrors, (req, res) => {
  try {
    const { title, content, templateId } = req.body;
    const db = getDB();

    // Generate slug
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const result = db.prepare(`
      INSERT INTO resumes (user_id, title, slug, content, template_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, title, slug, JSON.stringify(content), templateId || 'default');

    // Update user's resume count
    db.prepare('UPDATE users SET resumes_count = resumes_count + 1 WHERE id = ?').run(req.user.id);

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid);

    // Log activity
    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id)
      VALUES (?, 'create', 'resume', ?)
    `).run(req.user.id, resume.id);

    res.status(201).json({ success: true, message: 'Resume created', resume });
  } catch (error) {
    logger.error('Create resume error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/resumes/:id
// @desc    Get a single resume
// @access  Private
router.get('/:id', protect, (req, res) => {
  const db = getDB();
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!resume) {
    return res.status(404).json({ success: false, message: 'Resume not found' });
  }

  // Parse JSON content
  try {
    resume.content = JSON.parse(resume.content);
  } catch (e) {
    // Content might already be an object
  }

  res.json({ success: true, resume });
});

// @route   PUT /api/resumes/:id
// @desc    Update a resume
// @access  Private
router.put('/:id', protect, updateResumeValidation, handleValidationErrors, (req, res) => {
  try {
    const { title, content, templateId, atsScore, keywordsMatched } = req.body;
    const db = getDB();

    const existing = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    db.prepare(`
      UPDATE resumes
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          template_id = COALESCE(?, template_id),
          ats_score = COALESCE(?, ats_score),
          keywords_matched = COALESCE(?, keywords_matched),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      content ? JSON.stringify(content) : null,
      templateId,
      atsScore,
      keywordsMatched ? JSON.stringify(keywordsMatched) : null,
      req.params.id
    );

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);

    res.json({ success: true, message: 'Resume updated', resume });
  } catch (error) {
    logger.error('Update resume error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/resumes/:id
// @desc    Delete a resume
// @access  Private
router.delete('/:id', protect, (req, res) => {
  try {
    const db = getDB();
    const existing = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    db.prepare('DELETE FROM resumes WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE users SET resumes_count = MAX(0, resumes_count - 1) WHERE id = ?').run(req.user.id);

    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    logger.error('Delete resume error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/resumes/:id/duplicate
// @desc    Duplicate a resume
// @access  Private
router.post('/:id/duplicate', protect, (req, res) => {
  try {
    const db = getDB();
    const existing = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const newSlug = `${existing.slug}-copy-${Date.now()}`;
    const newTitle = `${existing.title} (Copy)`;

    const result = db.prepare(`
      INSERT INTO resumes (user_id, title, slug, content, template_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, newTitle, newSlug, existing.content, existing.template_id);

    db.prepare('UPDATE users SET resumes_count = resumes_count + 1 WHERE id = ?').run(req.user.id);

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, message: 'Resume duplicated', resume });
  } catch (error) {
    logger.error('Duplicate resume error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/resumes/:id/export/:format
// @desc    Export resume (pdf, json)
// @access  Private
router.get('/:id/export/:format', protect, (req, res) => {
  try {
    const { id, format } = req.params;
    const db = getDB();
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?')
      .get(id, req.user.id);

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.slug}.json"`);
      res.send(resume.content);
    } else {
      res.status(400).json({ success: false, message: 'Unsupported format' });
    }
  } catch (error) {
    logger.error('Export resume error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
