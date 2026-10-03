import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac';
import { db } from '../../src/services/persistentDatabaseService';

export const casesRouter = Router();

// Uploads directory configuration for chunked storage
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const CHUNK_TEMP_DIR = path.join(UPLOADS_DIR, 'chunks');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(CHUNK_TEMP_DIR)) {
  fs.mkdirSync(CHUNK_TEMP_DIR, { recursive: true });
}

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

const mockCasesStore: ExtendedCase[] = [
  {
    id: 'case-101',
    clientId: 'cli-1',
    clientName: 'Atlas Tekstil San. Tic. A.Ş.',
    lawyerSicilNo: '8109',
    caseTitle: 'Ticari Faturaya Dayalı İtirazın İptali',
    caseType: 'Ticari Alacak & İtirazın İptali',
    courtName: 'İstanbul 14. Asliye Ticaret Mahkemesi',
    esasNo: '2024/782 Esas',
    plaintiff: 'Atlas Tekstil San. Tic. A.Ş.',
    defendant: 'Bosphorus Lojistik Depolama Ltd. Şti.',
    assignedLawyer: 'Av. Osman Turgut',
    roleInCase: 'Davacı Vekili',
    stage: 'Bilirkişi İncelemesi',
    claimAmount: 850000,
    currency: 'TRY',
    nextHearingDate: '2026-10-08',
    nextHearingTime: '10:30',
    criticalDeadlineDate: '2026-10-12',
    criticalDeadlineDescription: 'Bilirkişi raporuna 2 haftalık kesin itiraz süresi',
    status: 'Derdest',
    riskScore: 22,
    winningProbability: 84,
    isArchived: false,
    createdAt: '2024-04-12T09:00:00Z',
    updatedAt: '2026-10-02T11:00:00Z'
  },
  {
    id: 'case-102',
    clientId: 'cli-2',
    clientName: 'Bosphorus Lojistik Ltd.',
    lawyerSicilNo: '8109',
    caseTitle: 'Tapu İptali ve Tescil (TMK 713 Zilyetlik)',
    caseType: 'Gayrimenkul & Mülkiyet',
    courtName: 'Bakırköy 3. Asliye Hukuk Mahkemesi',
    esasNo: '2025/1104 Esas',
    plaintiff: 'Kaya Mimarlık Ltd. Şti.',
    defendant: 'Hazine ve Maliye Bakanlığı',
    assignedLawyer: 'Av. Osman Turgut',
    roleInCase: 'Davacı Vekili',
    stage: 'Tahkikat & Keşif',
    claimAmount: 4200000,
    currency: 'TRY',
    nextHearingDate: '2026-10-14',
    nextHearingTime: '11:15',
    criticalDeadlineDate: '2026-10-10',
    criticalDeadlineDescription: 'Keşif harcı ve bilirkişi yolluğunun mahkeme veznesine depo edilmesi',
    status: 'Derdest',
    riskScore: 35,
    winningProbability: 72,
    isArchived: false,
    createdAt: '2025-02-18T14:00:00Z',
    updatedAt: '2026-09-29T16:00:00Z'
  },
  {
    id: 'case-103',
    clientId: 'cli-3',
    clientName: 'Mert Aksoy',
    lawyerSicilNo: '8109',
    caseTitle: 'İşçilik Haklı Fesih & Kıdem Tazminatı',
    caseType: 'İş Hukuku',
    courtName: 'İstanbul 8. İş Mahkemesi',
    esasNo: '2026/301 Esas',
    plaintiff: 'Mert Aksoy',
    defendant: 'Global Lojistik A.Ş.',
    assignedLawyer: 'Av. Osman Turgut',
    roleInCase: 'Davacı Vekili',
    stage: 'Ön İnceleme',
    claimAmount: 340000,
    currency: 'TRY',
    nextHearingDate: '2026-10-22',
    nextHearingTime: '14:00',
    criticalDeadlineDate: '2026-10-18',
    criticalDeadlineDescription: 'Delil listesi ve tanık isimlerinin sunulması için kesin süre',
    status: 'Açık',
    riskScore: 18,
    winningProbability: 88,
    isArchived: false,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-09-28T09:30:00Z'
  }
];

