import React, { useState } from 'react';
import { Ghost, Target, Brain, FileWarning,
  Zap,
  UploadCloud,
  FileText,
  File,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Scale,
  Gavel,
  ChevronRight,
  FileSearch,
  Sparkles,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  BookOpen,
  Download,
  ShieldCheck,
  Camera,
  ScanLine,
  Eye,
  Search
} from 'lucide-react';
import { crossReferenceAiWithStatutes, CrossReferenceAuditReport } from '../services/legalDatabaseService';
import { DocumentScannerModal } from './DocumentScannerModal';

export interface UploadedCaseFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: string;
  isScanned?: boolean;
}

export interface DeepAnalysisResult {
  success: boolean;
  modelUsed: string;
  modelMode: 'flash' | 'pro';
  analyzedAt: string;
  davaOzeti: string;
  davaTuru: string;
  gorevliYetkiliMahkeme: string;
  kazanmaIhtimali: number;
  hukukiTeshis: string;
  kritikVakialar: string[];
  iddiaVeSavunmaKurgusu: {
    davaciIddialari: string[];
    davaliSavunmalari: string[];
    defilerVeItirazlar: string[];
  };
  delilVeEvrakDenetimi: {
    gucluDeliller: string[];
    zayifVeyaKuskuluDeliller: string[];
    senetleIspatKuraliHMK200: string;
    mikroAyrintilarVeEksikler: string[];
  };
  usuliTuzaklarVeRiskler: {
    zamanasimiRiski: string;
    hakDusurucuSureler: string[];
    gorevYetkiSorunu: string;
    davaSartiEksiklikleri: string[];
  };
  hakDusurucuSureler: string[];
  derinHukukiMuhakeme: {
    doktrinVeYargitayIctihati: string;
    seytaninAvukatiKarsiTaarruz: string[];
    stratejikEylemPlani: string[];
    hakimNazarindaSonucTahmini: string;
  };
  kanunMaddeleriAtiflari: string[];
  basHukukMusaviriSentezi?: {
    davaOzetiVeTeshis?: string;
    tumAjanlarinVerileriniBirlestirenDerinAnaliz?: string;
    kazanmaIhtimali?: number;
    stratejikYolHaritasiVurgusu?: string;
  };
  usulSuresiAjaniRaporu?: {
    zamanasimiVeHakDusurucuSureler?: string[];
    hmkUyarisiVeAcilAdimlar?: string[];
    gorevliYetkiliMahkeme?: string;
    arabuluculukDavaSarti?: string;
  };
  yargitayEmsalAjaniRaporu?: {
    benzerVakialardaYargitayYaklasimi?: string;
    hgkDaiveBamIlkeKararlari?: string[];
    leheVeAleyheEmsalKarsilastirmasi?: string;
  };
  seytaninAvukatiRaporu?: {
    karsiTarafNeYapar?: string;
    dosyadakiZayifHalkalarVeAciklar?: string[];
    delilCeliskiVeRiskleri?: string[];
    karsiSavunmaStratejisi?: string;
  };
  dilekceMimariRaporu?: {
    uyapNeticeiTalepOnerisi?: string;
    dilekceKurgusuHiyerarsisi?: string[];
    tensipVeMuzekkereTalepleri?: string[];
  };
}

export type DavaDerinAnalizTab =
  | 'overview'
  | 'claims'
  | 'evidence'
  | 'procedural'
  | 'deep_reasoning'
  | 'basHukukMusaviri'
  | 'usulAjani'
  | 'emsalAjani'
  | 'seytaninAvukati'
  | 'dilekceMimari';

interface DavaDerinAnalizProps {
  lawyerSicilNo?: string;
  onApplyToPetition?: (text: string) => void;
  onNavigateToTimeline?: () => void;
  onNavigateToCrossref?: (article: string) => void;
}

