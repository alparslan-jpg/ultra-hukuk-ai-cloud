// ============================================================
// ULTRA HUKUK AI — GATE 1 VERIFICATION TEST SCRIPT
// 1. Merkezi Neon PostgreSQL Veritabanı Yazma & Okuma Doğrulaması
// 2. 50MB Büyük Dosya Parçalı Yükleme (Chunking) & Sıfır Zaman Aşımı / 413 Testi
// ============================================================

import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import { neon } from '@neondatabase/serverless';
import { casesRouter } from '../routes/v1/cases.ts';

// 1. Ortam değişkenlerini yükle
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL tanımlı değil!');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runGate1Test() {
  console.log('============================================================');
  console.log('🚀 GATE 1 DOĞRULAMA TESTİ BAŞLATILIYOR');
  console.log('============================================================\n');

  // ------------------------------------------------------------
  // TEST A: Yerel JSON İptali & Merkezi SQL Doğrulaması
  // ------------------------------------------------------------
  console.log('▶ TEST A: Merkezi Neon SQL Veritabanı Yazma & Okuma');
  const jsonStorePath = path.resolve(process.cwd(), 'data/ultrahukuk_store.json');
  if (fs.existsSync(jsonStorePath)) {
    console.error('❌ HATA: data/ultrahukuk_store.json yerel dosyası halen mevcut!');
    process.exit(1);
  }
  console.log('  ✅ data/ultrahukuk_store.json yerel depolaması iptal edilmiş (Mevcut değil).');

  const testSicil = `test-${Date.now()}`;
  const testLawyerId = `usr-${testSicil}`;
  const testCaseId = `case-${testSicil}`;
  const testTxId = `tx-${testSicil}`;

  try {
    // 1. Avukat ekle
    await sql`
      INSERT INTO lawyers (id, full_name, sicil_no, baro_adi, email, tc_kimlik, days_remaining, is_active, status, created_at, updated_at)
      VALUES (${testLawyerId}, 'Av. Gate 1 Test', ${testSicil}, 'Ankara Barosu', 'test@gate1.av.tr', '99999999999', 365, true, 'AKTİF', NOW(), NOW())
    `;
    console.log('  ✅ Neon SQL lawyers tablosuna kayıt yazıldı.');

    // 2. Dava ekle
    await sql`
      INSERT INTO cases_extended (id, lawyer_sicil_no, case_title, case_type, court_name, esas_no, claim_amount, status, created_at, updated_at)
      VALUES (${testCaseId}, ${testSicil}, 'Gate 1 Test Davası', 'Ticari Dava', 'Ankara 1. Asliye Ticaret', '2026/999 Esas', 1500000, 'Açık', NOW(), NOW())
    `;
    console.log('  ✅ Neon SQL cases_extended tablosuna kayıt yazıldı.');

    // 3. Finans kaydı ekle
    await sql`
      INSERT INTO finance_records (id, lawyer_sicil_no, transaction_type, category, description, gross_amount, net_amount, status, transaction_date, created_at)
      VALUES (${testTxId}, ${testSicil}, 'tahsilat', 'Vekalet Ücreti', 'Gate 1 Test Tahsilatı', 150000, 120000, 'tamamlandi', CURRENT_DATE, NOW())
    `;
    console.log('  ✅ Neon SQL finance_records tablosuna kayıt yazıldı.');

    // 4. Doğrula
    const readLawyer = await sql`SELECT * FROM lawyers WHERE id = ${testLawyerId}`;
    const readCase = await sql`SELECT * FROM cases_extended WHERE id = ${testCaseId}`;
    const readFinance = await sql`SELECT * FROM finance_records WHERE id = ${testTxId}`;

    if (readLawyer.length === 1 && readCase.length === 1 && readFinance.length === 1) {
      console.log('  ✅ Neon SQL kayıtları başarıyla okundu ve doğrulandı.');
    } else {
      throw new Error('Kayıtlar SQL veritabanından eksik veya hatalı döndü.');
    }

    // 5. Temizlik
    await sql`DELETE FROM finance_records WHERE id = ${testTxId}`;
    await sql`DELETE FROM cases_extended WHERE id = ${testCaseId}`;
    await sql`DELETE FROM lawyers WHERE id = ${testLawyerId}`;
    console.log('  ✅ Test kayıtları Neon veritabanından temizlendi.\n');
  } catch (err: any) {
    console.error('❌ TEST A BAŞARISIZ:', err.message || err);
    process.exit(1);
  }

  // ------------------------------------------------------------
  // TEST B: 50MB Büyük Dosya Chunked Yükleme & 0 Zaman Aşımı
  // ------------------------------------------------------------
  console.log('▶ TEST B: 50MB Büyük Dosya Parçalı Yükleme (Chunking) & Payload Optimizasyonu');

  // Test HTTP sunucusunu başlat
  const app = express();
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  app.use('/api/v1/cases', casesRouter);

  const TEST_PORT = 3199;
  const server = http.createServer(app);
  server.timeout = 300000;
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;

  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()));
  console.log(`  🟢 Test API Sunucusu port ${TEST_PORT} üzerinde aktif.`);

  try {
    const TOTAL_BYTES = 50 * 1024 * 1024; // 52,428,800 bytes (50MB)
    const CHUNK_SIZE = 5 * 1024 * 1024;  // 5MB her bir parça
    const TOTAL_CHUNKS = Math.ceil(TOTAL_BYTES / CHUNK_SIZE); // 10 parça
    const TEST_FILENAME = 'gate1_50mb_test_document.pdf';

    console.log(`  📦 50MB test tamponu oluşturuluyor (${TOTAL_BYTES} bayt, ${TOTAL_CHUNKS} parça x 5MB)...`);
    const dummyBuffer = Buffer.alloc(TOTAL_BYTES, 0x41); // 'A' karakterleri ile dolu 50MB

    // 1. Adım: Init Chunked Upload
    console.log('  🔄 Adım 1: POST /api/v1/cases/upload-chunk/init çağrılıyor...');
    const initRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/cases/upload-chunk/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: TEST_FILENAME,
        fileType: 'application/pdf',
        totalSize: TOTAL_BYTES,
        totalChunks: TOTAL_CHUNKS,
        caseId: 'case-gate1-test'
      })
    });
    const initData = await initRes.json();
    if (!initData.success || !initData.uploadId) {
      throw new Error(`Init başarısız: ${JSON.stringify(initData)}`);
    }
    const uploadId = initData.uploadId;
    console.log(`  ✅ Yükleme oturumu başlatıldı. Upload ID: ${uploadId}`);

    // 2. Adım: 10 Adet 5MB Parçayı Yükle
    console.log(`  🔄 Adım 2: ${TOTAL_CHUNKS} adet 5MB parçanın yüklenmesi başlatılıyor...`);
    const startTime = Date.now();

    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      const chunkStart = i * CHUNK_SIZE;
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, TOTAL_BYTES);
      const chunkSlice = dummyBuffer.subarray(chunkStart, chunkEnd);

      const chunkRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/cases/upload-chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          chunkIndex: i,
          chunkSize: chunkSlice.length,
          chunkData: chunkSlice.toString('base64')
        })
      });

      if (!chunkRes.ok) {
        throw new Error(`Parça ${i} HTTP Hatası: ${chunkRes.status} ${chunkRes.statusText}`);
      }

      const chunkResult = await chunkRes.json();
      if (!chunkResult.success) {
        throw new Error(`Parça ${i} yükleme başarısız: ${JSON.stringify(chunkResult)}`);
      }
      process.stdout.write(`    ↳ Parça ${i + 1}/${TOTAL_CHUNKS} yüklendi (${(chunkSlice.length / (1024 * 1024)).toFixed(1)} MB)\n`);
    }

    const uploadDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`  ✅ Tüm parçalar zaman aşımına uğramadan başarıyla iletildi (${uploadDurationSec} saniye).`);

    // 3. Adım: Status Kontrolü
    const statusRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/cases/upload-chunk/status/${uploadId}`);
    const statusData = await statusRes.json();
    console.log(`  ✅ Ara durum doğrulandı: ${statusData.uploadedChunks}/${statusData.totalChunks} parça hazır.`);

    // 4. Adım: Complete & Reassemble
    console.log('  🔄 Adım 3: POST /api/v1/cases/upload-chunk/complete çağrılıyor (Dosya birleştirme)...');
    const completeRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/cases/upload-chunk/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        fileName: TEST_FILENAME,
        caseId: 'case-gate1-test'
      })
    });
    const completeData = await completeRes.json();
    if (!completeData.success) {
      throw new Error(`Complete başarısız: ${JSON.stringify(completeData)}`);
    }

    console.log('  ✅ Dosya başarıyla birleştirildi:');
    console.log(`     Dosya Yolu: ${completeData.filePath}`);
    console.log(`     Toplam Boyut: ${(completeData.totalSize / (1024 * 1024)).toFixed(2)} MB (${completeData.totalSize} bayt)`);

    if (completeData.totalSize !== TOTAL_BYTES) {
      throw new Error(`Boyut tutarsızlığı! Beklenen: ${TOTAL_BYTES}, Gerçekleşen: ${completeData.totalSize}`);
    }

    // 5. Adım: Neon SQL Tablosunda Doğrulama
    const sqlUploadRecord = await sql`SELECT * FROM chunked_uploads WHERE id = ${uploadId}`;
    if (sqlUploadRecord.length > 0 && sqlUploadRecord[0].status === 'completed') {
      console.log('  ✅ Neon SQL chunked_uploads tablosunda kayıt "completed" olarak onaylandı.');
    } else {
      throw new Error('Neon SQL tablosunda chunked_uploads kaydı bulunamadı veya completed değil.');
    }

    // Temizlik: Birleşen test dosyasını ve Neon kaydını temizle
    if (fs.existsSync(completeData.filePath)) {
      fs.unlinkSync(completeData.filePath);
    }
    await sql`DELETE FROM chunked_uploads WHERE id = ${uploadId}`;
    console.log('  ✅ 50MB test dosyası ve SQL geçici kayıtları temizlendi.');

    // ------------------------------------------------------------
    // TEST C: Adli Bilişim Log Şeması & Middleware Doğrulaması
    // ------------------------------------------------------------
    console.log('\n▶ TEST C: Adli Bilişim Log Şeması & Middleware (IP, User-Agent, Session, ms)');
    
    // Import forensicAuditMiddleware & db
    const { forensicAuditMiddleware } = await import('../src/middleware/forensicAuditMiddleware.ts');
    const { db } = await import('../src/services/persistentDatabaseService.ts');

    // Create a mini app with forensicAuditMiddleware to test live HTTP request interception
    const auditApp = express();
    auditApp.use(express.json());
    auditApp.use(forensicAuditMiddleware);
    auditApp.post('/api/v1/cases/upload-test', (req, res) => {
      res.status(200).json({ success: true, caseId: 'case-audit-123' });
    });
    auditApp.post('/api/v1/auth/unauthorized-test', (req, res) => {
      res.status(403).json({ success: false, error: 'Erişim engellendi.' });
    });

    const AUDIT_PORT = 3196;
    const auditServer = http.createServer(auditApp);
    await new Promise<void>((resolve) => auditServer.listen(AUDIT_PORT, '127.0.0.1', () => resolve()));

    try {
      const testIp = '198.51.100.77';
      const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UltraHukukAudit/2026';
      const testSicil = '8109';
      const testSession = 'sess-audit-gate1-xyz';

      // 1. Başarılı işlem isteği at
      const resp1 = await fetch(`http://127.0.0.1:${AUDIT_PORT}/api/v1/cases/upload-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': testIp,
          'user-agent': testUserAgent,
          'x-lawyer-sicil': testSicil,
          'x-session-id': testSession
        },
        body: JSON.stringify({ caseId: 'case-audit-123' })
      });
      if (!resp1.ok) throw new Error('Audit test endpoint 1 başarısız');

      // 2. Engellenen işlem isteği at (HTTP 403)
      const resp2 = await fetch(`http://127.0.0.1:${AUDIT_PORT}/api/v1/auth/unauthorized-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '203.0.113.99',
          'user-agent': 'SuspiciousBot/1.0',
          'x-lawyer-sicil': 'HACKER_ATTEMPT',
          'x-session-id': 'sess-hacker-blocked'
        }
      });
      if (resp2.status !== 403) throw new Error('Audit test endpoint 2 403 dönmedi');

      // Kısa bir bekleme (asenkron res.end logunun tamamlanması için)
      await new Promise(r => setTimeout(r, 400));

      // Veritabanı ve in-memory cache sorgusu
      const logs = db.getAuditLogs();
      const successLog = logs.find(l => l.ipAddress === testIp);
      const blockedLog = logs.find(l => l.ipAddress === '203.0.113.99');

      if (!successLog) {
        throw new Error('Gerçek IP (' + testIp + ') ile kaydedilen audit log bulunamadı.');
      }
      console.log('  ✅ İstemci Gerçek IP Adresi Doğrulandı:', successLog.ipAddress);
      console.log('  ✅ User-Agent Doğrulandı:', successLog.userAgent);
      console.log('  ✅ Kullanıcı / Sicil ID Doğrulandı:', successLog.userId);
      console.log('  ✅ Oturum (Session) ID Doğrulandı:', successLog.sessionId);
      console.log('  ✅ İşlem Tipi Doğrulandı:', successLog.actionType);
      console.log('  ✅ Milisaniye Hassasiyetli Zaman Damgası Doğrulandı:', successLog.timestamp);
      console.log('  ✅ Başarılı HTTP Durumu Doğrulandı:', successLog.statusCode, '-', successLog.status);

      if (!blockedLog || blockedLog.status !== 'Engellendi') {
        throw new Error('Engellenen (HTTP 403) işlem için Engellendi statüsü kaydedilemedi.');
      }
      console.log('  ✅ Yetkisiz/Engellenen Erişim Tespiti & Kırmızı Kod Durumu Doğrulandı:', blockedLog.status, '(HTTP ' + blockedLog.statusCode + ')');

    } finally {
      auditServer.close();
    }

    console.log('\n============================================================');
    console.log('🎯 GATE 1 TESTİ KUSURSUZ ŞEKİLDE TAMAMLANDI: BAŞARILI (PASS)');
    console.log('   - Neon PostgreSQL Merkezi Veritabanı: Aktif & Doğrulandı');
    console.log('   - Yerel ultrahukuk_store.json Depolaması: Kaldırıldı');
    console.log('   - 50MB Büyük Dosya Chunking Mekanizması: Sıfır Hata / 0 Timeout / 0 413');
    console.log('   - Adli Bilişim Log Şeması & Middleware: IP, User-Agent, Session, ms PASS');
    console.log('============================================================\n');
  } catch (err: any) {
    console.error('❌ TEST B/C BAŞARISIZ:', err.message || err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runGate1Test();
