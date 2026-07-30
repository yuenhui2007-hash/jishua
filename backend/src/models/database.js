/**
 * Database Layer - SQLite3 with async wrapper
 * Uses sqlite3 (prebuilt binaries, no compilation needed)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/resumeai.db');

let db = null;

// Promise wrapper for sqlite3
class AsyncDatabase {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) logger.error('❌ Database open error:', err.message);
      else logger.info('📦 Connected to SQLite database');
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

function connectDB() {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new AsyncDatabase(DB_PATH);
    initTables();
    return db;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    return connectDB();
  }
  return db;
}

async function initTables() {
  const d = getDB();

  // Users table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      plan TEXT DEFAULT 'free',
      plan_expires_at DATETIME,
      resumes_count INTEGER DEFAULT 0,
      templates_count INTEGER DEFAULT 0,
      ai_generations_used INTEGER DEFAULT 0,
      ai_generations_limit INTEGER DEFAULT 5,
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Resumes table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      content TEXT NOT NULL,
      template_id TEXT DEFAULT 'default',
      ats_score INTEGER,
      keywords_matched TEXT,
      is_public INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Templates table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      agent TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      preview_image TEXT,
      css_styles TEXT,
      html_structure TEXT,
      is_premium INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI Generations log
  await d.exec(`
    CREATE TABLE IF NOT EXISTS ai_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      prompt TEXT,
      result TEXT,
      tokens_used INTEGER,
      cost REAL,
      duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Payments table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stripe_payment_intent_id TEXT,
      stripe_subscription_id TEXT,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'usd',
      status TEXT NOT NULL,
      plan TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // API Keys
  await d.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key_hash TEXT NOT NULL,
      name TEXT,
      last_used_at DATETIME,
      expires_at DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Activity log
  await d.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      metadata TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders tables
  await d.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      company TEXT,
      plan TEXT NOT NULL,
      service_type TEXT NOT NULL,
      payment_method TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await d.exec(`
    CREATE TABLE IF NOT EXISTS order_concepts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      concept_content TEXT NOT NULL,
      ai_agent TEXT,
      tokens_used INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  logger.info('✅ Database tables initialized (including orders)');
  await seedTemplates();
  await seedAdmin();
}

async function seedTemplates() {
  const d = getDB();
  const row = await d.get('SELECT COUNT(*) as count FROM templates');

  if (row.count === 0) {
    const templates = [
      { name: 'Executive Prime', slug: 'executive-prime', agent: 'aurelius', category: 'executive', description: 'Boardroom-ready template with commanding presence', is_premium: 0 },
      { name: 'Visionary Split', slug: 'visionary-split', agent: 'nova', category: 'creative', description: 'Bold split-layout for creative professionals', is_premium: 0 },
      { name: 'Stack Matrix', slug: 'stack-matrix', agent: 'cipher', category: 'technical', description: 'ATS-optimized template for tech roles', is_premium: 0 },
      { name: 'Swiss Pure', slug: 'swiss-pure', agent: 'luna', category: 'minimal', description: 'Swiss-inspired minimalist elegance', is_premium: 1 },
      { name: 'Narrative Flow', slug: 'narrative-flow', agent: 'phoenix', category: 'career-change', description: 'Designed for career pivots and reinventions', is_premium: 1 },
      { name: 'Scholar Formal', slug: 'scholar-formal', agent: 'atlas', category: 'academic', description: 'Formal credentials-forward academic CV', is_premium: 1 },
    ];

    for (const t of templates) {
      await d.run(
        'INSERT INTO templates (name, slug, agent, category, description, is_premium) VALUES (?, ?, ?, ?, ?, ?)',
        [t.name, t.slug, t.agent, t.category, t.description, t.is_premium]
      );
    }
    logger.info('🌱 Seeded default templates');
  }
}

async function seedAdmin() {
  const d = getDB();
  const bcrypt = require('bcryptjs');

  const existing = await d.get('SELECT id FROM users WHERE email = ?', ['admin@yh.studio']);
  if (existing) {
    logger.info('👤 Default admin already exists');
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('YHStudio2024!', salt);

    await d.run(
      'INSERT INTO users (email, password, first_name, last_name, role, plan, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['admin@yh.studio', hashedPassword, 'Admin', 'User', 'admin', 'enterprise', 1]
    );
    logger.info('👤 Default admin created: admin@yh.studio / YHStudio2024!');
  } catch (error) {
    logger.error('❌ Failed to seed admin:', error.message);
  }
}

module.exports = { connectDB, getDB };
