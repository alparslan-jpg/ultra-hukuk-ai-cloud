import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Brain,
  Mic,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Clock,
  Terminal,
  FileSearch,
  Gavel,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { AiAssistedBadge } from './DenetlemePaneli';

export interface LegalAgentItem {
  id: number;
  name: string;
  category: 'Delil & Belge' | 'Strateji & Harp Odası' | 'Usul & Dava Şartları' | 'Dilekçe & UYAP' | 'Adli Dikte & Duruşma' | 'Mevzuat & Külliyat';
  status: 'Çalışıyor' | 'Aktif Denetim' | 'Hazır';
  currentTask: 'Analiz' | 'Dikte' | 'Çelişki Tespiti' | 'Ön İnceleme' | 'Zamanaşımı' | 'HMK 281 İtiraz' | 'Çapraz Sorgu' | 'Dilekçe Kurgusu' | 'Emsal Tarama' | 'Mevzuat Doğrulama' | 'Vekalet & Sicil Kontrolü' | 'Yargıç Tahmini';
  assignedModel: 'gemini-3.8-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.5-transcribe';
  modelTier: 'Flash (Hızlı & Çevik)' | 'Pro (Derin Akıl Yürütme)' | 'Transcribe (Adli Ses)';
  strategyReason: string;
  targetTab: 'analysis' | 'briefing' | 'devils' | 'temporal' | 'procedural' | 'expert' | 'hearing' | 'petition' | 'precedent' | 'ocr' | 'audio' | 'denetleme' | 'crossref';
  latencyMs: number;
  successRate: string;
  tasksCompletedToday: number;
  description: string;
}

