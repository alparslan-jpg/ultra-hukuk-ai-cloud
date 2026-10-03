// ============================================================
// ULTRA HUKUK AI — Hukuki Tasnif Ajanı (Legal Classification Agent)
// Görevi: Dava vakıalarından, uyuşmazlığın hukuki nitelendirmesini,
// görevli/yetkili mahkemeyi, zorunlu dava şartı arabuluculuğu,
// zamanaşımı türünü ve ispat yükü dağılımını HMK/TBK/TTK'ya göre tespit etmek.
// ============================================================

export interface LegalClassificationResult {
  disputeCategory: string; // 'Ticaret Hukuku (Ticari Dava)' | 'İş Hukuku' | 'Tüketici Hukuku' | 'Borçlar Hukuku (Genel Hükümler)' | 'Kira & Gayrimenkul' | 'Ceza Hukuku' | 'İcra & İflas Hukuku';
  specificDisputeType: string; // 'İtirazın İptali', 'Kıdem/İhbar Tazminatı', 'Ayıplı Mal/Hizmet Bedel İadesi', vb.
  competentCourt: {
    courtType: string; // 'Asliye Ticaret Mahkemesi', 'İş Mahkemesi', 'Tüketici Mahkemesi', vb.
    statutoryBasis: string; // '6102 sayılı TTK m. 4 ve m. 5', '7036 sayılı İş Mahkemeleri Kanunu m. 5'
    jurisdictionRules: string; // Yetki kuralı (HMK m. 6 genel yetki, sözleşmenin ifa yeri m. 10)
  };
  mandatoryPreconditions: {
    mandatoryMediationRequired: boolean; // Zorunlu Dava Şartı Arabuluculuk
    statutoryReference: string; // TTK m. 5/A, İMK m. 3, TKHK m. 73/A
    consequenceOfOmission: string; // 'HMK m. 114/2 ve m. 115/2 uyarınca davanın usulden derhal reddi'
  };
  limitationAndPrescription: {
    limitationPeriodYears: number; // 1, 3, 5, 10
    statutoryReference: string; // TBK m. 146, TBK m. 147, 4857 SK m. 32
    triggerEvent: string; // Muacceliyet tarihi, fesih tarihi, teslim tarihi
  };
  burdenOfProof: {
    onPlaintiff: string;
    onDefendant: string;
    senetThresholdApplicable: boolean; // HMK m. 200 senetle ispat sınırı geçerli mi?
  };
  recommendedCauseOfAction: string;
  keyLegalGrounds: string[];
  classifiedAt: string;
}

