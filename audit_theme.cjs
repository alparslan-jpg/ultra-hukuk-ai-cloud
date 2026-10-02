const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.tsx') || file.endsWith('.css')) results.push(full);
  });
  return results;
}

const files = walk('src');
console.log('Total files:', files.length);

// Check index.css
const css = fs.readFileSync('src/index.css', 'utf8');
console.log('index.css has custom-variant:', css.includes('@custom-variant dark'));
