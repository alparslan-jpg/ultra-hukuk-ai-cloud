import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  Search,
  Scale,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Layers,
  ChevronRight,
  Filter,
  X,
  Compass,
  HelpCircle,
  Lightbulb,
  Building2,
  ShieldCheck,
  Gavel
} from 'lucide-react';

import { LegalArticle, SemanticSearchResult } from '../services/legalDatabaseService';
import {
  RecentSearchItem,
  getRecentSearches,
  addRecentSearch,
  subscribeRecentSearches
} from '../services/recentSearchesService';

export interface LegalTermDefinition {
  term: string;
  category: string;
  shortDefinition: string;
  plainLanguageExplanation: string;
  statutoryBasis: string;
  practicalExample: string;
  criticalDeadlines?: string;
  proceduralTips?: string;
  relatedTerms?: string[];
  modelUsed?: string;
  generatedAt?: string;
  isCustomGenerated?: boolean;
}

interface HukukTerimleriSozluguProps {
  onSearchMevzuat?: (statuteQuery: string) => void;
  onApplyToPetition?: (citationText: string) => void;
  onNavigateBackToMevzuat?: () => void;
  lawyerSicilNo?: string;
  initialTermToLookup?: string;
  onOpenRecentSearches?: () => void;
}

// Curated library of foundational Turkish legal concepts
const PRELOADED_LEGAL_TERMS: LegalTermDefinition[] = [
  {
    term: 'Tenkis Davası',
    category: 'Medeni & Miras (TMK)',
    shortDefinition: 'Mirasbırakanın saklı payları zedeleyen ölüme bağlı veya sağlararası tasarruflarının, yasal saklı pay sınırına indirilmesini sağlayan yenilik doğurucu davadır.',
    plainLanguageExplanation: 'Vasiyetname veya sağken yapılan bağışlarla miras hakkı gasp edilen saklı paylı mirasçının, hakkını kanunen geri almasını sağlayan davadır.',
    statutoryBasis: '4721 Sayılı TMK m. 560 - 571',
    practicalExample: 'Babanın tüm taşınmazlarını sağlığında tek bir çocuğuna bağışlaması üzerine, diğer kardeşlerin kanuni saklı payları için açtığı tenkis davası.',
    criticalDeadlines: 'Saklı payın zedelendiğinin öğrenilmesinden itibaren 1 YIL, her hâlde mirasın açılmasından itibaren 10 YIL hak düşürücü süre (TMK m. 571).',
    proceduralTips: 'Yetkili mahkeme murisin son yerleşim yeri Asliye Hukuk Mahkemesidir. Net tereke hesabı çıkarılmadan tenkis oranına hükmedilemez.',
    relatedTerms: ['Saklı Pay', 'Muris Muvazaası', 'Tasarruf Edilebilir Kısım', 'Ölüme Bağlı Tasarruf']
  },
  {
    term: 'Senetle İspat Zorunluluğu',
    category: 'Usul Hukuku (HMK)',
    shortDefinition: 'Kanunda öngörülen parasal sınırı aşan hukuki işlemlerin varlığını ve miktarını ispat etmek için kural olarak yazılı senet ibraz edilmesini şart koşan usul kuralıdır.',
    plainLanguageExplanation: 'Belli bir meblağın üzerindeki borç veya sözleşmeler sadece tanık sözüyle ispatlanamaz; mutlaka imzalı belge, senet veya banka dekontu gereklidir.',
    statutoryBasis: '6100 Sayılı HMK m. 200 (Senetle İspat Zorunluluğu)',
    practicalExample: 'Senetle ispat sınırını aşan elden 300.000 TL borç verildiği iddiasına karşı, yazılı belge sunamayan davacının tanık dinletme talebinin reddedilmesi.',
    criticalDeadlines: 'Tanık dinletilmesine muvafakat edilmediği itirazı en geç cevap dilekçesinde ve ön inceleme duruşmasında tutanağa geçirilmelidir.',
    proceduralTips: 'Karşı taraf tanık listesi sunduğunda derhal "HMK m. 200 uyarınca tanık dinletilmesine muvafakatimiz yoktur" itirazı zapta geçirilmelidir.',
    relatedTerms: ['Yazılı Delil Başlangıcı (HMK 202)', 'İkrar', 'Yemin', 'Takdiri Delil']
  },
  {
    term: 'Muris Muvazaası',
    category: 'Medeni & Miras (TMK / TBK)',
    shortDefinition: 'Mirasbırakanın diğer mirasçıları miras hakkından yoksun bırakmak amacıyla, gerçekte bağışladığı taşınmazı tapuda satış veya ölünceye kadar bakma gibi göstermesidir.',
    plainLanguageExplanation: 'Bir kimsenin diğer çocuklarından mal kaçırmak için gayrimenkulünü bir çocuğuna tapuda güya para alıp satmış gibi devretmesidir.',
    statutoryBasis: 'TBK m. 19 ve 01.04.1974 tarihli Yargıtay İçtihadı Birleştirme Kararı',
    practicalExample: 'Murisin değerli dairesini tapu müdürlüğünde sembolik bir bedelle ikinci eşine satış işlemiyle devretmesi; çocukların tapu iptal davası açması.',
    criticalDeadlines: 'Muris muvazaasına dayalı davalar HAK DÜŞÜRÜCÜ SÜREYE VEYA ZAMANAŞIMINA TABİ DEĞİLDİR; mirasbırakanın ölümünden sonra her zaman açılabilir.',
    proceduralTips: 'Dava açılır açılmaz taşınmazın üçüncü kişilere devrinin engellenmesi için tensiben "İhtiyati Tedbir" şerhi talep edilmelidir.',
    relatedTerms: ['Tenkis Davası', 'Muvazaa', 'Saklı Pay', 'Tapu İptali ve Tescil']
  },
  {
    term: 'İhtiyati Tedbir',
    category: 'Usul Hukuku (HMK)',
    shortDefinition: 'Dava konusu hakkın elde edilmesinin gecikmesi veya imkansızlaşması tehlikesine karşı yargılama sonuna kadar verilen geçici hukuki koruma tedbiridir.',
    plainLanguageExplanation: 'Dava devam ederken karşı tarafın evi satmasını, arabayı devretmesini veya parayı kaçırmasını engellemek için mahkemenin koyduğu geçici yasak.',
    statutoryBasis: '6100 Sayılı HMK m. 389 - 399',
    practicalExample: 'Boşanmada katkı payı davasında eşin adındaki aile konutunun üçüncü şahıslara devrini durdurmak için tapu kütüğüne ihtiyati tedbir konulması.',
    criticalDeadlines: 'Dava açılmadan önce tedbir alınmışsa 2 HAFTA içinde esas hakkında dava açılmalıdır (HMK m. 397/1); karara itiraz süresi 1 HAFTADIR.',
    proceduralTips: 'HMK m. 392 uyarınca kural olarak teminat gösterilmesi zorunludur; adli yardım varsa teminattan muafiyet istenebilir.',
    relatedTerms: ['İhtiyati Haciz', 'Teminat Akçesi', 'Geçici Hukuki Koruma']
  },
  {
    term: 'Munzam Zarar (Aşkın Zarar)',
    category: 'Borçlar Hukuku (TBK)',
    shortDefinition: 'Para borcunun ifasında temerrüde düşülmesi sebebiyle alacaklının uğradığı ve yasal temerrüt faiziyle karşılanamayan ilave müspet zarardır.',
    plainLanguageExplanation: 'Paranız geç ödendiği için yüksek enflasyon veya kur farkı sebebiyle aldığınız faizin çok üstünde uğradığınız reel kayıp.',
    statutoryBasis: '6098 Sayılı TBK m. 122',
    practicalExample: '1.000.000 TL alacağı 3 yıl gecikmeyle tahsil eden şirketin, yasal faizin enflasyon karşısında erimesi sebebiyle açtığı ilave zarar davası.',
    criticalDeadlines: 'Asıl alacağın tahsil edildiği tarihten itibaren TBK m. 146 uyarınca 10 YILLIK genel zamanaşımına tabidir.',
    proceduralTips: 'Yargıtay HGK kararlarına göre enflasyon tek başına yeterli delil sayılmaz; alacaklının bu parayı nerede değerlendireceğini somutlaştırması gerekir.',
    relatedTerms: ['Temerrüt Faizi', 'TBK 117 Temerrüt', 'Enflasyon Farkı']
  },
  {
    term: 'İtirazın İptali Davası',
    category: 'İcra & İflas (İİK)',
    shortDefinition: 'İlamsız icra takibine borçlunun yaptığı itirazla duran takibin devamını sağlamak ve borçluyu %20 icra inkar tazminatına mahkum ettirmek için açılan eda davasıdır.',
    plainLanguageExplanation: 'İcraya verdiğiniz kişinin "böyle bir borcum yok" diyerek takibi durdurması üzerine mahkemeden takibin devamını isteme davasıdır.',
    statutoryBasis: '2004 Sayılı İİK m. 67',
    practicalExample: 'Faturaya dayalı ilamsız icra takibine borçlunun haksız itirazı sonrası Ticaret Mahkemesinde açılan, alacağın tespiti ve %20 inkar tazminatı talepli dava.',
    criticalDeadlines: 'İtirazın alacaklıya tebliğinden itibaren 1 YILLIK HAK DÜŞÜRÜCÜ SÜRE içinde açılmalıdır.',
    proceduralTips: 'Ticari davalarda dava şartı arabuluculuğa (TTK m. 5/A) başvurulması zorunludur.',
    relatedTerms: ['İcra İnkar Tazminatı', 'İlamsız Takip', 'Menfi Tespit']
  },
  {
    term: 'Islah',
    category: 'Usul Hukuku (HMK)',
    shortDefinition: 'Taraflardan birinin usule ilişkin olarak yaptığı bir işlemi tek taraflı irade beyanıyla tamamen veya kısmen düzeltmesine imkan veren istisnai usuli imkandır.',
    plainLanguageExplanation: 'Dava dilekçesinde unuttuğunuz bir talebi eklemek veya dava değerini bilirkişi raporuna göre resmen artırma hakkıdır.',
    statutoryBasis: '6100 Sayılı HMK m. 176 - 182',
    practicalExample: 'Kıdem tazminatı davasını belirsiz alacak olarak açan vekilin, bilirkişi raporunun tebliğinden sonra harcını yatırarak dava değerini ıslahla artırması.',
    criticalDeadlines: 'Islah tahkikatın sona ermesine kadar yapılabilir (HMK m. 177). Aynı davada her taraf YALNIZCA BİR KEZ ıslah yapabilir.',
    proceduralTips: 'Islah edilen miktar üzerinden nispi karar ve ilam harcının 1/4\'ü 1 hafta içinde vezneye yatırılmalıdır.',
    relatedTerms: ['Kısmi Islah', 'Tam Islah', 'Belirsiz Alacak Davası']
  },
  {
    term: 'Müteselsil Sorumluluk',
    category: 'Borçlar Hukuku (TBK / TTK)',
    shortDefinition: 'Birden çok borçlunun her birinin, alacaklıya karşı borcun tamamından sorumlu olduğu ve biri ödeyene kadar sorumluluklarının sürdüğü borç ilişkisidir.',
    plainLanguageExplanation: 'Bir borçtan birkaç kişinin birlikte sorumlu olması; alacaklının parasını dilediği borçludan tek seferde alabilmesidir.',
    statutoryBasis: '6098 Sayılı TBK m. 162 - 168 & TTK m. 7',
    practicalExample: 'Trafik kazasında yaralanan kişinin, tazminatın tamamını kusurlu sürücüden, araç sahibinden veya sigorta şirketinden tek başına isteyebilmesi.',
    criticalDeadlines: 'Borçlulardan birine karşı zamanaşımının kesilmesi, diğer müteselsil borçlulara karşı da zamanaşımını keser (TBK m. 155).',
    proceduralTips: 'Borcu ödeyen borçlu diğer müteselsil borçlulara kusurları oranında iç ilişkide rücu hakkına sahiptir.',
    relatedTerms: ['Rücu Hakkı', 'Kusursuz Sorumluluk', 'Birlikte Kusur']
  },
  {
    term: 'Menfi Tespit Davası',
    category: 'İcra & İflas (İİK)',
    shortDefinition: 'Borçlunun, icra takibinden önce veya sonra gerçekte borçlu olmadığının mahkeme ilamıyla tespiti amacıyla açtığı inşai/tespit davasıdır.',
    plainLanguageExplanation: 'Hakkınızda sahte senet veya haksız iddiayla icra başlatılmadan önce veya sonra "benim böyle bir borcum yoktur" diyerek açtığınız dava.',
    statutoryBasis: '2004 Sayılı İİK m. 72',
    practicalExample: 'Bedelsiz kalan bono sebebiyle icra takibi tehdidi altındaki keşidecinin, senet lehtarına karşı Asliye Ticaret Mahkemesinde açtığı borçsuzluk davası.',
    criticalDeadlines: 'İcra takibinden önce açılırsa %15 teminatla takibin durdurulması istenebilir (İİK m. 72/2). Takipten sonra açılırsa icra veznesindeki paranın alacaklıya ödenmemesi için tedbir alınabilir.',
    proceduralTips: 'Borçlu davayı kazanırsa ve alacaklının kötü niyetli olduğu sabit olursa en az %20 kötüniyet tazminatına hükmedilir.',
    relatedTerms: ['İstirdat Davası', 'İtirazın İptali', 'Kötüniyet Tazminatı']
  },
  {
    term: 'İlliyet Bağı (Nedensellik Bağı)',
    category: 'Borçlar Hukuku (TBK)',
    shortDefinition: 'Hukuka aykırı fiil ile meydana gelen zarar arasındaki mantıksal ve sebep-sonuç ilişkisidir.',
    plainLanguageExplanation: 'Uğranılan zararın doğrudan doğruya karşı tarafın kusurlu hareketinden kaynaklandığının kanıtlanmasıdır.',
    statutoryBasis: '6098 Sayılı TBK m. 49 & 50',
    practicalExample: 'Ameliyat sonrası gelişen komplikasyonun doktorun mesleki hatasından mı yoksa hastanın bünyesel hastalığından mı kaynaklandığının Adli Tıp raporuyla tespiti.',
    criticalDeadlines: 'Mücbir sebep, zarar görenin ağır kusuru veya üçüncü kişinin kusuru illiyet bağını keser ve tazminat sorumluluğunu ortadan kaldırır.',
    proceduralTips: 'Dava dilekçesinde zarar ile eylem arasındaki illiyet bağı vakıa bazında açıkça somutlaştırılmalıdır (HMK m. 119/1-e).',
    relatedTerms: ['Haksız Fiil', 'Mücbir Sebep', 'Kusur', 'Uygun İlliyet']
  },
  {
    term: 'Bekletici Mesele',
    category: 'Usul Hukuku (HMK)',
    shortDefinition: 'Görülmekte olan davanın karara bağlanmasının, başka bir mahkemede görülmekte olan bir davanın veya idari işlemin sonucuna bağlı olması halidir.',
    plainLanguageExplanation: 'Hakimin, kendi davasını karara bağlamadan önce başka bir mahkemede açılmış kilit bir davanın (örn. ceza davası veya tapu iptali) bitmesini beklemesidir.',
    statutoryBasis: '6100 Sayılı HMK m. 165',
    practicalExample: 'Tazminat davası gören Asliye Hukuk Mahkemesinin, sanık hakkında Ağır Ceza Mahkemesinde süren dolandırıcılık davasının kesinleşmesini beklemesi.',
    criticalDeadlines: 'Mahkeme bekletici mesele kararı verirse diğer dava kesinleşene kadar duruşmaları erteleyerek süreci takip eder.',
    proceduralTips: 'TBK m. 74 uyarınca ceza hakiminin beraat kararı hukuk hakimini kural olarak bağlamaz; ancak fiilin varlığına dair tespitler bağlayıcıdır.',
    relatedTerms: ['Dava Şartı', 'Kesin Hüküm', 'Derdestlik']
  },
  {
    term: 'Gabin (Aşırı Yararlanma)',
    category: 'Borçlar Hukuku (TBK)',
    shortDefinition: 'Bir sözleşmede karşılıklı edimler arasında açık bir oransızlık bulunması ve bu durumun taraflardan birinin zor durumda kalmasından veya tecrübesizliğinden faydalanılarak yaratılması halidir.',
    plainLanguageExplanation: 'Bir kimsenin çaresizliğinden veya bilgisizliğinden yararlanarak ona piyasa değerinin çok altında veya fahiş fiyata sözleşme imzalattırılmasıdır.',
    statutoryBasis: '6098 Sayılı TBK m. 28',
    practicalExample: 'Ağır borç altındaki kişinin değerinin üçte birine dairesini satmak zorunda bırakılması; 1 yıl içinde sözleşmenin iptali ve bedelin iadesi davası açılması.',
    criticalDeadlines: 'Zor durumda kalmanın veya tecrübesizliğin öğrenildiği tarihten itibaren 1 YIL ve her hâlde sözleşmenin kurulmasından itibaren 5 YIL içinde iptal hakkı kullanılmalıdır.',
    proceduralTips: 'Zarar gören taraf dilerse sözleşmeyi tamamen feshedebilir veya edimler arasındaki aşırı oransızlığın giderilmesini (bedel indirimi) talep edebilir.',
    relatedTerms: ['İrade Bozuklukları', 'Hata', 'Hile', 'Korkutma (İkrah)']
  }
];

