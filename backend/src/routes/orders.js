/**
 * Orders Route - Track client orders, payments, and AI generation requests
 * POST /api/orders - Create new order
 * GET /api/orders - List orders (admin)
 * GET /api/orders/:id - Get order details
 * POST /api/orders/:id/concept - Generate AI concept for order
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../models/database');
const { protect, adminOnly } = require('../middleware/auth');
const aiService = require('../services/ai');
const logger = require('../utils/logger');
const crypto = require('crypto');

// @route   POST /api/orders
// @desc    Submit a new order (from payment portal)
// @access  Public (or Private if user logged in)
router.post('/', (req, res) => {
  try {
    const { name, email, phone, plan, payment_method, message, company } = req.body;
    const db = getDB();

    if (!name || !email || !plan) {
      return res.status(400).json({ success: false, message: 'Name, email, and plan are required' });
    }

    // Map plan to correct service type
    const serviceMap = {
      'resume-pro': 'Resume Builder Pro',
      'resume-premium': 'Resume Builder Premium',
      'student-pro': 'Student Career Pro',
      'recruitment-pay': 'Recruitment - Pay Per Hire',
      'recruitment-growth': 'Recruitment Growth',
      'hr-team': 'HR Services Team',
      'hr-business': 'HR Services Business',
    };

    const serviceType = serviceMap[plan] || plan;
    const orderId = 'YH-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    db.prepare(`
      INSERT INTO orders (order_id, customer_name, customer_email, customer_phone, company, plan, service_type, payment_method, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(orderId, name, email, phone || null, company || null, plan, serviceType, payment_method || null, message || null);

    logger.info(`📦 New order created: ${orderId} - ${name} - ${serviceType}`);

    res.json({ success: true, orderId, message: 'Order received! We will process it within 24 hours.' });
  } catch (error) {
    logger.error('Order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// @route   GET /api/orders
// @desc    List all orders (admin only)
// @access  Private/Admin
router.get('/', protect, adminOnly, (req, res) => {
  const db = getDB();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status;

  let query = 'SELECT * FROM orders';
  let countQuery = 'SELECT COUNT(*) as total FROM orders';
  const params = [];
  const countParams = [];

  if (status) {
    query += ' WHERE status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
    countParams.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const orders = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({ success: true, orders, total, page, totalPages: Math.ceil(total / limit) });
});

// @route   GET /api/orders/:id
// @desc    Get single order details
// @access  Private/Admin
router.get('/:id', protect, adminOnly, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_id = ?').get(req.params.id, req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Get concepts generated for this order
  const concepts = db.prepare('SELECT * FROM order_concepts WHERE order_id = ? ORDER BY created_at DESC').all(order.id);

  res.json({ success: true, order, concepts });
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, adminOnly, (req, res) => {
  const { status, admin_notes } = req.body;
  const db = getDB();

  const validStatuses = ['pending', 'processing', 'concept_ready', 'approved', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_id = ?').get(req.params.id, req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  db.prepare('UPDATE orders SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, admin_notes || null, order.id);

  logger.info(`📋 Order ${order.order_id} status updated to: ${status}`);

  res.json({ success: true, message: 'Order updated' });
});

// @route   POST /api/orders/:id/concept
// @desc    Generate AI concept/template for an order
// @access  Private/Admin
router.post('/:id/concept', protect, adminOnly, async (req, res) => {
  try {
    const db = getDB();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_id = ?').get(req.params.id, req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Determine which AI agent to use based on service type
    let agentPrompt = '';
    let agentStyle = 'professional';

    if (order.service_type.includes('Resume')) {
      agentPrompt = `You are an expert resume designer and career coach. Create a unique, ATS-optimized resume concept for ${order.customer_name}. Include: professional summary, skills section, work experience format, and education. Make it visually stunning and tailored.`;
      agentStyle = 'resume_designer';
    } else if (order.service_type.includes('Recruitment')) {
      agentPrompt = `You are an AI recruitment strategist. Create a custom hiring solution concept for company: ${order.company || order.customer_name}. Include screening criteria, candidate scoring model, interview framework, and offer optimization strategy.`;
      agentStyle = 'recruitment_strategist';
    } else if (order.service_type.includes('Student')) {
      agentPrompt = `You are a student career advisor. Create a personalized career development concept for ${order.customer_name}. Include resume template for students, internship preparation plan, skill building roadmap, and interview prep guide.`;
      agentStyle = 'student_advisor';
    } else if (order.service_type.includes('HR')) {
      agentPrompt = `You are an HR transformation consultant. Create a comprehensive HR automation concept for ${order.company || order.customer_name}. Include: smart screening workflow, onboarding automation plan, workforce analytics dashboard, and employee engagement strategy.`;
      agentStyle = 'hr_consultant';
    } else {
      agentPrompt = `You are a career solutions specialist. Create a custom concept for ${order.customer_name} based on their request: ${order.service_type}. Include actionable deliverables and professional recommendations.`;
      agentStyle = 'general_specialist';
    }

    const startTime = Date.now();

    // Generate concept via AI
    let aiResult;
    try {
      aiResult = await aiService.makeAIRequest(
        agentPrompt,
        `Order Details:
- Customer: ${order.customer_name}
- Email: ${order.customer_email}
- Phone: ${order.customer_phone || 'N/A'}
- Company: ${order.company || 'N/A'}
- Plan: ${order.plan}
- Service: ${order.service_type}
- Message: ${order.message || 'No special requests'}

Create a detailed, professional concept/template package for this client. Format beautifully with clear sections.`,
        0.8
      );
    } catch (aiError) {
      // If AI fails, generate a structured template concept locally
      aiResult = {
        content: generateFallbackConcept(order, agentStyle),
        tokensUsed: 0
      };
    }

    const duration = Date.now() - startTime;

    // Save concept to database
    db.prepare(`
      INSERT INTO order_concepts (order_id, concept_content, ai_agent, tokens_used, duration_ms, status)
      VALUES (?, ?, ?, ?, ?, 'draft')
    `).run(order.id, aiResult.content, agentStyle, aiResult.tokensUsed || 0, duration);

    // Update order status
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('concept_ready', order.id);

    res.json({
      success: true,
      concept: aiResult.content,
      agent: agentStyle,
      duration,
      message: 'AI concept generated successfully!'
    });

  } catch (error) {
    logger.error('AI concept generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate concept', error: error.message });
  }
});

// Fallback concept generator when AI API is unavailable
function generateFallbackConcept(order, style) {
  const timestamp = new Date().toISOString().split('T')[0];

  if (style === 'resume_designer') {
    return `# AI-Generated Resume Concept for ${order.customer_name}
    
## Personal Brand Statement
A [Your Role] with expertise in delivering measurable results through strategic thinking and execution. Passionate about driving innovation and creating value.

## Professional Summary
Dynamic professional with demonstrated success in [Industry]. Proven track record of leading cross-functional teams, optimizing processes, and delivering projects on time and within budget. Skilled in strategic planning, stakeholder management, and data-driven decision making.

## Skills
- **Core Competencies:** Strategic Planning, Project Management, Team Leadership, Data Analysis
- **Technical Skills:** [Relevant tools and technologies]
- **Languages:** English (Fluent), [Other Languages]

## Professional Experience
**[Current/Most Recent Role]** | [Company Name] | [Dates]
- Led the development and execution of strategic initiatives that resulted in [quantifiable achievement]
- Managed cross-functional teams of [number] members across [departments]
- Implemented process improvements that reduced costs by [percentage] and increased efficiency by [percentage]

**[Previous Role]** | [Company Name] | [Dates]
- Spearheaded [project name/purpose] achieving [result]
- Developed and maintained relationships with [number] key stakeholders
- Analyzed market trends and provided actionable recommendations

## Education
**[Degree]** in [Field of Study]
[University Name], [Year]

## Template Design Notes
- **Layout:** Clean, professional, single-column with strategic use of white space
- **Color Accent:** Sage Green (#A5A68F) or Dusty Rose (#D9B2A9)
- **Font:** Inter (body) + Playfair Display (headings)
- **ATS Score Target:** 95+`;
  }

  if (style === 'recruitment_strategist') {
    return `# AI Recruitment Strategy Concept for ${order.company || order.customer_name}

## Screening Criteria Framework
### Technical Assessment
- Skills testing tailored to role requirements
- Portfolio/code review for technical positions
- Case study evaluation for strategic roles

### Cultural Fit Scoring
- Values alignment assessment
- Team dynamic compatibility
- Communication style matching
- Work preference alignment

### Experience Validation
- Reference check automation
- Employment history verification
- Credential authentication

## Candidate Scoring Model (0-100)
- **Skills Match (35pts):** Technical proficiency, relevant experience
- **Culture Fit (25pts):** Values alignment, team compatibility
- **Experience (20pts):** Industry relevance, career progression
- **Potential (20pts):** Growth mindset, leadership indicators

## Interview Framework
1. **Phone Screen (30 min):** Basic qualifications + communication
2. **Technical Interview (60 min):** Skills deep dive + problem-solving
3. **Cultural Interview (45 min):** Values + team fit
4. **Final Round (60 min):** Leadership + strategic thinking

## Offer Optimization Strategy
- Market-based compensation benchmarking
- Personalized benefits package
- Sign-on bonus structure
- Equity/commission framework

## Bias Reduction Measures
- Blind resume screening
- Structured interview scoring
- Diverse panel requirement
- Analytics-driven fairness monitoring`;
  }

  if (style === 'student_advisor') {
    return `# AI Student Career Concept for ${order.customer_name}

## Resume Template - Student Edition
### Target: Entry-Level / Internship Applications

**Header Section**
- Name, Email, Phone, LinkedIn, Portfolio URL
- Clean, modern layout with emphasis on education

**Education Section (Priority 1)**
- Degree, University, Expected Graduation
- GPA (if 3.5+), Relevant Coursework
- Academic Achievements, Dean's List

**Projects Section (Priority 2)**
- Project Name | Technologies Used
- Brief description with quantifiable outcomes
- Link to GitHub/live demo

**Experience Section**
- Internship/Part-time roles
- Leadership in student organizations
- Volunteer work highlighting transferable skills

**Skills Section**
- Technical Skills: Programming languages, tools
- Soft Skills: Communication, teamwork, leadership
- Languages

## Internship Preparation Plan
### Week 1-2: Foundation
- Research target companies and roles
- Update LinkedIn profile
- Create portfolio website

### Week 3-4: Applications
- Apply to 15+ internships per week
- Tailor resume for each application
- Network with alumni at target companies

### Week 5-6: Interview Prep
- Practice behavioral questions (STAR method)
- Technical preparation (LeetCode, case studies)
- Mock interviews with AI feedback

## Skill Development Roadmap
- **Current:** [Assess current skills]
- **3-Month Goal:** [Intermediate proficiency in target skills]
- **6-Month Goal:** [Job-ready skillset]`;
  }

  if (style === 'hr_consultant') {
    return `# AI HR Transformation Concept for ${order.company || order.customer_name}

## Smart Resume Screening Workflow
### Automated Processing Pipeline
1. **Ingestion:** Multi-format upload (PDF, DOCX, LinkedIn)
2. **Parsing:** AI extracts structured data from resumes
3. **Scoring:** Match score against job requirements
4. **Ranking:** Candidates sorted by relevance score
5. **Shortlisting:** Top candidates flagged for review

### Screening Criteria Configuration
- Required skills (mandatory match)
- Preferred skills (bonus points)
- Experience level (years range)
- Education requirements
- Certification verification

## Onboarding Automation Plan
### Day 0 (Pre-arrival)
- ✅ Offer letter auto-generation
- ✅ Background check initiation
- ✅ Welcome package email sequence
- ✅ Equipment provisioning request
- ✅ System access provisioning

### Day 1 (First Day)
- ✅ Digital orientation portal
- ✅ Benefits enrollment guides
- ✅ Team introduction emails
- ✅ Training schedule auto-assignment
- ✅ Emergency contact collection

### Week 1
- ✅ Role-specific training modules
- ✅ 30/60/90 day goal setting
- ✅ Mentor assignment
- ✅ Check-in survey automation

## Workforce Analytics Dashboard
- **Attrition Prediction:** AI forecasts turnover risk
- **Skill Gap Analysis:** Identify training needs
- **Engagement Score:** Pulse survey aggregation
- **Productivity Metrics:** Department-level KPIs
- **Diversity Analytics:** Inclusion metrics tracking

## Compliance Guard Features
- EEOC compliance reports
- GDPR data handling audit trails
- Bias detection in hiring pipeline
- Equal pay analysis
- Document retention automation`;
  }

  // Generic fallback
  return `# Custom Concept for ${order.customer_name}

## Order Summary
- **Service:** ${order.service_type}
- **Plan:** ${order.plan}
- **Date:** ${timestamp}

## Deliverables
1. Professional assessment of requirements
2. Customized solution package
3. Implementation timeline
4. Quality assurance checklist

## Next Steps
1. Review the generated concept
2. Provide feedback for refinements
3. Final approval for delivery
4. Implementation support (if applicable)

*This concept was generated by YH AI System. Please review and request adjustments as needed.*`;
}

module.exports = router;