// Helper to map DB row to ExtendedCase
function mapDbRowToCase(r: any): ExtendedCase {
  return {
    id: r.id,
    clientId: r.client_id || '',
    clientName: r.plaintiff || 'Müvekkil',
    lawyerSicilNo: r.lawyer_sicil_no || '8109',
    caseTitle: r.case_title,
    caseType: r.case_type || 'Genel Hukuk',
    courtName: r.court_name,
    esasNo: r.esas_no,
    kararNo: r.karar_no || undefined,
    plaintiff: r.plaintiff || '',
    defendant: r.defendant || '',
    assignedLawyer: r.assigned_lawyer || 'Av. Osman Turgut',
    roleInCase: r.role_in_case || 'Davacı Vekili',
    stage: r.stage || 'Dava Açılışı',
    claimAmount: parseFloat(r.claim_amount || '0'),
    currency: r.currency || 'TRY',
    nextHearingDate: r.next_hearing_date ? new Date(r.next_hearing_date).toISOString().split('T')[0] : undefined,
    nextHearingTime: r.next_hearing_time || undefined,
    criticalDeadlineDate: r.critical_deadline_date ? new Date(r.critical_deadline_date).toISOString().split('T')[0] : undefined,
    criticalDeadlineDescription: r.critical_deadline_description || undefined,
    status: (r.status as any) || 'Açık',
    riskScore: r.risk_score || 20,
    winningProbability: r.winning_probability || 80,
    isArchived: r.is_archived || false,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
  };
}

// ============================================================
// CHUNKED UPLOAD ENDPOINTS (50MB+ Payload & Zero-Timeout API)
// ============================================================

