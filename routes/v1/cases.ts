import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac.ts';
import { db } from '../../src/services/persistentDatabaseService.ts';
import { centralDrive } from '../../src/services/centralDriveService.ts';
import { SecureExportService } from '../../src/services/secureExportService.ts';
import { writeAudit } from '../../src/services/auditService.ts';

export const casesRouter = Router();

// Parçalı yükleme geçici alanı: parçalar DİSKE DAİMA ŞİFRELİ yazılır, düz metin kalmaz.
const CHUNK_TEMP_DIR = path.resolve(process.cwd(), 'uploads', 'chunks');
if (!fs.existsSync(CHUNK_TEMP_DIR)) {
  fs.mkdirSync(CHUNK_TEMP_DIR, { recursive: true });
}

const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_CHUNKS = 400;
const UPLOAD_ID_RE = /^upl-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface UploadSession {
  owner: string;
  fileName: string;
  totalChunks: number;
  totalSize: number;
  caseId?: string;
}
const uploadSessions = new Map<string, UploadSession>();

export interface ExtendedCase {
  id: string;
  clientId: string;
  clientName: string;
  lawyerSicilNo: string;
  caseTitle: string;
  caseType: string;
  courtName: string;
  esasNo: string;
  kararNo?: string;
  plaintiff: string;
  defendant: string;
  assignedLawyer: string;
  roleInCase: string;
  stage: string;
  claimAmount: number;
  currency: string;
  nextHearingDate?: string;
  nextHearingTime?: string;
  criticalDeadlineDate?: string;
  criticalDeadlineDescription?: string;
  status: 'Açık' | 'Derdest' | 'Karara Çıktı' | 'İstinafta' | 'Arşivlendi';
  riskScore: number;
  winningProbability: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapDbRowToCase(r: any): ExtendedCase {
  return {
    id: r.id,
    clientId: r.client_id || '',
    clientName: r.plaintiff || '',
    lawyerSicilNo: r.lawyer_sicil_no || '',
    caseTitle: r.case_title,
    caseType: r.case_type || '',
    courtName: r.court_name,
    esasNo: r.esas_no,
    kararNo: r.karar_no || undefined,
    plaintiff: r.plaintiff || '',
    defendant: r.defendant || '',
    assignedLawyer: r.assigned_lawyer || '',
    roleInCase: r.role_in_case || '',
    stage: r.stage || '',
    claimAmount: parseFloat(r.claim_amount || '0'),
    currency: r.currency || 'TRY',
    nextHearingDate: r.next_hearing_date ? new Date(r.next_hearing_date).toISOString().split('T')[0] : undefined,
    nextHearingTime: r.next_hearing_time || undefined,
    criticalDeadlineDate: r.critical_deadline_date ? new Date(r.critical_deadline_date).toISOString().split('T')[0] : undefined,
    criticalDeadlineDescription: r.critical_deadline_description || undefined,
    status: (r.status as any) || 'Açık',
    riskScore: r.risk_score ?? 0,
    winningProbability: r.winning_probability ?? 0,
    isArchived: r.is_archived || false,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
  };
}

function dbUnavailable(res: Response) {
  return res.status(503).json({
    success: false,
    message: 'Veritabanı bağlantısı aktif değil (DATABASE_URL). Dava verileri yalnızca kalıcı veritabanında tutulur.'
  });
}

// ============================================================
// CHUNKED UPLOAD (50MB+ Payload & Zero-Timeout) — şifreli, sahibe bağlı
// ============================================================

async function resolveSession(uploadId: string, owner: string): Promise<UploadSession | null> {
  if (!UPLOAD_ID_RE.test(uploadId)) return null;
  const s = uploadSessions.get(uploadId);
  if (s) return s.owner === owner ? s : null;
  return null;
}

function chunkPath(uploadId: string, idx: number): string {
  return path.join(CHUNK_TEMP_DIR, uploadId, `chunk_${idx}.enc`);
}

// 1. POST /api/v1/cases/upload-chunk/init
casesRouter.post('/upload-chunk/init', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, fileType, totalSize, totalChunks, caseId } = req.body;
    const size = Number(totalSize);
    const chunks = Number(totalChunks);
    if (!fileName || !Number.isFinite(size) || !Number.isInteger(chunks) || chunks < 1 || size < 1) {
      return res.status(400).json({ success: false, message: 'fileName, totalSize ve totalChunks parametreleri zorunludur.' });
    }
    if (size > MAX_TOTAL_BYTES || chunks > MAX_CHUNKS) {
      return res.status(413).json({ success: false, message: `Dosya sınırı aşıldı (en fazla ${MAX_TOTAL_BYTES / 1024 / 1024}MB, ${MAX_CHUNKS} parça).` });
    }

