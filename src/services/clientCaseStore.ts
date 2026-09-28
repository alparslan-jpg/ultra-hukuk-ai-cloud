export interface CaseFileItem {
  id: string;
  name: string;
  type: string; // 'Tensip Zaptı' | 'Bilirkişi Raporu' | 'Fatura / İrsaliye' | 'İhtarname' | 'Duruşma Tutanağı' | 'Diğer';
  size: number;
  uploadedAt: string;
  evidentiaryValue: 'Kesin Delil' | 'Yazılı Delil Başlangıcı' | 'Takdiri Delil' | 'Resmi Senet';
  contentPreview: string;
  analysisSummary?: string;
  lawArticle?: string;
}

export interface ClientCase {
  id: string;
  caseNumber: string;
  court: string;
  subject: string;
  status: 'Open' | 'Pending' | 'Closed';
  openedDate: string;
  updatedAt?: string;
  nextHearingDate?: string;
  stage: 'Dava Açılışı & Tensip' | 'Ön İnceleme' | 'Tahkikat & Bilirkişi' | 'Sözlü Yargılama' | 'İstinaf / Temyiz';
  estimatedValue: string;
  opponentName: string;
  files: CaseFileItem[];
  isArchived?: boolean;
  archivedAt?: string;
  archiveReason?: string;
}

export interface ClientItem {
  id: string;
  fullName: string;
  type: 'Gerçek Kişi' | 'Tüzel Kişi / Şirket';
  idNumber: string; // TCKN or VKN
  email: string;
  phone: string;
  address: string;
  notes: string;
  cases: ClientCase[];
}

