import fs from 'fs';

const filePath = 'src/components/AjanKonseyiOdasi.tsx';
let raw = fs.readFileSync(filePath, 'utf8');

// Normalise line endings to \n for processing
let lines = raw.split(/\r?\n/);
console.log('Original lines count:', lines.length);

// 1. Add Users to imports if not already imported
const hasUsers = lines.some(l => l.includes('Users') && l.includes('from') === false);
if (!hasUsers) {
  const chevronIdx = lines.findIndex(l => l.includes('ChevronRight'));
  if (chevronIdx !== -1) {
    lines.splice(chevronIdx + 1, 0, '  Users,');
    console.log('Added Users icon to imports at line', chevronIdx + 1);
  }
}

// 2. Add handleFileAction and handleCreateCaseFile before `return (`
const hasHandleFileAction = lines.some(l => l.includes('handleFileAction'));
if (!hasHandleFileAction) {
  const returnIdx = lines.findIndex(l => l.trim() === 'return (');
  if (returnIdx !== -1) {
    const helperCode = [
      '',
      '  // ── Evrak analiz ──────────────────────────────────────────────────────────',
      '  const handleFileAction = async (idx: number, action: \'analiz\' | \'detayli\' | \'cimbiz\') => {',
      '    const f = attachedFiles[idx];',
      '    if (!f) return;',
      '    const labels = { analiz: \'Analiz Et\', detayli: \'Detaylı Analiz\', cimbiz: \'Cımbızla (TCK 272)\' };',
      '    const prompts = {',
      '      analiz:   `Evrakı analiz et ve özet çıkar:\\n\\n${f.name}\\n${(f.content || \'\').substring(0, 2000)}`,',
      '      detayli:  `Evrakı detaylı hukuki analiz et (delil değeri, hukuki nitelendirme, usul geçerliliği):\\n\\n${f.name}\\n${(f.content || \'\').substring(0, 3000)}`,',
      '      cimbiz:   `Cımbızlama yap: çelişki, zayıf nokta, sahte bilgi, karşı taraf avantajı tespit et:\\n\\nTCK 272 / Cımbız modu aktif\\n\\n${f.name}\\n${(f.content || \'\').substring(0, 3000)}`',
      '    };',
      '    const userMsg: MessageItem = { id: `fa-${Date.now()}`, sender: \'lawyer\', text: `📎 ${labels[action]}: ${f.name}`, timestamp: new Date().toLocaleTimeString(\'tr-TR\', { hour: \'2-digit\', minute: \'2-digit\' }) };',
      '    setConsultationHistory(p => [...p, userMsg]);',
      '    setIsConsulting(true);',
      '    try {',
      '      const r = await fetch(\'/api/ai/agent-council-consultation\', {',
      '        method: \'POST\',',
      '        headers: { \'Content-Type\': \'application/json\' },',
      '        body: JSON.stringify({ query: prompts[action], contextFiles: [f], activeCaseContext: selectedCaseNote, orchestratorModel, inputMode: \'text\' })',
      '      });',
      '      const d = await r.json();',
      '      if (d.success) {',
      '        setConsultationHistory(p => [...p, { id: `cns-${Date.now()}`, sender: \'council\', text: d.answerToUserQuestion || d.orchestratorSummary || \'Analiz tamamlandı.\', timestamp: d.timestamp || new Date().toLocaleTimeString(\'tr-TR\', { hour: \'2-digit\', minute: \'2-digit\' }), consultationData: d.mode !== \'chat\' ? d : undefined }]);',
      '      }',
      '    } catch (e: any) { alert(\'Hata: \' + e.message); }',
      '    finally { setIsConsulting(false); }',
      '  };',
      '',
      '  // ── Dava dosyası oluştur & arşivle ────────────────────────────────────────',
      '  const handleCreateCaseFile = async () => {',
      '    const hasContent = inputText.trim() || attachedFiles.length > 0 || selectedCaseNote || consultationHistory.length > 1;',
      '    if (!hasContent) { alert(\'Dava dosyası oluşturmak için önce dava bilgisi girin, evrak yükleyin veya danışma yapın.\'); return; }',
      '    setIsSavingCase(true);',
      '    const history = consultationHistory.map(m => `[${m.sender === \'lawyer\' ? \'Avukat\' : \'Müşavir\'}] ${m.text}`).join(\'\\n\\n\');',
      '    const fileNames = attachedFiles.map(f2 => f2.name).join(\', \');',
      '    try {',
      '      const r = await fetch(\'/api/ai/agent-council-consultation\', {',
      '        method: \'POST\',',
      '        headers: { \'Content-Type\': \'application/json\' },',
      '        body: JSON.stringify({',
      '          query: `DAVA DOSYASI OLUŞTUR:\\n1. Müvekkil kaydı bilgilerini özetle\\n2. Dava dosyası özeti (mahkeme, taraflar, konu, talep, deliller)\\n3. Kapsamlı dilekçe taslağı (kanun maddeleriyle)\\n4. Önerilen dava stratejisi\\n\\nDanışma geçmişi:\\n${history}\\n\\nEvraklar: ${fileNames || \'Yok\'}\\nBağlam: ${selectedCaseNote || \'Belirtilmemiş\'}\\nLehine: ${lehineText || \'Belirtilmemiş\'}`,',
      '          contextFiles: attachedFiles,',
      '          activeCaseContext: selectedCaseNote,',
      '          lehine: lehineText,',
      '          orchestratorModel,',
      '          inputMode: \'text\'',
      '        })',
      '      });',
      '      const d = await r.json();',
      '      const summary = d.answerToUserQuestion || d.orchestratorSummary || \'Dava dosyası oluşturuldu.\';',
      '      const newCase = { id: `case-${Date.now()}`, date: new Date().toISOString(), lawyerName: lawyerName || \'\', lawyerSicilNo: lawyerSicilNo || \'\', caseContext: selectedCaseNote || \'Dava Dosyası\', lehine: lehineText, files: attachedFiles.map(f2 => f2.name), summary, consultationCount: consultationHistory.length };',
      '      const updated = [newCase, ...archivedCases].slice(0, 50);',
      '      setArchivedCases(updated);',
      '      localStorage.setItem(\'ultra_archived_cases\', JSON.stringify(updated));',
      '      setConsultationHistory(p => [...p, { id: `arch-${Date.now()}`, sender: \'council\', text: `✅ DAVA DOSYASI OLUŞTURULDU VE ARŞİVLENDİ\\n\\n${summary}`, timestamp: new Date().toLocaleTimeString(\'tr-TR\', { hour: \'2-digit\', minute: \'2-digit\' }) }]);',
      '      setSavedCaseSuccess(true);',
      '      setTimeout(() => setSavedCaseSuccess(false), 4000);',
      '    } catch (e: any) { alert(\'Hata: \' + e.message); }',
      '    finally { setIsSavingCase(false); }',
      '  };',
      ''
    ];
    lines.splice(returnIdx, 0, ...helperCode);
    console.log('Added helper functions at line', returnIdx);
  }
}