export const LEGAL_AGENTS_18: LegalAgentItem[] = [
  {
    id: 1,
    name: 'Belge Okuma ve Görsel Yorumlama (OCR)',
    category: 'Delil & Belge',
    status: 'Aktif Denetim',
    currentTask: 'Analiz',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: Taranmış dava evrakı, tebliğ mazbatası ve el yazısı zaptı milisaniyeler içinde yüksek hızda metne döker.',
    targetTab: 'ocr',
    latencyMs: 1120,
    successRate: '99.9%',
    tasksCompletedToday: 184,
    description: 'Taranmış PDF, imza, kaşe, tebellüğ şerhleri ve evrakta yapay zeka (LLM) kullanım izlerini mikro düzeyde çözümler.'
  },
  {
    id: 2,
    name: 'Belge Çıkarım ve Sınıflandırma',
    category: 'Delil & Belge',
    status: 'Hazır',
    currentTask: 'Analiz',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: Mahkeme adı, Esas/Karar numaraları ve taraf kimliklerini anlık yapılandırılmış JSON nesnesine ayrıştırır.',
    targetTab: 'briefing',
    latencyMs: 840,
    successRate: '100%',
    tasksCompletedToday: 215,
    description: 'Gelen dava evrakının türünü, görevli mahkemeyi ve hukuki niteliğini saniyeler içinde tespit eder.'
  },
  {
    id: 3,
    name: 'Şeytanın Avukatı (Harp Odası)',
    category: 'Strateji & Harp Odası',
    status: 'Çalışıyor',
    currentTask: 'Çelişki Tespiti',
    assignedModel: 'gemini-3.1-pro-preview',
    modelTier: 'Pro (Derin Akıl Yürütme)',
    strategyReason: 'Pro: Çift taraflı (Davacı/Davalı) kurgu, çapraz usul tuzakları ve çok aşamalı karşı argüman simülasyonu için üst düzey akıl yürütme gerekir.',
    targetTab: 'devils',
    latencyMs: 3180,
    successRate: '99.7%',
    tasksCompletedToday: 96,
    description: 'Karşı taraf vekilinin öne süreceği zamanaşımı, yetkisizlik, ayıp ihbarı noksanlığı ve zayıf halkaları önceden simüle eder.'
  },
  {
    id: 4,
    name: 'Baş Müzakereci Ön Değerlendirme',
    category: 'Strateji & Harp Odası',
    status: 'Hazır',
    currentTask: 'Ön İnceleme',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: Dava dosyasının 5 maddelik stratejik yol haritasını ve delil haritasını avukat dosyayı açar açmaz hazır eder.',
    targetTab: 'briefing',
    latencyMs: 980,
    successRate: '99.8%',
    tasksCompletedToday: 162,
    description: 'Müvekkilin hukuki pozisyonunu netleştirir; sulh, arabuluculuk veya dava yoluna ilişkin ön fizibilite sunar.'
  },
  {
    id: 5,
    name: 'Risk ve Süre Tarama Ajanı',
    category: 'Usul & Dava Şartları',
    status: 'Aktif Denetim',
    currentTask: 'Zamanaşımı',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: Olay tarihi, tebliğ tarihi ve mevzuat zamanaşımı cetvellerini anlık olarak tarayarak süreyi hesaplar.',
    targetTab: 'temporal',
    latencyMs: 720,
    successRate: '100%',
    tasksCompletedToday: 310,
    description: 'TBK m. 72, 146, 147; HMK m. 127 cevap süreleri ve TTK 8 günlük fatura itiraz sürelerini denetler.'
  },
  {
    id: 6,
    name: 'Dilekçe Yazarlığı & Yetki Doğrulama',
    category: 'Dilekçe & UYAP',
    status: 'Hazır',
    currentTask: 'Vekalet & Sicil Kontrolü',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: Vekaletnamede özel yetki (ahzu kabz, feragat, sulh, tahkim) ve imza sirkülerini hızlıca karşılaştırır.',
    targetTab: 'petition',
    latencyMs: 890,
    successRate: '99.9%',
    tasksCompletedToday: 145,
    description: 'HMK m. 74 uyarınca özel yetki gerektiren işlemler ile avukatın temsil yetkisini inceler.'
  },
  {
    id: 7,
    name: 'Mevzuat Takip ve Değişiklik Ajanı',
    category: 'Mevzuat & Külliyat',
    status: 'Hazır',
    currentTask: 'Mevzuat Doğrulama',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: Resmi Gazete yürürlük tarihlerini ve kanun değişikliklerini anlık külliyat veri tabanıyla senkronize eder.',
    targetTab: 'crossref',
    latencyMs: 870,
    successRate: '100%',
    tasksCompletedToday: 240,
    description: 'Yürürlükten kalkan mülga kanun hükümleri ile güncel normların zaman bakımından uygulanmasını takip eder.'
  },
  {
    id: 8,
    name: 'Baro Sicil & TBB Doğrulama Ajanı',
    category: 'Usul & Dava Şartları',
    status: 'Hazır',
    currentTask: 'Vekalet & Sicil Kontrolü',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: TBB ve Baro levha kaydı sorgularını yüksek önbellek hızıyla gerçekleştirir.',
    targetTab: 'procedural',
    latencyMs: 640,
    successRate: '100%',
    tasksCompletedToday: 178,
    description: '1136 Sayılı Avukatlık Kanunu m. 34 mesleki özen kuralı ve baro sicil aktiflik denetimi yapar.'
  },
  {
    id: 9,
    name: 'UYAP Dilekçe Taslak Üretim Ajanı',
    category: 'Dilekçe & UYAP',
    status: 'Çalışıyor',
    currentTask: 'Dilekçe Kurgusu',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: UYAP formatına uygun dava, cevap ve itiraz dilekçelerini HMK m. 119 şablonunda derhal kurgular.',
    targetTab: 'petition',
    latencyMs: 1450,
    successRate: '99.6%',
    tasksCompletedToday: 132,
    description: 'Vakıalar, hukuki sebepler, deliller ve talep sonucu bölümlerini UYAP formatında kusursuz oluşturur.'
  },
  {
    id: 10,
    name: 'Bağımsız Hakim Perspektifi Ajanı',
    category: 'Strateji & Harp Odası',
    status: 'Hazır',
    currentTask: 'Yargıç Tahmini',
    assignedModel: 'gemini-3.1-pro-preview',
    modelTier: 'Pro (Derin Akıl Yürütme)',
    strategyReason: 'Pro: Hakimin gözünden tarafsız hukuki muhakeme, ispat yükü ve ara karar ihtimallerini yüksek akıl yürütmeyle simüle eder.',
    targetTab: 'analysis',
    latencyMs: 2950,
    successRate: '99.5%',
    tasksCompletedToday: 88,
    description: 'Davanın esasına girilmeden önce hakimin re\'sen gözeteceği eksiklikleri ve hüküm ihtimallerini analiz eder.'
  },
  {
    id: 11,
    name: 'Çapraz Müzakere ve Çelişki Denetimi',
    category: 'Strateji & Harp Odası',
    status: 'Aktif Denetim',
    currentTask: 'Çelişki Tespiti',
    assignedModel: 'gemini-3.1-pro-preview',
    modelTier: 'Pro (Derin Akıl Yürütme)',
    strategyReason: 'Pro: Tarafların sunduğu deliller, tanık beyanları ve evraklar arasındaki en ufak mantıksal ve kronolojik çelişkiyi yakalamak için derin muhakeme şarttır.',
    targetTab: 'analysis',
    latencyMs: 3240,
    successRate: '99.8%',
    tasksCompletedToday: 114,
    description: 'HMK m. 190-194 somutlaştırma yükü kapsamında iddialar ile deliller arasındaki uyuşmazlıkları raporlar.'
  },
  {
    id: 12,
    name: 'Emsal Karar Tarama Ajanı',
    category: 'Mevzuat & Külliyat',
    status: 'Hazır',
    currentTask: 'Emsal Tarama',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: Yargıtay Hukuk Genel Kurulu ve ilgili daire kararlarını hızlı vektörel taramayla eşleştirir.',
    targetTab: 'precedent',
    latencyMs: 1180,
    successRate: '99.7%',
    tasksCompletedToday: 195,
    description: 'Esas/Karar numaraları ve bağlayıcı ilke özetleri ile doğrudan uyuşmazlığa temas eden emsalleri listeler.'
  },
  {
    id: 13,
    name: 'Gerçekçilik Denetim ve Güvenilirlik Ajanı',
    category: 'Mevzuat & Külliyat',
    status: 'Aktif Denetim',
    currentTask: 'Mevzuat Doğrulama',
    assignedModel: 'gemini-3.1-pro-preview',
    modelTier: 'Pro (Derin Akıl Yürütme)',
    strategyReason: 'Pro: Yapay zeka halüsinasyonlarını yakalamak ve kanun atıflarını Türk Hukuk Külliyatı ile çapraz denetlemek derin doğrulama gerektirir.',
    targetTab: 'crossref',
    latencyMs: 2790,
    successRate: '100%',
    tasksCompletedToday: 156,
    description: 'Uydurma veya sınır dışı kanun maddelerini (örn. TBK m. 999) tespit ederek \'Verified\' veya \'Flagged\' olarak damgalar.'
  },
  {
    id: 14,
    name: 'Zamanaşımı & Faiz Hesaplama Motoru',
    category: 'Usul & Dava Şartları',
    status: 'Hazır',
    currentTask: 'Zamanaşımı',
    assignedModel: 'gemini-3.8-flash',
    modelTier: 'Flash (Hızlı & Çevik)',
    strategyReason: 'Flash: 3095 Sayılı Kanun oranları, avans ve yasal faiz matematiğini deterministik hızda hesaplar.',
    targetTab: 'temporal',
    latencyMs: 510,
    successRate: '100%',
    tasksCompletedToday: 280,
    description: 'Dava tarihi, temerrüt tarihi ve kısmi ödeme tarihlerine göre kademeli yasal/ticari temerrüt faizini çıkarır.'
  },
  {
    id: 15,
    name: '35 Noktalı Usul Denetimi ve Dava Şartı Filtresi',
    category: 'Usul & Dava Şartları',
    status: 'Çalışıyor',
    currentTask: 'Analiz',
    assignedModel: 'gemini-3.1-pro-preview',
    modelTier: 'Pro (Derin Akıl Yürütme)',
    strategyReason: 'Pro: HMK m. 114 genel dava şartları ve m. 116 ilk itirazları gibi davanın kaderini belirleyen usul tuzaklarını derinlemesine irdeler.',
    targetTab: 'procedural',
    latencyMs: 3110,
    successRate: '99.9%',
    tasksCompletedToday: 104,
    description: 'Zorunlu arabuluculuk, görevli mahkeme, kesin yetki ve gider avansı kontrollerini titizlikle yürütür.'
  },
  {
    id: 16,
    name: 'Bilirkişi Raporu İnceleme & İtiraz Ajanı',
    category: 'Strateji & Harp Odası',
    status: 'Hazır',
    currentTask: 'HMK 281 İtiraz',
    assignedModel: 'gemini-3.1-pro-preview',
    modelTier: 'Pro (Derin Akıl Yürütme)',
    strategyReason: 'Pro: Bilirkişinin hakimin yerine geçip hukuki tavsifte bulunduğu halleri (HMK m. 266) ve hesaplama çelişkilerini yüksek yargıç titizliğiyle yakalar.',
    targetTab: 'expert',
    latencyMs: 3350,
    successRate: '99.6%',
    tasksCompletedToday: 91,
    description: 'HMK m. 281 uyarınca 2 haftalık kesin süre içinde sunulacak itiraz layihasını ve yeni bilirkişi talebini kurgular.'
  },
  {
    id: 17,
    name: 'Duruşma Hazırlığı & Çapraz Sorgu Simülatörü',
    category: 'Adli Dikte & Duruşma',
    status: 'Hazır',
    currentTask: 'Çapraz Sorgu',
    assignedModel: 'gemini-3.1-pro-preview',
    modelTier: 'Pro (Derin Akıl Yürütme)',
    strategyReason: 'Pro: HMK m. 254-257 tanık çapraz sorgusunda yönlendirici soru tuzaklarını ve tanığın çelişkisini zapta geçirme taktiklerini türetir.',
    targetTab: 'hearing',
    latencyMs: 3410,
    successRate: '99.7%',
    tasksCompletedToday: 76,
    description: 'Duruşma safhasında tanığa yöneltilecek stratejik soruları ve anlık itiraz şerhlerini hazırlar.'
  },
  {
    id: 18,
    name: 'Adli Sesli Dikte ve Duruşma Zaptı Ajanı',
    category: 'Adli Dikte & Duruşma',
    status: 'Çalışıyor',
    currentTask: 'Dikte',
    assignedModel: 'gemini-3.5-transcribe',
    modelTier: 'Transcribe (Adli Ses)',
    strategyReason: 'Transcribe: Duruşma salonundaki ses karmaşasında Hakim, Katip ve Vekil konuşmacılarını ayrıştırarak resmi zapta dönüştürür.',
    targetTab: 'audio',
    latencyMs: 1640,
    successRate: '99.8%',
    tasksCompletedToday: 188,
    description: 'Adli sesli dikte, müvekkil ses kayıtları ve duruşma zaptı seslerini konuşmacı etiketli hukuki metne dönüştürür.'
  }
];

