/* ═══════════════════════════════════════════════════════════
   Silai — Shared JS: Nav, Theme, Scroll Reveal, Toast, Utility
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Theme initialization removed (Dark Luxury is default)
});

// ─── Navbar scroll effect ──────────────────────────────────
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ─── Mobile menu ──────────────────────────────────────────
const hamburger = document.querySelector('.nav-hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const menuOverlay = document.querySelector('.mobile-menu-overlay');

function closeMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
  if (menuOverlay) menuOverlay.classList.remove('open');
  if (hamburger) {
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    if (menuOverlay) menuOverlay.classList.toggle('open', isOpen);
    
    const spans = hamburger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(8px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });


  // Close menu on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
  
  // Close on overlay click
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
}


// ─── Scroll Reveal ────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// ─── Animated counters ─────────────────────────────────────
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const duration = 2000;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start) + suffix;
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ─── Accordion ────────────────────────────────────────────
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const body = btn.nextElementSibling;
    const isActive = btn.classList.contains('active');

    // Close all in same container
    const parent = btn.closest('.accordion-group') || document;
    parent.querySelectorAll('.accordion-btn').forEach(b => {
      b.classList.remove('active');
      const bb = b.nextElementSibling;
      if (bb) bb.classList.remove('open');
    });

    if (!isActive) {
      btn.classList.add('active');
      body.classList.add('open');
    }
  });
});

// ─── Toast notifications ───────────────────────────────────
function showToast(message, type = 'success', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── WhatsApp float button ─────────────────────────────────
const waBtns = document.querySelectorAll('.whatsapp-float');
waBtns.forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Chat with us!';
    tooltip.style.cssText = 'position:absolute;right:64px;top:50%;transform:translateY(-50%);background:#25D366;color:#fff;padding:6px 12px;border-radius:20px;font-size:0.8rem;white-space:nowrap;font-weight:600;';
    btn.style.position = 'relative';
    btn.appendChild(tooltip);
    btn.addEventListener('mouseleave', () => tooltip.remove(), { once: true });
  });
});

// ─── SPA Router ───────────────────────────────────
/**
 * Handles view switching based on URL hash (e.g. #order, #track)
 */
function handleHashChange() {
  const hash = (window.location.hash || '#home').replace('#', '');
  
  // 1. Hide all views
  const allViews = document.querySelectorAll('.spa-view');
  allViews.forEach(view => {
    view.classList.remove('active-view');
    view.style.display = 'none'; // Force hide
  });

  // 2. Find target view
  const targetId = 'view-' + hash;
  let targetView = document.getElementById(targetId);

  // 3. Fallback to home if not found
  if (!targetView) {
    targetView = document.getElementById('view-home');
    if (window.location.hash && window.location.hash !== '#home') {
       console.warn(`View "${targetId}" not found, falling back to home.`);
    }
  }

  // 4. Show active view
  if (targetView) {
    targetView.style.display = 'block';
    setTimeout(() => targetView.classList.add('active-view'), 10);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 5. Run specific view logic
  if (hash === 'profile' && window.loadProfile) window.loadProfile();
  if (hash === 'order' && window.initOrderForm) window.initOrderForm();
}

// Global initialization
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('load', handleHashChange);

// Expose toast globally
window.showToast = showToast;
window.handleHashChange = handleHashChange;
