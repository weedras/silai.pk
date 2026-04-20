require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { db } = require('./database/db');

// ─── Custom SQLite Session Store ──────────────────────────
// better-sqlite3-session-store v0.1.0 stores expire as an ISO string
// with milliseconds (e.g. "2026-05-20T12:00:00.000Z"). SQLite's
// datetime() function doesn't parse the milliseconds part, so the
// WHERE clause always evaluates to NULL → sessions are saved but never
// found on the next request.  This replacement uses Unix timestamps
// (integers) which SQLite handles perfectly.
class SQLiteSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;
    // Recreate table with integer expire column (drops old TEXT-expire table)
    db.exec(`
      DROP TABLE IF EXISTS sessions;
      CREATE TABLE IF NOT EXISTS sessions (
        sid     TEXT    PRIMARY KEY,
        sess    TEXT    NOT NULL,
        expire  INTEGER NOT NULL
      )
    `);
    // Purge expired sessions every hour
    setInterval(() => {
      try { db.prepare('DELETE FROM sessions WHERE expire <= ?').run(Math.floor(Date.now() / 1000)); }
      catch(e) { /* ignore */ }
    }, 3_600_000);
  }
  get(sid, cb) {
    try {
      const row = this.db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expire > ?')
        .get(sid, Math.floor(Date.now() / 1000));
      cb(null, row ? JSON.parse(row.sess) : null);
    } catch(e) { cb(e); }
  }
  set(sid, sess, cb) {
    try {
      const maxAge = sess.cookie?.maxAge ?? 86_400_000; // ms → default 1 day
      const expire = Math.floor((Date.now() + maxAge) / 1000);
      this.db.prepare('INSERT OR REPLACE INTO sessions (sid, sess, expire) VALUES (?, ?, ?)')
        .run(sid, JSON.stringify(sess), expire);
      cb(null);
    } catch(e) { cb(e); }
  }
  destroy(sid, cb) {
    try { this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid); cb(null); }
    catch(e) { cb(e); }
  }
  touch(sid, sess, cb) {
    try {
      const maxAge = sess.cookie?.maxAge ?? 86_400_000;
      const expire = Math.floor((Date.now() + maxAge) / 1000);
      this.db.prepare('UPDATE sessions SET expire = ? WHERE sid = ?').run(expire, sid);
      cb(null);
    } catch(e) { cb(e); }
  }
  length(cb) {
    try {
      const row = this.db.prepare('SELECT COUNT(*) as c FROM sessions WHERE expire > ?')
        .get(Math.floor(Date.now() / 1000));
      cb(null, row.c);
    } catch(e) { cb(e); }
  }
  clear(cb) {
    try { this.db.prepare('DELETE FROM sessions').run(); cb(null); }
    catch(e) { cb(e); }
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first reverse proxy (Hostinger / Nginx) so that
// secure cookies work correctly when the app sits behind HTTPS termination.
app.set('trust proxy', 1);

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
  store: new SQLiteSessionStore(db),
  secret: process.env.SESSION_SECRET || 'silai-secret-2026',
  resave: true,             // always re-save so the store entry never expires before the cookie
  saveUninitialized: false,
  rolling: true,            // reset the 30-day window on every request (keeps active users logged in)
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    // secure only when behind HTTPS — trust proxy (set above) makes this work on Hostinger
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

// ─── Fabric Price Scraper ─────────────────────────────────
app.get('/api/scrape-price', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http')) return res.json({ success: false, error: 'Invalid URL' });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow'
    });
    clearTimeout(timeout);

    if (!response.ok) return res.json({ success: false, error: `HTTP ${response.status}` });
    const html = await response.text();

    // 1. Try JSON-LD structured data (most reliable)
    const jsonLdBlocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const block of jsonLdBlocks) {
      try {
        const data = JSON.parse(block[1]);
        const items = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])];
        for (const item of items) {
          const offers = item.offers;
          if (offers) {
            const offer = Array.isArray(offers) ? offers[0] : offers;
            if (offer.price) {
              return res.json({ success: true, price: Math.round(parseFloat(offer.price)), currency: offer.priceCurrency || 'PKR' });
            }
          }
        }
      } catch(e) { /* continue */ }
    }

    // 2. Try Open Graph / meta price tags
    const metaPatterns = [
      /property=["']product:price:amount["']\s+content=["']([0-9,]+(?:\.[0-9]+)?)["']/i,
      /content=["']([0-9,]+(?:\.[0-9]+)?)["'][^>]*property=["']product:price:amount["']/i,
      /property=["']og:price:amount["']\s+content=["']([0-9,]+(?:\.[0-9]+)?)["']/i,
    ];
    for (const pat of metaPatterns) {
      const m = html.match(pat);
      if (m) return res.json({ success: true, price: Math.round(parseFloat(m[1].replace(/,/g, ''))), currency: 'PKR' });
    }

    // 3. Try data attributes & common Shopify/WooCommerce patterns
    const dataPatterns = [
      /"price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/,                   // "price": 1200
      /data-price=["']([0-9]+)["']/i,                          // data-price="1200"
      /"amount"\s*:\s*"([0-9]+(?:\.[0-9]+)?)"/,               // "amount": "1200"
    ];
    for (const pat of dataPatterns) {
      const m = html.match(pat);
      if (m) {
        const val = parseFloat(m[1]);
        // Shopify stores price in cents sometimes — heuristic: if > 100000, divide by 100
        const price = val > 100000 ? Math.round(val / 100) : Math.round(val);
        if (price > 0 && price < 1000000) return res.json({ success: true, price, currency: 'PKR' });
      }
    }

    // 4. Try PKR/Rs text patterns in HTML
    const pkrPatterns = [
      /Rs\.?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /PKR\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /₨\s*([0-9][0-9,]*(?:\.[0-9]+)?)/,
    ];
    for (const pat of pkrPatterns) {
      const matches = [...html.matchAll(new RegExp(pat.source, 'gi'))];
      if (matches.length > 0) {
        // Pick the most common price (likely the product price, not shipping/etc.)
        const prices = matches
          .map(m => Math.round(parseFloat(m[1].replace(/,/g, ''))))
          .filter(p => p >= 100 && p <= 500000);
        if (prices.length > 0) {
          // Return the most frequently occurring price
          const freq = {};
          prices.forEach(p => freq[p] = (freq[p] || 0) + 1);
          const topPrice = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
          return res.json({ success: true, price: parseInt(topPrice), currency: 'PKR' });
        }
      }
    }

    return res.json({ success: false, error: 'Price not found on page' });
  } catch (e) {
    if (e.name === 'AbortError') return res.json({ success: false, error: 'Request timed out' });
    return res.json({ success: false, error: 'Could not fetch page' });
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