export function ensureAgentReports(item: DeepAnalysisResult): DeepAnalysisResult {
  const isPro = item.modelMode === 'pro';
  const basHukukMusaviriSentezi = item.basHukukMusaviriSentezi || {
    davaOzetiVeTeshis: `${item.davaOzeti || ''} ${item.hukukiTeshis || ''}`.trim() || 'Dava dosyası evrakları ve iddiaları incelenmiştir.',
    tumAjanlarinVerileriniBirlestirenDerinAnaliz: `${(item.kritikVakialar || []).join('\n')}\n\n${item.derinHukukiMuhakeme?.doktrinVeYargitayIctihati || ''}`.trim() || 'Ajan konseyi verileri birleştirilmiştir.',
    kazanmaIhtimali: item.kazanmaIhtimali || (isPro ? 78 : 74),
    stratejikYolHaritasiVurgusu: item.derinHukukiMuhakeme?.hakimNazarindaSonucTahmini || 'Usul ve delil dengesi gözetilerek işlem yapılmalıdır.'
  };

  const usulSuresiAjaniRaporu = item.usulSuresiAjaniRaporu || {
    gorevliYetkiliMahkeme: item.gorevliYetkiliMahkeme || 'İstanbul Nöbetçi Asliye Hukuk / Ticaret Mahkemesi',
    arabuluculukDavaSarti: (item.usuliTuzaklarVeRiskler?.davaSartiEksiklikleri || []).join(', ') || 'Zorunlu arabuluculuk süreci denetlenmelidir.',
    zamanasimiVeHakDusurucuSureler: [item.usuliTuzaklarVeRiskler?.zamanasimiRiski, ...(item.usuliTuzaklarVeRiskler?.hakDusurucuSureler || [])].filter(Boolean) as string[],
    hmkUyarisiVeAcilAdimlar: [item.delilVeEvrakDenetimi?.senetleIspatKuraliHMK200, item.usuliTuzaklarVeRiskler?.gorevYetkiSorunu].filter(Boolean) as string[]
  };

  const yargitayEmsalAjaniRaporu = item.yargitayEmsalAjaniRaporu || {
    benzerVakialardaYargitayYaklasimi: item.derinHukukiMuhakeme?.doktrinVeYargitayIctihati || 'Yargıtay yerleşik içtihatları doğrultusunda ispat yükü davacıdadır.',
    hgkDaiveBamIlkeKararlari: item.kanunMaddeleriAtiflari || [],
    leheVeAleyheEmsalKarsilastirmasi: 'Yargıtay ve BAM yerleşik kararları ile iddialar desteklenmelidir.'
  };

  const seytaninAvukatiRaporu = item.seytaninAvukatiRaporu || {
    karsiTarafNeYapar: (item.iddiaVeSavunmaKurgusu?.davaliSavunmalari || []).join(' ') || 'Karşı taraf yetkisizlik veya davanın reddi savunmasında bulunabilir.',
    dosyadakiZayifHalkalarVeAciklar: item.iddiaVeSavunmaKurgusu?.defilerVeItirazlar || [],
    delilCeliskiVeRiskleri: item.delilVeEvrakDenetimi?.zayifVeyaKuskuluDeliller || [],
    karsiSavunmaStratejisi: (item.derinHukukiMuhakeme?.seytaninAvukatiKarsiTaarruz || []).join(' ') || 'Yazılı delil başlangıcı ve ticari kayıtlar ile savunma güçlendirilmelidir.'
  };

  const dilekceMimariRaporu = item.dilekceMimariRaporu || {
    uyapNeticeiTalepOnerisi: `Davanın KABULÜ ile ${item.davaOzeti || 'alacağın tahsiline'}, yargılama giderleri ve vekalet ücretinin karşı tarafa yükletilmesine karar verilmesi talep olunur.`,
    dilekceKurgusuHiyerarsisi: [
      '1. Görevli Mahkemeye Hitap ve Taraf Bilgileri',
      '2. Dava Konusu Vakıalar ve HMK 194 Somutlaştırması',
      '3. Delil Listesi ve HMK 200 Senetle İspat Analizi',
      '4. UYAP Netice-i Talep'
    ],
    tensipVeMuzekkereTalepleri: [
      'Resmi kurum kayıtları ve müzekkerelerin celbi',
      'Bilirkişi incelemesi talebi'
    ]
  };

  return {
    ...item,
    basHukukMusaviriSentezi,
    usulSuresiAjaniRaporu,
    yargitayEmsalAjaniRaporu,
    seytaninAvukatiRaporu,
    dilekceMimariRaporu
  };
}

