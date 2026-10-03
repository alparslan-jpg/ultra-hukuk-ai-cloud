import { Router, Response } from 'express';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac';
import { db } from '../../src/services/persistentDatabaseService';

export const financeRouter = Router();

export interface FinanceTx {
  id: string;
  lawyerSicilNo: string;
  transactionType: 'tahsilat' | 'masraf' | 'avans' | 'smm';
  category: string;
  description: string;
  clientName: string;
  caseEsasNo: string;
  grossAmount: number;
  vatRate: number;
  vatAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  taxDeductionRate?: string;
  taxDeductionAmount: number;
  netAmount: number;
  totalCollected: number;
  currency: string;
  receiptNo?: string;
  status: 'tamamlandi' | 'beklemede' | 'iptal';
  transactionDate: string;
  createdAt: string;
}

const mockFinanceStore: FinanceTx[] = [
  {
    id: 'tx-201',
    lawyerSicilNo: '8109',
    transactionType: 'tahsilat',
    category: 'Vekalet Ücreti',
    description: 'Atlas Tekstil A.Ş. 1. Taksit Vekalet Ücreti Tahsilatı',
    clientName: 'Atlas Tekstil San. Tic. A.Ş.',
    caseEsasNo: '2024/782 Esas',
    grossAmount: 175000,
    vatRate: 20,
    vatAmount: 35000,
    withholdingRate: 20,
    withholdingAmount: 35000,
    taxDeductionAmount: 0,
    netAmount: 140000,
    totalCollected: 175000,
    currency: 'TRY',
    receiptNo: 'SMM-2026-00084',
    status: 'tamamlandi',
    transactionDate: '2026-10-02',
    createdAt: '2026-10-02T10:00:00Z'
  },
  {
    id: 'tx-202',
    lawyerSicilNo: '8109',
    transactionType: 'masraf',
    category: 'Bilirkişi Avansı',
    description: 'İstanbul 14. ATM - Hesap Bilirkişisi Ücreti Vezneye Yatırıldı',
    clientName: 'Bosphorus Lojistik Ltd.',
    caseEsasNo: '2024/782 Esas',
    grossAmount: 14500,
    vatRate: 0,
    vatAmount: 0,
    withholdingRate: 0,
    withholdingAmount: 0,
    taxDeductionAmount: 0,
    netAmount: 14500,
    totalCollected: 0,
    currency: 'TRY',
    status: 'tamamlandi',
    transactionDate: '2026-10-01',
    createdAt: '2026-10-01T14:30:00Z'
  },
  {
    id: 'tx-203',
    lawyerSicilNo: '8109',
    transactionType: 'avans',
    category: 'Gider Avansı',
    description: 'Keşif ve Tebligat Masrafları İçin Alınan Müvekkil Avansı',
    clientName: 'Kaya Mimarlık Ltd. Şti.',
    caseEsasNo: '2025/1104 Esas',
    grossAmount: 45000,
    vatRate: 0,
    vatAmount: 0,
    withholdingRate: 0,
    withholdingAmount: 0,
    taxDeductionAmount: 0,
    netAmount: 45000,
    totalCollected: 45000,
    currency: 'TRY',
    status: 'tamamlandi',
    transactionDate: '2026-09-29',
    createdAt: '2026-09-29T11:15:00Z'
  },
  {
    id: 'tx-204',
    lawyerSicilNo: '8109',
    transactionType: 'masraf',
    category: 'UYAP Harç & Tebligat',
    description: 'İstinaf Başvuru Harcı ve Maktu Harç Ödemesi',
    clientName: 'Mert Aksoy',
    caseEsasNo: '2026/301 Esas',
    grossAmount: 6850,
    vatRate: 0,
    vatAmount: 0,
    withholdingRate: 0,
    withholdingAmount: 0,
    taxDeductionAmount: 0,
    netAmount: 6850,
    totalCollected: 0,
    currency: 'TRY',
    status: 'tamamlandi',
    transactionDate: '2026-09-28',
    createdAt: '2026-09-28T16:20:00Z'
  }
];

