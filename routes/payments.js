const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { db } = require('../database/db');
const { calculatePrice } = require('../config/pricing');

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
    _stripe = Stripe(key);
  }
  return _stripe;
}

// POST /api/payments/intent
router.post('/intent', async (req, res) => {
  try {
    const { items, shipping_cost } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required.' });
    }

    const amountUsd = calculatePrice(items) + (shipping_cost || 0);
    const amountCents = Math.round(amountUsd * 100);

    if (amountCents < 50) {
      return res.status(400).json({ error: 'Order total is too low.' });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret, amountCents });
  } catch (err) {
    console.error('PaymentIntent error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment intent.' });
  }
});

// POST /api/payments/webhook — must be registered with express.raw() in server.js
async function webhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    db.prepare(`
      UPDATE orders SET payment_status = 'paid', stripe_pi_id = ? WHERE stripe_pi_id = ?
    `).run(pi.id, pi.id);
  }

  res.json({ received: true });
}

module.exports = router;
module.exports.webhook = webhook;
