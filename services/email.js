const { Resend } = require('resend');

const FROM = 'orders@silai.pk';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendOrderConfirmation(order) {
  try {
    const trackingLink = `https://silai.pk/#track?order=${order.order_id}`;
    const garmentCount = order.garment_count || 1;

    await getResend().emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `Order ${order.order_id} Confirmed 🧵`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
          <h2 style="color:#2a9d8f;">Your Silai Order is Confirmed!</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Thank you for your order. Here are your details:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;color:#64748b;">Order ID</td><td style="padding:8px 0;font-weight:600;">${order.order_id}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Garments</td><td style="padding:8px 0;">${garmentCount} item${garmentCount !== 1 ? 's' : ''}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Total Paid</td><td style="padding:8px 0;font-weight:600;">$${Number(order.total_price).toFixed(2)}</td></tr>
          </table>
          <p>
            <a href="${trackingLink}" style="display:inline-block;background:#2a9d8f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              Track Your Order
            </a>
          </p>
          <p style="color:#64748b;font-size:0.9rem;">
            Next step: please ship your fabric to our Lahore workshop. We'll WhatsApp you once it arrives.
          </p>
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="color:#94a3b8;font-size:0.8rem;">Silai · Lahore, Pakistan · silai.pk</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('sendOrderConfirmation failed:', err.message);
  }
}

async function sendStatusUpdate(order, stageName) {
  try {
    const trackingLink = `https://silai.pk/#track?order=${order.order_id}`;

    await getResend().emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `Your Silai Order Update: ${stageName}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
          <h2 style="color:#2a9d8f;">Order Update</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Your order <strong>${order.order_id}</strong> has been updated:</p>
          <div style="background:#f0fdfa;border-left:4px solid #2a9d8f;padding:12px 16px;border-radius:4px;margin:16px 0;">
            <strong style="color:#2a9d8f;">${stageName}</strong>
          </div>
          <p>
            <a href="${trackingLink}" style="display:inline-block;background:#2a9d8f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              View Full Tracking
            </a>
          </p>
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="color:#94a3b8;font-size:0.8rem;">Silai · Lahore, Pakistan · silai.pk</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('sendStatusUpdate failed:', err.message);
  }
}

module.exports = { sendOrderConfirmation, sendStatusUpdate };
