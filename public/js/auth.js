/* ═══════════════════════════════════════════════════════════
   Silai — Complete Auth System
   Sign In · Sign Up · Profile · Order Gate · Admin
═══════════════════════════════════════════════════════════ */

let currentUser = null;

// ─── Check session on page load ───────────────────────────
async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
    }
  } catch (e) {
    currentUser = null;
  }
  updateNavForUser();
  // Re-run profile view if it loaded before session resolved
  const hash = (window.location.hash || '').replace('#', '');
  if (hash === 'profile') loadProfile();
}

// ─── Update navbar based on login state ───────────────────
function updateNavForUser() {
  const authBtn    = document.getElementById('nav-auth-btn');
  const userMenu   = document.getElementById('nav-user-menu');
  const userNameEl = document.getElementById('nav-user-name');
  const adminLink  = document.getElementById('nav-admin-link');

  if (currentUser) {
    if (authBtn)    authBtn.style.display   = 'none';
    if (userMenu)   userMenu.style.display  = 'flex';
    if (userNameEl) userNameEl.textContent  = currentUser.name.split(' ')[0];
    if (adminLink)  adminLink.style.display = currentUser.role === 'admin' ? 'inline' : 'none';
  } else {
    if (authBtn)   authBtn.style.display   = 'inline-flex';
    if (userMenu)  userMenu.style.display  = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
}

// ─── Modal helpers ─────────────────────────────────────────
window.openAuthModal = function openAuthModal(tab = 'login', onSuccessCallback = null) {
  window._authCallback = onSuccessCallback || null;
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('open');
  switchAuthTab(tab);
};

window.closeAuthModal = function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
};

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  const tabEl   = document.getElementById('tab-' + tab);            // tab-login / tab-register
  const panelEl = document.getElementById(tab + '-form');           // login-form / register-form
  if (tabEl)   tabEl.classList.add('active');
  if (panelEl) panelEl.classList.add('active');
}

