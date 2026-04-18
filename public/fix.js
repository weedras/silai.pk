const fs = require('fs');
const path = require('path');

const targetFile = path.join('c:', 'Users', 'Wali', 'Downloads', 'silai stuff', 'silaibox', 'public', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Fix literal \n\n globally
content = content.replace(/\\n\\n/g, '');
content = content.replace(/\\n/g, '');

// 2. Expand fabric sourcing inputs in Step 1
const oldFabricSourcing = `<div id="source-fabric-details" style="display:none; margin-top:12px;">
      <label class="form-label">Brand/Collection Details</label>
      <input type="text" id="source-fabric-desc" class="form-input" placeholder="e.g. Khaadi Lawn Vol 2, design 12B...">
    </div>`;

const newFabricSourcing = `<div id="source-fabric-details" style="display:none; margin-top:12px; display:flex; flex-direction:column; gap:8px;">
      <div class="form-group"><label class="form-label">Paste link of product/item (Optional)</label><input type="url" id="source-fabric-link" class="form-input" placeholder="https://khaadi.com/..."></div>
      <div class="form-group"><label class="form-label">Upload Picture of Product</label><input type="file" id="source-fabric-upload" class="form-input" accept="image/*"></div>
      <div class="form-group"><label class="form-label">Details, Colors, Price, etc.</label><textarea id="source-fabric-desc" class="form-input" placeholder="e.g. Size medium, Blue color, Rs. 5000"></textarea></div>
    </div>`;
content = content.replace(oldFabricSourcing, newFabricSourcing);

// 3. Add Tassels/Laces Upload under Add-ons in Step 2
const oldTassels = `<label class="addon-item"><div class="addon-left"><div class="addon-icon">✨</div><div><div class="addon-name">Tassels, Laces & Buttons</div><div class="addon-desc">Custom designs</div></div></div><div class="addon-right"><div class="addon-price">+$5</div><div class="toggle"><input type="checkbox" class="addon-toggle" data-addon="trims"><div class="toggle-track"></div></div></div></label>`;
const newTassels = `<label class="addon-item"><div class="addon-left"><div class="addon-icon">✨</div><div><div class="addon-name">Tassels, Laces & Buttons</div><div class="addon-desc">Custom designs</div></div></div><div class="addon-right"><div class="addon-price">+$5</div><div class="toggle"><input type="checkbox" class="addon-toggle" data-addon="trims" id="addon-trims-check"><div class="toggle-track"></div></div></div></label>
              <!-- Upload panel for trims -->
              <div id="trims-upload-panel" style="display:none; margin-top:8px; margin-bottom:12px; padding:12px; border-radius:8px; border:1px dashed var(--border);">
                 <label class="form-label mb-sm" style="font-size:0.85rem">Upload lacces or tassels designs photo</label>
                 <input type="file" id="trims-upload" class="form-input" accept="image/*">
              </div>`;
content = content.replace(oldTassels, newTassels);

// 4. Update Step 3 (Measurements): Remove WhatsApp, change to Upload Option
const oldMeasOptions = `<input type="radio" name="measMethod" id="mm-photo" value="photo" class="meas-option-radio">
              <label for="mm-photo" class="meas-option-label"><div class="meas-option-icon">📸</div><div class="meas-option-text"><h4>WhatsApp</h4><p>Send a sample pic</p></div></label>`;
const newMeasOptions = `<input type="radio" name="measMethod" id="mm-photo" value="upload-meas" class="meas-option-radio">
              <label for="mm-photo" class="meas-option-label"><div class="meas-option-icon">📁</div><div class="meas-option-text"><h4>Upload Picture</h4><p>Upload a sample pic</p></div></label>`;
content = content.replace(oldMeasOptions, newMeasOptions);

const oldPhotoPanel = `<div class="photo-upload-panel text-center">
               <div class="card card-glass mt-lg" style="padding:var(--space-2xl)">
                 <div style="font-size:3rem">📱</div>
                 <h4 class="mt-md">Send us a WhatsApp message</h4>
                 <p>After placing your order, send a photo of a well-fitting outfit to our WhatsApp. We'll use it to get your perfect measurements.</p>
               </div>
            </div>`;
const newPhotoPanel = `<div class="photo-upload-panel text-center">
               <div class="card card-glass mt-lg" style="padding:var(--space-2xl)">
                 <div style="font-size:3rem">📸</div>
                 <h4 class="mt-md mb-md">Upload Measurements Reference</h4>
                 <p style="margin-bottom:12px; font-size:0.9rem; color:var(--text-muted)">Upload a clear photo of your reference garment with measurements shown.</p>
                 <input type="file" id="meas-upload-file" class="form-input" accept="image/*">
               </div>
            </div>`;
content = content.replace(oldPhotoPanel, newPhotoPanel);

// 5. Add more stitching examples to the showcase grid
if (content.includes('<div class="showcase-grid">')) {
   const showcaseCards = `
        <div class="showcase-card">
          <img src="https://media.istockphoto.com/id/1179536830/photo/pakistani-wedding-dress.jpg?s=612x612&w=0&k=20&c=6c8kGtwM0g7N-_qS4w7Hj7PebZ8xVw3lX6w83f_2rWc=" alt="Example 0" class="showcase-img">
          <div class="showcase-overlay">
            <h4 class="text-white">Velvet Perfection</h4>
            <p class="text-gold">Custom Sleeves</p>
          </div>
        </div>
        <div class="showcase-card">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOB6kIayZngN3BwT9k2rN6A6wJ9R2z-g5Jcw&s" alt="Example 1" class="showcase-img">
          <div class="showcase-overlay">
            <h4 class="text-white">Embroidered Finish</h4>
            <p class="text-gold">Intricate Laces</p>
          </div>
        </div>
        <div class="showcase-card">
          <img src="https://i.pinimg.com/236x/89/5b/c2/895bc2ddad0a2f5ff5e0d4cc18e69d7a.jpg" alt="Example 2" class="showcase-img">
          <div class="showcase-overlay">
            <h4 class="text-white">Boutique Trim</h4>
            <p class="text-gold">Signature Touches</p>
          </div>
        </div>
`;
   // Find the end of showcase-grid and insert items
   // Note: there are already 4 inner showcase-cards, let's just append ours inside the grid.
   content = content.replace(
      `<div class="showcase-card">
          <img src="https://images.unsplash.com/photo-1621376846995-1f9e28faca91?auto=format&fit=crop&q=80&w=400" alt="Chiffon Details" class="showcase-img">
          <div class="showcase-overlay">
            <h4 class="text-white">Bridal Alterations</h4>
            <p class="text-gold">Delicate Adjustments</p>
          </div>
        </div>`,
      `<div class="showcase-card">
          <img src="https://images.unsplash.com/photo-1621376846995-1f9e28faca91?auto=format&fit=crop&q=80&w=400" alt="Chiffon Details" class="showcase-img">
          <div class="showcase-overlay">
            <h4 class="text-white">Bridal Alterations</h4>
            <p class="text-gold">Delicate Adjustments</p>
          </div>
        </div>` + showcaseCards
   );
}


fs.writeFileSync(targetFile, content, 'utf8');
console.log('index.html updated successfully.');
