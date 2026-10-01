const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
// 9c. Stratejik Dilekçe Motoru (Cımbız Ajanı Sonuçlarından)
app.post('/api/ai/strategic-petition', async (req, res) => {
  const { analysisData, lawyerSicilNo, lawyerName } = req.body;
  const sicil = lawyerSicilNo || '8109';
  const lawyer = lawyerName || 'Av. Ultra Hukuk';

  if (genAI && GEMINI_API_KEY) {
    try {
      const prompt = \`\${STRICT_LEGAL_GROUNDING_PROMPT}

SİSTEM TALİMATI:
Sen Türk Mahkemelerine sunulmak üzere resmi UYAP formatında DİLEKÇE hazırlayan Baş Hukuk Müşaviri ve Dilekçe Mimarı ajanı kombinasyonusun.
Kullanıcı sana 'Cımbız Ajanı'nın analiz sonuçlarını gönderdi. Görevin, bu stratejik analiz verilerini kullanarak MÜKEMMEL, EKSİKSİZ, USUL VE ESAS YÖNÜNDEN kusursuz bir dilekçe kaleme almaktır.

Dilekçe Hiyerarşisi (Aynen Uyulacak Şablon):
1. Mahkeme Adı, Dosya No, Taraflar, Konu, Duruşma Günü
2. YÖNETİCİ ÖZETİ (Davanın seyrini değiştiren en kritik noktanın net ve vurucu özeti)
3. BEYAN VE ESASA İLİŞKİN İTİRAZLARIMIZ (Cımbız ajanı verilerine dayanan stratejik başlıklar halinde)
4. USUL HUKUKUNA İLİŞKİN İTİRAZLARIN BERTARAFI (Eksikliklerin kapatılması ve usuli kalkan)
5. HUKUKİ SEBEPLER ve HUKUKİ DELİLLER
6. NETİCE-İ TALEP (Aynen tescil/iptal ve terditli bedel talepleri net olarak)
7. DİPNOTLAR (Akademik, Yüksek Yargı İçtihat linkleri ve ajan/yapay zeka stratejik içgörülerinin dipnot olarak yansıtılması)

EK BİLGİ VE ANALİZ VERİSİ:
\${JSON.stringify(analysisData)}

Lütfen tüm bu verileri kullanarak, eksikleri yapay zeka ajanlarından alınan stratejilerle (Örn: Usul ajanı şunları der... Şeytanın avukatı şunları tamamlar...) tamamlayarak ŞAŞIRTICI DERECEDE İYİ, hukuki dili mükemmel, ikna edici bir dava/cevap/beyan dilekçesi metni oluştur. (Ajanların stratejik hamlelerini dilekçeye ustaca yedir).\`;

      const { text, modelUsed } = await callRoutedGemini('petition_draft', prompt, sicil);
      return res.json({ success: true, modelUsed, petitionText: text });
    } catch (err) {
      console.error('Strategic petition error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  return res.json({ success: false, error: 'AI disabled' });
});
`;

if (!content.includes('/api/ai/strategic-petition')) {
  content = content.replace('// 10. Document OCR & PDF Vision', newEndpoint + '\n\n// 10. Document OCR & PDF Vision');
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log('Done.');
} else {
  console.log('Endpoint already exists.');
}
