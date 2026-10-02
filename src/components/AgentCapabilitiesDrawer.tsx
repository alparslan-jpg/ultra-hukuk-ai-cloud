import React, { useState } from 'react';
import {
  Brain, Scale, Shield, Swords, FileText, Search, Zap,
  Gavel, FolderOpen, ArrowRight, ChevronUp, ChevronDown, X,
  Maximize2, Minimize2, Sparkles, Cpu, Layers, CheckCircle2,
  AlertTriangle, BookOpen, Mic, FileCheck2, Timer, ClipboardCheck,
  UserCheck, Hash, ExternalLink, Network, GitBranch, ArrowUpRight
} from 'lucide-react';

export interface AgentInfo {
  id: string;
  name: string;
  badge: string;
  model: string;
  description: string;
  skills: string[];
  legalBasis: string[];
  inputSource: string;
  outputTarget: string;
  pageTarget: 'home' | 'forensic' | 'analyzer' | 'petitions' | 'legislation' | 'workspace_full' | 'buro_yonetimi' | 'dava_simulasyonu';
  tabTarget?: string;
  color: string;
}

export interface AgentGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badgeColor: string;
  summary: string;
  workflowChain: string;
  agents: AgentInfo[];
}

export const AGENT_GROUPS: AgentGroup[] = [
  {
    id: 'grup-1',
    title: '1. Strateji & Orkestrasyon Grubu',
    subtitle: 'Yüksek Komuta, Çoklu Model Orkestrasyonu & Dava Yönetimi',
    icon: Brain,
    color: 'from-indigo-600 to-violet-700',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    summary: 'Dava dosyasını en üst düzeyde sevk ve idare eden, arka plandaki tüm uzman ajanları koordine edip nihai hukuki teşhisi, yol haritasını ve kazanma ihtimalini belirleyen ana karar organıdır.',
    workflowChain: 'Evrak Girdisi ➔ Dava Derin Analiz ➔ Uzman Ajan Dağıtımı ➔ Baş Hukuk Müşaviri Sentezi ➔ Stratejik Brifing',
    agents: [
      {
        id: 'bas-musavir',
        name: 'Baş Hukuk Müşaviri (Supreme Legal Orchestrator)',
        badge: 'Yüksek Karar Organı',
        model: 'Gemini 3.1 Pro (Derin Akıl)',
        description: 'Tüm dava kurgusunu, görevli/yetkili mahkemeyi, zorunlu arabuluculuk şartını ve 4 uzman ajanın tespitlerini tek bir nihai hüküm çatısı altında konsolide eder.',
        skills: [
          '4 uzman ajanın (Usul, Emsal, Şeytanın Avukatı, Dilekçe) raporlarını çapraz sentezleme',
          'Görevli ve yetkili mahkemeyi kesin tayin etme (HMK m. 1-4)',
          'Davanın sayısal kazanma ihtimalini (% oran) ve risk seviyesini çıkarma',
          'Avukata nihai stratejik eylem planı ve tensip öncesi adımları sunma'
        ],
        legalBasis: ['HMK m. 1-4 (Görev ve Yetki)', 'HMK m. 114-115 (Dava Şartları)', '1136 S.K. m. 34 (Özen Yükümü)', 'Anayasa m. 36'],
        inputSource: 'Tüm dava evrakları, tanık beyanları ve 4 uzman ajanın alt analizleri',
        outputTarget: 'Yönetici Özeti, Nihai Hukuki Teşhis, Yol Haritası ve Duruşma Stratejisi',
        pageTarget: 'home',
        color: 'indigo'
      },
      {
        id: 'derin-analiz',
        name: 'Dava Derin Analiz Ajanı (Flash & Pro Engine)',
        badge: 'Çok Katmanlı Muhakeme',
        model: 'Gemini 3.1 Pro & 3.8 Flash Hibrit',
        description: 'Yüklenen tüm dava evraklarını tek tek ve bir bütünlük içinde tarar. Hızlı modda acil harita, Derin Akıl modunda ise mikroskobik delil ve süre denetimi yürütür.',
        skills: [
          'Yüklenen evrakları tek tek ayıklayıp maddi vakıa kronolojisi çıkarma',
          'HMK m. 200 senetle ispat sınırı ve istisnalarını denetleme',
          '5 ayrı uzmanlık alanında (Usul, Emsal, Risk, Dilekçe, Müşavir) bağımsız sekme üretme',
          'Dosyadaki zamanaşımı ve hak düşürücü süre tuzaklarını listeleme'
        ],
        legalBasis: ['HMK m. 199-200 (Senet Kuralı)', 'TBK m. 1-20 (Sözleşme Kurgusu)', 'TTK m. 18-21 (Ticari Karine)'],
        inputSource: 'PDF, UDF, Word ve taranmış adli dava dosyaları',
        outputTarget: '5 Sekmeli Konsültasyon Raporu & Baş Müşavir Veri Tabanı',
        pageTarget: 'analyzer',
        color: 'purple'
      },
      {
        id: 'stratejik-brifing',
        name: 'Stratejik Dava Brifingi Ajanı',
        badge: 'Yönetici & Müvekkil Raporu',
        model: 'Gemini 3.8 Flash',
        description: 'Yüzlerce sayfalık dava klasörlerini 2 dakikalık yönetici brifingine, müvekkil bilgilendirme notuna ve avukat duruşma cep kartına dönüştürür.',
        skills: [
          'Davanın kilit kırılma noktalarını maddeleştirme',
          'Müvekkilin anlayacağı dilde hak ve alacak tablosu hazırlama',
          'Duruşma öncesi hâkime sunulacak 1 sayfalık özet beyan çıkarma'
        ],
        legalBasis: ['HMK m. 30 (Usul Ekonomisi İlkesi)', 'Avukatlık Asgari Ücret Tarifesi (AAÜT)'],
        inputSource: 'Dava dosya özeti ve Baş Hukuk Müşaviri kararı',
        outputTarget: 'Yönetici Brifing Kartı & Müvekkil Raporu',
        pageTarget: 'workspace_full',
        tabTarget: 'briefing',
        color: 'blue'
      }
    ]
  },
  {
    id: 'grup-2',
    title: '2. Usul, Süre & Mevzuat Kalkanı Grubu',
    subtitle: 'HMK Dava Şartları, Hak Düşürücü Süreler & Mevzuat Zırhı',
    icon: Shield,
    color: 'from-amber-600 to-orange-700',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    summary: 'Davanın esasına girilmeden önce usuli bir hatayla (görev, yetki, hak düşürücü süre, eksik harç, zorunlu arabuluculuk) reddedilmesini önleyen mutlak savunma kalkanıdır.',
    workflowChain: 'Dava Açılış / Tebliğ Tarihi ➔ 35 Usul Denetimi ➔ Zamanaşımı / Faiz Hesabı ➔ Mevzuat Atıf Doğrulama ➔ Usul Defileri',
    agents: [
      {
        id: 'usul-sure-ajani',
        name: '1. Usul & Süre Ajanı',
        badge: 'HMK Usul Muhafızı',
        model: 'Gemini 3.1 Pro',
        description: 'Davanın açıldığı mahkemenin görev ve yetkisini, zorunlu dava şartı arabuluculuk sürecini ve ilk itirazları saniye saniye denetler.',
        skills: [
          'HMK m. 114 Dava şartlarını (gider avansı, vekâletname, taraf ehliyeti) kontrol etme',
          'Zorunlu arabuluculuk son tutanak tarihini ve dava açma süresini doğrulama',
          'Yetki sözleşmesi ve kesin yetki kurallarını (HMK m. 6-19) test etme'
        ],
        legalBasis: ['HMK m. 114-115 (Dava Şartları)', 'HMK m. 116 (İlk İtirazlar)', '6325 S.K. m. 18/A (Zorunlu Arabuluculuk)'],
        inputSource: 'Dava dilekçesi, tensip zaptı ve arabuluculuk son tutanağı',
        outputTarget: 'İlk İtiraz Layihası & Usul Eksiklikleri Tablosu',
        pageTarget: 'home',
        color: 'amber'
      },
      {
        id: 'otuzbes-usul',
        name: '35 Noktalı Usul Denetim Ajanı',
        badge: 'Kapsamlı Usul Check-Up',
        model: 'Gemini 3.1 Pro',
        description: 'Yargıtay bozma kararlarına konu olan 35 kritik usuli prosedürü tek tek tarayarak davanın usulden bozulma riskini sıfıra indirir.',
        skills: [
          'Husumet, hukuki yarar ve derdestlik itirazlarını tarama',
          'Savunmanın ve iddianın genişletilmesi yasağının (HMK 141) başladığı anı yakalama',
          'Tebligat Kanunu m. 21 ve m. 35 usulsüz tebligat itirazlarını belirleme'
        ],
        legalBasis: ['HMK m. 119-142', '7201 Sayılı Tebligat Kanunu', '492 Sayılı Harçlar Kanunu'],
        inputSource: 'Dava tensip zaptı, tebliğ mazbataları ve cevap dilekçeleri',
        outputTarget: '35 Maddelik Usul Uygunluk Sertifikası',
        pageTarget: 'workspace_full',
        tabTarget: 'procedural_check',
        color: 'violet'
      },
      {
        id: 'zamanasimi-faiz',
        name: 'Zamanaşımı & Faiz Hesaplama Motoru',
        badge: 'Kronometrik Süre Sayacı',
        model: 'Deterministik Hukuk Algoritması + AI',
        description: 'TBK, TTK ve İİK zamanaşımı sürelerini gün hesabı yaparak inceler; yasal, ticari avans ve reeskont faizlerini kademeli olarak hesaplar.',
        skills: [
          'Haksız fiil (2/10 yıl), sözleşme (10 yıl), kira (5 yıl), kambiyo (3 yıl) zamanaşımı kontrolü',
          'Zamanaşımını kesen ve durduran sebepleri (TBK m. 153-154) tespit etme',
          'Temerrüt tarihinden itibaren kademeli yasal/avans faiz ve munzam zarar hesabı'
        ],
        legalBasis: ['TBK m. 146-161 (Zamanaşımı)', 'TBK m. 117-122 (Temerrüt & Faiz)', '3095 Sayılı Kanuni Faiz Kanunu'],
        inputSource: 'Olay tarihi, ihtarname tebliğ şerhi, dava açılış tarihi ve alacak miktarı',
        outputTarget: 'Zamanaşımı Defi Argümanı & Ayrıntılı Faiz Raporu',
        pageTarget: 'workspace_full',
        tabTarget: 'temporal',
        color: 'orange'
      },
      {
        id: 'mevzuat-capraz',
        name: 'Mevzuat Çapraz Doğrulama & Atıf Denetçisi',
        badge: 'Yürürlük ve İptal Radarı',
        model: 'Gemini 3.8 Flash + Mevzuat DB',
        description: 'Dilekçelerde yer alan kanun maddelerinin yürürlükte olup olmadığını, AYM tarafından iptal edilip edilmediğini anlık denetler.',
        skills: [
          'Dilekçedeki kanun atıflarını Resmi Gazete ve Mevzuat Bilgi Sistemi ile eşleştirme',
          'Mülga kanun (818 BK, 6762 TTK, 1086 HUMK) geçiş hükümlerini tespit etme',
          'Anayasa Mahkemesi iptal kararlarının somut uyuşmazlığa etkisini belirtme'
        ],
        legalBasis: ['T.C. Mevzuat Bilgi Sistemi', 'Anayasa Mahkemesi Kararları', 'Resmi Gazete Arşivi'],
        inputSource: 'Hazırlanan dilekçe taslakları ve savunma metinleri',
        outputTarget: 'Doğrulanmış Kanun Maddeleri ve Yürürlük Onay Raporu',
        pageTarget: 'legislation',
        color: 'lime'
      }
    ]
  },
  {
    id: 'grup-3',
    title: '3. Adli Delil, Cımbız & Harp Odası Grubu',
    subtitle: 'Tahkikat, Yalan Tanık Avı, Çelişki Cımbızı & Karşı Taarruz',
    icon: Swords,
    color: 'from-rose-600 to-red-700',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    summary: 'Dosyadaki delilleri mikroskobik düzeyde didik didik eden, gizli tapu şerhlerini cımbızla çeken, yalan tanıkları yakalayan ve karşı tarafın saldırılarına panzehir üreten savaş odasıdır.',
    workflowChain: 'Belge & Tutanak İncelemesi ➔ Cımbız Altın Detay Avı ➔ Şeytanın Avukatı Zafiyet Taraması ➔ Bilirkişi Rapor Denetimi ➔ Duruşma Çapraz Sorgusu',
    agents: [
      {
        id: 'cimbiz-ajani',
        name: 'Adli Hakikat & Cımbız Ajanı',
        badge: 'Davayı Kazandıran Altın Detay',
        model: 'Gemini 3.1 Pro (Mikroskobik Denetim)',
        description: 'Yüzlerce sayfa arasına gizlenmiş, davanın seyrini lehe çevirecek en kritik delili (Örn: Tapudaki "Davalıdır" şerhi, imza çelişkisi, sahtelik) cımbızla çeker.',
        skills: [
          'Davanın kaderini değiştirecek "Altın Ayrıntıyı" ve kanun maddesini bulma',
          'TCK m. 272 yalan tanıklık şüphelerini ve ezberletilmiş yönlendirme kalıplarını deşifre etme',
          'Belgeler arasındaki tarih, miktar ve imza uyumsuzluklarını yakalama',
          'TMK m. 1023 iyiniyet kalkanını çökerten tapu tedavül kayıtlarını çıkarma'
        ],
        legalBasis: ['TCK m. 272 (Yalan Tanıklık)', 'HMK m. 255 (Tanık İfadesinin Değeri)', 'TMK m. 1023 (Tapu Kütüğüne Güven)', 'HMK m. 208 (Sahtelik İncelemesi)'],
        inputSource: 'Tapu kayıtları, keşif tutanakları, tanık zabıtları ve resmi kurum müzekkereleri',
        outputTarget: 'Cımbız Altın Detay Raporu & Savcılık Suç Duyurusu Gerekçesi',
        pageTarget: 'forensic',
        color: 'rose'
      },
      {
        id: 'seytanin-avukati',
        name: '3. Şeytanın Avukatı (Harp Odası)',
        badge: 'Karşı Taraf Zihniyeti & Panzehir',
        model: 'Gemini 3.1 Pro (Taktiksel Harp)',
        description: 'Karşı tarafın en yırtıcı avukatı rolüne bürünerek dosyaya saldırır; en zayıf delillerimizi açığa çıkarır ve bunların panzehir savunmasını inşa eder.',
        skills: [
          'Karşı tarafın sunabileceği en tehlikeli savunma ve defileri simüle etme',
          'Müvekkil iddialarındaki ispat zafiyetlerini ve çelişkileri önceden tespit etme',
          'Davanın esastan veya usulden reddedilme risklerine karşı kalkan üretme'
        ],
        legalBasis: ['HMK m. 190 (İspat Yükü)', 'TMK m. 6 (İspat Kuralı)', 'HMK m. 200 (Senet Kuralı)', 'HMK m. 128'],
        inputSource: 'Müvekkil beyanı, delil listesi ve dava konusu uyuşmazlık metinleri',
        outputTarget: 'Karşı Savunma Tehdit Haritası & Panzehir Savunma Kurgusu',
        pageTarget: 'workspace_full',
        tabTarget: 'devils',
        color: 'red'
      },
      {
        id: 'bilirkisi-lab',
        name: 'Bilirkişi İtiraz Laboratuvarı (HMK 281)',
        badge: 'Rapor ve Kusur Denetçisi',
        model: 'Gemini 3.1 Pro',
        description: 'Bilirkişi raporlarındaki maddi hataları, eksik araştırmayı, yetki aşımını (hukuki tavsiyede bulunma) yakalar ve 2 haftalık itiraz dilekçesini hazırlar.',
        skills: [
          'Bilirkişinin yetki sınırını aşıp hâkim yerine hukuki niteleme yaptığını saptama',
          'Hesaplama ve metraj tablolarındaki aritmetik çelişkileri ortaya çıkarma',
          'Ek rapor ve yeni bilirkişi heyeti oluşturulması için gerekçeli itiraz yazma'
        ],
        legalBasis: ['HMK m. 266-287 (Bilirkişi İncelemesi)', 'HMK m. 281 (Rapora İtiraz ve 2 Haftalık Kesin Süre)'],
        inputSource: 'Bilirkişi raporu, ek raporlar ve dosyadaki delil listesi',
        outputTarget: 'HMK 281 Kapsamında Ayrıntılı Bilirkişi Raporuna İtiraz Layihası',
        pageTarget: 'workspace_full',
        tabTarget: 'expert_audit',
        color: 'pink'
      },
      {
        id: 'durusma-stratejisi',
        name: 'Duruşma Stratejisi & Çapraz Sorgu Simülatörü',
        badge: 'Duruşma Salonu Taktisyeni',
        model: 'Gemini 3.1 Pro',
        description: 'Duruşmada hâkime yapılacak sözlü açıklamaları, karşı taraf tanıklarına sorulacak HMK 152 çapraz sorgu sorularını kronolojik olarak hazırlar.',
        skills: [
          'HMK m. 152 doğrudan soru sorma hakkı kapsamında tanıkları köşeye sıkıştıracak sorular',
          'Hâkime duruşma zaptına geçirtilecek "sözlü beyan" ve itiraz cümleleri',
          'Duruşma günü dikkat edilecek usul kuralları ve süre tutum adımları'
        ],
        legalBasis: ['HMK m. 152 (Doğrudan Soru Yöneltme)', 'HMK m. 240-265 (Tanık Dinleme Usulü)'],
        inputSource: 'Tanık listeleri, tanık beyanları ve cımbız çelişki raporu',
        outputTarget: 'Çapraz Sorgu Soru Listesi & Duruşma Taktik Rehberi',
        pageTarget: 'workspace_full',
        tabTarget: 'hearing',
        color: 'amber'
      }
    ]
  },
  {
    id: 'grup-4',
    title: '4. Dilekçe, Emsal & UYAP Üretim Grubu',
    subtitle: 'Resmi Dilekçe Mimarisi, Netice-i Talep, Tensip Talepleri & İçtihatlar',
    icon: FileText,
    color: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    summary: 'Tüm analizleri, delilleri, usul kurallarını ve emsal içtihatları hâkimin önüne gidecek resmi UYAP dilekçelerine, netice-i talep fıkralarına ve müzekkere taleplerine dönüştüren üretim fabrikasıdır.',
    workflowChain: 'Usul + Cımbız + Emsal Verileri ➔ UYAP Dilekçe Şablonu ➔ Stratejik Dilekçe Motoru ➔ APA Dipnotlu Emsal Karar Ekleme ➔ UYAP XML / UDF Çıktısı',
    agents: [
      {
        id: 'dilekce-mimari',
        name: '4. Dilekçe Mimarı (UYAP Dilekçe Lab)',
        badge: 'Resmi Yargı Metin İnşası',
        model: 'Gemini 3.1 Pro (Dilekçe Mühendisliği)',
        description: 'HMK m. 119 standartlarına birebir uygun dava, cevap ve beyan dilekçeleri yazar. Netice-i Talep fıkrasını ve tensip müzekkere taleplerini kusursuz kurar.',
        skills: [
          'Mahkeme, taraf ve konu bilgilerini hatasız yerleştirme',
          'Vakıaları delillerle eşleştirerek (APA / parantez içi formatında) yazma',
          'Terditli (kademeli) talepleri usulüne uygun formüle etme',
          'Tensip zaptında talep edilecek resmi kurum müzekkerelerini (Tapu, Banka, SGK) sıralama'
        ],
        legalBasis: ['HMK m. 119 (Dava Dilekçesi Zorunlu Unsurları)', 'HMK m. 121 (Delillerin Eklenmesi)', 'UYAP UDF Doküman Standartları'],
        inputSource: 'Vakıa özeti, delil listesi, taraf bilgileri ve dosya numarası',
        outputTarget: 'Tam Metin UYAP Uyumlu Dava / Cevap Dilekçesi',
        pageTarget: 'petitions',
        color: 'emerald'
      },
      {
        id: 'stratejik-dilekce-motoru',
        name: 'Stratejik Dilekçe Motoru (Cımbız Entegreli)',
        badge: 'Yönetici Özeti & Dipnotlu İleri Dilekçe',
        model: 'Gemini 3.1 Pro (Büyük Hukuki Muhakeme)',
        description: 'Cımbız Ajanı ve Ajan Konseyi içgörüleriyle beslenen; Yönetici Özeti, Usul Bertarafı, Müktesep Hak ve Akademik/İçtihat Dipnotları içeren dev dilekçeler üretir.',
        skills: [
          'Dilekçenin başına hâkimin 1 dakikada kavrayacağı "Yönetici Özeti" ekleme',
          'Karşı tarafın zamanaşımı ve yetki itirazlarını "Usul Hukuku İtirazlarının Bertarafı" başlığında çürütme',
          'Emsal kararları doktrin görüşleri ve internet bağlantı linkleriyle dipnotlara bağlama',
          'Taşınmaz ve tapu davalarında imar-ihya ve zilyetlik zincirini (TMK m. 996) kurma'
        ],
        legalBasis: ['TMK m. 713 & 996 (Zilyetlik & Tescil)', 'TMK m. 1023', 'HMK m. 119', '3402 Sayılı Kadastro Kanunu'],
        inputSource: 'Cımbız analiz çıktısı, tedavül kayıtları ve bilirkişi raporları',
        outputTarget: 'Profesyonel Ağır Ceza / Asliye Hukuk Stratejik Savunma & Dava Metni',
        pageTarget: 'forensic',
        color: 'teal'
      },
      {
        id: 'yargitay-emsal',
        name: '2. Yargıtay Emsal Karar Ajanı',
        badge: 'HGK, Daire ve BAM İlke Kararları',
        model: 'Gemini 3.1 Pro + Yargıtay DB',
        description: 'Yargıtay Hukuk Genel Kurulu, Ceza Genel Kurulu, ilgili Daireler ve BAM ilke kararlarını tarar; doktrinde atıf alan güncel içtihatları linkleriyle sunar.',
        skills: [
          'Somut uyuşmazlığa birebir uyan güncel HGK ve Daire kararlarını çıkarma',
          'Lehe ve aleyhe olan içtihat farklılıklarını (İçtihatları Birleştirme) analiz etme',
          'Emsal kararları internet bağlantı adresi ve kaynak künyesiyle dilekçeye entegre etme'
        ],
        legalBasis: ['2797 Sayılı Yargıtay Kanunu m. 15 & 45', 'HMK m. 353 (BAM İstinaf)', 'HMK m. 369 (Temyiz)'],
        inputSource: 'Uyuşmazlık konusu, hukuki niteleme ve aranan konu başlığı',
        outputTarget: 'Gerekçeli Emsal Karar Listesi & APA Formatlı Dipnot Linkleri',
        pageTarget: 'workspace_full',
        tabTarget: 'precedent',
        color: 'yellow'
      }
    ]
  },
  {
    id: 'grup-5',
    title: '5. Dijital Adli Veri & Algılama Grubu',
    subtitle: 'Optik Karakter Tanıma (OCR), Adli Ses Çözümleme & Terminoloji',
    icon: Search,
    color: 'from-cyan-600 to-blue-700',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    summary: 'Fiziksel adliyedeki taranmış tutanakları, ses kayıtlarını ve karmaşık hukuk terminolojisini yapay zekanın işleyebileceği dijital ve hukuki formatlara çeviren altyapı grubudur.',
    workflowChain: 'Fiziksel Evrak / Ses ➔ Adli OCR / Ses Dikte ➔ Metin Ayrıştırma ➔ Terminoloji Denetimi ➔ Ajan Havuzuna Veri Aktarımı',
    agents: [
      {
        id: 'adli-ocr',
        name: 'Adli Belge / Evrak Okuma (OCR) Ajanı',
        badge: 'Taranmış Evrak Ayrıştırıcı',
        model: 'Vision Gemini OCR + NLP',
        description: 'Eski tapu kayıtlarını, el yazılı senetleri, silik mahkeme zaptlarını ve taranmış PDF dosyalarını %99 doğrulukla arama yapılabilir hukuki metne dönüştürür.',
        skills: [
          'Çok sayfalı dava evraklarını toplu olarak OCR ile metne çevirme',
          'El yazılı tutanak ve imza şerhlerini çözümleme',
          'Metindeki tarih, yevmiye no, parsel no gibi kritik verileri otomatik etiketleme'
        ],
        legalBasis: ['HMK m. 199 (Belge Niteliği)', 'HMK m. 216 (Belgelerin Asıllarının Sunulması)'],
        inputSource: 'Taranmış PDF, JPG, PNG, TIFF adli belgeler',
        outputTarget: 'Yapılandırılmış Dijital Metin & Dava Derin Analiz Ham Verisi',
        pageTarget: 'analyzer',
        color: 'cyan'
      },
      {
        id: 'sesli-dikte',
        name: 'Adli Sesli Dikte & Duruşma Zaptı Çözücü',
        badge: 'Sesli Hukuk Çözümleme',
        model: 'Adli Ses Tanıma Motoru',
        description: 'Avukatın mikrofona söylediği serbest dava anlatımlarını veya duruşma ses kayıtlarını hukuki terminolojiye uygun adli zabıt formatına dönüştürür.',
        skills: [
          'Hukuki terimleri (derdestlik, ıslah, tenkis, ferağ) bozmadan doğru yazma',
          'Sesli anlatımdan otomatik dava konusu ve talep özeti çıkarma',
          'Duruşma zaptı metni oluşturup UYAP Dilekçe Mimarına aktarma'
        ],
        legalBasis: ['HMK m. 157 (Tahkikatın Ses ve Görüntü ile Kaydı)', 'CMK m. 219 (Duruşma Tutanağı)'],
        inputSource: 'Mikrofon ses akışı, ses dosyaları (MP3, WAV, M4A)',
        outputTarget: 'Adli Tutanak Metni & Hukuki Özet',
        pageTarget: 'workspace_full',
        tabTarget: 'voice_record',
        color: 'rose'
      },
      {
        id: 'sozluk-ajani',
        name: 'Hukuk Terimleri Sözlüğü & Doktrin Ajanı',
        badge: 'Kavram ve Doktrin Ansiklopedisi',
        model: 'Gemini 3.8 Flash + Hukuk Lügati DB',
        description: 'Eski hukuk terimlerini, Osmanlıca kadastro kayıt tabirlerini (gabn, şüf\'a, istihkak) ve Latince ilkeleri güncel Yargıtay uygulamalarıyla açıklar.',
        skills: [
          'Eski tapu ve kadastro terimlerinin güncel Medeni Kanun karşılığını bulma',
          'Latince hukuki aforizmaları (res judicata, pacta sunt servanda vb.) açıklama',
          'Dilekçelerde kullanılacak akademik ve doktrinel tanımları üretme'
        ],
        legalBasis: ['Türk Hukuk Lügati', 'Mukayeseli Hukuk Prensipleri', 'Yargıtay İçtihatları'],
        inputSource: 'Aranan hukuki kavram, terim veya Latince ilke',
        outputTarget: 'Ayrıntılı Kavram Tanımı, Yargıtay Uygulaması & Dilekçe Paragrafı',
        pageTarget: 'legislation',
        color: 'indigo'
      }
    ]
  },
  {
    id: 'grup-6',
    title: '6. Claude Destekli Hibrit & Çoklu Ajan Grubu (İş Emri Standartları)',
    subtitle: 'Anthropic Claude 3.5 Sonnet / Opus, RAG Arama ve Kurumsal Büro Yönetimi',
    icon: Sparkles,
    color: 'from-amber-600 via-orange-600 to-purple-700',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    summary: 'Milyonlarca Yargıtay/Danıştay içtihadı üzerinde semantik RAG arama, Claude 3.5 motoru ile UYAP uyumlu dilekçe sentezi, 3 rollü (Hâkim, Karşı Taraf, Bilirkişi) dava risk simülasyonu ve Apilex tarzı kurumsal büro & finans yönetimi.',
    workflowChain: 'RAG İçtihat Taraması ➔ Claude Derin Muhakeme & Dilekçe ➔ 3 Rol Simülasyonu (Hâkim/Bilirkişi) ➔ Kurumsal Büro & SMM',
    agents: [
      {
        id: 'rag-ictihat-uzmani',
        name: 'Ajan 1: RAG İçtihat ve Mevzuat Arama Uzmanı',
        badge: 'Semantik RAG & Chunking',
        model: 'Embedding + Vektör DB + RAG Engine',
        description: 'Milyonlarca Yargıtay/Danıştay kararı ve güncel mevzuat havuzunda anlamsal (semantik) tarama yaparak en uygun emsal kararları bulur.',
        skills: [
          'Vektörizasyon (embeddings) ve yüksek boyutlu vektör uzayında tarama',
          'Chunking optimizasyonu ile en kritik karar paragraflarını ayıklama',
          'Uyum yüzdesi (relevance score) hesaplayarak en yakın emsalleri sıralama'
        ],
        legalBasis: ['2797 Sayılı Yargıtay Kanunu', 'HMK m. 353 & 369', 'Danıştay Kanunu'],
        inputSource: 'Dava vakıaları, hukuki kavramlar ve uyuşmazlık özeti',
        outputTarget: 'Alakalı Emsal Karar Listesi, İlgili Karar Numaraları ve Uyum Puanları',
        pageTarget: 'legislation',
        tabTarget: 'precedent',
        color: 'yellow'
      },
      {
        id: 'claude-dilekce-asistani',
        name: 'Ajan 2: Claude-Powered Hukuki Muhakeme ve Dilekçe Sentezleme Asistanı',
        badge: 'Claude 3.5 Sonnet / Opus',
        model: 'Anthropic Claude 3.5 Sonnet & Claude 3 Opus',
        description: 'Toplanan emsal kararları, dava dosyalarını ve delilleri harmanlayarak UYAP/UDF formatına tam uyumlu, ikna edici ve hatasız dilekçe taslakları üretir.',
        skills: [
          'Geniş bağlam penceresiyle yüzlerce sayfalık bilirkişi raporlarını analiz etme',
          'Ton ve üslup yönetimi (savunma, itiraz, temyiz, istinaf layihası)',
          'Atıf doğrulama ve uydurma (hallucination) önleme filtresi',
          'UYAP/UDF standartlarına tam uyumlu dava ve cevap dilekçesi kurgulama'
        ],
        legalBasis: ['HMK m. 119 (Dava Dilekçesi)', 'HMK m. 126-130 (Cevap Dilekçesi)', '1136 S.K. m. 34'],
        inputSource: 'Emsal kararlar, dava vakıaları, delil listesi ve mahkeme bilgisi',
        outputTarget: 'Kusursuz UYAP/UDF Dilekçe Taslağı ve Hukuki Gerekçeler',
        pageTarget: 'petitions',
        color: 'purple'
      },
      {
        id: 'multi-agent-simulasyon',
        name: 'Ajan 3: Multi-Agent Dava Simülasyon Grubu (Rol Tabanlı Danışmanlık)',
        badge: '3-Perspektif Risk Testi',
        model: 'Claude 3.5 Sonnet (Hâkim, Karşı Taraf, Bilirkişi)',
        description: 'Bir davanın zayıf ve güçlü yönlerini farklı yargı perspektiflerinden test eder: Taraf Avukatı, Hâkim/Savcı ve Bilirkişi.',
        skills: [
          'Taraf Avukatı Ajanı: Agresif savunma ve lehte argüman üretimi',
          'Hâkim / Savcı Ajanı: Karşı tarafın argümanlarını çürütme ve risk analizi',
          'Bilirkişi Ajanı: Teknik ve finansal hesaplama tutarlılığını denetleme',
          'Stratejik Tavsiye: Avukatın kazanma şansını artıracak somut aksiyonlar'
        ],
        legalBasis: ['HMK m. 27 (Hukuki Dinlenilme Hakkı)', 'HMK m. 266-287 (Bilirkişi İncelemesi)', 'HMK m. 114-115'],
        inputSource: 'Dava konusu, taraflar, vakıalar ve deliller',
        outputTarget: 'Risk Raporu, Zayıf Noktalar, Muhtemel Hamleler ve Kazanma Oranı',
        pageTarget: 'dava_simulasyonu',
        color: 'rose'
      },
      {
        id: 'kurumsal-buro-finans',
        name: 'Ajan 4: Apilex Kurumsal Büro Yönetimi & Finans Ajanı',
        badge: 'Finans, CRM & RBAC',
        model: 'Kural Tabanlı Muhakeme & Hesaplama Motoru',
        description: 'Büronun finansal akışını, müvekkil portföyünü, celse ve safahat ajandasını yönetir; serbest meslek makbuzu ve stopaj/tevkifat hesaplamalarını yürütür.',
        skills: [
          'Gelir, gider, dosya masrafı ve müvekkil avans hesaplarını yönetme',
          'Müvekkil CRM havuzunda sözleşme ve bakiye takibi yapma',
          'UYAP duruşma ve hak düşürücü süre ajandasını izleme',
          'SMM, KDV tevkifatı (5/10, 9/10) ve stopaj hesaplama',
          'RBAC ile yönetici ve bağlı avukat yetkilendirmesi sağlama'
        ],
        legalBasis: ['1136 Sayılı Avukatlık Kanunu', '193 Sayılı GVK m. 65-68', '3065 Sayılı KDVK m. 9'],
        inputSource: 'Vekalet sözleşmeleri, serbest meslek makbuzları, dava safahatları',
        outputTarget: 'Kasa Raporu, Müvekkil Cari Bakiye, Celse Ajandası ve SMM Taslağı',
        pageTarget: 'buro_yonetimi',
        color: 'emerald'
      }
    ]
  }
];
interface AgentCapabilitiesDrawerProps {
  onNavigateToPage?: (page: 'home' | 'forensic' | 'analyzer' | 'petitions' | 'legislation' | 'apk_download' | 'workspace_full' | 'buro_yonetimi' | 'dava_simulasyonu') => void;
  onNavigateToTab?: (tab: string) => void;
}

