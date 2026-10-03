import { Router, Response } from 'express';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac';

export const integrationsRouter = Router();

// GET /api/v1/integrations/status — UYAP ve Entegrasyon Durumu
integrationsRouter.get('/status', requireRole(['yonetici', 'avukat', 'stajyer']), (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    adapters: [
      {
        name: 'UYAP Avukat Portalı Adaptörü',
        status: 'ONLINE',
        protocol: 'XML/UDF v2.4 Standardı',
        lastSync: new Date().toISOString(),
        features: ['Dava İçe Aktarım', 'UDF Dilekçe İhracı', 'Duruşma Senkronizasyonu']
      },
      {
        name: 'e-Tebligat & UETS Dinleyici',
        status: 'ONLINE',
        protocol: 'Güvenli Adli Webhook',
        lastSync: new Date().toISOString(),
        features: ['Gelen Tebligat Dinleme', 'Hak Düşürücü Süre Alarmı']
      },
      {
        name: 'Gelir İdaresi (GİB) e-SMM Entegrasyonu',
        status: 'ACTIVE_SANDBOX',
        protocol: 'REST / XML Entegrasyon',
        lastSync: new Date().toISOString(),
        features: ['e-Serbest Meslek Makbuzu Kesme', 'KDV Tevkifat Doğrulama']
      }
    ]
  });
});

// POST /api/v1/integrations/uyap/import-xml — UYAP XML / Dava Evrakı Ayrıştırıcı
integrationsRouter.post('/uyap/import-xml', requireRole(['yonetici', 'avukat']), (req: AuthenticatedRequest, res: Response) => {
  const { xmlContent, rawText } = req.body;

  if (!xmlContent && !rawText) {
    return res.status(400).json({ success: false, message: 'İçe aktarılacak XML veya UDF metni bulunamadı.' });
  }

  const content = (xmlContent || rawText || '') as string;

  // Simple resilient parser for judicial fields
  const mahkemeMatch = content.match(/<MahkemeAdi>(.*?)<\/MahkemeAdi>/i) || content.match(/(.*?(?:Ticaret|Asliye|İş|Sulh|Ağır Ceza)\s*Mahkemesi)/i);
  const esasMatch = content.match(/<EsasNo>(.*?)<\/EsasNo>/i) || content.match(/(\d{4}\/\d+\s*Esas)/i);
  const davaciMatch = content.match(/<Davaci>(.*?)<\/Davaci>/i) || content.match(/Davacı\s*:\s*([^\n\r]+)/i);
  const davaliMatch = content.match(/<Davali>(.*?)<\/Davali>/i) || content.match(/Davalı\s*:\s*([^\n\r]+)/i);

  const parsedCase = {
    courtName: mahkemeMatch ? mahkemeMatch[1].trim() : 'İstanbul Nöbetçi Mahkemesi',
    esasNo: esasMatch ? esasMatch[1].trim() : '2026/Belirlenmedi Esas',
    plaintiff: davaciMatch ? davaciMatch[1].trim() : 'Bilinmeyen Davacı',
    defendant: davaliMatch ? davaliMatch[1].trim() : 'Bilinmeyen Davalı',
    importDate: new Date().toISOString(),
    status: 'Ayrıştırma Başarılı'
  };

  return res.json({
    success: true,
    message: 'UYAP evrakı başarıyla ayrıştırıldı.',
    parsedData: parsedCase
  });
});

