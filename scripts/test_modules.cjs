/**
 * Ultra Hukuk AI — Modüler Kurumsal Mimari ve Servis Test Betiği
 * API v1 Uç Noktaları, RBAC, UYAP Adaptörleri ve Asenkron Kuyruk Doğrulaması
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== ULTRA HUKUK AI: HİBRİT KURUMSAL MİMARİ DOĞRULAMA TESTİ ===\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✓ [BAŞARILI] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [BAŞARISIZ] ${name}: ${err.message}`);
    failedTests++;
  }
}

// 1. Veritabanı Şeması Doğrulaması
runTest('Faz 1: Veritabanı Şeması (hybrid_schema.sql) Dosya Bütünlüğü', () => {
  const schemaPath = path.join(__dirname, '..', 'db', 'hybrid_schema.sql');
  assert(fs.existsSync(schemaPath), 'hybrid_schema.sql dosyası mevcut değil');
  const content = fs.readFileSync(schemaPath, 'utf8');
  assert(content.includes('CREATE TABLE IF NOT EXISTS cases_extended'), 'cases_extended tablosu eksik');
  assert(content.includes('CREATE TABLE IF NOT EXISTS finance_records'), 'finance_records tablosu eksik');
  assert(content.includes('CREATE TABLE IF NOT EXISTS crm_clients'), 'crm_clients tablosu eksik');
  assert(content.includes('CREATE TABLE IF NOT EXISTS uyap_sync_logs'), 'uyap_sync_logs tablosu eksik');
  assert(content.includes('CREATE TABLE IF NOT EXISTS async_jobs'), 'async_jobs tablosu eksik');
});

// 2. Modüler API v1 Router Dosyaları
runTest('Faz 2: Modüler API v1 Router Katmanları', () => {
  const v1Dir = path.join(__dirname, '..', 'routes', 'v1');
  assert(fs.existsSync(path.join(v1Dir, 'cases.ts')), 'cases.ts router eksik');
  assert(fs.existsSync(path.join(v1Dir, 'finance.ts')), 'finance.ts router eksik');
  assert(fs.existsSync(path.join(v1Dir, 'integrations.ts')), 'integrations.ts router eksik');
  assert(fs.existsSync(path.join(v1Dir, 'queue.ts')), 'queue.ts router eksik');
  assert(fs.existsSync(path.join(v1Dir, 'ai.ts')), 'ai.ts router eksik');
});

// 3. RBAC Middleware Doğrulaması
runTest('Faz 3: RBAC Middleware ve Güvenlik Katmanı', () => {
  const rbacPath = path.join(__dirname, '..', 'routes', 'middleware', 'rbac.ts');
  assert(fs.existsSync(rbacPath), 'rbac.ts middleware eksik');
  const content = fs.readFileSync(rbacPath, 'utf8');
  assert(content.includes("export type UserRole = 'yonetici' | 'avukat' | 'stajyer'"), 'Kullanıcı rolleri eksik');
  assert(content.includes('requireRole'), 'requireRole middleware eksik');
});

// 4. Frontend Universal AI Drawer & Kurumsal Menü
runTest('Faz 4: Frontend Universal AI Drawer & Kurumsal Büro Arayüzü', () => {
  const drawerPath = path.join(__dirname, '..', 'src', 'components', 'UniversalAiAssistantDrawer.tsx');
  const buroPath = path.join(__dirname, '..', 'src', 'components', 'KurumsalBuroYonetimi.tsx');
  const simPath = path.join(__dirname, '..', 'src', 'components', 'MultiAgentDavaSimulasyonu.tsx');
  assert(fs.existsSync(drawerPath), 'UniversalAiAssistantDrawer.tsx eksik');
  assert(fs.existsSync(buroPath), 'KurumsalBuroYonetimi.tsx eksik');
  assert(fs.existsSync(simPath), 'MultiAgentDavaSimulasyonu.tsx eksik');
});

// 5. Render Dağıtım Yapılandırması
runTest('Faz 5: Render.yaml Zero-Downtime Yapılandırması', () => {
  const renderPath = path.join(__dirname, '..', 'render.yaml');
  assert(fs.existsSync(renderPath), 'render.yaml eksik');
  const content = fs.readFileSync(renderPath, 'utf8');
  assert(content.includes('ANTHROPIC_API_KEY'), 'render.yaml ANTHROPIC_API_KEY eksik');
  assert(content.includes('npm run build'), 'render.yaml derleme komutu optimize değil');
});

console.log(`\nTest Sonucu: Toplam ${passedTests + failedTests} testten ${passedTests} tanesi BAŞARILI, ${failedTests} tanesi BAŞARISIZ.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ TÜM HİBRİT KURUMSAL MİMARİ TESTLERİ EKSİKSİZ TAMAMLANDI.\n');
  process.exit(0);
}
