/**
 * AI Routes
 * AI-powered resume generation and optimization
 * POST /api/ai/generate
 * POST /api/ai/optimize-ats
 * POST /api/ai/job-match
 * POST /api/ai/summary
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../models/database');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { aiGenerateValidation, handleValidationErrors } = require('../middleware/validator');
const aiService = require('../services/ai');
const logger = require('../utils/logger');

// Check AI generation quota
const checkQuota = (req, res, next) => {
  const db = getDB();
  const user = db.prepare('SELECT ai_generations_used, ai_generations_limit, plan FROM users WHERE id = ?')
    .get(req.user.id);

  if (user.plan === 'free' && user.ai_generations_used >= user.ai_generations_limit) {
    return res.status(429).json({
      success: false,
      message: 'AI generation limit reached for free plan',
      limit: user.ai_generations_limit,
      used: user.ai_generations_used,
      upgradeUrl: '/pricing',
    });
  }
  next();
};

// @route   POST /api/ai/generate
// @desc    Generate resume content with AI
// @access  Private
router.post('/generate', protect, aiLimiter, checkQuota, aiGenerateValidation, handleValidationErrors, async (req, res) => {
  try {
    const { type, data, jobDescription, agent } = req.body;
    const startTime = Date.now();

    let result;
    switch (type) {
      case 'summary':
        result = await aiService.generateSummary(data, agent);
        break;
      case 'experience':
        result = await aiService.generateExperience(data, agent);
        break;
      case 'skills':
        result = await aiService.generateSkills(data, jobDescription);
        break;
      case 'full-resume':
        result = await aiService.generateFullResume(data, agent);
        break;
      case 'ats-optimize':
        result = await aiService.optimizeForATS(data, jobDescription);
        break;
      case 'job-match':
        result = await aiService.analyzeJobMatch(data, jobDescription);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid generation type' });
    }

    const duration = Date.now() - startTime;

    // Log generation
    const db = getDB();
    db.prepare(`
      INSERT INTO ai_generations (user_id, type, prompt, result, tokens_used, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, type, JSON.stringify(data), JSON.stringify(result), result.tokensUsed || 0, duration);

    // Increment user's generation count
    db.prepare('UPDATE users SET ai_generations_used = ai_generations_used + 1 WHERE id = ?')
      .run(req.user.id);

    res.json({
      success: true,
      type,
      result: result.content,
      tokensUsed: result.tokensUsed,
      duration,
    });
  } catch (error) {
    logger.error('AI generation error:', error);
    res.status(500).json({ success: false, message: 'AI generation failed', error: error.message });
  }
});

// @route   POST /api/ai/optimize-ats
// @desc    Optimize resume for ATS
// @access  Private
router.post('/optimize-ats', protect, aiLimiter, checkQuota, async (req, res) => {
  try {
    const { resumeContent, jobDescription } = req.body;
    const startTime = Date.now();

    const result = await aiService.optimizeForATS(resumeContent, jobDescription);
    const duration = Date.now() - startTime;

    const db = getDB();
    db.prepare(`
      INSERT INTO ai_generations (user_id, type, prompt, result, tokens_used, duration_ms)
      VALUES (?, 'ats-optimize', ?, ?, ?, ?)
    `).run(req.user.id, JSON.stringify(resumeContent), JSON.stringify(result), result.tokensUsed || 0, duration);

    db.prepare('UPDATE users SET ai_generations_used = ai_generations_used + 1 WHERE id = ?').run(req.user.id);

    res.json({ success: true, result: result.content, duration });
  } catch (error) {
    logger.error('ATS optimization error:', error);
    res.status(500).json({ success: false, message: 'ATS optimization failed' });
  }
});

// @route   POST /api/ai/extract-keywords
// @desc    Extract keywords from job description
// @access  Private
router.post('/extract-keywords', protect, async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const keywords = await aiService.extractKeywords(jobDescription);
    res.json({ success: true, keywords });
  } catch (error) {
    logger.error('Keyword extraction error:', error);
    res.status(500).json({ success: false, message: 'Keyword extraction failed' });
  }
});

// @route   GET /api/ai/generations
// @desc    Get user's AI generation history
// @access  Private
router.get('/generations', protect, (req, res) => {
  const db = getDB();
  const generations = db.prepare(`
    SELECT id, type, tokens_used, duration_ms, created_at
    FROM ai_generations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user.id);

  res.json({ success: true, generations });
});

module.exports = router;
