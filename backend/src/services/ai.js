/**
 * AI Service Layer
 * Integrates with OpenAI and Anthropic APIs
 */

const axios = require('axios');
const logger = require('../utils/logger');

const PROVIDER = process.env.AI_PROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

/**
 * Make AI request with fallback
 */
async function makeAIRequest(systemPrompt, userPrompt, temperature = 0.7) {
  const providers = [];

  if (PROVIDER === 'openai' && OPENAI_API_KEY) {
    providers.push('openai');
  }
  if (PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
    providers.push('anthropic');
  }

  // Fallback order
  if (providers.length === 0) {
    if (OPENAI_API_KEY) providers.push('openai');
    if (ANTHROPIC_API_KEY) providers.push('anthropic');
  }

  for (const provider of providers) {
    try {
      if (provider === 'openai') {
        return await callOpenAI(systemPrompt, userPrompt, temperature);
      } else {
        return await callAnthropic(systemPrompt, userPrompt, temperature);
      }
    } catch (error) {
      logger.warn(`${provider} API failed:`, error.message);
      continue;
    }
  }

  throw new Error('All AI providers failed');
}

async function callOpenAI(systemPrompt, userPrompt, temperature) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 2000,
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return {
    content: response.data.choices[0].message.content,
    tokensUsed: response.data.usage?.total_tokens || 0,
  };
}

async function callAnthropic(systemPrompt, userPrompt, temperature) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    },
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return {
    content: response.data.content[0].text,
    tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0,
  };
}

/**
 * Generate professional summary
 */
async function generateSummary(data, agent = 'default') {
  const systemPrompt = `You are an expert resume writer. Write a compelling 3-4 sentence professional summary. Be concise, use strong action verbs, and quantify achievements where possible.`;

  const userPrompt = `Create a professional summary for someone with:
- Job Title: ${data.jobTitle || 'Professional'}
- Experience: ${data.yearsExperience || 'Several'} years
- Key Skills: ${data.skills?.join(', ') || 'Various skills'}
- Industry: ${data.industry || 'Technology'}
${data.achievements ? `- Key Achievements: ${data.achievements}` : ''}

Style: ${agent === 'aurelius' ? 'Executive, authoritative' : agent === 'nova' ? 'Creative, bold' : agent === 'cipher' ? 'Technical, precise' : agent === 'luna' ? 'Minimal, elegant' : agent === 'phoenix' ? 'Transformation-focused' : agent === 'atlas' ? 'Academic, formal' : 'Professional'}`;

  return makeAIRequest(systemPrompt, userPrompt, 0.7);
}

/**
 * Generate experience bullet points
 */
async function generateExperience(data, agent = 'default') {
  const systemPrompt = `You are an expert resume writer. Create 3-4 powerful bullet points for a work experience entry. Use the STAR method. Quantify results with numbers. Start each bullet with a strong action verb.`;

  const userPrompt = `Write experience bullet points for:
- Job Title: ${data.jobTitle}
- Company: ${data.company}
- Description: ${data.description || ''}
- Duration: ${data.duration || ''}

Style: ${agent === 'aurelius' ? 'Executive leadership focus' : agent === 'nova' ? 'Creative impact focus' : agent === 'cipher' ? 'Technical achievement focus' : 'Professional'}`;

  return makeAIRequest(systemPrompt, userPrompt, 0.7);
}

/**
 * Generate skills based on job description
 */
async function generateSkills(data, jobDescription = '') {
  const systemPrompt = `You are a career coach. Analyze the provided information and suggest relevant skills. Categorize into: Technical, Soft Skills, and Tools. Return as a structured list.`;

  const userPrompt = `Current skills: ${data.currentSkills?.join(', ') || 'None listed'}
${jobDescription ? `Target job description: ${jobDescription.substring(0, 2000)}` : ''}

Suggest the most important skills to include on a resume for this profile.`;

  return makeAIRequest(systemPrompt, userPrompt, 0.6);
}

/**
 * Generate full resume
 */
async function generateFullResume(data, agent = 'default') {
  const systemPrompt = `You are an expert resume writer. Generate a complete, polished resume in JSON format. Include: contact info, summary, experience, education, skills. Make it ATS-friendly.`;

  const userPrompt = `Generate a complete resume for:
${JSON.stringify(data, null, 2)}

Style Agent: ${agent}
Return as a JSON object with these keys: contact, summary, experience (array), education (array), skills (array), certifications (optional).`;

  const result = await makeAIRequest(systemPrompt, userPrompt, 0.7);

  // Try to parse JSON from response
  try {
    const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return { content: parsed, tokensUsed: result.tokensUsed };
    }
  } catch (e) {
    // Return raw content if JSON parsing fails
  }

  return result;
}

/**
 * Optimize resume for ATS
 */
async function optimizeForATS(resumeContent, jobDescription) {
  const systemPrompt = `You are an ATS optimization expert. Analyze the resume against the job description and provide specific improvements. Return JSON with: optimizedContent, keywordsToAdd, keywordsFound, atsScore (0-100), suggestions (array).`;

  const userPrompt = `Job Description:\n${jobDescription?.substring(0, 3000) || 'Not provided'}\n\nResume Content:\n${typeof resumeContent === 'string' ? resumeContent : JSON.stringify(resumeContent)}\n\nOptimize this resume for ATS. Identify missing keywords and suggest improvements.`;

  const result = await makeAIRequest(systemPrompt, userPrompt, 0.5);

  try {
    const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { content: JSON.parse(jsonMatch[1] || jsonMatch[0]), tokensUsed: result.tokensUsed };
    }
  } catch (e) {
    logger.warn('Failed to parse ATS optimization JSON');
  }

  return result;
}

/**
 * Analyze job match
 */
async function analyzeJobMatch(resumeData, jobDescription) {
  const systemPrompt = `You are a career advisor. Analyze how well the resume matches the job description. Return JSON with: matchScore (0-100), strongMatches (array), gaps (array), recommendations (array).`;

  const userPrompt = `Job Description:\n${jobDescription?.substring(0, 3000)}\n\nResume:\n${JSON.stringify(resumeData)}\n\nAnalyze the match and provide actionable recommendations.`;

  const result = await makeAIRequest(systemPrompt, userPrompt, 0.5);

  try {
    const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { content: JSON.parse(jsonMatch[1] || jsonMatch[0]), tokensUsed: result.tokensUsed };
    }
  } catch (e) {
    logger.warn('Failed to parse job match JSON');
  }

  return result;
}

/**
 * Extract keywords from job description
 */
async function extractKeywords(jobDescription) {
  const systemPrompt = `Extract the most important keywords and skills from this job description. Categorize as: requiredSkills, preferredSkills, tools, certifications, softSkills. Return as JSON.`;

  const userPrompt = jobDescription?.substring(0, 4000) || '';

  const result = await makeAIRequest(systemPrompt, userPrompt, 0.3);

  try {
    const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {
    // Return fallback
  }

  return {
    requiredSkills: [],
    preferredSkills: [],
    tools: [],
    certifications: [],
    softSkills: [],
  };
}

module.exports = {
  generateSummary,
  generateExperience,
  generateSkills,
  generateFullResume,
  optimizeForATS,
  analyzeJobMatch,
  extractKeywords,
};
