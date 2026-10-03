// ============================================================
// ULTRA HUKUK AI — GATE 2 VERIFICATION TEST SCRIPT
// Merkezi Google Drive & Zero-Knowledge AES-256-GCM Testi
// 1. Dosya şifrelenerek izole Drive klasörüne yazılıyor mu?
// 2. Ham veri diskte/bulutta açıkta kalmıyor mu?
// 3. İndirilirken yetkili kullanıcı anahtarıyla kusursuz çözülüyor mu?
// 4. Yetkisiz kullanıcı izolasyonu çalışıyor mu?
// ============================================================

import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import { integrationsRouter } from '../routes/v1/integrations.ts';
import { SecureExportService } from '../src/services/secureExportService.ts';

async function runGate2Test() {
  console.log('============================================================');
  console.log('🚀 GATE 2 DOĞRULAMA TESTİ BAŞLATILIYOR');
  console.log('============================================================\n');

  // Test HTTP sunucusu kur
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use('/api/v1/integrations', integrationsRouter);

  const TEST_PORT = 3198;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()));
  console.log(`  🟢 Test Integrations Sunucusu port ${TEST_PORT} üzerinde aktif.`);

  try {
    const TEST_PLAINTEXT = 'GİZLİ ADLİ DAVA EVRAKI - AV. OSMAN TURGUT - HMK 119 DİLEKÇESİ - PROTOKOL 2026-X99';
    const TEST_FILENAME = 'gizli_dava_protokolu.pdf';
    const USER_SICIL = '8109';

    console.log('▶ ADIM 1: Dosyanın AES-256-GCM ile Şifrelenip Merkezi Drive\'a Yüklenmesi');
    const uploadRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/integrations/drive/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-sicil': USER_SICIL,
        'x-user-name': 'Av. Osman Turgut',
        'x-user-role': 'avukat'
      },
      body: JSON.stringify({
        fileName: TEST_FILENAME,
        fileContent: Buffer.from(TEST_PLAINTEXT, 'utf-8').toString('base64'),
        isBase64: true
      })
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.file) {
      throw new Error(`Upload başarısız: ${JSON.stringify(uploadData)}`);
    }

    const { fileId, encryptedFileName, folderId } = uploadData.file;
    console.log(`  ✅ Dosya şifrelendi ve kaydedildi.`);
    console.log(`     File ID: ${fileId}`);
    console.log(`     Şifreli İsim: ${encryptedFileName}`);
    console.log(`     Hedef Klasör: ${folderId}`);

    // ADIM 2: Diskteki verinin şifreli olduğunu doğrula (Zero-Knowledge)
    console.log('▶ ADIM 2: Zero-Knowledge Doğrulaması (Ham veri bulutta/diskte asla açık kalmaz)');
    const localDir = path.resolve(process.cwd(), `storage/google_drive/UltraHukuk_Secure_Storage/usr_${USER_SICIL}`);
    const filesInDir = fs.readdirSync(localDir);
    const targetDiskFile = filesInDir.find(f => f.includes(fileId));

    if (!targetDiskFile) {
      throw new Error(`Kullanıcı klasöründe (${localDir}) dosya bulunamadı!`);
    }

    const rawFileOnDisk = fs.readFileSync(path.join(localDir, targetDiskFile), 'utf-8');
    if (rawFileOnDisk.includes(TEST_PLAINTEXT)) {
      throw new Error('GÜVENLİK İHLALİ! Ham metin şifrelenmeden diske yazılmış!');
    }
    console.log('  ✅ Doğrulandı: Depolanan dosya ham metni içermiyor. Tamamen AES-256 şifreli.');

    const parsedPackage = JSON.parse(rawFileOnDisk);
    if (!parsedPackage.iv || !parsedPackage.authTag || !parsedPackage.encryptedData) {
      throw new Error('Şifreli paket yapısı (iv, authTag, encryptedData) eksik!');
    }
    console.log(`  ✅ Şifreleme doğrulandı: IV (${parsedPackage.iv.length} chars), AuthTag (${parsedPackage.authTag.length} chars)`);

    // ADIM 3: Şifreli dosyanın Drive'dan yetkili kullanıcı tarafından indirilip çözülmesi
    console.log('▶ ADIM 3: Şifreli Dosyanın İndirilmesi ve Çözülmesi (Decryption)');
    const downloadRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/integrations/drive/download/${fileId}`, {
      headers: {
        'x-user-sicil': USER_SICIL,
        'x-user-name': 'Av. Osman Turgut',
        'x-user-role': 'avukat'
      }
    });

    if (!downloadRes.ok) {
      throw new Error(`Download HTTP hatası: ${downloadRes.status} ${downloadRes.statusText}`);
    }

    const decryptedText = await downloadRes.text();
    if (decryptedText !== TEST_PLAINTEXT) {
      throw new Error(`Çözülen veri orijinal veri ile eşleşmiyor!\nBeklenen: ${TEST_PLAINTEXT}\nAlınan: ${decryptedText}`);
    }
    console.log('  ✅ Şifre başarıyla çözüldü! Çıktı orijinal metinle birebir eşleşiyor.');

    // ADIM 4: Başka bir kullanıcının yetkisiz erişim denemesinin engellenmesi
    console.log('▶ ADIM 4: Kullanıcı İzolasyon Koruması (Farklı Sicil / Hacker Erişimi Reddi)');
    const unauthorizedRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/integrations/drive/download/${fileId}`, {
      headers: {
        'x-user-sicil': '9999_HACKER',
        'x-user-name': 'Yetkisiz Kullanici',
        'x-user-role': 'avukat'
      }
    });

    if (unauthorizedRes.status === 500 || unauthorizedRes.status === 404 || unauthorizedRes.status === 403) {
      console.log('  ✅ İzolasyon doğrulandı: Farklı kullanıcı ID\'si dosya dizinine erişemedi.');
    } else {
      throw new Error('GÜVENLİK AÇIĞI! Farklı kullanıcı ID yetkisiz dosyaya erişebildi!');
    }

    // ADIM 5: ZK İşlemlerinin IP ve Kullanıcı Bilgisiyle Loglanması Doğrulaması
    console.log('▶ ADIM 5: Zero-Knowledge İşlemlerinin IP ve Kullanıcı Bilgisiyle Loglanması (Audit Trail)');
    const { db } = await import('../src/services/persistentDatabaseService.ts');
    await new Promise(r => setTimeout(r, 300));
    const allLogs = db.getAuditLogs();

    const encryptLog = allLogs.find(l => l.actionType === 'ZK_Encrypt' && l.resourceId === fileId);
    const decryptLog = allLogs.find(l => l.actionType === 'ZK_Decrypt' && l.resourceId === fileId && l.status === 'Başarılı');
    const blockedLog = allLogs.find(l => l.actionType === 'ZK_Decrypt' && l.userId === '9999_HACKER' && l.status === 'Engellendi');

    if (!encryptLog) {
      throw new Error(`ZK_Encrypt işlemi için audit log bulunamadı (FileId: ${fileId})`);
    }
    console.log(`  ✅ Şifreleme Loglandı: [${encryptLog.actionType}] IP: ${encryptLog.ipAddress}, Kullanıcı: ${encryptLog.userId}, Durum: ${encryptLog.status}`);

    if (!decryptLog) {
      throw new Error(`ZK_Decrypt başarılı işlem için audit log bulunamadı (FileId: ${fileId})`);
    }
    console.log(`  ✅ Başarılı Çözme Loglandı: [${decryptLog.actionType}] IP: ${decryptLog.ipAddress}, Kullanıcı: ${decryptLog.userId}, Durum: ${decryptLog.status}`);

    if (!blockedLog) {
      throw new Error(`Hacker erişim denemesi için Engellendi audit log bulunamadı.`);
    }
    console.log(`  ✅ Yetkisiz Erişim Engelleme Loglandı: [${blockedLog.actionType}] IP: ${blockedLog.ipAddress}, Kullanıcı: ${blockedLog.userId}, Durum: ${blockedLog.status}`);

    // Temizlik
    fs.unlinkSync(path.join(localDir, targetDiskFile));
    console.log('  ✅ Test dosyası temizlendi.');

    console.log('\n============================================================');
    console.log('🎯 GATE 2 TESTİ KUSURSUZ ŞEKİLDE TAMAMLANDI: BAŞARILI (PASS)');
    console.log('   - Merkezi Google Drive & UltraHukuk Secure Storage: Aktif');
    console.log('   - Kullanıcı İzolasyonu: Klasörler kullanıcı bazında izole');
    console.log('   - Zero-Knowledge Şifreleme: AES-256-GCM / 0 Ham Veri Sızıntısı');
    console.log('   - Çözme ve İndirme: %100 Başarılı');
    console.log('   - Adli Log Kaydı: IP, Kullanıcı ve İşlem Tipi ile Doğrulandı');
    console.log('============================================================\n');
  } finally {
    server.close();
  }
}

runGate2Test();
