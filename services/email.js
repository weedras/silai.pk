const { Resend } = require('resend');

const FROM      = 'orders@silai.pk';
const WA_NUMBER = process.env.WHATSAPP_BUSINESS_NUMBER || '923000446387';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── Send WhatsApp via Meta Cloud API (if configured) ─────
async function sendWhatsAppMessage(to, message) {
  const token   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.log(`[WhatsApp] Would send to ${to}: ${message.substring(0, 60)}...`);
    return;
  }
  try {
    const clean = to.replace(/[^\d]/g, '');
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: clean,
        type: 'text',
        text: { body: message }
      })
    });
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
  }
}

// ─── Order confirmation ───────────────────────────────────
async function sendOrderConfirmation(order) {
  const {
    order_id, customer_name, customer_email, customer_whatsapp,
    total_price, garment_count, shipping_country, userCreated
  } = order;

  const trackingLink = `https://silai.pk/#track?order=${order_id}`;
  const waLink = `https://wa.me/${WA_NUMBER}?text=Hi%2C%20my%20order%20ID%20is%20${order_id}%20and%20I%20have%20a%20question.`;
  const count  = garment_count || 1;

  // ── Email ────────────────────────────────────────────────
  try {
    await getResend().emails.send({
      from: FROM,
      to: customer_email,
      subject: `✅ Order ${order_id} Confirmed — Silai.pk`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0d1117 0%,#1a2332 100%);padding:32px 32px 24px;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🧵</div>
    <h1 style="color:#d4af37;font-size:1.4rem;margin:0 0 4px;">Silai.pk</h1>
    <p style="color:#94a3b8;margin:0;font-size:0.85rem;">Premium Pakistani Tailoring Worldwide</p>
  </div>

  <!-- Body -->
  <div style="padding:32px;">
    <h2 style="color:#0d1117;font-size:1.2rem;margin:0 0 8px;">Your Order is Confirmed! 🎉</h2>
    <p style="color:#64748b;margin:0 0 24px;">Hi ${customer_name}, thank you for your order. Here's a summary:</p>

    <!-- Order ID Banner -->
    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;padding:16px 20px;margin:0 0 24px;text-align:center;">
      <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">Your Order ID</div>
      <div style="font-size:1.6rem;font-weight:700;color:#0d1117;letter-spacing:0.05em;">${order_id}</div>
      <div style="font-size:0.78rem;color:#64748b;margin-top:4px;">Keep this safe — you'll need it to track your order</div>
    </div>

    <!-- Details table -->
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 0;color:#64748b;font-size:0.9rem;">Garments</td>
        <td style="padding:10px 0;font-weight:600;text-align:right;">${count} item${count !== 1 ? 's' : ''}</td>
      </tr>
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 0;color:#64748b;font-size:0.9rem;">Shipping to</td>
        <td style="padding:10px 0;font-weight:600;text-align:right;">${shipping_country || 'Confirmed separately'}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:0.9rem;">Total Paid</td>
        <td style="padding:10px 0;font-weight:700;font-size:1.1rem;color:#0d1117;text-align:right;">$${Number(total_price).toFixed(2)}</td>
      </tr>
    </table>

    <!-- Track button -->
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${trackingLink}" style="display:inline-block;background:#d4af37;color:#0d1117;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.95rem;">
        📦 Track Your Order
      </a>
    </div>

    <!-- Next steps -->
    <div style="background:#fffbeb;border-left:4px solid #d4af37;padding:16px 20px;border-radius:4px;margin:0 0 24px;">
      <div style="font-weight:600;color:#0d1117;margin-bottom:8px;">⏭️ What happens next?</div>
      <ol style="margin:0;padding-left:20px;color:#64748b;font-size:0.88rem;line-height:1.8;">
        <li>Ship your fabric to: <strong>Workshop, Old City, Lahore, Pakistan</strong></li>
        <li>We receive & quality-check your fabric</li>
        <li>Tailoring begins — we'll keep you updated</li>
        <li>Finished garment shipped back to you ✈️</li>
      </ol>
    </div>

    ${userCreated ? `
    <!-- Account created notice -->
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <div style="font-weight:600;color:#0369a1;margin-bottom:4px;">🔐 Your account has been created</div>
      <p style="color:#64748b;font-size:0.85rem;margin:0;">Sign in at <a href="https://silai.pk/#login" style="color:#d4af37;">silai.pk/#login</a> with this email to view your order history and track all orders.</p>
    </div>
    ` : ''}

    <!-- WhatsApp -->
    <div style="text-align:center;border-top:1px solid #f1f5f9;padding-top:20px;">
      <p style="color:#64748b;font-size:0.85rem;margin:0 0 12px;">Questions? Chat with us on WhatsApp</p>
      <a href="${waLink}" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;">
        💬 WhatsApp Us
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
    <p style="color:#94a3b8;font-size:0.78rem;margin:0;">
      Silai.pk · Lahore, Pakistan ·
      <a href="https://silai.pk" style="color:#d4af37;text-decoration:none;">silai.pk</a>
    </p>
  </div>
</div>
</body>
</html>
      `,
    });
  } catch (err) {
    console.error('sendOrderConfirmation email failed:', err.message);
  }

  // ── WhatsApp message to customer ─────────────────────────
  if (customer_whatsapp) {
    await sendWhatsAppMessage(
      customer_whatsapp,
      `✅ Silai.pk Order Confirmed!\n\nHi ${customer_name}!\nYour order *${order_id}* has been placed.\n\nTotal: $${Number(total_price).toFixed(2)}\nGarments: ${count}\n\nTrack your order: https://silai.pk/#track?order=${order_id}\n\nNext step: Ship your fabric to our Lahore workshop. We'll message you once it arrives! 🧵`
    );
  }
}

// ─── Status update ────────────────────────────────────────
async function sendStatusUpdate(order, stageName) {
  const trackingLink = `https://silai.pk/#track?order=${order.order_id}`;
  const waLink = `https://wa.me/${WA_NUMBER}?text=Hi%2C%20my%20order%20ID%20is%20${order.order_id}`;

  try {
    await getResend().emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `📦 Order ${order.order_id} Update: ${stageName}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#0d1117,#1a2332);padding:24px 32px;">
            <h2 style="color:#d4af37;margin:0;font-size:1.2rem;">🧵 Silai.pk — Order Update</h2>
          </div>
          <div style="padding:28px 32px;">
            <p style="color:#64748b;">Hi ${order.customer_name},</p>
            <p style="color:#0d1117;">Your order <strong>${order.order_id}</strong> status has changed:</p>
            <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 18px;border-radius:4px;margin:16px 0;">
              <strong style="color:#0d1117;font-size:1.1rem;">✅ ${stageName}</strong>
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="${trackingLink}" style="background:#d4af37;color:#0d1117;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">View Full Tracking</a>
            </div>
            <p style="text-align:center;font-size:0.85rem;color:#64748b;">
              Questions? <a href="${waLink}" style="color:#25D366;font-weight:600;">WhatsApp us</a>
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('sendStatusUpdate failed:', err.message);
  }

  // WhatsApp status update
  if (order.customer_whatsapp) {
    await sendWhatsAppMessage(
      order.customer_whatsapp,
      `🧵 Silai.pk Update\n\nHi ${order.customer_name}!\nYour order *${order.order_id}* status: *${stageName}*\n\nTrack: https://silai.pk/#track?order=${order.order_id}`
    );
  }
}

module.exports = { sendOrderConfirmation, sendStatusUpdate };