// 3. Add 1st item in Sidebar: "1. Müvekkil & Dava Dosyaları"
const hasMuvSidebar = lines.some(l => l.includes('Müvekkil & Dava Dosyaları'));
if (!hasMuvSidebar) {
  const pyIdx = lines.findIndex(l => l.includes('className="flex-1 overflow-y-auto py-1"'));
  if (pyIdx !== -1) {
    const muvBtn = [
      '            {/* 1. SIRADA: Müvekkil & Dava Dosyaları */}',
      '            <button',
      '              type="button"',
      '              title="Müvekkil & Dava Dosyaları"',
      '              onClick={() => {',
      '                setShowMuvekkilPanel(p => !p);',
      '                setActiveModule(\'muvekkil\');',
      '              }}',
      '              className={`w-full flex items-center gap-2 px-2.5 py-2 transition text-left border-b border-slate-200 dark:border-slate-800 ${',
      '                showMuvekkilPanel',
      '                  ? \'bg-indigo-600 text-white shadow-sm\'',
      '                  : \'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60\'',
      '              }`}',
      '            >',
      '              <Users className={`w-4 h-4 shrink-0 ${showMuvekkilPanel ? \'text-white\' : \'text-indigo-600 dark:text-indigo-400\'}`} />',
      '              {sidebarOpen && (',
      '                <span className="min-w-0 flex-1">',
      '                  <span className={`block text-[11px] font-bold truncate leading-tight ${showMuvekkilPanel ? \'text-white\' : \'text-slate-900 dark:text-slate-100\'}`}>',
      '                    1. Müvekkil & Dava Dosyaları',
      '                  </span>',
      '                  <span className={`block text-[9px] truncate ${showMuvekkilPanel ? \'text-indigo-100\' : \'text-indigo-600 dark:text-indigo-400 font-medium\'}`}>',
      '                    Müvekkil, Dava & Evraklar',
      '                  </span>',
      '                </span>',
      '              )}',
      '              {showMuvekkilPanel && sidebarOpen && (',
      '                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />',
      '              )}',
      '            </button>'
    ];
    lines.splice(pyIdx + 1, 0, ...muvBtn);
    console.log('Added 1st sidebar item (Müvekkil & Dava Dosyaları) at line', pyIdx + 1);
  }
}

