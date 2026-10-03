import React, { useState } from 'react';
import {
  Brain,
  Gavel,
  ShieldAlert,
  Swords,
  Calculator,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FileText,
  Copy,
  Check,
  Percent,
  Sliders,
  Cpu,
  Layers,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  runMultiAgentSimulation,
  MultiAgentSimulationRequest,
  MultiAgentSimulationResponse
} from '../services/claudeService';
import { PartyContextService, SelectedPartyContext } from '../services/partyContextService';

export interface MultiAgentDavaSimulasyonuProps {
  onApplyToPetition?: (simulationSummary: string) => void;
  initialCaseSubject?: string;
  initialCaseDetails?: string;
}

const ORNEK_DAVALAR = [
  {
    id: 'preset-ticari',
    baslik: 'Ticari İtirazın İptali (Fatura & Cari Hesap)',
    konu: 'Ticari Faturaya Dayalı İlamsız İcra Takibine Haksız İtirazın İptali ve %20 İcra İnkar Tazminatı',
    detay: `Davacı müvekkil şirket, davalı borçluya ticari sözleşme ve cari hesap ilişkisi kapsamında malları eksiksiz teslim etmiştir. Sevk irsaliyeleri kaşeli ve imzalıdır. Ancak fatura bedeli süresinde ödenmemiş, takibe 'borcum yoktur' şeklinde kötüniyetli itiraz edilmiştir. TTK m. 18/3 gereğince basiretli tacir yükümlülüğü ihlal edilmiştir.`,
    deliller: 'Sevk irsaliyeleri, ticari defter kayıtları, cari hesap mutabakatı, banka dekontları, zorunlu arabuluculuk son tutanağı',
    taraf: 'Davacı' as const
  },
  {
    id: 'preset-iscilik',
    baslik: 'İşçilik Alacakları & Kıdem/İhbar',
    konu: 'Kıdem, İhbar Tazminatı, Fazla Mesai ve UBGT Alacağı Talebi (4857 Sayılı İş Kanunu m. 17, 24, 41)',
    detay: `Müvekkil işçi, davalı işyerinde 5 yıl süreyle kesintisiz çalışmış, haftalık 55 saati aşan fazla mesai ve bayram çalışmalarının karşılığı ödenmemiştir. Maaşın bir kısmı elden verilmiş, SGK primleri eksik yatırılmıştır. İş akdi haklı nedenle feshedilmiş olup işveren kötüniyetli olarak alacakları ödemekten imtina etmektedir.`,
    deliller: 'Banka hesap ekstreleri, emsal ücret araştırması, işyeri giriş-çıkış kart kayıtları, tanık beyanları, SGK hizmet dökümü',
    taraf: 'Davacı' as const
  },
  {
    id: 'preset-tapu',
    baslik: 'Tapu İptali ve Tescil (TMK m. 713)',
    konu: 'Olağanüstü Zamanaşımı ile Taşınmaz Mülkiyetinin İktisabı (TMK m. 713/1, 2)',
    detay: `Müvekkil ve miras bırakanları, söz konusu taşınmazı 35 yılı aşkın süredir nizasız, fasılasız ve malik sıfatıyla zilyetliğinde bulundurmuştur. İmar ve ihya tamamlanmış olup tapu kütüğündeki malik gaiptir ve terekesi sahipsiz kalmıştır.`,
    deliller: 'Hava fotoğrafları, mahalli bilirkişi ve yaşlı yerel tanık beyanları, vergi makbuzları, kadastro tespit tutanağı, keşif',
    taraf: 'Davacı' as const
  },
  {
    id: 'preset-kira',
    baslik: 'Kira Tahliye ve Kira Alacağı (TBK m. 315 / m. 352)',
    konu: 'İki Haklı İhtar ve Temerrüt Nedeniyle Kiralananın Tahliyesi ve Birikmiş Kira Alacağının Tahsili',
    detay: `Davalı kiracı, kira sözleşmesiyle kiralanan taşınmazın kira bedellerini vadesinde ödememiş, keşide edilen haklı ihtarlara rağmen temerrüde düşmüştür. Kira akdinin feshi ile taşınmazın tahliyesi ve ödenmeyen kira bedellerinin faiziyle tahsili talep edilmektedir.`,
    deliller: 'Kira sözleşmesi, banka hesap hareketleri, noter ihtarnameleri ve tebliğ şerhleri, arabuluculuk tutanağı',
    taraf: 'Davacı' as const
  }
];