export const DEFAULT_CLIENTS: ClientItem[] = [
  {
    id: 'cli-atlas-1',
    fullName: 'Atlas Tekstil Sanayi ve Dış Ticaret A.Ş.',
    type: 'Tüzel Kişi / Şirket',
    idNumber: 'VKN: 0890341829',
    email: 'hukuk@atlastekstil.com.tr',
    phone: '0 (212) 444 88 90',
    address: 'Merter Tekstil Merkezi, Kat: 4 Güngören / İstanbul',
    notes: 'İhracat ve lojistik uyuşmazlıkları portföyü',
    cases: [
      {
        id: 'case-atlas-1',
        caseNumber: '2024/782 Esas',
        court: 'İstanbul 14. Asliye Ticaret Mahkemesi',
        subject: 'Ticari Fatura ve İrsaliyeye Dayalı İtirazın İptali Davası',
        status: 'Open',
        openedDate: '2024-03-12',
        nextHearingDate: '2026-10-14',
        stage: 'Tahkikat & Bilirkişi',
        estimatedValue: '485.000 TL',
        opponentName: 'Bosphorus Lojistik Depolama Ltd. Şti.',
        files: [
          {
            id: 'file-1',
            name: 'Tensip_Zapti_2024_782.pdf',
            type: 'Tensip Zaptı',
            size: 142000,
            uploadedAt: '15.03.2024',
            evidentiaryValue: 'Resmi Senet',
            contentPreview: 'Davacı vekili tarafından açılan ticari alacak davasında tensip zaptı tanzim edilmiş olup, HMK 122 ve 127 uyarınca 2 haftalık cevap süresi verilmiştir.',
            analysisSummary: 'Tensip zaptında delil avansı ve bilirkişi ücreti yatırılmış, görevli mahkemenin Ticaret Mahkemesi olduğu kesinleşmiştir.',
            lawArticle: 'HMK m. 122'
          },
          {
            id: 'file-2',
            name: 'Ticari_Fatura_ve_Sevk_Irsaliyesi.pdf',
            type: 'Fatura / İrsaliye',
            size: 295000,
            uploadedAt: '18.03.2024',
            evidentiaryValue: 'Kesin Delil',
            contentPreview: 'FATURA NO: E-FAT-2024-00412. Teslim edilen emtia: 1.200 top pamuklu denim kumaş. Kaşe ve imza teslim alan lojistik şefi tarafından tatbik edilmiştir.',
            analysisSummary: 'İrsaliye üzerindeki teslim imzası inkar edilmemiş olup, HMK m. 200 senetle ispat şartını sağlamaktadır.',
            lawArticle: 'HMK m. 200 & TTK m. 21'
          }
        ]
      },
      {
        id: 'case-atlas-2',
        caseNumber: '2023/1104 Esas',
        court: 'İstanbul Bölge Adliye Mahkemesi 12. Hukuk Dairesi',
        subject: 'Ticari Alacağın Tahsili İstinaf Kanun Yolu İncelemesi',
        status: 'Pending',
        openedDate: '2023-11-05',
        nextHearingDate: '2026-11-20',
        stage: 'İstinaf / Temyiz',
        estimatedValue: '820.000 TL',
        opponentName: 'Marmara Lojistik ve Dağıtım A.Ş.',
        files: [
          {
            id: 'file-3',
            name: 'Istinaf_Basvuru_Dilekcesi.pdf',
            type: 'Tensip Zaptı',
            size: 180000,
            uploadedAt: '12.12.2023',
            evidentiaryValue: 'Kesin Delil',
            contentPreview: 'İlk derece mahkemesinin eksik inceleme ve bilirkişi raporuna itirazlarımızın karşılanmaması nedeniyle istinaf kanun yolu başvurumuz.',
            analysisSummary: 'HMK 341 ve 345 maddelerine uygun olarak süresinde istinaf harcı yatırılarak başvuru yapılmıştır.',
            lawArticle: 'HMK m. 345'
          }
        ]
      }
    ]
  },
  {
    id: 'cli-serkan-2',
    fullName: 'Serkan Yıldırım',
    type: 'Gerçek Kişi',
    idNumber: 'TCKN: 28419204918',
    email: 'serkan.yildirim@gmail.com',
    phone: '0 (532) 555 12 34',
    address: 'Kartaltepe Mah. İncirli Cad. No:18 Bakırköy / İstanbul',
    notes: 'Kıdem ve fazla mesai alacağı uyuşmazlığı',
    cases: [
      {
        id: 'case-serkan-1',
        caseNumber: '2024/412 Esas',
        court: 'Bakırköy 3. İş Mahkemesi',
        subject: 'Kıdem, İhbar Tazminatı ve Fazla Mesai Alacağı Davası',
        status: 'Open',
        openedDate: '2024-04-18',
        nextHearingDate: '2026-10-02',
        stage: 'Tahkikat & Bilirkişi',
        estimatedValue: '310.000 TL',
        opponentName: 'Mega Perakende Mağazacılık A.Ş.',
        files: [
          {
            id: 'file-4',
            name: 'Bilirkişi_Kok_Hesap_Raporu.pdf',
            type: 'Bilirkişi Raporu',
            size: 410000,
            uploadedAt: '10.08.2024',
            evidentiaryValue: 'Takdiri Delil',
            contentPreview: 'Davacı işçinin 6 yıl 4 ay kıdem süresi, banka kayıtları ve tanık beyanlarına göre haftalık 14 saat fazla çalışma alacağı hesaplanmıştır.',
            analysisSummary: 'Hakkaniyet indirimi (%30) sonrası net alacak tutarı 217.000 TL olarak tespit edilmiştir.',
            lawArticle: 'İş Kanunu m. 41'
          }
        ]
      }
    ]
  },
  {
    id: 'cli-kuzey-3',
    fullName: 'Kuzey Rüzgarı Enerji Yatırımları A.Ş.',
    type: 'Tüzel Kişi / Şirket',
    idNumber: 'VKN: 6120489912',
    email: 'legal@kuzeyenerji.com',
    phone: '0 (312) 210 99 00',
    address: 'Söğütözü Mah. 2176. Sok. No: 7 Çankaya / Ankara',
    notes: 'Yenilenebilir enerji lisans ve kamulaştırma dosyaları',
    cases: [
      {
        id: 'case-kuzey-1',
        caseNumber: '2024/915 Esas',
        court: 'Ankara 8. Asliye Hukuk Mahkemesi',
        subject: 'Kamulaştırmasız El Atma Nedeniyle Tazminat Davası',
        status: 'Open',
        openedDate: '2024-06-01',
        nextHearingDate: '2026-10-28',
        stage: 'Ön İnceleme',
        estimatedValue: '1.450.000 TL',
        opponentName: 'TEDAŞ / Türkiye Elektrik Dağıtım A.Ş.',
        files: [
          {
            id: 'file-5',
            name: 'Karasal_Harita_ve_Kesif_Zapti.pdf',
            type: 'Tensip Zaptı',
            size: 512000,
            uploadedAt: '14.07.2024',
            evidentiaryValue: 'Resmi Senet',
            contentPreview: 'Enerji nakil hatlarının santral parseli üzerinden geçirilmesi nedeniyle irtifak hakkı tesis edilmeksizin fiili el atma tespiti.',
            analysisSummary: 'Kamulaştırma Kanunu m. 19 ve Yargıtay HGK 2021/418 E. kararı gereği tam mülkiyet bedeli talep edilebilir.',
            lawArticle: 'Kamulaştırma K. Ek m. 1'
          }
        ]
      }
    ]
  },
  {
    id: 'cli-elif-4',
    fullName: 'Elif Zeynep Doğan',
    type: 'Gerçek Kişi',
    idNumber: 'TCKN: 10982746102',
    email: 'elif.dogan@outlook.com',
    phone: '0 (544) 332 89 71',
    address: 'Ataşehir Batı Mah. Ihlamur Sok. Kadıköy / İstanbul',
    notes: 'Aile ve ziynet eşyası alacağı uyuşmazlığı',
    cases: [
      {
        id: 'case-elif-1',
        caseNumber: '2023/520 Esas',
        court: 'İstanbul Anadolu 5. Aile Mahkemesi',
        subject: 'Katkı Payı ve Düğün Ziynet Eşyası İadesi Davası',
        status: 'Closed',
        openedDate: '2023-05-10',
        stage: 'Sözlü Yargılama',
        estimatedValue: '620.000 TL',
        opponentName: 'Mustafa Doğan',
        files: [
          {
            id: 'file-6',
            name: 'Gerekceli_Karar_Ilam.pdf',
            type: 'Tensip Zaptı',
            size: 220000,
            uploadedAt: '15.01.2024',
            evidentiaryValue: 'Resmi Senet',
            contentPreview: 'Davanın kısmen kabulü ile 420.000 TL ziynet bedelinin yasal faiziyle davalıdan tahsiline karar verilmiştir.',
            analysisSummary: 'Karar kesinleşmiş olup icra takibine konulmuştur.',
            lawArticle: 'TMK m. 227'
          }
        ]
      }
    ]
  }
];

