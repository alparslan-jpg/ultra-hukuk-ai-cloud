import fs from 'fs';

// ── 1. Fix src/components/AjanKonseyiOdasi.tsx ──────────────────────────────
const ajanFile = 'src/components/AjanKonseyiOdasi.tsx';
let ajanRaw = fs.readFileSync(ajanFile, 'utf8');
let lines = ajanRaw.split(/\r?\n/);

// Add sanitizeFilesForPayload helper before handleFileUpload
const uploadIdx = lines.findIndex(l => l.includes('const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {'));
if (uploadIdx !== -1) {
  const sanitizeHelper = [
    '  // Sınırlandırılmış, optimize edilmiş evrak verisi (413 Payload Too Large engelleme)',
    '  const sanitizeFilesForPayload = (files: Array<{ name: string; content?: string; type?: string }>) => {',
    '    return (files || []).slice(0, 10).map((f) => ({',
    '      name: f.name || \'Belge\',',
    '      type: f.type || \'Evrak\',',
    '      content: typeof f.content === \'string\' ? f.content.slice(0, 8000) : \'\'',
    '    }));',
    '  };',
    ''
  ];
  lines.splice(uploadIdx, 0, ...sanitizeHelper);
  console.log('✅ Added sanitizeFilesForPayload helper before handleFileUpload');
}

// Update handleFileUpload to truncate previewContent
const readerOnloadIdx = lines.findIndex(l => l.includes('const content = event.target?.result as string;'));
if (readerOnloadIdx !== -1) {
  const newOnload = [
    '        const raw = (event.target?.result as string) || \'\';',
    '        const content = raw.length > 30000 ? raw.slice(0, 30000) + \'\\n... (önizleme kısaltıldı)\' : raw;'
  ];
  lines.splice(readerOnloadIdx, 1, ...newOnload);
  console.log('✅ Updated handleFileUpload with safe content truncation');
}

// Replace contextFiles: attachedFiles with contextFiles: sanitizeFilesForPayload(attachedFiles)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('contextFiles: attachedFiles')) {
    lines[i] = lines[i].replace('contextFiles: attachedFiles', 'contextFiles: sanitizeFilesForPayload(attachedFiles)');
    console.log('✅ Updated contextFiles: attachedFiles at line', i + 1);
  }
  if (lines[i].includes('contextFiles: [f]')) {
    lines[i] = lines[i].replace('contextFiles: [f]', 'contextFiles: sanitizeFilesForPayload([f])');
    console.log('✅ Updated contextFiles: [f] at line', i + 1);
  }
}

// Clean up duplicate check blocks in handleFileAction and handleCreateCaseFile
// Find handleFileAction start and handleCreateCaseFile start
const fileActionIdx = lines.findIndex(l => l.includes('const handleFileAction = async'));
const createCaseIdx = lines.findIndex(l => l.includes('const handleCreateCaseFile = async'));

if (fileActionIdx !== -1 && createCaseIdx !== -1) {
  // Let's replace the entire handleFileAction and handleCreateCaseFile functions with clean, robust versions
  const returnIdx = lines.findIndex((l, idx) => idx > createCaseIdx && l.trim() === 'return (');
  if (returnIdx !== -1) {
    const cleanFunctions = [
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
      '        body: JSON.stringify({ query: prompts[action], contextFiles: sanitizeFilesForPayload([f]), activeCaseContext: selectedCaseNote, orchestratorModel, inputMode: \'text\' })',
      '      });',
      '      if (!r.ok) {',
      '        const errText = await r.text();',
      '        let errMsg = `Sunucu hatası (${r.status})`;',
      '        try { const errJson = JSON.parse(errText); if (errJson.message) errMsg = errJson.message; } catch {}',
      '        throw new Error(errMsg);',
      '      }',
      '      const cTypeF = r.headers.get(\'content-type\') || \'\';',
      '      if (!cTypeF.includes(\'application/json\')) {',
      '        throw new Error(\'Sunucu yanıtı alınamadı (Ağ/Proxy zaman aşımı). Lütfen tekrar deneyin.\');',
      '      }',
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
      '    const history = consultationHistory.map(m => `[${m.sender === \'lawyer\' ? \'Avukat\' : \'Müşavir\'}] ${m.text}`).slice(-6).join(\'\\n\\n\');',
      '    const fileNames = attachedFiles.map(f2 => f2.name).join(\', \');',
      '    try {',
      '      const r = await fetch(\'/api/ai/agent-council-consultation\', {',
      '        method: \'POST\',',
      '        headers: { \'Content-Type\': \'application/json\' },',
      '        body: JSON.stringify({',
      '          query: `DAVA DOSYASI OLUŞTUR:\\n1. Müvekkil kaydı bilgilerini özetle\\n2. Dava dosyası özeti (mahkeme, taraflar, konu, talep, deliller)\\n3. Kapsamlı dilekçe taslağı (kanun maddeleriyle)\\n4. Önerilen dava stratejisi\\n\\nDanışma geçmişi:\\n${history}\\n\\nEvraklar: ${fileNames || \'Yok\'}\\nBağlam: ${selectedCaseNote || \'Belirtilmemiş\'}\\nLehine: ${lehineText || \'Belirtilmemiş\'}`,',
      '          contextFiles: sanitizeFilesForPayload(attachedFiles),',
      '          activeCaseContext: selectedCaseNote,',
      '          lehine: lehineText,',
      '          orchestratorModel: \'flash\',',
      '          inputMode: \'text\'',
      '        })',
      '      });',
      '      if (!r.ok) {',
      '        const errText = await r.text();',
      '        let errMsg = `Sunucu hatası (${r.status})`;',
      '        try { const errJson = JSON.parse(errText); if (errJson.message) errMsg = errJson.message; } catch {}',
      '        throw new Error(errMsg);',
      '      }',
      '      const cTypeC = r.headers.get(\'content-type\') || \'\';',
      '      if (!cTypeC.includes(\'application/json\')) {',
      '        throw new Error(\'Dava dosyası oluşturulurken zaman aşımı oluştu. Lütfen tekrar deneyin.\');',
      '      }',
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
    lines.splice(fileActionIdx, (returnIdx - fileActionIdx), ...cleanFunctions);
    console.log('✅ Replaced handleFileAction and handleCreateCaseFile with clean robust versions');
  }
}

fs.writeFileSync(ajanFile, lines.join('\r\n'), 'utf8');

// ── 2. Fix src/components/MuvekkilYonetimi.tsx ─────────────────────────────
const muvFile = 'src/components/MuvekkilYonetimi.tsx';
let muvRaw = fs.readFileSync(muvFile, 'utf8');
let muvLines = muvRaw.split(/\r?\n/);

const muvOnloadIdx = muvLines.findIndex(l => l.includes('const icerik = ev.target?.result as string;'));
if (muvOnloadIdx !== -1) {
  const safeMuvOnload = [
    '        const rawIcerik = (ev.target?.result as string) || \'\';',
    '        const icerik = rawIcerik.length > 30000 ? rawIcerik.slice(0, 30000) + \'\\n... (içerik kısaltıldı)\' : rawIcerik;'
  ];
  muvLines.splice(muvOnloadIdx, 1, ...safeMuvOnload);
  console.log('✅ Updated MuvekkilYonetimi evrakYukle with safe content truncation');
  fs.writeFileSync(muvFile, muvLines.join('\r\n'), 'utf8');
}

console.log('✅ 413 Payload fixes applied successfully!');
