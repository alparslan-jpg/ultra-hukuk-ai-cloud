import { readFileSync, writeFileSync } from 'fs';

let src = readFileSync('./src/components/AjanKonseyiOdasi.tsx', 'utf8');

// ─── 1. Yeni import'lar ekle ──────────────────────────────────────────────────
src = src.replace(
  `import React, { useState, useRef, useEffect } from 'react';`,
  `import React, { useState, useRef, useEffect, useCallback } from 'react';`
);

// Yeni ikonlar ekle
src = src.replace(
  `  X\n} from 'lucide-react';`,
  `  X,\n  Archive,\n  FolderPlus,\n  Crosshair,\n  Activity,\n  BarChart3,\n  FlaskConical,\n  Swords,\n  Timer,\n  CalendarDays,\n  ClipboardCheck,\n  UserRoundCheck,\n  Mic2,\n  FileSignature,\n  BookMarked,\n  ScanText,\n  BookOpen,\n  GitCompare,\n  Search,\n  BookA,\n  ChevronLeft,\n  ChevronRight,\n  Save,\n  Zap,\n  Eye,\n  ScanSearch,\n  Scissors\n} from 'lucide-react';`
);

// ─── 2. Interface'e navigasyon callback ekle ──────────────────────────────────
src = src.replace(
  `  onApplyToPetition?: (text: string) => void;\n  onSyncGit?: () => void;\n}`,
  `  onApplyToPetition?: (text: string) => void;\n  onSyncGit?: () => void;\n  onNavigateTo?: (page: string) => void;\n}`
);

// ─── 3. Destructuring'e onNavigateTo ekle ────────────────────────────────────
src = src.replace(
  `  onApplyToPetition,\n  onSyncGit\n}: AjanKonseyiOdasiProps)`,
  `  onApplyToPetition,\n  onSyncGit,\n  onNavigateTo\n}: AjanKonseyiOdasiProps)`
);

// ─── 4. Yeni state'ler ekle (orchestratorModel'den sonra) ────────────────────
src = src.replace(
  `  const [orchestratorModel, setOrchestratorModel] = useState<'pro' | 'flash'>('pro');`,
  `  const [orchestratorModel, setOrchestratorModel] = useState<'pro' | 'flash'>('pro');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<string>('musavir');
  const [archivedCases, setArchivedCases] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ultra_archived_cases') || '[]'); } catch { return []; }
  });
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [savedCaseSuccess, setSavedCaseSuccess] = useState(false);
  const [fileActions, setFileActions] = useState<Record<number, string | null>>({});`
);

