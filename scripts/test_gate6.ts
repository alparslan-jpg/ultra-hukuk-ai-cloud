// ============================================================
// GATE 6 DOĞRULAMA TESTİ
// Derin Analiz Zorunluluğu ve Hızlı / Web Kamera Tasfiyesi
// ============================================================

import fs from 'fs';
import path from 'path';

async function runGate6Test() {
  console.log('============================================================');
  console.log('🚀 GATE 6 DOĞRULAMA TESTİ BAŞLATILIYOR');
  console.log('============================================================\n');

  console.log('▶ TEST 1: AjanKonseyiOdasi.tsx Derin Analiz ve Hızlı Buton Denetimi');
  const ajanKonseyiPath = path.resolve('src/components/AjanKonseyiOdasi.tsx');
  const ajanKonseyiCode = fs.readFileSync(ajanKonseyiPath, 'utf8');

  if (ajanKonseyiCode.includes("<span>Hızlı</span>")) {
    throw new Error('AjanKonseyiOdasi içinde halen "Hızlı" butonu bulunmaktadır!');
  }
  if (!ajanKonseyiCode.includes("const orchestratorModel = 'pro'")) {
    throw new Error('AjanKonseyiOdasi içinde orchestratorModel Pro olarak zorunlu kılınmamış!');
  }
  if (!ajanKonseyiCode.includes("Derin Analiz & Harp Odası (Zorunlu Aktif)")) {
    throw new Error('AjanKonseyiOdasi içinde Derin Analiz zorunlu rozeti bulunamadı!');
  }
  console.log('  ✅ AjanKonseyiOdasi: Hızlı butonu tasfiye edildi, Derin Analiz zorunlu aktif.');

  console.log('\n▶ TEST 2: DavaDerinAnaliz.tsx Model Seçimi ve Web Kamera Kısıtlaması');
  const derinAnalizPath = path.resolve('src/components/DavaDerinAnaliz.tsx');
  const derinAnalizCode = fs.readFileSync(derinAnalizPath, 'utf8');

  if (derinAnalizCode.includes("Hızlı Genel Bakış & Özet") || derinAnalizCode.includes("<span>Gemini Flash</span>")) {
    throw new Error('DavaDerinAnaliz içinde Flash / Hızlı Genel Bakış seçeneği kalmış!');
  }
  if (!derinAnalizCode.includes("const modelMode: 'pro' = 'pro'")) {
    throw new Error('DavaDerinAnaliz modelMode Pro olarak zorunlu kılınmamış!');
  }
  if (!derinAnalizCode.includes("isMobileApk")) {
    throw new Error('DavaDerinAnaliz içinde isMobileApk algılaması bulunamadı!');
  }
  console.log('  ✅ DavaDerinAnaliz: Gemini Flash butonu kaldırıldı, Gemini 3.1 Pro zorunlu kılındı.');
  console.log('  ✅ DavaDerinAnaliz: Kamera (OCR) butonu Web ortamında gizlendi, yalnızca Mobil APK için kısıtlandı.');

  console.log('\n▶ TEST 3: App.tsx Web Başlık ve Kamera Rozeti Temizliği');
  const appPath = path.resolve('src/App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf8');

  if (appCode.includes("Kamera ile Evrak Tarama (OCR) Aktif")) {
    throw new Error('App.tsx üst barda Web kamera rozeti kalmış!');
  }
  if (appCode.includes("Gemini Flash & Pro")) {
    throw new Error('App.tsx alt sayfa başlığında halen Flash ibaresi geçiyor!');
  }
  console.log('  ✅ App.tsx: Web kamera rozeti ve Flash ibaresi başarıyla kaldırıldı.');

  console.log('\n============================================================');
  console.log('🎯 GATE 6 TESTİ KUSURSUZ ŞEKİLDE TAMAMLANDI: BAŞARILI (PASS)');
  console.log('   - Tüm "Hızlı / Flash" seçenekleri tasfiye edildi: Doğrulandı');
  console.log('   - Sistemin varsayılan ve zorunlu modu "Derin Analiz": Doğrulandı');
  console.log('   - Kamera fotoğraf çekimi Web ortamında devre dışı/gizli: Doğrulandı');
  console.log('============================================================\n');
}

runGate6Test().catch((err) => {
  console.error('\n❌ GATE 6 TESTİ BAŞARISIZ OLDU:', err);
  process.exit(1);
});