    const owner = req.user!.sicilNo;
    const uploadId = `upl-${crypto.randomUUID()}`;
    fs.mkdirSync(path.join(CHUNK_TEMP_DIR, uploadId), { recursive: true });
    uploadSessions.set(uploadId, {
      owner,
      fileName: path.basename(String(fileName)),
      totalChunks: chunks,
      totalSize: size,
      caseId: typeof caseId === 'string' ? caseId : undefined
    });

    const sql = db.getSql();
    if (sql) {
      await sql`
        INSERT INTO chunked_uploads (id, file_name, file_type, total_size, total_chunks, uploaded_chunks, status, case_id, lawyer_sicil_no, created_at, updated_at)
        VALUES (${uploadId}, ${path.basename(String(fileName))}, ${fileType || 'application/octet-stream'}, ${size}, ${chunks}, 0, 'uploading', ${caseId || null}, ${owner}, NOW(), NOW())
      `;
    }

    await writeAudit(req, {
      action: 'Parçalı Evrak Yükleme Başlatıldı',
      details: `${path.basename(String(fileName))} (${size} bayt, ${chunks} parça)`,
      actionType: 'File_Upload',
      resourceId: uploadId
    });

    return res.json({ success: true, message: 'Parçalı yükleme oturumu oluşturuldu.', uploadId, totalChunks: chunks, totalSize: size });
  } catch (err: any) {
    console.error('[Upload Chunk Init Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Parçalı yükleme başlatılamadı.' });
  }
});

// 2. POST /api/v1/cases/upload-chunk
casesRouter.post('/upload-chunk', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uploadId, chunkIndex, chunkData } = req.body;
    const owner = req.user!.sicilNo;
    const idx = Number(chunkIndex);

    const session = await resolveSession(String(uploadId || ''), owner);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Yükleme oturumu bulunamadı.' });
    }
    if (!Number.isInteger(idx) || idx < 0 || idx >= session.totalChunks || chunkData === undefined || chunkData === null) {
      return res.status(400).json({ success: false, message: 'Geçerli chunkIndex ve chunkData zorunludur.' });
    }

    let buffer: Buffer;
    if (typeof chunkData === 'string') {
      const b64 = chunkData.startsWith('data:') ? (chunkData.split(',')[1] || '') : chunkData;
      buffer = Buffer.from(b64, 'base64');
    } else {
      buffer = Buffer.from(chunkData);
    }

    // Parça diskte şifreli saklanır (sahip anahtarı + uploadId:idx AAD)
    const enc = SecureExportService.encrypt(buffer, owner, `${uploadId}:${idx}`);
    fs.writeFileSync(chunkPath(uploadId, idx), JSON.stringify(enc), 'utf-8');

    const uploaded = fs.readdirSync(path.join(CHUNK_TEMP_DIR, uploadId)).length;

    const sql = db.getSql();
    if (sql) {
      await sql`
        INSERT INTO upload_chunks (id, upload_id, chunk_index, chunk_size, chunk_data, created_at)
        VALUES (${`${uploadId}-${idx}`}, ${uploadId}, ${idx}, ${buffer.length}, ${''}, NOW())
        ON CONFLICT (upload_id, chunk_index) DO UPDATE SET chunk_size = EXCLUDED.chunk_size
      `;
      await sql`UPDATE chunked_uploads SET uploaded_chunks = ${uploaded}, updated_at = NOW() WHERE id = ${uploadId} AND lawyer_sicil_no = ${owner}`;
    }

    return res.json({ success: true, message: `Parça ${idx} kaydedildi.`, uploadId, chunkIndex: idx, uploadedChunks: uploaded });
  } catch (err: any) {
    console.error('[Upload Chunk Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Parça yüklenemedi.' });
  }
});

