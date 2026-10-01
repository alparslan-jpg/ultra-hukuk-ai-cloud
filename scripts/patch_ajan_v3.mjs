/**
 * patch_ajan_v3.mjs
 * Tüm AjanKonseyiOdasi değişikliklerini güvenli şekilde uygular.
 * Strateji: Dosyayı satır dizisi olarak oku, hedef satırları bul, değiştir.
 */
import { readFileSync, writeFileSync } from 'fs';

const file = './src/components/AjanKonseyiOdasi.tsx';
let src = readFileSync(file, 'utf8');

// ─── 1. IMPORTS ──────────────────────────────────────────────────────────────
// Replace entire import block
const oldImportBlock = /import \{\r?\n[\s\S]*?\} from 'lucide-react';/;
const newImportBlock = `import {
  Brain,
  Mic,
  MicOff,
  Send,
  Upload,
  Paperclip,
  Sparkles,
  Gavel,
  Scale,
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Copy,
  ChevronDown,
  Layers,
  FileCheck2,
  FolderOpen,
  HelpCircle,
  Cpu,
  MessageSquare,
  X,
  Archive,
  FolderPlus,
  Crosshair,
  Activity,
  BarChart3,
  FlaskConical,
  Swords,
  Timer,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';`;
src = src.replace(oldImportBlock, newImportBlock);

// ─── 2. onNavigateTo interface prop ──────────────────────────────────────────
src = src.replace(
  `  onSyncGit?: () => void;\r\n}`,
  `  onSyncGit?: () => void;\r\n  onNavigateTo?: (page: string) => void;\r\n}`
);
src = src.replace(
  `  onSyncGit?: () => void;\n}`,
  `  onSyncGit?: () => void;\n  onNavigateTo?: (page: string) => void;\n}`
);

// ─── 3. Destructuring ────────────────────────────────────────────────────────
src = src.replace(
  /  onSyncGit\r?\n\}: AjanKonseyiOdasiProps\)/,
  `  onSyncGit,\n  onNavigateTo\n}: AjanKonseyiOdasiProps)`
);

// ─── 4. New state variables (after orchestratorModel) ────────────────────────
src = src.replace(
  `  const [orchestratorModel, setOrchestratorModel] = useState<'pro' | 'flash'>('pro');`,
  `  const [orchestratorModel, setOrchestratorModel] = useState<'pro' | 'flash'>('pro');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<string>('musavir');
  const [archivedCases, setArchivedCases] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ultra_archived_cases') || '[]'); } catch { return []; }
  });
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [savedCaseSuccess, setSavedCaseSuccess] = useState(false);`
);

