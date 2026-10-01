const fs = require('fs');
let code = fs.readFileSync('src/components/MuvekkilDavaPortali.tsx', 'utf8');

// Replace top wrapper
code = code.replace(
  '<div className="space-y-6 max-w-7xl mx-auto w-full px-2">',
  '<div className="flex flex-col h-[calc(100vh-80px)] max-w-[1400px] mx-auto w-full px-2 gap-4 pb-4">'
);

// We need the grid container to take remaining height and its columns to be scrollable
code = code.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">',
  '<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">'
);

// We need the 3 columns to be flex-col and overflow-hidden, their inner lists to be overflow-y-auto and flex-1
const col1 = '<div className="lg:col-span-3 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">';
const col1Replacement = '<div className="lg:col-span-3 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-hidden">';
code = code.replace(col1, col1Replacement);

const col2 = '<div className="lg:col-span-4 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">';
const col2Replacement = '<div className="lg:col-span-4 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-hidden">';
code = code.replace(col2, col2Replacement);

const col3 = '<div className="lg:col-span-5 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4">';
const col3Replacement = '<div className="lg:col-span-5 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-hidden">';
code = code.replace(col3, col3Replacement);

// Make the lists themselves flex-1 overflow-y-auto
code = code.replace(
  /<div className="space-y-2 max-h-\[65vh\] overflow-y-auto pr-1">/g,
  '<div className="space-y-2 flex-1 overflow-y-auto pr-2 mt-3 custom-scrollbar">'
);
code = code.replace(
  /<div className="space-y-3 max-h-\[65vh\] overflow-y-auto pr-1">/g,
  '<div className="space-y-3 flex-1 overflow-y-auto pr-2 mt-3 custom-scrollbar">'
);

// In column 3, there's a file list container, let's fix that
code = code.replace(
  /<div className="space-y-3 overflow-y-auto max-h-\[65vh\] pr-1">/g,
  '<div className="space-y-3 flex-1 overflow-y-auto pr-2 mt-3 custom-scrollbar">'
);

// Remove the top margin header gap in the UI to fit perfectly
code = code.replace(
  '<div className="space-y-6">', // Fallback if earlier failed
  '<div className="flex flex-col h-[calc(100vh-80px)] max-w-[1400px] mx-auto w-full px-2 gap-4 pb-4">'
);

fs.writeFileSync('src/components/MuvekkilDavaPortali.tsx', code, 'utf8');
console.log('Layout patched for perfect single-page fit.');