interface HukukAjaniYonetimPaneliProps {
  lawyerSicilNo: string;
  onNavigateToTab?: (tab: 'analysis' | 'briefing' | 'devils' | 'temporal' | 'procedural' | 'expert' | 'hearing' | 'petition' | 'precedent' | 'ocr' | 'audio' | 'denetleme' | 'crossref') => void;
}

export const HukukAjaniYonetimPaneli: React.FC<HukukAjaniYonetimPaneliProps> = ({
  lawyerSicilNo,
  onNavigateToTab,
}) => {
  const [agents, setAgents] = useState<LegalAgentItem[]>(LEGAL_AGENTS_18);
  const [modelFilter, setModelFilter] = useState<'all' | 'flash' | 'pro' | 'transcribe'>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string>('Az önce');
  const [selectedAgent, setSelectedAgent] = useState<LegalAgentItem | null>(null);

  // Ping all 18 agents to simulate live responsiveness and latency verification
  const handlePingAllAgents = () => {
    setIsPinging(true);
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          const jitter = Math.floor(Math.random() * 80) - 40;
          return {
            ...agent,
            latencyMs: Math.max(300, agent.latencyMs + jitter),
            tasksCompletedToday: agent.tasksCompletedToday + 1,
          };
        })
      );
      setIsPinging(false);
      setLastPingTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 900);
  };

  // Filtered agents list
  const filteredAgents = agents.filter((a) => {
    if (modelFilter === 'flash' && !a.assignedModel.includes('flash')) return false;
    if (modelFilter === 'pro' && !a.assignedModel.includes('pro')) return false;
    if (modelFilter === 'transcribe' && !a.assignedModel.includes('transcribe')) return false;

    if (taskFilter !== 'all' && a.currentTask !== taskFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchTask = a.currentTask.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchModel = a.assignedModel.toLowerCase().includes(q);
      if (!matchName && !matchTask && !matchDesc && !matchModel) return false;
    }

    return true;
  });

  const flashCount = agents.filter((a) => a.assignedModel.includes('flash')).length;
  const proCount = agents.filter((a) => a.assignedModel.includes('pro')).length;
  const transcribeCount = agents.filter((a) => a.assignedModel.includes('transcribe')).length;
  const activeWorkingCount = agents.filter((a) => a.status === 'Çalışıyor').length;
  const activeAuditingCount = agents.filter((a) => a.status === 'Aktif Denetim').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1427] via-[#141d36] to-[#0e162d] border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 shadow-inner">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Hukuk Ajanı Yönetim Paneli
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                    18 Aktif Hukuk Ajanı
                  </span>
                </h2>
                <span className="text-[11px] font-mono text-purple-300">
                  Çoklu Motor Mimarisi: Hızlı Tasnif ve Operasyon & Derin Bağlam Muhakeme
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Türk Hukuk normlarına (TBK, HMK, TTK, İİK, İş K.) göre özelleştirilmiş <strong>18 uzman yapay zeka ajanı</strong> tek merkezden yönetilir. Her bir ajan, görev türüne göre optimize edilmiş yerli muhakeme motoru ile eşleştirilmiş olup anlık durumları ve aktif görevleri canlı izlenmektedir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
            <button
              type="button"
              onClick={handlePingAllAgents}
              disabled={isPinging}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2 rounded-xl border border-purple-400/40 flex items-center gap-2 transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pingleniyor...' : 'Tüm Ajanları Test Et'}</span>
            </button>
            <AiAssistedBadge lawyerSicilNo={lawyerSicilNo} />
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="bg-[#091022] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Toplam Ajan</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-black font-mono text-white">18 / 18</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                %100 Canlı
              </span>
            </div>
          </div>

          <div className="bg-[#091022] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Hızlı Tasnif Motoru</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black font-mono text-cyan-400">{flashCount} Ajan</span>
              <span className="text-[10px] font-mono text-slate-400">~0.9 sn</span>
            </div>
            <div className="text-[10px] text-cyan-300/80 truncate">Hızlı & Çevik Görevler</div>
          </div>

          <div className="bg-[#091022] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Derin Bağlam Motoru</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black font-mono text-purple-400">{proCount} Ajan</span>
              <span className="text-[10px] font-mono text-slate-400">~3.1 sn</span>
            </div>
            <div className="text-[10px] text-purple-300/80 truncate">Derin Akıl Yürütme</div>
          </div>

          <div className="bg-[#091022] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Ses Çözümleme Motoru</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black font-mono text-emerald-400">{transcribeCount} Ajan</span>
              <span className="text-[10px] font-mono text-slate-400">~1.6 sn</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 truncate">Adli Ses & Duruşma Zaptı</div>
          </div>

          <div className="bg-[#091022] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Aktif Görev Durumu</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {activeWorkingCount + activeAuditingCount} Görevde
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {18 - (activeWorkingCount + activeAuditingCount)} Hazır
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Son Sinyal: {lastPingTime}</div>
          </div>
        </div>
      </div>

      {/* 3. Multi-Model Strategy Architecture Guide */}
      <div className="bg-[#10172b] border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-slate-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Çoklu Model (Multi-Model) Stratejisi & Yönlendirme Matrisi
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Görev Karmaşıklığına Göre Akıllı Dağıtım
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-[#0a1122] rounded-xl border border-cyan-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Hızlı Tasnif ve Operasyon Motoru
              </span>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-800/60">
                10 Ajan
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Hızlı ve Çevik Görevler:</strong> Evrak OCR, belge sınıflandırma, ön inceleme brifingi, risk ve hak düşürücü süre hesabı, UYAP dilekçe taslağı, emsal tarama ve 3095 s. K. faiz hesaplama.
            </p>
            <div className="text-[10px] text-slate-400 font-mono">Ortalama Hız: ~0.8 - 1.2 saniye</div>
          </div>

          <div className="p-3 bg-[#0a1122] rounded-xl border border-purple-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                Derin Bağlam ve Külliyat Muhakeme Motoru
              </span>
              <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded font-mono border border-purple-800/60">
                7 Ajan
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Derin Akıl Yürütme & Çelişki Tespiti:</strong> Şeytanın Avukatı (Harp Odası), Bağımsız Hakim Perspektifi, Çelişki Tespiti, 35 Noktalı Usul Denetimi, HMK 281 Bilirkişi İtirazı, Çapraz Sorgu Simülatörü.
            </p>
            <div className="text-[10px] text-slate-400 font-mono">Muhakeme Seviyesi: Üst Düzey Yargısal Akıl</div>
          </div>

          <div className="p-3 bg-[#0a1122] rounded-xl border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                Hukuki Ses Çözümleme ve Dikte Motoru
              </span>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-800/60">
                1 Ajan
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Adli Ses & Duruşma Zaptı:</strong> Duruşma salonundaki çoklu konuşmacı ortamında (Hakim, Katip, Davacı Vekili, Davalı Vekili) sesleri ayırt eder ve resmi tutanak formatında metne döker.
            </p>
            <div className="text-[10px] text-slate-400 font-mono">Diyalog Ayrımı: Konuşmacı Etiketli (Diarization)</div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Filters Bar */}
      <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ajan adı, görev (Analiz, Dikte, Çelişki...) veya model ara..."
              className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Model Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Model:
            </span>
            <button
              type="button"
              onClick={() => setModelFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                modelFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tümü ({agents.length})
            </button>
            <button
              type="button"
              onClick={() => setModelFilter('flash')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                modelFilter === 'flash'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
              }`}
            >
              ⚡ Flash ({flashCount})
            </button>
            <button
              type="button"
              onClick={() => setModelFilter('pro')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                modelFilter === 'pro'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
              }`}
            >
              🧠 Pro ({proCount})
            </button>
            <button
              type="button"
              onClick={() => setModelFilter('transcribe')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                modelFilter === 'transcribe'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
              }`}
            >
              🎙️ Transcribe ({transcribeCount})
            </button>
          </div>

          {/* Task Filter Select */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="bg-[#0a0f1d] border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="all">Tüm Görevler ({agents.length})</option>
              <option value="Analiz">Görev: Analiz</option>
              <option value="Dikte">Görev: Dikte</option>
              <option value="Çelişki Tespiti">Görev: Çelişki Tespiti</option>
              <option value="Ön İnceleme">Görev: Ön İnceleme</option>
              <option value="Zamanaşımı">Görev: Zamanaşımı</option>
              <option value="HMK 281 İtiraz">Görev: HMK 281 İtiraz</option>
              <option value="Çapraz Sorgu">Görev: Çapraz Sorgu</option>
              <option value="Dilekçe Kurgusu">Görev: Dilekçe Kurgusu</option>
              <option value="Emsal Tarama">Görev: Emsal Tarama</option>
              <option value="Mevzuat Doğrulama">Görev: Mevzuat Doğrulama</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0a0f1d] border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="Çalışıyor">Çalışıyor</option>
              <option value="Aktif Denetim">Aktif Denetim</option>
              <option value="Hazır">Hazır</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. The 18 Legal Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const isFlash = agent.assignedModel.includes('flash');
          const isPro = agent.assignedModel.includes('pro');
          const isTranscribe = agent.assignedModel.includes('transcribe');

          const isWorking = agent.status === 'Çalışıyor';
          const isAuditing = agent.status === 'Aktif Denetim';

          return (
            <div
              key={agent.id}
              className={`bg-[#0d1527] border rounded-2xl p-4 transition flex flex-col justify-between space-y-3.5 relative overflow-hidden shadow-lg ${
                isWorking
                  ? 'border-emerald-500/40 hover:border-emerald-500/70'
                  : isAuditing
                  ? 'border-sky-500/40 hover:border-sky-500/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Agent ID & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center border border-slate-700">
                    {agent.id}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 leading-snug">
                      {agent.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {agent.category}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {isWorking && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ÇALIŞIYOR
                    </span>
                  )}
                  {isAuditing && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      DENETİMDE
                    </span>
                  )}
                  {agent.status === 'Hazır' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      HAZIR
                    </span>
                  )}
                </div>
              </div>

              {/* Current Task & Assigned Engine Model */}
              <div className="space-y-2 pt-1">
                {/* Current Task Pill */}
                <div className="flex items-center justify-between text-xs bg-[#080d19] p-2 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Güncel Görev:
                  </span>
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {agent.currentTask}
                  </span>
                </div>

                {/* Assigned Model Pill */}
                <div className="flex items-center justify-between text-xs bg-[#080d19] p-2 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    {isFlash && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                    {isPro && <Brain className="w-3.5 h-3.5 text-purple-400" />}
                    {isTranscribe && <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    Atanan Model:
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isFlash
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : isPro
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {agent.assignedModel === 'gemini-3.8-flash' ? 'Hızlı Tasnif Motoru' : agent.assignedModel === 'gemini-3.1-pro-preview' ? 'Derin Bağlam Motoru' : 'Ses Çözümleme Motoru'}
                  </span>
                </div>
              </div>

              {/* Description & Strategy Reason */}
              <p className="text-[11px] text-slate-300 leading-relaxed bg-[#090f1e] p-2.5 rounded-xl border border-slate-800/80">
                {agent.description}
              </p>

              <div className="text-[10px] text-slate-400 italic bg-[#060a14] p-2 rounded-lg border border-slate-900">
                <span className="text-purple-300 font-semibold not-italic">Strateji: </span>
                {agent.strategyReason}
              </div>

              {/* Metrics & Action Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <span title="Ortalama Tepki Süresi" className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {agent.latencyMs} ms
                  </span>
                  <span title="Başarı Oranı" className="text-emerald-400">
                    {agent.successRate}
                  </span>
                  <span title="Bugün İşlenen Görev" className="text-slate-400">
                    {agent.tasksCompletedToday} op
                  </span>
                </div>

                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab(agent.targetTab)}
                    className="text-[11px] bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition font-bold"
                  >
                    <span>Görevi Aç</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Footer Strategy Note */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            Tüm 18 hukuk ajanı 1136 Sayılı Avukatlık Kanunu m. 34 mesleki sır ve özen protokolüne tabi olarak çalışmaktadır.
          </span>
        </div>
        <div className="font-mono text-[11px] text-purple-300">
          Avukat Sicil No: {lawyerSicilNo} | TBB E-İmza & HWID Korumalı
        </div>
      </div>
    </div>
  );
};
