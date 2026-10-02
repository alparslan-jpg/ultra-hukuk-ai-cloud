import { Router, Response } from 'express';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac';

export const casesRouter = Router();

// In-memory persistent fallback store if Neon DB is offline
interface ExtendedCase {
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

// GET /api/v1/cases — Dava Listesi
casesRouter.get('/', requireRole(['yonetici', 'avukat', 'stajyer']), (req: AuthenticatedRequest, res: Response) => {
  const { search, status, caseType } = req.query;
  let results = [...mockCasesStore];

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
    cases: results
  });
});

// GET /api/v1/cases/analytics/summary — KPI ve İstatistik Özeti
casesRouter.get('/analytics/summary', requireRole(['yonetici', 'avukat', 'stajyer']), (_req: AuthenticatedRequest, res: Response) => {
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
casesRouter.get('/:id', requireRole(['yonetici', 'avukat', 'stajyer']), (req: AuthenticatedRequest, res: Response) => {
  const found = mockCasesStore.find((c) => c.id === req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Dava dosyası bulunamadı.' });
  }
  return res.json({ success: true, case: found });
});

// POST /api/v1/cases — Yeni Dava Açma
casesRouter.post('/', requireRole(['yonetici', 'avukat']), (req: AuthenticatedRequest, res: Response) => {
  const { caseTitle, caseType, courtName, esasNo, clientName, plaintiff, defendant, claimAmount } = req.body;

  if (!caseTitle || !esasNo) {
    return res.status(400).json({ success: false, message: 'Dava başlığı ve Esas No zorunludur.' });
  }

  const newCase: ExtendedCase = {
    id: `case-${Date.now()}`,
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

  mockCasesStore.unshift(newCase);
  return res.status(201).json({ success: true, message: 'Dava dosyası başarıyla açıldı.', case: newCase });
});

// PUT /api/v1/cases/:id — Dava Güncelleme
casesRouter.put('/:id', requireRole(['yonetici', 'avukat']), (req: AuthenticatedRequest, res: Response) => {
  const index = mockCasesStore.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Güncellenecek dava dosyası bulunamadı.' });
  }

  mockCasesStore[index] = {
    ...mockCasesStore[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  return res.json({ success: true, message: 'Dava dosyası güncellendi.', case: mockCasesStore[index] });
});
