const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { parseOrderItem } = require('../utils/helpers');
const { sendStatusUpdate } = require('../services/email');

const STAGE_NAMES = [
  '', 'Order Received', 'Fabric In Transit', 'Fabric Arrived',
  'Cutting', 'Stitching', 'QC & Finishing', 'Photos Sent',
  'Awaiting Balance', 'Shipped', 'Delivered'
];

// GET /api/admin/orders — list all orders
router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, oi.garment_type, oi.fabric_type
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

// GET /api/admin/orders/:orderId — single order detail
router.get('/orders/:orderId', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const item = parseOrderItem(db.prepare('SELECT * FROM order_items WHERE order_id = ?').get(req.params.orderId));
  const meas = db.prepare('SELECT * FROM measurements WHERE order_id = ?').get(req.params.orderId);
  const tracking = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY stage_number').all(req.params.orderId);
  res.json({ order, item, measurements: meas, tracking });
});

// PATCH /api/admin/orders/:orderId/status — update order stage
router.patch('/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { stage_number, note } = req.body;

  if (!stage_number || stage_number < 1 || stage_number > 10) {
    return res.status(400).json({ error: 'stage_number must be between 1 and 10' });
  }

  const stageName = STAGE_NAMES[stage_number];
  const orderCheck = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
  if (!orderCheck) return res.status(404).json({ error: 'Order not found' });

  // Update order status
  db.prepare(`
    UPDATE orders SET status = ?, stage_number = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?
  `).run(stageName, stage_number, orderId);

  // Add tracking log entry
  const existing = db.prepare('SELECT id FROM order_tracking WHERE order_id = ? AND stage_number = ?').get(orderId, stage_number);
  if (!existing) {
    db.prepare(`
      INSERT INTO order_tracking (order_id, stage_number, stage_name, note, updated_by)
      VALUES (?, ?, ?, ?, 'admin')
    `).run(orderId, stage_number, stageName, note || '');
  }

  // Log notification
  db.prepare(`
    INSERT INTO notifications (order_id, type, channel, content_preview)
    VALUES (?, 'status_update', 'whatsapp+email', ?)
  `).run(orderId, `Status updated to: ${stageName}`);

  // Send status update email (non-blocking)
  sendStatusUpdate(orderCheck, stageName);

  res.json({ success: true, order_id: orderId, new_status: stageName, stage_number });
});

// GET /api/admin/dashboard — revenue summary stats
router.get('/dashboard', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const totalRevenue = db.prepare('SELECT SUM(amount_paid) as total FROM orders').get();
  const pendingBalance = db.prepare('SELECT SUM(balance_due) as total FROM orders WHERE balance_due > 0').get();
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
  const recentOrders = db.prepare('SELECT order_id, customer_name, shipping_country, status, total_price, created_at FROM orders ORDER BY created_at DESC LIMIT 10').all();

  res.json({
    total_orders: totalOrders.count,
    total_revenue: totalRevenue.total || 0,
    pending_balance: pendingBalance.total || 0,
    orders_by_status: byStatus,
    recent_orders: recentOrders,
  });
});

// GET /api/admin/users — list all registered users (excluding passwords)
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;

