const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { db }  = require('../database/db');

const hashPw = (pw) =>
  crypto.createHash('sha256')
    .update(pw + (process.env.SESSION_SECRET || 'silai-secret-2026'))
    .digest('hex');

// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are all required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing)
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });

  const isAdmin = email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();
  const role    = isAdmin ? 'admin' : 'customer';

  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), hashPw(password), role);

  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE email = ?')
    .get(email.toLowerCase());

  req.session.userId = user.id;
  req.session.user   = { id: user.id, name: user.name, email: user.email, role: user.role };

  res.status(201).json({ success: true, user: req.session.user });
});

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || user.password_hash !== hashPw(password))
    return res.status(401).json({ error: 'Incorrect email or password.' });

  req.session.userId = user.id;
  req.session.user   = { id: user.id, name: user.name, email: user.email, role: user.role };

  res.json({ success: true, user: req.session.user });
});

// ─── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ─── GET /api/auth/me ──────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user)
    return res.status(401).json({ error: 'Not logged in.' });
  res.json({ user: req.session.user });
});

// ─── GET /api/auth/my-orders ───────────────────────────────
router.get('/my-orders', (req, res) => {
  if (!req.session || !req.session.user)
    return res.status(401).json({ error: 'Not logged in.' });

  const orders = db.prepare(`
    SELECT
      o.order_id, o.status, o.stage_number,
      o.total_price, o.amount_paid, o.balance_due,
      o.created_at, o.shipping_country,
      oi.garment_type, oi.fabric_type
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.customer_email = ?
    ORDER BY o.created_at DESC
  `).all(req.session.user.email);

  res.json(orders);
});

module.exports = router;
