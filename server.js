require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

// Init DB (runs schema + seed on first start)
require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'silai-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// ─── Serve static frontend ────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/orders',  require('./routes/orders'));
app.use('/api/track',   require('./routes/tracking'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/auth',    require('./routes/auth'));

// ─── Admin password check ─────────────────────────────────
app.post('/api/admin/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Incorrect admin password.' });
  }
});

// ─── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Silai API is running 🧵', timestamp: new Date().toISOString() });
});

// ─── SPA fallback — serve index.html for all unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧵 Silai server running at: http://localhost:${PORT}`);
  console.log(`📦 API health:               http://localhost:${PORT}/api/health`);
  console.log(`🔍 Track demo order:         http://localhost:${PORT}/api/track/SB-2025-00001`);
  console.log(`📊 Admin dashboard:          http://localhost:${PORT}/api/admin/dashboard\n`);
});
