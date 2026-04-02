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
  const shipElem = document.querySelector('.price-line span.text-teal');
  if (shipElem) shipElem.textContent = result.rate > 0 ? formatPrice(result.rate) : result.label;

  // Update checkout panel rate display
  const tierRateEl = document.getElementById('shipping-tier-rate');
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
  const country = document.getElementById('shipping-country')?.value || 'United States';
  const cartItems = state.cart.length > 0 ? state.cart : [{ type: state.garmentType || 'kameez', price: state.basePrice + state.addonsPrice }];
  const result = calculateTieredShipping(cartItems, country);
  if (result !== null) {
    state.shippingRate = result.rate;
    updateShippingUI(result);
    recalcPrice();
  }
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
  shippingRate: 0,
  cart: []
};

window.addItemToCart = function() {
  const garmentType = document.getElementById('garment-type-val')?.value || 'kameez';
  const item = {
    id: Date.now(),
    type: garmentType,
    fabric: document.getElementById('fabric-type')?.value,
    neckline: document.getElementById('neckline')?.value,
    sleeve: document.getElementById('sleeve-style')?.value,
    bottom: document.getElementById('trouser-style')?.value,
    addons: Object.entries(state.addons).filter(([,v]) => v).map(([k]) => k),
    price: state.basePrice + state.addonsPrice,
    base_price: state.basePrice,
    addons_price: state.addonsPrice,
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
  state.cart.push(item);
  clearGarmentForm();
  renderCart();
  runTieredShipping();
  recalcPrice();
  if (typeof showToast === 'function') showToast('Garment added to cart!', 'success');
  goToStep(4); // Go to Cart/Review step
};

window.removeItemFromCart = function(id) {
  state.cart = state.cart.filter(item => item.id !== id);
  renderCart();
  runTieredShipping();
  recalcPrice();
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
  if (!container) return;
  
  if (state.cart.length === 0) {
    container.innerHTML = '<div class="text-center p-lg"><p>Your cart is empty.</p></div>';
    recalcPrice();
    return;
  }
  
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
          <button type="button" onclick="removeItemFromCart(${item.id})" style="background:none; border:none; color:var(--rose); font-size:0.8rem; cursor:pointer; padding:4px 0; text-decoration:underline;">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  const sidebarList = document.getElementById('sidebar-cart-list');
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
    const shipCountry = document.getElementById('shipping-country');
    if (shipCountry && formalNames[savedCode]) shipCountry.value = formalNames[savedCode];

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
    if (nextBtn) nextBtn.style.display = 'block';
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
    if (!input.value) {
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
    showToast('Please fill in all required fields.', 'error');
  }
  return valid;
}

// ─── Price calculation ──────────────────────────────────────
function formatPrice(usdAmount) {
  const converted = (usdAmount * state.currency.rate).toFixed(2);
  return `${state.currency.symbol}${converted}`;
}

function recalcPrice() {
  const garmentSelect = document.getElementById('garment-type-val');
  if (garmentSelect) state.garmentType = garmentSelect.value;
  state.basePrice = PRICES.base[state.garmentType] || 0;

  state.addonsPrice = 0;
  Object.keys(state.addons).forEach(key => {
    if (state.addons[key]) state.addonsPrice += PRICES.addons[key] || 0;
  });

  // Calculate Subtotal (Cart items + current garment if not added yet)
  let subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
  if (state.currentStep <= 3) {
      subtotal += (state.basePrice + state.addonsPrice);
  }

  const total = subtotal + (state.shippingRate || 0);
  const deposit = total; // 100% upfront
  
  state.loyaltyPoints = Math.floor(deposit * 10) || 0;

  // Update EVERY shipping element
  const shipElems = document.querySelectorAll('.price-line span.text-teal, #shipping-tier-rate');
  shipElems.forEach(el => {
    if (state.shippingRate > 0) el.textContent = formatPrice(state.shippingRate);
    else if (state.shippingRate === 0 && total > 0) el.textContent = 'Free Shipping 🎉';
    else el.textContent = 'At dispatch';
  });

  const elems = {
    base: document.getElementById('price-base'),
    addons: document.getElementById('price-addons'),
    total: document.getElementById('price-total'),
    bigTotal: document.getElementById('price-big-total'),
    coSubtotal: document.getElementById('co-subtotal'), 
    coTotal: document.getElementById('co-total'),       
    coPoints: document.getElementById('co-points')
  };
  
  if (elems.base) {
      const itemsBase = state.cart.reduce((s,i)=>s+i.base_price, 0);
      elems.base.textContent = formatPrice(state.currentStep <= 3 ? itemsBase + state.basePrice : itemsBase);
  }
  if (elems.addons) {
      const itemsAddons = state.cart.reduce((s,i)=>s+i.addons_price, 0);
      elems.addons.textContent = formatPrice(state.currentStep <= 3 ? itemsAddons + state.addonsPrice : itemsAddons);
  }

  if (elems.total) elems.total.textContent = formatPrice(total);
  if (elems.bigTotal) elems.bigTotal.textContent = formatPrice(total);
  if (elems.coSubtotal) elems.coSubtotal.textContent = formatPrice(subtotal);
  if (elems.coTotal) elems.coTotal.textContent = formatPrice(total);
  if (elems.coPoints) elems.coPoints.textContent = state.loyaltyPoints;

  const reviewTotal = document.getElementById('review-total');
  const reviewDeposit = document.getElementById('review-deposit');
  if (reviewTotal) reviewTotal.textContent = formatPrice(total);
  if (reviewDeposit) reviewDeposit.textContent = formatPrice(deposit);

  state.orderData.total_price = total;
  state.orderData.amount_paid = deposit;
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

const countrySelect = document.getElementById('shipping-country');
if (countrySelect) {
  countrySelect.addEventListener('change', () => {
    state.orderData.shipping_country = countrySelect.value;
    runTieredShipping();
  });
}

// ─── Reference Image & Fabric Sourcing ───────────────────────
const fbCheck = document.getElementById('source-fabric-check');
if (fbCheck) {
  fbCheck.addEventListener('change', (e) => {
    document.getElementById('source-fabric-details').style.display = e.target.checked ? 'block' : 'none';
  });
}

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
    
    const cPhone = document.getElementById('co-phone')?.value || document.getElementById('customer-whatsapp')?.value;
    const cEmail = document.getElementById('co-email')?.value || document.getElementById('customer-email')?.value;

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
      loyalty_points_earned: state.loyaltyPoints || 0
    };


    try {
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (typeof showToast === 'function') showToast('Order placed successfully!', 'success');
        document.getElementById('step-5').classList.remove('active');
        const sc = document.getElementById('step-success');
        if (sc) sc.classList.add('active');
        const sId = document.getElementById('success-order-id');
        if (sId) sId.textContent = data.orderId;
        
        let trackUrl = window.location.origin + '/#track?id=' + data.orderId;
        const sBtn = document.getElementById('success-btn');
        if (sBtn) sBtn.onclick = () => { window.location.href = trackUrl; };
      } else {
        throw new Error(data.error || 'Failed to submit order');
      }
    } catch (error) {
      console.error(error);
      if (typeof showToast === 'function') showToast(error.message, 'error');
    } finally {
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

// ─── Initialize ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLocation();
  updateNavButtons();
  populateReview();
  runTieredShipping();
  
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
