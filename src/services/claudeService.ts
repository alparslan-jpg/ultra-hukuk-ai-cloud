/**
 * Ultra Hukuk AI — Claude 3.5 Sonnet / Opus ve Hibrit Çoklu Ajan Servisi
 * Anthropic Claude Entegrasyonu, Sabitlenmiş Sistem Promptları ve Hukuki Muhakeme Katmanı
 */

// ── Sabitlenmiş Sistem Promptları (İş Emri Standartları) ─────────────────────

/**
 * 1. Claude İçtihat ve Dilekçe Sentezleme Ajanı (System Prompt)
 */
export const CLAUDE_PETITION_SYSTEM_PROMPT = `Sen Türkiye Cumhuriyeti hukuk sistemine tam hakim, kıdemli bir Kıdemli Hukuk Yapay Zeka Asistanısın. Görevin; avukata sunduğun emsal kararları ve dava vakıalarını harmanlayarak kusursuz, hukuki argümanları güçlü ve UYAP/UDF standartlarına uygun dilekçe taslakları hazırlamaktır.
Kurallar:
1. Asla uydurma (hallucinated) kanun maddesi veya içtihat üretme. Sadece sisteme sağlanan verified verileri kullan.
2. Dilekçe metninde mahkeme başlığı, olay, hukuki nedenler ve talep sonrasında net bir hukuki sonuç bölümü bulundur.
3. Üslubun mesleki, ağırbaşlı, ikna edici ve savunma odaklı olmalıdır.`;

/**
 * 2. Multi-Agent Dava Risk Analiz Ajanı (System Prompt)
 */
export const MULTI_AGENT_SIMULATION_SYSTEM_PROMPT = `Sen çok yönlü bir Hukuki Risk Analiz ve Dava Simülasyon Ajanısın. Sana sunulan dava dosyasını sırasıyla 'Hâkim', 'Karşı Taraf Avukatı' ve 'Bilirkişi' gözüyle inceleyeceksin.
Çıktı Formatı:
- [Hâkim Gözüyle Zayıf Noktalar]: Davadaki hak düşürücü süre veya delil eksiklikleri.
- [Karşı Tarafın Muhtemel Hamleleri]: Karşı tarafın yapabileceği itirazlar.
- [Stratejik Tavsiye]: Avukatın kazanma şansını artırmak için alması gereken somut aksiyonlar.`;

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface ClaudePetitionRequest {
  courtName: string;
  caseNumber?: string;
  plaintiff: string;
  defendant: string;
  subject: string;
  facts: string;
  evidenceList?: string[];
  selectedPrecedents?: string[];
  petitionType?: 'Dava Dilekçesi' | 'Cevap Dilekçesi' | 'İtiraz Dilekçesi' | 'İstinaf Layihası' | 'Beyan Dilekçesi';
  preferredModel?: 'claude-3-5-sonnet' | 'claude-3-opus' | 'gemini-3.1-pro';
}

export interface ClaudePetitionResponse {
  success: boolean;
  engineUsed: string;
  model: string;
  petitionText: string;
  legalAnalysis: {
    legalBases: string[];
    precedentsApplied: string[];
    riskScore: number;
    recommendedProceduralActions: string[];
  };
  error?: string;
}

export interface MultiAgentSimulationRequest {
  caseSubject: string;
  caseDetails: string;
  evidenceSummary?: string;
  proceduralHistory?: string;
  clientPosition: 'Davacı' | 'Davalı' | 'Müşteki' | 'Sanık';
  preferredModel?: 'claude-3-5-sonnet' | 'claude-3-opus' | 'gemini-3.1-pro';
}

export interface MultiAgentSimulationResponse {
  success: boolean;
  engineUsed: string;
  model: string;
  hakimGozuyleZayifNoktalar: string[];
  karsiTarafMuhtemelHamleleri: string[];
  bilirkisiTeknikDenetimi: {
    eksikHesaplamalar: string[];
    teknikRiskler: string[];
    kusurVeMetrajUygunlugu: string;
  };
  stratejikTavsiye: string;
  davaKazanmaOrani: number; // 0 - 100
  rawReport: string;
  error?: string;
}

// ── İstemci API Çağrıları ───────────────────────────────────────────────────

export async function generateClaudePetition(
  params: ClaudePetitionRequest
): Promise<ClaudePetitionResponse> {
  try {
    const res = await fetch('/api/ai/claude-petition-synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      engineUsed: 'Hata',
      model: 'Bilinmiyor',
      petitionText: '',
      legalAnalysis: {
        legalBases: [],
        precedentsApplied: [],
        riskScore: 50,
        recommendedProceduralActions: []
      },
      error: err.message || 'Sunucu ile bağlantı kurulamadı.'
    };
  }
}

export async function runMultiAgentSimulation(
  params: MultiAgentSimulationRequest
): Promise<MultiAgentSimulationResponse> {
  try {
    const res = await fetch('/api/ai/multi-agent-case-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      engineUsed: 'Hata',
      model: 'Bilinmiyor',
      hakimGozuyleZayifNoktalar: ['Sunucu bağlantı hatası oluştu.'],
      karsiTarafMuhtemelHamleleri: ['Sunucu bağlantı hatası oluştu.'],
      bilirkisiTeknikDenetimi: {
        eksikHesaplamalar: [],
        teknikRiskler: [],
        kusurVeMetrajUygunlugu: 'Denetlenemedi'
      },
      stratejikTavsiye: 'Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.',
      davaKazanmaOrani: 50,
      rawReport: '',
      error: err.message || 'Sunucu ile bağlantı kurulamadı.'
    };
  }
}