// 4. In Right Panel: wrap main conversation in showMuvekkilPanel condition
const hasMuvPanelRender = lines.some(l => l.includes('<MuvekkilYonetimi'));
if (!hasMuvPanelRender) {
  const rightPanelCommentIdx = lines.findIndex(l => l.includes('{/* RIGHT: Chat Panel */}'));
  if (rightPanelCommentIdx !== -1) {
    // Find the opening div for main conversation:
    // lines[rightPanelCommentIdx + 1] is: <div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>
    // lines[rightPanelCommentIdx + 3] is: <div className="flex-1 bg-white dark:bg-[#0e1524] flex flex-col overflow-hidden" style={{minHeight: 0}}>
    const convOpenIdx = lines.findIndex((l, idx) => idx > rightPanelCommentIdx && l.includes('className="flex-1 bg-white dark:bg-[#0e1524]'));
    if (convOpenIdx !== -1) {
      const muvPanelConditional = [
        '        {showMuvekkilPanel ? (',
        '          <MuvekkilYonetimi',
        '            onCaseSelected={(ctx) => {',
        '              setSelectedCaseNote(`Müvekkil: ${ctx.clientName} | Dava: ${ctx.caseNumber} - ${ctx.subject}`);',
        '              setAttachedFiles(ctx.files.map(f => ({ name: f.name, content: f.content || \'\', type: f.type || \'Hukuki Belge\' })));',
        '              setShowMuvekkilPanel(false);',
        '              setActiveModule(\'musavir\');',
        '            }}',
        '          />',
        '        ) : ('
      ];
      lines.splice(convOpenIdx, 0, ...muvPanelConditional);
      console.log('Added MuvekkilYonetimi panel condition at line', convOpenIdx);

      // Now find where main conv ends, right before: </div>{/* end right panel */}
      const endRightIdx = lines.findIndex(l => l.includes('{/* end right panel */}'));
      if (endRightIdx !== -1) {
        // Close the ternary: )}
        lines.splice(endRightIdx, 0, '        )}');
        console.log('Closed MuvekkilYonetimi panel condition at line', endRightIdx);
      }
    }
  }
}

// 5. Attached files buttons (Analiz Et, Detaylı Analiz, Cımbızla)
const fileItemIdx = lines.findIndex(l => l.includes('key={idx}') && l.includes('attachedFiles.map'));
// Check if already updated
const hasAnalizEtBtn = lines.some(l => l.includes('handleFileAction(idx, \'analiz\')'));
if (!hasAnalizEtBtn && fileItemIdx !== -1) {
  // Replace the attached file item rendering
  const removeBtnIdx = lines.findIndex((l, idx) => idx > fileItemIdx && l.includes('removeAttachedFile(idx)'));
  if (removeBtnIdx !== -1) {
    const itemCloseIdx = lines.findIndex((l, idx) => idx > removeBtnIdx && l.includes('</div>'));
    if (itemCloseIdx !== -1) {
      const newFileItem = [
        '                  <div key={idx} className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-1.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800">',
        '                    <FileText className="w-3 h-3 text-sky-500 shrink-0" />',
        '                    <span className="text-slate-700 dark:text-slate-300 max-w-[110px] truncate font-medium">{f.name}</span>',
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
        '                    <button type="button" onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-0.5 ml-auto">',
        '                      <X className="w-3 h-3" />',
        '                    </button>',
        '                  </div>'
      ];
      lines.splice(fileItemIdx, (itemCloseIdx - fileItemIdx + 1), ...newFileItem);
      console.log('Updated attached file item with action buttons');
    }
  }
}

// 6. Add "Dava Dosyası Oluştur" button before Send button
const hasCreateCaseBtn = lines.some(l => l.includes('handleCreateCaseFile'));
if (!hasCreateCaseBtn) {
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
    console.log('Added Dava Dosyası Oluştur button at line', sendBtnIdx);
  }
}

fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
console.log('✅ All features injected successfully! Total lines:', lines.length);
