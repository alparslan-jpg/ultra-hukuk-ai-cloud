// ============================================================
// ULTRA HUKUK AI — Taraf Seçimi ve %100 Müvekkil Yanlısı AI Servisi
// Avukat "Davacı" veya "Davalı" tarafını seçtiğinde, tüm sistem
// analiz motorları, dilekçe oluşturucu ve dava simülasyonu
// %100 bu müvekkilin lehine ("Müvekkilimi sonuna kadar savun ve kazandır")
// çalışacak şekilde koşullanır ve sekmeler arası anında senkronize olur.
// ============================================================

export type PartySide = 'Davacı' | 'Davalı' | 'none';

export interface SelectedPartyContext {
  side: PartySide;
  plaintiffName: string;
  defendantName: string;
  selectedPartyName: string;
  courtName?: string;
  esasNo?: string;
  subject?: string;
  facts?: string;
  evidence?: string;
  biasPromptDirective: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'ultra_selected_party_context';

export function buildPartyBiasDirective(side: PartySide, partyName: string): string {
  if (side === 'none' || !partyName) {
    return 'Hukuki analiz ve dilekçe kurgusu tarafsız, objektif ve kanuni usul kurallarına uygun olarak yürütülecektir.';
  }

  const roleText = side === 'Davacı' ? 'DAVACI (MÜVEKKİL)' : 'DAVALI (MÜVEKKİL)';
  const counterRoleText = side === 'Davacı' ? 'DAVALI (KARŞI TARAF)' : 'DAVACI (KARŞI TARAF)';

  return `
🔥🔥🔥 [ZORUNLU VE TAVİZSİZ MÜVEKKİL SAVUNMA PROTOKOLÜ - %100 BİAS EMİR VE TALİMATI] 🔥🔥🔥
Sayın AI Ajanı ve Baş Hukuk Müşaviri:
Bu davada ve hukuki süreçte avukatımızın temsil ettiği MÜVEKKİL: "${partyName}" (${roleText}) tarafıdır!
Karşı taraf ise: ${counterRoleText} tarafıdır.

TÜM USUL, ESAS, DELİL, SÜRE VE TENSİP ANALİZLERİ İSTİSNASIZ ŞU KURALLAR ÇERÇEVESİNDE ÜRETİLECEKTİR:
1. %100 MÜVEKKİLİN MUTLAK LEHİNE STRATEJİ:
   Tüm savunma kalkanı, hukuki argümanlar, Yargıtay emsal kararları ve dilekçe kurgusu KESİNLİKLE müvekkil "${partyName}" lehine ve onun davayı tam zaferle kazanması amacıyla oluşturulacaktır.
2. KARŞI TARAFIN İDDİALARINI ÇÜRÜTME:
   Karşı tarafın ileri sürebileceği veya sürdüğü her türlü iddia, itiraz ve delil; usulden (yetki, görev, zamanaşımı, hak düşürücü süre, arabuluculuk yokluğu) ve esastan derhal çürütülecek, zayıf halkaları tespit edilip avukatımızın eline ezici karşı argümanlar sunulacaktır.
3. TALEP VE NETİCE-İ TALEP:
   ${side === 'Davacı'
     ? `Davanın TAMAMEN KABULÜNE, alacağın en yüksek yasal/avans/ticari faiziyle tahsiline, karşı tarafın %20'den aşağı olmamak üzere icra inkar tazminatına ve tüm yargılama gideri ile vekalet ücretine mahkum edilmesine odaklan.`
     : `Haksız, mesnetsiz ve hukuki dayanaktan yoksun DAVANIN USULDEN VE ESASTAN TAMAMEN REDDİNE, haksız takip/dava nedeniyle davacının %20'den aşağı olmamak üzere kötüniyet tazminatına, tüm yargılama harç ve masrafları ile vekalet ücretinin karşı tarafa yükletilmesine odaklan.`}
4. DİL VE ÜSLUP:
   Son derece kararlı, kendinden emin, Türk Hukuku doktrin ve Yargıtay Hukuk Genel Kurulu ilkelerine dayalı, UYAP ve mahkeme nezdinde tartışmasız üstünlük sağlayan bir dil kullanılacaktır.
🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
`.trim();
}

export class PartyContextService {
  public static get(): SelectedPartyContext {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}

    return {
      side: 'none',
      plaintiffName: '',
      defendantName: '',
      selectedPartyName: '',
      courtName: '',
      esasNo: '',
      subject: '',
      facts: '',
      evidence: '',
      biasPromptDirective: buildPartyBiasDirective('none', ''),
      lastUpdated: new Date().toISOString()
    };
  }

  public static set(ctx: Partial<SelectedPartyContext>): SelectedPartyContext {
    const current = this.get();
    const side = ctx.side !== undefined ? ctx.side : current.side;
    const plaintiffName = ctx.plaintiffName !== undefined ? ctx.plaintiffName : current.plaintiffName;
    const defendantName = ctx.defendantName !== undefined ? ctx.defendantName : current.defendantName;
    
    let selectedPartyName = '';
    if (side === 'Davacı') selectedPartyName = plaintiffName;
    else if (side === 'Davalı') selectedPartyName = defendantName;

    const biasPromptDirective = buildPartyBiasDirective(side, selectedPartyName);

    const updated: SelectedPartyContext = {
      ...current,
      ...ctx,
      side,
      plaintiffName,
      defendantName,
      selectedPartyName,
      biasPromptDirective,
      lastUpdated: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Sekmeler ve pencereler arası tetikleme için CustomEvent
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultra_party_context_changed', { detail: updated }));
      }
    } catch {}

    return updated;
  }

  public static selectSide(side: PartySide): SelectedPartyContext {
    return this.set({ side });
  }

  public static subscribe(callback: (ctx: SelectedPartyContext) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleEvent = (e: any) => {
      if (e.detail) callback(e.detail);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { callback(JSON.parse(e.newValue)); } catch {}
      }
    };

    window.addEventListener('ultra_party_context_changed', handleEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('ultra_party_context_changed', handleEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }
}
