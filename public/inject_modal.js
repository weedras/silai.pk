const fs = require('fs');
const path = require('path');

const targetFile = path.join('c:', 'Users', 'Wali', 'Downloads', 'silai stuff', 'silaibox', 'public', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Make header delivery clickable
const oldDeliverTo = `<div class="header-delivery" style="font-size:0.75rem; line-height:1.2; padding-right:1rem; border-right:1px solid var(--border); margin-right:1rem; display:flex; flex-direction:column; align-items:flex-end;">
      <span style="color:var(--text-muted)">Deliver To / Currency</span>
      <div style="font-weight:600; display:flex; align-items:center; gap:4px;">
        <span id="nav-flag">🇺🇸</span> <span id="nav-currency">USD / $</span>
      </div>
    </div>`;
const newDeliverTo = `<div class="header-delivery" onclick="document.getElementById('location-modal').classList.add('open')" style="cursor:pointer; font-size:0.75rem; line-height:1.2; padding-right:1rem; border-right:1px solid var(--border); margin-right:1rem; display:flex; flex-direction:column; align-items:flex-end; transition:opacity 0.2s;" onmouseover="this.style.opacity=0.7" onmouseout="this.style.opacity=1">
      <span style="color:var(--text-muted)">Deliver To / Currency</span>
      <div style="font-weight:600; display:flex; align-items:center; gap:4px;">
        <span id="nav-flag">🇺🇸</span> <span id="nav-currency">USD / $</span>
      </div>
    </div>`;

// Only replace if not already replaced
if (content.includes(oldDeliverTo)) {
   content = content.replace(oldDeliverTo, newDeliverTo);
}

// 2. Add Location Modal before size chart modal
const locationModal = `<!-- ─── Location & Currency Modal ──────────────────── -->
<div id="location-modal" class="modal-overlay" onclick="if(event.target===this)this.classList.remove('open')">
  <div class="modal-box" style="max-width:400px">
    <button class="modal-close" onclick="document.getElementById('location-modal').classList.remove('open')">✕</button>
    <h3 class="mb-lg" style="text-align:center">Set Location & Currency</h3>
    <div class="form-group">
      <label class="form-label">Deliver To</label>
      <select id="loc-country-sel" class="form-select">
        <option value="US" data-flag="🇺🇸" data-currency="USD">United States</option>
        <option value="UK" data-flag="🇬🇧" data-currency="GBP">United Kingdom</option>
        <option value="CA" data-flag="🇨🇦" data-currency="CAD">Canada</option>
        <option value="AE" data-flag="🇦🇪" data-currency="AED">United Arab Emirates</option>
        <option value="AU" data-flag="🇦🇺" data-currency="AUD">Australia</option>
      </select>
    </div>
    <div class="form-group mt-md">
      <label class="form-label">Currency Output</label>
      <input type="text" id="loc-currency-preview" class="form-input" disabled value="USD $" style="background:var(--background-alt)">
    </div>
    <button class="btn btn-primary w-full mt-lg" onclick="saveLocationPreferences()">Save Preferences</button>
  </div>
</div>`;

if (!content.includes('id="location-modal"')) {
   content = content.replace('<!-- ─── Size Chart Modal ──────────────────── -->', locationModal + '\\n\\n<!-- ─── Size Chart Modal ──────────────────── -->');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('index.html location modal injected.');
