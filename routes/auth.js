const express = require('express');
const router  = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { db } = require('../database/db');

const SALT_ROUNDS = 12;

// Legacy SHA-256 hash for migration
const legacyHashPw = (pw) =>
  crypto.createHash('sha256')
    .update(pw + (process.env.SESSION_SECRET || 'silai-secret-2026'))
    .digest('hex');

// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
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

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name.trim(), email.toLowerCase().trim(), passwordHash, role);

    const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?')
      .get(email.toLowerCase());

    req.session.userId = user.id;
    req.session.user   = { id: user.id, name: user.name, email: user.email, role: user.role };

    res.status(201).json({ success: true, user: req.session.user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user)
      return res.status(401).json({ error: 'Incorrect email or password.' });

    let isValid = false;
    let needsUpgrade = false;

    // Try Bcrypt
    if (user.password_hash.startsWith('$2b$')) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Try Legacy SHA-256
      if (user.password_hash === legacyHashPw(password)) {
        isValid = true;
        needsUpgrade = true;
      }
    }

    if (!isValid)
      return res.status(401).json({ error: 'Incorrect email or password.' });

    // Upgrade hash if necessary
    if (needsUpgrade) {
      const newHash = await bcrypt.hash(password, SALT_ROUNDS);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
      console.log(`Upgraded password hash for user: ${user.email}`);
    }

    req.session.userId = user.id;
    req.session.user   = { id: user.id, name: user.name, email: user.email, role: user.role };

    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
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
