/**
 * YH Backend - Simple JSON-based API
 * Zero compilation needed. Works on any computer.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'yh-dev-secret-2024';

// JSON file storage
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  return { orders: [], users: [], concepts: [] };
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = loadDB();

// Seed default admin
async function seedAdmin() {
  const admin = db.users.find(u => u.email === 'admin@yh.studio');
  if (!admin) {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('YHStudio2024!', salt);
    db.users.push({
      id: 1,
      email: 'admin@yh.studio',
      password: hash,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      plan: 'enterprise',
      created_at: new Date().toISOString()
    });
    saveDB(db);
    console.log('👤 Default admin created: admin@yh.studio / YHStudio2024!');
  }
}

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true); // Allow all origins for simplicity
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Auth middleware
function protect(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin only' });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { ...user, password: undefined } });
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json({ success: true, user: { ...req.user, password: undefined } });
});

// Order routes (PUBLIC - anyone can submit)
app.post('/api/orders', (req, res) => {
  const { name, email, phone, plan, payment_method, message, company } = req.body;
  if (!name || !email || !plan) {
    return res.status(400).json({ success: false, message: 'Name, email, plan required' });
  }

  const serviceMap = {
    'resume-pro': 'Resume Builder Pro',
    'resume-premium': 'Resume Builder Premium',
    'student-pro': 'Student Career Pro',
    'recruitment-pay': 'Recruitment - Pay Per Hire',
    'recruitment-growth': 'Recruitment Growth',
    'hr-team': 'HR Services Team',
    'hr-business': 'HR Services Business',
  };

  const order = {
    id: db.orders.length + 1,
    order_id: 'YH-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    customer_name: name,
    customer_email: email,
    customer_phone: phone || null,
    company: company || null,
    plan,
    service_type: serviceMap[plan] || plan,
    payment_method: payment_method || null,
    message: message || null,
    status: 'pending',
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.orders.push(order);
  saveDB(db);
  console.log(`📦 New order: ${order.order_id} - ${name} - ${order.service_type}`);

  res.json({ success: true, orderId: order.order_id, message: 'Order received!' });
});

// Order routes (ADMIN ONLY)
app.get('/api/orders', protect, adminOnly, (req, res) => {
  const status = req.query.status;
  let orders = db.orders;
  if (status) orders = orders.filter(o => o.status === status);
  orders = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ success: true, orders, total: orders.length });
});

app.get('/api/orders/:id', protect, adminOnly, (req, res) => {
  const order = db.orders.find(o => o.id == req.params.id || o.order_id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Not found' });
  const concepts = db.concepts.filter(c => c.order_id === order.id);
  res.json({ success: true, order, concepts });
});

app.put('/api/orders/:id/status', protect, adminOnly, (req, res) => {
  const { status } = req.body;
  const order = db.orders.find(o => o.id == req.params.id || o.order_id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Not found' });
  order.status = status;
  order.updated_at = new Date().toISOString();
  saveDB(db);
  res.json({ success: true });
});

// AI Concept generation
app.post('/api/orders/:id/concept', protect, adminOnly, async (req, res) => {
  const order = db.orders.find(o => o.id == req.params.id || o.order_id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Not found' });

  let agentStyle = 'general_specialist';
  let content = '';

  if (order.service_type.includes('Resume')) {
    agentStyle = 'resume_designer';
    content = `# AI Resume Concept for ${order.customer_name}\n\n## Personal Brand\nProfessional with expertise in delivering results through strategic thinking.\n\n## Professional Summary\nDynamic professional with proven track record of leading teams and optimizing processes.\n\n## Skills\n- Strategic Planning, Project Management, Team Leadership\n- Technical: [Relevant tools]\n\n## Experience Format\n**[Role]** | [Company] | [Dates]\n- Led initiatives resulting in [quantifiable achievement]\n- Managed teams of [number] members\n\n## Education\n**[Degree]** in [Field]\n[University], [Year]\n\n*Generated by YH AI - Resume Designer Agent*`;
  } else if (order.service_type.includes('Recruitment')) {
    agentStyle = 'recruitment_strategist';
    content = `# Recruitment Strategy for ${order.company || order.customer_name}\n\n## Screening Criteria\n- Technical skills assessment\n- Cultural fit scoring\n- Experience validation\n\n## Candidate Scoring (0-100)\n- Skills Match: 35pts\n- Culture Fit: 25pts\n- Experience: 20pts\n- Potential: 20pts\n\n## Interview Framework\n1. Phone Screen (30 min)\n2. Technical Interview (60 min)\n3. Cultural Interview (45 min)\n4. Final Round (60 min)\n\n*Generated by YH AI - Recruitment Strategist Agent*`;
  } else if (order.service_type.includes('Student')) {
    agentStyle = 'student_advisor';
    content = `# Student Career Concept for ${order.customer_name}\n\n## Resume Template - Student Edition\n### Target: Entry-Level / Internship\n\n**Education (Priority 1)**\n- Degree, University, Expected Graduation\n- GPA, Relevant Coursework\n\n**Projects (Priority 2)**\n- Project Name | Technologies\n- Description with outcomes\n\n**Experience**\n- Internships, leadership roles\n\n## Internship Prep Plan\n- Week 1-2: Research companies\n- Week 3-4: Submit applications\n- Week 5-6: Interview prep\n\n*Generated by YH AI - Student Advisor Agent*`;
  } else if (order.service_type.includes('HR')) {
    agentStyle = 'hr_consultant';
    content = `# HR Transformation for ${order.company || order.customer_name}\n\n## Smart Screening Workflow\n1. Multi-format upload\n2. AI data extraction\n3. Match scoring\n4. Candidate ranking\n5. Shortlisting\n\n## Onboarding Automation\n- Day 0: Offer letter, background check, welcome email\n- Day 1: Digital orientation, benefits enrollment\n- Week 1: Training modules, goal setting\n\n## Analytics Dashboard\n- Attrition prediction\n- Skill gap analysis\n- Engagement scores\n\n*Generated by YH AI - HR Consultant Agent*`;
  } else {
    content = `# Custom Concept for ${order.customer_name}\n\n## Order Summary\n- Service: ${order.service_type}\n- Plan: ${order.plan}\n- Date: ${new Date().toISOString().split('T')[0]}\n\n## Deliverables\n1. Professional assessment\n2. Customized solution\n3. Implementation timeline\n4. Quality assurance\n\n*Generated by YH AI - General Specialist Agent*`;
  }

  const concept = {
    id: db.concepts.length + 1,
    order_id: order.id,
    concept_content: content,
    ai_agent: agentStyle,
    tokens_used: 0,
    duration_ms: 500,
    status: 'draft',
    created_at: new Date().toISOString()
  };

  db.concepts.push(concept);
  order.status = 'concept_ready';
  order.updated_at = new Date().toISOString();
  saveDB(db);

  res.json({ success: true, concept: content, agent: agentStyle, message: 'AI concept generated!' });
});

// Admin stats
app.get('/api/admin/stats', protect, adminOnly, (req, res) => {
  const stats = {
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter(o => o.status === 'pending').length,
    processingOrders: db.orders.filter(o => o.status === 'processing').length,
    completedOrders: db.orders.filter(o => o.status === 'completed' || o.status === 'approved').length,
    totalUsers: db.users.length,
    totalConcepts: db.concepts.length,
    totalRevenue: 0,
    recentOrders: db.orders.slice(-10).reverse(),
    ordersByStatus: [],
    ordersByService: []
  };
  res.json({ success: true, stats });
});

app.get('/api/admin/clients', protect, adminOnly, (req, res) => {
  const clients = {};
  db.orders.forEach(o => {
    if (!clients[o.customer_email]) {
      clients[o.customer_email] = {
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        company: o.company,
        order_count: 0,
        last_order: o.created_at
      };
    }
    clients[o.customer_email].order_count++;
    if (o.created_at > clients[o.customer_email].last_order) {
      clients[o.customer_email].last_order = o.created_at;
    }
  });
  res.json({ success: true, clients: Object.values(clients) });
});

// Start
seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ YH Backend running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Data file: ${DB_FILE}`);
    console.log(`🔐 Admin: admin@yh.studio / YHStudio2024!`);
  });
});