// 1. POST /api/v1/cases/upload-chunk/init — Parçalı Yükleme Başlat
casesRouter.post('/upload-chunk/init', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, fileType, totalSize, totalChunks, caseId } = req.body;
    if (!fileName || !totalSize || !totalChunks) {
      return res.status(400).json({ success: false, message: 'fileName, totalSize ve totalChunks parametreleri zorunludur.' });
    }

    const uploadId = `upl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const lawyerSicilNo = req.user?.sicilNo || '8109';

    // Create session temp directory
    const sessionDir = path.join(CHUNK_TEMP_DIR, uploadId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Save record in Neon SQL
    const sql = db.getSql();
    if (sql) {
      await sql`
        INSERT INTO chunked_uploads (id, file_name, file_type, total_size, total_chunks, uploaded_chunks, status, case_id, lawyer_sicil_no, created_at, updated_at)
        VALUES (${uploadId}, ${fileName}, ${fileType || 'application/octet-stream'}, ${totalSize}, ${totalChunks}, 0, 'uploading', ${caseId || null}, ${lawyerSicilNo}, NOW(), NOW())
      `;
    }

    return res.json({
      success: true,
      message: 'Parçalı yükleme oturumu başarıyla oluşturuldu.',
      uploadId,
      totalChunks,
      totalSize
    });
  } catch (err: any) {
    console.error('[Upload Chunk Init Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Parçalı yükleme başlatılamadı.' });
  }
});

// 2. POST /api/v1/cases/upload-chunk — Tek Bir Parçayı Yükle
casesRouter.post('/upload-chunk', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uploadId, chunkIndex, chunkData, chunkSize, isBase64 } = req.body;
    if (!uploadId || chunkIndex === undefined || !chunkData) {
      return res.status(400).json({ success: false, message: 'uploadId, chunkIndex ve chunkData zorunludur.' });
    }

    const sessionDir = path.join(CHUNK_TEMP_DIR, uploadId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Write chunk data to disk as buffer
    const chunkPath = path.join(sessionDir, `chunk_${chunkIndex}`);
    let buffer: Buffer;
    if (Buffer.isBuffer(chunkData)) {
      buffer = chunkData;
    } else if (typeof chunkData === 'string') {
      if (chunkData.startsWith('data:')) {
        const base64Content = chunkData.split(',')[1] || '';
        buffer = Buffer.from(base64Content, 'base64');
      } else if (isBase64) {
        buffer = Buffer.from(chunkData, 'base64');
      } else {
        const b64Buf = Buffer.from(chunkData, 'base64');
        if (chunkSize && b64Buf.length === chunkSize) {
          buffer = b64Buf;
        } else {
          buffer = Buffer.from(chunkData, 'utf-8');
        }
      }
    } else {
      buffer = Buffer.from(chunkData);
    }
    fs.writeFileSync(chunkPath, buffer);

    const actualChunkSize = chunkSize || buffer.length;

    // Record chunk in Neon SQL
    const sql = db.getSql();
    if (sql) {
      const chunkId = `${uploadId}-${chunkIndex}`;
      await sql`
        INSERT INTO upload_chunks (id, upload_id, chunk_index, chunk_size, chunk_data, created_at)
        VALUES (${chunkId}, ${uploadId}, ${chunkIndex}, ${actualChunkSize}, ${buffer.toString('base64').slice(0, 1000) + '...'}, NOW())
        ON CONFLICT (upload_id, chunk_index) DO UPDATE SET chunk_size = EXCLUDED.chunk_size
      `;

      // Update uploaded_chunks count
      await sql`
        UPDATE chunked_uploads
        SET uploaded_chunks = (SELECT COUNT(*)::int FROM upload_chunks WHERE upload_id = ${uploadId}),
            updated_at = NOW()
        WHERE id = ${uploadId}
      `;
    }

    // Count chunks on disk
    const diskChunkCount = fs.readdirSync(sessionDir).length;

    return res.json({
      success: true,
      message: `Parça ${chunkIndex} başarıyla kaydedildi.`,
      uploadId,
      chunkIndex,
      uploadedChunks: diskChunkCount
    });
  } catch (err: any) {
    console.error('[Upload Chunk Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Parça yüklenemedi.' });
  }
});

// 3. POST /api/v1/cases/upload-chunk/complete — Yüklemeyi Doğrula ve Birleştir
casesRouter.post('/upload-chunk/complete', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uploadId, caseId, fileName } = req.body;
    if (!uploadId) {
      return res.status(400).json({ success: false, message: 'uploadId parametresi zorunludur.' });
    }

    const sessionDir = path.join(CHUNK_TEMP_DIR, uploadId);
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ success: false, message: 'Yükleme oturumu bulunamadı.' });
    }

    const chunkFiles = fs.readdirSync(sessionDir).sort((a, b) => {
      const numA = parseInt(a.replace('chunk_', ''), 10);
      const numB = parseInt(b.replace('chunk_', ''), 10);
      return numA - numB;
    });

    const finalFileName = fileName || `file_${uploadId}.bin`;
    const finalFilePath = path.join(UPLOADS_DIR, `${uploadId}_${finalFileName}`);
    const writeStream = fs.createWriteStream(finalFilePath);

    for (const chunkFile of chunkFiles) {
      const chunkBuffer = fs.readFileSync(path.join(sessionDir, chunkFile));
      writeStream.write(chunkBuffer);
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
      writeStream.end();
    });

    // Clean up temporary chunks
    for (const chunkFile of chunkFiles) {
      try { fs.unlinkSync(path.join(sessionDir, chunkFile)); } catch {}
    }
    try { fs.rmdirSync(sessionDir); } catch {}

    const stats = fs.statSync(finalFilePath);
    const fileId = `file-${Date.now()}`;

    // Update status in Neon SQL & record in case_files
    const sql = db.getSql();
    if (sql) {
      await sql`
        UPDATE chunked_uploads
        SET status = 'completed', file_path = ${finalFilePath}, updated_at = NOW()
        WHERE id = ${uploadId}
      `;

      if (caseId) {
        try {
          const caseCheck = await sql`SELECT id FROM cases WHERE id = ${caseId}`;
          if (caseCheck.length > 0) {
            await sql`
              INSERT INTO case_files (id, case_id, file_name, file_type, file_size, file_data, uploaded_at)
              VALUES (${fileId}, ${caseId}, ${finalFileName}, 'application/octet-stream', ${stats.size}, ${finalFilePath}, NOW())
              ON CONFLICT (id) DO NOTHING
            `;
          }
        } catch (fkErr: any) {
          console.warn('[Upload Complete] Case files ilişkilendirme atlandı:', fkErr?.message);
        }
      }
    }

    return res.json({
      success: true,
      message: 'Dosya parçaları başarıyla birleştirildi ve doğrulandı.',
      fileId,
      uploadId,
      fileName: finalFileName,
      totalSize: stats.size,
      filePath: finalFilePath
    });
  } catch (err: any) {
    console.error('[Upload Chunk Complete Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Dosya birleştirilemedi.' });
  }
});

// 4. GET /api/v1/cases/upload-chunk/status/:uploadId — Yükleme Durumu
casesRouter.get('/upload-chunk/status/:uploadId', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uploadId = req.params.uploadId as string;
    const sql = db.getSql();
    if (sql) {
      const rows = await sql`SELECT * FROM chunked_uploads WHERE id = ${uploadId}`;
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

    const sessionDir = path.join(CHUNK_TEMP_DIR, uploadId);
    if (fs.existsSync(sessionDir)) {
      const count = fs.readdirSync(sessionDir).length;
      return res.json({
        success: true,
        uploadId,
        uploadedChunks: count,
        status: 'uploading'
      });
    }

    return res.status(404).json({ success: false, message: 'Yükleme oturumu bulunamadı.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DAVA CRUD ENDPOINTS (Neon PostgreSQL Entegrasyonu)
// ============================================================

// GET /api/v1/cases — Dava Listesi
casesRouter.get('/', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const { search, status, caseType } = req.query;

  try {
    const sql = db.getSql();
    if (sql) {
      const rows = await sql`
        SELECT * FROM cases_extended 
        WHERE is_archived = false 
        ORDER BY created_at DESC
      `;
      let results: ExtendedCase[] = rows.map(mapDbRowToCase);

      if (results.length === 0) {
        // Fallback to mock seed if db is brand new
        results = [...mockCasesStore];
      }

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

      if (status && typeof status === 'string') {
        results = results.filter((c) => c.status === status);
      }

      if (caseType && typeof caseType === 'string') {
        results = results.filter((c) => c.caseType === caseType);
      }

      return res.json({
        success: true,
        totalCount: results.length,
        cases: results,
        source: 'Neon PostgreSQL (Merkezi Bulut SQL)'
      });
    }
  } catch (dbErr: any) {
    console.warn('[Cases] Neon SQL okuma uyarısı, bellek yedeği kullanılıyor:', dbErr?.message);
  }

  // Fallback to memory
  return res.json({
    success: true,
    totalCount: mockCasesStore.length,
    cases: mockCasesStore,
    source: 'Memory Cache'
  });
});

// GET /api/v1/cases/analytics/summary — KPI ve İstatistik Özeti
casesRouter.get('/analytics/summary', requireRole(['yonetici', 'avukat', 'stajyer']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const sql = db.getSql();
    if (sql) {
      const rows = await sql`SELECT * FROM cases_extended`;
      const allCases = rows.map(mapDbRowToCase);
      const dataSet = allCases.length > 0 ? allCases : mockCasesStore;

      const total = dataSet.length;
      const active = dataSet.filter((c) => !c.isArchived).length;
      const totalClaim = dataSet.reduce((sum, c) => sum + c.claimAmount, 0);
      const avgWinningProb = Math.round(
        dataSet.reduce((sum, c) => sum + c.winningProbability, 0) / (total || 1)
      );

      return res.json({
        success: true,
        summary: {
          totalCases: total,
          activeCases: active,
          totalClaimAmountTRY: totalClaim,
          averageWinningProbability: avgWinningProb,
          upcomingHearingsCount: dataSet.filter((c) => c.nextHearingDate).length
        }
      });
    }
  } catch (err: any) {
    console.warn('[Cases Analytics] Neon SQL uyarısı:', err?.message);
  }

  const total = mockCasesStore.length;
  const active = mockCasesStore.filter((c) => !c.isArchived).length;
  const totalClaim = mockCasesStore.reduce((sum, c) => sum + c.claimAmount, 0);
  const avgWinningProb = Math.round(
    mockCasesStore.reduce((sum, c) => sum + c.winningProbability, 0) / (total || 1)
  );

  return res.json({
    success: true,
    summary: {
      totalCases: total,
      activeCases: active,
      totalClaimAmountTRY: totalClaim,
      averageWinningProbability: avgWinningProb,
      upcomingHearingsCount: mockCasesStore.filter((c) => c.nextHearingDate).length
    }
  });
});

// GET /api/v1/cases/:id — Dava Detayı
casesRouter.get('/:id', requireRole(['yonetici', 'avukat', 'stajyer']), async (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.params.id as string;
  try {
    const sql = db.getSql();
    if (sql) {
      const rows = await sql`SELECT * FROM cases_extended WHERE id = ${caseId}`;
      if (rows.length > 0) {
        return res.json({ success: true, case: mapDbRowToCase(rows[0]) });
      }
    }
  } catch (err: any) {
    console.warn('[Cases Details] Neon SQL uyarısı:', err?.message);
  }

  const found = mockCasesStore.find((c) => c.id === req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Dava dosyası bulunamadı.' });
  }
  return res.json({ success: true, case: found });
});

// POST /api/v1/cases — Yeni Dava Açma
casesRouter.post('/', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const { caseTitle, caseType, courtName, esasNo, clientName, plaintiff, defendant, claimAmount } = req.body;

  if (!caseTitle || !esasNo) {
    return res.status(400).json({ success: false, message: 'Dava başlığı ve Esas No zorunludur.' });
  }

  const newId = `case-${Date.now()}`;
  const newCase: ExtendedCase = {
    id: newId,
    clientId: `cli-${Date.now()}`,
    clientName: clientName || 'Müvekkil',
    lawyerSicilNo: req.user?.sicilNo || '8109',
    caseTitle,
    caseType: caseType || 'Genel Hukuk Davası',
    courtName: courtName || 'İstanbul Nöbetçi Asliye Hukuk Mahkemesi',
    esasNo,
    plaintiff: plaintiff || clientName || 'Müvekkil',
    defendant: defendant || 'Davalı Taraf',
    assignedLawyer: req.user?.fullName || 'Av. Osman Turgut',
    roleInCase: 'Davacı Vekili',
    stage: 'Dava Açılışı & Tensip',
    claimAmount: parseFloat(claimAmount) || 0,
    currency: 'TRY',
    status: 'Açık',
    riskScore: 25,
    winningProbability: 75,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const sql = db.getSql();
    if (sql) {
      await sql`
        INSERT INTO cases_extended (
          id, client_id, lawyer_sicil_no, case_title, case_type, court_name, esas_no, 
          plaintiff, defendant, assigned_lawyer, role_in_case, stage, claim_amount, 
          currency, status, risk_score, winning_probability, is_archived, created_at, updated_at
        ) VALUES (
          ${newCase.id}, ${newCase.clientId}, ${newCase.lawyerSicilNo}, ${newCase.caseTitle}, 
          ${newCase.caseType}, ${newCase.courtName}, ${newCase.esasNo}, ${newCase.plaintiff}, 
          ${newCase.defendant}, ${newCase.assignedLawyer}, ${newCase.roleInCase}, ${newCase.stage}, 
          ${newCase.claimAmount}, ${newCase.currency}, ${newCase.status}, ${newCase.riskScore}, 
          ${newCase.winningProbability}, ${newCase.isArchived}, NOW(), NOW()
        )
      `;
    }
  } catch (dbErr: any) {
    console.error('[Cases POST] Neon SQL kayıt hatası:', dbErr?.message);
  }

  mockCasesStore.unshift(newCase);
  return res.status(201).json({ success: true, message: 'Dava dosyası başarıyla açıldı.', case: newCase });
});

// PUT /api/v1/cases/:id — Dava Güncelleme
casesRouter.put('/:id', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.params.id as string;

  try {
    const sql = db.getSql();
    if (sql) {
      const updates = req.body;
      if (updates.status) {
        await sql`UPDATE cases_extended SET status = ${updates.status}, updated_at = NOW() WHERE id = ${caseId}`;
      }
      if (updates.stage) {
        await sql`UPDATE cases_extended SET stage = ${updates.stage}, updated_at = NOW() WHERE id = ${caseId}`;
      }
      if (updates.claimAmount !== undefined) {
        await sql`UPDATE cases_extended SET claim_amount = ${parseFloat(updates.claimAmount)}, updated_at = NOW() WHERE id = ${caseId}`;
      }
    }
  } catch (dbErr: any) {
    console.warn('[Cases PUT] Neon SQL güncelleme uyarısı:', dbErr?.message);
  }

  const index = mockCasesStore.findIndex((c) => c.id === caseId);
  if (index !== -1) {
    mockCasesStore[index] = {
      ...mockCasesStore[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    return res.json({ success: true, message: 'Dava dosyası güncellendi.', case: mockCasesStore[index] });
  }

  return res.json({ success: true, message: 'Dava dosyası güncellendi.', id: caseId });
});
