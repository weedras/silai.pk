const fs = require('fs');
const path = require('path');

const targetFile = path.join('c:', 'Users', 'Wali', 'Downloads', 'silai stuff', 'silaibox', 'public', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

const flowchartHTML = `
  <!-- Process Flowchart Section -->
  <section class="process-flowchart" style="padding:var(--space-3xl) 0; background:var(--background-alt); position:relative; overflow:hidden;">
    <div class="container text-center mb-2xl z-10 position-relative">
      <span class="section-label">✦ The Silai Process</span>
      <h2 class="section-heading">How We Craft Your Outfit</h2>
      <p class="section-subheading" style="margin:0 auto">Step-by-step transparency from unstitched fabric to a final masterpiece.</p>
    </div>
    
    <div class="container position-relative z-10">
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-xl); position: relative;">
         
         <!-- Stage 1 -->
         <div style="position:relative; z-index:1; text-align:center;">
           <div style="width:180px; height:180px; margin:0 auto var(--space-md); border-radius:50%; overflow:hidden; border:3px solid var(--gold); box-shadow:0 10px 30px rgba(0,0,0,0.5); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <img src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" style="width:100%; height:100%; object-fit:cover;" alt="Fabric Sourcing">
           </div>
           <div style="width:40px; height:40px; background:var(--gold); color:var(--background); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem; margin:-40px auto var(--space-sm); position:relative; z-index:2; box-shadow:0 4px 12px rgba(0,0,0,0.4);">1</div>
           <h4 style="color:var(--text); margin-bottom:8px; font-size:1.1rem;">Fabric Sourcing</h4>
           <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5;">You send us your unstitched fabric or we buy it for you from premium brands.</p>
         </div>

         <!-- Stage 2 -->
         <div style="position:relative; z-index:1; text-align:center;">
           <div style="width:180px; height:180px; margin:0 auto var(--space-md); border-radius:50%; overflow:hidden; border:3px solid var(--gold); box-shadow:0 10px 30px rgba(0,0,0,0.5); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <img src="https://images.unsplash.com/photo-1528812920409-b46377e87ab0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" style="width:100%; height:100%; object-fit:cover;" alt="Cutting">
           </div>
           <div style="width:40px; height:40px; background:var(--gold); color:var(--background); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem; margin:-40px auto var(--space-sm); position:relative; z-index:2; box-shadow:0 4px 12px rgba(0,0,0,0.4);">2</div>
           <h4 style="color:var(--text); margin-bottom:8px; font-size:1.1rem;">Precision Cutting</h4>
           <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5;">Our master tailors draft layout patterns precisely to your measurements.</p>
         </div>

         <!-- Stage 3 -->
         <div style="position:relative; z-index:1; text-align:center;">
           <div style="width:180px; height:180px; margin:0 auto var(--space-md); border-radius:50%; overflow:hidden; border:3px solid var(--gold); box-shadow:0 10px 30px rgba(0,0,0,0.5); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" style="width:100%; height:100%; object-fit:cover;" alt="Sewing">
           </div>
           <div style="width:40px; height:40px; background:var(--gold); color:var(--background); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem; margin:-40px auto var(--space-sm); position:relative; z-index:2; box-shadow:0 4px 12px rgba(0,0,0,0.4);">3</div>
           <h4 style="color:var(--text); margin-bottom:8px; font-size:1.1rem;">Expert Stitching</h4>
           <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5;">Heavy sewing, over-locking, and custom add-ons like laces & tassels attached.</p>
         </div>

         <!-- Stage 4 -->
         <div style="position:relative; z-index:1; text-align:center;">
           <div style="width:180px; height:180px; margin:0 auto var(--space-md); border-radius:50%; overflow:hidden; border:3px solid var(--gold); box-shadow:0 10px 30px rgba(0,0,0,0.5); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <img src="https://images.unsplash.com/photo-1583391733959-b9090623a23e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" style="width:100%; height:100%; object-fit:cover;" alt="Finished Outfits">
           </div>
           <div style="width:40px; height:40px; background:var(--gold); color:var(--background); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem; margin:-40px auto var(--space-sm); position:relative; z-index:2; box-shadow:0 4px 12px rgba(0,0,0,0.4);">4</div>
           <h4 style="color:var(--text); margin-bottom:8px; font-size:1.1rem;">Finished Masterpiece</h4>
           <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.5;">Your beautifully crafted, perfectly fitting garment is packed and delivered!</p>
         </div>

      </div>
    </div>
  </section>
`;

if (!content.includes('class="process-flowchart"')) {
   content = content.replace('<!-- Craft Section -->', flowchartHTML + '\\n\\n  <!-- Craft Section -->');
   fs.writeFileSync(targetFile, content, 'utf8');
   console.log('Flowchart section successfully injected!');
} else {
   console.log('Flowchart already exists.');
}
