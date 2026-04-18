/* ═══════════════════════════════════════════════════════════
   Silai — Order Tracking Page JS
═══════════════════════════════════════════════════════════ */

const STAGE_ICONS = ['📦','🚚','🏭','✂️','🧵','✨','📸','💳','✈️','🎉'];
const STAGE_EMOJIS_PENDING = ['📦','🚚','🏭','✂️','🧵','✨','📸','💳','✈️','🎉'];

// ─── Check URL params on load ──────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order');
  const input = document.getElementById('order-id-input');
  if (orderId && input) {
    input.value = orderId;
    lookupOrder(orderId);
  }
});

// ─── Search form ───────────────────────────────────────────
document.getElementById('track-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const orderId = document.getElementById('order-id-input')?.value.trim().toUpperCase();
  if (!orderId) { showToast('Please enter your Order ID (e.g. SB-2025-00001)', 'error'); return; }
  lookupOrder(orderId);
});

// ─── Main lookup function ──────────────────────────────────
async function lookupOrder(orderId) {
  const btn = document.querySelector('#track-form button');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Looking up…'; }

  try {
    const resp = await fetch(`/api/track/${orderId}`);
    const data = await resp.json();

    if (!resp.ok) {
      showToast(data.error || 'Order not found.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Track Order'; }
      return;
    }
    renderTrackingResult(data);
    // Update URL without reload
    history.replaceState(null, '', `?order=${orderId}`);
  } catch (err) {
    // Demo fallback
    renderDemoFallback(orderId, btn);
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Track Order'; }
}

// ─── Render tracking result ────────────────────────────────
function renderTrackingResult(data) {
  const result = document.getElementById('tracking-result');
  if (!result) return;

  // Header
  document.getElementById('result-order-id').textContent   = data.order_id;
  document.getElementById('result-customer').textContent   = data.customer_name;
  document.getElementById('result-country').textContent    = data.shipping_country || '—';
  document.getElementById('result-garment').textContent    = data.garment || '—';
  document.getElementById('result-paid').textContent       = `$${data.amount_paid?.toFixed(2) || '0.00'}`;
  document.getElementById('result-balance').textContent    = `$${data.balance_due?.toFixed(2) || '0.00'}`;

  // WhatsApp link
  const waBtn = document.getElementById('result-whatsapp');
  if (waBtn) waBtn.href = data.whatsapp_link;

  // Timeline
  const timeline = document.getElementById('tracking-timeline');
  if (timeline && data.stages) {
    timeline.innerHTML = data.stages.map((stage, i) => `
      <div class="timeline-stage ${stage.status}">
        <div class="timeline-dot ${stage.status}">${STAGE_ICONS[i]}</div>
        <div class="timeline-content ${stage.status}">
          <h4>${stage.name}</h4>
          <p>${stage.description}</p>
          ${stage.note ? `<div class="timeline-note">${stage.note}</div>` : ''}
          ${stage.completed_at ? `<div class="timeline-time">📅 ${formatDate(stage.completed_at)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Progress bar
  const pct = ((data.current_stage - 1) / 9) * 100;
  const fill = document.getElementById('tracking-progress-fill');
  if (fill) { fill.style.width = '0%'; setTimeout(() => { fill.style.width = `${pct}%`; }, 200); }

  const stageName = document.getElementById('result-stage');
  if (stageName) { stageName.textContent = data.current_stage_name; }

  result.classList.add('visible');
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Demo fallback (when server not running) ───────────────
function renderDemoFallback(orderId, btn) {
  if (btn) { btn.disabled = false; btn.textContent = 'Track Order'; }

  const demoData = {
    order_id: 'SB-2025-00001',
    customer_name: 'Fatima Khan',
    shipping_country: 'United Kingdom',
    garment: 'Full Suit — Chiffon',
    amount_paid: 21.00,
    balance_due: 21.00,
    current_stage: 5,
    current_stage_name: 'Stitching',
    whatsapp_link: 'https://wa.me/923000446387',
    stages: [
      { number:1,  name:'Order Received',    description:'We have received your order and payment. Awaiting your fabric parcel.',  status:'completed', completed_at:'2025-06-01T10:00:00Z', note:'Order SB-2025-00001 confirmed. 50% payment received.' },
      { number:2,  name:'Fabric In Transit', description:'Your fabric is on its way to us in Lahore.',                             status:'completed', completed_at:'2025-06-03T14:00:00Z', note:'DHL tracking: 1Z999AA10123456784' },
      { number:3,  name:'Fabric Arrived',    description:'Your fabric has arrived at our Lahore workshop. Quality check in progress.', status:'completed', completed_at:'2025-06-08T09:00:00Z', note:'Fabric received and quality checked. ✅' },
      { number:4,  name:'Cutting',           description:'Our tailor has reviewed your measurements and is beginning the cut.',    status:'completed', completed_at:'2025-06-09T11:00:00Z', note:null },
      { number:5,  name:'Stitching',         description:'Your outfit is being stitched. Expected to complete in 3-5 days.',      status:'current',   completed_at:null, note:'Our master tailor Ustad Rasheed is stitching your chiffon suit. 🧵' },
      { number:6,  name:'QC & Finishing',    description:'Quality check done. Final pressing and finishing touches being applied.',status:'pending',   completed_at:null, note:null },
      { number:7,  name:'Photos Sent',       description:'We have sent you WhatsApp photos of your finished outfit for approval.', status:'pending',  completed_at:null, note:null },
      { number:8,  name:'Awaiting Balance',  description:'Please pay the remaining 50% balance to proceed to shipping.',          status:'pending',   completed_at:null, note:null },
      { number:9,  name:'Shipped',           description:'Your outfit is on its way! Check your WhatsApp for the tracking number.',status:'pending',  completed_at:null, note:null },
      { number:10, name:'Delivered',         description:'Your outfit has been delivered. We hope you love it! 💚',               status:'pending',  completed_at:null, note:null },
    ]
  };

  const useData = orderId === 'SB-2025-00001' || orderId === 'SB-2025-00002' ? demoData : { ...demoData, order_id: orderId };
  renderTrackingResult(useData);
}

// ─── Date formatting ───────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