export function AgentCapabilitiesDrawer({ onNavigateToPage, onNavigateToTab }: AgentCapabilitiesDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grup-1');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const selectedGroup = AGENT_GROUPS.find(g => g.id === selectedGroupId) || AGENT_GROUPS[0];

  const handleLaunchAgent = (agent: AgentInfo) => {
    if (onNavigateToPage) {
      onNavigateToPage(agent.pageTarget);
    }
    if (agent.tabTarget && onNavigateToTab) {
      onNavigateToTab(agent.tabTarget);
    }
    // Close or keep open based on preference
    setIsOpen(false);
  };

  return (
    <>
      {/* ── 1. BOTTOM DOCK (HER ZAMAN GÖRÜNÜR SABİT ALT BAR) ── */}
      <aside aria-label="Ajan Konseyi ve Yetenekler Menüsü" className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
          
          {/* Sol: Ana Başlık & Açılır Pencere Tetikleyici Buton */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition transform active:scale-95 cursor-pointer"
              title="Ajan Becerileri & Bağlantı Matrisi Açılır Penceresini Aç"
            >
              <Brain className="w-4 h-4 animate-pulse text-amber-300" />
              <span className="hidden sm:inline">Ajan Konseyi & Beceriler Matrisi</span>
              <span className="sm:hidden font-extrabold">Ajan Matrisi</span>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 ml-0.5 text-indigo-200" />
              ) : (
                <ChevronUp className="w-4 h-4 ml-0.5 text-indigo-200" />
              )}
            </button>

            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>5 Ana Grup · 17 Uzman Ajan</span>
            </span>
          </div>

          {/* Orta / Sağ: 5 Grup Butonu (Tıklanınca doğrudan o grubun penceresini açar) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 custom-scrollbar">
            {AGENT_GROUPS.map((grp) => {
              const Icon = grp.icon;
              const isSelected = isOpen && selectedGroupId === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(grp.id);
                    setIsOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-400 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-500/30 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                  title={grp.subtitle}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  <span className="hidden lg:inline">{grp.title.split('.')[1]?.trim()}</span>
                  <span className="lg:hidden">{grp.title.split('&')[0]?.replace(/^\d+\.\s*/, '')}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-slate-600 dark:text-slate-300">
                    {grp.agents.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sağ: Pencereyi Kapat/Aç */}
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition shrink-0"
            title={isOpen ? 'Paneli Kapat' : 'Paneli Genişlet'}
          >
            {isOpen ? <X className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ── 2. EXPANDABLE BOTTOM SHEET / MODAL PENCERE ── */}
      {isOpen && (
        <section
          aria-label="Ajan Konseyi ve Yapay Zeka Beceri Matrisi Paneli"
          className={`fixed left-0 right-0 bottom-12 z-35 bg-white dark:bg-[#0b101c] border-t-2 border-indigo-500/50 shadow-2xl transition-all duration-300 flex flex-col backdrop-blur-xl ${
            isMaximized
              ? 'top-14 h-[calc(100vh-80px)]'
              : 'max-h-[82vh] h-[680px]'
          }`}
        >
          {/* Pencere Üst Barı (Header) */}
          <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0e1526]/90 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                  <span>Yapay Zeka & Ajan Konseyi Beceri & Bağlantı Matrisi</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 hidden md:inline">
                    17 Ajan Aktif
                  </span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate hidden sm:block">
                  Ajanların uzmanlıkları, işlettikleri kanun normları ve birbirlerine aktardıkları veri akış hatları
                </p>
              </div>
            </div>

            {/* Pencere Kontrolleri (Büyüt, Küçült, Kapat) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsMaximized(p => !p)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                title={isMaximized ? 'Varsayılan Boyut' : 'Tam Ekran'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Pencereyi Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 5 Grup Sekme Çubuğu */}
          <div className="shrink-0 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] flex gap-2 overflow-x-auto custom-scrollbar">
            {AGENT_GROUPS.map((grp) => {
              const Icon = grp.icon;
              const isSelected = selectedGroupId === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(grp.id);
                    setSelectedAgentId(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{grp.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                    {grp.agents.length} Ajan
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ana Gövde (Scroll Edilebilir Detay ve Bağlantı Alanı) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-[#080d17]">
            
            {/* GRUP VİZYON KARTI & İLİŞKİ ZİNCİRİ (WORKFLOW PIPELINE) */}
            <div className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 ${selectedGroup.badgeColor}`}>
                    <selectedGroup.icon className="w-3.5 h-3.5" />
                    {selectedGroup.subtitle}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedGroup.title}
                  </h3>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Toplam {selectedGroup.agents.length} Uzman Ajan Bu Grupta Görevli
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedGroup.summary}
              </p>

              {/* BİRBİRLERİ İLE BAĞLANTI ZİNCİRİ (PIPELINE) */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Ajanlar Arası Otomatik Veri & Görev Akış Zinciri</span>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selectedGroup.workflowChain.split('➔').map((step, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#121c32] border border-indigo-200 dark:border-indigo-800/80 shadow-xs flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{step.trim()}</span>
                      </span>
                      {idx < arr.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* GRUPTAKİ AJANLARIN LİSTESİ VE BECERİLERİ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Grup Bünyesindeki Ajanlar ve Yetenek Kartları</span>
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Bir ajana tıklayarak doğrudan ilgili modüle gidebilirsiniz
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedGroup.agents.map((agent) => {
                  return (
                    <div
                      key={agent.id}
                      className="bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600/70 transition flex flex-col justify-between"
                    >
                      {/* Üst Başlık & Model Rozeti */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wide inline-block mb-1">
                              {agent.badge}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {agent.name}
                            </h5>
                          </div>

                          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-indigo-500" />
                            {agent.model}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {agent.description}
                        </p>
                      </div>

                      {/* Beceriler Listesi */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                          Temel Hukuki Becerileri (Skills):
                        </span>
                        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {agent.skills.map((skill, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{skill}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* İşlettiği Hukuki Normlar & Maddeler */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1">
                          <Scale className="w-3 h-3 text-amber-500" />
                          <span>İşlettiği Hukuk Normları:</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {agent.legalBasis.map((norm, nIdx) => (
                            <span
                              key={nIdx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                            >
                              {norm}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Girdi & Çıktı Bağlantısı (Kiminle Konuşuyor?) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#121c32]/50 p-2.5 rounded-xl">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                            📥 Girdi Verisi:
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium leading-tight block">
                            {agent.inputSource}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase">
                            📤 Kime İletir (Çıktı):
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium leading-tight block">
                            {agent.outputTarget}
                          </span>
                        </div>
                      </div>

                      {/* Alt Aksiyon: Modüle Git / Çalıştır Butonu */}
                      <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Hedef: <strong className="text-slate-700 dark:text-slate-300">{agent.pageTarget.toUpperCase()}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleLaunchAgent(agent)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                        >
                          <span>Bu Ajanı Çalıştır</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TÜM SİSTEM GENEL İLETİŞİM ŞEMASI (GLOBAL MATRIX) */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-100">
                    Bütünleşik Ajan Koordinasyon Ağı (Orkestrasyon Prensibi)
                  </h4>
                </div>
                <span className="text-[11px] text-indigo-300 font-mono">
                  1136 S.K. m. 34 & KVKK Uyumlu
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ultra Hukuk AI mimarisinde hiçbir ajan tek başına izole çalışmaz. <strong>Dijital OCR ve Dikte Ajanları</strong> fiziksel evrakları sisteme sokar; <strong>Cımbız Ajanı ve Bilirkişi Lab</strong> zafiyetleri ve altın ayrıntıları yakalar; <strong>Usul ve Süre Ajanı</strong> hak düşürücü süre kalkanı sağlar; <strong>Dilekçe Mimarı ve Yargıtay Emsal Ajanı</strong> bunları resmi dilekçeye dönüştürür; en son <strong>Baş Hukuk Müşaviri</strong> tüm veriyi denetleyip davayı kazanma stratejisini kesinleştirir.
              </p>
            </div>

          </div>
        </section>
      )}
    </>
  );
}