// ─── 5. handleSendConsultation'dan sonra yeni fonksiyonlar ekle ──────────────
src = src.replace(
  `  return (\n    <div className="space-y-6">`,
  `  // Evrak analiz fonksiyonu
  const handleFileAction = async (idx: number, action: 'analiz' | 'detayli' | 'cimbiz') => {
    const file = attachedFiles[idx];
    if (!file) return;
    setFileActions(prev => ({ ...prev, [idx]: action }));
    const actionLabels = { analiz: 'Analiz Et', detayli: 'Detaylı Analiz', cimbiz: 'Cımbızla' };
    const actionPrompts = {
      analiz: \`Aşağıdaki evrakı analiz et ve kısa özet çıkar:\\n\\n\${file.name}\\n\${file.content?.substring(0, 2000) || ''}\`,
      detayli: \`Aşağıdaki evrakı çok detaylı hukuki analiz et (delil değeri, hukuki nitelendirme, usul açısından geçerlilik, içtihat uyumu):\\n\\n\${file.name}\\n\${file.content?.substring(0, 3000) || ''}\`,
      cimbiz: \`Bu evrakta cımbızlama yap: çelişkileri, zayıf noktaları, sahte olabilecek bilgileri, hukuka aykırı kısımları ve karşı taraf lehine kullanılabilecek unsurları tespit et:\\n\\nTCK 272 / Cımbız modu aktif\\n\\n\${file.name}\\n\${file.content?.substring(0, 3000) || ''}\`
    };
    const userMsg: MessageItem = {
      id: \`file-\${action}-\${Date.now()}\`,
      sender: 'lawyer',
      text: \`📎 \${actionLabels[action]}: \${file.name}\`,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setConsultationHistory(prev => [...prev, userMsg]);
    setIsConsulting(true);
    try {
      const res = await fetch('/api/ai/agent-council-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: actionPrompts[action],
          contextFiles: [file],
          activeCaseContext: selectedCaseNote,
          orchestratorModel,
          inputMode: 'text'
        })
      });
      const data = await res.json();
      if (data.success) {
        const reply: MessageItem = {
          id: \`cns-\${Date.now()}\`,
          sender: 'council',
          text: data.answerToUserQuestion || data.orchestratorSummary || 'Analiz tamamlandı.',
          timestamp: data.timestamp || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          consultationData: data.mode !== 'chat' ? data : undefined
        };
        setConsultationHistory(prev => [...prev, reply]);
      }
    } catch(e: any) { alert('Hata: ' + e.message); }
    finally {
      setIsConsulting(false);
      setFileActions(prev => ({ ...prev, [idx]: null }));
    }
  };

  // Dava dosyası oluştur & kaydet
  const handleCreateCaseFile = async () => {
    const hasContent = inputText.trim() || attachedFiles.length > 0 || selectedCaseNote || consultationHistory.length > 1;
    if (!hasContent) {
      alert('Dava dosyası oluşturmak için önce dava bilgilerini yazın, evrak yükleyin veya Baş Müşavir ile danışma yapın.');
      return;
    }
    setIsSavingCase(true);
    // Tüm danışma geçmişini özet için topla
    const allText = consultationHistory.map(m => \`[\${m.sender === 'lawyer' ? 'Avukat' : 'Müşavir'}] \${m.text}\`).join('\\n\\n');
    const fileNames = attachedFiles.map(f => f.name).join(', ');
    try {
      const res = await fetch('/api/ai/agent-council-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: \`DAVA DOSYASI OLUŞTUR: Aşağıdaki dava bilgileri ve danışma geçmişine dayanarak:\\n1. Müvekkil kaydı için gerekli bilgileri özetle\\n2. Dava dosyası özeti oluştur (mahkeme, taraflar, konu, talep, deliller)\\n3. Kapsamlı bir dilekçe taslağı oluştur (Türk hukuku formatında, kanun maddeleriyle)\\n4. Önerilen dava stratejisi\\n\\nDanışma geçmişi:\\n\${allText}\\n\\nYüklenen evraklar: \${fileNames || 'Yok'}\\nDava bağlamı: \${selectedCaseNote || 'Belirtilmemiş'}\\nLehine: \${lehineText || 'Belirtilmemiş'}\`,
          contextFiles: attachedFiles,
          activeCaseContext: selectedCaseNote,
          lehine: lehineText,
          orchestratorModel,
          inputMode: 'text'
        })
      });
      const data = await res.json();
      const summary = data.answerToUserQuestion || data.orchestratorSummary || 'Dava dosyası oluşturuldu.';
      // localStorage'a kaydet
      const newCase = {
        id: \`case-\${Date.now()}\`,
        date: new Date().toISOString(),
        lawyerName: lawyerName || 'Bilinmeyen Avukat',
        lawyerSicilNo: lawyerSicilNo || '',
        caseContext: selectedCaseNote || 'Dava Dosyası',
        lehine: lehineText,
        files: attachedFiles.map(f => f.name),
        summary,
        consultationCount: consultationHistory.length
      };
      const updated = [newCase, ...archivedCases].slice(0, 50);
      setArchivedCases(updated);
      localStorage.setItem('ultra_archived_cases', JSON.stringify(updated));
      // Chat'e ekle
      const archiveMsg: MessageItem = {
        id: \`archive-\${Date.now()}\`,
        sender: 'council',
        text: \`✅ **DAVA DOSYASI OLUŞTURULDU VE ARŞİVLENDİ**\\n\\n\${summary}\`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setConsultationHistory(prev => [...prev, archiveMsg]);
      setSavedCaseSuccess(true);
      setTimeout(() => setSavedCaseSuccess(false), 4000);
    } catch(e: any) { alert('Dava dosyası oluşturulurken hata: ' + e.message); }
    finally { setIsSavingCase(false); }
  };

  // Modül sidebar items
  const modules = [
    { id: 'arsiv',     icon: Archive,        label: 'Arşivlenen Davalar', sub: \`\${archivedCases.length} Arşiv\`,   color: 'text-amber-500',   page: null },
    { id: 'musavir',  icon: Brain,           label: 'Baş Müşavir & Ajan Konseyi', sub: 'Sesli + 4 Ajan',          color: 'text-indigo-500',  page: null },
    { id: 'git',      icon: RefreshCw,       label: 'Seçmeli Özellikler & Git', sub: 'GitHub Sync',              color: 'text-emerald-500', page: null },
    { id: 'cimbiz',   icon: Crosshair,       label: 'Adli Hakikat & Cımbız Ajanı', sub: 'TCK 272 / Cımbız',     color: 'text-rose-500',    page: 'forensic' },
    { id: 'apk',      icon: Zap,             label: 'Kişisel Mobil APK', sub: 'Sicil Mühürlü',                   color: 'text-teal-500',    page: 'apk_download' },
    { id: 'derin',    icon: Activity,        label: 'Dava Derin Analiz', sub: 'Flash & Pro',                     color: 'text-purple-500',  page: 'analyzer' },
    { id: 'analytics',icon: BarChart3,       label: 'Case Analytics', sub: 'D3.js',                              color: 'text-cyan-500',    page: 'workspace_full' },
    { id: 'lab',      icon: FlaskConical,    label: 'Dava Analiz Laboratuvarı', sub: '',                         color: 'text-green-500',   page: 'analyzer' },
    { id: 'brifing',  icon: FileText,        label: 'Stratejik Dava Brifingi', sub: '',                          color: 'text-blue-500',    page: null },
    { id: 'harp',     icon: Swords,          label: 'Harp Odası & Karşı Savunma', sub: '',                       color: 'text-red-500',     page: 'forensic' },
    { id: 'faiz',     icon: Timer,           label: 'Zamanaşımı & Faiz', sub: '',                                color: 'text-orange-500',  page: 'workspace_full' },
    { id: 'takvim',   icon: CalendarDays,    label: 'Dava Zaman Çizelgesi & Takvim', sub: '',                   color: 'text-sky-500',     page: 'workspace_full' },
    { id: 'usul',     icon: ClipboardCheck,  label: '35 Noktalı Usul Denetimi', sub: '',                        color: 'text-violet-500',  page: 'workspace_full' },
    { id: 'bilirkisi',icon: UserRoundCheck,  label: 'Bilirkişi İtiraz Lab (HMK 281)', sub: '',                  color: 'text-pink-500',    page: 'workspace_full' },
    { id: 'durusma',  icon: Gavel,           label: 'Duruşma Stratejisi', sub: '',                              color: 'text-amber-600',   page: 'workspace_full' },
    { id: 'sesli',    icon: Mic2,            label: 'Adli Sesli Dikte & Duruşma Zaptı', sub: '',               color: 'text-rose-400',    page: null },
    { id: 'dilekce',  icon: FileSignature,   label: 'UYAP Dilekçe Lab', sub: '',                               color: 'text-indigo-400',  page: 'petitions' },
    { id: 'emsal',    icon: BookMarked,      label: 'Emsal Karar', sub: '',                                     color: 'text-yellow-500',  page: 'workspace_full' },
    { id: 'ocr',      icon: ScanText,        label: 'Adli Belge / Evrak Okuma (OCR)', sub: '',                 color: 'text-emerald-400', page: 'analyzer' },
    { id: 'denetim',  icon: Eye,             label: 'Denetleme Paneli (Mevzuat & Atıf)', sub: '',              color: 'text-slate-400',   page: 'legislation' },
    { id: 'capraz',   icon: GitCompare,      label: 'Mevzuat Çapraz Doğrulama', sub: '',                       color: 'text-lime-500',    page: 'legislation' },
    { id: 'mevzuat',  icon: BookOpen,        label: 'Mevzuat Sorgulama', sub: '',                              color: 'text-blue-400',    page: 'legislation' },
    { id: 'sozluk',   icon: BookA,           label: 'Hukuk Terimleri Sözlüğü', sub: '',                       color: 'text-amber-400',   page: 'legislation' },
  ];

  return (\n    <div className="h-full flex flex-col overflow-hidden">`
);

