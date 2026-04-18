const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database', 'silai.db'));

try { db.exec(`ALTER TABLE orders ADD COLUMN loyalty_points_earned INTEGER DEFAULT 0;`); } catch(e) {}
try { db.exec(`ALTER TABLE order_items ADD COLUMN fabric_sourcing TEXT;`); } catch(e) {}
try { db.exec(`ALTER TABLE order_items ADD COLUMN reference_design TEXT;`); } catch(e) {}
try { db.exec(`ALTER TABLE measurements ADD COLUMN standard_size TEXT;`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN shipping_cost REAL DEFAULT 0;`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN stripe_pi_id TEXT;`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';`); } catch(e) {}

console.log("Migrations ran.");