// ─── Sign Up ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    const origText = btn.textContent;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-password-confirm').value;

    if (password !== confirm) {
        showToast('Passwords do not match.', 'error');
        btn.disabled = false; btn.textContent = origText;
        return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      currentUser = data.user;
      updateNavForUser();
      closeAuthModal();
      showToast(`Welcome, ${data.user.name}! You're now signed in. 🎉`, 'success');
      if (window._authCallback) { window._authCallback(); window._authCallback = null; }
    } else {
      showToast(data.error || 'Registration failed. Please try again.', 'error');
    }
    btn.disabled = false; btn.textContent = origText;
  });

  // ─── Sign In ─────────────────────────────────────────────
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    const origText = btn.textContent;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value,
      })
    });
    const data = await res.json();

    if (res.ok) {
      currentUser = data.user;
      updateNavForUser();
      closeAuthModal();
      showToast(`Welcome back, ${data.user.name}! 🧵`, 'success');
      if (window._authCallback) { window._authCallback(); window._authCallback = null; }
    } else {
      showToast(data.error || 'Sign in failed. Please check your credentials.', 'error');
    }
    btn.disabled = false; btn.textContent = origText;
  });

  // ─── Admin password form ──────────────────────────────────
  document.getElementById('admin-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('admin-pw-input').value;
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;

    const res = await fetch('/api/admin/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    if (res.ok) {
      document.getElementById('admin-gate').style.display    = 'none';
      document.getElementById('admin-content').style.display = 'block';
      loadAdminDashboard();
    } else {
      showToast('Wrong admin password. Try again.', 'error');
    }
    btn.disabled = false;
  });

  // ─── Status update form ───────────────────────────────────
  document.getElementById('status-update-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('su-order-id').value;
    const stage   = parseInt(document.getElementById('su-stage').value);
    const note    = document.getElementById('su-note').value;
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Updating…';

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_number: stage, note })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${orderId} → ${data.new_status} ✅`, 'success');
        document.getElementById('status-update-modal').classList.remove('open');
        loadAdminDashboard();
      } else {
        showToast(data.error || 'Update failed.', 'error');
      }
    } catch (err) {
      showToast('Network error. Is the server running?', 'error');
    }
    btn.disabled = false; btn.textContent = 'Update Status';
  });

  checkSession();
});

// ─── Sign Out ─────────────────────────────────────────────
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateNavForUser();
  window.location.hash = '#home';
  showToast('Signed out successfully.', 'success');
}

// ─── Order flow: gate on Step 1 ───────────────────────────
// Intercept the "Continue" button on step 1 to require login
const origNextBtn = document.getElementById('btn-next');
if (origNextBtn) {
  origNextBtn.addEventListener('click', function interceptFirst(e) {
    if (window._orderAuthChecked) return; // already passed gate
    const step1Active = document.getElementById('step-1')?.classList.contains('active');
    if (step1Active && !currentUser) {
      e.stopImmediatePropagation(); // block order.js handler
      // Pre-fill auth modal with order form data if already entered
      const nameVal  = document.getElementById('customer-name')?.value;
      const emailVal = document.getElementById('customer-email')?.value;
      if (emailVal) document.getElementById('login-email').value = emailVal;
      if (emailVal) document.getElementById('reg-email').value   = emailVal;
      if (nameVal)  document.getElementById('reg-name').value    = nameVal;

      openAuthModal('login', () => {
        // After sign-in, pre-fill order form with profile data
        if (currentUser) {
          const nameInput  = document.getElementById('customer-name');
          const emailInput = document.getElementById('customer-email');
          if (nameInput  && !nameInput.value)  nameInput.value  = currentUser.name;
          if (emailInput && !emailInput.value) emailInput.value = currentUser.email;
        }
        window._orderAuthChecked = true;
        origNextBtn.click(); // re-trigger after auth
      });
    } else {
      window._orderAuthChecked = true;
    }
  }, true); // capture phase so it fires before order.js
}

// ─── Profile View ─────────────────────────────────────────
window.loadProfile = loadProfile;
async function loadProfile() {
  const notLoggedIn = document.getElementById('profile-not-logged-in');
  const loggedIn    = document.getElementById('profile-logged-in');

  if (!currentUser) {
    if (notLoggedIn) notLoggedIn.style.display = 'block';
    if (loggedIn)    loggedIn.style.display    = 'none';
    return;
  }

  if (notLoggedIn) notLoggedIn.style.display = 'none';
  if (loggedIn)    loggedIn.style.display    = 'block';

  // Set name, email, avatar initials
  const nameEl  = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avEl    = document.getElementById('profile-avatar');
  if (nameEl)  nameEl.textContent  = currentUser.name;
  if (emailEl) emailEl.textContent = currentUser.email;
  if (avEl)    avEl.textContent    = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Load orders
  const list = document.getElementById('profile-orders-list');
  if (!list) return;
  list.innerHTML = '<p class="text-muted">Loading your orders…</p>';

  try {
    const res    = await fetch('/api/auth/my-orders');
    const orders = await res.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:var(--space-2xl)">
        <div style="font-size:3rem">🧵</div>
        <h3 class="mt-lg">No orders yet</h3>
        <p>Place your first order and track it right here.</p>
        <a href="#order" class="btn btn-primary mt-lg">✂️ Place An Order</a>
      </div>`;
      return;
    }

    list.innerHTML = orders.map(o => `
      <div class="card" style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-md)">
          <div>
            <div style="font-weight:700;color:var(--gold);font-size:1.05rem;font-family:var(--font-sans)">${o.order_id}</div>
            <div style="font-size:0.82rem;color:var(--text-muted);margin-top:3px">
              ${o.garment_type || 'Garment'} · ${new Date(o.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
            </div>
          </div>
          <span class="badge badge-${o.stage_number <= 2 ? 'gold' : o.stage_number <= 6 ? 'terra' : 'teal'}">${o.status}</span>
        </div>
        <div class="price-line"><span>Total</span><span style="font-weight:700">$${Number(o.total_price).toFixed(2)}</span></div>
        <div class="price-line"><span>Paid</span><span style="color:var(--teal-light)">$${Number(o.amount_paid).toFixed(2)}</span></div>
        <div class="price-line"><span>Balance Due</span><span style="color:var(--terracotta)">$${Number(o.balance_due).toFixed(2)}</span></div>
        <button class="btn btn-outline btn-sm" onclick="switchToTrack('${o.order_id}')">📦 Track This Order →</button>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-muted">Could not load orders. Make sure the server is running.</p>';
  }
}

function switchToTrack(orderId) {
  window.location.hash = '#track';
  setTimeout(() => {
    const input = document.getElementById('order-id-input');
    if (input) input.value = orderId;
    if (typeof lookupOrder === 'function') lookupOrder(orderId);
  }, 200);
}

// ─── Admin Dashboard (Tabs & Data) ────────────────────────
function switchAdminTab(tab) {
  // Update Buttons
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.classList.remove('active');
    btn.style.borderBottom = 'none';
    btn.style.color = 'var(--text-muted)';
    btn.style.fontWeight = 'normal';
  });
  const activeBtn = Array.from(document.querySelectorAll('.admin-tab')).find(b => b.textContent.toLowerCase().includes(tab));
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.borderBottom = '3px solid var(--gold)';
    activeBtn.style.color = 'var(--text)';
    activeBtn.style.fontWeight = '600';
  }

  // Update Content Panels
  document.querySelectorAll('.admin-tab-content').forEach(panel => {
    panel.style.display = 'none';
    panel.classList.remove('active');
  });
  const activePanel = document.getElementById(`admin-tab-${tab}`);
  if (activePanel) {
    activePanel.style.display = 'block';
    activePanel.classList.add('active');
  }

  // Fetch Data based on tab
  if (tab === 'analytics') loadAdminAnalytics();
  if (tab === 'orders')    loadAdminOrders();
  if (tab === 'users')     loadAdminUsers();
}

function refreshAdminData() {
  const activeTab = document.querySelector('.admin-tab-content.active')?.id.replace('admin-tab-', '') || 'analytics';
  switchAdminTab(activeTab);
}

// Initial Boot for Admin
function loadAdminDashboard() {
  switchAdminTab('analytics');
}

async function loadAdminAnalytics() {
  try {
    const res = await fetch('/api/admin/dashboard');
    if (!res.ok) throw new Error();
    const data = await res.json();
    
    document.getElementById('dash-revenue').textContent = '$' + Number(data.total_revenue).toFixed(2);
    document.getElementById('dash-pending').textContent = '$' + Number(data.pending_balance).toFixed(2);
    document.getElementById('dash-orders').textContent  = data.total_orders;

    const rt = document.getElementById('dash-recent-orders-table');
    if (!data.recent_orders || !data.recent_orders.length) {
      rt.innerHTML = '<p class="text-muted" style="padding:var(--space-md)">No recent activity.</p>';
      return;
    }
    rt.innerHTML = `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">ORDER ID</th>
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">CUSTOMER</th>
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">DATE</th>
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${data.recent_orders.map(o => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:12px;font-weight:700;color:var(--gold)">${o.order_id}</td>
              <td style="padding:12px">${o.customer_name}</td>
              <td style="padding:12px;color:var(--text-muted)">${new Date(o.created_at).toLocaleDateString()}</td>
              <td style="padding:12px"><span class="badge badge-terra">${o.status}</span></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
      
      // Update Chart
      const ctx = document.getElementById('admin-chart');
      if (ctx && window.Chart) {
         if(window._adminChart) window._adminChart.destroy();
         // Fake timeline data for demo purposes if backend isn't sending historic data yet
         window._adminChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [120, 250, 480, data.total_revenue],
                    borderColor: '#E9C46A',
                    backgroundColor: 'rgba(233,196,106,0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
         });
      }
      
  } catch(e) { console.error('Admin Analytics Error', e); }
}