const EVENT_NAME = 'ultra_hukuk_clients_updated';

let activeLawyerSicil = '8109';

export function setActiveLawyerSicil(sicil: string): void {
  activeLawyerSicil = sicil;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: getClientList() }));
  }
}

export function getActiveLawyerSicil(): string {
  return activeLawyerSicil;
}

function getStorageKeyForLawyer(sicil?: string): string {
  const s = sicil || activeLawyerSicil || '8109';
  return `ultra_hukuk_clients_v4_${s}`;
}

export function getClientList(): ClientItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKeyForLawyer();
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_CLIENTS));
      return DEFAULT_CLIENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array in storage for 8109, seed default clients
    if (Array.isArray(parsed) && parsed.length === 0 && (activeLawyerSicil === '8109' || !activeLawyerSicil)) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_CLIENTS));
      return DEFAULT_CLIENTS;
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse clients from storage:', err);
    return DEFAULT_CLIENTS;
  }
}

export function clearAllClientData(): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKeyForLawyer();
    localStorage.setItem(key, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }));
  } catch (err) {
    console.warn('Failed to clear client data:', err);
  }
}

export function saveClientList(clients: ClientItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKeyForLawyer();
    localStorage.setItem(key, JSON.stringify(clients));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: clients }));
  } catch (err) {
    console.warn('Failed to save clients to storage:', err);
  }
}

