/**
 * ResumeAI Pro - Backend Server
 * Express API with security, auth, AI integration, payments
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const hpp = require('hpp');
const path = require('path');

const { connectDB } = require('./models/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const resumeRoutes = require('./routes/resumes');
const templateRoutes = require('./routes/templates');
const aiRoutes = require('./routes/ai');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet - secure HTTP headers (relaxed for API server)
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API server (not serving HTML)
  crossOriginEmbedderPolicy: false,
}));

// CORS — allow GitHub Pages and localhost for dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://yuenhui2007-hash.github.io',
  'https://yuenhui2007-hash.github.io/jishua',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    // In production, you might want to block unknown origins
    // For now, log and allow (easier debugging)
    logger.warn(`CORS: Origin not in allowlist: ${origin}`);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ==========================================
// STATIC FILES
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

// ==========================================
// ERROR HANDLING
// ==========================================
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ==========================================
// STARTUP VALIDATION
// ==========================================
function validateStartup() {
  const required = ['JWT_SECRET'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    logger.warn(`⚠️ Missing env vars: ${missing.join(', ')} — using defaults (OK for dev, NOT for production)`);
  }
  // Ensure JWT_SECRET has a fallback for dev
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'yh-dev-secret-change-in-production-2024';
  }
}
validateStartup();

// ==========================================
// START SERVER
// ==========================================
try {
  connectDB();

  app.listen(PORT, () => {
    logger.info(`✅ YH Backend running on port ${PORT}`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 CORS allowed origin: ${process.env.FRONTEND_URL || '*'}`);
    logger.info(`📦 Database: ${process.env.DB_PATH || './data/resumeai.db'}`);
  });
} catch (err) {
  logger.error('❌ FATAL: Could not start server:', err.message);
  process.exit(1);
}

module.exports = app;