// ─── 6. Eski outer div'i kaldır (space-y-6) ──────────────────────────────────
// Zaten yukarıda replace edildi — "return (\n    <div className="space-y-6">" → yeni

// ─── 7. Banner wrapper'a sol sidebar ekle ─────────────────────────────────────
// Banner'ı ve conversation alanını bir flex row içine al
src = src.replace(
  `      {/* Top Banner & Multi-Agent Matrix Bar */}\n      <div className="bg-white dark:bg-[#0e1524] border-b border-slate-200 dark:border-slate-800/80 px-5 py-4 shadow-sm relative overflow-hidden backdrop-blur-md shrink-0">`,
  `      {/* === MAIN BODY: Sidebar + Content === */}
      <div className="flex flex-1 overflow-hidden" style={{minHeight: 0}}>

        {/* LEFT MODULE SIDEBAR */}
        <div className={\`flex flex-col bg-white dark:bg-[#0a1020] border-r border-slate-200 dark:border-slate-800 transition-all duration-200 shrink-0 \${sidebarOpen ? 'w-52' : 'w-10'}\`}>
          {/* Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(p => !p)}
            className="flex items-center justify-center h-9 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0e1524] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            title={sidebarOpen ? 'Kenar çubuğunu kapat' : 'Kenar çubuğunu aç'}
          >
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {/* Module List */}
          <div className="flex-1 overflow-y-auto py-1">
            {modules.map(mod => (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModule(mod.id);
                  if (mod.page && onNavigateTo) onNavigateTo(mod.page);
                }}
                title={mod.label}
                className={\`w-full flex items-center gap-2.5 px-2 py-1.5 transition text-left group \${
                  activeModule === mod.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-r-2 border-indigo-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }\`}
              >
                <span className={\`shrink-0 \${mod.color}\`}>
                  <mod.icon className="w-3.5 h-3.5" />
                </span>
                {sidebarOpen && (
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="block text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">{mod.label}</span>
                    {mod.sub && <span className="block text-[9px] text-slate-400 dark:text-slate-500 truncate">{mod.sub}</span>}
                  </span>
                )}
                {mod.id === 'arsiv' && archivedCases.length > 0 && sidebarOpen && (
                  <span className="shrink-0 text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">{archivedCases.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Banner + Chat */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>

      {/* Top Banner & Multi-Agent Matrix Bar */}
      <div className="bg-white dark:bg-[#0e1524] border-b border-slate-200 dark:border-slate-800/80 px-5 py-4 shadow-sm relative overflow-hidden backdrop-blur-md shrink-0">`
);