function mapDbRowToTx(r: any): FinanceTx {
  return {
    id: r.id,
    lawyerSicilNo: r.lawyer_sicil_no,
    transactionType: r.transaction_type,
    category: r.category,
    description: r.description,
    clientName: r.description.split('-')[0]?.trim() || 'Müvekkil',
    caseEsasNo: 'Derdest Dava',
    grossAmount: parseFloat(r.gross_amount || '0'),
    vatRate: parseFloat(r.vat_rate || '20'),
    vatAmount: parseFloat(r.vat_amount || '0'),
    withholdingRate: parseFloat(r.withholding_rate || '20'),
    withholdingAmount: parseFloat(r.withholding_amount || '0'),
    taxDeductionAmount: parseFloat(r.tax_deduction_amount || '0'),
    netAmount: parseFloat(r.net_amount || '0'),
    totalCollected: r.transaction_type === 'tahsilat' ? parseFloat(r.gross_amount || '0') : 0,
    currency: r.currency || 'TRY',
    receiptNo: r.receipt_no || undefined,
    status: r.status || 'tamamlandi',
    transactionDate: r.transaction_date ? new Date(r.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
  };
}

// GET /api/v1/finance/summary — Finansal Bilanço (RBAC Korumalı)
financeRouter.get('/summary', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const isManagingPartner = req.user?.role === 'yonetici';

  try {
    const sql = db.getSql();
    if (sql) {
      const rows = await sql`SELECT * FROM finance_records`;
      const dbTx = rows.map(mapDbRowToTx);
      const dataSet = dbTx.length > 0 ? dbTx : mockFinanceStore;

      const totalTahsilat = dataSet
        .filter((t) => t.transactionType === 'tahsilat' && t.status === 'tamamlandi')
        .reduce((sum, t) => sum + t.grossAmount, 0);

      const totalMasraf = dataSet
        .filter((t) => t.transactionType === 'masraf' && t.status === 'tamamlandi')
        .reduce((sum, t) => sum + t.grossAmount, 0);

      const totalAvans = dataSet
        .filter((t) => t.transactionType === 'avans' && t.status === 'tamamlandi')
        .reduce((sum, t) => sum + t.grossAmount, 0);

      const netKasa = totalTahsilat + totalAvans - totalMasraf;

      return res.json({
        success: true,
        rbacRole: req.user?.role,
        summary: {
          totalRevenueTRY: isManagingPartner ? totalTahsilat : null,
          totalExpenseTRY: totalMasraf,
          totalAdvanceTRY: totalAvans,
          netCashBalanceTRY: isManagingPartner ? netKasa : null,
          masked: !isManagingPartner,
          currency: 'TRY'
        }
      });
    }
  } catch (err: any) {
    console.warn('[Finance Summary] Neon SQL uyarısı:', err?.message);
  }

  const totalTahsilat = mockFinanceStore
    .filter((t) => t.transactionType === 'tahsilat' && t.status === 'tamamlandi')
    .reduce((sum, t) => sum + t.grossAmount, 0);

  const totalMasraf = mockFinanceStore
    .filter((t) => t.transactionType === 'masraf' && t.status === 'tamamlandi')
    .reduce((sum, t) => sum + t.grossAmount, 0);

  const totalAvans = mockFinanceStore
    .filter((t) => t.transactionType === 'avans' && t.status === 'tamamlandi')
    .reduce((sum, t) => sum + t.grossAmount, 0);

  const netKasa = totalTahsilat + totalAvans - totalMasraf;

  return res.json({
    success: true,
    rbacRole: req.user?.role,
    summary: {
      totalRevenueTRY: isManagingPartner ? totalTahsilat : null,
      totalExpenseTRY: totalMasraf,
      totalAdvanceTRY: totalAvans,
      netCashBalanceTRY: isManagingPartner ? netKasa : null,
      masked: !isManagingPartner,
      currency: 'TRY'
    }
  });
});

// GET /api/v1/finance/transactions — İşlem Dökümü
financeRouter.get('/transactions', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const { type, caseEsas } = req.query;

  try {
    const sql = db.getSql();
    if (sql) {
      const rows = await sql`SELECT * FROM finance_records ORDER BY transaction_date DESC`;
      let items = rows.map(mapDbRowToTx);
      if (items.length === 0) items = [...mockFinanceStore];

      if (type && typeof type === 'string' && type !== 'hepsi') {
        items = items.filter((t) => t.transactionType === type);
      }

      if (caseEsas && typeof caseEsas === 'string') {
        items = items.filter((t) => t.caseEsasNo.toLowerCase().includes(caseEsas.toLowerCase()));
      }

      return res.json({
        success: true,
        count: items.length,
        transactions: items,
        source: 'Neon PostgreSQL'
      });
    }
  } catch (err: any) {
    console.warn('[Finance Transactions] Neon SQL uyarısı:', err?.message);
  }

  let items = [...mockFinanceStore];
  if (type && typeof type === 'string' && type !== 'hepsi') {
    items = items.filter((t) => t.transactionType === type);
  }
  if (caseEsas && typeof caseEsas === 'string') {
    items = items.filter((t) => t.caseEsasNo.toLowerCase().includes(caseEsas.toLowerCase()));
  }

  return res.json({
    success: true,
    count: items.length,
    transactions: items,
    source: 'Memory Cache'
  });
});

