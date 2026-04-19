/* ═══════════════════════════════════════════════════════════
   Silai — Order Form Logic
   Multi-step navigation, price calc, API submission
═══════════════════════════════════════════════════════════ */

const PRICES = {
  base: { 'kameez': 22, 'fullsuit': 32, '3piece': 45, 'party': 60 },
  addons: { 'express': 10, 'lining': 5, 'neckline': 6, 'consult': 5, 'trims': 5, 'piping': 5 }
};

// ─── Tiered Shipping Zones ──────────────────────────────────
const SHIPPING_ZONES = {
  north_america: {
    countries: ['United States', 'Canada'],
    tiers: [
      { min: 1, max: 5,  rate: 39, label: '$39 flat rate' },
      { min: 6, max: 10, rate: 55, label: '$55 flat rate' },
      { min: 11, max: null, rate: 0, label: 'Free Shipping 🎉' }
    ]
  },
  uk_europe: {
    countries: ['United Kingdom'],
    tiers: [
      { min: 1, max: 5,  rate: 35, label: '$35 flat rate' },
      { min: 6, max: 10, rate: 48, label: '$48 flat rate' },
      { min: 11, max: null, rate: 0, label: 'Free Shipping 🎉' }
    ]
  },
  middle_east: {
    countries: ['United Arab Emirates'],
    tiers: [
      { min: 1, max: 5,  rate: 30, label: '$30 flat rate' },
      { min: 6, max: null, rate: 0, label: 'Free Shipping 🎉' }
    ]
  },
  australia: {
    countries: ['Australia'],
    tiers: [
      { min: 1, max: 5,  rate: 42, label: '$42 flat rate' },
      { min: 6, max: null, rate: 0, label: 'Free Shipping 🎉' }
    ]
  },
  domestic: {
    countries: ['Pakistan']
  }
};
const CLOTHING_TYPES = ['kameez', 'fullsuit', '3piece', 'party'];

function calculateTieredShipping(cartItems, destinationCountry) {
  // Count only clothing items (not accessories)
  const clothingCount = cartItems.filter(item => CLOTHING_TYPES.includes(item.type)).length;
  const totalValueUSD = cartItems.reduce((sum, i) => sum + (i.price || 0), 0);

  // Find zone
  let zone = null;
  let zoneName = null;
  for (const [name, z] of Object.entries(SHIPPING_ZONES)) {
    if (z.countries.includes(destinationCountry)) { zone = z; zoneName = name; break; }
  }

  // Domestic Pakistan — value-based
  if (zoneName === 'domestic') {
    const pkrValue = totalValueUSD * 280; // rough PKR conversion
    if (pkrValue >= 3000) {
      return { rate: 0, label: 'Free Shipping 🎉', upsell: null, tierIndex: 1, zone: 'domestic' };
    }
    return { rate: 0, label: 'Rs. 200', upsell: null, tierIndex: 0, zone: 'domestic' };
  }

  if (!zone || !zone.tiers) return null; // unknown zone — fall back to Shippo

  // Find matching tier
  let matchedTier = null;
  let matchedIndex = 0;
  for (let i = 0; i < zone.tiers.length; i++) {
    const t = zone.tiers[i];
    const inRange = clothingCount >= t.min && (t.max === null || clothingCount <= t.max);
    if (inRange) { matchedTier = t; matchedIndex = i; break; }
  }
  if (!matchedTier) matchedTier = zone.tiers[zone.tiers.length - 1];

  // Calculate upsell message
  let upsell = null;
  const nextTier = zone.tiers[matchedIndex + 1];
  if (nextTier && matchedTier.rate > 0) {
    const itemsNeeded = nextTier.min - clothingCount;
    if (nextTier.rate === 0) {
      upsell = { itemsNeeded, msg: `Add ${itemsNeeded} more suit${itemsNeeded !== 1 ? 's' : ''} to unlock Free Shipping! 🎉`, progress: (clothingCount / nextTier.min) * 100 };
    } else {
      const saving = matchedTier.rate - nextTier.rate;
      upsell = { itemsNeeded, msg: `Add ${itemsNeeded} more suit${itemsNeeded !== 1 ? 's' : ''} without paying any extra shipping!`, progress: (clothingCount / nextTier.min) * 100 };
    }
  } else if (matchedTier.rate === 0) {
    upsell = { itemsNeeded: 0, msg: 'You have Free Shipping on this order! 🎉', progress: 100 };
  }

  return { rate: matchedTier.rate, label: matchedTier.label, upsell, tierIndex: matchedIndex, zone: zoneName, clothingCount };
}

function updateShippingUI(result) {
  if (!result) return;

  // Update sidebar "Shipping" line
  const shipElem = document.querySelector('#sidebar-shipping') || document.querySelector('.price-line span.text-teal');
  if (shipElem) shipElem.textContent = result.rate > 0 ? formatPrice(result.rate) : result.label;

  // Update checkout panel rate display
  const tierRateEl = document.getElementById('shipping-tier-rate-review') || document.getElementById('shipping-tier-rate');
  if (tierRateEl) tierRateEl.textContent = result.rate > 0 ? formatPrice(result.rate) : result.label;

  // Update item count display
  const itemCountEl = document.getElementById('shipping-item-count');
  if (itemCountEl) {
    const c = result.clothingCount || 1;
    itemCountEl.textContent = `${c} clothing item${c !== 1 ? 's' : ''}`;
  }

  // Update upsell bar
  const upsellBar = document.getElementById('shipping-upsell-bar');
  const upsellProgress = document.getElementById('upsell-progress');
  const upsellMsg = document.getElementById('upsell-msg');
  if (upsellBar && result.upsell) {
    upsellBar.style.display = 'block';
    if (upsellProgress) upsellProgress.style.width = Math.min(100, result.upsell.progress) + '%';
    if (upsellMsg) upsellMsg.textContent = result.upsell.msg;
  } else if (upsellBar) {
    upsellBar.style.display = 'none';
  }

  // Update order summary shipping in checkout sidebar
  const coShipEl = document.querySelector('#shipping-tier-rate');
  if (coShipEl) coShipEl.textContent = result.rate > 0 ? formatPrice(result.rate) : result.label;
}

function runTieredShipping() {
  const c1 = document.getElementById('co-country')?.value;
  const c2 = document.getElementById('shipping-country')?.value;
  const country = c1 || c2 || 'United States';
  
  if (state.cart.length === 0) {
    state.shippingRate = 0;
    state.shippingLabel = '$0.00';
    updateShippingUI({ rate: 0, label: '$0.00', upsell: null, clothingCount: 0 });
    recalcPrice();
    return null;
  }
  const cartItems = state.cart;
  const result = calculateTieredShipping(cartItems, country);
  if (result !== null) {
    state.shippingRate = result.rate;
    state.shippingLabel = result.label;
    updateShippingUI(result);
  } else {
    state.shippingRate = -1;
    state.shippingLabel = 'TBD';
  }
  recalcPrice();
  return result;
}


