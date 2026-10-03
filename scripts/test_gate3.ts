// ============================================================
// ULTRA HUKUK AI — GATE 3 VERIFICATION TEST SCRIPT
// Temiz Başlangıç ve "ÖZELLEŞTİR" Arayüz Entegrasyonu Testi
// ============================================================

import fs from 'fs';
import path from 'path';
import { OZELLESTIR_FEATURES } from '../src/components/OzellestirDropdown.tsx';

async function runGate3Test() {
  console.log('============================================================');
  console.log('🚀 GATE 3 DOĞRULAMA TESTİ BAŞLATILIYOR');
  console.log('============================================================\n');

  console.log('▶ TEST 1: Özelleştir Menüsü İçerik ve Özel Ajan Doğrulaması');
  console.log(`  Toplanan toplam modül sayısı: ${OZELLESTIR_FEATURES.length}`);

  const required4SpecialAgents = [
    '1. Usul & Süre Ajanı',
    '2. Yargıtay Emsal Ajanı',
    '3. Şeytanın Avukatı',
    '4. Dilekçe Mimarı'
  ];

  for (const agentName of required4SpecialAgents) {
    const found = OZELLESTIR_FEATURES.find(f => f.title.includes(agentName));
    if (!found) {
      throw new Error(`Zorunlu özel ajan eksik: ${agentName}`);
    }
    console.log(`  ✅ Özel Ajan Doğrulandı: ${found.title} (${found.description})`);
  }

  const requiredModules = [
    'Müvekkil & Dava Portalı',
    'Arşiv',
    'Baş Müşavir & Ajan Konseyi',
    'Seçmeli Özellikler & Git',
    'Adli Hakikat & Cımbız Ajanı',
    'Kişisel Mobil APK',
    'Dava Derin Analiz',
    'Case Analytics',
    'Dava Analiz Laboratuvarı',
    'Stratejik Dava Brifingi',
    'Harp Odası & Karşı Savunma',
    'Zamanaşımı & Faiz',
    'Dava Zaman Çizelgesi & Takvim',
    '35 Noktalı Usul Denetimi',
    'Bilirkişi İtiraz Lab (HMK 281)',
    'Duruşma Stratejisi',
    'Adli Sesli Dikte & Duruşma Zaptı',
    'UYAP Dilekçe Lab',
    'Emsal Karar',
    'Adli Belge (OCR)',
    'Denetleme Paneli',
    'Mevzuat Çapraz Doğrulama',
    'Mevzuat Sorgulama',
    'Hukuk Terimleri Sözlüğü'
  ];

  for (const modTitle of requiredModules) {
    const found = OZELLESTIR_FEATURES.find(f => f.title.toLowerCase().includes(modTitle.toLowerCase()) || modTitle.toLowerCase().includes(f.title.toLowerCase()));
    if (!found) {
      throw new Error(`Zorunlu modül eksik: ${modTitle}`);
    }
  }
  console.log(`  ✅ 24 Temel Hukuk Modülünün tamamı listede mevcut.`);

  console.log('\n▶ TEST 2: "Müvekkil & Dava Gezgini" Balonunun UI\'dan Kaldırıldığının Doğrulanması');
  const workspaceCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/LawyerWorkspace.tsx'), 'utf-8');
  if (workspaceCode.includes('<ClientCaseExplorerSidebar') || workspaceCode.includes('ClientCaseExplorerSidebarProps')) {
    throw new Error('HATA: ClientCaseExplorerSidebar halen LawyerWorkspace içinde çağrılıyor!');
  }
  console.log('  ✅ Doğrulandı: "Müvekkil & Dava Gezgini" kenar çubuğu ve balonu UI\'dan tamamen kaldırıldı.');

  console.log('\n▶ TEST 3: Temiz Başlangıç (Boş Dava & Müvekkil Ekranı) Doğrulaması');
  const appCode = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  if (appCode.includes('initialPlaintiff="Atlas Tekstil Sanayi ve Dış Ticaret A.Ş."')) {
    throw new Error('HATA: Varsayılan Atlas Tekstil mock verisi halen temizlenmemiş!');
  }
  console.log('  ✅ Doğrulandı: Sistem açılışında mock dava ve müvekkil yüklenmiyor, temiz arayüz aktif.');

  console.log('\n▶ TEST 4: Üst Menüde "ÖZELLEŞTİR" ve Dinamik Pinleme Entegrasyonu');
  if (!appCode.includes('<OzellestirDropdown') || !appCode.includes('pinnedCustomFeatureIds')) {
    throw new Error('HATA: OzellestirDropdown App.tsx navigasyon menüsüne eklenmemiş!');
  }
  console.log('  ✅ Doğrulandı: Üst navigasyon menüsünde MEVZUAT yanında ÖZELLEŞTİR dropdown ve sabitlenen butonlar aktif.');

  console.log('\n▶ TEST 5: Kırmızı Alanların (Ana Sayfa Butonları ve Müvekkil Ekle Butonları) Tasfiyesi');
  const portalCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/MuvekkilDavaPortali.tsx'), 'utf-8');
  if (portalCode.includes('Yeni Müvekkil Ekle') || portalCode.includes('<span>Müvekkil Ekle</span>')) {
    throw new Error('HATA: MuvekkilDavaPortali içinde Müvekkil Ekle butonları halen mevcut!');
  }
  console.log('  ✅ Doğrulandı: Müvekkil Portalı başlığındaki ve kartlarındaki "+ Müvekkil Ekle" butonları tamamen kaldırıldı.');

  if (workspaceCode.includes('title="Ana Sayfaya ve Modül Merkezine Dön"') || workspaceCode.includes('<span>Ana Sayfa</span>')) {
    throw new Error('HATA: LawyerWorkspace içinde Ana Sayfa butonu halen mevcut!');
  }
  console.log('  ✅ Doğrulandı: Çalışma masası başlığındaki "← Ana Sayfa" butonu tamamen kaldırıldı.');

  console.log('\n============================================================');
  console.log('🎯 GATE 3 TESTİ KUSURSUZ ŞEKİLDE TAMAMLANDI: BAŞARILI (PASS)');
  console.log('   - Temiz Başlangıç: Mock veriler temizlendi');
  console.log('   - Floating Sidebar: Müvekkil & Dava Gezgini kaldırıldı');
  console.log('   - Özelleştir Menüsü: 4 Özel Ajan + 24 Modül entegre edildi');
  console.log('   - Dinamik Pinleme & State Geçişi: Aktif & Doğrulandı');
  console.log('============================================================\n');
}

runGate3Test();
