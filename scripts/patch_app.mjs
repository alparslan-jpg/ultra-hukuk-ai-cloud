import { readFileSync, writeFileSync } from 'fs';

// ─── 1. PATCH App.tsx ────────────────────────────────────────────────────────
let app = readFileSync('./src/App.tsx', 'utf8');

// a) AppPage type'dan 'clients' kaldır
app = app.replace(`  | 'clients'\n`, '');

// b) Üst nav'dan Müvekkil & Davalar butonu
app = app.replace(
  /\s*<button\s[^>]*onClick=\{[^}]*setCurrentPage\('clients'\)[^}]*\}[^>]*>\s*Müvekkil \& Davalar\s*<\/button>/s,
  ''
);

// c) Breadcrumb'daki clients referansı
app = app.replace(/\s*\{currentPage === 'clients' && '[^']+'\}\r?\n/g, '\n');

// d) Sidebar'daki clients butonları (2 tane olabilir - "Muvekkil / Dava Ekle" ve "Muvekkil and Davalar")
app = app.replace(
  /\s*<button type="button" onClick=\{\(\) => setCurrentPage\('clients'\)\}[^>]*>[\s\S]*?<\/button>/g,
  ''
);

// e) PAGE 2 (clients page block) kaldır
app = app.replace(
  /\s*\{\/\* ={8,}\s*PAGE 2: MÜVEKKİL[\s\S]*?={8,} \*\/\}\s*\{currentPage === 'clients' && \([\s\S]*?\n\s*\)\}\s*/,
  '\n'
);

// f) main wrapper'ı full-height yap (workspace modunda)
app = app.replace(
  '<main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">',
  '<main className="flex-1 w-full overflow-hidden flex flex-col">'
);

// g) home page div - tam yükseklik
app = app.replace(
  `{currentPage === 'home' && (\n          <div className="flex overflow-hidden" style={{height: 'calc(100vh - 76px)'}}>`,
  `{currentPage === 'home' && (\n          <div className="flex flex-1 overflow-hidden" style={{minHeight: 0}}>`
);

writeFileSync('./src/App.tsx', app, 'utf8');
console.log('✅ App.tsx patched');

// ─── 2. PATCH AjanKonseyiOdasi.tsx ──────────────────────────────────────────
let ajan = readFileSync('./src/components/AjanKonseyiOdasi.tsx', 'utf8');

// a) Outer wrapper: space-y-6 → h-full flex flex-col
ajan = ajan.replace(
  'return (\n    <div className="space-y-6">',
  'return (\n    <div className="h-full flex flex-col overflow-hidden">'
);

// b) Banner: rounded card → full-width border-b strip
ajan = ajan.replace(
  '<div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-md">',
  '<div className="bg-white dark:bg-[#0e1524] border-b border-slate-200 dark:border-slate-800/80 px-5 py-4 shadow-sm relative overflow-hidden backdrop-blur-md shrink-0">'
);

// c) Conversation container: sabit min-h ve rounded → flex-1
ajan = ajan.replace(
  '<div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[640px]">',
  '<div className="flex-1 bg-white dark:bg-[#0e1524] flex flex-col overflow-hidden" style={{minHeight: 0}}>'
);

// d) Messages scroll area: sabit max-h → flex-1
ajan = ajan.replace(
  '<div className="flex-1 p-5 overflow-y-auto space-y-6 max-h-[580px]">',
  '<div className="flex-1 p-5 overflow-y-auto space-y-6">'
);

writeFileSync('./src/components/AjanKonseyiOdasi.tsx', ajan, 'utf8');
console.log('✅ AjanKonseyiOdasi.tsx patched');
console.log('Done!');