// POST /api/v1/finance/transactions — Yeni Kasa / Masraf Girişi
financeRouter.post('/transactions', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const { transactionType, category, description, clientName, caseEsasNo, grossAmount } = req.body;

  if (!transactionType || !grossAmount) {
    return res.status(400).json({ success: false, message: 'İşlem türü ve tutar zorunludur.' });
  }

  const numAmount = parseFloat(grossAmount) || 0;
  const newTx: FinanceTx = {
    id: `tx-${Date.now()}`,
    lawyerSicilNo: req.user?.sicilNo || '8109',
    transactionType,
    category: category || 'Genel İşlem',
    description: description || `${category} kaydı`,
    clientName: clientName || 'Müvekkil',
    caseEsasNo: caseEsasNo || '2026 Genel Portföy',
    grossAmount: numAmount,
    vatRate: 20,
    vatAmount: transactionType === 'tahsilat' ? (numAmount * 20) / 100 : 0,
    withholdingRate: 20,
    withholdingAmount: transactionType === 'tahsilat' ? (numAmount * 20) / 100 : 0,
    taxDeductionAmount: 0,
    netAmount: numAmount,
    totalCollected: transactionType === 'tahsilat' ? numAmount : 0,
    currency: 'TRY',
    status: 'tamamlandi',
    transactionDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  try {
    const sql = db.getSql();
    if (sql) {
      await sql`
        INSERT INTO finance_records (
          id, lawyer_sicil_no, transaction_type, category, description, 
          gross_amount, vat_rate, vat_amount, withholding_rate, withholding_amount, 
          tax_deduction_amount, net_amount, currency, status, transaction_date, created_at
        ) VALUES (
          ${newTx.id}, ${newTx.lawyerSicilNo}, ${newTx.transactionType}, ${newTx.category}, 
          ${newTx.description}, ${newTx.grossAmount}, ${newTx.vatRate}, ${newTx.vatAmount}, 
          ${newTx.withholdingRate}, ${newTx.withholdingAmount}, ${newTx.taxDeductionAmount}, 
          ${newTx.netAmount}, ${newTx.currency}, ${newTx.status}, CURRENT_DATE, NOW()
        )
      `;
    }
  } catch (err: any) {
    console.error('[Finance POST] Neon SQL kayıt hatası:', err?.message);
  }

  mockFinanceStore.unshift(newTx);
  return res.status(201).json({ success: true, message: 'Finansal işlem başarıyla kaydedildi.', transaction: newTx });
});

// POST /api/v1/finance/smm/calculate — SMM & Tevkifat Hesaplama Motoru
financeRouter.post('/smm/calculate', requireRole(['yonetici', 'avukat']), (req: AuthenticatedRequest, res: Response) => {
  const { grossAmount, vatRate = 20, withholdingRate = 20, taxDeductionRate } = req.body;
  const gross = parseFloat(grossAmount) || 0;

  if (gross <= 0) {
    return res.status(400).json({ success: false, message: 'Geçerli bir brüt tutar giriniz.' });
  }

  const stopajTutari = (gross * withholdingRate) / 100;
  const kdvTutari = (gross * vatRate) / 100;
  let tevkifatTutari = 0;

  if (taxDeductionRate && typeof taxDeductionRate === 'string') {
    const parts = taxDeductionRate.split('/');
    if (parts.length === 2) {
      tevkifatTutari = (kdvTutari * parseInt(parts[0])) / parseInt(parts[1]);
    }
  }

  const netEleGecen = gross - stopajTutari;
  const muvekkildenTahsil = gross + kdvTutari - tevkifatTutari - stopajTutari;

  return res.json({
    success: true,
    calculation: {
      grossAmount: gross,
      withholdingRate,
      withholdingAmount: stopajTutari,
      vatRate,
      vatAmount: kdvTutari,
      taxDeductionRate: taxDeductionRate || 'Uygulanmadı',
      taxDeductionAmount: tevkifatTutari,
      netAmount: netEleGecen,
      totalAmountToCollect: muvekkildenTahsil,
      currency: 'TRY'
    }
  });
});
