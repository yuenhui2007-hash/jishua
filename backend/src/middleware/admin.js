const jwt = require('jsonwebtoken');
const { db } = require('../database');

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user = db.prepare('SELECT id, email, first_name, last_name, role FROM users WHERE id = ? AND role = ?').get(decoded.userId, 'admin');
    
    if (!user) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    req.admin = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired admin token' });
  }
}

function adminSessionAuth(req, res, next) {
  const token = req.cookies?.adminToken || req.headers['x-admin-token'];

  if (!token) {
    return res.status(401).json({ error: 'Admin session required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const session = db.prepare('SELECT * FROM admin_sessions WHERE token = ?').get(token);
    if (!session) {
      return res.status(401).json({ error: 'Admin session not found' });
    }
    if (new Date(session.expires_at) <= new Date()) {
      return res.status(401).json({ error: 'Admin session expired' });
    }

    const user = db.prepare('SELECT id, email, first_name, last_name, role FROM users WHERE id = ? AND role = ?').get(decoded.userId, 'admin');
    if (!user) {
      return res.status(403).json({ error: 'Admin no longer exists' });
    }

    req.admin = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid admin session' });
  }
}

module.exports = { authenticateAdmin, adminSessionAuth };