// ─── 5. New functions (before return) ────────────────────────────────────────
const newFunctions = `
  // ── Evrak analiz ──────────────────────────────────────────────────────────
  const handleFileAction = async (idx: number, action: 'analiz' | 'detayli' | 'cimbiz') => {
    const f = attachedFiles[idx];
    if (!f) return;
    const labels = { analiz: 'Analiz Et', detayli: 'Detaylı Analiz', cimbiz: 'Cımbızla (TCK 272)' };
    const prompts = {
      analiz:   \`Evrakı analiz et ve özet çıkar:\\n\\n\${f.name}\\n\${(f.content||'').substring(0,2000)}\`,
      detayli:  \`Evrakı detaylı hukuki analiz et (delil değeri, hukuki nitelendirme, usul geçerliliği):\\n\\n\${f.name}\\n\${(f.content||'').substring(0,3000)}\`,
      cimbiz:   \`Cımbızlama yap: çelişki, zayıf nokta, sahte bilgi, karşı taraf avantajı tespit et:\\n\\nTCK 272 / Cımbız modu aktif\\n\\n\${f.name}\\n\${(f.content||'').substring(0,3000)}\`
    };
    const userMsg: MessageItem = { id: \`fa-\${Date.now()}\`, sender: 'lawyer', text: \`📎 \${labels[action]}: \${f.name}\`, timestamp: new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) };
    setConsultationHistory(p => [...p, userMsg]);
    setIsConsulting(true);
    try {
      const r = await fetch('/api/ai/agent-council-consultation', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ query: prompts[action], contextFiles:[f], activeCaseContext:selectedCaseNote, orchestratorModel, inputMode:'text' }) });
      const d = await r.json();
      if (d.success) {
        setConsultationHistory(p => [...p, { id:\`cns-\${Date.now()}\`, sender:'council', text: d.answerToUserQuestion||d.orchestratorSummary||'Analiz tamamlandı.', timestamp: d.timestamp||new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}), consultationData: d.mode!=='chat' ? d : undefined }]);
      }
    } catch(e:any) { alert('Hata: '+e.message); }
    finally { setIsConsulting(false); }
  };

  // ── Dava dosyası oluştur & arşivle ────────────────────────────────────────
  const handleCreateCaseFile = async () => {
    const hasContent = inputText.trim() || attachedFiles.length>0 || selectedCaseNote || consultationHistory.length>1;
    if (!hasContent) { alert('Dava dosyası oluşturmak için önce dava bilgisi girin, evrak yükleyin veya danışma yapın.'); return; }
    setIsSavingCase(true);
    const history = consultationHistory.map(m=>\`[\${m.sender==='lawyer'?'Avukat':'Müşavir'}] \${m.text}\`).join('\\n\\n');
    const fileNames = attachedFiles.map(f2=>f2.name).join(', ');
    try {
      const r = await fetch('/api/ai/agent-council-consultation', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ query: \`DAVA DOSYASI OLUŞTUR:\\n1. Müvekkil kaydı bilgilerini özetle\\n2. Dava dosyası özeti (mahkeme, taraflar, konu, talep, deliller)\\n3. Kapsamlı dilekçe taslağı (kanun maddeleriyle)\\n4. Önerilen dava stratejisi\\n\\nDanışma geçmişi:\\n\${history}\\n\\nEvraklar: \${fileNames||'Yok'}\\nBağlam: \${selectedCaseNote||'Belirtilmemiş'}\\nLehine: \${lehineText||'Belirtilmemiş'}\`,
          contextFiles:attachedFiles, activeCaseContext:selectedCaseNote, lehine:lehineText, orchestratorModel, inputMode:'text' }) });
      const d = await r.json();
      const summary = d.answerToUserQuestion||d.orchestratorSummary||'Dava dosyası oluşturuldu.';
      const newCase = { id:\`case-\${Date.now()}\`, date:new Date().toISOString(), lawyerName:lawyerName||'', lawyerSicilNo:lawyerSicilNo||'', caseContext:selectedCaseNote||'Dava Dosyası', lehine:lehineText, files:attachedFiles.map(f2=>f2.name), summary, consultationCount:consultationHistory.length };
      const updated = [newCase, ...archivedCases].slice(0,50);
      setArchivedCases(updated);
      localStorage.setItem('ultra_archived_cases', JSON.stringify(updated));
      setConsultationHistory(p => [...p, { id:\`arch-\${Date.now()}\`, sender:'council', text:\`✅ DAVA DOSYASI OLUŞTURULDU VE ARŞİVLENDİ\\n\\n\${summary}\`, timestamp:new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) }]);
      setSavedCaseSuccess(true);
      setTimeout(() => setSavedCaseSuccess(false), 4000);
    } catch(e:any) { alert('Hata: '+e.message); }
    finally { setIsSavingCase(false); }
  };

`;

