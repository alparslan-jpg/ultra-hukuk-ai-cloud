import fs from 'fs';

// ── 1. Fix server.ts ────────────────────────────────────────────────────────
const serverFile = 'server.ts';
let serverRaw = fs.readFileSync(serverFile, 'utf8');
let serverLines = serverRaw.split(/\r?\n/);

const councilGenStart = serverLines.findIndex(l => l.includes('const chosenModel = orchestratorModel === \'pro\' ? \'gemini-3.1-pro-preview\' : \'gemini-3.8-flash\';'));
if (councilGenStart !== -1) {
  // Find where try { const response = await genAI.models.generateContent({ is
  const tryStart = serverLines.findIndex((l, idx) => idx > councilGenStart && l.trim() === 'try {' && serverLines[idx + 1].includes('const response = await genAI.models.generateContent'));
  if (tryStart !== -1) {
    const catchEnd = serverLines.findIndex((l, idx) => idx > tryStart && l.trim() === 'let parsed: any = null;');
    if (catchEnd !== -1) {
      const newGenerationCode = [
        '      try {',
        '        const timeoutMs = chosenModel === \'gemini-3.1-pro-preview\' ? 25000 : 20000;',
        '        let timer: any;',
        '        const timeoutPromise = new Promise<never>((_, reject) => {',
        '          timer = setTimeout(() => reject(new Error(`${chosenModel} zaman aşımına uğradı (${timeoutMs}ms)`)), timeoutMs);',
        '        });',
        '',
        '        const response = await Promise.race([',
        '          genAI.models.generateContent({',
        '            model: chosenModel;',
        '            contents: fullPrompt;',
        '          }),',
        '          timeoutPromise',
        '        ]).finally(() => clearTimeout(timer));',
        '',
        '        rawText = response.text || \'\';',
        '        logAiUsage(sicil, fullPrompt.length, rawText.length);',
        '      } catch (geminiErr: any) {',
        '        console.warn(`[Agent Council] ${chosenModel} hatası / zaman aşımı, flash modeline dönülüyor:`, geminiErr?.message);',
        '        if (chosenModel !== \'gemini-3.8-flash\') {',
        '          usedModel = \'gemini-3.8-flash\';',
        '          try {',
        '            let timerFb: any;',
        '            const fbTimeoutPromise = new Promise<never>((_, reject) => {',
        '              timerFb = setTimeout(() => reject(new Error(\'Flash fallback zaman aşımına uğradı (15000ms)\')), 15000);',
        '            });',
        '            const fallbackRes = await Promise.race([',
        '              genAI.models.generateContent({',
        '                model: \'gemini-3.8-flash\',',
        '                contents: fullPrompt,',
        '              }),',
        '              fbTimeoutPromise',
        '            ]).finally(() => clearTimeout(timerFb));',
        '',
        '            rawText = fallbackRes.text || \'\';',
        '            logAiUsage(sicil, fullPrompt.length, rawText.length);',
        '          } catch (fbErr: any) {',
        '            console.warn(\'[Agent Council] Flash fallback de başarısız oldu:\', fbErr?.message);',
        '          }',
        '        }',
        '      }'
      ];
      // Note fix syntax: object properties use comma not semicolon
      const safeGenCode = newGenerationCode.map(l => l.replace('model: chosenModel;', 'model: chosenModel,').replace('contents: fullPrompt;', 'contents: fullPrompt,'));
      serverLines.splice(tryStart, (catchEnd - tryStart), ...safeGenCode);
      console.log('✅ server.ts timeout & fallback protection applied!');
      fs.writeFileSync(serverFile, serverLines.join('\r\n'), 'utf8');
    }
  }
}

// ── 2. Fix AjanKonseyiOdasi.tsx ─────────────────────────────────────────────
const clientFile = 'src/components/AjanKonseyiOdasi.tsx';
let clientRaw = fs.readFileSync(clientFile, 'utf8');
let clientLines = clientRaw.split(/\r?\n/);

// Default model to flash for instant responsiveness
const modelStateIdx = clientLines.findIndex(l => l.includes('const [orchestratorModel, setOrchestratorModel] = useState<\'pro\' | \'flash\'>(\'pro\');'));
if (modelStateIdx !== -1) {
  clientLines[modelStateIdx] = clientLines[modelStateIdx].replace('(\'pro\');', '(\'flash\');');
  console.log('✅ Default orchestratorModel set to flash');
}

// Update handleSendConsultation response parsing
const respIdx = clientLines.findIndex(l => l.includes('const data = await response.json();'));
if (respIdx !== -1) {
  const safeParseCode = [
    '      if (!response.ok) {',
    '        const errText = await response.text();',
    '        let errMsg = `Sunucu hatası (${response.status})`;',
    '        try { const errJson = JSON.parse(errText); if (errJson.message) errMsg = errJson.message; } catch {}',
    '        throw new Error(errMsg);',
    '      }',
    '      const cType = response.headers.get(\'content-type\') || \'\';',
    '      if (!cType.includes(\'application/json\')) {',
    '        throw new Error(\'Sunucu yanıtı alınamadı (Ağ/Proxy zaman aşımı). Lütfen Hızlı modu seçip tekrar deneyin.\');',
    '      }',
    '      const data = await response.json();'
  ];
  clientLines.splice(respIdx, 1, ...safeParseCode);
  console.log('✅ handleSendConsultation safe response parsing added');
}

// Update handleFileAction response parsing
const dIdx = clientLines.findIndex(l => l.includes('const d = await r.json();'));
if (dIdx !== -1) {
  const safeFileParseCode = [
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
    '      const d = await r.json();'
  ];
  clientLines.splice(dIdx, 1, ...safeFileParseCode);
  console.log('✅ handleFileAction safe response parsing added');
}

// Update handleCreateCaseFile response parsing
const dIdx2 = clientLines.findIndex((l, idx) => idx > (dIdx + 5) && l.includes('const d = await r.json();'));
if (dIdx2 !== -1) {
  const safeCaseParseCode = [
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
    '      const d = await r.json();'
  ];
  clientLines.splice(dIdx2, 1, ...safeCaseParseCode);
  console.log('✅ handleCreateCaseFile safe response parsing added');
}

fs.writeFileSync(clientFile, clientLines.join('\r\n'), 'utf8');
console.log('✅ All server and client fixes applied successfully!');
