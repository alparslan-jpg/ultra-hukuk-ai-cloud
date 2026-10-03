// ============================================================
// GATE 8: UÇTAN UCA (E2E) TÜMLEŞİK SİSTEM ENTEGRASYON TESTİ
// Tüm Gate 1-7 Aşamalarının Birleşik Doğrulaması
// ============================================================

import { execSync } from 'child_process';

async function runE2ETests() {
  console.log('============================================================');
  console.log('🌟 ULTRA HUKUK AI — GATE 8: UÇTAN UCA (E2E) SİSTEM TESTİ');
  console.log('============================================================\n');

  const gates = [
    { id: 1, name: 'Altyapı, Veritabanı ve 50MB Chunked Payload', script: 'scripts/test_gate1.ts' },
    { id: 2, name: 'Merkezi Google Drive & Zero-Knowledge AES-256 Şifreleme', script: 'scripts/test_gate2.ts' },
    { id: 3, name: 'Temiz Başlangıç, Özelleştir Menüsü (24 Modül & 4 Ajan)', script: 'scripts/test_gate3.ts' },
    { id: 4, name: 'Arka Plan AI Veri Çıkarma ve Senkronizasyon Ekibi', script: 'scripts/test_gate4.ts' },
    { id: 5, name: 'Taraf Seçimi (Davacı/Davalı) ve %100 Müvekkil Yanlısı AI', script: 'scripts/test_gate5.ts' },
    { id: 6, name: 'Derin Analiz Zorunluluğu & Web Kamera Kısıtlaması', script: 'scripts/test_gate6.ts' },
    { id: 7, name: 'UYAP UDF / PDF Dışa Aktarma ve "Raporlarım" Entegrasyonu', script: 'scripts/test_gate7.ts' }
  ];

  for (const gate of gates) {
    console.log(`▶ KOŞULUYOR: GATE ${gate.id} — ${gate.name}`);
    try {
      execSync(`npx tsx ${gate.script}`, { stdio: 'inherit' });
      console.log(`✔ GATE ${gate.id}: BAŞARILI (PASS)\n`);
    } catch (err: any) {
      console.error(`❌ GATE ${gate.id} TESTİNDE HATA:`, err.message);
      process.exit(1);
    }
  }

  console.log('============================================================');
  console.log('🎉 TÜM GATE TESTLERİ (1 - 7) EKSİKSİZ VE BAŞARIYLA GEÇTİ!');
  console.log('   Sistem canlı dağıtıma ve uçtan uca üretime hazırdır.');
  console.log('============================================================\n');
}

runE2ETests();