export function MultiAgentDavaSimulasyonu({
  onApplyToPetition,
  initialCaseSubject = '',
  initialCaseDetails = ''
}: MultiAgentDavaSimulasyonuProps) {
  // Template Mode & Selection State (Exclusive Radio: Hazır Şablonlar vs Özel Şablon)
  const [templateMode, setTemplateMode] = useState<'hazir' | 'ozel'>('hazir');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customTemplateText, setCustomTemplateText] = useState<string>('');

  // Input states (Editable fields auto-populated by templates or active case files)
  const [caseSubject, setCaseSubject] = useState<string>(
    initialCaseSubject || ORNEK_DAVALAR[0].konu
  );
  const [caseDetails, setCaseDetails] = useState<string>(
    initialCaseDetails || ORNEK_DAVALAR[0].detay
  );
  const [evidenceSummary, setEvidenceSummary] = useState<string>(
    ORNEK_DAVALAR[0].deliller
  );
  const [clientPosition, setClientPosition] = useState<'Davacı' | 'Davalı' | 'Müşteki' | 'Sanık'>('Davacı');
  const [preferredModel, setPreferredModel] = useState<'claude-3-5-sonnet' | 'claude-3-opus' | 'gemini-3.1-pro'>('claude-3-5-sonnet');
  const [partyContext, setPartyContext] = useState<SelectedPartyContext>(() => PartyContextService.get());

  // Exclusive Radio Template Selection Handlers
  const handleSelectPreset = (index: number) => {
    setTemplateMode('hazir');
    setSelectedPresetIndex(index);
    const orn = ORNEK_DAVALAR[index];
    if (orn) {
      setCaseSubject(orn.konu);
      setCaseDetails(orn.detay);
      setEvidenceSummary(orn.deliller);
      setClientPosition(orn.taraf);
    }
  };

  const handleSelectCustom = () => {
    setTemplateMode('ozel');
    if (customTemplateText.trim()) {
      setCaseDetails(customTemplateText);
    }
  };

  const handleCustomTextChange = (val: string) => {
    setCustomTemplateText(val);
    if (templateMode === 'ozel') {
      setCaseDetails(val);
    }
  };

  // Global Taraf Seçimi (Davacı/Davalı) ile Anında Senkronizasyon
  React.useEffect(() => {
    const unsub = PartyContextService.subscribe((ctx) => {
      setPartyContext(ctx);
      if (ctx.side === 'Davacı' || ctx.side === 'Davalı') {
        setClientPosition(ctx.side);
      }
      if (ctx.subject) {
        setCaseSubject(ctx.subject);
      }
      if (ctx.facts && !caseDetails) {
        setCaseDetails(ctx.facts);
      }
      if (ctx.evidence && !evidenceSummary) {
        setEvidenceSummary(ctx.evidence);
      }
    });

    const current = PartyContextService.get();
    if (current.side === 'Davacı' || current.side === 'Davalı') {
      setClientPosition(current.side);
    }
    if (current.subject) {
      setCaseSubject(current.subject);
    }
    if (current.facts && !caseDetails) {
      setCaseDetails(current.facts);
    }
    if (current.evidence && !evidenceSummary) {
      setEvidenceSummary(current.evidence);
    }

    return unsub;
  }, []);

  // Simulation execution state
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<MultiAgentSimulationResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRunSimulation = async () => {
    if (!caseSubject.trim() || !caseDetails.trim()) return;

    setLoading(true);
    setSimulationResult(null);

    const currentParty = PartyContextService.get();
    const finalDetails = currentParty.side !== 'none'
      ? `${caseDetails}\n\n${currentParty.biasPromptDirective}`
      : caseDetails;

    const request: MultiAgentSimulationRequest = {
      caseSubject,
      caseDetails: finalDetails,
      evidenceSummary,
      clientPosition,
      preferredModel
    };

    const res = await runMultiAgentSimulation(request);
    setSimulationResult(res);
    setLoading(false);
  };

  const handleSelectTemplate = (template: typeof ORNEK_DAVALAR[0]) => {
    setCaseSubject(template.konu);
    setCaseDetails(template.detay);
    setEvidenceSummary(template.deliller);
    setClientPosition(template.taraf);
  };

  const handleCopyReport = () => {
    if (!simulationResult) return;
    const textToCopy = `=== ULTRA HUKUK AI: ÇOKLU AJAN DAVA SİMÜLASYONU RAPORU ===
Model: ${simulationResult.model} (${simulationResult.engineUsed})
Kazanma İhtimali: %${simulationResult.davaKazanmaOrani}

[HÂKİM GÖZÜYLE ZAYIF NOKTALAR]:
${simulationResult.hakimGozuyleZayifNoktalar.map((n, i) => `${i + 1}. ${n}`).join('\n')}

[KARŞI TARAFIN MUHTEMEL HAMLELERİ]:
${simulationResult.karsiTarafMuhtemelHamleleri.map((h, i) => `${i + 1}. ${h}`).join('\n')}

[BİLİRKİŞİ TEKNİK DENETİMİ]:
Metraj ve Kusur: ${simulationResult.bilirkisiTeknikDenetimi.kusurVeMetrajUygunlugu}
Eksik Hesaplamalar: ${simulationResult.bilirkisiTeknikDenetimi.eksikHesaplamalar.join(', ')}

[STRATEJİK TAVSİYE & KAZANMA AKSİYONLARI]:
${simulationResult.stratejikTavsiye}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 border border-purple-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Stratejik Analiz & Yüksek Hakem Hibrit
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                3 Rol Simülasyonu
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <Swords className="w-7 h-7 text-amber-400" />
              Multi-Agent Dava Risk Analiz & Simülasyon Grubu
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Dava dosyanızı duruşmaya girmeden önce sırasıyla <strong>Hâkim</strong>,{' '}
              <strong>Karşı Taraf Avukatı</strong> ve <strong>Bilirkişi</strong> perspektifinden
              test edin. Zayıf noktaları, zamanaşımı risklerini ve karşı itirazları önceden tespit edin.
            </p>
          </div>

          {/* Model Selector Pill */}
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10 flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
              Yapay Zeka Muhakeme Motoru
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreferredModel('claude-3-5-sonnet')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  preferredModel === 'claude-3-5-sonnet'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                Stratejik Analiz ve Simülasyon Motoru
              </button>
              <button
                type="button"
                onClick={() => setPreferredModel('claude-3-opus')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  preferredModel === 'claude-3-opus'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                Yüksek Hakem ve Nihai Karar Motoru
              </button>
              <button
                type="button"
                onClick={() => setPreferredModel('gemini-3.1-pro')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  preferredModel === 'gemini-3.1-pro'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                Derin Bağlam ve Külliyat Muhakeme Motoru
              </button>
            </div>
          </div>
        </div>

        {/* DİNAMİK VE HAZIR ŞABLON YÖNETİMİ (EXCLUSIVE RADIO SEÇİMİ) */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hızlı Şablon Yükle (Dinamik & AI Hazır Şablonlar):</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Seçilen şablona göre aşağıdaki dava alanları otomatik doldurulur ve serbestçe düzenlenebilir.
            </span>
          </div>

          {/* Hazır Şablonlar Radio Listesi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {ORNEK_DAVALAR.map((orn, i) => {
              const isSelected = templateMode === 'hazir' && selectedPresetIndex === i;
              return (
                <div
                  key={orn.id}
                  onClick={() => handleSelectPreset(i)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/40 text-white shadow-sm'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="davaSablonSecimi"
                    checked={isSelected}
                    onChange={() => handleSelectPreset(i)}
                    className="mt-0.5 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-xs block leading-snug truncate">{orn.baslik}</span>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">{orn.konu}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Özel Şablon Alanı (Boş Metin Girilebilir & Radio Seçimli) */}
          <div className={`p-3 rounded-xl border transition space-y-2 ${
            templateMode === 'ozel'
              ? 'bg-purple-950/40 border-purple-400 ring-1 ring-purple-400/40 text-white'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}>
            <div
              onClick={handleSelectCustom}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="davaSablonSecimi"
                checked={templateMode === 'ozel'}
                onChange={handleSelectCustom}
                className="text-purple-500 focus:ring-purple-400 w-3.5 h-3.5 shrink-0"
              />
              <span className="font-bold text-xs text-purple-300">
                Özel Şablon (Avukat Tanımlı Serbest Şablon)
              </span>
              <span className="text-[10px] text-slate-400">
                — Kendi özel vaka şablonunuzu girin, radio seçildiğinde otomatik uygulanır.
              </span>
            </div>

            <textarea
              rows={2}
              value={customTemplateText}
              onFocus={() => setTemplateMode('ozel')}
              onChange={(e) => handleCustomTextChange(e.target.value)}
              placeholder="Kendi özel dava kurgunuzu veya şablon metninizi buraya yazabilirsiniz..."
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 leading-relaxed font-sans"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) vs Output Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              <span>Dava Dosyası & Vakıa Girdisi</span>
            </h3>

            {/* Client Position */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Temsil Ettiğimiz Taraf:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Davacı', 'Davalı', 'Müşteki', 'Sanık'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setClientPosition(pos)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                      clientPosition === pos
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Case Subject */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>Dava Konusu ve Talep:</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                  Otomatik Dolduruldu (Düzenlenebilir)
                </span>
              </label>
              <input
                type="text"
                value={caseSubject}
                onChange={(e) => setCaseSubject(e.target.value)}
                placeholder="Örn: Haksız İtirazın İptali ve İcra İnkar Tazminatı..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Facts / Details */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>Maddi Olaylar ve Vakıalar:</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                  Otomatik Dolduruldu (Düzenlenebilir)
                </span>
              </label>
              <textarea
                rows={5}
                value={caseDetails}
                onChange={(e) => setCaseDetails(e.target.value)}
                placeholder="Davanın tarafları, sözleşme ilişkisi, fesih veya temerrüt tarihi..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
              />
            </div>

            {/* Evidence Summary */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>Dayanılan Deliller & Raporlar:</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                  Otomatik Dolduruldu (Düzenlenebilir)
                </span>
              </label>
              <textarea
                rows={3}
                value={evidenceSummary}
                onChange={(e) => setEvidenceSummary(e.target.value)}
                placeholder="İrsaliye, fatura, tanık anlatımları, bilirkişi raporu..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* Run Button */}
            <button
              type="button"
              disabled={loading || !caseSubject.trim()}
              onClick={handleRunSimulation}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Stratejik Analiz & Çoklu Ajanlar Dosyayı İnceliyor...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>3 Rol Dava Simülasyonunu Başlat</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          {!simulationResult && !loading && (
            <div className="bg-white dark:bg-[#131d31] p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Simülasyon Henüz Çalıştırılmadı
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Sol taraftaki dava vakıalarını doldurarak veya örnek şablonlardan birini seçerek{' '}
                <strong>'3 Rol Dava Simülasyonunu Başlat'</strong> butonuna basınız. Hâkim, Karşı Taraf
                ve Bilirkişi analizleri anında oluşturulacaktır.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white dark:bg-[#131d31] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                <Swords className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Dava Simülasyon Grubu Aktif
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Stratejik Analiz ve Simülasyon Motoru, dosyadaki zamanaşımı, usul eksiklikleri ve
                  bilirkişi risklerini denetliyor...
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-amber-500 animate-[pulse_1s_infinite]"></div>
              </div>
            </div>
          )}

          {simulationResult && !loading && (
            <div className="space-y-4">
              {/* Score & Engine Bar */}
              <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center font-bold">
                    <span className="text-base font-black">%{simulationResult.davaKazanmaOrani}</span>
                    <span className="text-[9px] uppercase">Kazanma</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Öngörülen Dava Başarı İhtimali
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Motor: <strong>{simulationResult.engineUsed}</strong> ({simulationResult.model})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1"
                    title="Raporu Kopyala"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>

                  {onApplyToPetition && (
                    <button
                      type="button"
                      onClick={() => onApplyToPetition(simulationResult.rawReport)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Dilekçeye Aktar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Role 1: HÂKİM GÖZÜYLE ZAYIF NOKTALAR */}
              <div className="bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Gavel className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      1. Hâkim Gözüyle Zayıf Noktalar & Usul Engelleri
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Hak düşürücü süre, tensip eksikliği ve ispat yükü zaafları
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 text-xs">
                  {simulationResult.hakimGozuyleZayifNoktalar.map((nokta, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-slate-800 dark:text-slate-200 bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-200/50 dark:border-purple-900/30"
                    >
                      <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{nokta}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Role 2: KARŞI TARAFIN MUHTEMEL HAMLELERİ */}
              <div className="bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Swords className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      2. Karşı Tarafın Muhtemel Hamleleri & İtirazları
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Savunma avukatının yapacağı ilk itirazlar ve çürütme manevraları
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 text-xs">
                  {simulationResult.karsiTarafMuhtemelHamleleri.map((hamle, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-slate-800 dark:text-slate-200 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{hamle}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Role 3: BİLİRKİŞİ TEKNİK & FİNANSAL DENETİMİ */}
              <div className="bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Calculator className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      3. Bilirkişi Teknik, Metraj & Finansal Denetimi
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Hesaplama doğruluğu, kusur oranları ve metraj tutarlılığı
                    </p>
                  </div>
                </div>

                <div className="bg-teal-50/50 dark:bg-teal-950/20 p-3 rounded-xl border border-teal-200/50 dark:border-teal-900/30 text-xs space-y-2">
                  <div className="font-semibold text-teal-900 dark:text-teal-300">
                    Kusur ve Metraj Değerlendirmesi:
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {simulationResult.bilirkisiTeknikDenetimi.kusurVeMetrajUygunlugu}
                  </p>

                  {simulationResult.bilirkisiTeknikDenetimi.eksikHesaplamalar.length > 0 && (
                    <div className="pt-2 border-t border-teal-200/40 dark:border-teal-900/40">
                      <div className="font-semibold text-teal-900 dark:text-teal-300 mb-1">
                        Eksik veya Riskli Hesaplamalar:
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                        {simulationResult.bilirkisiTeknikDenetimi.eksikHesaplamalar.map((eh, i) => (
                          <li key={i}>{eh}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* STRATEJİK TAVSİYE & KAZANMA EYLEM PLANI */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-amber-500/40 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-amber-500/20">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      4. Avukata Stratejik Eylem Planı (Kazanma Aksiyonları)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Kazanma oranını artıracak somut usul ve esasa dair öneriler
                    </p>
                  </div>
                </div>

                <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-xl border border-amber-500/20">
                  {simulationResult.stratejikTavsiye}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
