const fs = require('fs');
const path = require('path');

const baseDir = path.join('c:', 'Users', 'Wali', 'Downloads', 'silai stuff', 'silaibox');
const targetImagesDir = path.join(baseDir, 'public', 'assets', 'images');

const imageMap = {
  'pak_fabric.png': 'C:\\Users\\Wali\\.gemini\\antigravity\\brain\\2cc19d63-d1ed-4080-b856-0f3943b250f3\\pakistani_fabric_1774987660547.png',
  'pak_cutting.png': 'C:\\Users\\Wali\\.gemini\\antigravity\\brain\\2cc19d63-d1ed-4080-b856-0f3943b250f3\\pakistani_cutting_1774987676248.png',
  'pak_sewing.png': 'C:\\Users\\Wali\\.gemini\\antigravity\\brain\\2cc19d63-d1ed-4080-b856-0f3943b250f3\\pakistani_sewing_1774987693732.png',
  'pak_suit.png': 'C:\\Users\\Wali\\.gemini\\antigravity\\brain\\2cc19d63-d1ed-4080-b856-0f3943b250f3\\pakistani_suit_1774987710635.png'
};

// 1. Copy images
for (const [newFileName, sourcePath] of Object.entries(imageMap)) {
  const destPath = path.join(targetImagesDir, newFileName);
  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${newFileName}`);
  } catch(e) { console.error('Error copying ' + sourcePath); }
}

// 2. Change CSS theme
const cssFile = path.join(baseDir, 'public', 'css', 'main.css');
let cssContent = fs.readFileSync(cssFile, 'utf8');

// Replace standard black midnights with beautiful ethnic deep forest green
cssContent = cssContent.replace('--midnight:      #0D0D1A;', '--midnight:      #112a20;');
cssContent = cssContent.replace('--midnight-2:    #12121F;', '--midnight-2:    #16372a;');
cssContent = cssContent.replace('--midnight-3:    #1A1A2E;', '--midnight-3:    #1b4434;');
cssContent = cssContent.replace('--midnight-4:    #222238;', '--midnight-4:    #225340;');

fs.writeFileSync(cssFile, cssContent);
console.log('CSS Ethnic backgrounds replaced!');

// 3. Update index.html Flowchart urls
const htmlFile = path.join(baseDir, 'public', 'index.html');
let htmlContent = fs.readFileSync(htmlFile, 'utf8');

htmlContent = htmlContent.replace('https://images.unsplash.com/photo-1596464716127-f2a82984de30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', '/assets/images/pak_fabric.png');
htmlContent = htmlContent.replace('https://images.unsplash.com/photo-1528812920409-b46377e87ab0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', '/assets/images/pak_cutting.png');
htmlContent = htmlContent.replace('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', '/assets/images/pak_sewing.png');
htmlContent = htmlContent.replace('https://images.unsplash.com/photo-1583391733959-b9090623a23e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', '/assets/images/pak_suit.png');

fs.writeFileSync(htmlFile, htmlContent);
console.log('HTML images updated to Pakistani ones!');