export function subscribeToClientUpdates(callback: (clients: ClientItem[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getClientList());
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function addClient(newClientData: {
  fullName: string;
  type: 'Gerçek Kişi' | 'Tüzel Kişi / Şirket';
  idNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}): ClientItem {
  const current = getClientList();
  const newClient: ClientItem = {
    id: `cli-${Date.now()}`,
    fullName: newClientData.fullName.trim(),
    type: newClientData.type,
    idNumber: newClientData.idNumber.trim() || 'Belirtilmedi',
    email: newClientData.email?.trim() || '',
    phone: newClientData.phone?.trim() || '',
    address: newClientData.address?.trim() || '',
    notes: newClientData.notes?.trim() || '',
    cases: []
  };

  const updated = [newClient, ...current];
  saveClientList(updated);
  return newClient;
}

export function addCaseToClient(
  clientId: string,
  newCaseData: {
    caseNumber: string;
    court: string;
    subject: string;
    opponentName: string;
    estimatedValue?: string;
    stage?: ClientCase['stage'];
    nextHearingDate?: string;
  }
): ClientCase | null {
  const current = getClientList();
  let createdCase: ClientCase | null = null;

  const updated = current.map((c) => {
    if (c.id === clientId) {
      createdCase = {
        id: `case-${Date.now()}`,
        caseNumber: newCaseData.caseNumber.trim(),
        court: newCaseData.court.trim(),
        subject: newCaseData.subject.trim(),
        status: 'Open',
        openedDate: new Date().toISOString().split('T')[0],
        nextHearingDate: newCaseData.nextHearingDate?.trim() || undefined,
        stage: newCaseData.stage || 'Dava Açılışı & Tensip',
        estimatedValue: newCaseData.estimatedValue?.trim() || 'Belirtilmedi',
        opponentName: newCaseData.opponentName.trim(),
        files: []
      };
      return {
        ...c,
        cases: [createdCase, ...c.cases]
      };
    }
    return c;
  });

  if (createdCase) {
    saveClientList(updated);
  }
  return createdCase;
}

export function updateCaseHearingDate(
  clientId: string,
  caseId: string,
  nextHearingDate: string
): boolean {
  const current = getClientList();
  let found = false;

  const updated = current.map((c) => {
    if (c.id === clientId) {
      return {
        ...c,
        cases: c.cases.map((cs) => {
          if (cs.id === caseId) {
            found = true;
            return {
              ...cs,
              nextHearingDate: nextHearingDate.trim()
            };
          }
          return cs;
        })
      };
    }
    return c;
  });

  if (found) {
    saveClientList(updated);
  }
  return found;
}

export function addDocumentToCase(
  clientId: string,
  caseId: string,
  docData: {
    name: string;
    type: string;
    evidentiaryValue?: CaseFileItem['evidentiaryValue'];
    contentPreview: string;
    analysisSummary?: string;
    lawArticle?: string;
    size?: number;
  }
): CaseFileItem | null {
  const current = getClientList();
  let createdDoc: CaseFileItem | null = null;

  const updated = current.map((c) => {
    if (c.id === clientId) {
      return {
        ...c,
        cases: c.cases.map((cs) => {
          if (cs.id === caseId) {
            createdDoc = {
              id: `file-${Date.now()}`,
              name: docData.name.trim(),
              type: docData.type,
              size: docData.size || Math.floor(Math.random() * 300000 + 50000),
              uploadedAt: new Date().toLocaleDateString('tr-TR'),
              evidentiaryValue: docData.evidentiaryValue || 'Takdiri Delil',
              contentPreview: docData.contentPreview.trim(),
              analysisSummary: docData.analysisSummary || 'Belge kaydedildi ve delil başlangıcı olarak incelendi.',
              lawArticle: docData.lawArticle || 'HMK m. 199'
            };
            return {
              ...cs,
              files: [createdDoc, ...cs.files]
            };
          }
          return cs;
        })
      };
    }
    return c;
  });

  if (createdDoc) {
    saveClientList(updated);
  }
  return createdDoc;
}

export function deleteClient(clientId: string): void {
  const current = getClientList();
  const updated = current.filter((c) => c.id !== clientId);
  saveClientList(updated);
}

export function deleteCase(clientId: string, caseId: string): void {
  const current = getClientList();
  const updated = current.map((c) => {
    if (c.id === clientId) {
      return {
        ...c,
        cases: c.cases.filter((cs) => cs.id !== caseId)
      };
    }
    return c;
  });
  saveClientList(updated);
}

/**
 * Moves a case to the archived state, removing it from the active dashboard view.
 */
export function archiveCase(clientId: string, caseId: string, reason?: string): boolean {
  const current = getClientList();
  let found = false;

  const updated = current.map((c) => {
    if (c.id === clientId) {
      return {
        ...c,
        cases: c.cases.map((cs) => {
          if (cs.id === caseId) {
            found = true;
            return {
              ...cs,
              isArchived: true,
              archivedAt: new Date().toISOString(),
              archiveReason: reason?.trim() || 'Avukat tarafından arşivlendi'
            };
          }
          return cs;
        })
      };
    }
    return c;
  });

  if (found) {
    saveClientList(updated);
  }
  return found;
}

/**
 * Restores an archived case back to the active case list.
 */
export function unarchiveCase(clientId: string, caseId: string): boolean {
  const current = getClientList();
  let found = false;

  const updated = current.map((c) => {
    if (c.id === clientId) {
      return {
        ...c,
        cases: c.cases.map((cs) => {
          if (cs.id === caseId) {
            found = true;
            const updatedCase = { ...cs };
            delete updatedCase.isArchived;
            delete updatedCase.archivedAt;
            delete updatedCase.archiveReason;
            return updatedCase;
          }
          return cs;
        })
      };
    }
    return c;
  });

  if (found) {
    saveClientList(updated);
  }
  return found;
}

/**
 * Returns all archived cases flattened across all clients.
 */
export function getArchivedCases(): { client: ClientItem; caseItem: ClientCase }[] {
  const clients = getClientList();
  const list: { client: ClientItem; caseItem: ClientCase }[] = [];
  clients.forEach((c) => {
    (c.cases || []).forEach((cs) => {
      if (cs.isArchived) {
        list.push({ client: c, caseItem: cs });
      }
    });
  });
  return list;
}

/**
 * Returns all active (non-archived) cases flattened across all clients.
 */
export function getActiveCases(): { client: ClientItem; caseItem: ClientCase }[] {
  const clients = getClientList();
  const list: { client: ClientItem; caseItem: ClientCase }[] = [];
  clients.forEach((c) => {
    (c.cases || []).forEach((cs) => {
      if (!cs.isArchived) {
        list.push({ client: c, caseItem: cs });
      }
    });
  });
  return list;
}

export function deleteDocument(clientId: string, caseId: string, docId: string): void {
  const current = getClientList();
  const updated = current.map((c) => {
    if (c.id === clientId) {
      return {
        ...c,
        cases: c.cases.map((cs) => {
          if (cs.id === caseId) {
            return {
              ...cs,
              files: cs.files.filter((f) => f.id !== docId)
            };
          }
          return cs;
        })
      };
    }
    return c;
  });
  saveClientList(updated);
}

/**
 * Triggers browser download of a text report containing all selected files and metadata.
 */
export function downloadDocumentsPackage(
  clientName: string,
  caseNumber: string,
  selectedFiles: CaseFileItem[]
): void {
  if (!selectedFiles.length) return;

  const header = `========================================================================
T.C. HUKUK VE DAVA DOSYASI EVRAK BİLGİ VE DELİL PAKETİ
Müvekkil: ${clientName}
Dava / Esas No: ${caseNumber}
Paketleme Tarihi: ${new Date().toLocaleString('tr-TR')}
Toplam Evrak Sayısı: ${selectedFiles.length}
========================================================================\n\n`;

  const body = selectedFiles
    .map((file, idx) => {
      return `------------------------------------------------------------------------
[EVRAK #${idx + 1}]
Dosya Adı: ${file.name}
Belge Türü: ${file.type}
İspat / Delil Değeri: ${file.evidentiaryValue}
İlgili Kanun Maddesi: ${file.lawArticle || 'HMK m. 199'}
Yüklenme Tarihi: ${file.uploadedAt}
Boyut: ${(file.size / 1024).toFixed(1)} KB

[METİN / İÇERİK ÖZETİ]
${file.contentPreview}

[HUKUKİ ANALİZ VE DEĞERLENDİRME NOTU]
${file.analysisSummary || 'Analiz notu mevcut değil.'}
------------------------------------------------------------------------\n`;
    })
    .join('\n');

  const fullContent = header + body;
  const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${caseNumber.replace(/[^a-zA-Z0-9]/g, '_')}_toplu_evrak_paketi.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
