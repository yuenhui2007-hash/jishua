/**
 * Admin Routes - Admin dashboard management
 */

const express = require('express');
const router = express.Router();
const { getDB } = require('../models/database');
const { protect, adminOnly } = require('../middleware/auth');
const logger = require('../utils/logger');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, adminOnly, (req, res) => {
  const db = getDB();

  const stats = {
    totalOrders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count,
    pendingOrders: db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count,
    processingOrders: db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'processing'").get().count,
    completedOrders: db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('completed','approved')").get().count,
    totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    totalResumes: db.prepare('SELECT COUNT(*) as count FROM resumes').get().count,
    totalPayments: db.prepare('SELECT COUNT(*) as count FROM payments').get().count,
    totalRevenue: db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "succeeded"').get().total,
    totalConcepts: db.prepare('SELECT COUNT(*) as count FROM order_concepts').get().count,
    recentOrders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all(),
    ordersByStatus: db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all(),
    ordersByService: db.prepare('SELECT service_type, COUNT(*) as count FROM orders GROUP BY service_type').all(),
  };

  res.json({ success: true, stats });
});

// @route   GET /api/admin/clients
// @desc    Get list of clients (users with orders)
// @access  Private/Admin
router.get('/clients', protect, adminOnly, (req, res) => {
  const db = getDB();
  const clients = db.prepare(`
    SELECT DISTINCT customer_name, customer_email, customer_phone, company,
      COUNT(*) as order_count,
      MAX(created_at) as last_order
    FROM orders
    GROUP BY customer_email
    ORDER BY last_order DESC
    LIMIT 100
  `).all();

  res.json({ success: true, clients });
});

// @route   GET /api/admin/activity
// @desc    Get recent activity
// @access  Private/Admin
router.get('/activity', protect, adminOnly, (req, res) => {
  const db = getDB();
  const activity = db.prepare(`
    SELECT * FROM activity_log
    ORDER BY created_at DESC
    LIMIT 50
  `).all();

  res.json({ success: true, activity });
});

// @route   POST /api/admin/broadcast
// @desc    Send notification to all clients (placeholder)
// @access  Private/Admin
router.post('/broadcast', protect, adminOnly, (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Subject and message required' });
  }

  logger.info(`📢 Admin broadcast: ${subject}`);
  // TODO: Integrate with email service to send to all clients

  res.json({ success: true, message: 'Broadcast queued for delivery' });
});

module.exports = router;