// 3. POST /api/v1/cases/upload-chunk/complete — birleştir, şifreli kasaya aktar, geçici parçaları sil
casesRouter.post('/upload-chunk/complete', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const { uploadId, caseId } = req.body;
  const owner = req.user!.sicilNo;
  const sessionDir = path.join(CHUNK_TEMP_DIR, String(uploadId || ''));

  try {
    const session = await resolveSession(String(uploadId || ''), owner);
    if (!session || !fs.existsSync(sessionDir)) {
      return res.status(404).json({ success: false, message: 'Yükleme oturumu bulunamadı.' });
    }

    const parts: Buffer[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const p = chunkPath(uploadId, i);
      if (!fs.existsSync(p)) {
        return res.status(409).json({ success: false, message: `Eksik parça: ${i}. Yükleme tamamlanamadı.` });
      }
      const enc = JSON.parse(fs.readFileSync(p, 'utf-8'));
      parts.push(SecureExportService.decrypt(enc, owner, `${uploadId}:${i}`));
    }
    const whole = Buffer.concat(parts);

    if (whole.length !== session.totalSize) {
      return res.status(422).json({
        success: false,
        message: `Boyut uyuşmazlığı: beklenen ${session.totalSize}, alınan ${whole.length} bayt.`
      });
    }

    const stored = await centralDrive.uploadEncryptedFile(session.fileName, whole, owner);

    // Geçici şifreli parçaları temizle
    fs.rmSync(sessionDir, { recursive: true, force: true });
    uploadSessions.delete(uploadId);

    const sql = db.getSql();
    if (sql) {
      await sql`UPDATE chunked_uploads SET status = 'completed', file_path = ${`vault://${stored.fileId}`}, updated_at = NOW() WHERE id = ${uploadId} AND lawyer_sicil_no = ${owner}`;
    }

    await writeAudit(req, {
      action: 'Evrak Yüklendi ve AES-256 ile Şifrelendi',
      details: `${stored.originalFileName} (${stored.size} bayt) -> ${stored.cloudProvider}, sha256=${stored.sha256}`,
      actionType: 'File_Upload',
      resourceId: stored.fileId,
      meta: { caseId: caseId || session.caseId || null }
    });

    return res.json({
      success: true,
      message: 'Dosya birleştirildi, doğrulandı ve size özel şifreli kasaya kaydedildi.',
      fileId: stored.fileId,
      uploadId,
      fileName: stored.originalFileName,
      totalSize: stored.size,
      sha256: stored.sha256,
      filePath: `vault://${stored.fileId}`
    });
  } catch (err: any) {
    console.error('[Upload Chunk Complete Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Dosya birleştirilemedi.' });
  }
});