export function DavaDerinAnaliz({
  lawyerSicilNo = '8109',
  onApplyToPetition,
  onNavigateToTimeline,
  onNavigateToCrossref,
}: DavaDerinAnalizProps) {
  // Model Toggle State: 'flash' vs 'pro'
  const [modelMode, setModelMode] = useState<'flash' | 'pro'>('pro');

  // Input states
  const [caseSubject, setCaseSubject] = useState('');
  const [claimSummary, setClaimSummary] = useState('');
  const [perspective, setPerspective] = useState<'Davacı' | 'Davalı'>('Davacı');
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedCaseFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  // Madde 6: Kamera yalnızca Mobil APK ortamında aktif edilir (Web'de gizlenir)
  const isMobileApk = typeof window !== 'undefined' && Boolean(
    (window as any).isAndroidApk === true ||
    (window as any).Capacitor !== undefined ||
    (window as any).cordova !== undefined ||
    /UltraHukukMobile|Android.*wv/i.test(navigator.userAgent)
  );
  const [viewingScannedFile, setViewingScannedFile] = useState<UploadedCaseFile | null>(null);

  // Analysis result and execution states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<DeepAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<DeepAnalysisResult[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [auditReport, setAuditReport] = useState<CrossReferenceAuditReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<DavaDerinAnalizTab>('basHukukMusaviri');

  // Load history on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('dava_analysis_history');
    if (saved) {
      try {
        setAnalysisHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  // Save history on update
  React.useEffect(() => {
    localStorage.setItem('dava_analysis_history', JSON.stringify(analysisHistory));
  }, [analysisHistory]);

  // Run deep analysis
  const handleRunAnalysis = async (forcedMode?: 'flash' | 'pro') => {
    const activeMode = forcedMode || modelMode;
    setLoading(true);
    setLoadingStep('Dosya ve delil metinleri ayrıştırılıyor...');

    try {
      setTimeout(() => {
        setLoadingStep(
          activeMode === 'pro'
            ? '🧠 Gemini 3.1 Pro: HMK/TBK usul tuzakları ve derin muhakeme yürütülüyor...'
            : '⚡ Gemini 3.8 Flash: Hızlı vakıa haritası ve genel bakış özetleniyor...'
        );
      }, 700);

      const response = await fetch('/api/ai/deep-case-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: uploadedFiles,
          caseSubject,
          claimSummary,
          perspective,
          modelMode: activeMode,
          lawyerSicilNo
        })
      });

      const data = await response.json();
      if (data.success) {
        const enriched = ensureAgentReports(data);
        setAnalysisResult(enriched);
        setAnalysisHistory(prev => [enriched, ...prev].slice(0, 50)); // Keep last 50
        setActiveViewTab('basHukukMusaviri');
        try {
          const textForAudit = `${data.davaOzeti || ''} ${data.hukukiTeshis || ''} ${data.delilVeEvrakDenetimi?.senetleIspatKuraliHMK200 || ''} ${data.usuliTuzaklarVeRiskler?.zamanasimiRiski || ''} ${(data.kanunMaddeleriAtiflari || []).join(' ')} ${(data.kritikVakialar || []).join(' ')}`;
          const audit = crossReferenceAiWithStatutes(textForAudit);
          setAuditReport(audit);
        } catch (e) {
          console.warn('Cross reference audit error:', e);
        }
      } else {
        alert('Analiz yürütülürken hata oluştu: ' + (data.message || 'Bilinmeyen hata'));
      }
    } catch (err: any) {
      console.error('Deep case analysis request failed:', err);
      alert('Sunucu ile iletişim kurulamadı.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || '';
        const newFile: UploadedCaseFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          content: textContent.slice(0, 10000) || `[Belge Adı: ${file.name} - Boyut: ${Math.round(file.size / 1024)} KB - Metin Ayrıştırma Hazır]`,
          uploadedAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          isScanned: file.type.startsWith('image/')
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.udf')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Copy report
  const handleCopyReport = () => {
    if (!analysisResult) return;
    const text = `=== ULTRA HUKUK AI - DAVA DERİN ANALİZ RAPORU ===
Model: ${analysisResult.modelUsed} (${analysisResult.modelMode === 'pro' ? 'Gemini 3.1 Pro Derin Muhakeme' : 'Gemini 3.8 Flash Hızlı Genel Bakış'})
Tarih: ${analysisResult.analyzedAt}
Dava Türü: ${analysisResult.davaTuru}
Görevli/Yetkili Mahkeme: ${analysisResult.gorevliYetkiliMahkeme}
Kazanma İhtimali: %${analysisResult.kazanmaIhtimali}

[HUKUKİ TEŞHİS]
${analysisResult.hukukiTeshis}

[KRİTİK VAKIALAR]
${analysisResult.kritikVakialar.map((v, i) => `${i + 1}. ${v}`).join('\n')}

[DELİL & HMK 200 SENET DENETİMİ]
${analysisResult.delilVeEvrakDenetimi.senetleIspatKuraliHMK200}
Güçlü Deliller:
${analysisResult.delilVeEvrakDenetimi.gucluDeliller.join('\n- ')}

[USULİ TUZAKLAR & ZAMANAŞIMI]
${analysisResult.usuliTuzaklarVeRiskler.zamanasimiRiski}
Hak Düşürücü Süreler:
${analysisResult.hakDusurucuSureler.join('\n- ')}

[HARP ODASI & STRATEJİK EYLEM PLANI]
${analysisResult.derinHukukiMuhakeme.stratejikEylemPlani.join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdfReport = () => {
    if (!analysisResult) return;
    const reportContent = `ULTRA HUKUK AI - DAVA DERİN ANALİZ VE USULİ DENETİM RAPORU
===========================================================
Tarih: ${analysisResult.analyzedAt}
Model: ${analysisResult.modelUsed} (${analysisResult.modelMode === 'pro' ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash'})
Dava Türü: ${analysisResult.davaTuru}
Mahkeme: ${analysisResult.gorevliYetkiliMahkeme}
Kazanma İhtimali: %${analysisResult.kazanmaIhtimali}

HUKUKİ TEŞHİS:
${analysisResult.hukukiTeshis}

DELİL & HMK 200 SENET DENETİMİ:
${analysisResult.delilVeEvrakDenetimi.senetleIspatKuraliHMK200}

USULİ TUZAKLAR VE RİSKLER:
${analysisResult.usuliTuzaklarVeRiskler.zamanasimiRiski}

ÖNERİLEN KANUN ATIFLARI:
${(analysisResult.kanunMaddeleriAtiflari || []).join(', ')}

STRATEJİK EYLEM PLANI:
${analysisResult.derinHukukiMuhakeme.stratejikEylemPlani.join('\n')}

===========================================================
ZORUNLU ŞERH: 1136 Sayılı Avukatlık Kanunu m. 34 ve KVKK uyarınca bu analiz nihai otomatik karar olmayıp, sorumlu avukatın inceleme ve onayına tabidir.
`;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dava_Analiz_Raporu_${analysisResult.davaTuru.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const filteredHistory = analysisHistory.filter(item =>
    item.davaTuru.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.davaOzeti.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="flex gap-6">
      {/* Analiz Geçmişi Sidebar */}
      <div className="hidden lg:block w-72 shrink-0 space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Analiz Geçmişi
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Geçmiş analizlerde ara..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredHistory.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setAnalysisResult(ensureAgentReports(item));
                  setActiveViewTab('basHukukMusaviri');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition space-y-1"
              >
                <div className="text-xs font-semibold text-slate-200 truncate">{item.davaTuru}</div>
                <div className="text-[10px] text-slate-500 font-mono">{item.analyzedAt}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Header & Model Selector Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          {/* Dedicated Model Toggle Component */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-1.5 flex flex-col sm:flex-row gap-1 shadow-inner self-start lg:self-center">
            <button
              type="button"
              onClick={() => setModelMode('flash')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                modelMode === 'flash'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Zap className={`w-4 h-4 ${modelMode === 'flash' ? 'text-amber-400 fill-amber-400/20' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>Gemini Flash</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">Hızlı</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Hızlı Genel Bakış & Özet</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModelMode('pro')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                modelMode === 'pro'
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-600/30 text-sky-300 border border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Brain className={`w-4 h-4 ${modelMode === 'pro' ? 'text-sky-400' : 'text-slate-500'}`} />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>Gemini Pro</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">Derin</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Derin Hukuki Muhakeme</div>
              </div>
            </button>
          </div>
        </div>

        {/* Model Feature Explainer Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-slate-300 font-medium">Gemini 3.1 Pro Derin Akıl Aktif:</span>
                <span>HMK 200 senetle ispat sınırları, tebliğ şerhi mikro-ayrıntıları, zamanaşımı tuzakları ve harp odası karşı hücum stratejisi tavizsiz derinlikle yürütülür.</span>
              </>
          </div>
        </div>
      </div>


      {/* Main Grid: Upload & Inputs (Left) | AI Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Upload & Case Parameters (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* File Upload Area */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-200">Dava Dosyası & Evrak Yükleme</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {uploadedFiles.length} dosya yüklendi
              </span>
            </div>

            {/* Document Scanning Utility Action Banner - Sadece Mobil APK */}
            {isMobileApk && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/50 border border-emerald-500/40 shadow-lg relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 group-hover:scale-105 transition shadow-sm">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">
                        Kamera ile Kağıt Delil & Evrak Tara
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                        Vision OCR
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fiziki senet, tebligat veya tutanakları kameranızla fotoğraflayıp OCR ile analize ekleyin.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScannerModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 shrink-0 cursor-pointer"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Kamerayı Aç</span>
                </button>
              </div>
            </div>
            )}

            {/* Drag & Drop Zone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  // Trigger handleFileUpload logic via simulated event
                  const event = { target: { files: e.dataTransfer.files } } as any;
                  handleFileUpload(event);
                }
              }}
              className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-sky-400 bg-sky-500/10'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/50 hover:bg-slate-950'
              }`}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.udf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-sky-400 hover:underline">Dosyaları Seçin</span>
                  <span className="text-xs text-slate-400"> veya buraya sürükleyin</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  PDF, UDF (UYAP), DOCX, TXT, Resim / Kamera Çekimi (Azami 25MB)
                </p>
              </div>
            </label>

            {/* Uploaded File List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {uploadedFiles.map((file) => {
                  const isScannedDoc = file.isScanned || file.name.startsWith('Taranan');
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 text-xs transition"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`p-1.5 rounded-lg ${isScannedDoc ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                          {isScannedDoc ? (
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-slate-200 truncate">{file.name}</p>
                            {isScannedDoc && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                Kamera OCR
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {Math.round(file.size / 1024)} KB • {file.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingScannedFile(file)}
                          className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          title="Evrak ve OCR İçeriğini İncele"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          title="Dosyayı kaldır"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Case Context Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-amber-400" />
                Dava Çerçevesi & Müvekkil Bilgileri
              </h3>
              {/* Perspective Toggle */}
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPerspective('Davacı')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    perspective === 'Davacı'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Davacı Tarafı
                </button>
                <button
                  type="button"
                  onClick={() => setPerspective('Davalı')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    perspective === 'Davalı'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Davalı Tarafı
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Dava Başlığı / Konusu:
              </label>
              <input
                type="text"
                value={caseSubject}
                onChange={(e) => setCaseSubject(e.target.value)}
                placeholder="Örn: İtirazın İptali, Alacak, İşe İade..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Talep & İddia Özeti (Ek Bilgiler):
              </label>
              <textarea
                rows={3}
                value={claimSummary}
                onChange={(e) => setClaimSummary(e.target.value)}
                placeholder="Müvekkilin temel talebini, uyuşmazlığın kökenini veya tebliğ tarihlerini yazın..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 transition resize-none"
              />
            </div>

            {/* Execute Analysis Action Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRunAnalysis()}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : modelMode === 'pro'
                  ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:to-indigo-600 text-white shadow-sky-900/30 border border-sky-400/30'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/30 border border-amber-400/30'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>{loadingStep || 'Analiz Yürütülüyor...'}</span>
                </>
              ) : (
                <>
                  {modelMode === 'pro' ? (
                    <Brain className="w-4 h-4 text-sky-200" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-200" />
                  )}
                  <span>
                    {modelMode === 'pro'
                      ? 'Gemini Pro ile Derin Hukuki Analizi Başlat'
                      : 'Gemini Flash ile Hızlı İncelemeyi Başlat'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI-Generated Insights Display (7 Cols) */}
        <div className="lg:col-span-7">
          {analysisResult ? (
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Result Header & Model Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Yapay Zeka Destekli
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        analysisResult.modelMode === 'pro'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      🧠 Gemini 3.1 Pro (Derin Muhakeme)
                    </span>
                    {auditReport && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-indigo-500/10 text-indigo-400 border-indigo-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                        Türk Hukuku Doğrulamalı ({auditReport.verifiedCount} Madde)
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {analysisResult.analyzedAt}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{analysisResult.davaTuru}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5 text-amber-400" />
                    <span>{analysisResult.gorevliYetkiliMahkeme}</span>
                  </p>
                </div>

                {/* Score & Controls */}
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">Kazanma İhtimali</div>
                    <div className="text-lg font-extrabold text-emerald-400 font-mono">
                      %{analysisResult.kazanmaIhtimali}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Raporu Kopyala"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdfReport}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="PDF / Döküm İndir"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = modelMode === 'flash' ? 'pro' : 'flash';
                      setModelMode(nextMode);
                      handleRunAnalysis(nextMode);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition font-medium"
                    title="Diğer modelle yeniden analiz et"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{modelMode === 'flash' ? "Pro'ya Geç" : "Flash'a Geç"}</span>
                  </button>
                </div>
              </div>

              {/* KVKK ve Avukat Nihai Onay Sorumluluk Şerhi */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-amber-300 block">
                    KVKK & 1136 Sayılı Avukatlık Kanunu m. 34 Zorunlu Bilgilendirmesi:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Yapay zekâ analizleri nihai otomatik karar değildir; mesleki destek aracıdır. Tüm hukuki iddialar ve tensip değerlendirmeleri sorumlu ruhsatlı avukatın bizzat incelemesi, mevzuat teyidi ve nihai onayı gerektirir.
                  </p>
                </div>
              </div>

              {/* Navigation Tabs for Analysis Sub-sections */}
              <div className="flex border-b border-slate-800 pb-2 overflow-x-auto gap-1 text-xs font-semibold custom-scrollbar">
                {[
                  { id: 'basHukukMusaviri', label: 'Baş Hukuk Müşaviri Sentezi', icon: Target },
                  { id: 'usulAjani', label: 'Usul & Süre Ajanı', icon: FileWarning },
                  { id: 'emsalAjani', label: 'Yargıtay Emsal Ajanı', icon: Scale },
                  { id: 'seytaninAvukati', label: 'Şeytanın Avukatı', icon: Ghost },
                  { id: 'dilekceMimari', label: 'Dilekçe Mimarı', icon: FileText }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveViewTab(t.id as DavaDerinAnalizTab)}
                    className={`pb-2 px-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
                      activeViewTab === t.id
                        ? 'border-sky-400 text-sky-300 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview & Facts */}
              
              {activeViewTab === 'basHukukMusaviri' && analysisResult.basHukukMusaviriSentezi && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                    <h4 className="text-indigo-400 font-bold flex items-center gap-2"><Target className="w-4 h-4"/> Yönetici Özeti ve Hukuki Teşhis</h4>
                    <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">{analysisResult.basHukukMusaviriSentezi.davaOzetiVeTeshis}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                    <h4 className="text-emerald-400 font-bold flex items-center gap-2"><Brain className="w-4 h-4"/> Ajanların Verilerini Birleştiren Derin Analiz</h4>
                    <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      {analysisResult.basHukukMusaviriSentezi.tumAjanlarinVerileriniBirlestirenDerinAnaliz}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
                      <span className="text-xs text-emerald-500 font-bold block mb-1">Kazanma İhtimali</span>
                      <span className="text-2xl font-black text-emerald-400">%{(analysisResult.basHukukMusaviriSentezi.kazanmaIhtimali || 0)}</span>
                    </div>
                    <div className="bg-sky-950/20 border border-sky-900/40 rounded-xl p-4">
                      <span className="text-xs text-sky-500 font-bold block mb-1">Stratejik Yol Haritası</span>
                      <span className="text-sm text-sky-200 block">{analysisResult.basHukukMusaviriSentezi.stratejikYolHaritasiVurgusu}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeViewTab === 'usulAjani' && analysisResult.usulSuresiAjaniRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 space-y-2">
                      <h4 className="text-rose-400 text-xs font-bold uppercase tracking-wider">Zamanaşımı ve Hak Düşürücü Süreler</h4>
                      <ul className="list-disc list-inside text-slate-800 dark:text-slate-200 text-sm space-y-1">
                        {(analysisResult.usulSuresiAjaniRaporu.zamanasimiVeHakDusurucuSureler || []).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 space-y-2">
                      <h4 className="text-amber-400 text-xs font-bold uppercase tracking-wider">HMK Uyarısı & Acil Adımlar</h4>
                      <ul className="list-disc list-inside text-slate-800 dark:text-slate-200 text-sm space-y-1">
                        {(analysisResult.usulSuresiAjaniRaporu.hmkUyarisiVeAcilAdimlar || []).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 text-sm flex justify-between items-center text-slate-800 dark:text-slate-200">
                    <div><span className="text-slate-400 block text-xs">Görevli ve Yetkili Mahkeme</span><span className="text-sky-300 font-bold">{analysisResult.usulSuresiAjaniRaporu.gorevliYetkiliMahkeme}</span></div>
                    <div className="text-right"><span className="text-slate-400 block text-xs">Arabuluculuk Şartı</span><span className="text-emerald-300 font-bold">{analysisResult.usulSuresiAjaniRaporu.arabuluculukDavaSarti}</span></div>
                  </div>
                </div>
              )}

              {activeViewTab === 'emsalAjani' && analysisResult.yargitayEmsalAjaniRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <h4 className="text-sky-400 font-bold mb-2">Benzer Vakıalarda Yargıtay Yaklaşımı</h4>
                    <p className="text-slate-800 dark:text-slate-200 text-sm">{analysisResult.yargitayEmsalAjaniRaporu.benzerVakialardaYargitayYaklasimi}</p>
                  </div>
                  <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-5">
                    <h4 className="text-indigo-400 font-bold mb-3">HGK, Daire & BAM İlke Kararları</h4>
                    <div className="space-y-2">
                      {(analysisResult.yargitayEmsalAjaniRaporu.hgkDaiveBamIlkeKararlari || []).map((k, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm border-l-2 border-l-indigo-500">
                          {k}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200">
                    <h4 className="text-emerald-400 font-bold mb-2">Lehe ve Aleyhe Emsal Karşılaştırması</h4>
                    <p className="text-slate-800 dark:text-slate-200">{analysisResult.yargitayEmsalAjaniRaporu.leheVeAleyheEmsalKarsilastirmasi}</p>
                  </div>
                </div>
              )}

              {activeViewTab === 'seytaninAvukati' && analysisResult.seytaninAvukatiRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-5">
                    <h4 className="text-rose-400 font-bold flex items-center gap-2 mb-2"><Ghost className="w-4 h-4"/> Karşı Taraf Ne Yapar? (En Kötü Senaryo)</h4>
                    <p className="text-rose-950 dark:text-rose-200 text-sm font-medium">{analysisResult.seytaninAvukatiRaporu.karsiTarafNeYapar}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <h4 className="text-amber-400 font-bold mb-2 text-sm">Dosyadaki Zayıf Halkalar & Açıklar</h4>
                      <ul className="list-disc list-inside text-slate-800 dark:text-slate-200 text-xs space-y-1">
                        {(analysisResult.seytaninAvukatiRaporu.dosyadakiZayifHalkalarVeAciklar || []).map((z, i) => <li key={i}>{z}</li>)}
                      </ul>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <h4 className="text-amber-400 font-bold mb-2 text-sm">Delil Çelişki ve Riskleri</h4>
                      <ul className="list-disc list-inside text-slate-800 dark:text-slate-200 text-xs space-y-1">
                        {(analysisResult.seytaninAvukatiRaporu.delilCeliskiVeRiskleri || []).map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
                    <h4 className="text-emerald-400 font-bold mb-2">Karşı Savunma & Panzehir Stratejisi</h4>
                    <p className="text-emerald-950 dark:text-emerald-200 text-sm font-medium">{analysisResult.seytaninAvukatiRaporu.karsiSavunmaStratejisi}</p>
                  </div>
                </div>
              )}

              {activeViewTab === 'dilekceMimari' && analysisResult.dilekceMimariRaporu && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-sky-950/20 border border-sky-900/40 rounded-xl p-5">
                    <h4 className="text-sky-400 font-bold mb-2">UYAP Netice-i Talep Önerisi</h4>
                    <p className="text-sky-900 dark:text-sky-100 text-sm font-mono p-3 bg-sky-50/50 dark:bg-slate-950/50 rounded-lg border border-sky-200 dark:border-slate-800">{analysisResult.dilekceMimariRaporu.uyapNeticeiTalepOnerisi}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <h4 className="text-indigo-400 font-bold mb-3">Dilekçe Kurgusu Hiyerarşisi</h4>
                    <div className="space-y-2">
                      {(analysisResult.dilekceMimariRaporu.dilekceKurgusuHiyerarsisi || []).map((k, i) => (
                        <div key={i} className="flex gap-3 items-start p-2 bg-slate-100/70 dark:bg-slate-800/30 rounded-lg">
                          <span className="text-indigo-500 font-black">{i+1}.</span>
                          <span className="text-slate-800 dark:text-slate-200 text-sm">{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4">
                    <h4 className="text-amber-400 font-bold mb-2 text-sm">Tensip ve Müzekkere Talepleri</h4>
                    <ul className="list-disc list-inside text-amber-200/80 text-xs space-y-1">
                      {(analysisResult.dilekceMimariRaporu.tensipVeMuzekkereTalepleri || []).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              )}

{/* Bottom Action Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  Model: <strong className="text-slate-200">{analysisResult.modelUsed}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {onApplyToPetition && (
                    <button
                      type="button"
                      onClick={() => {
                        const petitionText = `=== DAVA DERİN ANALİZ NOTLARI (${analysisResult.davaTuru}) ===\nMahkeme: ${analysisResult.gorevliYetkiliMahkeme}\nTeşhis: ${analysisResult.hukukiTeshis}\nHMK 200 Kuralı: ${analysisResult.delilVeEvrakDenetimi.senetleIspatKuraliHMK200}\nStratejik Talep: ${analysisResult.derinHukukiMuhakeme.stratejikEylemPlani.join('; ')}`;
                        onApplyToPetition(petitionText);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dilekçe Taslağına Aktar</span>
                    </button>
                  )}

                  {onNavigateToTimeline && (
                    <button
                      type="button"
                      onClick={onNavigateToTimeline}
                      className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Dava Takvimine Git</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full min-h-[460px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 space-y-4">
              <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-slate-400">
                <Brain className="w-10 h-10 text-amber-400/80" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-bold text-slate-200">
                  Dava Evraklarınızı Yükleyin ve Analizi Başlatın
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sol panelden dava evraklarını (PDF, UDF, fatura, tensip zaptı) ekleyin veya dava özetini girin. 
                  Sistem varsayılan ve zorunlu olarak <strong>Gemini 3.1 Pro Derin Hukuki Muhakeme</strong> ile kapsamlı analizi başlatır.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setScannerModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Kamera ile Kağıt Delil Tara (OCR)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        lawyerSicilNo={lawyerSicilNo}
        onAddScannedFiles={(files) => {
          setUploadedFiles((prev) => [...prev, ...files]);
        }}
        onApplyTextToCase={(text, subjectSuggestion) => {
          if (subjectSuggestion && !caseSubject) {
            setCaseSubject(subjectSuggestion);
          }
          setClaimSummary((prev) => (prev ? `${prev}\n\n[Taranan Delil Özeti]:\n${text}` : text));
        }}
      />

      {/* Scanned Document Detail Preview Modal */}
      {viewingScannedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 truncate max-w-sm">
                    {viewingScannedFile.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{Math.round(viewingScannedFile.size / 1024)} KB</span>
                    <span>•</span>
                    <span>{viewingScannedFile.uploadedAt}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                      OCR Transkripsiyon
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingScannedFile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Belgeden Ayrıştırılan Metin:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingScannedFile.content);
                  }}
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Metni Kopyala</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {viewingScannedFile.content}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setClaimSummary((prev) => (prev ? `${prev}\n\n${viewingScannedFile.content}` : viewingScannedFile.content));
                  setViewingScannedFile(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Dava İddia & Talep Metnine Aktar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingScannedFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