// Insert before return (
src = src.replace(/\n  return \(\n/, `\n${newFunctions}  return (\n`);

// ─── 6. Model labels ──────────────────────────────────────────────────────────
src = src.replace('Gemini 3.1 Pro (Derin Akıl)', 'Derin Akıl');
src = src.replace('Gemini 3.8 Flash (Hızlı)', 'Hızlı');

// ─── 7. Outer wrapper: space-y-6 → h-full flex col ───────────────────────────
src = src.replace(
  '<div className="space-y-6">',
  '<div className="h-full flex flex-col overflow-hidden">'
);

// ─── 8. Banner → border-b strip ──────────────────────────────────────────────
src = src.replace(
  '<div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-md">',
  '<div className="bg-white dark:bg-[#0e1524] border-b border-slate-200 dark:border-slate-800/80 px-5 py-4 shadow-sm relative overflow-hidden backdrop-blur-md shrink-0">'
);

// ─── 9. Main conversation container → flex-1 ─────────────────────────────────
src = src.replace(
  '<div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[640px]">',
  '<div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>'
);

// ─── 10. Messages area: remove max-h ─────────────────────────────────────────
src = src.replace(
  '<div className="flex-1 p-5 overflow-y-auto space-y-6 max-h-[580px]">',
  '<div className="flex-1 p-5 overflow-y-auto space-y-6">'
);

// ─── 11. Inject sidebar BEFORE main conversation div ─────────────────────────
const sidebarJSX = `
      {/* BODY: Modül Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden" style={{minHeight: 0}}>

        {/* LEFT MODULE SIDEBAR */}
        <div className={\`shrink-0 flex flex-col bg-white dark:bg-[#0a1020] border-r border-slate-200 dark:border-slate-800 transition-all duration-200 \${sidebarOpen ? 'w-52' : 'w-10'}\`}>
          <button type="button" onClick={() => setSidebarOpen(p => !p)}
            className="h-8 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shrink-0"
            title={sidebarOpen ? 'Kenar çubuğunu kapat' : 'Kenar çubuğunu aç'}>
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <div className="flex-1 overflow-y-auto py-1">
            {[
              { id:'arsiv',     Icon:Archive,        label:'Arşivlenen Davalar',          sub:\`\${archivedCases.length} Arşiv\`,  color:'text-amber-500'   },
              { id:'musavir',   Icon:Brain,          label:'Baş Müşavir & Ajan Konseyi',  sub:'Sesli + 4 Ajan',               color:'text-indigo-500'  },
              { id:'git',       Icon:RefreshCw,      label:'Seçmeli Özellikler & Git',    sub:'GitHub Sync',                  color:'text-emerald-500' },
              { id:'cimbiz',    Icon:Crosshair,      label:'Adli Hakikat & Cımbız Ajanı', sub:'TCK 272 / Cımbız',           color:'text-rose-500',   page:'forensic' },
              { id:'apk',       Icon:Zap,            label:'Kişisel Mobil APK',            sub:'Sicil Mühürlü',               color:'text-teal-500',   page:'apk_download' },
              { id:'derin',     Icon:Activity,       label:'Dava Derin Analiz',            sub:'Flash & Pro',                 color:'text-purple-500', page:'analyzer' },
              { id:'analytics', Icon:BarChart3,      label:'Case Analytics',               sub:'D3.js',                       color:'text-cyan-500',   page:'workspace_full' },
              { id:'lab',       Icon:FlaskConical,   label:'Dava Analiz Laboratuvarı',    sub:'',                            color:'text-green-500',  page:'analyzer' },
              { id:'brifing',   Icon:FileText,       label:'Stratejik Dava Brifingi',     sub:'',                            color:'text-blue-500'    },
              { id:'harp',      Icon:Swords,         label:'Harp Odası & Karşı Savunma',  sub:'',                            color:'text-red-500',    page:'forensic' },
              { id:'faiz',      Icon:Timer,          label:'Zamanaşımı & Faiz',           sub:'',                            color:'text-orange-500', page:'workspace_full' },
              { id:'takvim',    Icon:CalendarDays,   label:'Dava Zaman Çizelgesi & Takvim', sub:'',                        color:'text-sky-500',    page:'workspace_full' },
              { id:'usul',      Icon:ClipboardCheck, label:'35 Noktalı Usul Denetimi',    sub:'',                            color:'text-violet-500', page:'workspace_full' },
              { id:'bilirkisi', Icon:UserCheck,      label:'Bilirkişi İtiraz Lab (HMK 281)', sub:'',                        color:'text-pink-500',   page:'workspace_full' },
              { id:'durusma',   Icon:Gavel,          label:'Duruşma Stratejisi',           sub:'',                            color:'text-amber-600',  page:'workspace_full' },
              { id:'sesli',     Icon:Mic,            label:'Adli Sesli Dikte & Duruşma Zaptı', sub:'',                      color:'text-rose-400'    },
              { id:'dilekce',   Icon:FileCheck2,     label:'UYAP Dilekçe Lab',             sub:'',                            color:'text-indigo-400', page:'petitions' },
              { id:'emsal',     Icon:Layers,         label:'Emsal Karar',                  sub:'',                            color:'text-yellow-500', page:'workspace_full' },
              { id:'ocr',       Icon:Upload,         label:'Adli Belge / Evrak Okuma (OCR)', sub:'',                         color:'text-emerald-400',page:'analyzer' },
              { id:'denetim',   Icon:HelpCircle,     label:'Denetleme Paneli (Mevzuat & Atıf)', sub:'',                    color:'text-slate-400',  page:'legislation' },
              { id:'capraz',    Icon:MessageSquare,  label:'Mevzuat Çapraz Doğrulama',    sub:'',                            color:'text-lime-500',   page:'legislation' },
              { id:'mevzuat',   Icon:Sparkles,       label:'Mevzuat Sorgulama',            sub:'',                            color:'text-blue-400',   page:'legislation' },
              { id:'sozluk',    Icon:ChevronDown,    label:'Hukuk Terimleri Sözlüğü',    sub:'',                            color:'text-amber-400',  page:'legislation' },
            ].map(({ id, Icon, label, sub, color, page }: any) => (
              <button key={id} type="button" title={label}
                onClick={() => { setActiveModule(id); if (page && onNavigateTo) onNavigateTo(page); }}
                className={\`w-full flex items-center gap-2 px-2 py-1.5 transition text-left \${activeModule===id ? 'bg-indigo-50 dark:bg-indigo-950/40 border-r-2 border-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}\`}
              >
                <Icon className={\`w-3.5 h-3.5 shrink-0 \${color}\`} />
                {sidebarOpen && (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">{label}</span>
                    {sub && <span className="block text-[9px] text-slate-400 dark:text-slate-500 truncate">{sub}</span>}
                  </span>
                )}
                {id==='arsiv' && archivedCases.length>0 && sidebarOpen && (
                  <span className="shrink-0 text-[8px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded-full font-bold">{archivedCases.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Chat Panel */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>
`;

// Insert sidebar before the main conversation div
// The main conv div is: <div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>
// But after our banner closing </div>
// Find the pattern: </div>\n\n      {/* Main Conversation
src = src.replace(
  /(\s*<\/div>\s*\n\s*\{\/\* Main Conversation)/,
  `\n${sidebarJSX}\n      {/* Main Conversation`
);

// ─── 12. Evrak listesinde analiz butonları ekle ───────────────────────────────
src = src.replace(
  `                  <div key={idx} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800">
                    <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{f.name}</span>
                    <button type="button" onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>`,
  `                  <div key={idx} className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2 py-1.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800">
                    <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 max-w-[100px] truncate">{f.name}</span>
                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, 'analiz')} className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[9px] font-semibold hover:bg-sky-200 dark:hover:bg-sky-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />Analiz Et
                    </button>
                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, 'detayli')} className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[9px] font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <Layers className="w-2.5 h-2.5" />Detaylı Analiz
                    </button>
                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, 'cimbiz')} className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-[9px] font-semibold hover:bg-rose-200 dark:hover:bg-rose-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />Cımbızla
                    </button>
                    <button type="button" onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-0.5 ml-auto">
                      <X className="w-3 h-3" />
                    </button>
                  </div>`
);

// ─── 13. Dava Dosyası Oluştur butonu (Send butonundan önce) ──────────────────
src = src.replace(
  `            {/* Send Button */}
            <button
              type="button"
              disabled={isConsulting}
              onClick={handleSendConsultation}`,
  `            {/* Dava Dosyası Oluştur */}
            <button type="button" disabled={isSavingCase||isConsulting} onClick={handleCreateCaseFile}
              className={\`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0 \${savedCaseSuccess ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white disabled:opacity-40'}\`}
              title="Dava dosyası oluştur, müvekkil kaydı yap, dilekçe taslağı üret ve arşivle">
              {isSavingCase
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : savedCaseSuccess
                  ? <><CheckCircle2 className="w-4 h-4" /><span className="hidden sm:inline">Kaydedildi!</span></>
                  : <><FolderPlus className="w-4 h-4" /><span className="hidden sm:inline whitespace-nowrap">Dava Dosyası Oluştur</span></>
              }
            </button>

            {/* Send Button */}
            <button
              type="button"
              disabled={isConsulting}
              onClick={handleSendConsultation}`
);

// ─── 14. Close sidebar flex row before main outer closing ─────────────────────
// Current closing: ...input bar </div> → </div>(conv) → </div>(outer)
// Need:            ...input bar </div> → </div>(conv) → </div>(right) → </div>(sidebar flex) → </div>(outer)
src = src.replace(
  /(\s*<\/div>\s*\{\/\* end sidebar flex row \*\/\})/,
  ''
); // Remove if already there

src = src.replace(
  /(\s*<\/div>\n\s*<\/div>\n\s*\);\n\})\s*$/,
  `\n        </div>{/* end right panel */}
      </div>{/* end sidebar+chat flex row */}
    </div>{/* end h-full flex col */}
  );
}`
);

writeFileSync(file, src, 'utf8');
console.log('✅ Patch v3 applied successfully');
