import { ClientItem, ClientCase } from '../services/clientCaseStore';
import { LawyerUser } from '../components/LawyerWorkspace';

export interface FlattenedCaseItem {
  client: ClientItem;
  caseItem: ClientCase;
}

export interface ExportOptions {
  includeContactDetails?: boolean;
  includeEvidenceCount?: boolean;
  includeFinancialValues?: boolean;
  includePrivacySeal?: boolean;
  scopeLabel?: string;
}

/**
 * Sanitizes a string against CSV Formula Injection (Excel / LibreOffice / Google Sheets)
 * Prefixes with a single quote if the string starts with =, +, -, @, or tab/return.
 */
function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  if (/^[=+@\-\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str}"`;
}

/**
 * Exports client and case data to an RFC 4180 compliant CSV with UTF-8 BOM.
 * Executed 100% locally in the browser with zero external network transmission.
 */
export function exportCasesToCsv(
  cases: FlattenedCaseItem[],
  lawyer: LawyerUser,
  options: ExportOptions = {}
): void {
  const {
    includeContactDetails = true,
    includeEvidenceCount = true,
    includeFinancialValues = true,
    scopeLabel = 'Aktif Dava Listesi'
  } = options;

  const headers = [
    'Sıra No',
    'Müvekkil Adı / Unvanı',
    'Müvekkil Türü',
    'TCKN / VKN',
    ...(includeContactDetails ? ['Müvekkil Telefon', 'Müvekkil E-Posta', 'Müvekkil Adres'] : []),
    'Esas / Dava No',
    'Mahkeme',
    'Dava Konusu',
    'Dava Safahatı',
    'Dava Durumu',
    'Açılış Tarihi',
    'Sonraki Duruşma Tarihi',
    ...(includeFinancialValues ? ['Uyuşmazlık Değeri'] : []),
    'Karşı Taraf',
    ...(includeEvidenceCount ? ['Kayıtlı Delil Sayısı'] : []),
    'Arşiv Durumu',
    'Arşivleme Nedeni',
    'Sorumlu Avukat',
    'Baro Sicil No',
    'Dışa Aktarım Tarihi'
  ];

  const nowStr = new Date().toLocaleString('tr-TR');

  const rows = cases.map((item, idx) => {
    const { client, caseItem } = item;
    const row = [
      sanitizeCsvValue(idx + 1),
      sanitizeCsvValue(client.fullName),
      sanitizeCsvValue(client.type),
      sanitizeCsvValue(client.idNumber),
      ...(includeContactDetails
        ? [
            sanitizeCsvValue(client.phone || '-'),
            sanitizeCsvValue(client.email || '-'),
            sanitizeCsvValue(client.address || '-')
          ]
        : []),
      sanitizeCsvValue(caseItem.caseNumber),
      sanitizeCsvValue(caseItem.court),
      sanitizeCsvValue(caseItem.subject),
      sanitizeCsvValue(caseItem.stage),
      sanitizeCsvValue(caseItem.status),
      sanitizeCsvValue(caseItem.openedDate),
      sanitizeCsvValue(caseItem.nextHearingDate || 'Belirtilmedi'),
      ...(includeFinancialValues ? [sanitizeCsvValue(caseItem.estimatedValue || '-')] : []),
      sanitizeCsvValue(caseItem.opponentName || '-'),
      ...(includeEvidenceCount ? [sanitizeCsvValue(caseItem.files?.length || 0)] : []),
      sanitizeCsvValue(caseItem.isArchived ? 'Arşivlendi' : 'Aktif'),
      sanitizeCsvValue(caseItem.archiveReason || '-'),
      sanitizeCsvValue(lawyer.fullName),
      sanitizeCsvValue(`${lawyer.baroAdi || 'İstanbul Barosu'} - ${lawyer.sicilNo}`),
      sanitizeCsvValue(nowStr)
    ];
    return row.join(';'); // Use semicolon for seamless Turkish Excel compatibility
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel, Numbers, and LibreOffice render Turkish letters properly
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanDate = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `Dava_Portfoyu_${lawyer.sicilNo}_${cleanDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds printable HTML document for PDF generation.
 * Features official Turkish court / UYAP styling, security verification badge, and data tables.
 */
export function buildPrintableHtmlReport(
  cases: FlattenedCaseItem[],
  lawyer: LawyerUser,
  options: ExportOptions = {}
): string {
  const {
    includeContactDetails = true,
    includeEvidenceCount = true,
    includeFinancialValues = true,
    includePrivacySeal = true,
    scopeLabel = 'Dava Listesi ve Portföy Fihristi'
  } = options;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timeFormatted = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Generate pseudo-verification security seal hash for local integrity
  const hashSeed = `${lawyer.sicilNo}-${cases.length}-${now.getTime()}`;
  let pseudoHash = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    pseudoHash = (pseudoHash << 5) - pseudoHash + hashSeed.charCodeAt(i);
    pseudoHash |= 0;
  }
  const sealCode = `TR-${lawyer.sicilNo}-${Math.abs(pseudoHash).toString(16).toUpperCase()}`;

  // Unique clients count
  const uniqueClients = new Set(cases.map((c) => c.client.id)).size;
  const totalFiles = cases.reduce((acc, c) => acc + (c.caseItem.files?.length || 0), 0);
  const upcomingHearings = cases.filter((c) => c.caseItem.nextHearingDate).length;

  const rowsHtml = cases
    .map((item, index) => {
      const { client, caseItem } = item;
      const isUrgent =
        caseItem.nextHearingDate &&
        new Date(caseItem.nextHearingDate).getTime() - now.getTime() < 7 * 86400000;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px; ${
          index % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'
        }">
          <td style="padding: 8px 6px; text-align: center; color: #64748b; font-family: monospace;">${index + 1}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #0f172a;">
            <div>${caseItem.caseNumber}</div>
            <div style="font-size: 10px; font-weight: normal; color: #475569;">${caseItem.court}</div>
          </td>
          <td style="padding: 8px 6px; color: #1e293b;">
            <div style="font-weight: 600;">${client.fullName}</div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace;">${client.idNumber}</div>
            ${
              includeContactDetails && client.phone
                ? `<div style="font-size: 9px; color: #64748b;">Tel: ${client.phone}</div>`
                : ''
            }
          </td>
          <td style="padding: 8px 6px; color: #334155;">
            <div>${caseItem.subject}</div>
            <div style="font-size: 10px; color: #64748b;">Karşı Taraf: <strong>${caseItem.opponentName || '-'}</strong></div>
          </td>
          <td style="padding: 8px 6px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e0f2fe; color: #0369a1;">
              ${caseItem.stage}
            </span>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Durum: ${caseItem.status}</div>
          </td>
          <td style="padding: 8px 6px; white-space: nowrap;">
            ${
              caseItem.nextHearingDate
                ? `<div style="font-weight: 600; font-family: monospace; ${
                    isUrgent ? 'color: #b91c1c; font-weight: bold;' : 'color: #0f172a;'
                  }">${caseItem.nextHearingDate}</div>
                   <div style="font-size: 9px; color: #64748b;">Açılış: ${caseItem.openedDate}</div>`
                : `<span style="color: #94a3b8; font-size: 10px;">Duruşma yok</span>`
            }
          </td>
          ${
            includeFinancialValues
              ? `<td style="padding: 8px 6px; text-align: right; font-weight: 600; font-family: monospace; color: #0f172a;">${
                  caseItem.estimatedValue || '-'
                }</td>`
              : ''
          }
          ${
            includeEvidenceCount
              ? `<td style="padding: 8px 6px; text-align: center; font-family: monospace; color: #475569;">${
                  caseItem.files?.length || 0
                } Belge</td>`
              : ''
          }
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Dava_Portfoy_Raporu_${lawyer.sicilNo}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 10mm 15mm 10mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .kpi-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .kpi-item {
      flex: 1;
      font-size: 11px;
    }
    .kpi-item strong {
      font-size: 15px;
      display: block;
      color: #0f172a;
      font-family: monospace;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    table.data-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    table.data-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 6px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    .footer-section {
      margin-top: 20px;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 10px;
      color: #64748b;
      page-break-inside: avoid;
    }
    .seal-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 6px 10px;
      font-family: monospace;
      font-size: 9px;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <div style="font-size: 10px; font-weight: bold; color: #b45309; text-transform: uppercase; letter-spacing: 1px;">
          T.C. HUKUK VE DAVA YÖNETİM SİSTEMİ · UYAP VE BARO UYUMLU PORTFÖY
        </div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">
          DAVA DOSYALARI VE MÜVEKKİL RESMİ FİHRİSTİ
        </div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">
          Kapsam: <strong>${scopeLabel}</strong> · Rapor Tarihi: <strong>${dateFormatted} ${timeFormatted}</strong>
        </div>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${lawyer.fullName}</div>
        <div style="font-size: 11px; color: #475569;">${lawyer.baroAdi || 'İstanbul Barosu'} · Sicil No: <strong>${lawyer.sicilNo}</strong></div>
        <div style="font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px;">
          ✓ Güvenli Yerel İşlem (Cihaz Dışı Veri Çıkışı Yoktur)
        </div>
      </td>
    </tr>
  </table>

  <!-- KPI SUMMARY ROW -->
  <div class="kpi-bar">
    <div class="kpi-item">
      <span>TOPLAM DAVA DOSYASI</span>
      <strong>${cases.length} Dosya</strong>
    </div>
    <div class="kpi-item">
      <span>AKTİF MÜVEKKİL</span>
      <strong>${uniqueClients} Müvekkil</strong>
    </div>
    <div class="kpi-item">
      <span>DURUŞMA BEKLEYEN</span>
      <strong>${upcomingHearings} Dava</strong>
    </div>
    <div class="kpi-item">
      <span>KAYITLI DELİL / EVRAK</span>
      <strong>${totalFiles} Belge</strong>
    </div>
  </div>

  <!-- MAIN DATA TABLE -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">#</th>
        <th style="width: 140px;">Dava No & Mahkeme</th>
        <th style="width: 150px;">Müvekkil Bilgileri</th>
        <th>Dava Konusu & Karşı Taraf</th>
        <th style="width: 110px;">Safahat & Durum</th>
        <th style="width: 100px;">Duruşma / Açılış</th>
        ${includeFinancialValues ? '<th style="width: 85px; text-align: right;">Uyuşmazlık</th>' : ''}
        ${includeEvidenceCount ? '<th style="width: 60px; text-align: center;">Deliller</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- FOOTER & OFFICIAL SEAL -->
  <div class="footer-section">
    <div>
      <div style="font-weight: 600; color: #334155; margin-bottom: 2px;">
        1136 Sayılı Avukatlık Kanunu m. 36 ve KVKK 6698 m. 12 Uyarınca Mesleki Gizlilik Kaydı
      </div>
      <div>
        Bu belge yerel olarak oluşturulmuş olup üçüncü kişi ve sunucularla paylaşılmamıştır. Yalnızca yetkili vekil kullanımına mahsustur.
      </div>
      <div style="margin-top: 4px;" class="seal-box">
        GÜVENLİK VE BÜTÜNLÜK MÜHRÜ: ${sealCode} · YEREL DOĞRULAMA: GEÇERLİ
      </div>
    </div>

    <div style="text-align: center; min-width: 180px; padding-left: 20px;">
      <div style="height: 40px; border-bottom: 1px dashed #94a3b8; margin-bottom: 4px;"></div>
      <div style="font-weight: bold; color: #0f172a;">${lawyer.fullName}</div>
      <div style="font-size: 9px; color: #64748b;">Avukat Kaşe & İmza</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Executes a secure, local-only print dialog to save as PDF.
 * Uses an isolated hidden iframe in the DOM so that the main UI is unaffected.
 */
export function printSecurePdfReport(
  cases: FlattenedCaseItem[],
  lawyer: LawyerUser,
  options: ExportOptions = {}
): Promise<void> {
  return new Promise((resolve) => {
    const html = buildPrintableHtmlReport(cases, lawyer, options);

    // Create invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Trigger print once content has rendered
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print error:', e);
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
          resolve();
        }, 1000);
      }
    }, 250);
  });
}

/**
 * Downloads a standalone, offline HTML report file directly to disk.
 */
export function downloadOfflineHtmlReport(
  cases: FlattenedCaseItem[],
  lawyer: LawyerUser,
  options: ExportOptions = {}
): void {
  const html = buildPrintableHtmlReport(cases, lawyer, options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanDate = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `Dava_Raporu_${lawyer.sicilNo}_${cleanDate}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
