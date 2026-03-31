const fs = require('fs');
const path = require('path');

const targetFile = path.join('c:', 'Users', 'Wali', 'Downloads', 'silai stuff', 'silaibox', 'public', 'js', 'order.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Remove hardcoded CURRENCY block
content = content.replace("const CURRENCY = { 'United Kingdom': { code: 'GBP', symbol: '£', rate: 0.79 }, 'United States': { code: 'USD', symbol: '$', rate: 1 }, 'Canada': { code: 'CAD', symbol: 'C$', rate: 1.36 }, 'United Arab Emirates': { code: 'AED', symbol: 'AED', rate: 3.67 }, 'Australia': { code: 'AUD', symbol: 'A$', rate: 1.55 } };", "");

// 2. Add state for shipping rate
content = content.replace("measPicBase64: ''", "measPicBase64: '',\n  shippingRate: 0");

// 3. Inject init function that calls IP Geolocation & Currency API
const initLocationScript = `
// ─── IP Geolocation & Live Currency ────────────────────────
const countryToCurrencyMap = { 'US': 'USD', 'GB': 'GBP', 'CA': 'CAD', 'AE': 'AED', 'AU': 'AUD' };
const currencySymbols = { 'USD': '$', 'GBP': '£', 'CAD': 'C$', 'AED': 'د.إ', 'AUD': 'A$' };
let liveExchangeRates = { 'USD': 1 };

async function initLocation() {
  try {
    // 1. Check local storage first
    let savedCode = localStorage.getItem('silai-country-code');
    let savedCurrency = localStorage.getItem('silai-currency-code');
    
    // 2. If no saved pref, detect via IP
    if (!savedCode || !savedCurrency) {
      const geoResp = await fetch('https://ipapi.co/json/');
      const geoData = await geoResp.json();
      savedCode = geoData.country_code || 'US';
      savedCurrency = countryToCurrencyMap[savedCode] || 'USD';
    }

    // 3. Update State & UI
    state.currency.code = savedCurrency;
    state.currency.symbol = currencySymbols[savedCurrency] || savedCurrency + ' ';
    const flagEl = document.getElementById('nav-flag');
    const currencyEl = document.getElementById('nav-currency');
    const countrySel = document.getElementById('loc-country-sel');
    if (flagEl) flagEl.textContent = getFlagEmoji(savedCode);
    if (currencyEl) currencyEl.textContent = savedCurrency + ' / ' + state.currency.symbol;
    if (countrySel) countrySel.value = savedCode;

    // Set standard shipping country select if it matches
    const formalNames = { 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AE': 'United Arab Emirates', 'AU': 'Australia' };
    const shipCountry = document.getElementById('shipping-country');
    if (shipCountry && formalNames[savedCode]) shipCountry.value = formalNames[savedCode];

    // 4. Fetch Live Rates
    const fxResp = await fetch('https://open.er-api.com/v6/latest/USD');
    const fxData = await fxResp.json();
    if (fxData && fxData.rates) {
      liveExchangeRates = fxData.rates;
      state.currency.rate = liveExchangeRates[state.currency.code] || 1;
    }
  } catch(e) { console.error('Geolocation/Exchange Rate Error:', e); }
  recalcPrice();
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

// Ensure function is exposed globally for Modal
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

// Update hardcoded currency formatting in script
`;
content = content.replace('// ─── Step navigation ───────────────────────────────────────', initLocationScript + '\\n\\n// ─── Step navigation ───────────────────────────────────────');

// 4. Replace setCurrency function which used hardcoded map
content = content.replace(/function setCurrency\(countryName\).+?}/s, "");

// 5. Update recalcPrice to include shipping
content = content.replace(
  "const total = state.basePrice + state.addonsPrice;", 
  "const total = state.basePrice + state.addonsPrice + state.shippingRate;"
);

// Update shipping display text from "At dispatch" to display dynamic rate
content = content.replace("const elems = {", `
  const shipElem = document.querySelector('.price-line span.text-teal');
  if (shipElem) {
    if (state.shippingRate > 0) shipElem.textContent = formatPrice(state.shippingRate);
    else shipElem.textContent = 'At dispatch';
  }
  const coShipElem = document.querySelector('#co-subtotal').parentElement.nextElementSibling.querySelector('span:nth-child(2)');
  if (coShipElem) {
    if (state.shippingRate > 0) coShipElem.textContent = formatPrice(state.shippingRate);
    else coShipElem.textContent = 'TBD';
  }
  const elems = {`);

// 6. Shippo Dynamic Calculation Logic in Step 5
const shippoLogic = `
// ─── Shippo Integration for Step 5 ──────────────────
async function fetchShippingQuote() {
  const address = document.getElementById('co-address')?.value;
  const city = document.getElementById('co-city')?.value;
  const zip = document.getElementById('co-zip')?.value;
  const name = document.getElementById('co-fname')?.value;
  
  // We need at least city and zip to get a quote
  if (!city || !zip) return;

  const btn = document.getElementById('btn-submit');
  const ogText = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span> Quoting...';
  
  try {
     const reqBody = { name, street1: address, city, state: '', zip, country: localStorage.getItem('silai-country-code') || 'US' };
     const req = await fetch('/api/shipping/rates', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(reqBody)
     });
     const data = await req.json();
     if(data.success) {
         // Convert the shippo USD rate back to base USD for the state, OR if it returns in local currency, just use the converted
         // The proxy order.js routes uses USD natively for base
         let quoteUsd = data.rate;
         if (data.currency !== 'USD' && liveExchangeRates[data.currency]) {
             // divide rate by the currency exchange rate to get USD base price
             quoteUsd = data.rate / liveExchangeRates[data.currency];
         }
         state.shippingRate = quoteUsd;
         showToast('Real-time shipping rate applied.', 'success');
     } else {
         console.warn(data.error);
         state.shippingRate = 20; // Fallback flat rate $20 USD if api fails
     }
  } catch(e) {
     state.shippingRate = 20; 
  }
  
  btn.innerHTML = ogText;
  recalcPrice();
}

// Bind event listeners to shipping inputs to recalculate rate
['co-zip', 'co-city'].forEach(id => {
  const el = document.getElementById(id);
  if(el) {
    el.addEventListener('blur', fetchShippingQuote);
  }
});
`;

content = content.replace('// ─── Initialize ────────────────────────────────────────────', shippoLogic + '\\n// ─── Initialize ────────────────────────────────────────────');

// Finally, add initLocation to the end
content = content.replace('recalcPrice();', 'initLocation();\nrecalcPrice();');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('order.js fixed successfully.');
