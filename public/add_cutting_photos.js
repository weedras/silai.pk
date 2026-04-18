const fs = require('fs');
const path = require('path');

const targetFile = path.join('c:', 'Users', 'Wali', 'Downloads', 'silai stuff', 'silaibox', 'public', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

const cuttingPhotos = `
        <div class="showcase-card">
          <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Sewing Machine" class="showcase-img">
          <div class="showcase-overlay">
            <h4 class="text-white">Master Tailoring</h4>
            <p class="text-gold">Precision Stitching</p>
          </div>
        </div>
        <div class="showcase-card">
          <img src="https://images.unsplash.com/photo-1528812920409-b46377e87ab0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Fabric Cutting" class="showcase-img">
          <div class="showcase-overlay">
            <h4 class="text-white">Hand Cut Patterns</h4>
            <p class="text-gold">Authentic Craft</p>
          </div>
        </div>
`;

if (!content.includes('Master Tailoring')) {
   content = content.replace('</div>\n    </div>\n  </section>\n\n  <!-- About Us Section -->', cuttingPhotos + '</div>\n    </div>\n  </section>\n\n  <!-- About Us Section -->');
   fs.writeFileSync(targetFile, content, 'utf8');
   console.log('Cutting photos added successfully.');
} else {
   console.log('Already added.');
}
