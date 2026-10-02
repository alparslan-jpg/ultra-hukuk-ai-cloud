const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.tsx')) results.push(full);
  });
  return results;
}

const files = walk('src/components');
console.log('Inspecting components...');

const darkBgs = ['bg-slate-900', 'bg-slate-950', 'bg-slate-800', 'bg-indigo-950', 'bg-emerald-950', 'bg-rose-950', 'bg-amber-950', 'bg-sky-950'];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n');
  let issues = 0;
  lines.forEach((line, i) => {
    darkBgs.forEach(bg => {
      // Look for bg where it doesn't have dark: prefix in the class
      // i.e., "bg-slate-900" and not "dark:bg-slate-900"
      const regex = new RegExp('(?<!dark:)' + bg + '\\b');
      if (regex.test(line)) {
        // Check if there is a light background counterpart on the same line
        if (!line.includes('bg-white') && !line.includes('bg-slate-50') && !line.includes('bg-slate-100')) {
          issues++;
        }
      }
    });
  });
  if (issues > 0) {
    console.log(`${f}: ${issues} lines with hardcoded dark backgrounds`);
  }
});
