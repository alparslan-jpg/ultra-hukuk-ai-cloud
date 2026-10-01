import fs from 'fs';

const filePath = 'src/components/AjanKonseyiOdasi.tsx';
let raw = fs.readFileSync(filePath, 'utf8');
let lines = raw.split(/\r?\n/);
console.log('Original lines count:', lines.length);

// 1. Fix ChevronRight comma
for (let i = 0; i < 50; i++) {
  if (lines[i].includes('ChevronRight') && !lines[i].includes(',')) {
    lines[i] = lines[i].replace('ChevronRight', 'ChevronRight,');
    console.log('Fixed ChevronRight comma at line', i + 1);
  }
}

// 2. Remove extra </div>{/* end main conv div */}
const extraDivIdx = lines.findIndex(l => l.includes('</div>{/* end main conv div */}'));
if (extraDivIdx !== -1) {
  lines.splice(extraDivIdx, 1);
  console.log('Removed extra closing div at line', extraDivIdx + 1);
}

// 3. Update attachedFiles.map to include Analiz Et, Detaylı Analiz, Cımbızla
const fMapIdx = lines.findIndex(l => l.includes('attachedFiles.map((f, idx) => ('));
if (fMapIdx !== -1) {
  // Find where this item ends: the removeAttachedFile button line and its closing div
  const removeBtnLine = lines.findIndex((l, idx) => idx > fMapIdx && l.includes('removeAttachedFile(idx)'));
  if (removeBtnLine !== -1) {
    const itemCloseDiv = lines.findIndex((l, idx) => idx > removeBtnLine && l.trim() === '</div>');
    if (itemCloseDiv !== -1) {
      const replacementItem = [
        '                  <div key={idx} className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800">',
        '                    <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />',
        '                    <span className="text-slate-700 dark:text-slate-300 max-w-[120px] truncate font-medium">{f.name}</span>',
        '                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, \'analiz\')}',
        '                      className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[9px] font-semibold hover:bg-sky-200 dark:hover:bg-sky-800 transition disabled:opacity-40 flex items-center gap-0.5">',
        '                      <Sparkles className="w-2.5 h-2.5" />Analiz Et',
        '                    </button>',
        '                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, \'detayli\')}',
        '                      className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[9px] font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition disabled:opacity-40 flex items-center gap-0.5">',
        '                      <Layers className="w-2.5 h-2.5" />Detaylı Analiz',
        '                    </button>',
        '                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, \'cimbiz\')}',
        '                      className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-[9px] font-semibold hover:bg-rose-200 dark:hover:bg-rose-800 transition disabled:opacity-40 flex items-center gap-0.5">',
        '                      <AlertTriangle className="w-2.5 h-2.5" />Cımbızla',
        '                    </button>',
        '                    <button type="button" onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-0.5 ml-auto" title="Evrakı Kaldır">',
        '                      <X className="w-3 h-3" />',
        '                    </button>',
        '                  </div>'
      ];
      // lines between fMapIdx + 1 and itemCloseDiv inclusive
      lines.splice(fMapIdx + 1, (itemCloseDiv - (fMapIdx + 1) + 1), ...replacementItem);
      console.log('Updated attached file items with Analiz Et, Detaylı Analiz, Cımbızla buttons');
    }
  }
}

// 4. Add "Dava Dosyası Oluştur" button right before Send button
const hasDavaBtn = lines.some(l => l.includes('handleCreateCaseFile') && l.includes('<button'));
if (!hasDavaBtn) {
  const sendBtnIdx = lines.findIndex(l => l.includes('{/* Send Button */}'));
  if (sendBtnIdx !== -1) {
    const createCaseBtn = [
      '            {/* Dava Dosyası Oluştur */}',
      '            <button',
      '              type="button"',
      '              disabled={isSavingCase || isConsulting}',
      '              onClick={handleCreateCaseFile}',
      '              className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0 ${',
      '                savedCaseSuccess',
      '                  ? \'bg-emerald-600 text-white\'',
      '                  : \'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white disabled:opacity-40\'',
      '              }`}',
      '              title="Dava dosyası oluştur, müvekkil kaydı yap, dilekçe taslağı üret ve arşivle"',
      '            >',
      '              {isSavingCase ? (',
      '                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />',
      '              ) : savedCaseSuccess ? (',
      '                <>',
      '                  <CheckCircle2 className="w-4 h-4" />',
      '                  <span className="hidden sm:inline">Kaydedildi!</span>',
      '                </>',
      '              ) : (',
      '                <>',
      '                  <FolderPlus className="w-4 h-4" />',
      '                  <span className="hidden sm:inline whitespace-nowrap">Dava Dosyası Oluştur</span>',
      '                </>',
      '              )}',
      '            </button>',
      ''
    ];
    lines.splice(sendBtnIdx, 0, ...createCaseBtn);
    console.log('Added Dava Dosyası Oluştur button before Send button');
  }
}

fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
console.log('✅ fix_final.mjs completed successfully! Final lines count:', lines.length);