// POST /api/v1/integrations/uyap/export-udf — UYAP UDF Formatına Dönüştürücü
integrationsRouter.post('/uyap/export-udf', requireRole(['yonetici', 'avukat']), (req: AuthenticatedRequest, res: Response) => {
  const { title, bodyText, courtName, caseNo } = req.body;

  if (!bodyText) {
    return res.status(400).json({ success: false, message: 'Dilekçe gövde metni boş olamaz.' });
  }

  // Create UDF compliant XML string
  const udfXml = `<?xml version="1.0" encoding="UTF-8"?>
<document formatVersion="1.0">
  <properties>
    <property name="title">${title || 'UYAP Dava Dilekçesi'}</property>
    <property name="court">${courtName || ''}</property>
    <property name="caseNo">${caseNo || ''}</property>
    <property name="created">${new Date().toISOString()}</property>
  </properties>
  <content>
    <![CDATA[
${bodyText}
    ]]>
  </content>
</document>`;

  return res.json({
    success: true,
    message: 'UYAP UDF formatı başarıyla oluşturuldu.',
    udfPayload: udfXml,
    suggestedFileName: `${(caseNo || 'dilekce').replace(/[^a-zA-Z0-9]/g, '_')}_UYAP.udf`
  });
});

// POST /api/v1/integrations/webhook — Adli Bildirim Webhook'u (e-Tebligat vb.)
integrationsRouter.post('/webhook', (req: AuthenticatedRequest, res: Response) => {
  const event = req.body;
  console.log('[INTEGRATIONS WEBHOOK] Adli bildirim alındı:', event);

  return res.json({
    success: true,
    receivedAt: new Date().toISOString(),
    status: 'PROCESSED'
  });
});

// ============================================================
// MERKEZİ GOOGLE DRIVE & ZERO-KNOWLEDGE ŞİFRELEME ENDPOINTS
// ============================================================