export class LegalClassificationAgent {
  /**
   * Kural Tabanlı Deterministik Hukuki Tasnif (Yedek & Çevrimdışı Katman)
   */
  public static getRuleBasedClassification(context: string): LegalClassificationResult {
    const isCommercial = /fatura|irsaliye|cari hesap|tacir|ticari|çek|senet|şirket|ticaret sicil/i.test(context);
    const isLabor = /kıdem|ihbar|işçi|işveren|sgk|hizmet akdi|fazla mesai|yıllık izin|işe iade/i.test(context);
    const isConsumer = /tüketici|ayıplı mal|garanti belgesi|tüketici hakem heyeti|kredi kartı aidatı/i.test(context);
    const isRent = /kira|tahliye|kiracı|kiraya veren|kira tespit|kira uyarlama/i.test(context);
    const isEnforcement = /icra|ödeme emri|itirazın iptali|menfi tespit|istirdat|haciz/i.test(context);

    let defaultCategory = 'Borçlar Hukuku (Genel Hükümler)';
    let defaultCourt = 'Asliye Hukuk Mahkemesi';
    let defaultBasis = 'HMK m. 2';
    let defaultMediation = false;
    let defaultMediationRef = 'Zorunlu değil, ihtiyari arabuluculuk uygulanabilir';
    let defaultLimit = 10;
    let defaultLimitRef = '6098 sayılı TBK m. 146 (10 yıllık genel zamanaşımı)';

    if (isCommercial) {
      defaultCategory = 'Ticaret Hukuku (Ticari Dava)';
      defaultCourt = 'Asliye Ticaret Mahkemesi';
      defaultBasis = '6102 sayılı TTK m. 4 ve m. 5';
      defaultMediation = true;
      defaultMediationRef = '6102 sayılı TTK m. 5/A (Ticari davalarda konusu para olan alacaklarda zorunlu arabuluculuk)';
      defaultLimit = 5;
      defaultLimitRef = '6098 sayılı TBK m. 147/1 veya TTK m. 732/778';
    } else if (isLabor) {
      defaultCategory = 'İş Hukuku';
      defaultCourt = 'İş Mahkemesi';
      defaultBasis = '7036 sayılı İş Mahkemeleri Kanunu m. 5';
      defaultMediation = true;
      defaultMediationRef = '7036 sayılı İMK m. 3 (İşçilik alacağı ve tazminat taleplerinde dava şartı arabuluculuk)';
      defaultLimit = 5;
      defaultLimitRef = '4857 sayılı İş Kanunu Ek m. 3 (Kıdem, ihbar, yıllık izin 5 yıl)';
    } else if (isConsumer) {
      defaultCategory = 'Tüketici Hukuku';
      defaultCourt = 'Tüketici Mahkemesi';
      defaultBasis = '6502 sayılı TKHK m. 73';
      defaultMediation = true;
      defaultMediationRef = '6502 sayılı TKHK m. 73/A (Tüketici uyuşmazlıklarında dava şartı arabuluculuk)';
      defaultLimit = 2;
      defaultLimitRef = '6502 sayılı TKHK m. 12 (Ayıplı malda 2 yıllık zamanaşımı)';
    } else if (isRent) {
      defaultCategory = 'Kira & Gayrimenkul Hukuku';
      defaultCourt = 'Sulh Hukuk Mahkemesi';
      defaultBasis = '6100 sayılı HMK m. 4/1-a';
      defaultMediation = true;
      defaultMediationRef = '6325 sayılı Kanun m. 18/B (Kira ilişkisinden doğan uyuşmazlıklarda dava şartı arabuluculuk)';
      defaultLimit = 5;
      defaultLimitRef = 'TBK m. 147/4 (Kira bedelleri 5 yıl)';
    }

    return {
      disputeCategory: defaultCategory,
      specificDisputeType: isEnforcement ? 'İtirazın İptali Davası' : 'Eda / Alacak Davası',
      competentCourt: {
        courtType: defaultCourt,
        statutoryBasis: defaultBasis,
        jurisdictionRules: 'HMK m. 6 (Genel Yetki: Davalı Yerleşim Yeri) veya HMK m. 10 (Sözleşmenin İfa Yeri)'
      },
      mandatoryPreconditions: {
        mandatoryMediationRequired: defaultMediation,
        statutoryReference: defaultMediationRef,
        consequenceOfOmission: 'HMK m. 114/2 ve m. 115/2 uyarınca dava şartı yokluğundan usulden ret'
      },
      limitationAndPrescription: {
        limitationPeriodYears: defaultLimit,
        statutoryReference: defaultLimitRef,
        triggerEvent: 'Fatura tebliğ veya temerrüt tarihi'
      },
      burdenOfProof: {
        onPlaintiff: 'Akdi ilişkinin varlığı ve teslim (HMK m. 190, TTK m. 21)',
        onDefendant: 'Ödeme savunması veya ayıbın süresinde ihbar edildiği (TTK m. 23/1-c)',
        senetThresholdApplicable: true
      },
      recommendedCauseOfAction: 'İtirazın iptali ile icra inkar tazminatı talepli dava.',
      keyLegalGrounds: ['6100 sayılı HMK', '6098 sayılı TBK m. 89 ve m. 117', '6102 sayılı TTK m. 4 ve m. 5/A'],
      classifiedAt: new Date().toISOString()
    };
  }

  /**
   * Dava metnini ve delilleri analiz ederek kapsamlı hukuki tasnif üretir
   * Canlı sistemde backend API üzerinden Gemini-3.1-pro modelini tetikler
   */
  public static async classifyCase(
    facts: string,
    fileName?: string,
    lawyerSicil: string = '8109'
  ): Promise<LegalClassificationResult> {
    try {
      const res = await fetch('/api/v1/ai/classify-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts, fileName, lawyerSicil })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.classification) {
          return json.classification;
        }
      }
    } catch (e: any) {
      console.warn('[LegalClassificationAgent API Fallback to Local Rules]:', e?.message);
    }

    return this.getRuleBasedClassification(facts || '');
  }
}
