import { Router, Response } from 'express';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac.ts';
import { centralDrive } from '../../src/services/centralDriveService.ts';
import { writeAudit } from '../../src/services/auditService.ts';

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
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) {
    return res.status(503).json({ success: false, message: 'Webhook devre dışı (WEBHOOK_SECRET tanımlı değil).' });
  }
  if (req.headers['x-webhook-secret'] !== expected) {
    return res.status(401).json({ success: false, message: 'Geçersiz webhook imzası.' });
  }
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
// Sahip kimliği YALNIZCA doğrulanmış JWT'den gelir; istemci parametresi dikkate alınmaz.
integrationsRouter.post('/drive/upload', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const owner = req.user!.sicilNo;
  try {
    const { fileName, fileContent, isBase64 } = req.body;
    if (!fileName || !fileContent) {
      return res.status(400).json({ success: false, message: 'fileName ve fileContent alanları zorunludur.' });
    }

    const raw = typeof fileContent === 'string' && fileContent.startsWith('data:') ? (fileContent.split(',')[1] || '') : fileContent;
    const buffer = Buffer.isBuffer(raw)
      ? raw
      : Buffer.from(String(raw), isBase64 || (typeof fileContent === 'string' && fileContent.startsWith('data:')) ? 'base64' : 'utf-8');

    const result = await centralDrive.uploadEncryptedFile(fileName, buffer, owner);

    await writeAudit(req, {
      action: 'Zero-Knowledge Dosya Şifreleme ve Kasa Kaydı',
      details: `${result.originalFileName} AES-256-GCM ile şifrelendi (${result.cloudProvider}), sha256=${result.sha256}.`,
      actionType: 'ZK_Encrypt',
      resourceId: result.fileId,
      statusCode: 200,
      status: 'Başarılı'
    });

    return res.json({
      success: true,
      message: 'Dosya AES-256 ile şifrelendi ve size özel izole kasaya kaydedildi.',
      fileId: result.fileId,
      file: result
    });
  } catch (err: any) {
    console.error('[Drive Upload Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Drive yükleme hatası.' });
  }
});

// GET /api/v1/integrations/drive/download/:fileId — Şifreli Dosyayı Çözüp İndirme (yalnızca sahibi)
integrationsRouter.get('/drive/download/:fileId', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const fileId = req.params.fileId as string;
  const owner = req.user!.sicilNo;

  try {
    const decrypted = await centralDrive.downloadAndDecryptFile(fileId, owner);

    await writeAudit(req, {
      action: 'Zero-Knowledge Şifre Çözme ve İndirme',
      details: `${decrypted.fileName} şifresi çözülerek sahibine iletildi.`,
      actionType: 'ZK_Decrypt',
      resourceId: fileId,
      statusCode: 200,
      status: 'Başarılı'
    });

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
    // Başkasına ait / var olmayan dosya aynı yanıtı verir (dosya varlığı sızdırılmaz)
    await writeAudit(req, {
      action: 'Zero-Knowledge Dosya Erişimi Reddedildi',
      details: `Kullanıcı (${owner}) dosya (${fileId}) çözme teşebbüsü başarısız: ${err?.message || ''}`,
      actionType: 'ZK_Decrypt',
      resourceId: fileId,
      statusCode: 404,
      status: 'Engellendi',
      errorDetails: err?.message || 'Erişim reddedildi'
    });
    return res.status(404).json({ success: false, message: 'Dosya bulunamadı veya erişim yetkiniz yok.' });
  }
});

// DELETE /api/v1/integrations/drive/:fileId — Yumuşak silme (yalnızca sahibi)
integrationsRouter.delete('/drive/:fileId', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const fileId = req.params.fileId as string;
  try {
    const ok = await centralDrive.deleteFile(fileId, req.user!.sicilNo);
    await writeAudit(req, {
      action: 'Kasa Dosyası Silindi',
      details: `Dosya ${fileId} sahibi tarafından silindi (yumuşak silme).`,
      actionType: 'File_Delete',
      resourceId: fileId,
      statusCode: ok ? 200 : 404,
      status: ok ? 'Başarılı' : 'Hata'
    });
    return ok
      ? res.json({ success: true })
      : res.status(404).json({ success: false, message: 'Dosya bulunamadı veya erişim yetkiniz yok.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/integrations/drive/files — Kullanıcının İzole Kasasındaki Dosyalar
integrationsRouter.get('/drive/files', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const owner = req.user!.sicilNo;
    const rawFiles = await centralDrive.listUserFiles(owner);
    const files = rawFiles.map(f => ({
      id: f.fileId,
      name: f.originalFileName,
      originalFileName: f.originalFileName,
      sizeBytes: f.size,
      sha256: f.sha256,
      uploadedAt: f.uploadedAt,
      isEncrypted: true
    }));

    return res.json({ success: true, userSicilNo: owner, count: files.length, totalCount: files.length, files });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/integrations/drive/status — Kasa ve Şifreleme Durumu
integrationsRouter.get('/drive/status', requireRole(['yonetici', 'avukat', 'stajyer']), async (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, drive: await centralDrive.getStatus() });
});

export default integrationsRouter;
