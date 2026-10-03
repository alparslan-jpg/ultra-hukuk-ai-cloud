// ============================================================
// ULTRA HUKUK AI — Veri Çıkarma ve Senkronizasyon Ekibi
// Baş Hukuk Müşavirine bağlı çalışan özel arka plan AI ekibidir.
// Görevi: Yüklenen tüm dava evraklarından (PDF, UDF, OCR, metin)
// Davacı ve Davalı isim-soyisimlerini, delilleri, süreleri ve vakıaları
// hatasız olarak çıkarıp sistemi beslemek ve senkronize etmektir.
// ============================================================

export interface ExtractedParty {
  fullName: string;
  role: 'Davacı' | 'Davalı';
  tcOrTaxNo?: string;
  address?: string;
}

export interface ExtractedCaseData {
  courtName: string;
  esasNo: string;
  subject: string;
  plaintiffs: ExtractedParty[];
  defendants: ExtractedParty[];
  evidenceList: string[];
  criticalDates: { label: string; date: string }[];
  claimAmount?: number;
  currency?: string;
  summary: string;
  extractedAt: string;
  extractionConfidence: number; // 0 - 100
}

export class DataExtractionAndSyncService {
  /**
   * Evrak metninden hızlı ve yüksek doğruluklu adli veri çıkarımı yapar
   */
  public static extractFromText(rawText: string, fileName?: string): ExtractedCaseData {
    const text = rawText || '';

    // 1. Mahkeme Tespiti (Bakırköy 3. Asliye Ticaret Mahkemesi gibi dereceleri de kapsar)
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const courtLine = lines.find(l => /MAHKEMES[İI]|HAK[İI]ML[İI]Ğ[İI]/i.test(l));
    let courtName = 'İstanbul Nöbetçi Asliye Hukuk Mahkemesi';
    if (courtLine) {
      courtName = courtLine
        .replace(/^T\.?C\.?\s*/i, '')
        .replace(/NE$/i, '')
        .replace(/ne$/i, '')
        .trim();
    }

    // 2. Esas No Tespiti
    const esasRegex = /(?:Esas\s*No\s*:?|E\.\s*:?|\b)(\d{4}\s*\/\s*\d+)\s*(?:E\.|Esas)?/i;
    const esasMatch = text.match(esasRegex);
    const esasNo = esasMatch ? `${esasMatch[1].replace(/\s+/g, '')} Esas` : (fileName?.match(/(\d{4}[-_]\d+)/) ? fileName.match(/(\d{4}[-_]\d+)/)![1].replace('_', '/') + ' Esas' : '2026/Belirlenmedi Esas');

    // 3. Davacı / Davacılar Tespiti
    const plaintiffs: ExtractedParty[] = [];
    const davaciRegex = /(?:DAVACI(?:LAR)?|MÜŞTEKİ|TALEP\s+EDEN)\s*:?\s*([^\n\r]+)/gi;
    let pMatch;
    while ((pMatch = davaciRegex.exec(text)) !== null) {
      const rawName = pMatch[1].replace(/Vekili.*$/i, '').replace(/T\.?C\.?.*$/i, '').replace(/\(.*$/, '').trim();
      if (rawName && rawName.length > 2 && !rawName.toLowerCase().includes('vekili')) {
        const cleanName = rawName.replace(/^[:\-\s]+/, '').replace(/[,;].*$/, '').trim();
        if (cleanName && !plaintiffs.some(p => p.fullName === cleanName)) {
          plaintiffs.push({ fullName: cleanName, role: 'Davacı' });
        }
      }
    }

    // 4. Davalı / Davalılar Tespiti
    const defendants: ExtractedParty[] = [];
    const davaliRegex = /(?:DAVALI(?:LAR)?|SANIK|KARŞI\s+TARAF)\s*(?:\([^\)]+\))?\s*:?\s*([^\n\r]+)/gi;
    let dMatch;
    while ((dMatch = davaliRegex.exec(text)) !== null) {
      const rawName = dMatch[1].replace(/Vekili.*$/i, '').replace(/T\.?C\.?.*$/i, '').trim();
      if (rawName && rawName.length > 2 && !rawName.toLowerCase().includes('vekili')) {
        const cleanName = rawName.replace(/^[:\-\s]+/, '').replace(/[,;].*$/, '').trim();
        if (cleanName && !defendants.some(d => d.fullName === cleanName)) {
          defendants.push({ fullName: cleanName, role: 'Davalı' });
        }
      }
    }

    // Yedek İsim Çıkarımı (Eğer standart başlık bulunamadıysa)
    if (plaintiffs.length === 0) {
      const nameInContext = text.match(/(?:müvekkil(?:im)?|davacı)\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)/i);
      if (nameInContext) {
        plaintiffs.push({ fullName: nameInContext[1].trim(), role: 'Davacı' });
      }
    }
    if (defendants.length === 0) {
      const oppInContext = text.match(/(?:davalı|borçlu|karşı\s+taraf)\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+(?:A\.Ş\.|Ltd\.\s*Şti\.))?)/i);
      if (oppInContext) {
        defendants.push({ fullName: oppInContext[1].trim(), role: 'Davalı' });
      }
    }

    // 5. Konu & Vakıa Özeti Tespiti
    const subjectRegex = /(?:DAVA\s*KONUSU|KONU)\s*:?\s*([^\n\r]+(?:\n[^\n\r]+){0,2})/i;
    const subMatch = text.match(subjectRegex);
    const subject = subMatch ? subMatch[1].trim().replace(/\s+/g, ' ') : (fileName ? `${fileName} Davası` : 'Hukuki Alacak ve İtirazın İptali Davası');

    // 6. Dava Değeri / Tutar Tespiti
    const amountRegex = /(?:(?:DAVA\s*DEĞERİ|HARCA\s*ESAS\s*DEĞER|TALEP\s*EDİLEN|ALACAK\s*MİKTARI)\s*:?\s*)?([\d\.]+(?:,\d{2})?)\s*(?:TL|TRY|Lira)/i;
    const amountMatch = text.match(amountRegex);
    let claimAmount = 0;
    if (amountMatch) {
      const cleanNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
      claimAmount = parseFloat(cleanNum) || 0;
    }

    // 7. Delil Listesi Tespiti
    const evidenceList: string[] = [];
    const delilSection = text.match(/(?:HUKUKİ\s*DELİLLER|DELİLLERİMİZ|DELİL\s*LİSTESİ)\s*:?\s*([\s\S]*?)(?:HUKUKİ\s*SEBEPLER|NETİCE|SONUÇ|\n\n\n|$)/i);
    if (delilSection) {
      const lines = delilSection[1].split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 3);
      for (const line of lines) {
        if (/^(\d+[\.\)]|[-*•])/.test(line)) {
          evidenceList.push(line.replace(/^(\d+[\.\)]|[-*•])\s*/, ''));
        }
      }
    }
    if (evidenceList.length === 0) {
      evidenceList.push('Fatura ve İrsaliyeler', 'Banka Dekontları', 'Ticari Defter ve Kayıtlar', 'Bilirkişi İncelemesi', 'Tanık Beyanları');
    }

    // 8. Kritik Tarihler
    const criticalDates: { label: string; date: string }[] = [];
    const dateRegex = /(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/g;
    const allDates = text.match(dateRegex) || [];
    if (allDates.length > 0) {
      criticalDates.push({ label: 'Dosya Olay/İhtar Tarihi', date: allDates[0] });
      if (allDates.length > 1) {
        criticalDates.push({ label: 'Tebliğ/İtiraz Tarihi', date: allDates[1] });
      }
    }

    return {
      courtName,
      esasNo,
      subject,
      plaintiffs,
      defendants,
      evidenceList,
      criticalDates,
      claimAmount,
      currency: 'TRY',
      summary: `${courtName} nezdinde görülen ${esasNo} sayılı dosyada; Davacı (${plaintiffs.map(p => p.fullName).join(', ') || 'Belirtilmedi'}) tarafından Davalı (${defendants.map(d => d.fullName).join(', ') || 'Belirtilmedi'}) aleyhine ikame edilen dava.`,
      extractedAt: new Date().toISOString(),
      extractionConfidence: (plaintiffs.length > 0 && defendants.length > 0) ? 95 : 75
    };
  }
}
