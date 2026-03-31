const express = require('express');
const router = express.Router();
const { Shippo } = require('shippo');
const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY });
const { db, getNextOrderId } = require('../database/db');

// POST /api/orders — Submit a new order
router.post('/', (req, res) => {
  try {
    const {
      // Personal
      customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
      // Garment
      garment_type, fabric_type, fabric_sourcing, neckline, sleeve_style, trouser_style, style_notes, reference_design,
      // Measurements
      measurement_method, standard_size, chest, waist, hips, kameez_length, sleeve_length, shoulder_width, trouser_length, inseam,
      // Add-ons & pricing
      addons, base_price, addons_price, total_price,
      // Amount paid (Now 100%)
      amount_paid, loyalty_points_earned
    } = req.body;

    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const order_id = getNextOrderId();
    const balance_due = (total_price || 0) - (amount_paid || 0);

    // Insert order
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_id, customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
        status, stage_number, base_price, addons_price, total_price, amount_paid, balance_due, special_instructions, loyalty_points_earned)
      VALUES (?, ?, ?, ?, ?, ?, 'Order Received', 1, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertOrder.run(
      order_id, customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
      base_price || 0, addons_price || 0, total_price || 0, amount_paid || 0, balance_due, style_notes || '', loyalty_points_earned || 0
    );

    // Insert order items
    db.prepare(`
      INSERT INTO order_items (order_id, garment_type, fabric_type, fabric_sourcing, neckline, sleeve_style, trouser_style, style_notes, add_ons, reference_design)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_id, garment_type, fabric_type, fabric_sourcing || '', neckline, sleeve_style, trouser_style, style_notes, JSON.stringify(addons || []), reference_design || '');

    // Insert measurements
    db.prepare(`
      INSERT INTO measurements (order_id, customer_email, standard_size, chest, waist, hips, kameez_length, sleeve_length, shoulder_width, trouser_length, inseam, measurement_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_id, customer_email, standard_size||'', chest||null, waist||null, hips||null, kameez_length||null, sleeve_length||null, shoulder_width||null, trouser_length||null, inseam||null, measurement_method||'form');

    // Insert first tracking stage
    db.prepare(`
      INSERT INTO order_tracking (order_id, stage_number, stage_name, note)
      VALUES (?, 1, 'Order Received', 'Your order and full payment have been received. Please ship your fabric to our Lahore workshop, unless you requested us to source it.')
    `).run(order_id);

    // Log notification
    db.prepare(`
      INSERT INTO notifications (order_id, type, channel, content_preview)
      VALUES (?, 'order_confirmed', 'email', ?)
    `).run(order_id, `Order ${order_id} confirmed for ${customer_name}`);

    res.status(201).json({
      success: true,
      order_id,
      message: `Order ${order_id} created successfully! Check your email for confirmation.`,
      tracking_url: `/track.html?order=${order_id}`
    });

  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

// GET /api/orders (admin listing — see admin.js for full)
router.get('/', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50').all();
  res.json(orders);
});

module.exports = router;
