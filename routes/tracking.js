const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { parseOrderItem } = require('../utils/helpers');

const STAGES = [
  { number: 1, name: 'Order Received',    description: 'We have received your order and payment. Awaiting your fabric parcel.' },
  { number: 2, name: 'Fabric In Transit', description: 'Your fabric is on its way to us in Lahore.' },
  { number: 3, name: 'Fabric Arrived',    description: 'Your fabric has arrived at our Lahore workshop. Quality check in progress.' },
  { number: 4, name: 'Cutting',           description: 'Our tailor has reviewed your measurements and is beginning the cut.' },
  { number: 5, name: 'Stitching',         description: 'Your outfit is being stitched. Expected to complete in 3-5 days.' },
  { number: 6, name: 'QC & Finishing',    description: 'Quality check done. Final pressing and finishing touches being applied.' },
  { number: 7, name: 'Photos Sent',       description: 'We have sent you WhatsApp photos of your finished outfit for approval.' },
  { number: 8, name: 'Awaiting Balance',  description: 'Please pay the remaining 50% balance to proceed to shipping.' },
  { number: 9, name: 'Shipped',           description: 'Your outfit is on its way! Check your WhatsApp for the tracking number.' },
  { number: 10, name: 'Delivered',        description: 'Your outfit has been delivered. We hope you love it! 💚' },
];

// GET /api/track/:orderId
router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: `Order ${orderId} not found. Please check your Order ID.` });
  }

  // Check if current user is owner or admin
  const currentUser = req.session?.user;
  const isOwner = currentUser && currentUser.email === order.customer_email;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canSeeSensitive = isOwner || isAdmin;

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId.toUpperCase()).map(parseOrderItem);
  const trackingHistory = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY stage_number ASC').all(orderId.toUpperCase());

  const currentStage = order.stage_number;
  const stagesWithStatus = STAGES.map(stage => ({
    ...stage,
    status: stage.number < currentStage ? 'completed' :
            stage.number === currentStage ? 'current' : 'pending',
    completed_at: trackingHistory.find(t => t.stage_number === stage.number)?.created_at || null,
    note: trackingHistory.find(t => t.stage_number === stage.number)?.note || null,
  }));

  res.json({
    order_id: order.order_id,
    customer_name: canSeeSensitive ? order.customer_name : order.customer_name.split(' ')[0] + '...',
    shipping_country: order.shipping_country,
    current_stage: currentStage,
    current_stage_name: order.status,
    garments: items.map(i => `${i.garment_type} — ${i.fabric_type}`),
    total_price: canSeeSensitive ? order.total_price : null,
    amount_paid: canSeeSensitive ? order.amount_paid : null,
    balance_due: canSeeSensitive ? order.balance_due : null,
    created_at: order.created_at,
    updated_at: order.updated_at,
    stages: stagesWithStatus,
    whatsapp_link: 'https://wa.me/923000446387?text=Hi%20Silai%2C%20my%20order%20is%20' + order.order_id,
  });
});

module.exports = router;
