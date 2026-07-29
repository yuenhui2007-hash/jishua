/**
 * Database Layer - SQLite with better-sqlite3
 * Fast, synchronous, embedded database perfect for this scale
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/resumeai.db');

let db = null;

function connectDB() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    logger.info('📦 Connected to SQLite database');
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

function initTables() {
  const db = getDB();

  // Users table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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

  // Sessions / API Keys
  db.exec(`
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
  db.exec(`
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

  logger.info('✅ Database tables initialized');
  seedTemplates();
}

function seedTemplates() {
  const db = getDB();
  const count = db.prepare('SELECT COUNT(*) as count FROM templates').get();

  if (count.count === 0) {
    const templates = [
      {
        name: 'Executive Prime',
        slug: 'executive-prime',
        agent: 'aurelius',
        category: 'executive',
        description: 'Boardroom-ready template with commanding presence',
        is_premium: 0,
      },
      {
        name: 'Visionary Split',
        slug: 'visionary-split',
        agent: 'nova',
        category: 'creative',
        description: 'Bold split-layout for creative professionals',
        is_premium: 0,
      },
      {
        name: 'Stack Matrix',
        slug: 'stack-matrix',
        agent: 'cipher',
        category: 'technical',
        description: 'ATS-optimized template for tech roles',
        is_premium: 0,
      },
      {
        name: 'Swiss Pure',
        slug: 'swiss-pure',
        agent: 'luna',
        category: 'minimal',
        description: 'Swiss-inspired minimalist elegance',
        is_premium: 1,
      },
      {
        name: 'Narrative Flow',
        slug: 'narrative-flow',
        agent: 'phoenix',
        category: 'career-change',
        description: 'Designed for career pivots and reinventions',
        is_premium: 1,
      },
      {
        name: 'Scholar Formal',
        slug: 'scholar-formal',
        agent: 'atlas',
        category: 'academic',
        description: 'Formal credentials-forward academic CV',
        is_premium: 1,
      },
    ];

    const insert = db.prepare(`
      INSERT INTO templates (name, slug, agent, category, description, is_premium)
      VALUES (@name, @slug, @agent, @category, @description, @is_premium)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) insert.run(item);
    });

    insertMany(templates);
    logger.info('🌱 Seeded default templates');
  }
}

module.exports = { connectDB, getDB };