// 4. GET /api/v1/cases/upload-chunk/status/:uploadId
casesRouter.get('/upload-chunk/status/:uploadId', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uploadId = req.params.uploadId as string;
    const owner = req.user!.sicilNo;
    if (!UPLOAD_ID_RE.test(uploadId)) {
      return res.status(404).json({ success: false, message: 'Yükleme oturumu bulunamadı.' });
    }

    const sql = db.getSql();
    if (sql) {
      const rows = await sql`SELECT * FROM chunked_uploads WHERE id = ${uploadId} AND lawyer_sicil_no = ${owner}`;
      if (rows.length > 0) {
        const u = rows[0];
        return res.json({
          success: true,
          uploadId: u.id,
          fileName: u.file_name,
          totalSize: Number(u.total_size),
          totalChunks: u.total_chunks,
          uploadedChunks: u.uploaded_chunks,
          status: u.status
        });
      }
    }

    const session = await resolveSession(uploadId, owner);
    const dir = path.join(CHUNK_TEMP_DIR, uploadId);
    if (session && fs.existsSync(dir)) {
      return res.json({
        success: true,
        uploadId,
        totalChunks: session.totalChunks,
        uploadedChunks: fs.readdirSync(dir).length,
        status: 'uploading'
      });
    }
    return res.status(404).json({ success: false, message: 'Yükleme oturumu bulunamadı.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DAVA CRUD (Neon PostgreSQL) — her sorgu oturumdaki avukatın sicil numarasıyla kısıtlıdır
// ============================================================

// GET /api/v1/cases/audit-logs — kullanıcının kendi denetim kayıtları
casesRouter.get('/audit-logs', requireRole(['yonetici', 'avukat', 'stajyer']), (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 200);
  const owner = req.user!.sicilNo;
  const { logs } = db.getFilteredAuditLogs({ limit: 1000 });
  const mine = logs.filter(l => l.userId === owner || l.adminUsername === owner).slice(0, limit);
  return res.json({
    success: true,
    logs: mine.map(l => ({ ...l, action: l.action }))
  });
});

// GET /api/v1/cases — Dava Listesi
casesRouter.get('/', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const { search, status, caseType } = req.query;
  const owner = req.user!.sicilNo;
  const sql = db.getSql();
  if (!sql) return dbUnavailable(res);

  try {
    const rows = await sql`
      SELECT * FROM cases_extended
      WHERE is_archived = false AND lawyer_sicil_no = ${owner}
      ORDER BY created_at DESC
    `;
    let results: ExtendedCase[] = rows.map(mapDbRowToCase);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.caseTitle.toLowerCase().includes(q) ||
          c.esasNo.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          c.courtName.toLowerCase().includes(q)
      );
    }
    if (status && typeof status === 'string') results = results.filter((c) => c.status === status);
    if (caseType && typeof caseType === 'string') results = results.filter((c) => c.caseType === caseType);

    return res.json({ success: true, totalCount: results.length, cases: results, source: 'Neon PostgreSQL' });
  } catch (err: any) {
    console.error('[Cases GET] Neon SQL hatası:', err?.message);
    return res.status(500).json({ success: false, message: 'Dava listesi okunamadı.' });
  }
});