// ─── 8. Model adlarından Gemini kaldır ───────────────────────────────────────
src = src.replace(
  `<span>Gemini 3.1 Pro (Derin Akıl)</span>`,
  `<span>Derin Akıl</span>`
);
src = src.replace(
  `<span>Gemini 3.8 Flash (Hızlı)</span>`,
  `<span>Hızlı</span>`
);

// ─── 9. Evrak listesine Analiz Et / Detaylı / Cımbızla butonları ekle ────────
src = src.replace(
  `                  <div key={idx} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800">
                    <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 max-w-[150px] truncate">{f.name}</span>
                    <button type="button" onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>`,
  `                  <div key={idx} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 flex-wrap">
                    <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{f.name}</span>
                    <button type="button" onClick={() => handleFileAction(idx, 'analiz')} disabled={!!fileActions[idx] || isConsulting} className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[9px] font-semibold hover:bg-sky-200 dark:hover:bg-sky-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />Analiz
                    </button>
                    <button type="button" onClick={() => handleFileAction(idx, 'detayli')} disabled={!!fileActions[idx] || isConsulting} className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <ScanSearch className="w-2.5 h-2.5" />Detaylı
                    </button>
                    <button type="button" onClick={() => handleFileAction(idx, 'cimbiz')} disabled={!!fileActions[idx] || isConsulting} className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[9px] font-semibold hover:bg-rose-200 dark:hover:bg-rose-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <Scissors className="w-2.5 h-2.5" />Cımbızla
                    </button>
                    <button type="button" onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-0.5 ml-auto">
                      <X className="w-3 h-3" />
                    </button>
                  </div>`
);

// ─── 10. Send butonunun yanına "Dava Dosyası Oluştur" ekle ───────────────────
src = src.replace(
  `            {/* Send Button */}
            <button
              type="button"
              disabled={isConsulting}
              onClick={handleSendConsultation}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center transition disabled:opacity-40 shadow-sm"
              title="Baş Hukuk Müşavirine ve Ajan Konseyine Gönder"
            >
              {isConsulting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>`,
  `            {/* Dava Dosyası Oluştur */}
            <button
              type="button"
              disabled={isSavingCase || isConsulting}
              onClick={handleCreateCaseFile}
              className={\`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm \${
                savedCaseSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white disabled:opacity-40'
              }\`}
              title="Dava dosyası oluştur, müvekkil kaydı yap ve dilekçe taslağı üret"
            >
              {isSavingCase ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : savedCaseSuccess ? (
                <><CheckCircle2 className="w-4 h-4" /><span className="hidden sm:inline">Kaydedildi!</span></>
              ) : (
                <><FolderPlus className="w-4 h-4" /><span className="hidden sm:inline">Dava Dosyası Oluştur</span></>
              )}
            </button>

            {/* Send Button */}
            <button
              type="button"
              disabled={isConsulting}
              onClick={handleSendConsultation}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center transition disabled:opacity-40 shadow-sm"
              title="Baş Hukuk Müşavirine ve Ajan Konseyine Gönder"
            >
              {isConsulting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>`
);

// ─── 11. Closing tags: 3 yeni kapanış ekle (sidebar right div + sidebar wrapper + outer) ──
src = src.replace(
  `      </div>\n    </div>\n  );\n}`,
  `      </div>
        </div>{/* end right panel */}
      </div>{/* end sidebar wrapper */}
    </div>{/* end h-full flex col */}
  );
}`
);

writeFileSync('./src/components/AjanKonseyiOdasi.tsx', src, 'utf8');
console.log('✅ AjanKonseyiOdasi.tsx patched successfully');
