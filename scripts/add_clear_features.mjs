import fs from 'fs';

// ── 1. Update AjanKonseyiOdasi.tsx ──────────────────────────────────────────
const ajanFile = 'src/components/AjanKonseyiOdasi.tsx';
let ajanRaw = fs.readFileSync(ajanFile, 'utf8');
let ajanLines = ajanRaw.split(/\r?\n/);

// Add Trash2 to imports
const usersImportIdx = ajanLines.findIndex(l => l.includes('Users,'));
if (usersImportIdx !== -1 && !ajanLines[usersImportIdx].includes('Trash2')) {
  ajanLines[usersImportIdx] = ajanLines[usersImportIdx].replace('Users,', 'Users, Trash2,');
  console.log('✅ Added Trash2 to imports in AjanKonseyiOdasi');
}

// In right panel: handle activeModule === 'arsiv'
const showMuvIdx = ajanLines.findIndex(l => l.includes('{showMuvekkilPanel ? ('));
if (showMuvIdx !== -1) {
  // Find where : ( is after MuvekkilYonetimi closing
  const muvCloseIdx = ajanLines.findIndex((l, idx) => idx > showMuvIdx && l.includes(') : ('));
  if (muvCloseIdx !== -1) {
    const archivePanelCode = [
      '        ) : activeModule === \'arsiv\' ? (',
      '          <div className="flex-1 bg-white dark:bg-[#0e1524] flex flex-col overflow-hidden p-6 space-y-4">',
      '            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">',
      '              <div className="flex items-center gap-2.5">',
      '                <Archive className="w-5 h-5 text-amber-500" />',
      '                <div>',
      '                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Arşivlenen Davalar</h3>',
      '                  <p className="text-xs text-slate-500">Sistemde arşivlenen dava dosyaları ({archivedCases.length})</p>',
      '                </div>',
      '              </div>',
      '              <div className="flex items-center gap-2">',
      '                {archivedCases.length > 0 && (',
      '                  <button',
      '                    type="button"',
      '                    onClick={() => {',
      '                      if (confirm(\'Tüm arşivlenen dava dosyalarını silmek istediğinize emin misiniz?\')) {',
      '                        setArchivedCases([]);',
      '                        localStorage.removeItem(\'ultra_archived_cases\');',
      '                      }',
      '                    }}',
      '                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"',
      '                  >',
      '                    <Trash2 className="w-3.5 h-3.5" />',
      '                    <span>Tüm Arşivi Temizle</span>',
      '                  </button>',
      '                )}',
      '                <button',
      '                  type="button"',
      '                  onClick={() => setActiveModule(\'musavir\')}',
      '                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"',
      '                >',
      '                  Danışma Odasına Dön',
      '                </button>',
      '              </div>',
      '            </div>',
      '',
      '            <div className="flex-1 overflow-y-auto space-y-3">',
      '              {archivedCases.length === 0 ? (',
      '                <div className="p-12 text-center text-slate-400">',
      '                  <Archive className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />',
      '                  <p className="text-sm font-semibold">Arşivde dava dosyası bulunmuyor.</p>',
      '                  <p className="text-xs text-slate-500 mt-1">Dava dosyaları tamamen temizlendi.</p>',
      '                </div>',
      '              ) : (',
      '                archivedCases.map((c: any, idx: number) => (',
      '                  <div key={c.id || idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141d30] space-y-2">',
      '                    <div className="flex items-start justify-between gap-2">',
      '                      <div>',
      '                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.caseContext || \'Dava Dosyası\'}</div>',
      '                        <div className="text-[11px] text-slate-400">Tarih: {new Date(c.date).toLocaleString(\'tr-TR\')} {c.lehine ? `· Lehine: ${c.lehine}` : \'\'}</div>',
      '                      </div>',
      '                      <button',
      '                        type="button"',
      '                        onClick={() => {',
      '                          const updated = archivedCases.filter((_, i) => i !== idx);',
      '                          setArchivedCases(updated);',
      '                          localStorage.setItem(\'ultra_archived_cases\', JSON.stringify(updated));',
      '                        }}',
      '                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"',
      '                        title="Bu dosyayı sil"',
      '                      >',
      '                        <Trash2 className="w-4 h-4" />',
      '                      </button>',
      '                    </div>',
      '                    {c.summary && (',
      '                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto font-sans leading-relaxed bg-white dark:bg-[#0e1524] p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">',
      '                        {c.summary}',
      '                      </p>',
      '                    )}',
      '                  </div>',
      '                ))',
      '              )}',
      '            </div>',
      '          </div>',
      '        ) : ('
    ];

    ajanLines.splice(muvCloseIdx, 1, ...archivePanelCode);
    console.log('✅ Added Archive Panel with Clear All feature to AjanKonseyiOdasi');
    fs.writeFileSync(ajanFile, ajanLines.join('\r\n'), 'utf8');
  }
}

// ── 2. Update MuvekkilYonetimi.tsx ──────────────────────────────────────────
const muvFile = 'src/components/MuvekkilYonetimi.tsx';
let muvRaw = fs.readFileSync(muvFile, 'utf8');
let muvLines = muvRaw.split(/\r?\n/);

const muvBtnIdx = muvLines.findIndex(l => l.includes('<span>Müvekkil Ekle</span>'));
if (muvBtnIdx !== -1) {
  // Find </button> after this
  const muvBtnClose = muvLines.findIndex((l, idx) => idx > muvBtnIdx && l.includes('</button>'));
  if (muvBtnClose !== -1) {
    const clearBtnCode = [
      '          {muvekkiller.length > 0 && gorunum === \'liste\' && (',
      '            <button',
      '              type="button"',
      '              onClick={() => {',
      '                if (confirm(\'Tüm müvekkil ve dava dosyalarını silmek/temizlemek istediğinize emin misiniz?\')) {',
      '                  setMuvekkiller([]);',
      '                  saveMuvekkiller([]);',
      '                  setSecilenMuvekkil(null);',
      '                  setSecilenDava(null);',
      '                }',
      '              }}',
      '              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold transition"',
      '              title="Tüm Müvekkil ve Dava Dosyalarını Temizle"',
      '            >',
      '              <Trash2 className="w-3.5 h-3.5" />',
      '              <span>Tümünü Temizle</span>',
      '            </button>',
      '          )}'
    ];
    muvLines.splice(muvBtnClose + 1, 0, ...clearBtnCode);
    console.log('✅ Added Tümünü Temizle button to MuvekkilYonetimi header');
    fs.writeFileSync(muvFile, muvLines.join('\r\n'), 'utf8');
  }
}

console.log('✅ Clear features script completed successfully!');
