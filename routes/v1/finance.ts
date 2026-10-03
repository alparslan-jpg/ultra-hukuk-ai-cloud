import { Router, Response } from 'express';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac';
import { db } from '../../src/services/persistentDatabaseService';
import { writeAudit } from '../../src/services/auditService';

export const financeRouter = Router();

export interface FinanceTx {
  id: string;
  lawyerSicilNo: string;
  clientId?: string;
  caseId?: string;
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

function mapDbRowToTx(r: any): FinanceTx {
  return {
    id: r.id,
    lawyerSicilNo: r.lawyer_sicil_no,
    clientId: r.client_id || undefined,
    caseId: r.case_id || undefined,
    transactionType: r.transaction_type,
    category: r.category || 'Genel İşlem',
    description: r.description || '',
    clientName: r.client_name || r.description?.split('-')[0]?.trim() || 'Müvekkil',
    caseEsasNo: r.case_esas_no || 'Derdest Dava',
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

// GET /api/v1/finance/summary — Finansal Bilanço (RBAC & Sicil İzolasyonlu)
financeRouter.get('/summary', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const isManagingPartner = req.user?.role === 'yonetici';
  const ownerSicil = req.user?.sicilNo || '8109';

  try {
    const sql = db.getSql();
    let dataSet: FinanceTx[] = [];

    if (sql) {
      const rows = isManagingPartner
        ? await sql`SELECT * FROM finance_records`
        : await sql`SELECT * FROM finance_records WHERE lawyer_sicil_no = ${ownerSicil}`;
      dataSet = rows.map(mapDbRowToTx);
    }

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

    await writeAudit(req, {
      action: 'FINANCE_SUMMARY_VIEW',
      actionType: 'Finans',
      details: `Finans özeti görüntülendi. Kayıt sayısı: ${dataSet.length}`,
      statusCode: 200,
      status: 'Başarılı'
    });

    return res.json({
      success: true,
      rbacRole: req.user?.role,
      summary: {
        totalRevenueTRY: isManagingPartner ? totalTahsilat : null,
        totalExpenseTRY: totalMasraf,
        totalAdvanceTRY: totalAvans,
        netCashBalanceTRY: isManagingPartner ? netKasa : null,
        masked: !isManagingPartner,
        currency: 'TRY',
        recordCount: dataSet.length
      }
    });
  } catch (err: any) {
    console.error('[Finance Summary Error]:', err?.message);
    return res.status(500).json({
      success: false,
      message: 'Finans özeti alınırken veritabanı hatası oluştu.',
      error: err?.message
    });
  }
});

// GET /api/v1/finance/transactions — İşlem Dökümü
financeRouter.get('/transactions', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const isManagingPartner = req.user?.role === 'yonetici';
  const ownerSicil = req.user?.sicilNo || '8109';
  const { type, caseEsas } = req.query;

  try {
    const sql = db.getSql();
    if (!sql) {
      return res.json({
        success: true,
        count: 0,
        transactions: [],
        source: 'Database Offline'
      });
    }

    const rows = isManagingPartner
      ? await sql`SELECT * FROM finance_records ORDER BY transaction_date DESC, created_at DESC`
      : await sql`SELECT * FROM finance_records WHERE lawyer_sicil_no = ${ownerSicil} ORDER BY transaction_date DESC, created_at DESC`;

    let items = rows.map(mapDbRowToTx);

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
  } catch (err: any) {
    console.error('[Finance Transactions Error]:', err?.message);
    return res.status(500).json({
      success: false,
      message: 'İşlemler listelenirken hata oluştu.',
      error: err?.message
    });
  }
});

// POST /api/v1/finance/transactions — Yeni Kasa / Masraf Girişi
financeRouter.post('/transactions', requireRole(['yonetici', 'avukat']), async (req: AuthenticatedRequest, res: Response) => {
  const {
    transactionType,
    category,
    description,
    clientName,
    clientId,
    caseId,
    caseEsasNo,
    grossAmount,
    vatRate = 20,
    withholdingRate = 20,
    taxDeductionRate,
    receiptNo
  } = req.body;

  if (!transactionType || !grossAmount) {
    return res.status(400).json({ success: false, message: 'İşlem türü ve tutar zorunludur.' });
  }

  const numGross = Math.max(0, parseFloat(grossAmount) || 0);
  const numVatRate = parseFloat(vatRate) || 20;
  const numWithholdingRate = parseFloat(withholdingRate) || 20;

  const vatAmount = transactionType === 'tahsilat' || transactionType === 'smm' ? (numGross * numVatRate) / 100 : 0;
  const withholdingAmount = transactionType === 'tahsilat' || transactionType === 'smm' ? (numGross * numWithholdingRate) / 100 : 0;

  let taxDeductionAmount = 0;
  if (taxDeductionRate && typeof taxDeductionRate === 'string') {
    const parts = taxDeductionRate.split('/');
    if (parts.length === 2 && parseInt(parts[1]) > 0) {
      taxDeductionAmount = (vatAmount * parseInt(parts[0])) / parseInt(parts[1]);
    }
  }

  const netAmount = transactionType === 'tahsilat' || transactionType === 'smm'
    ? numGross - withholdingAmount
    : numGross;

  const totalCollected = transactionType === 'tahsilat' ? numGross + vatAmount - taxDeductionAmount - withholdingAmount : 0;

  const newTx: FinanceTx = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    lawyerSicilNo: req.user?.sicilNo || '8109',
    clientId,
    caseId,
    transactionType,
    category: category || 'Genel İşlem',
    description: description || `${category} kaydı`,
    clientName: clientName || 'Müvekkil',
    caseEsasNo: caseEsasNo || 'Genel Portföy',
    grossAmount: numGross,
    vatRate: numVatRate,
    vatAmount,
    withholdingRate: numWithholdingRate,
    withholdingAmount,
    taxDeductionRate: taxDeductionRate || undefined,
    taxDeductionAmount,
    netAmount,
    totalCollected,
    currency: 'TRY',
    receiptNo: receiptNo || undefined,
    status: 'tamamlandi',
    transactionDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  try {
    const sql = db.getSql();
    if (sql) {
      await sql`
        INSERT INTO finance_records (
          id, lawyer_sicil_no, client_id, case_id, transaction_type, category, description, 
          gross_amount, vat_rate, vat_amount, withholding_rate, withholding_amount, 
          tax_deduction_applied, tax_deduction_amount, net_amount, currency, receipt_no, status, transaction_date, created_at
        ) VALUES (
          ${newTx.id}, ${newTx.lawyerSicilNo}, ${newTx.clientId || null}, ${newTx.caseId || null},
          ${newTx.transactionType}, ${newTx.category}, ${newTx.description}, 
          ${newTx.grossAmount}, ${newTx.vatRate}, ${newTx.vatAmount}, 
          ${newTx.withholdingRate}, ${newTx.withholdingAmount}, 
          ${taxDeductionAmount > 0}, ${newTx.taxDeductionAmount}, 
          ${newTx.netAmount}, ${newTx.currency}, ${newTx.receiptNo || null}, 
          ${newTx.status}, CURRENT_DATE, NOW()
        )
      `;
    }

    await writeAudit(req, {
      action: 'FINANCE_TRANSACTION_CREATE',
      actionType: 'Finans',
      resourceId: newTx.id,
      details: `${newTx.transactionType.toUpperCase()} işlemi kaydedildi. Tutar: ${newTx.grossAmount} TRY`,
      statusCode: 201,
      status: 'Başarılı'
    });

    return res.status(201).json({
      success: true,
      message: 'Finansal işlem başarıyla kaydedildi.',
      transaction: newTx
    });
  } catch (err: any) {
    console.error('[Finance POST] Neon SQL kayıt hatası:', err?.message);
    return res.status(500).json({
      success: false,
      message: 'Finansal işlem kaydedilirken hata oluştu.',
      error: err?.message
    });
  }
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
    if (parts.length === 2 && parseInt(parts[1]) > 0) {
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
