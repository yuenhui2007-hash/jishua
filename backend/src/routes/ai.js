const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

let openai, anthropic;
try {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch { /* optional */ }

try {
  const Anthropic = require('@anthropic-ai/sdk');
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} catch { /* optional */ }

async function generateWithAI(prompt, type, model = null) {
  const provider = model || process.env.AI_PROVIDER || 'openai';
  
  try {
    if (provider === 'openai' && openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: `You are an expert resume writer. Generate professional ${type} content.` },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });
      return {
        text: response.choices[0].message.content,
        model: 'gpt-4o',
        tokens: response.usage?.total_tokens || 0
      };
    }
    
    if (provider === 'anthropic' && anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });
      return {
        text: response.content[0].text,
        model: 'claude-3-sonnet',
        tokens: response.usage?.input_tokens + response.usage?.output_tokens || 0
      };
    }
    
    throw new Error('No AI provider available');
  } catch (err) {
    // Try fallback
    const fallback = process.env.AI_FALLBACK_PROVIDER;
    if (fallback && fallback !== provider) {
      return generateWithAI(prompt, type, fallback);
    }
    throw err;
  }
}

router.post('/generate', authenticateToken, [
  body('type').isIn(['summary', 'experience', 'skills', 'template', 'ats_optimize']),
  body('prompt').trim().isLength({ min: 1 }),
  body('jobTitle').optional().trim(),
  body('skills').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { type, prompt, jobTitle, skills } = req.body;
    const fullPrompt = jobTitle && skills 
      ? `Job Title: ${jobTitle}\nSkills: ${skills}\n\n${prompt}`
      : prompt;

    const result = await generateWithAI(fullPrompt, type);
    
    db.prepare('INSERT INTO ai_generations (user_id, type, prompt, result, model_used, tokens_used) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, type, fullPrompt, result.text, result.model, result.tokens);

    res.json({ result: result.text, model: result.model, tokens: result.tokens });
  } catch (err) {
    console.error('AI generation error:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

router.post('/optimize-ats', authenticateToken, [
  body('resumeContent').trim().isLength({ min: 1 }),
  body('jobDescription').trim().isLength({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { resumeContent, jobDescription } = req.body;
    const prompt = `Optimize this resume for ATS (Applicant Tracking System) based on the job description. Return a JSON object with keys: optimizedResume (string), score (number 0-100), matchedKeywords (array), missingKeywords (array), suggestions (array).

Resume:
${resumeContent}

Job Description:
${jobDescription}`;

    const result = await generateWithAI(prompt, 'ats_optimize');
    
    let parsed;
    try {
      parsed = JSON.parse(result.text.replace(/```json\n?|```\n?/g, ''));
    } catch {
      parsed = { optimizedResume: result.text, score: 75, matchedKeywords: [], missingKeywords: [], suggestions: [] };
    }

    db.prepare('INSERT INTO ai_generations (user_id, type, prompt, result, model_used, tokens_used) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, 'ats_optimize', prompt, JSON.stringify(parsed), result.model, result.tokens);

    res.json(parsed);
  } catch (err) {
    console.error('ATS optimization error:', err);
    res.status(500).json({ error: 'Failed to optimize resume' });
  }
});

module.exports = router;
