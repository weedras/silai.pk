/* ═══════════════════════════════════════════════════════════
   Silai — Order Form Logic
   Multi-step navigation, price calc, API submission
═══════════════════════════════════════════════════════════ */

const PRICES = {
  base: { 'kameez': 22, 'fullsuit': 32, '3piece': 45, 'party': 60 },
  addons: { 'express': 10, 'lining': 5, 'neckline': 6, 'consult': 5, 'trims': 5 }
};

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
  shippingRate: 0
};

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
  } catch(e) { console.error('Location Error:', e); }
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
    goToStep(state.currentStep + 1);
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

  const total = state.basePrice + state.addonsPrice + state.shippingRate;
  const deposit = total; // 100% upfront
  
  state.loyaltyPoints = Math.floor(deposit * 10);

  const shipElem = document.querySelector('.price-line span.text-teal');
  if (shipElem) {
    if (state.shippingRate > 0) shipElem.textContent = formatPrice(state.shippingRate);
    else shipElem.textContent = 'At dispatch';
  }
  const coShipElem = document.querySelector('#co-subtotal')?.parentElement?.nextElementSibling?.querySelector('span:nth-child(2)');
  if (coShipElem) {
    if (state.shippingRate > 0) coShipElem.textContent = formatPrice(state.shippingRate);
    else coShipElem.textContent = 'TBD';
  }

  const elems = {
    base: document.getElementById('price-base'),
    addons: document.getElementById('price-addons'),
    total: document.getElementById('price-total'),
    bigTotal: document.getElementById('price-big-total'),
    coSubtotal: document.getElementById('co-subtotal'),
    coTotal: document.getElementById('co-total'),
    coPoints: document.getElementById('co-points')
  };
  
  if (elems.base) elems.base.textContent = formatPrice(state.basePrice);
  if (elems.addons) elems.addons.textContent = formatPrice(state.addonsPrice);
  if (elems.total) elems.total.textContent = formatPrice(total);
  if (elems.bigTotal) elems.bigTotal.textContent = formatPrice(total);
  if (elems.coSubtotal) elems.coSubtotal.textContent = formatPrice(total);
  if (elems.coTotal) elems.coTotal.textContent = formatPrice(total);
  if (elems.coPoints) elems.coPoints.textContent = state.loyaltyPoints;

  const reviewTotal = document.getElementById('review-total');
  const reviewDeposit = document.getElementById('review-deposit');
  if (reviewTotal) reviewTotal.textContent = formatPrice(total);
  if (reviewDeposit) reviewDeposit.textContent = formatPrice(deposit);

  state.orderData.total_price = total;
  state.orderData.addons_price = state.addonsPrice;
  state.orderData.base_price = state.basePrice;
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
    populateReview();
  });
});

const countrySelect = document.getElementById('shipping-country');
if (countrySelect) {
  countrySelect.addEventListener('change', () => {
    state.orderData.shipping_country = countrySelect.value;
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

// ─── Shippo Integration for Step 5 ──────────────────
async function fetchShippingQuote() {
  const address = document.getElementById('co-address')?.value;
  const city = document.getElementById('co-city')?.value;
  const zip = document.getElementById('co-zip')?.value;
  const name = document.getElementById('co-fname')?.value;
  
  if (!city || !zip) return;

  const btn = document.getElementById('btn-submit');
  const ogText = btn ? btn.textContent : '';
  if (btn) btn.innerHTML = '<span class="spinner"></span> Quoting...';
  
  try {
     const reqBody = { name, street1: address, city, state: '', zip, country: localStorage.getItem('silai-country-code') || 'US' };
     const req = await fetch('/api/shipping/rates', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(reqBody)
     });
     const data = await req.json();
     if(data.success) {
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
    const coAddress = (document.getElementById('co-address')?.value || '') + ', ' + (document.getElementById('co-city')?.value || '') + ' ' + (document.getElementById('co-zip')?.value || '');
                  
    const cPhone = document.getElementById('co-phone')?.value || document.getElementById('customer-whatsapp')?.value;
    const cEmail = document.getElementById('co-email')?.value || document.getElementById('customer-email')?.value;

    const formData = {
      customer_name: cName,
      customer_email: cEmail,
      customer_whatsapp: cPhone,
      shipping_country: document.getElementById('shipping-country')?.value,
      shipping_address: coAddress,
      garment_type: document.getElementById('garment-type-val')?.value,
      fabric_type: document.getElementById('fabric-type')?.value,
      fabric_sourcing: document.getElementById('source-fabric-check')?.checked 
        ? JSON.stringify({
            link: document.getElementById('source-fabric-link')?.value || '',
            desc: document.getElementById('source-fabric-desc')?.value || '',
            pic: state.sourcePicBase64 || ''
          })
        : '',
      neckline: document.getElementById('neckline')?.value,
      sleeve_style: document.getElementById('sleeve-style')?.value,
      trouser_style: document.getElementById('trouser-style')?.value,
      style_notes: document.getElementById('special-instructions')?.value + 
                   (state.trimsPicBase64 ? ' [Includes Trims Photo]' : ''),
      reference_design: state.referenceDesignBase64 || (document.getElementById('rm-whatsapp')?.checked ? 'whatsapp' : ''),
      measurement_method: state.measurementMethod,
      standard_size: document.getElementById('meas-standard-size')?.value,
      chest: document.getElementById('meas-chest')?.value,
      waist: document.getElementById('meas-waist')?.value,
      hips: document.getElementById('meas-hips')?.value,
      kameez_length: document.getElementById('meas-klength')?.value,
      sleeve_length: document.getElementById('meas-sleeve')?.value,
      shoulder_width: document.getElementById('meas-shoulder')?.value,
      trouser_length: document.getElementById('meas-trouser')?.value,
      inseam: document.getElementById('meas-inseam')?.value,
      addons: Object.entries(state.addons).filter(([,v]) => v).map(([k]) => k),
      base_price: state.basePrice,
      addons_price: state.addonsPrice,
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

// ─── Initialize ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLocation();
  updateNavButtons();
  populateReview();
  
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