async function loadAdminOrders() {
  const el = document.getElementById('admin-orders-table');
  el.innerHTML = '<p class="text-muted" style="padding:var(--space-lg)">Loading orders…</p>';
  try {
    const res = await fetch('/api/admin/orders');
    if (!res.ok) throw new Error();
    const orders = await res.json();
    if (!orders.length) { el.innerHTML = '<p class="text-muted" style="padding:var(--space-lg)">No orders.</p>'; return; }

    el.innerHTML = `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:12px 10px;text-align:left;font-size:0.72rem;text-transform:uppercase;color:var(--text-muted)">Order ID</th>
              <th style="padding:12px 10px;text-align:left;font-size:0.72rem;text-transform:uppercase;color:var(--text-muted)">Customer</th>
              <th style="padding:12px 10px;text-align:left;font-size:0.72rem;text-transform:uppercase;color:var(--text-muted)">Status</th>
              <th style="padding:12px 10px;text-align:left;font-size:0.72rem;text-transform:uppercase;color:var(--text-muted)">Total</th>
              <th style="padding:12px 10px;text-align:left;font-size:0.72rem;text-transform:uppercase;color:var(--text-muted)">Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:12px 10px;font-weight:700;color:var(--gold);font-family:var(--font-sans)">${o.order_id}</td>
                <td style="padding:12px 10px">
                  <div style="font-weight:600">${o.customer_name}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">${o.customer_email || ''}</div>
                </td>
                <td style="padding:12px 10px"><span class="badge badge-terra">${o.status}</span></td>
                <td style="padding:12px 10px;color:var(--teal-light);font-weight:600">$${Number(o.total_price).toFixed(2)}</td>
                <td style="padding:12px 10px">
                  <button class="btn btn-sm btn-outline" onclick="openStatusUpdate('${o.order_id}', ${o.stage_number})">Update</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { el.innerHTML = '<p class="text-muted" style="padding:var(--space-lg)">Error loading orders.</p>'; }
}

async function loadAdminUsers() {
  const el = document.getElementById('admin-users-table');
  el.innerHTML = '<p class="text-muted" style="padding:var(--space-lg)">Loading users…</p>';
  try {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error();
    const users = await res.json();
    if (!users.length) { el.innerHTML = '<p class="text-muted" style="padding:var(--space-lg)">No users registered yet.</p>'; return; }

    el.innerHTML = `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">NAME</th>
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">EMAIL</th>
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">ROLE</th>
              <th style="padding:12px;text-align:left;font-size:0.75rem;color:var(--text-muted)">JOINED</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:12px;font-weight:600">${u.name}</td>
              <td style="padding:12px;color:var(--text-muted)">${u.email}</td>
              <td style="padding:12px"><span class="badge ${u.role==='admin'?'badge-gold':'badge-outline'}">${u.role.toUpperCase()}</span></td>
              <td style="padding:12px;color:var(--text-muted)">${new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { el.innerHTML = '<p class="text-muted" style="padding:var(--space-lg)">Error loading users.</p>'; }
}

function openStatusUpdate(orderId, currentStage) {
  document.getElementById('su-order-id').value = orderId;
  document.getElementById('su-stage').value    = currentStage || 1;
  document.getElementById('su-note').value     = '';
  document.getElementById('status-update-modal').classList.add('open');
}
