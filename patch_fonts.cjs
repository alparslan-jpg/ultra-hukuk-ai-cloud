const fs = require('fs');
let code = fs.readFileSync('src/components/MuvekkilDavaPortali.tsx', 'utf8');

// 1. Constrain layout width
code = code.replace(
  '<div className="space-y-6">',
  '<div className="space-y-6 max-w-7xl mx-auto w-full px-2">'
);

// 2. Add "Ekle" buttons in column headers or bottoms.
// Column 1 Header:
code = code.replace(
  /<span className="text-\[10px\] text-slate-400 dark:text-slate-500 font-mono">1\. Kademe<\/span>/g,
  `<button onClick={() => setShowAddClientModal(true)} className="px-3 py-1.5 bg-sky-600/20 text-sky-600 dark:text-sky-400 hover:bg-sky-600/30 rounded-lg text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> Müvekkil Ekle</button>`
);

// Column 2 Header:
code = code.replace(
  /<span className="text-\[10px\] text-slate-400 dark:text-slate-500 font-mono">2\. Kademe<\/span>/g,
  `{selectedClientId && <button onClick={() => setShowAddCaseModal(true)} className="px-3 py-1.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> Dava Ekle</button>}`
);

// Column 3 Header:
code = code.replace(
  /<span className="text-\[10px\] text-slate-400 dark:text-slate-500 font-mono">3\. Kademe<\/span>/g,
  `{selectedCaseId && <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> Evrak Ekle</button>}`
);

// Increase list max-heights to fit better on 1 page
code = code.replace(/max-h-\[560px\]/g, 'max-h-[65vh]');

// Font size replacements - specific ones first
code = code.replace(/text-xs/g, '__TEMP_SM__');
code = code.replace(/text-sm/g, '__TEMP_BASE__');
code = code.replace(/text-base/g, '__TEMP_LG__');
code = code.replace(/text-lg/g, '__TEMP_XL__');
code = code.replace(/text-\[10px\]/g, 'text-xs');
code = code.replace(/text-\[11px\]/g, 'text-sm');

// Now restore temp placeholders to their new values
code = code.replace(/__TEMP_SM__/g, 'text-sm');
code = code.replace(/__TEMP_BASE__/g, 'text-base');
code = code.replace(/__TEMP_LG__/g, 'text-lg');
code = code.replace(/__TEMP_XL__/g, 'text-xl');

// Increase icon sizes
code = code.replace(/w-3\.5 h-3\.5/g, 'w-4 h-4');
code = code.replace(/w-3 h-3/g, 'w-4 h-4');

// Improve padding in lists
code = code.replace(/p-3 rounded-xl/g, 'p-4 rounded-xl');
code = code.replace(/py-2\.5 px-3/g, 'py-3 px-4');

fs.writeFileSync('src/components/MuvekkilDavaPortali.tsx', code, 'utf8');
console.log('Done adjusting layout and fonts.');