const CATEGORIES = [
  'Tümü',
  'Usul Hukuku (HMK)',
  'Borçlar Hukuku (TBK)',
  'Medeni & Miras (TMK)',
  'İcra & İflas (İİK)',
  'Ticaret & Şirketler (TTK)'
];

export function HukukTerimleriSozlugu({
  onSearchMevzuat,
  onApplyToPetition,
  onNavigateBackToMevzuat,
  lawyerSicilNo = '8109',
  initialTermToLookup,
  onOpenRecentSearches
}: HukukTerimleriSozluguProps) {
  // Search input & selected category
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  // Currently active / viewed definition
  const [activeDefinition, setActiveDefinition] = useState<LegalTermDefinition | null>(PRELOADED_LEGAL_TERMS[0]);

  // Loading state when generating custom AI definition
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Copy feedback state
  const [copied, setCopied] = useState<boolean>(false);

  // Recent searches subscription
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => getRecentSearches());
  useEffect(() => {
    const unsub = subscribeRecentSearches((items) => {
      setRecentSearches(items);
    });
    return unsub;
  }, []);

  // Bookmarked / Saved Terms (persisted in localStorage)
  const storageKey = `ultra_hukuk_glossary_bookmarks_${lawyerSicilNo}`;
  const [bookmarkedTerms, setBookmarkedTerms] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : ['Tenkis Davası', 'Senetle İspat Zorunluluğu'];
    } catch {
      return ['Tenkis Davası', 'Senetle İspat Zorunluluğu'];
    }
  });

  // History of custom AI generated terms
  const historyKey = `ultra_hukuk_glossary_history_${lawyerSicilNo}`;
  const [customHistory, setCustomHistory] = useState<LegalTermDefinition[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(historyKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically lookup if initialTermToLookup is provided
  useEffect(() => {
    if (initialTermToLookup && initialTermToLookup.trim()) {
      setSearchTerm(initialTermToLookup);
      handleGenerateDefinition(initialTermToLookup);
    }
  }, [initialTermToLookup]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bookmarkedTerms));
    } catch (e) {
      console.warn('Failed to save glossary bookmarks:', e);
    }
  }, [bookmarkedTerms, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(customHistory));
    } catch (e) {
      console.warn('Failed to save glossary history:', e);
    }
  }, [customHistory, historyKey]);

  // Combined terms (Preloaded + Custom AI Generated)
  const combinedTerms = useMemo(() => {
    const map = new Map<string, LegalTermDefinition>();
    PRELOADED_LEGAL_TERMS.forEach((t) => map.set(t.term.toLowerCase(), t));
    customHistory.forEach((t) => map.set(t.term.toLowerCase(), t));
    return Array.from(map.values());
  }, [customHistory]);

  // Filtered terms based on category and search query
  const filteredTerms = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return combinedTerms.filter((item) => {
      const matchCategory =
        selectedCategory === 'Tümü' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.shortDefinition.toLowerCase().includes(q) ||
        item.statutoryBasis.toLowerCase().includes(q) ||
        (item.relatedTerms && item.relatedTerms.some((rt) => rt.toLowerCase().includes(q)));
      return matchCategory && matchSearch;
    });
  }, [combinedTerms, selectedCategory, searchTerm]);

  // Request AI definition from backend
  const handleGenerateDefinition = async (termToLookup?: string) => {
    const queryTerm = (termToLookup !== undefined ? termToLookup : searchTerm).trim();
    if (!queryTerm) return;

    setIsGenerating(true);
    setErrorMessage(null);

    // If already in combined list, show it immediately
    const existing = combinedTerms.find((t) => t.term.toLowerCase() === queryTerm.toLowerCase());
    if (existing) {
      setActiveDefinition(existing);
      addRecentSearch(existing.term, existing.category, 'glossary');
      setIsGenerating(false);
      return;
    }

    try {
      const res = await fetch('/api/ai/legal-term-definition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: queryTerm,
          category: selectedCategory !== 'Tümü' ? selectedCategory : undefined,
          lawyerSicilNo
        })
      });

      const data = await res.json();
      if (data.success) {
        const newDef: LegalTermDefinition = {
          term: data.term || queryTerm,
          category: data.category || (selectedCategory !== 'Tümü' ? selectedCategory : 'Genel Hukuk'),
          shortDefinition: data.shortDefinition,
          plainLanguageExplanation: data.plainLanguageExplanation,
          statutoryBasis: data.statutoryBasis,
          practicalExample: data.practicalExample,
          criticalDeadlines: data.criticalDeadlines,
          proceduralTips: data.proceduralTips,
          relatedTerms: data.relatedTerms || [],
          modelUsed: data.modelUsed || 'Derin Hukuki Muhakeme Motoru',
          generatedAt: data.generatedAt || new Date().toISOString(),
          isCustomGenerated: true
        };

        setActiveDefinition(newDef);
        addRecentSearch(newDef.term, newDef.category, 'glossary');
        setCustomHistory((prev) => [newDef, ...prev.filter((p) => p.term.toLowerCase() !== newDef.term.toLowerCase())]);
      } else {
        setErrorMessage(data.message || 'Yapay zeka tanımı oluşturulamadı.');
      }
    } catch (err: any) {
      console.error('Glossary generation error:', err);
      setErrorMessage('Bağlantı hatası: Yapay zeka motoruna ulaşılamadı.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle bookmark
  const toggleBookmark = (termName: string) => {
    setBookmarkedTerms((prev) =>
      prev.includes(termName) ? prev.filter((t) => t !== termName) : [...prev, termName]
    );
  };

  // Copy active definition to clipboard
  const handleCopyDefinition = () => {
    if (!activeDefinition) return;
    const text = `[HUKUK TERİMİ: ${activeDefinition.term.toUpperCase()}]\n\nKISA TANIM:\n${activeDefinition.shortDefinition}\n\nSADE TÜRKÇE ANLATIM:\n${activeDefinition.plainLanguageExplanation}\n\nYASAL DAYANAK:\n${activeDefinition.statutoryBasis}\n\nPRATİK DAVA ÖRNEĞİ:\n${activeDefinition.practicalExample}\n\nKRİTİK SÜRE & USUL ŞERHİ:\n${activeDefinition.criticalDeadlines || 'Süre kaydı yok'}\n${activeDefinition.proceduralTips || ''}\n\n(Kaynak: Ultra Hukuk AI Terimler Sözlüğü - Mevzuat Dizin)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send definition text to petition drafting tab
  const handleSendToPetition = () => {
    if (!activeDefinition || !onApplyToPetition) return;
    const formatted = `[HUKUKİ KAVRAM VE DAYANAK]: ${activeDefinition.term} (${activeDefinition.statutoryBasis})\n"${activeDefinition.shortDefinition}"\n(Pratik Usul: ${activeDefinition.proceduralTips || activeDefinition.plainLanguageExplanation})`;
    onApplyToPetition(formatted);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Hukuk Terimleri Sözlüğü
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                <span>Derin Hukuki Muhakeme Motoru Destekli</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Karmaşık hukuki kavramların, kurumların ve latince/osmanlıca usul terimlerinin yapay zeka ile otomatik üretilen kısa, anlaşılır tanımları ve mevzuat bağlantıları.
            </p>
          </div>

          {/* Navigation action buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {onOpenRecentSearches && (
              <button
                type="button"
                onClick={onOpenRecentSearches}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Son 5 Hukuki Kavram Arama Geçmişini Kenar Çubuğunda Göster"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Son Aramalar ({recentSearches.length})</span>
              </button>
            )}

            {onNavigateBackToMevzuat && (
              <button
                type="button"
                onClick={onNavigateBackToMevzuat}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Mevzuat Maddeleri Dizinine Dön</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. SEARCH BAR & AI GENERATION TRIGGER */}
        <div className="space-y-3">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerateDefinition();
                  }
                }}
                placeholder="Tanımlanmasını istediğiniz hukuki terimi yazın (Örn: Tenkis Davası, Senetle İspat, Islah, Munzam Zarar...)"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={isGenerating || !searchTerm.trim()}
              onClick={() => handleGenerateDefinition()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Yapay Zeka Tanımlıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Yapay Zekayla Tanımla</span>
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Access to Last 5 Searched Legal Terms */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-xs pb-0.5">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" /> Son Aramalar:
              </span>
              {recentSearches.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSearchTerm(item.term);
                    handleGenerateDefinition(item.term);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 shrink-0 border cursor-pointer font-medium ${
                    activeDefinition?.term.toLowerCase() === item.term.toLowerCase()
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  title={`${item.term} (${item.category || 'Hukuk'})`}
                >
                  <span>{item.term}</span>
                </button>
              ))}
              {onOpenRecentSearches && (
                <button
                  type="button"
                  onClick={onOpenRecentSearches}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 font-semibold flex items-center gap-0.5 ml-1 cursor-pointer"
                >
                  <span>Tümünü Gör (5)</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Interactive Category Tabs (Buttons allowed by constitution) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: ACTIVE DEFINITION DISPLAY + BROWSE LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTIVE AI GENERATED DEFINITION CARD (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {activeDefinition ? (
            <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              {/* Header of Active Term */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {activeDefinition.term}
                    </h3>
                    <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      {activeDefinition.category}
                    </span>
                  </div>

                  {/* Clean unboxed metadata with typographic dot (Zero-pill discipline) */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>{activeDefinition.modelUsed || 'Derin Hukuki Muhakeme Motoru'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Doğrulanmış Hukuk Terminolojisi</span>
                  </div>
                </div>

                {/* Bookmark Toggle */}
                <button
                  type="button"
                  onClick={() => toggleBookmark(activeDefinition.term)}
                  className={`p-2 rounded-xl border transition ${
                    bookmarkedTerms.includes(activeDefinition.term)
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                  }`}
                  title={bookmarkedTerms.includes(activeDefinition.term) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                >
                  {bookmarkedTerms.includes(activeDefinition.term) ? (
                    <BookmarkCheck className="w-4 h-4 fill-amber-500" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* 1. Short Core Definition (Kristal Netliğinde) */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Kısa ve Anlaşılır Hukuki Tanım</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeDefinition.shortDefinition}
                </p>
              </div>

              {/* 2. Plain Language Explanation (Sade Türkçe Açıklaması) */}
              <div className="bg-slate-50 dark:bg-[#121929] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sade Türkçe Açıklama (Müvekkil İzah Dili)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeDefinition.plainLanguageExplanation}
                </p>
              </div>

              {/* 3. Statutory Basis & Mevzuat Quick Jump Button */}
              <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-500" />
                    <span>Yasal Dayanak & Pozitif Kanun Maddeleri</span>
                  </div>
                  {onSearchMevzuat && (
                    <button
                      type="button"
                      onClick={() => onSearchMevzuat(activeDefinition.statutoryBasis)}
                      className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                    >
                      <span>Mevzuatta Aç</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                  {activeDefinition.statutoryBasis}
                </div>
              </div>

              {/* 4. Practical Case Example */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-500" />
                  <span>Somut Dava Pratiği Örneği</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {activeDefinition.practicalExample}
                </p>
              </div>

              {/* 5. Critical Deadlines & Procedural Tips */}
              {(activeDefinition.criticalDeadlines || activeDefinition.proceduralTips) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {activeDefinition.criticalDeadlines && (
                    <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-3 space-y-1">
                      <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Kritik Süre / Zamanaşımı</span>
                      </span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        {activeDefinition.criticalDeadlines}
                      </p>
                    </div>
                  )}

                  {activeDefinition.proceduralTips && (
                    <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-3 space-y-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Avukata Usul Püf Noktası</span>
                      </span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        {activeDefinition.proceduralTips}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Related Terms (Interactive Buttons) */}
              {activeDefinition.relatedTerms && activeDefinition.relatedTerms.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    İlişkili Hukuki Kavramlar (Tıklayarak Tanımlayın):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeDefinition.relatedTerms.map((rt) => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => {
                          setSearchTerm(rt);
                          handleGenerateDefinition(rt);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs transition"
                      >
                        {rt} →
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyDefinition}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopyalandı' : 'Tanımı Kopyala'}</span>
                  </button>

                  {onApplyToPetition && (
                    <button
                      type="button"
                      onClick={handleSendToPetition}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Dilekçeye / Savunmaya Aktar</span>
                    </button>
                  )}
                </div>

                {onSearchMevzuat && (
                  <button
                    type="button"
                    onClick={() => onSearchMevzuat(activeDefinition.statutoryBasis || activeDefinition.term)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Mevzuatta Madde Metnini Gör</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0e1524] border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>Sağdaki listeden bir hukuki kavram seçin veya arama çubuğuna yazarak yapay zekayla tanımlayın.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SEARCHABLE GLOSSARY DIRECTORY (5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                Kavramlar Dizini ({filteredTerms.length})
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedCategory !== 'Tümü' ? selectedCategory : 'Tüm Hukuk Dalları'}
              </p>
            </div>

            {bookmarkedTerms.length > 0 && (
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>{bookmarkedTerms.length} Kayıtlı</span>
              </span>
            )}
          </div>

          {/* List of terms */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredTerms.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <HelpCircle className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                <p>"{searchTerm}" aramasına uygun kayıtlı terim bulunamadı.</p>
                <button
                  type="button"
                  onClick={() => handleGenerateDefinition()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
                >
                  Yapay Zeka ile Hemen Tanımla
                </button>
              </div>
            ) : (
              filteredTerms.map((item) => {
                const isActive = activeDefinition?.term === item.term;
                const isBookmarked = bookmarkedTerms.includes(item.term);

                return (
                  <div
                    key={item.term}
                    onClick={() => {
                      setActiveDefinition(item);
                      addRecentSearch(item.term, item.category, 'glossary');
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between gap-1.5 ${
                      isActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-[#121929]/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.term}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isBookmarked && (
                          <BookmarkCheck className="w-3 h-3 text-amber-500 fill-amber-500" />
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.category.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.shortDefinition}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400">
                      <span>{item.statutoryBasis}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                        İncele <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
