const fs = require('fs');
let code = fs.readFileSync('src/components/DavaDerinAnaliz.tsx', 'utf8');

const oldCopyFnStrRegex = /const handleCopyReport = \(\) => \{[\s\S]*?navigator\.clipboard\.writeText\(text\);\n    alert\('Dava derin analiz raporu kopyalandı!'\);\n  \};/;

const newCopyFn = `const handleCopyReport = () => {
    if (!analysisResult) return;
    const text = \`=== ULTRA HUKUK AI - DAVA DERİN ANALİZ RAPORU ===
Model: \${analysisResult.modelUsed} (\${analysisResult.modelMode === 'pro' ? 'Gemini 3.1 Pro Derin Muhakeme' : 'Gemini 3.8 Flash Hızlı Genel Bakış'})
Tarih: \${analysisResult.analyzedAt}

[BAŞ HUKUK MÜŞAVİRİ SENTEZİ]
Kazanma İhtimali: %\${analysisResult.basHukukMusaviriSentezi?.kazanmaIhtimali}
Özet: \${analysisResult.basHukukMusaviriSentezi?.davaOzetiVeTeshis}
Stratejik Yol Haritası: \${analysisResult.basHukukMusaviriSentezi?.stratejikYolHaritasiVurgusu}

[USUL VE SÜRE AJANI RAPORU]
Görevli Mahkeme: \${analysisResult.usulSuresiAjaniRaporu?.gorevliYetkiliMahkeme}
Arabuluculuk Şartı: \${analysisResult.usulSuresiAjaniRaporu?.arabuluculukDavaSarti}
Zamanaşımı: \${(analysisResult.usulSuresiAjaniRaporu?.zamanasimiVeHakDusurucuSureler || []).join(', ')}

[ŞEYTANIN AVUKATI RİSK ANALİZİ]
Karşı Taraf Savunması: \${analysisResult.seytaninAvukatiRaporu?.karsiTarafNeYapar}
Açıklar: \${(analysisResult.seytaninAvukatiRaporu?.dosyadakiZayifHalkalarVeAciklar || []).join(', ')}

[DİLEKÇE MİMARI ÖNERİSİ]
\${analysisResult.dilekceMimariRaporu?.uyapNeticeiTalepOnerisi}
\`;
    navigator.clipboard.writeText(text);
    alert('Dava derin analiz raporu kopyalandı!');
  };`;

code = code.replace(oldCopyFnStrRegex, newCopyFn);

const oldExportStrRegex = /const handleDownloadReport = \(\) => \{[\s\S]*?a\.click\(\);\n  \};/;
const newExportFn = `const handleDownloadReport = () => {
    if (!analysisResult) return;
    const text = \`=== ULTRA HUKUK AI - DAVA DERİN ANALİZ RAPORU ===
Model: \${analysisResult.modelUsed} (\${analysisResult.modelMode === 'pro' ? 'Gemini 3.1 Pro Derin Muhakeme' : 'Gemini 3.8 Flash Hızlı Genel Bakış'})
Tarih: \${analysisResult.analyzedAt}

[BAŞ HUKUK MÜŞAVİRİ SENTEZİ]
Kazanma İhtimali: %\${analysisResult.basHukukMusaviriSentezi?.kazanmaIhtimali}
Özet: \${analysisResult.basHukukMusaviriSentezi?.davaOzetiVeTeshis}
Stratejik Yol Haritası: \${analysisResult.basHukukMusaviriSentezi?.stratejikYolHaritasiVurgusu}

[USUL VE SÜRE AJANI RAPORU]
Görevli Mahkeme: \${analysisResult.usulSuresiAjaniRaporu?.gorevliYetkiliMahkeme}
Arabuluculuk Şartı: \${analysisResult.usulSuresiAjaniRaporu?.arabuluculukDavaSarti}

[YARGITAY EMSAL AJANI]
\${analysisResult.yargitayEmsalAjaniRaporu?.benzerVakialardaYargitayYaklasimi}

[ŞEYTANIN AVUKATI RİSK ANALİZİ]
\${analysisResult.seytaninAvukatiRaporu?.karsiTarafNeYapar}

[DİLEKÇE MİMARI ÖNERİSİ]
\${analysisResult.dilekceMimariRaporu?.uyapNeticeiTalepOnerisi}
\`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`Dava_Analiz_Raporu_\${new Date().getTime()}.txt\`;
    a.click();
  };`;

code = code.replace(oldExportStrRegex, newExportFn);

// Also replace the "onApplyToPetition" text logic inside the "Bottom Action Bar"
const bottomActionRegex = /const petitionText = \`=== DAVA DERİN ANALİZ NOTLARI \(\\\$\{analysisResult\.davaTuru\}\) ===\\nMahkeme: \\\$\{analysisResult\.gorevliYetkiliMahkeme\}\\nTeşhis: \\\$\{analysisResult\.hukukiTeshis\}\\nHMK 200 Kuralı: \\\$\{analysisResult\.delilVeEvrakDenetimi\.senetleIspatKuraliHMK200\}\\nStratejik Talep: \\\$\{analysisResult\.derinHukukiMuhakeme\.stratejikEylemPlani\.join\('; '\)\}\`;/;
const newBottomAction = "const petitionText = `=== DAVA DERİN ANALİZ NOTLARI ===\\nMahkeme: ${analysisResult.usulSuresiAjaniRaporu?.gorevliYetkiliMahkeme}\\nTeşhis: ${analysisResult.basHukukMusaviriSentezi?.davaOzetiVeTeshis}\\nZamanaşımı: ${(analysisResult.usulSuresiAjaniRaporu?.zamanasimiVeHakDusurucuSureler || []).join(', ')}\\nTalep: ${analysisResult.dilekceMimariRaporu?.uyapNeticeiTalepOnerisi}`;";

code = code.replace(bottomActionRegex, newBottomAction);

// Also there is a part where analysisHistory maps and tries to print analysisResult.davaTuru
const historyRegex1 = /<h3 className="text-base font-bold text-slate-100">\{item\.davaTuru\}<\/h3>/g;
const historyRegex2 = /<span>\{item\.gorevliYetkiliMahkeme\}<\/span>/g;
const historyRegex3 = /%\{item\.kazanmaIhtimali\}/g;

code = code.replace(historyRegex1, '<h3 className="text-base font-bold text-slate-100">{(item.basHukukMusaviriSentezi?.davaOzetiVeTeshis || "").slice(0, 50)}...</h3>');
code = code.replace(historyRegex2, '<span>{item.usulSuresiAjaniRaporu?.gorevliYetkiliMahkeme}</span>');
code = code.replace(historyRegex3, '%{item.basHukukMusaviriSentezi?.kazanmaIhtimali}');

fs.writeFileSync('src/components/DavaDerinAnaliz.tsx', code, 'utf8');
console.log('Done fixing JS runtime errors.');
