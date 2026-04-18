require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const SQLiteStore = require('better-sqlite3-session-store')(session);
const { db } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, 
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'https://silai.pk', 'https://www.silai.pk'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Stripe webhook must receive raw body — register before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/payments').webhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Persistent Session Store
app.use(session({
  store: new SQLiteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000 // 15min
    }
  }),
  secret: process.env.SESSION_SECRET || 'silai-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  message: { error: 'Too many attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const { requireAdminSession } = require('./middleware/auth');

// ─── Serve static frontend ────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/payments', require('./routes/payments'));
app.use('/api/orders',  require('./routes/orders'));
app.use('/api/track',   require('./routes/tracking'));
app.use('/api/admin',   requireAdminSession, require('./routes/admin'));
app.use('/api/auth',    require('./routes/auth'));

app.get('/api/config', (req, res) => {
  res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});


// ─── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Silai API is running 🧵', timestamp: new Date().toISOString() });
});

// ─── SPA fallback — serve index.html for all unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ─── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧵 Silai server running at: http://localhost:${PORT}`);
  console.log(`📦 API health:               http://localhost:${PORT}/api/health`);
  console.log(`🔍 Track demo order:         http://localhost:${PORT}/api/track/SB-2025-00001`);
  console.log(`📊 Admin dashboard:          http://localhost:${PORT}/api/admin/dashboard\n`);
});
