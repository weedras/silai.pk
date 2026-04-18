const express = require('express');
const router = express.Router();
const { db, getNextOrderId } = require('../database/db');
const { calculatePrice } = require('../config/pricing');
const { requireAdminSession } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../services/email');

// POST /api/orders — Submit a new order
router.post('/', async (req, res) => {
  try {
    const {
      customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
      style_notes, items, loyalty_points_earned, shipping_cost, stripe_pi_id
    } = req.body;

    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required.' });
    }

    // Server-side Price Calculation
    const serverTotalPrice = calculatePrice(items) + (shipping_cost || 0);
    const amount_paid = serverTotalPrice; // Currently 100% upfront
    const balance_due = 0;

    const order_id = getNextOrderId();

    // 1. Insert Master Order
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_id, customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
        status, stage_number, total_price, amount_paid, balance_due, special_instructions, loyalty_points_earned, shipping_cost, stripe_pi_id, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, 'Order Received', 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      order_id, customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
      serverTotalPrice, amount_paid, balance_due, style_notes || '', loyalty_points_earned || 0, shipping_cost || 0,
      stripe_pi_id || null, stripe_pi_id ? 'paid' : 'pending'
    );

    // 2. Insert Items & Measurements
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, garment_type, fabric_type, fabric_sourcing, neckline, sleeve_style, trouser_style, style_notes, add_ons, reference_design)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMeas = db.prepare(`
      INSERT INTO measurements (order_id, customer_email, standard_size, chest, waist, hips, kameez_length, sleeve_length, shoulder_width, trouser_length, inseam, measurement_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        order_id, 
        item.garment_type, 
        item.fabric_type, 
        item.fabric_sourcing || '', 
        item.neckline, 
        item.sleeve_style, 
        item.trouser_style, 
        item.style_notes || '', 
        JSON.stringify(item.add_ons || []), 
        item.reference_design || ''
      );

      const m = item.measurements || {};
      insertMeas.run(
        order_id, 
        customer_email, 
        m.standard_size || '', 
        m.chest || null, 
        m.waist || null, 
        m.hips || null, 
        m.klength || null, 
        m.sleeve || null, 
        m.shoulder || null, 
        m.trouser || null, 
        m.inseam || null, 
        m.method || 'form'
      );
    }

    // 3. Insert first tracking stage
    db.prepare(`
      INSERT INTO order_tracking (order_id, stage_number, stage_name, note)
      VALUES (?, 1, 'Order Received', 'Your order and full payment have been received. Please ship your fabric to our Lahore workshop, unless you requested us to source it.')
    `).run(order_id);

    // 4. Log notification
    db.prepare(`
      INSERT INTO notifications (order_id, type, channel, content_preview)
      VALUES (?, 'order_confirmed', 'email', ?)
    `).run(order_id, `Order ${order_id} confirmed with ${items.length} garments for ${customer_name}`);

    // 5. Send confirmation email (non-blocking)
    sendOrderConfirmation({
      order_id,
      customer_name,
      customer_email,
      total_price: serverTotalPrice,
      garment_count: items.length,
    });

    res.status(201).json({
      success: true,
      order_id,
      message: `Order ${order_id} created successfully with ${items.length} garments! Check your email for confirmation.`,
      tracking_url: `/track.html?order=${order_id}`
    });


  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

// GET /api/orders (admin listing only)
router.get('/', requireAdminSession, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all();
  res.json(orders);
});

module.exports = router;