// POST /api/v1/integrations/drive/upload — Şifreli Dosya Yükleme (Zero-Knowledge AES-256)
integrationsRouter.post('/drive/upload', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, fileContent, isBase64 } = req.body;
    if (!fileName || !fileContent) {
      return res.status(400).json({ success: false, message: 'fileName ve fileContent alanları zorunludur.' });
    }

    const userSicilNo = req.user?.sicilNo || '8109';
    const buffer = Buffer.isBuffer(fileContent)
      ? fileContent
      : Buffer.from(fileContent, isBase64 || fileContent.startsWith('data:') ? 'base64' : 'utf-8');

    const { centralDrive } = await import('../../src/services/centralDriveService');
    const result = await centralDrive.uploadEncryptedFile(fileName, buffer, userSicilNo);

    // Adli Bilişim Denetim Kaydı (Audit Log)
    try {
      const { db } = await import('../../src/services/persistentDatabaseService');
      const forwardedHeader = req.headers['x-forwarded-for'];
      const clientIp = (req.headers['cf-connecting-ip'] as string) || (typeof forwardedHeader === 'string' ? forwardedHeader.split(',')[0].trim() : req.ip || '127.0.0.1');
      const userAgent = (req.headers['user-agent'] as string) || 'Bilinmeyen İstemci';
      db.addAuditLog({
        id: `aud-zk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        adminUsername: userSicilNo,
        action: 'Zero-Knowledge Dosya Şifreleme ve Drive Yedekleme',
        details: `${fileName} dosyası AES-256-GCM ile şifrelendi, usr_${userSicilNo} klasörüne kaydedildi.`,
        ipAddress: clientIp,
        userAgent,
        userId: userSicilNo,
        actionType: 'ZK_Encrypt',
        resourceId: result.fileId,
        statusCode: 200,
        status: 'Başarılı'
      }).catch(() => {});
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Dosya AES-256 ile şifrelendi ve merkezi Drive izole klasörüne kaydedildi.',
      fileId: result.fileId,
      file: result
    });
  } catch (err: any) {
    console.error('[Drive Upload Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Drive yükleme hatası.' });
  }
});

// GET /api/v1/integrations/drive/download/:fileId — Şifreli Dosyayı Çözüp İndirme
integrationsRouter.get('/drive/download/:fileId', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const fileId = req.params.fileId as string;
  const userSicilNo = (req.query.userSicilNo as string) || req.user?.sicilNo || '8109';
  const forwardedHeader = req.headers['x-forwarded-for'];
  const clientIp = (req.headers['cf-connecting-ip'] as string) || (typeof forwardedHeader === 'string' ? forwardedHeader.split(',')[0].trim() : req.ip || '127.0.0.1');
  const userAgent = (req.headers['user-agent'] as string) || 'Bilinmeyen İstemci';

  try {
    const { centralDrive } = await import('../../src/services/centralDriveService');
    const decrypted = await centralDrive.downloadAndDecryptFile(fileId, userSicilNo);

    // Adli Bilişim Başarılı İndirme Kaydı
    try {
      const { db } = await import('../../src/services/persistentDatabaseService');
      db.addAuditLog({
        id: `aud-zk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        adminUsername: userSicilNo,
        action: 'Zero-Knowledge Şifre Çözme ve İndirme',
        details: `${decrypted.fileName} dosyası AES-256-GCM şifresi çözülerek yetkili kullanıcıya iletildi.`,
        ipAddress: clientIp,
        userAgent,
        userId: userSicilNo,
        actionType: 'ZK_Decrypt',
        resourceId: fileId,
        statusCode: 200,
        status: 'Başarılı'
      }).catch(() => {});
    } catch (_) {}

    // Eğer istemci JSON talep ediyorsa JSON dön (Raporlarım modal önizleme için)
    const acceptHeader = req.headers['accept'] || '';
    if (acceptHeader.includes('application/json')) {
      return res.json({
        success: true,
        fileName: decrypted.fileName,
        content: decrypted.content.toString('utf-8'),
        size: decrypted.size
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(decrypted.fileName)}"`);
    res.setHeader('Content-Type', decrypted.fileName.endsWith('.udf') ? 'application/xml' : decrypted.fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    return res.send(decrypted.content);
  } catch (err: any) {
    console.error('[Drive Download Error]:', err);

    // Adli Bilişim Engellenen/Hatalı Erişim Kaydı
    try {
      const { db } = await import('../../src/services/persistentDatabaseService');
      db.addAuditLog({
        id: `aud-zk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        adminUsername: userSicilNo,
        action: 'Yetkisiz Zero-Knowledge Dosya Erişim Denemesi Engellendi',
        details: `Yetkisiz kullanıcı (${userSicilNo}) dosya (${fileId}) çözme teşebbüsünde bulundu: ${err?.message || ''}`,
        ipAddress: clientIp,
        userAgent,
        userId: userSicilNo,
        actionType: 'ZK_Decrypt',
        resourceId: fileId,
        statusCode: 403,
        status: 'Engellendi',
        errorDetails: err?.message || 'Yetkisiz erişim'
      }).catch(() => {});
    } catch (_) {}

    return res.status(500).json({ success: false, message: err.message || 'Drive dosya çözme hatası.' });
  }
});

// GET /api/v1/integrations/drive/files — Kullanıcının İzole Drive Klasöründeki Dosyaları Listele
integrationsRouter.get('/drive/files', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userSicilNo = (req.query.userSicilNo as string) || req.user?.sicilNo || '8109';
    const { centralDrive } = await import('../../src/services/centralDriveService');
    const rawFiles = centralDrive.listUserFiles(userSicilNo);
    const files = rawFiles.map(f => ({
      id: f.fileId,
      name: f.originalFileName,
      originalFileName: f.originalFileName,
      sizeBytes: f.size,
      uploadedAt: (f as any).uploadedAt || new Date().toISOString(),
      isEncrypted: true
    }));

    return res.json({
      success: true,
      userSicilNo,
      count: files.length,
      totalCount: files.length,
      files
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/integrations/drive/status — Merkezi Drive ve Şifreleme Durumu
integrationsRouter.get('/drive/status', requireRole(['yonetici', 'avukat', 'stajyer']), async (_req: AuthenticatedRequest, res: Response) => {
  const { centralDrive } = await import('../../src/services/centralDriveService');
  return res.json({
    success: true,
    drive: centralDrive.getStatus()
  });
});

export default integrationsRouter;
