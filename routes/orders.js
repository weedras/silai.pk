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

    // 1. Insert Master Order
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_id, customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
        status, stage_number, base_price, addons_price, total_price, amount_paid, balance_due, special_instructions, loyalty_points_earned)
      VALUES (?, ?, ?, ?, ?, ?, 'Order Received', 1, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Summing up base/addons from items for the master record
    const baseSum = (req.body.items || []).reduce((s, i) => s + (i.base_price || 0), 0);
    const addonsSum = (req.body.items || []).reduce((s, i) => s + (i.addons_price || 0), 0);

    insertOrder.run(
      order_id, customer_name, customer_email, customer_whatsapp, shipping_country, shipping_address,
      baseSum, addonsSum, total_price || 0, amount_paid || 0, balance_due, style_notes || '', loyalty_points_earned || 0
    );

    // 2. Insert Items & Measurements
    const items = req.body.items || [];
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

// GET /api/orders (admin listing — see admin.js for full)
router.get('/', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50').all();
  res.json(orders);
});

module.exports = router;
