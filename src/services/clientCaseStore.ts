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
  status: 'Açık' | 'Kapalı' | 'Üst Mahkemede' | 'Beklemede' | 'Open' | 'Pending' | 'Closed';
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

export const DEFAULT_CLIENTS: ClientItem[] = [];

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
  return `ultra_hukuk_clients_v6_clean_${s}`;
}

export function getClientList(): ClientItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKeyForLawyer();
    
    // Purge any legacy versions from localStorage
    Object.keys(localStorage).forEach((k) => {
      if ((k.startsWith('ultra_hukuk_clients_') || k.startsWith('client_cases_')) && k !== key) {
        localStorage.removeItem(k);
      }
    });

    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any legacy dummy names
    const dummyNames = ['sabri özcan', 'atlas tekstil', 'serkan yıldırım', 'kuzey rüzgarı', 'elif zeynep doğan'];
    const cleaned = parsed.filter(c => 
      !dummyNames.some(d => (c.fullName || '').toLowerCase().includes(d))
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.warn('Failed to parse clients from storage:', err);
    return [];
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

export function updateCaseStatus(
  clientId: string,
  caseId: string,
  status: 'Açık' | 'Kapalı' | 'Üst Mahkemede' | 'Beklemede'
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
            return { ...cs, status: status as any };
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