let state = {
  currentStep: 1,
  totalSteps: 5,
  garmentType: '',
  currency: { code: 'USD', symbol: '$', rate: 1 },
  basePrice: 0,
  addons: {},
  addonsPrice: 0,
  measurementMethod: 'standard',
  orderData: {},
  referenceDesignBase64: '',
  loyaltyPoints: 0,
  sourcePicBase64: '',
  trimsPicBase64: '',
  measPicBase64: '',
  shippingRate: -1,
  shippingLabel: 'TBD',
  tempSize: 'M',
  tempQty: 1,
  cart: [],
  sourcingFee: 0,
  fabricEstimate: 0
};

function saveCartToStorage() {
  localStorage.setItem('silai-cart', JSON.stringify(state.cart));
}

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('silai-cart');
    if (saved) {
      state.cart = JSON.parse(saved);
      renderCart();
    }
    const savedCountry = localStorage.getItem('silai-shipping-country');
    if (savedCountry) {
      const sel1 = document.getElementById('shipping-country');
      const sel2 = document.getElementById('co-country');
      if (sel1) sel1.value = savedCountry;
      if (sel2) sel2.value = savedCountry;
      state.orderData.shipping_country = savedCountry;
    }
    runTieredShipping();
    recalcPrice();
  } catch(e) { console.error('Failed to parse cart'); }
}

window.addItemToCart = function() {
  const garmentType = document.getElementById('garment-type-val')?.value || 'kameez';
  const qty = state.tempQty || 1;
  const unitPrice = state.basePrice + state.addonsPrice;
  const baseItem = {
    type: garmentType,
    fabric: document.getElementById('fabric-type')?.value,
    neckline: document.getElementById('neckline')?.value,
    sleeve: document.getElementById('sleeve-style')?.value,
    bottom: document.getElementById('trouser-style')?.value,
    addons: Object.entries(state.addons).filter(([,v]) => v).map(([k]) => k),
    price: unitPrice,
    base_price: state.basePrice,
    addons_price: state.addonsPrice,
    size: state.tempSize || 'M',
    measurements: {
      method: state.measurementMethod,
      standard_size: document.getElementById('meas-standard-size')?.value,
      chest: document.getElementById('meas-chest')?.value,
      waist: document.getElementById('meas-waist')?.value,
      hips: document.getElementById('meas-hips')?.value,
      klength: document.getElementById('meas-klength')?.value,
      sleeve: document.getElementById('meas-sleeve')?.value,
      shoulder: document.getElementById('meas-shoulder')?.value,
      trouser: document.getElementById('meas-trouser')?.value,
      inseam: document.getElementById('meas-inseam')?.value,
      pic: state.measPicBase64
    },
    style: {
      notes: document.getElementById('special-instructions')?.value,
      reference: state.referenceDesignBase64,
      fabric_sourcing: document.getElementById('source-fabric-check')?.checked
        ? {
            link: document.getElementById('source-fabric-link')?.value,
            desc: document.getElementById('source-fabric-desc')?.value,
            pic: state.sourcePicBase64
          }
        : null
    }
  };
  for (let i = 0; i < qty; i++) {
    state.cart.push({ ...baseItem, id: Date.now() + i });
  }
  saveCartToStorage();
  clearGarmentForm();
  state.tempQty = 1;
  renderCart();
  runTieredShipping();
  recalcPrice();
  const msg = qty > 1 ? `${qty} garments added to cart!` : 'Garment added to cart!';
  if (typeof showToast === 'function') showToast(msg, 'success');
  goToStep(4);
};

window.removeItemFromCart = function(id) {
  state.cart = state.cart.filter(item => item.id !== id);
  state.basePrice = 0;
  state.addonsPrice = 0;
  state.addons = {};
  saveCartToStorage();
  renderCart();
  runTieredShipping();
  recalcPrice();
};

window.clearCart = function() {
  if (!confirm('Clear all items from cart?')) return;
  state.cart = [];
  state.basePrice = 0;
  state.addonsPrice = 0;
  state.addons = {};
  state.shippingRate = -1;
  state.shippingLabel = 'TBD';
  state.sourcingFee = 0;
  state.fabricEstimate = 0;
  // Reset sourcing UI
  const fbCk = document.getElementById('source-fabric-check');
  if (fbCk) fbCk.checked = false;
  const fbDet = document.getElementById('source-fabric-details');
  if (fbDet) fbDet.style.display = 'none';
  const estInp = document.getElementById('source-fabric-est-price');
  if (estInp) estInp.value = '';
  saveCartToStorage();
  clearGarmentForm();
  renderCart();
  runTieredShipping();
};

window.duplicateItemInCart = function(id) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  const copy = JSON.parse(JSON.stringify(item));
  copy.id = Date.now();
  state.cart.push(copy);
  saveCartToStorage();
  renderCart();
  runTieredShipping();
  recalcPrice();
  if (typeof showToast === 'function') showToast('Garment duplicated!', 'success');
};

window.startConfiguration = function(garmentType) {
  // Validate step 1 required fields before proceeding
  if (!validateStep(1)) return;
  const size = document.querySelector(`input[name="size-${garmentType}"]:checked`)?.value || 'M';
  const qtyInput = document.getElementById(`qty-${garmentType}`);
  const qty = parseInt(qtyInput?.value || 1);
  state.garmentType = garmentType;
  state.tempSize = size;
  state.tempQty = qty;
  const hidden = document.getElementById('garment-type-val');
  if (hidden) hidden.value = garmentType;
  const sizeSelect = document.getElementById('meas-standard-size');
  if (sizeSelect) sizeSelect.value = size;
  state.basePrice = PRICES.base[garmentType] || PRICES.base['kameez'];
  recalcPrice();
  goToStep(2);
};

window.changeQty = function(garmentType, delta) {
  const input = document.getElementById(`qty-${garmentType}`);
  if (!input) return;
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  input.value = val;
  state.tempQty = val;
};

