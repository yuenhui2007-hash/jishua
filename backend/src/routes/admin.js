const express = require('express');
const { getData } = require('../database');
const { adminSessionAuth } = require('../middleware/admin');
const router = express.Router();

router.use(adminSessionAuth);

// Dashboard stats
router.get('/stats', (req, res) => {
  const data = getData();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalUsers = data.users.length;
  const totalResumes = data.resumes.length;
  const totalRevenue = data.payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOrders = data.payments.length;
  const activeSubscriptions = data.users.filter(u => u.subscription_status === 'active').length;
  const freeUsers = data.users.filter(u => u.subscription_tier === 'free').length;

  const recentUsers = data.users.filter(u => new Date(u.created_at) >= weekAgo).length;
  const recentOrders = data.payments.filter(p => new Date(p.created_at) >= weekAgo).length;
  const recentRevenue = data.payments
    .filter(p => p.status === 'succeeded' && new Date(p.created_at) >= weekAgo)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  res.json({
    totalUsers,
    totalResumes,
    totalRevenue,
    totalOrders,
    activeSubscriptions,
    freeUsers,
    recentUsers,
    recentOrders,
    recentRevenue
  });
});

// Users list
router.get('/users', (req, res) => {
  const data = getData();
  const { page = 1, limit = 50, search = '', tier = '' } = req.query;
  const offset = (page - 1) * limit;

  let users = [...data.users];

  if (search) {
    const s = search.toLowerCase();
    users = users.filter(u =>
      (u.email && u.email.toLowerCase().includes(s)) ||
      (u.first_name && u.first_name.toLowerCase().includes(s)) ||
      (u.last_name && u.last_name.toLowerCase().includes(s))
    );
  }

  if (tier) {
    users = users.filter(u => u.subscription_tier === tier);
  }

  const total = users.length;
  const paginated = users.slice(offset, offset + parseInt(limit));

  res.json({ users: paginated, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

// Single user
router.get('/users/:id', (req, res) => {
  const data = getData();
  const user = data.users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const resumes = data.resumes.filter(r => r.user_id === user.id);
  const payments = data.payments.filter(p => p.user_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ user, resumes, payments });
});

// Orders list
router.get('/orders', (req, res) => {
  const data = getData();
  const { page = 1, limit = 50, status = '', tier = '' } = req.query;
  const offset = (page - 1) * limit;

  let orders = data.payments.map(p => {
    const user = data.users.find(u => u.id === p.user_id);
    return { ...p, email: user?.email, first_name: user?.first_name, last_name: user?.last_name };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  if (tier) {
    orders = orders.filter(o => o.tier === tier);
  }

  const total = orders.length;
  const paginated = orders.slice(offset, offset + parseInt(limit));

  const revenueByStatus = ['succeeded', 'pending', 'failed', 'refunded'].map(s => ({
    status: s,
    total: data.payments.filter(p => p.status === s).reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    count: data.payments.filter(p => p.status === s).length
  }));

  res.json({ orders: paginated, total, page: parseInt(page), totalPages: Math.ceil(total / limit), revenueByStatus });
});

// Single order
router.get('/orders/:id', (req, res) => {
  const data = getData();
  const order = data.payments.find(p => p.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const user = data.users.find(u => u.id === order.user_id);
  res.json({ order: { ...order, email: user?.email, first_name: user?.first_name, last_name: user?.last_name } });
});

// Revenue analytics
router.get('/analytics/revenue', (req, res) => {
  const data = getData();
  const now = new Date();

  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayPayments = data.payments.filter(p => {
      return p.status === 'succeeded' && p.created_at && p.created_at.slice(0, 10) === dateStr;
    });
    daily.push({
      date: dateStr,
      revenue: dayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
      orders: dayPayments.length
    });
  }

  const monthly = [];
  const monthMap = {};
  data.payments.filter(p => p.status === 'succeeded').forEach(p => {
    const month = p.created_at ? p.created_at.slice(0, 7) : 'unknown';
    if (!monthMap[month]) monthMap[month] = { month, revenue: 0, orders: 0 };
    monthMap[month].revenue += Number(p.amount) || 0;
    monthMap[month].orders++;
  });
  monthly.push(...Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12));

  const byTier = [];
  const tierMap = {};
  data.payments.filter(p => p.status === 'succeeded').forEach(p => {
    if (!tierMap[p.tier]) tierMap[p.tier] = { tier: p.tier, revenue: 0, orders: 0 };
    tierMap[p.tier].revenue += Number(p.amount) || 0;
    tierMap[p.tier].orders++;
  });
  byTier.push(...Object.values(tierMap));

  res.json({ daily, monthly, byTier });
});

// User growth analytics
router.get('/analytics/users', (req, res) => {
  const data = getData();
  const now = new Date();

  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const count = data.users.filter(u => u.created_at && u.created_at.slice(0, 10) === dateStr).length;
    daily.push({ date: dateStr, count });
  }

  const byTier = [];
  const tierMap = {};
  data.users.forEach(u => {
    if (!tierMap[u.subscription_tier]) tierMap[u.subscription_tier] = { subscription_tier: u.subscription_tier, count: 0 };
    tierMap[u.subscription_tier].count++;
  });
  byTier.push(...Object.values(tierMap));

  res.json({ daily, byTier });
});

// AI usage analytics
router.get('/analytics/ai', (req, res) => {
  const data = getData();
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recent = data.ai_generations.filter(g => new Date(g.created_at) >= monthAgo);

  const byType = [];
  const typeMap = {};
  recent.forEach(g => {
    if (!typeMap[g.type]) typeMap[g.type] = { type: g.type, count: 0, total_tokens: 0 };
    typeMap[g.type].count++;
    typeMap[g.type].total_tokens += Number(g.tokens_used) || 0;
  });
  byType.push(...Object.values(typeMap).map(t => ({
    type: t.type,
    count: t.count,
    avg_tokens: t.count > 0 ? Math.round(t.total_tokens / t.count) : 0
  })));

  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const count = recent.filter(g => g.created_at && g.created_at.slice(0, 10) === dateStr).length;
    daily.push({ date: dateStr, count });
  }

  res.json({ byType, daily });
});

module.exports = router;
