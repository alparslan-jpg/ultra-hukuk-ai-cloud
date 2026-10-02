const fs = require('fs');

// Patch DavaDerinAnaliz.tsx
let dda = fs.readFileSync('src/components/DavaDerinAnaliz.tsx', 'utf8');

dda = dda.replace(/className="bg-slate-900\/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"/g,
  'className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"');

dda = dda.replace(/className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4"/g,
  'className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4"');

dda = dda.replace(/className="bg-slate-900 border border-slate-700 rounded-xl p-5"/g,
  'className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5"');

dda = dda.replace(/className="bg-slate-900 border border-slate-700 rounded-xl p-4"/g,
  'className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4"');

dda = dda.replace(/className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950\/50 p-4 rounded-xl border border-slate-800"/g,
  'className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800"');

dda = dda.replace(/className="bg-slate-800\/50 rounded-xl p-4 text-sm flex justify-between items-center"/g,
  'className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 text-sm flex justify-between items-center text-slate-800 dark:text-slate-200"');

dda = dda.replace(/className="bg-slate-800\/50 rounded-xl p-4 text-sm"/g,
  'className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200"');

dda = dda.replace(/className="p-3 bg-slate-950\/50 rounded-lg border border-slate-800 text-slate-300 text-sm border-l-2 border-l-indigo-500"/g,
  'className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm border-l-2 border-l-indigo-500"');

dda = dda.replace(/className="text-sky-100 text-sm font-mono p-3 bg-slate-950\/50 rounded-lg border border-slate-800"/g,
  'className="text-sky-900 dark:text-sky-100 text-sm font-mono p-3 bg-sky-50/50 dark:bg-slate-950/50 rounded-lg border border-sky-200 dark:border-slate-800"');

dda = dda.replace(/className="flex gap-3 items-start p-2 bg-slate-800\/30 rounded-lg"/g,
  'className="flex gap-3 items-start p-2 bg-slate-100/70 dark:bg-slate-800/30 rounded-lg"');

dda = dda.replace(/<p className="text-slate-200 text-sm leading-relaxed">/g,
  '<p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">');

dda = dda.replace(/<p className="text-slate-300 text-sm">/g,
  '<p className="text-slate-800 dark:text-slate-200 text-sm">');

dda = dda.replace(/<p className="text-slate-300">/g,
  '<p className="text-slate-800 dark:text-slate-200">');

dda = dda.replace(/<span className="text-slate-300 text-sm">/g,
  '<span className="text-slate-800 dark:text-slate-200 text-sm">');

dda = dda.replace(/<p className="text-rose-200 text-sm">/g,
  '<p className="text-rose-950 dark:text-rose-200 text-sm font-medium">');

dda = dda.replace(/<p className="text-emerald-200 text-sm">/g,
  '<p className="text-emerald-950 dark:text-emerald-200 text-sm font-medium">');

dda = dda.replace(/<ul className="list-disc list-inside text-slate-300 text-sm space-y-1">/g,
  '<ul className="list-disc list-inside text-slate-800 dark:text-slate-200 text-sm space-y-1">');

dda = dda.replace(/<ul className="list-disc list-inside text-slate-300 text-xs space-y-1">/g,
  '<ul className="list-disc list-inside text-slate-800 dark:text-slate-200 text-xs space-y-1">');

dda = dda.replace(/<h3 className="text-base font-bold text-slate-100">/g,
  '<h3 className="text-base font-bold text-slate-900 dark:text-slate-100">');

fs.writeFileSync('src/components/DavaDerinAnaliz.tsx', dda, 'utf8');

// Patch MuvekkilYonetimi.tsx
let my = fs.readFileSync('src/components/MuvekkilYonetimi.tsx', 'utf8');

my = my.replace(/text-\[11px\] font-semibold text-slate-800 dark:text-slate-200/g,
  'text-xs font-bold text-slate-900 dark:text-slate-100');

my = my.replace(/text-\[10px\] font-bold text-slate-700 dark:text-slate-200/g,
  'text-xs font-bold text-slate-900 dark:text-slate-100');

my = my.replace(/text-\[9px\] text-slate-400/g,
  'text-[10px] text-slate-600 dark:text-slate-400 font-medium');

my = my.replace(/text-\[9px\] font-mono text-slate-400/g,
  'text-[10px] font-mono text-slate-600 dark:text-slate-400 font-medium');

my = my.replace(/text-\[10px\] text-slate-400/g,
  'text-xs text-slate-600 dark:text-slate-400 font-medium');

my = my.replace(/text-slate-400/g,
  'text-slate-600 dark:text-slate-400');

fs.writeFileSync('src/components/MuvekkilYonetimi.tsx', my, 'utf8');

console.log('Successfully patched contrast in DavaDerinAnaliz and MuvekkilYonetimi.');