function clearGarmentForm() {
  state.addons = {};
  state.referenceDesignBase64 = '';
  state.sourcePicBase64 = '';
  state.trimsPicBase64 = '';
  state.measPicBase64 = '';
  document.querySelectorAll('.addon-toggle').forEach(t => t.checked = false);
  document.querySelectorAll('.addon-item').forEach(i => i.classList.remove('selected'));
  const instr = document.getElementById('special-instructions');
  if (instr) instr.value = '';
  const sfCheck = document.getElementById('source-fabric-check');
  if (sfCheck) sfCheck.checked = false;
  const sfDetails = document.getElementById('source-fabric-details');
  if (sfDetails) sfDetails.style.display = 'none';
}

function renderCart() {
  const container = document.getElementById('cart-items-list');
  const sidebarList = document.getElementById('sidebar-cart-list');

  if (state.cart.length === 0) {
    if (container) container.innerHTML = '<div class="text-center p-lg"><p>Your cart is empty.</p></div>';
    if (sidebarList) sidebarList.innerHTML = '';
    // Clear nav badge
    const navBadge = document.getElementById('nav-cart-badge');
    if (navBadge) { navBadge.textContent = '0'; navBadge.style.display = 'none'; }
    updateNavMiniCart();
    recalcPrice();
    return;
  }

  if (!container) return;

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item-card card mb-md" style="padding:var(--space-md); border:1px solid var(--border); background:rgba(255,255,255,0.02)">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:12px; align-items:center;">
          <div style="font-size:1.5rem">${item.type === 'kameez' ? '👘' : '👗'}</div>
          <div>
            <div style="font-weight:600; text-transform:capitalize; font-size:0.95rem;">${item.type} (${item.fabric})</div>
            <div style="font-size:0.8rem; color:var(--text-muted)">Neck: ${item.neckline} | Size: ${item.measurements.standard_size || 'Custom'}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700; color:var(--gold);">${formatPrice(item.price)}</div>
          <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:4px;">
              <button type="button" onclick="window.duplicateItemInCart(${item.id})" style="background:none; border:none; color:var(--gold); font-size:0.8rem; cursor:pointer; text-decoration:underline;">Duplicate</button>
              <button type="button" onclick="removeItemFromCart(${item.id})" style="background:none; border:none; color:var(--rose); font-size:0.8rem; cursor:pointer; text-decoration:underline;">Remove</button>
            </div>
        </div>
      </div>
    </div>
  `).join('');

  if (sidebarList) {
    sidebarList.innerHTML = state.cart.map(item => `
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px; color:var(--text-secondary)">
        <span>1x ${item.type}</span>
        <span>${formatPrice(item.price)}</span>
      </div>
    `).join('');
  }

  const coGarment = document.getElementById('checkout-garment');
  if (coGarment) coGarment.textContent = `${state.cart.length} Garment${state.cart.length !== 1 ? 's' : ''}`;

  const coTitle = document.getElementById('checkout-summary-title');
  if (coTitle) coTitle.textContent = `Order summary (${state.cart.length} item${state.cart.length !== 1 ? 's' : ''})`;

  const stepCount = document.getElementById('shipping-item-count');
  if (stepCount) stepCount.textContent = `${state.cart.length} clothing item${state.cart.length !== 1 ? 's' : ''}`;

  const navBadge = document.getElementById('nav-cart-badge');
  if (navBadge) {
    navBadge.textContent = state.cart.length;
    navBadge.style.display = state.cart.length > 0 ? 'inline-block' : 'none';
  }

  updateNavMiniCart();

  // check for upsell
  const upsellContainer = document.getElementById('review-upsell-container');
  if (upsellContainer) {
    if (state.cart.length > 0) {
      const hasTrims = state.cart.some(i => i.addons && i.addons.includes('trims'));
      if (!hasTrims) {
        upsellContainer.style.display = 'block';
        upsellContainer.innerHTML = `
          <div class="card" style="background:rgba(212,175,55,0.05); border:1px dashed var(--gold); padding:var(--space-md);">
            <h4 style="color:var(--gold); margin-bottom:8px;">✨ Complete the Look</h4>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <p style="font-size:0.85rem; margin:0; color:var(--text-muted)">Add custom Tassels, Laces & Buttons to elevate your design.</p>
              <button type="button" class="btn btn-sm btn-outline" style="white-space:nowrap; margin-left:12px;" onclick="goToStep(2)">Edit Add-ons</button>
            </div>
          </div>
        `;
      } else {
        upsellContainer.style.display = 'none';
      }
    } else {
      upsellContainer.style.display = 'none';
    }
  }
}


// ─── IP Geolocation & Live Currency ────────────────────────
const countryToCurrencyMap = { 'US': 'USD', 'GB': 'GBP', 'CA': 'CAD', 'AE': 'AED', 'AU': 'AUD' };
const currencySymbols = { 'USD': '$', 'GBP': '£', 'CAD': 'C$', 'AED': 'د.إ', 'AUD': 'A$' };
let liveExchangeRates = { 'USD': 1 };

async function initLocation() {
  try {
    let savedCode = localStorage.getItem('silai-country-code');
    let savedCurrency = localStorage.getItem('silai-currency-code');
    if (!savedCode || !savedCurrency) {
      const geoResp = await fetch('https://ipapi.co/json/');
      const geoData = await geoResp.json();
      savedCode = geoData.country_code || 'US';
      savedCurrency = countryToCurrencyMap[savedCode] || 'USD';
    }

    state.currency.code = savedCurrency;
    state.currency.symbol = currencySymbols[savedCurrency] || savedCurrency + ' ';
    const flagEl = document.getElementById('nav-flag');
    const currencyEl = document.getElementById('nav-currency');
    const countrySel = document.getElementById('loc-country-sel');
    if (flagEl) flagEl.textContent = getFlagEmoji(savedCode);
    if (currencyEl) currencyEl.textContent = savedCurrency + ' / ' + state.currency.symbol;
    if (countrySel) countrySel.value = savedCode;

    const formalNames = { 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AE': 'United Arab Emirates', 'AU': 'Australia' };
    const shipCountry1 = document.getElementById('shipping-country');
    const shipCountry2 = document.getElementById('co-country');
    if (shipCountry1 && formalNames[savedCode]) shipCountry1.value = formalNames[savedCode];
    if (shipCountry2 && formalNames[savedCode]) shipCountry2.value = formalNames[savedCode];

    const fxResp = await fetch('https://open.er-api.com/v6/latest/USD');
    const fxData = await fxResp.json();
    if (fxData && fxData.rates) {
      liveExchangeRates = fxData.rates;
      state.currency.rate = liveExchangeRates[state.currency.code] || 1;
    }
  } catch(e) { 
    console.error('Location/FX Error:', e);
    // Safety Fallbacks
    state.currency.rate = 1;
    state.currency.code = 'USD';
    state.currency.symbol = '$';
  }
  recalcPrice();
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

window.saveLocationPreferences = function() {
  const sel = document.getElementById('loc-country-sel');
  if(!sel) return;
  const opt = sel.options[sel.selectedIndex];
  const countryCode = opt.value;
  const currCode = opt.getAttribute('data-currency');
  localStorage.setItem('silai-country-code', countryCode);
  localStorage.setItem('silai-currency-code', currCode);
  document.getElementById('location-modal').classList.remove('open');
  initLocation();
};

document.getElementById('loc-country-sel')?.addEventListener('change', function() {
  const currCode = this.options[this.selectedIndex].getAttribute('data-currency');
  document.getElementById('loc-currency-preview').value = currCode + ' ' + (currencySymbols[currCode]||'');
});

// ─── Step navigation ───────────────────────────────────────
function goToStep(step) {
  if (step < 1 || step > state.totalSteps) return;
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`step-${step}`);
  if (target) target.classList.add('active');
  updateProgress(step);
  state.currentStep = step;
  updateNavButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (step === 5) {
    // Sync country from step-1 selector into checkout country
    const shipCountry = document.getElementById('shipping-country')?.value;
    const coCountryEl = document.getElementById('co-country');
    if (coCountryEl && shipCountry && !coCountryEl.value) coCountryEl.value = shipCountry;

    // Mount Stripe card element if available
    if (cardElement) {
      const mountTarget = document.getElementById('stripe-card-element');
      if (mountTarget && !mountTarget._stripeMounted) {
        cardElement.mount('#stripe-card-element');
        mountTarget._stripeMounted = true;
        cardElement.on('change', (e) => {
          const errEl = document.getElementById('stripe-card-errors');
          if (errEl) errEl.textContent = e.error ? e.error.message : '';
        });
      }
    }
  }
}

function updateProgress(step) {
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i + 1 < step) dot.classList.add('completed');
    else if (i + 1 === step) dot.classList.add('active');
  });
}

function updateNavButtons() {
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');

  if (state.currentStep === 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none'; // product card buttons handle step 1 navigation
    if (submitBtn) submitBtn.style.display = 'none';
  } else if (state.currentStep === state.totalSteps) {
    if (prevBtn) prevBtn.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'block';
    populateReview();
  } else {
    if (prevBtn) prevBtn.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'block';
    if (submitBtn) submitBtn.style.display = 'none';
  }
}

function nextStep() {
  if (validateStep(state.currentStep)) {
    if (state.currentStep === 3) {
      window.addItemToCart();
    } else {
      goToStep(state.currentStep + 1);
    }
  }
}


function prevStep() {
  goToStep(state.currentStep - 1);
}

function validateStep(step) {
  const stepTarget = document.getElementById(`step-${step}`);
  if (!stepTarget) return true;
  const reqs = stepTarget.querySelectorAll('[required]');
  let valid = true;
  reqs.forEach(input => {
    let isValidInput = true;
    if (!input.value) isValidInput = false;
    else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) isValidInput = false;
    else if (input.type === 'tel' && !/^\+?[0-9\s\-()]{7,20}$/.test(input.value)) isValidInput = false;

    if (!isValidInput) {
      valid = false;
      input.style.borderColor = 'red';
      input.style.boxShadow = '0 0 0 2px rgba(255,0,0,0.2)';
      input.addEventListener('input', () => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
      }, { once: true });
    }
  });
  if (!valid && typeof showToast === 'function') {
    showToast('Please correctly fill in all required fields.', 'error');
  }
  return valid;
}

// ─── Price calculation ──────────────────────────────────────

// Convert a USD amount to the user's selected currency for display
function formatPrice(usdAmount) {
  const converted = (usdAmount * state.currency.rate).toFixed(2);
  return `${state.currency.symbol}${converted}`;
}

// Convert PKR amount → USD using live exchange rates (fallback 280)
function pkrToUSD(pkr) {
  const rate = (liveExchangeRates && liveExchangeRates['PKR']) ? liveExchangeRates['PKR'] : 280;
  return pkr / rate;
}

// Format a shipping label: if rate > 0 use formatPrice(), else show label text
function formatShipping() {
  if (state.shippingRate > 0) return formatPrice(state.shippingRate);
  if (state.shippingRate === 0) return state.cart.length === 0 ? formatPrice(0) : (state.shippingLabel || formatPrice(0));
  return 'TBD';
}

function recalcPrice() {
  // ── USD base amounts ──────────────────────────────────────
  const garmentSubtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
  const fabricUSD       = state.fabricEstimate > 0 ? pkrToUSD(state.fabricEstimate) : 0;
  const subtotal        = garmentSubtotal + state.sourcingFee + fabricUSD;
  const shippingUSD     = state.shippingRate > 0 ? state.shippingRate : 0;
  const total           = subtotal + shippingUSD;

  state.loyaltyPoints = Math.floor(total * 10) || 0;

  // ── Shipping display (all instances) ─────────────────────
  const shippingText = formatShipping();
  document.querySelectorAll('.shipping-rate-val, #shipping-tier-rate, #shipping-tier-rate-review, #sidebar-shipping')
    .forEach(el => { el.textContent = shippingText; });

  // ── Sidebar line items ────────────────────────────────────
  const orderCostEl = document.getElementById('price-order-cost');
  if (orderCostEl) orderCostEl.textContent = formatPrice(garmentSubtotal);

  const sourcingRow   = document.getElementById('sidebar-sourcing-row');
  const sourcingValEl = document.getElementById('sidebar-sourcing-fee');
  if (sourcingRow)   sourcingRow.style.display   = state.sourcingFee > 0 ? 'flex' : 'none';
  if (sourcingValEl) sourcingValEl.textContent   = formatPrice(state.sourcingFee);

  const fabricEstRow   = document.getElementById('sidebar-fabric-est-row');
  const fabricEstValEl = document.getElementById('sidebar-fabric-est');
  if (fabricEstRow)   fabricEstRow.style.display = fabricUSD > 0 ? 'flex' : 'none';
  if (fabricEstValEl) {
    // Show converted price + PKR original in brackets
    fabricEstValEl.textContent = fabricUSD > 0
      ? `${formatPrice(fabricUSD)} (Rs. ${Math.round(state.fabricEstimate).toLocaleString()})`
      : formatPrice(0);
  }

  // ── Totals ────────────────────────────────────────────────
  const totalEl       = document.getElementById('price-total');
  const bigTotalEl    = document.getElementById('price-big-total');
  const coSubtotal    = document.getElementById('co-subtotal');
  const coTotal       = document.getElementById('co-total');
  const coPoints      = document.getElementById('co-points');
  const reviewTotal   = document.getElementById('review-total');
  const reviewDeposit = document.getElementById('review-deposit');

  if (totalEl)       totalEl.textContent       = formatPrice(total);
  if (bigTotalEl)    bigTotalEl.textContent     = formatPrice(total);
  if (coSubtotal)    coSubtotal.textContent     = formatPrice(subtotal);
  if (coTotal)       coTotal.textContent        = formatPrice(total);
  if (coPoints)      coPoints.textContent       = state.loyaltyPoints;
  if (reviewTotal)   reviewTotal.textContent    = formatPrice(subtotal);
  if (reviewDeposit) reviewDeposit.textContent  = formatPrice(total);

  // Store in USD for server
  state.orderData.total_price = total;
  state.orderData.amount_paid = total;
}


// ─── Garment type & Country logic ─────────────────────────
document.querySelectorAll('.garment-option').forEach(radio => {
  radio.addEventListener('change', () => {
    const garmentMap = { 'kameez': 'kameez', 'fullsuit': 'fullsuit', '3piece': '3piece', 'party': 'party' };
    state.garmentType = garmentMap[radio.value] || 'kameez';
    document.getElementById('garment-type-val').value = radio.value;
    const trouserGroup = document.getElementById('trouser-style-group');
    if (trouserGroup) trouserGroup.style.display = ['fullsuit', '3piece', 'party'].includes(radio.value) ? 'flex' : 'none';
    recalcPrice();
    runTieredShipping();
    populateReview();
  });
});

['shipping-country', 'co-country'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      // Sync the other dropdown
      const otherId = id === 'shipping-country' ? 'co-country' : 'shipping-country';
      const otherEl = document.getElementById(otherId);
      if (otherEl) otherEl.value = el.value;

      localStorage.setItem('silai-shipping-country', el.value);
      state.orderData.shipping_country = el.value;
      runTieredShipping();
    });
  }
});

// ─── Reference Image & Fabric Sourcing ───────────────────────
const SOURCING_SERVICE_FEE = 5; // $5 sourcing service fee

const fbCheck = document.getElementById('source-fabric-check');
if (fbCheck) {
  fbCheck.addEventListener('change', (e) => {
    const details = document.getElementById('source-fabric-details');
    if (details) details.style.display = e.target.checked ? 'flex' : 'none';
    state.sourcingFee = e.target.checked ? SOURCING_SERVICE_FEE : 0;
    // Reset fabric estimate when unchecked
    if (!e.target.checked) {
      state.fabricEstimate = 0;
      const estInput = document.getElementById('source-fabric-est-price');
      if (estInput) estInput.value = '';
    }
    recalcPrice();
  });
}

// Estimated fabric price input (PKR)
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'source-fabric-est-price') {
    const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
    state.fabricEstimate = val >= 0 ? val : 0;
    recalcPrice();
  }
});

// Auto-detect price from pasted fabric link
let fabricLinkDebounce = null;
document.addEventListener('input', (e) => {
  if (!e.target || e.target.id !== 'source-fabric-link') return;
  clearTimeout(fabricLinkDebounce);
  const url = e.target.value.trim();
  if (!url.startsWith('http')) return;

  const estInput = document.getElementById('source-fabric-est-price');
  const detectBtn = document.getElementById('fabric-detect-status');
  if (detectBtn) { detectBtn.textContent = '🔍 Detecting price...'; detectBtn.style.color = 'var(--gold)'; }

  fabricLinkDebounce = setTimeout(async () => {
    try {
      const resp = await fetch(`/api/scrape-price?url=${encodeURIComponent(url)}`);
      const data = await resp.json();
      if (data.success && data.price > 0) {
        if (estInput) {
          estInput.value = data.price;
          state.fabricEstimate = data.price;
          recalcPrice();
        }
        if (detectBtn) { detectBtn.textContent = `✅ Price detected: Rs. ${data.price.toLocaleString()}`; detectBtn.style.color = '#4caf50'; }
      } else {
        if (detectBtn) { detectBtn.textContent = '⚠️ Could not detect price — enter manually'; detectBtn.style.color = 'var(--text-muted)'; }
      }
    } catch(err) {
      if (detectBtn) { detectBtn.textContent = '⚠️ Detection failed — enter manually'; detectBtn.style.color = 'var(--text-muted)'; }
    }
  }, 900); // wait 900ms after user stops typing
});

const handleBase64Upload = (elementId, stateKey) => {
  const el = document.getElementById(elementId);
  if (el) {
    el.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => { state[stateKey] = ev.target.result; };
        reader.readAsDataURL(file);
      }
    });
  }
};
handleBase64Upload('reference-upload', 'referenceDesignBase64');
handleBase64Upload('source-fabric-upload', 'sourcePicBase64');
handleBase64Upload('trims-upload', 'trimsPicBase64');
handleBase64Upload('meas-upload-file', 'measPicBase64');

const trimsCheck = document.getElementById('addon-trims-check');
if (trimsCheck) {
  trimsCheck.addEventListener('change', (e) => {
      document.getElementById('trims-upload-panel').style.display = e.target.checked ? 'block' : 'none';
  });
}

document.querySelectorAll('.meas-option-radio').forEach(radio => {
  radio.addEventListener('change', () => {
    state.measurementMethod = radio.value;
    document.querySelectorAll('.measurements-form-panel, .photo-upload-panel, .standard-size-panel, #ref-upload-panel').forEach(p => p.classList.remove('visible'));
    const panels = { 'form': '.measurements-form-panel', 'upload-meas': '.photo-upload-panel', 'standard': '.standard-size-panel', 'upload': '#ref-upload-panel' };
    const panel = document.querySelector(panels[radio.value]);
    if (panel) panel.classList.add('visible');
    
    if (radio.name === 'refMethod') {
       const uPanel = document.getElementById('ref-upload-panel');
       if (radio.value === 'upload' && uPanel) uPanel.style.display = 'block';
       if (radio.value === 'whatsapp' && uPanel) uPanel.style.display = 'none';
    }
  });
});

document.querySelectorAll('.addon-toggle').forEach(toggle => {
  toggle.addEventListener('change', (e) => {
    const key = e.target.dataset.addon;
    state.addons[key] = e.target.checked;
    const addonItem = e.target.closest('.addon-item');
    if (addonItem) addonItem.classList.toggle('selected', e.target.checked);
    recalcPrice();
  });
});

function populateReview() {
  const reviewFabric = document.getElementById('review-fabric-type');
  if (reviewFabric) {
    const typeSelect = document.getElementById('fabric-type');
    reviewFabric.textContent = typeSelect ? typeSelect.value : 'Not specified';
  }
  const reviewGarment = document.getElementById('review-garment');
  if (reviewGarment) reviewGarment.textContent = document.getElementById('garment-type-val')?.value || 'Not specified';
  
  const reviewNeckline = document.getElementById('review-neckline');
  if (reviewNeckline) reviewNeckline.textContent = document.getElementById('neckline')?.value || 'Not specified';

  const reviewAddons = document.getElementById('review-addons');
  if (reviewAddons) {
     const actives = Object.keys(state.addons).filter(k => state.addons[k]);
     reviewAddons.textContent = actives.length ? actives.join(', ') : 'None';
  }
}

// ─── Shipping Quote: Tiered first, Shippo fallback ───────────
async function fetchShippingQuote() {
  const city = document.getElementById('co-city')?.value;
  const zip  = document.getElementById('co-zip')?.value;
  if (!city || !zip) return;

  // Try tiered logic first
  const tieredResult = runTieredShipping();
  if (tieredResult !== null) {
    // Tiered rate applied — no need for Shippo
    if (typeof showToast === 'function') showToast('Shipping rate calculated!', 'success');
    return;
  }

  // Fallback: Shippo for unknown zones
  const btn = document.getElementById('btn-submit');
  const ogText = btn ? btn.textContent : '';
  if (btn) btn.innerHTML = '<span class="spinner"></span> Quoting...';

  try {
    const address = document.getElementById('co-address')?.value;
    const name    = document.getElementById('co-fname')?.value;
    const reqBody = { name, street1: address, city, state: '', zip, country: localStorage.getItem('silai-country-code') || 'US' };
    const req = await fetch('/api/shipping/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const data = await req.json();
    if (data.success) {
      let quoteUsd = data.rate;
      if (data.currency !== 'USD' && liveExchangeRates[data.currency]) {
        quoteUsd = data.rate / liveExchangeRates[data.currency];
      }
      state.shippingRate = quoteUsd;
      if (typeof showToast === 'function') showToast('Real-time shipping rate applied!', 'success');
    } else {
      console.warn(data.error);
      state.shippingRate = 20;
    }
  } catch(e) {
    state.shippingRate = 20;
  }

  if (btn) btn.innerHTML = ogText || 'Place Order Securely';
  recalcPrice();
}

['co-zip', 'co-city'].forEach(id => {
  const el = document.getElementById(id);
  if(el) {
    el.addEventListener('blur', fetchShippingQuote);
  }
});

// ─── Show order success screen ──────────────────────────────
function showOrderSuccess(orderId) {
  state.cart = [];
  saveCartToStorage();
  const wrapper = document.getElementById('order-form-wrapper');
  if (wrapper) wrapper.style.display = 'none';
  const sc = document.getElementById('order-success');
  if (sc) { sc.style.display = ''; sc.classList.add('visible'); }
  const sId = document.getElementById('success-order-id');
  if (sId) sId.textContent = orderId;
  const trackLink = document.getElementById('success-track-link');
  if (trackLink) trackLink.href = '#track?id=' + orderId;
  if (cardElement) cardElement.clear();
}

// ─── Reset order form for a new order ──────────────────────
window.initOrderForm = function() {
  const sc = document.getElementById('order-success');
  if (sc) { sc.classList.remove('visible'); }
  const wrapper = document.getElementById('order-form-wrapper');
  if (wrapper) wrapper.style.display = 'block';
  // Reset state
  state.cart = [];
  state.basePrice = 0;
  state.addonsPrice = 0;
  state.addons = {};
  state.shippingRate = -1;
  state.shippingLabel = 'TBD';
  // Clear step-5 contact fields so auto-fill re-runs on next visit
  ['co-fname','co-lname','co-email','co-phone','co-address','co-apt','co-zip','co-city'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  saveCartToStorage();
  goToStep(1);
  renderCart();
  recalcPrice();
};

// ─── Stripe Submit ─────────────────────────────────────────
async function submitWithStripe(formData, btn, originalText) {
  // If Stripe is not configured (local dev / no keys), skip payment and create order directly
  if (!stripe || !cardElement) {
    const resp = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) throw new Error(data.error || 'Failed to submit order.');
    if (typeof showToast === 'function') showToast('Order placed successfully!', 'success');
    showOrderSuccess(data.order_id);
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  // (a) Create PaymentIntent server-side
  const intentResp = await fetch('/api/payments/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: formData.items, shipping_cost: formData.shipping_cost })
  });
  const intentData = await intentResp.json();
  if (!intentResp.ok) throw new Error(intentData.error || 'Could not create payment intent.');

  // (b) Confirm card payment with Stripe.js
  const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
    payment_method: { card: cardElement }
  });

  // (c) Handle card error
  if (error) {
    const errEl = document.getElementById('stripe-card-errors');
    if (errEl) errEl.textContent = error.message;
    if (typeof showToast === 'function') showToast(error.message, 'error');
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  // (d) Attach Stripe PI id then create order
  formData.stripe_pi_id = paymentIntent.id;
  const resp = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  const data = await resp.json();
  if (!resp.ok || !data.success) throw new Error(data.error || 'Failed to submit order.');

  if (typeof showToast === 'function') showToast('Order placed successfully!', 'success');
  showOrderSuccess(data.order_id);
  btn.innerHTML = originalText;
  btn.disabled = false;
}

// ─── Form Submission ───────────────────────────────────────
const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Explicitly validate Step 5 before submission
    if (!validateStep(state.currentStep)) return;

    const btn = document.getElementById('btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Processing...';
    btn.disabled = true;

    const cName = document.getElementById('co-fname')?.value + ' ' + (document.getElementById('co-lname')?.value || '');
    const coCountry = document.getElementById('co-country')?.value || document.getElementById('shipping-country')?.value;
    const coAddress = (document.getElementById('co-address')?.value || '') + ', ' + (document.getElementById('co-city')?.value || '') + ' ' + (document.getElementById('co-zip')?.value || '') + ', ' + coCountry;
    
    const cPhone = document.getElementById('co-phone')?.value || '';
    const cEmail = document.getElementById('co-email')?.value || '';

    const formData = {
      customer_name: cName,
      customer_email: cEmail,
      customer_whatsapp: cPhone,
      shipping_country: coCountry,
      shipping_address: coAddress,
      // Map cart items for backend
      items: state.cart.map(item => ({
          garment_type: item.type,
          fabric_type: item.fabric,
          neckline: item.neckline,
          sleeve_style: item.sleeve,
          trouser_style: item.bottom,
          add_ons: item.addons,
          style_notes: item.style.notes,
          reference_design: item.style.reference,
          measurements: item.measurements,
          base_price: item.base_price,
          addons_price: item.addons_price
      })),
      total_price: state.orderData.total_price || 0,
      amount_paid: state.orderData.total_price || 0,
      loyalty_points_earned: state.loyaltyPoints || 0,
      shipping_cost: state.shippingRate > 0 ? state.shippingRate : 0,
      sourcing_fee: state.sourcingFee || 0,
      fabric_estimate_pkr: state.fabricEstimate || 0,
      fabric_estimate_usd: state.fabricEstimate > 0 ? pkrToUSD(state.fabricEstimate) : 0,
      fabric_sourcing: document.getElementById('source-fabric-check')?.checked
        ? {
            link: document.getElementById('source-fabric-link')?.value || '',
            desc: document.getElementById('source-fabric-desc')?.value || '',
            est_price: state.fabricEstimate || 0,
            pic: state.sourcePicBase64 || ''
          }
        : null
    };


    try {
      await submitWithStripe(formData, btn, originalText);
    } catch (error) {
      console.error(error);
      if (typeof showToast === 'function') showToast(error.message, 'error');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

// ─── Neckline icon grid sync ───────────────────────────────
document.querySelectorAll('.neckline-radio').forEach(radio => {
  radio.addEventListener('change', () => {
    const hidden = document.getElementById('neckline');
    if (hidden) hidden.value = radio.value;
    populateReview();
  });
});

// ─── Stripe ────────────────────────────────────────────────
let stripe = null;
let cardElement = null;

async function initStripe() {
  try {
    const resp = await fetch('/api/config');
    const data = await resp.json();
    if (!data.stripePublishableKey) return;
    stripe = Stripe(data.stripePublishableKey);
    const elements = stripe.elements();
    cardElement = elements.create('card', {
      style: {
        base: { color: '#e2e8f0', fontFamily: 'inherit', fontSize: '15px', '::placeholder': { color: '#64748b' } },
        invalid: { color: '#ef4444' }
      }
    });
    // mounted lazily in goToStep(5)
  } catch (e) {
    console.error('Stripe init error:', e);
  }
}

// ─── Config Modal ──────────────────────────────────────────
const GARMENT_META = {
  kameez:   { icon: '👕', name: 'Kameez Only',     price: 22 },
  fullsuit: { icon: '👗', name: 'Full Suit (2pc)',  price: 32 },
  '3piece': { icon: '✨', name: '3-Piece Suit',     price: 45 },
  party:    { icon: '👑', name: 'Party Wear',       price: 60 }
};

const cmState = { step: 1, garmentType: 'kameez', qty: 1, size: 'M', basePrice: 22 };

function cmUpdateLivePrice() {
  const addonsTotal = [...document.querySelectorAll('.cm-addon:checked')]
    .reduce((sum, cb) => sum + parseFloat(cb.dataset.price || 0), 0);
  const unit = cmState.basePrice + addonsTotal;
  const total = unit * cmState.qty;
  const el = document.getElementById('cm-live-price');
  if (el) el.textContent = formatPrice(total) + (cmState.qty > 1 ? ` (${cmState.qty}×)` : '');
}

function cmUpdateStep() {
  const s1 = document.getElementById('cm-step-1');
  const s2 = document.getElementById('cm-step-2');
  const btnBack = document.getElementById('cm-btn-back');
  const btnNext = document.getElementById('cm-btn-next');
  const btnAdd  = document.getElementById('cm-btn-add');
  const pill1   = document.getElementById('cm-pill-1');
  const pill2   = document.getElementById('cm-pill-2');
  if (s1) s1.style.display = cmState.step === 1 ? '' : 'none';
  if (s2) s2.style.display = cmState.step === 2 ? '' : 'none';
  if (btnBack) btnBack.style.display = cmState.step > 1 ? '' : 'none';
  if (btnNext) btnNext.style.display = cmState.step < 2 ? '' : 'none';
  if (btnAdd)  btnAdd.style.display  = cmState.step === 2 ? '' : 'none';
  if (pill1) pill1.classList.toggle('active', cmState.step === 1);
  if (pill2) pill2.classList.toggle('active', cmState.step === 2);
}

window.openConfigModal = function(garmentType) {
  cmState.step = 1;
  cmState.garmentType = garmentType;
  const size = document.querySelector(`input[name="size-${garmentType}"]:checked`)?.value || 'M';
  const qty  = parseInt(document.getElementById(`qty-${garmentType}`)?.value || 1);
  cmState.size = size;
  cmState.qty  = qty;
  const meta = GARMENT_META[garmentType] || GARMENT_META.kameez;
  cmState.basePrice = meta.price;

  // Populate header
  const iconEl  = document.getElementById('cm-icon');
  const nameEl  = document.getElementById('cm-name');
  const priceEl = document.getElementById('cm-price-label');
  if (iconEl)  iconEl.textContent  = meta.icon;
  if (nameEl)  nameEl.textContent  = meta.name;
  if (priceEl) priceEl.textContent = `$${meta.price} base · ${qty > 1 ? qty + '× ' : ''}Size ${size}`;

  // Show trouser options for multi-piece
  const tg = document.getElementById('cm-trouser-group');
  if (tg) tg.style.display = ['fullsuit', '3piece', 'party'].includes(garmentType) ? 'flex' : 'none';

  // Set standard size select to match chosen size chip
  const stdSel = document.getElementById('cm-std-size');
  if (stdSel) {
    const valid = ['XS','S','M','L','XL'];
    stdSel.value = valid.includes(size) ? size : 'M';
  }

  // Reset form
  document.querySelectorAll('.cm-addon').forEach(cb => cb.checked = false);
  const notesEl = document.getElementById('cm-notes');
  if (notesEl) notesEl.value = '';
  const firstNl = document.querySelector('input[name="cm-nl"]');
  if (firstNl) firstNl.checked = true;
  const stdRadio = document.getElementById('cm-mm-standard');
  if (stdRadio) { stdRadio.checked = true; cmToggleMeasPanel('standard'); }

  cmUpdateLivePrice();
  cmUpdateStep();
  const modal = document.getElementById('config-modal');
  if (modal) modal.classList.add('open');
};

window.closeConfigModal = function() {
  const modal = document.getElementById('config-modal');
  if (modal) modal.classList.remove('open');
};

window.cmNext = function() {
  cmState.step = 2;
  cmUpdateStep();
};

window.cmBack = function() {
  cmState.step = 1;
  cmUpdateStep();
};

function cmToggleMeasPanel(method) {
  const sizePanel   = document.getElementById('cm-size-panel');
  const customPanel = document.getElementById('cm-custom-panel');
  if (sizePanel)   sizePanel.style.display   = method === 'standard' ? '' : 'none';
  if (customPanel) customPanel.style.display = method === 'form'     ? '' : 'none';
}

window.cmAddToBag = function() {
  const fabric   = document.getElementById('cm-fabric')?.value  || 'Lawn';
  const neckline = document.querySelector('input[name="cm-nl"]:checked')?.value || 'Round';
  const sleeve   = document.getElementById('cm-sleeve')?.value  || 'Full';
  const bottom   = document.getElementById('cm-bottom')?.value  || 'Straight';
  const notes    = document.getElementById('cm-notes')?.value   || '';

  const addonsCbs = [...document.querySelectorAll('.cm-addon:checked')];
  const addonsList  = addonsCbs.map(cb => cb.dataset.addon);
  const addonsTotal = addonsCbs.reduce((s, cb) => s + parseFloat(cb.dataset.price || 0), 0);

  const measMethod = document.querySelector('input[name="cm-measMethod"]:checked')?.value || 'standard';
  const stdSize    = document.getElementById('cm-std-size')?.value || cmState.size;

  const measurements = {
    method: measMethod,
    standard_size: measMethod === 'standard' ? stdSize : null,
    chest:    measMethod === 'form' ? document.getElementById('cm-chest')?.value    : null,
    waist:    measMethod === 'form' ? document.getElementById('cm-waist')?.value    : null,
    hips:     measMethod === 'form' ? document.getElementById('cm-hips')?.value     : null,
    shoulder: measMethod === 'form' ? document.getElementById('cm-shoulder')?.value : null,
    klength:  measMethod === 'form' ? document.getElementById('cm-klength')?.value  : null,
    sleeve:   measMethod === 'form' ? document.getElementById('cm-sleeve-len')?.value : null,
    trouser:  measMethod === 'form' ? document.getElementById('cm-trouser-len')?.value : null,
    inseam:   measMethod === 'form' ? document.getElementById('cm-inseam')?.value   : null,
    pic: null
  };

  const unitPrice = cmState.basePrice + addonsTotal;

  for (let i = 0; i < cmState.qty; i++) {
    state.cart.push({
      id: Date.now() + i,
      type: cmState.garmentType,
      fabric, neckline, sleeve, bottom,
      addons: addonsList,
      price: unitPrice,
      base_price: cmState.basePrice,
      addons_price: addonsTotal,
      size: cmState.size,
      measurements,
      style: { notes, reference: null, fabric_sourcing: null }
    });
  }

  saveCartToStorage();
  renderCart();
  runTieredShipping();
  recalcPrice();
  window.closeConfigModal();

  const msg = cmState.qty > 1
    ? `${cmState.qty} garments added to bag! 🛍️`
    : 'Added to bag! 🛍️';
  if (typeof showToast === 'function') showToast(msg, 'success');

  // Auto-show mini cart for 3s then close
  showNavMiniCartBriefly();
};

// Wire up add-on toggle live price update inside config modal
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('cm-addon')) cmUpdateLivePrice();
  if (e.target.name === 'cm-measMethod') cmToggleMeasPanel(e.target.value);
});


// ─── Navbar Mini-Cart ───────────────────────────────────────
let _nmcAutoCloseTimer = null;

function updateNavMiniCart() {
  const itemsEl    = document.getElementById('nmc-items');
  const totalEl    = document.getElementById('nmc-total');
  const shippingEl = document.getElementById('nmc-shipping');
  const navBadge   = document.getElementById('nav-cart-badge');

  if (navBadge) {
    navBadge.textContent = state.cart.length || '';
    navBadge.style.display = state.cart.length > 0 ? 'inline-block' : 'none';
  }

  if (!itemsEl) return;

  if (state.cart.length === 0) {
    itemsEl.innerHTML = '<p class="nmc-empty">Your bag is empty</p>';
    if (totalEl)    totalEl.textContent    = formatPrice(0);
    if (shippingEl) shippingEl.textContent = '$0.00';
    return;
  }

  const iconMap = { kameez: '👕', fullsuit: '👗', '3piece': '✨', party: '👑' };
  const nameMap = { kameez: 'Kameez Only', fullsuit: 'Full Suit', '3piece': '3-Piece Suit', party: 'Party Wear' };

  itemsEl.innerHTML = state.cart.map(item => `
    <div class="nmc-item">
      <div class="nmc-item-icon">${iconMap[item.type] || '👕'}</div>
      <div class="nmc-item-details">
        <div class="nmc-item-name">${nameMap[item.type] || item.type}</div>
        <div class="nmc-item-meta">${item.fabric || ''} · ${item.measurements?.standard_size || 'Custom'}</div>
      </div>
      <div class="nmc-item-price">${formatPrice(item.price)}</div>
    </div>
  `).join('');

  const subtotal = state.cart.reduce((s, i) => s + i.price, 0);
  if (totalEl) totalEl.textContent = formatPrice(subtotal);
  if (shippingEl) {
    if (state.shippingRate > 0) shippingEl.textContent = formatPrice(state.shippingRate);
    else if (state.shippingRate === 0) shippingEl.textContent = 'Free 🎉';
    else shippingEl.textContent = 'Calculated at checkout';
  }
}

window.toggleNavMiniCart = function() {
  const popup = document.getElementById('nav-mini-cart');
  if (!popup) return;
  const isOpen = popup.classList.contains('open');
  if (isOpen) {
    popup.classList.remove('open');
  } else {
    updateNavMiniCart();
    popup.classList.add('open');
  }
};

window.closeNavMiniCart = function() {
  const popup = document.getElementById('nav-mini-cart');
  if (popup) popup.classList.remove('open');
  if (_nmcAutoCloseTimer) clearTimeout(_nmcAutoCloseTimer);
};

function showNavMiniCartBriefly() {
  if (_nmcAutoCloseTimer) clearTimeout(_nmcAutoCloseTimer);
  const popup = document.getElementById('nav-mini-cart');
  if (!popup) return;
  updateNavMiniCart();
  popup.classList.add('open');
  _nmcAutoCloseTimer = setTimeout(() => {
    popup.classList.remove('open');
  }, 3500);
}

// Close mini-cart when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-cart-wrapper') && !e.target.closest('#config-modal')) {
    window.closeNavMiniCart();
  }
});


// ─── Initialize ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  initLocation();
  updateNavButtons();
  populateReview();
  runTieredShipping();
  initStripe();
  updateNavMiniCart();

  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextStep();
    });
  }

  const prevBtn = document.getElementById('btn-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      prevStep();
    });
  }
});
