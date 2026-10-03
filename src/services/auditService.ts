import type { Request } from 'express';
import { db, type AuditLogRecord } from './persistentDatabaseService.ts';

// ============================================================
// ULTRA HUKUK AI — Adli Denetim İzi (Audit Trail) Yazıcı
// Tüm yazma işlemleri persistentDatabaseService.addAuditLog üzerinden
// hash-zincirli, değiştirilemez (DB tetikleyicili) tabloya gider.
// ============================================================

export function getClientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf;
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'bilinmiyor';
}

export interface AuditEntryInput {
  action: string;
  details?: string;
  actionType: string;
  resourceId?: string;
  statusCode?: number;
  status?: 'Başarılı' | 'Engellendi' | 'Hata';
  errorDetails?: string | null;
  /** Ajan/LLM etkileşimi için ek yapılandırılmış bilgi (JSON olarak details'e eklenir) */
  meta?: Record<string, unknown>;
}

/** Doğrulanmış kullanıcı kimliği ile (varsa) denetim kaydı yazar. Hata uygulamayı düşürmez. */
export async function writeAudit(req: Request & { user?: { sicilNo: string; fullName: string } }, entry: AuditEntryInput): Promise<void> {
  try {
    const user = req.user;
    const details = entry.meta
      ? `${entry.details || ''} | meta=${JSON.stringify(entry.meta).slice(0, 4000)}`
      : entry.details || '';

    const record: AuditLogRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      adminUsername: user?.sicilNo || 'anonim',
      action: entry.action,
      details,
      ipAddress: getClientIp(req),
      userAgent: (req.headers['user-agent'] as string) || 'Bilinmeyen İstemci',
      userId: user?.sicilNo || '',
      sessionId: (req.headers['x-session-id'] as string) || '',
      actionType: entry.actionType,
      resourceId: entry.resourceId || '',
      statusCode: entry.statusCode ?? 200,
      status: entry.status || 'Başarılı',
      errorDetails: entry.errorDetails ?? null
    };
    await db.addAuditLog(record);
  } catch (err: any) {
    console.warn('[AUDIT] Denetim kaydı yazılamadı:', err?.message || err);
  }
}
