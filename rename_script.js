const fs = require('fs');
const path = require('path');

function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(f => {
    const p = path.join(d, f.name);
    if (f.isDirectory()) {
      if (f.name === 'node_modules' || f.name === '.git') return;
      walk(p);
    } else if (f.isFile()) {
      const ext = path.extname(p);
      if (['.html', '.js', '.css', '.json', '.md', '.env'].includes(ext)) {
        if (f.name === 'package-lock.json') return;
        let c = fs.readFileSync(p, 'utf8');
        const count = (c.match(/Silai/g) || []).length + (c.match(/silai/g) || []).length;
        if (count > 0) {
          c = c.replace(/Silai/g, 'Silai').replace(/silai/g, 'silai');
          fs.writeFileSync(p, c);
          console.log('Updated ' + p);
        }
      }
    }
  });
}
walk('.');
console.log('Done');
