const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(__dirname, 'silai.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Users table (auth) ────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Schema ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    whatsapp TEXT,
    country TEXT,
    referral_code TEXT UNIQUE,
    referrer_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_whatsapp TEXT,
    shipping_country TEXT,
    status TEXT DEFAULT 'Order Received',
    stage_number INTEGER DEFAULT 1,
    base_price REAL DEFAULT 0,
    addons_price REAL DEFAULT 0,
    total_price REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    balance_due REAL DEFAULT 0,
    shipping_address TEXT,
    special_instructions TEXT,
    loyalty_points_earned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    garment_type TEXT,
    fabric_type TEXT,
    fabric_sourcing TEXT,
    neckline TEXT,
    sleeve_style TEXT,
    trouser_style TEXT,
    style_notes TEXT,
    add_ons TEXT,
    reference_design TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
  );

  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    standard_size TEXT,
    chest REAL,
    waist REAL,
    hips REAL,
    kameez_length REAL,
    sleeve_length REAL,
    shoulder_width REAL,
    trouser_length REAL,
    inseam REAL,
    measurement_method TEXT DEFAULT 'form',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
  );

  CREATE TABLE IF NOT EXISTS order_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    stage_number INTEGER NOT NULL,
    stage_name TEXT NOT NULL,
    note TEXT,
    updated_by TEXT DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT,
    type TEXT,
    channel TEXT,
    content_preview TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Seed demo orders ─────────────────────────────────────
const existingDemo = db.prepare('SELECT id FROM orders WHERE order_id = ?').get('SB-2025-00001');
if (!existingDemo) {
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_id, customer_name, customer_email, customer_whatsapp, shipping_country, status, stage_number, base_price, addons_price, total_price, amount_paid, balance_due, shipping_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run('SB-2025-00001', 'Fatima Khan', 'fatima@example.com', '+447700900123', 'United Kingdom', 'Stitching', 5, 32, 10, 42, 21, 21, '42 Rose Lane, Manchester, M14 5QT, UK');
  insertOrder.run('SB-2025-00002', 'Ayesha Malik', 'ayesha@example.com', '+16134560001', 'Canada', 'Fabric Arrived', 3, 22, 0, 22, 11, 11, '233 Maple Ave, Toronto, ON M5V 2T6, CA');

  const insertItem = db.prepare(`INSERT INTO order_items (order_id, garment_type, fabric_type, fabric_sourcing, neckline, sleeve_style, add_ons, reference_design) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertItem.run('SB-2025-00001', 'Full Suit', 'Chiffon', '', 'V-neck', 'Full', 'Express Stitching', '');
  insertItem.run('SB-2025-00002', 'Party Wear', 'Lawn', 'Buy from Khaadi', 'Round', '3/4', '', '');

  const insertTracking = db.prepare(`INSERT INTO order_tracking (order_id, stage_number, stage_name, note) VALUES (?, ?, ?, ?)`);
  insertTracking.run('SB-2025-00001', 1, 'Order Received', 'Order and payment confirmed.');
  insertTracking.run('SB-2025-00001', 2, 'Fabric In Transit', 'Customer shipped fabric via DHL.');
  insertTracking.run('SB-2025-00001', 3, 'Fabric Arrived', 'Fabric received at Lahore workshop. Quality OK.');
  insertTracking.run('SB-2025-00001', 4, 'Cutting', 'Tailor has reviewed measurements and begun cutting.');
  insertTracking.run('SB-2025-00001', 5, 'Stitching', 'Your outfit is being stitched. ETA 3-5 days.');

  insertTracking.run('SB-2025-00002', 1, 'Order Received', 'Order confirmed.');
  insertTracking.run('SB-2025-00002', 2, 'Fabric In Transit', 'Tracking: 1Z999AA10123456784');
  insertTracking.run('SB-2025-00002', 3, 'Fabric Arrived', 'Fabric arrived and quality checked.');

  const insertMeas = db.prepare(`INSERT INTO measurements (order_id, customer_email, standard_size, chest, waist, hips, kameez_length, sleeve_length, shoulder_width, trouser_length, measurement_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertMeas.run('SB-2025-00001', 'fatima@example.com', '', 38, 32, 40, 44, 24, 15, 40, 'form');
  insertMeas.run('SB-2025-00002', 'ayesha@example.com', 'M', null, null, null, null, null, null, null, 'standard');

  console.log('✅ Demo orders seeded: SB-2025-00001, SB-2025-00002');
}

// ─── Counter for sequential order IDs ─────────────────────
function getNextOrderId() {
  const year = new Date().getFullYear();
  const row = db.prepare(`SELECT order_id FROM orders WHERE order_id LIKE 'SB-${year}-%' ORDER BY id DESC LIMIT 1`).get();
  if (!row) return `SB-${year}-00001`;
  const lastNum = parseInt(row.order_id.split('-')[2], 10);
  return `SB-${year}-${String(lastNum + 1).padStart(5, '0')}`;
}

module.exports = { db, getNextOrderId };
