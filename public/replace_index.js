const fs = require('fs');
const path = require('path');

const targetFile = path.join('c:', 'Users', 'Wali', 'Downloads', 'silai stuff', 'silaibox', 'public', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Auth Modal - add forgot password & confirm password
content = content.replace(
  '<div class="form-group"><label class="form-label">Password</label><input id="login-password" type="password" class="form-input" placeholder="••••••••" required></div>',
  `<div class="form-group">
        <label class="form-label">Password <a href="#" style="float:right;color:var(--text-muted);font-size:0.8rem">Forgot Password?</a></label>
        <input id="login-password" type="password" class="form-input" placeholder="••••••••" required>
      </div>`
);

content = content.replace(
  '<div class="form-group"><label class="form-label">Password</label><input id="reg-password" type="password" class="form-input" placeholder="Min. 6 characters" required minlength="6"></div>',
  `<div class="form-group"><label class="form-label">Password</label><input id="reg-password" type="password" class="form-input" placeholder="Min. 6 characters" required minlength="6"></div>
      <div class="form-group"><label class="form-label">Confirm Password</label><input id="reg-password-confirm" type="password" class="form-input" placeholder="Min. 6 characters" required minlength="6"></div>`
);

// 2. Navbar - Add Deliver to / Currency (like LAAM)
content = content.replace(
  '<a href="#admin" class="nav-link" id="nav-admin-link" style="display:none">Admin</a>',
  `<a href="#admin" class="nav-link" id="nav-admin-link" style="display:none">Admin</a>
    <a href="#about" class="nav-link">About Us</a>`
);

content = content.replace(
  '<div class="nav-actions">',
  `<div class="nav-actions">
    <div class="header-delivery" style="font-size:0.75rem; line-height:1.2; padding-right:1rem; border-right:1px solid var(--border); margin-right:1rem; display:flex; flex-direction:column; align-items:flex-end;">
      <span style="color:var(--text-muted)">Deliver To / Currency</span>
      <div style="font-weight:600; display:flex; align-items:center; gap:4px;">
        <span id="nav-flag">🇺🇸</span> <span id="nav-currency">USD / $</span>
      </div>
    </div>`
);

// 3. Turnaround - 15 days
content = content.replace(
  '<h3 data-count="10" data-suffix=" days">0</h3><p>Average Turnaround</p>',
  '<h3 data-count="15" data-suffix=" days">0</h3><p>Avg. Turnaround (+ Shipping)</p>'
);

// 4. Party Wear instead of Bridal
content = content.replace(
  '<input type="radio" name="garmentType" id="gt-bridal" value="bridal" class="garment-option">',
  '<input type="radio" name="garmentType" id="gt-party" value="party" class="garment-option">'
);
content = content.replace(
  '<label for="gt-bridal" class="garment-label"><div class="garment-icon">👑</div><div class="garment-name">Bridal Wear</div><div class="garment-price">from $60</div></label>',
  '<label for="gt-party" class="garment-label"><div class="garment-icon">👑</div><div class="garment-name">Party Wear</div><div class="garment-price">from $60</div></label>'
);

// 5. Add "Sourcing Fabric" checkbox to Step 1
content = content.replace(
  '<div class="form-section-title mt-lg">Select Garment Type</div>',
  `<div class="form-section-title mt-lg">Fabric Sourcing</div>
  <div style="margin-bottom:var(--space-md); padding:var(--space-md); background:var(--glass-bg); border-radius:12px; border:1px solid var(--border)">
    <label style="display:flex; align-items:center; gap:12px; cursor:pointer;">
      <input type="checkbox" id="source-fabric-check" style="width:20px;height:20px;">
      <div>
        <div style="font-weight:600">Buy unstitched fabric for me</div>
        <div style="font-size:0.85rem; color:var(--text-muted)">We'll source it from Khaadi, J., etc. and add it to your total.</div>
      </div>
    </label>
    <div id="source-fabric-details" style="display:none; margin-top:12px;">
      <label class="form-label">Brand/Collection Details</label>
      <input type="text" id="source-fabric-desc" class="form-input" placeholder="e.g. Khaadi Lawn Vol 2, design 12B...">
    </div>
  </div>
  <div class="form-section-title mt-lg">Select Garment Type</div>`
);

// 6. Swap Step 2 and 3 titles in the header labels
content = content.replace(
  `<div class="step-label">Measurements</div>\n              <div class="step-label">Style</div>`,
  `<div class="step-label">Style</div>\n              <div class="step-label">Measurements</div>`
);

// 7. Update Step 2 markup to be Style
let step2Style = `          <!-- Step 2 -->
          <div id="step-2" class="form-step">
            <h2 class="step-title">Style &amp; Add-ons</h2>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Fabric Type</label><select id="fabric-type" class="form-select"><option value="Lawn">Lawn</option><option value="Chiffon">Chiffon</option><option value="Silk">Silk</option><option value="Velvet">Velvet</option><option value="Cotton">Cotton</option><option value="Organza">Organza</option></select></div>
              <div class="form-group"><label class="form-label">Neckline</label><select id="neckline" class="form-select"><option value="Round">Round</option><option value="V-Neck">V-Neck</option><option value="Boat">Boat Neck</option><option value="Collar">Collar</option><option value="Square">Square</option></select></div>
            </div>
            <div class="form-row" id="trouser-style-group" style="display:none">
              <div class="form-group"><label class="form-label">Sleeve Style</label><select id="sleeve-style" class="form-select"><option value="Full">Full Sleeves</option><option value="Three-Quarter">3/4 Sleeves</option><option value="Half">Half Sleeves</option><option value="Sleeveless">Sleeveless</option></select></div>
              <div class="form-group"><label class="form-label">Trouser Style</label><select id="trouser-style" class="form-select"><option value="Straight">Straight Pants</option><option value="Shalwar">Shalwar</option><option value="Bell-Bottom">Bell Bottom</option><option value="Palazzo">Palazzo</option></select></div>
            </div>
            
            <div class="form-section-title mt-lg">Reference Design Picture</div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">Have a specific style in mind? Show us.</p>
            <div class="measurement-options">
              <input type="radio" name="refMethod" id="rm-upload" value="upload" class="meas-option-radio" checked>
              <label for="rm-upload" class="meas-option-label"><div class="meas-option-icon">📁</div><div class="meas-option-text"><h4>Upload Picture</h4></div></label>
              
              <input type="radio" name="refMethod" id="rm-whatsapp" value="whatsapp" class="meas-option-radio">
              <label for="rm-whatsapp" class="meas-option-label"><div class="meas-option-icon">💬</div><div class="meas-option-text"><h4>Send via WhatsApp</h4></div></label>
            </div>
            <div id="ref-upload-panel" style="margin-top:12px;">
               <input type="file" id="reference-upload" class="form-input" accept="image/*">
            </div>

            <div class="form-section-title mt-lg">Premium Add-ons</div>
            <div class="addons-grid">
              <label class="addon-item"><div class="addon-left"><div class="addon-icon">⚡</div><div><div class="addon-name">Express Stitching</div><div class="addon-desc">4-day turnaround</div></div></div><div class="addon-right"><div class="addon-price">+$10</div><div class="toggle"><input type="checkbox" class="addon-toggle" data-addon="express"><div class="toggle-track"></div></div></div></label>
              <label class="addon-item"><div class="addon-left"><div class="addon-icon">🧵</div><div><div class="addon-name">Inner Lining</div><div class="addon-desc">For sheer fabrics</div></div></div><div class="addon-right"><div class="addon-price">+$5</div><div class="toggle"><input type="checkbox" class="addon-toggle" data-addon="lining"><div class="toggle-track"></div></div></div></label>
              <label class="addon-item"><div class="addon-left"><div class="addon-icon">✨</div><div><div class="addon-name">Tassels, Laces & Buttons</div><div class="addon-desc">Custom designs</div></div></div><div class="addon-right"><div class="addon-price">+$5</div><div class="toggle"><input type="checkbox" class="addon-toggle" data-addon="trims"><div class="toggle-track"></div></div></div></label>
            </div>
            <div class="form-group mt-lg"><label class="form-label">Special Instructions</label><textarea id="special-instructions" class="form-textarea" placeholder="e.g. Add piping on neckline, specific button style…"></textarea></div>
          </div>`;

let step3Meas = `          <!-- Step 3 -->
          <div id="step-3" class="form-step">
            <h2 class="step-title">Measurements</h2>
            <div class="measurement-options">
               <input type="radio" name="measMethod" id="mm-standard" value="standard" class="meas-option-radio" checked>
              <label for="mm-standard" class="meas-option-label"><div class="meas-option-icon">👕</div><div class="meas-option-text"><h4>Standard Size</h4><p>Pick S, M, or L</p></div></label>

              <input type="radio" name="measMethod" id="mm-form" value="form" class="meas-option-radio">
              <label for="mm-form" class="meas-option-label"><div class="meas-option-icon">📏</div><div class="meas-option-text"><h4>Custom</h4><p>Enter exact inches</p></div></label>
              
              <input type="radio" name="measMethod" id="mm-photo" value="photo" class="meas-option-radio">
              <label for="mm-photo" class="meas-option-label"><div class="meas-option-icon">📸</div><div class="meas-option-text"><h4>WhatsApp</h4><p>Send a sample pic</p></div></label>
            </div>
            
            <div class="standard-size-panel visible">
              <div class="form-group mt-md">
                <label class="form-label">Select Size</label>
                <select id="meas-standard-size" class="form-select">
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                </select>
                <div class="mt-md" style="text-align:center;">
                  <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('size-chart-modal').classList.add('open')">View Size Chart 📏</button>
                </div>
              </div>
            </div>

            <div class="measurements-form-panel">
              <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:var(--space-md)">Measure in inches.</p>
              <div class="meas-grid">
                <div class="form-group"><label class="form-label">Chest</label><input type="number" id="meas-chest" class="form-input" placeholder="e.g. 36"></div>
                <div class="form-group"><label class="form-label">Waist</label><input type="number" id="meas-waist" class="form-input" placeholder="e.g. 30"></div>
                <div class="form-group"><label class="form-label">Hips</label><input type="number" id="meas-hips" class="form-input" placeholder="e.g. 38"></div>
                <div class="form-group"><label class="form-label">Shoulder</label><input type="number" id="meas-shoulder" class="form-input" placeholder="e.g. 14"></div>
                <div class="form-group"><label class="form-label">Kameez Length</label><input type="number" id="meas-klength" class="form-input" placeholder="e.g. 42"></div>
                <div class="form-group"><label class="form-label">Sleeve Length</label><input type="number" id="meas-sleeve" class="form-input" placeholder="e.g. 21"></div>
                <div class="form-group"><label class="form-label">Trouser Length</label><input type="number" id="meas-trouser" class="form-input" placeholder="e.g. 38"></div>
                <div class="form-group"><label class="form-label">Inseam</label><input type="number" id="meas-inseam" class="form-input" placeholder="e.g. 28"></div>
              </div>
            </div>
            <div class="photo-upload-panel text-center">
               <div class="card card-glass mt-lg" style="padding:var(--space-2xl)">
                 <div style="font-size:3rem">📱</div>
                 <h4 class="mt-md">Send us a WhatsApp message</h4>
                 <p>After placing your order, send a photo of a well-fitting outfit to our WhatsApp. We'll use it to get your perfect measurements.</p>
               </div>
            </div>
          </div>`;

// Replace Step 2 and 3 in the code. I will use regex on the whole block to avoid strict matching issues.
let regexSteps = /<!-- Step 2 -->\s*<div id="step-2"[\s\S]*?<!-- Step 4 -->/;
content = content.replace(regexSteps, step2Style + '\\n\\n' + step3Meas + '\\n\\n          <!-- Step 4 -->');

// 8. Checkout Redesign (Step 5)
let step5Checkout = `          <!-- Step 5 -->
          <div id="step-5" class="form-step">
            <h2 class="step-title">Quick Checkout</h2>
            <p class="step-subtitle text-muted mb-lg" style="font-size:0.9rem">
              Send your fabric to: <strong>123 Stitching Workshop, Old City, Lahore, Pakistan</strong>
            </p>
            
            <div style="display:flex; gap:var(--space-xl); flex-wrap:wrap;">
              <div style="flex:1; min-width:300px;">
                <!-- Contact Info -->
                <div class="card mb-md" style="padding:var(--space-lg); border:1px solid var(--border);">
                  <h4 class="mb-md">Contact Info</h4>
                  <div class="form-row">
                    <div class="form-group"><label class="form-label">First Name *</label><input type="text" id="co-fname" class="form-input" required></div>
                    <div class="form-group"><label class="form-label">Last Name *</label><input type="text" id="co-lname" class="form-input" required></div>
                  </div>
                  <div class="form-group"><label class="form-label">Email Address *</label><input type="email" id="co-email" class="form-input" required></div>
                  <div class="form-group"><label class="form-label">Phone Number *</label><input type="tel" id="co-phone" class="form-input" required></div>
                </div>

                <!-- Shipping -->
                <div class="card mb-md" style="padding:var(--space-lg); border:1px solid var(--border);">
                  <h4 class="mb-md">Shipping Address</h4>
                  <div class="form-group"><label class="form-label">Address *</label><input type="text" id="co-address" class="form-input" placeholder="House number, street, area" required></div>
                  <div class="form-group"><label class="form-label">Apt, suite, unit (optional)</label><input type="text" id="co-apt" class="form-input"></div>
                  <div class="form-row">
                    <div class="form-group"><label class="form-label">Zip *</label><input type="text" id="co-zip" class="form-input" required></div>
                    <div class="form-group"><label class="form-label">City *</label><input type="text" id="co-city" class="form-input" required></div>
                  </div>
                </div>

                <!-- Payment -->
                <div class="card mb-md" style="padding:var(--space-lg); border:1px solid var(--border);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 class="mb-md">Payment Method</h4>
                  </div>
                  
                  <div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">
                    <!-- Card Option -->
                    <label style="display:flex; padding:var(--space-md); border-bottom:1px solid var(--border); cursor:pointer; align-items:center; gap:12px; background:var(--glass-bg)">
                      <input type="radio" name="payMethod" value="card" checked>
                      <div style="flex:1; font-weight:600;">Credit/Debit Card</div>
                      <div style="font-size:1.2rem;">💳</div>
                    </label>
                    <div id="pm-card-details" style="padding:var(--space-md);">
                      <div class="form-group"><input type="text" class="form-input" placeholder="Card number"></div>
                      <div class="form-row">
                        <div class="form-group"><input type="text" class="form-input" placeholder="MM / YY"></div>
                        <div class="form-group"><input type="text" class="form-input" placeholder="CVC"></div>
                      </div>
                    </div>
                    
                    <!-- Bank Option -->
                    <label style="display:flex; padding:var(--space-md); border-bottom:1px solid var(--border); cursor:pointer; align-items:center; gap:12px; background:var(--glass-bg)">
                      <input type="radio" name="payMethod" value="bank">
                      <div style="flex:1; font-weight:600;">Bank Transfer (silai.pk)</div>
                      <div style="font-size:1.2rem;">🏦</div>
                    </label>
                    <div id="pm-bank-details" style="padding:var(--space-md); display:none; font-size:0.85rem; color:var(--text-muted)">
                      Please transfer the total amount to: <br/>
                      <strong>Bank:</strong> Meezan Bank Ltd <br/>
                      <strong>Title:</strong> SilaiBox Pvt Ltd<br/>
                      <strong>Account Num:</strong> 0123 4567 8910 11<br/><br/>
                      Use your Order ID as reference. 
                    </div>
                  </div>
                </div>

              </div>
              
              <!-- Order Summary Side -->
              <div style="width:100%; max-width:320px;">
                <div class="card" style="padding:var(--space-lg); border:1px solid var(--border); position:sticky; top:100px;">
                  <h4 class="mb-md">Order summary (1 item)</h4>
                  <div style="display:flex; gap:12px; margin-bottom:var(--space-md);">
                     <div style="width:60px; height:80px; background:var(--glass-bg); display:flex; align-items:center; justify-content:center; border-radius:4px; font-size:1.5rem;">👘</div>
                     <div>
                       <div style="font-weight:600; font-size:0.9rem;" id="checkout-garment">Kameez Only</div>
                       <div style="font-size:0.8rem; color:var(--text-muted);" id="checkout-size">Standard - M</div>
                     </div>
                  </div>
                  <div class="price-line" style="font-size:0.9rem;"><span>Subtotal</span><span id="co-subtotal">$22.00</span></div>
                  <div class="price-line" style="font-size:0.9rem;"><span>Shipping</span><span style="color:var(--terracotta)">TBD</span></div>
                  <hr style="border:0; border-top:1px solid var(--border); margin:12px 0;" />
                  <div class="price-line total" style="font-size:1.1rem;"><span>Total</span><span id="co-total">$22.00</span></div>
                  
                  <div style="background:rgba(233,196,106,0.1); color:var(--gold); padding:8px 12px; border-radius:4px; margin-top:12px; font-size:0.8rem; display:flex; gap:8px; align-items:center;">
                    <span>✨</span> Earn <strong id="co-points">198</strong> points on this purchase!
                  </div>

                  <div style="background:#fff3cd; color:#856404; padding:8px 12px; border-radius:4px; margin-top:12px; font-size:0.8rem; border:1px solid #ffeeba;">
                     This order will be charged fully in advance via the selected method.
                  </div>
                </div>
              </div>
            </div>
            <!-- Note: buttons are handled globally below -->
          </div>`;

let regexStep5 = /<!-- Step 5 -->\s*<div id="step-5"[\s\S]*?💳 Place Order.*<\/button>\s*<\/div>\s*<\/div>/;
content = content.replace(regexStep5, step5Checkout + '\\n\\n          <div class="form-nav" style="margin-top:var(--space-xl)">\\n            <button class="btn btn-outline" id="btn-prev" style="display:none">← Back</button>\\n            <div style="flex:1"></div>\\n            <button class="btn btn-primary" id="btn-next">Continue →</button>\\n            <button class="btn btn-teal" id="btn-submit" style="display:none; width:100%; max-width:300px;">Place Order</button>\\n          </div>\\n        </div>');

// 9. Update Price Sidebar 50% deposit text
content = content.replace(
  '<div class="price-total-big mt-lg"><div class="amount" id="price-deposit">$11.00</div><div class="label">50% Deposit Due Now</div></div>',
  '<div class="price-total-big mt-lg" style="display:none"><div class="amount" id="price-deposit">$0</div></div>'
);
content = content.replace(
  '<div class="price-deposit mt-md">Balance paid after WhatsApp approval</div>',
  '<div class="price-deposit mt-md">100% Total Due Now. Shipping calculated later.</div>'
);
content = content.replace(
  '<button class="btn btn-teal" id="btn-submit" style="display:none">💳 Place Order &amp; Pay 50%</button>',
  '<button class="btn btn-teal" id="btn-submit" style="display:none; width:100%;">Place Order</button>'
);

// 10. Fake Reviews Section
let reviewsSection = `  <!-- Fake Reviews Section -->
  <section class="reviews-section" style="padding:var(--space-3xl) 0; background:var(--background-alt);">
    <div class="container">
      <div class="text-center mb-2xl">
        <span class="section-label">✦ Reviews</span>
        <h2 class="section-heading">Loved by Overseas Pakistanis</h2>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:var(--space-lg);">
        <div class="card card-glass text-center" style="padding:var(--space-xl)">
          <div style="color:var(--gold); font-size:1.2rem; margin-bottom:8px;">★★★★★</div>
          <p style="font-style:italic; font-size:0.95rem; line-height:1.6">"I live in Toronto and finding a good tailor was impossible. Silai stitched my lawn copies perfectly, delivery was so quick!"</p>
          <div class="mt-md" style="font-weight:600;">Sadia R.</div>
          <div style="font-size:0.8rem; color:var(--text-muted)">🇨🇦 Toronto, Canada</div>
        </div>
        <div class="card card-glass text-center" style="padding:var(--space-xl)">
          <div style="color:var(--gold); font-size:1.2rem; margin-bottom:8px;">★★★★★</div>
          <p style="font-style:italic; font-size:0.95rem; line-height:1.6">"Absolutely premium finish on my Velvet suit. The tassels they added were beautiful. Highly recommended for UK Pakistanis!"</p>
          <div class="mt-md" style="font-weight:600;">Amina M.</div>
          <div style="font-size:0.8rem; color:var(--text-muted)">🇬🇧 London, UK</div>
        </div>
        <div class="card card-glass text-center" style="padding:var(--space-xl)">
          <div style="color:var(--gold); font-size:1.2rem; margin-bottom:8px;">★★★★★</div>
          <p style="font-style:italic; font-size:0.95rem; line-height:1.6">"From Khaadi sourcing to WhatsApp updates, it felt like I was shopping in Lahore. Fits better than off-the-rack."</p>
          <div class="mt-md" style="font-weight:600;">Hassan Z.</div>
          <div style="font-size:0.8rem; color:var(--text-muted)">🇺🇸 Texas, USA</div>
        </div>
      </div>
    </div>
  </section>`;

content = content.replace('  <!-- How It Works -->', reviewsSection + '\\n\\n  <!-- How It Works -->');

// 11. About Us View (Naik Bibi's Story)
let aboutView = `<!-- ========================================================
     ABOUT US VIEW
======================================================== -->
<div id="view-about" class="spa-view">
  <div class="page-header"><div class="container page-header-content text-center"><h1>📖 Our Story</h1><p class="section-subheading" style="margin:0 auto">A passion for stitching passed down through generations.</p></div></div>
  <div class="container" style="padding-top:var(--space-3xl);padding-bottom:var(--space-4xl); max-width:800px; line-height:1.8; font-size:1.05rem;">
    <p>My mum, Naik Bibi, has had a passion for stitching since her young age. When we were kids in 1st and 2nd grade, she completed her diploma in stitching and tailoring from Fauji Foundation School in Pattoki, graduating with 85% marks. She had originally learned the craft in her childhood from her brother (my Mamu).</p>
    <p>Driven by her skills, she opened her own tailoring academy, where she taught tailoring to young girls in our hometown of Pattoki for several years. Later, due to eyesight weakness and the growing responsibilities of raising kids and managing a house, she couldn't continue teaching—but the passion never died.</p>
    <p>Years later, when we moved to Lahore, she focused entirely on us and our education. As the youngest sibling after my sister, I went on to complete my bachelor's degree.</p>
    <p>With a passion for entrepreneurship, I got the idea for Silai.pk from my friend Maria Sartaj, an overseas Pakistani living in Canada. She mentioned the struggle of finding a good tailor and how expensive stitching was abroad.</p>
    <p>So, we thought: <em>why not build a bridge?</em> A platform where overseas customers can either deliver their fabric to us or have us source unstitched cloth directly from top Pakistani brands. We stitch it with the same love, care, and mastery my mum always poured into her work, and deliver it straight to their doorsteps anywhere in the world.</p>
    <div style="margin-top:var(--space-2xl); padding:var(--space-xl); background:var(--glass-bg); text-align:center; border-radius:12px; border:1px solid var(--border)">
      <h3 style="margin-bottom:8px">Silai — Premium Stitching</h3>
      <p style="margin:0">From Lahore to the World. ✈️🧵</p>
    </div>
  </div>
</div>`;

content = content.replace('<!-- ========================================================', aboutView + '\\n\\n<!-- ========================================================');

// 12. Examples of Stitching in Showcase Section
content = content.replace(
  '<div class="showcase-grid">',
  `<p style="text-align:center; max-width:600px; margin:0 auto var(--space-xl); color:var(--text-muted)">We provide custom tailoring for women & men, specialized in Pakistani traditional outfits. Ship us your unstitched suits or let us buy them for you from top brands (Khaadi, J., Maria B., etc)!</p>
   <div class="showcase-grid">`
);

// 13. Admin Dashboard canvas
content = content.replace(
  '<h3 class="mb-md">Recent Orders Activity</h3>',
  `<div class="card mb-2xl" style="padding:var(--space-lg); border:1px solid var(--border)">
      <h3 class="mb-md">Revenue & Orders (30 Days)</h3>
      <canvas id="admin-chart" width="100%" height="40"></canvas>
   </div>
   <h3 class="mb-md">Recent Orders Activity</h3>`
);

// Add Chart.js script tag
content = content.replace(
  '</body>',
  '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n</body>'
);

// Add Size chart Modal
let sizeChartModal = `<!-- ─── Size Chart Modal ──────────────────── -->
<div id="size-chart-modal" class="modal-overlay" onclick="if(event.target===this)this.classList.remove('open')">
  <div class="modal-box" style="max-width:500px">
    <button class="modal-close" onclick="document.getElementById('size-chart-modal').classList.remove('open')">✕</button>
    <h3 class="mb-lg" style="text-align:center">Standard Size Chart</h3>
    <table style="width:100%; border-collapse:collapse; text-align:center; font-size:0.9rem">
      <thead style="background:#eaf0fc;">
        <tr><th style="padding:10px; border:1px solid #c9d6f0;">Size</th><th style="padding:10px; border:1px solid #c9d6f0;">S</th><th style="padding:10px; border:1px solid #c9d6f0;">M</th><th style="padding:10px; border:1px solid #c9d6f0;">L</th></tr>
      </thead>
      <tbody>
        <tr><td style="padding:8px; border-bottom:1px solid var(--border)">Length</td><td style="padding:8px; border-bottom:1px solid var(--border)">50</td><td style="padding:8px; border-bottom:1px solid var(--border)">50</td><td style="padding:8px; border-bottom:1px solid var(--border)">50</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid var(--border)">Chest</td><td style="padding:8px; border-bottom:1px solid var(--border)">18.5</td><td style="padding:8px; border-bottom:1px solid var(--border)">20.5</td><td style="padding:8px; border-bottom:1px solid var(--border)">23</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid var(--border)">Waist</td><td style="padding:8px; border-bottom:1px solid var(--border)">16</td><td style="padding:8px; border-bottom:1px solid var(--border)">17</td><td style="padding:8px; border-bottom:1px solid var(--border)">19</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid var(--border)">Hip</td><td style="padding:8px; border-bottom:1px solid var(--border)">19.5</td><td style="padding:8px; border-bottom:1px solid var(--border)">21.5</td><td style="padding:8px; border-bottom:1px solid var(--border)">25</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid var(--border)">Armhole</td><td style="padding:8px; border-bottom:1px solid var(--border)">7</td><td style="padding:8px; border-bottom:1px solid var(--border)">8</td><td style="padding:8px; border-bottom:1px solid var(--border)">9</td></tr>
      </tbody>
    </table>
    <p class="mt-md text-muted text-center" style="font-size:0.8rem">All measurements are in inches.</p>
  </div>
</div>`;

content = content.replace('<!-- ─── Status Update Modal (Admin) ──────────────────── -->', sizeChartModal + '\\n\\n<!-- ─── Status Update Modal (Admin) ──────────────────── -->');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Update Complete.');
