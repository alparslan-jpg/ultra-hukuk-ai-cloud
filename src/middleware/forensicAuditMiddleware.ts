import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, type AuditLogRecord } from '../services/persistentDatabaseService.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'ultra-hukuk-jwt-secret-key-2026';

/**
 * Adli Bilişim Düzeyinde Sistem Denetim İzi (Audit Logging) Middleware'i
 * Her gelen API isteğini yakalayarak gerçek IP, User-Agent, Kullanıcı/Sicil,
 * Oturum ID, İşlem Tipi, Milisaniye Hassasiyetli Zaman ve Durum bilgilerini SQL'e kaydeder.
 */
export function forensicAuditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // 1. İstemci Gerçek IP Adresi Tespiti (Proxy, Cloudflare, Load Balancer zinciri)
  const forwardedHeader = req.headers['x-forwarded-for'];
  let clientIp = '127.0.0.1';
  if (typeof req.headers['cf-connecting-ip'] === 'string') {
    clientIp = req.headers['cf-connecting-ip'];
  } else if (typeof forwardedHeader === 'string') {
    clientIp = forwardedHeader.split(',')[0].trim();
  } else if (typeof req.headers['x-real-ip'] === 'string') {
    clientIp = req.headers['x-real-ip'];
  } else if (req.ip) {
    clientIp = req.ip;
  } else if (req.socket?.remoteAddress) {
    clientIp = req.socket.remoteAddress;
  }
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  // 2. User-Agent (Tarayıcı, İşletim Sistemi, Cihaz)
  const userAgent = (req.headers['user-agent'] as string) || 'Bilinmeyen İstemci / API Client';

  // 3. Kullanıcı ID / Baro Sicil & Oturum (Session) ID
  let userId = (req.headers['x-lawyer-sicil'] as string) || (req.headers['x-user-id'] as string) || '';
  let sessionId = (req.headers['x-session-id'] as string) || (req.headers['x-request-id'] as string) || '';

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded) {
        userId = decoded.sicilNo || decoded.username || decoded.id || userId;
        sessionId = decoded.sessionId || decoded.jti || sessionId;
      }
    } catch (_) {
      // ignore token decode errors in middleware
    }
  }

  // Fallback session identifier
  if (!sessionId) {
    sessionId = `sess_${clientIp.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
  }

  // 4. Response tamamlandığında log kaydını asenkron oluştur (Non-blocking)
  const originalEnd = res.end;
  let logged = false;

  res.end = function (chunk?: any, encoding?: any, cb?: any): any {
    res.end = originalEnd;
    const result = originalEnd.call(this, chunk, encoding, cb);

    if (!logged) {
      logged = true;
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;
      const isError = statusCode >= 400;
      const isBlocked = statusCode === 401 || statusCode === 403;
      const status = isBlocked ? 'Engellendi' : isError ? 'Hata' : 'Başarılı';

      // Sadece API ve kritik entegrasyon yollarını kaydet (Statik asset gürültüsünü filtrele)
      const pathUrl = req.originalUrl || req.url;
      if (
        pathUrl.startsWith('/api/') &&
        !pathUrl.includes('/admin-health') &&
        !pathUrl.includes('/system-telemetry')
      ) {
        const urlLower = pathUrl.toLowerCase();
        const method = req.method.toUpperCase();

        // İşlem Tipi Tespiti (Forensic Action Types)
        let actionType = 'Genel';
        if (urlLower.includes('/login') || urlLower.includes('/auth')) {
          actionType = 'Login';
        } else if (urlLower.includes('/upload-chunk') || urlLower.includes('/upload')) {
          actionType = 'File_Upload';
        } else if (urlLower.includes('/drive/upload') || urlLower.includes('/encrypt')) {
          actionType = 'ZK_Encrypt';
        } else if (urlLower.includes('/drive/download')) {
          actionType = 'ZK_Decrypt';
        } else if (
          urlLower.includes('/ai/') ||
          urlLower.includes('/analyze') ||
          urlLower.includes('/simulate') ||
          urlLower.includes('/extract-data')
        ) {
          actionType = 'AI_Analysis';
        } else if (urlLower.includes('/export') || urlLower.includes('/udf') || urlLower.includes('/pdf')) {
          actionType = 'UDF_Export';
        } else if (method === 'DELETE' || urlLower.includes('/delete') || urlLower.includes('/sil')) {
          actionType = 'Delete';
        }

        // İlgili Dava / Evrak / Kullanıcı ID tespiti
        const resourceId =
          req.body?.caseId ||
          req.query?.caseId ||
          req.params?.caseId ||
          req.body?.uploadId ||
          req.body?.fileId ||
          req.params?.fileId ||
          req.params?.id ||
          undefined;

        const auditRecord: AuditLogRecord = {
          id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          timestamp: new Date().toISOString(),
          adminUsername: userId || 'Anonim / Sistem',
          action: `${method} ${pathUrl.split('?')[0]}`,
          details: `${method} ${pathUrl} — HTTP ${statusCode} (${durationMs}ms)`,
          ipAddress: clientIp,
          userAgent,
          userId: userId || 'Misafir',
          sessionId,
          actionType,
          resourceId: resourceId ? String(resourceId) : undefined,
          statusCode,
          status,
          errorDetails: isError ? `HTTP ${statusCode} hata yanıtı döndürüldü` : null,
        };

        db.addAuditLog(auditRecord).catch((err) => {
          console.warn('[Forensic Audit Log] SQL kayıt uyarısı:', err?.message || err);
        });
      }
    }

    return result;
  };

  next();
}