// GET /api/v1/cases/analytics/summary — KPI özeti (yalnızca kendi davaları)
casesRouter.get('/analytics/summary', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const owner = req.user!.sicilNo;
  const sql = db.getSql();
  if (!sql) return dbUnavailable(res);
  try {
    const rows = await sql`SELECT * FROM cases_extended WHERE lawyer_sicil_no = ${owner}`;
    const all = rows.map(mapDbRowToCase);
    const total = all.length;
    return res.json({
      success: true,
      summary: {
        totalCases: total,
        activeCases: all.filter((c) => !c.isArchived).length,
        totalClaimAmountTRY: all.reduce((sum, c) => sum + c.claimAmount, 0),
        averageWinningProbability: total ? Math.round(all.reduce((s, c) => s + c.winningProbability, 0) / total) : 0,
        upcomingHearingsCount: all.filter((c) => c.nextHearingDate).length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Özet okunamadı.' });
  }
});

// GET /api/v1/cases/:id — Dava Detayı
casesRouter.get('/:id', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.params.id as string;
  const owner = req.user!.sicilNo;
  const sql = db.getSql();
  if (!sql) return dbUnavailable(res);
  try {
    const rows = await sql`SELECT * FROM cases_extended WHERE id = ${caseId} AND lawyer_sicil_no = ${owner}`;
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dava dosyası bulunamadı.' });
    }
    return res.json({ success: true, case: mapDbRowToCase(rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Dava okunamadı.' });
  }
});

// POST /api/v1/cases — Yeni Dava Açma
casesRouter.post('/', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const { caseTitle, caseType, courtName, esasNo, clientName, plaintiff, defendant, claimAmount } = req.body;
  if (!caseTitle || !esasNo) {
    return res.status(400).json({ success: false, message: 'Dava başlığı ve Esas No zorunludur.' });
  }
  const sql = db.getSql();
  if (!sql) return dbUnavailable(res);

  const owner = req.user!.sicilNo;
  const id = `case-${crypto.randomUUID()}`;
  const clientId = `cli-${crypto.randomUUID()}`;
  try {
    await sql`
      INSERT INTO cases_extended (
        id, client_id, lawyer_sicil_no, case_title, case_type, court_name, esas_no,
        plaintiff, defendant, assigned_lawyer, role_in_case, stage, claim_amount,
        currency, status, risk_score, winning_probability, is_archived, created_at, updated_at
      ) VALUES (
        ${id}, ${clientId}, ${owner}, ${caseTitle}, ${caseType || ''}, ${courtName || ''}, ${esasNo},
        ${plaintiff || clientName || ''}, ${defendant || ''}, ${req.user!.fullName}, ${''}, ${'Dava Açılışı'},
        ${parseFloat(claimAmount) || 0}, ${'TRY'}, ${'Açık'}, ${0}, ${0}, false, NOW(), NOW()
      )`;
    const rows = await sql`SELECT * FROM cases_extended WHERE id = ${id} AND lawyer_sicil_no = ${owner}`;
    await writeAudit(req, { action: 'Dava Dosyası Açıldı', details: `${caseTitle} (${esasNo})`, actionType: 'Case_Create', resourceId: id });
    return res.status(201).json({ success: true, message: 'Dava dosyası açıldı.', case: mapDbRowToCase(rows[0]) });
  } catch (err: any) {
    console.error('[Cases POST] Neon SQL kayıt hatası:', err?.message);
    return res.status(500).json({ success: false, message: 'Dava kaydedilemedi.' });
  }
});

// PUT /api/v1/cases/:id — Dava Güncelleme (alan beyaz listesi + sahip kontrolü)
const UPDATABLE_COLUMNS: Record<string, string> = {
  caseTitle: 'case_title', caseType: 'case_type', courtName: 'court_name', esasNo: 'esas_no',
  plaintiff: 'plaintiff', defendant: 'defendant', stage: 'stage', status: 'status',
  claimAmount: 'claim_amount', nextHearingDate: 'next_hearing_date', nextHearingTime: 'next_hearing_time',
  criticalDeadlineDate: 'critical_deadline_date', criticalDeadlineDescription: 'critical_deadline_description',
  riskScore: 'risk_score', winningProbability: 'winning_probability', isArchived: 'is_archived'
};

casesRouter.put('/:id', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.params.id as string;
  const owner = req.user!.sicilNo;
  if (!db.getSql()) return dbUnavailable(res);

  const sets: string[] = [];
  const params: any[] = [];
  for (const [key, col] of Object.entries(UPDATABLE_COLUMNS)) {
    if (req.body[key] !== undefined) {
      params.push(key === 'claimAmount' ? parseFloat(req.body[key]) || 0 : req.body[key]);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (sets.length === 0) {
    return res.status(400).json({ success: false, message: 'Güncellenecek geçerli alan bulunamadı.' });
  }

  try {
    params.push(caseId, owner);
    const rows = await db.query(
      `UPDATE cases_extended SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length - 1} AND lawyer_sicil_no = $${params.length} RETURNING *`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dava dosyası bulunamadı.' });
    }
    await writeAudit(req, { action: 'Dava Dosyası Güncellendi', details: `Alanlar: ${Object.keys(req.body).filter(k => k in UPDATABLE_COLUMNS).join(', ')}`, actionType: 'Case_Update', resourceId: caseId });
    return res.json({ success: true, message: 'Dava dosyası güncellendi.', case: mapDbRowToCase(rows[0]) });
  } catch (err: any) {
    console.error('[Cases PUT] hata:', err?.message);
    return res.status(500).json({ success: false, message: 'Dava güncellenemedi.' });
  }
});
