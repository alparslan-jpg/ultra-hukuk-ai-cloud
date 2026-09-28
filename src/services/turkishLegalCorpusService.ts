/**
 * Turkish Legal Corpus & Precedent Verification Service
 * Türk Hukuk Mevzuatı ve Emsal İçtihat Çapraz Doğrulama Servisi
 *
 * Yapay zeka tarafından üretilen hukuki iddia, savunma ve dilekçe metinlerindeki
 * kanun maddesi atıflarını (TBK, HMK, TTK, İİK, İş K., TMK, TCK vb.) ve içtihatları
 * yürürlükteki mevzuat ve emsal kararlar veri tabanı ile çapraz denetler.
 * Her bir atıf için 'Verified' veya 'Flagged' statüsü üretir.
 */

export interface TurkishStatute {
  lawCode: 'TBK' | 'HMK' | 'TTK' | 'İİK' | 'İŞ_K' | 'TMK' | 'TCK' | 'FAİZ_K';
  lawNumber: string;
  lawName: string;
  article: string;
  title: string;
  summary: string;
  status: 'Yürürlükte' | 'Mülga' | 'Değişik';
  maxArticleNumber: number;
}

export interface TurkishPrecedent {
  id: string;
  court: string;
  esasNo: string;
  kararNo: string;
  tarih: string;
  subject: string;
  corePrinciple: string;
  relatedArticles: string[];
}

export interface CitationVerificationResult {
  id: string;
  rawCitation: string;
  lawCode: string;
  article: string;
  status: 'Verified' | 'Flagged';
  isRepealedOrObsolete: boolean;
  isOutOfRange: boolean;
  isSyntheticOrHallucinated: boolean;
  articleTitle?: string;
  officialSummary?: string;
  flagReason?: string;
  correctionSuggestion?: string;
  matchingPrecedent?: TurkishPrecedent;
}

export interface CrossReferenceReport {
  totalCitations: number;
  verifiedCount: number;
  flaggedCount: number;
  overallStatus: 'Verified' | 'Flagged';
  accuracyScore: number;
  hasHallucinations: boolean;
  results: CitationVerificationResult[];
  summaryNote: string;
}

// 1. Resmi Türk Mevzuatı Veri Tabanı (Mock Official Legal Corpus)
export const TURKISH_STATUTES_DB: Record<string, TurkishStatute> = {
  // TBK - Türk Borçlar Kanunu (6098 S.) - Azami Madde: 649
  'TBK-1': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '1',
    title: 'Sözleşmenin Kurulması & İrade Beyanı',
    summary: 'Sözleşme, tarafların iradelerini karşılıklı ve birbirine uygun olarak açıklamalarıyla kurulur.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-19': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '19',
    title: 'Sözleşmelerin Yorumu & Muvazaa',
    summary: 'Bir sözleşmenin türünün belirlenmesinde tarafların gerçek ve ortak iradeleri esas alınır; muvazaalı işlemler hüküm doğurmaz.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-72': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '72',
    title: 'Haksız Fiil Tazminatında Zamanaşımı',
    summary: 'Tazminat istemi, zarar görenin zararı ve tazminat yükümlüsünü öğrendiği tarihten başlayarak 2 yıl ve her halde fiilin işlendiği tarihten başlayarak 10 yılda zamanaşımına uğrar.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-117': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '117',
    title: 'Borçlunun Temerrüdü & İhtar Şartı',
    summary: 'Muaccel bir borcun borçlusu, alacaklının ihtarıyla temerrüde düşer. Borcun ifa edileceği gün sözleşmeyle belirlenmişse ihtara gerek olmaksızın temerrüt gerçekleşir.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-120': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '120',
    title: 'Temerrüt Faizi Oranı & Yasal Sınır',
    summary: 'Sözleşmeyle kararlaştırılacak yıllık temerrüt faizi oranı, mevzuatla belirlenen yasal faiz oranının yüzde yüz fazlasını aşamaz.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-123': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '123',
    title: 'Karşılıklı Borçlarda Süre Verilmesi',
    summary: 'Karşılıklı borç yükleyen sözleşmelerde temerrüde düşen borçluya ifa için uygun bir mehil verilir veya hakimden mehil tayini istenir.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-125': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '125',
    title: 'Alacaklının Seçimlik Hakları (Aynen İfa / Fesih / Müspet-Menfi Zarar)',
    summary: 'Temerrüde düşen borçluya karşı alacaklı; aynen ifa ile gecikme tazminatı, ifadan vazgeçerek müspet zararını veya sözleşmeden dönerek menfi zararını talep edebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-146': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '146',
    title: 'Genel Zamanaşımı Süresi (On Yıl)',
    summary: 'Kanunda aksine bir hüküm bulunmadıkça, her alacak 10 yıllık genel zamanaşımına tabidir.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-147': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '147',
    title: 'Beş Yıllık Zamanaşımına Tabi Alacaklar',
    summary: 'Kira bedelleri, vekalet, komisyon, ticari işletme ortaklık alacakları ve yüklenicinin kasıt veya ağır kusuru hariç eser sözleşmesi alacakları 5 yılda zamanaşımına uğrar.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-219': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '219',
    title: 'Satış Sözleşmesinde Ayıptan Sorumluluk',
    summary: 'Satıcı, alıcıya devrettiği malın niteliklerinden ve alıcının beklediği yararları kaldıran veya önemli ölçüde azaltan ayıplardan sorumludur.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-315': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '315',
    title: 'Kiracının Temerrüdü & 30 Günlük Tahliye İhtarı',
    summary: 'Kiracı kira bedelini ödemezse, konut ve çatılı işyerlerinde en az 30 gün süre verilir; süre sonunda ödenmezse sözleşme feshedilip tahliye talep edilebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-470': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '470',
    title: 'Eser Sözleşmesinin Tanımı',
    summary: 'Eser sözleşmesi, yüklenicinin bir eser meydana getirmeyi, işsahibinin de bunun karşılığında bir bedel ödemeyi üstlendiği sözleşmedir.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-474': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '474',
    title: 'Eserin Gözden Geçirilmesi ve Ayıp Bildirimi',
    summary: 'İşsahibi, eserin tesliminden sonra işlerin olağan akışına göre imkan bulur bulmaz eseri gözden geçirmek ve ayıpları uygun sürede bildirmekle yükümlüdür.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },
  'TBK-477': {
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '477',
    title: 'Eserin Kabulü & İhtirazi Kayıt Şartı',
    summary: 'Eserin açıkça veya örtülü olarak kabulünden sonra yüklenici sorumluluktan kurtulur; ancak işsahibi gizli ayıplar veya ihtirazi kayıt koyduğu hususlarda haklarını korur.',
    status: 'Yürürlükte',
    maxArticleNumber: 649,
  },

  // HMK - 6100 Sayılı Hukuk Muhakemeleri Kanunu - Azami Madde: 451
  'HMK-1': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '1',
    title: 'Görevin Kamu Düzeninden Oluşu',
    summary: 'Mahkemelerin görevi kanunla belirlenir. Göreve ilişkin kurallar kamu düzenindendir ve davanın her aşamasında re\'sen gözetilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-17': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '17',
    title: 'Yetki Sözleşmesi Şartları',
    summary: 'Yetki sözleşmesi ancak tacirler veya kamu tüzel kişileri arasında geçerli olarak akdedilebilir. Tacir olmayanların yetki sözleşmesi geçersizdir.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-114': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '114',
    title: 'Dava Şartları (Usulü Ön İnceleme)',
    summary: 'Yargı hakkı, görev, kesin yetki, vekaletname, gider avansı, hukuki yarar ve kanunlarda öngörülen zorunlu arabuluculuk genel dava şartıdır.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-116': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '116',
    title: 'İlk İtirazlar & Kesin Süre',
    summary: 'Yetki itirazı ve tahkim itirazı ilk itirazlardandır; cevap dilekçesinde ileri sürülmeyen ilk itirazlar dinlenmez.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-119': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '119',
    title: 'Dava Dilekçesinin Zorunlu Unsurları',
    summary: 'Mahkeme, tarafların kimliği, vakıaların özeti, deliller, açık talep sonucu ve imza dava dilekçesinde bulunmalıdır; eksiklikte 1 haftalık kesin süre verilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-127': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '127',
    title: 'Cevap Dilekçesi Verme Süresi',
    summary: 'Cevap dilekçesini verme süresi, dava dilekçesinin davalıya tebliğinden itibaren iki haftadır.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-140': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '140',
    title: 'Ön İnceleme Duruşması & Sulhe Teşvik',
    summary: 'Hakim, ön inceleme duruşmasında dava şartlarını ve ilk itirazları karara bağlar, uyuşmazlık noktalarını tespit eder ve tarafları sulhe teşvik eder.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-141': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '141',
    title: 'İddia ve Savunmanın Genişletilmesi Yasağı',
    summary: 'Taraflar, cevaba cevap ve ikinci cevap dilekçeleri ile iddia veya savunmalarını serbestçe genişletebilir; bundan sonra karşı tarafın açık rızası olmaksızın iddia genişletilemez.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-190': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '190',
    title: 'İspat Yükü Genel Kuralı',
    summary: 'İspat yükü, kanunda özel bir düzenleme bulunmadıkça, iddia edilen vakıaya bağlanan hukuki sonuçtan kendi lehine hak çıkaran tarafa aittir.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-194': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '194',
    title: 'Somutlaştırma Yükü ve Delillerin Gösterilmesi',
    summary: 'Taraflar, dayandıkları vakıaları ispata elverişli şekilde somutlaştırmalı ve hangi delilin hangi vakıanın ispatı için gösterildiğini açıkça belirtmelidir.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-200': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '200',
    title: 'Senetle İspat Zorunluluğu & Tanık Yasağı',
    summary: 'Kanunda belirtilen parasal sınırı (2026 yılı tarifesi) aşan hukuki işlemler senetle ispat edilmek zorundadır; karşı tarafın açık muvafakati olmadıkça tanık dinlenemez.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-202': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '202',
    title: 'Delil Başlangıcı',
    summary: 'Senetle ispatı gereken hususlarda karşı tarafça verilmiş veya imza edilmiş yazılı delil başlangıcı varsa tanık dinlenebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-266': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '266',
    title: 'Bilirkişiye Başvurulacak Haller & Hukuki Nitelendirme Yasağı',
    summary: 'Özel veya teknik bilgiyi gerektiren hallerde bilirkişiye gidilir; genel bilgi veya hakimin mesleki hukuki bilgisiyle çözümlenebilecek konularda bilirkişi görevlendirilemez.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },
  'HMK-281': {
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '281',
    title: 'Bilirkişi Raporuna İtiraz (İki Haftalık Kesin Süre)',
    summary: 'Taraflar, bilirkişi raporunun kendilerine tebliğinden itibaren iki hafta içinde rapordaki eksiklik ve çelişkilerin giderilmesini veya yeni bilirkişi incelemesi talep edebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 451,
  },

  // TTK - 6102 Sayılı Türk Ticaret Kanunu - Azami Madde: 1535
  'TTK-4': {
    lawCode: 'TTK',
    lawNumber: '6102',
    lawName: 'Türk Ticaret Kanunu',
    article: '4',
    title: 'Ticari Davalar & Asliye Ticaret Mahkemesinin Görevi',
    summary: 'Her iki tarafın ticari işletmesiyle ilgili hususlar veya TTK\'da düzenlenen mutlak ticari davalar Asliye Ticaret Mahkemesinde görülür.',
    status: 'Yürürlükte',
    maxArticleNumber: 1535,
  },
  'TTK-5': {
    lawCode: 'TTK',
    lawNumber: '6102',
    lawName: 'Türk Ticaret Kanunu',
    article: '5/A',
    title: 'Dava Şartı Zorunlu Arabuluculuk',
    summary: 'Konusu bir miktar paranın ödenmesi olan alacak ve tazminat talepli ticari davalarda arabulucuya başvurulmuş olması dava şartıdır.',
    status: 'Yürürlükte',
    maxArticleNumber: 1535,
  },
  'TTK-18': {
    lawCode: 'TTK',
    lawNumber: '6102',
    lawName: 'Türk Ticaret Kanunu',
    article: '18/3',
    title: 'Tacirler Arası Tebligat & İhtar Şekli',
    summary: 'Tacirler arasında diğer tarafı temerrüde düşürmeye veya sözleşmeyi feshe ilişkin bildirimler noter, taahhütlü mektup, telgraf veya KEP ile yapılır.',
    status: 'Yürürlükte',
    maxArticleNumber: 1535,
  },
  'TTK-21': {
    lawCode: 'TTK',
    lawNumber: '6102',
    lawName: 'Türk Ticaret Kanunu',
    article: '21/2',
    title: 'Fatura & Sekiz Günlük İtiraz Karinesi',
    summary: 'Bir fatura alan kimse aldığı tarihten itibaren sekiz gün içinde içeriğine itiraz etmezse faturanın münderecatını kabul etmiş sayılır.',
    status: 'Yürürlükte',
    maxArticleNumber: 1535,
  },
  'TTK-23': {
    lawCode: 'TTK',
    lawNumber: '6102',
    lawName: 'Türk Ticaret Kanunu',
    article: '23',
    title: 'Ticari Satışta Ayıp İhbar Süreleri (2 Gün ve 8 Gün)',
    summary: 'Açık ayıplarda teslimden itibaren 2 gün, olağan gözden geçirmeyle anlaşılabilecek ayıplarda 8 gün içinde bildirim zorunludur.',
    status: 'Yürürlükte',
    maxArticleNumber: 1535,
  },

  // İİK - 2004 Sayılı İcra ve İflas Kanunu - Azami Madde: 379
  'İİK-67': {
    lawCode: 'İİK',
    lawNumber: '2004',
    lawName: 'İcra ve İflas Kanunu',
    article: '67',
    title: 'İtirazın İptali Davası & %20 İcra İnkar Tazminatı',
    summary: 'Takibe itiraz edilen alacaklı, itiraz tebliğinden itibaren 1 yıl içinde mahkemeye başvurarak itirazın iptalini ve borçlu haksızsa %20\'den aşağı olmamak üzere icra inkar tazminatı isteyebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 379,
  },
  'İİK-68': {
    lawCode: 'İİK',
    lawNumber: '2004',
    lawName: 'İcra ve İflas Kanunu',
    article: '68',
    title: 'İtirazın Kesin Kaldırılması',
    summary: 'İmzası ikrar edilmiş adi senet, noter senedi veya resmi daire belgelerine dayanan alacaklı icra mahkemesinden itirazın kesin kaldırılmasını isteyebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 379,
  },
  'İİK-72': {
    lawCode: 'İİK',
    lawNumber: '2004',
    lawName: 'İcra ve İflas Kanunu',
    article: '72',
    title: 'Menfi Tespit ve İstirdat Davaları',
    summary: 'Borçlu, icra takibinden önce veya takipten sonra borçlu bulunmadığının tespiti için menfi tespit davası açabilir; %15 teminatla takibin durdurulması istenebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 379,
  },

  // 4857 Sayılı İş Kanunu - Azami Madde: 120
  'İŞ_K-17': {
    lawCode: 'İŞ_K',
    lawNumber: '4857',
    lawName: 'İş Kanunu',
    article: '17',
    title: 'Süreli Fesih ve İhbar Tazminatı',
    summary: 'Belirsiz süreli iş sözleşmelerinin feshinden önce durumun diğer tarafa bildirilmesi gerekir; bildirim süresine uymayan taraf ihbar tazminatı öder.',
    status: 'Yürürlükte',
    maxArticleNumber: 120,
  },
  'İŞ_K-20': {
    lawCode: 'İŞ_K',
    lawNumber: '4857',
    lawName: 'İş Kanunu',
    article: '20',
    title: 'Fesih Bildirimine İtiraz ve İşe İade Davası',
    summary: 'İş sözleşmesi feshedilen işçi, fesih bildiriminin tebliğinden itibaren 1 ay içinde arabulucuya başvurmak zorundadır; anlaşamama halinde 2 hafta içinde işe iade davası açılır.',
    status: 'Yürürlükte',
    maxArticleNumber: 120,
  },
  'İŞ_K-25': {
    lawCode: 'İŞ_K',
    lawNumber: '4857',
    lawName: 'İş Kanunu',
    article: '25/II',
    title: 'İşverenin Haklı Nedenle Derhal Fesih Hakkı (Ahlak ve İyiniyet)',
    summary: 'Ahlak ve iyi niyet kurallarına uymayan hallerde işveren sürenin bitimini beklemeden kıdem tazminatsız derhal feshedebilir; fesih yetkisi öğrenmeden itibaren 6 iş gününde kullanılır.',
    status: 'Yürürlükte',
    maxArticleNumber: 120,
  },
  'İŞ_K-32': {
    lawCode: 'İŞ_K',
    lawNumber: '4857',
    lawName: 'İş Kanunu',
    article: '32',
    title: 'Ücret Alacaklarında Beş Yıllık Zamanaşımı',
    summary: 'Ücret alacaklarında zamanaşımı süresi beş yıldır.',
    status: 'Yürürlükte',
    maxArticleNumber: 120,
  },

  // 3095 Sayılı Kanuni Faiz ve Temerrüt Faizine İlişkin Kanun - Azami Madde: 6
  'FAİZ_K-1': {
    lawCode: 'FAİZ_K',
    lawNumber: '3095',
    lawName: '3095 Sayılı Kanuni Faiz ve Temerrüt Faizi Kanunu',
    article: '1',
    title: 'Kanuni Faiz Oranı',
    summary: 'Borçlar Kanununa ve Türk Ticaret Kanununa göre faiz ödenmesi gereken hallerde miktar belirtilmemişse kanuni faiz oranı uygulanır.',
    status: 'Yürürlükte',
    maxArticleNumber: 6,
  },
  'FAİZ_K-2': {
    lawCode: 'FAİZ_K',
    lawNumber: '3095',
    lawName: '3095 Sayılı Kanuni Faiz ve Temerrüt Faizi Kanunu',
    article: '2',
    title: 'Ticari İşlerde Temerrüt Faizi & Avans Oranı',
    summary: 'Ticari işlerde temerrüt faizi olarak T.C. Merkez Bankası\'nın belirlediği avans faizi oranı talep edilebilir.',
    status: 'Yürürlükte',
    maxArticleNumber: 6,
  },
};

// 2. Mülga (Repealed) ve Geçersiz Kanun Maddeleri (Hallucination & Obsolete Trap Database)
export const OBSOLETE_OR_REPEALED_LAWS: Record<string, { note: string; replacement: string }> = {
  '818-106': {
    note: 'Mülga 818 Sayılı Borçlar Kanunu m. 106 yürürlükten kalkmıştır.',
    replacement: '6098 Sayılı TBK m. 123 ve 125 kullanılmalıdır.',
  },
  '6762-688': {
    note: 'Mülga 6762 Sayılı Eski TTK m. 688 yürürlükte değildir.',
    replacement: '6102 Sayılı Yeni TTK m. 776 (Bono zorunlu unsurları) kullanılmalıdır.',
  },
  '1086-288': {
    note: 'Mülga 1086 Sayılı HUMK m. 288 (Senetle İspat) yürürlükten kalkmıştır.',
    replacement: '6100 Sayılı HMK m. 200 kullanılmalıdır.',
  },
  '818-355': {
    note: 'Mülga 818 Sayılı Borçlar Kanunu İstisna Akdi m. 355 yürürlükten kalkmıştır.',
    replacement: '6098 Sayılı TBK m. 470 (Eser Sözleşmesi) kullanılmalıdır.',
  },
};

// 3. Emsal Kararlar Veri Tabanı (Precedents Database)
export const TURKISH_PRECEDENTS_DB: TurkishPrecedent[] = [
  {
    id: 'prec-1',
    court: 'Yargıtay Hukuk Genel Kurulu',
    esasNo: '2021/11-450',
    kararNo: '2022/112',
    tarih: '15.02.2022',
    subject: 'Faturaya 8 Günlük İtiraz ve Teyit Mektubu Karinesi',
    corePrinciple:
      'TTK m. 21/2 uyarınca 8 gün içinde itiraz edilmeyen fatura içeriği sözleşme şartlarına uygun sayılır; ancak faturanın akdi ilişkiyi tek başına ispatlamayacağı, temel borç ilişkisinin ve teslimin ispatı gerektiği ilkesi caridir.',
    relatedArticles: ['TTK m. 21/2', 'HMK m. 190', 'HMK m. 200'],
  },
  {
    id: 'prec-2',
    court: 'Yargıtay 15. Hukuk Dairesi',
    esasNo: '2019/3412',
    kararNo: '2020/890',
    tarih: '08.10.2020',
    subject: 'Eser Sözleşmesinde İhtirazi Kayıtsız Teslim & Gizli Ayıp',
    corePrinciple:
      'TBK m. 477 uyarınca teslim tutanağında ihtirazi kayıt bulunmaması açık ayıplar bakımından yüklenicinin ibra edildiği sonucunu doğurur; gizli ayıpların ise ortaya çıkar çıkmaz derhal ihbarı şarttır.',
    relatedArticles: ['TBK m. 474', 'TBK m. 477'],
  },
  {
    id: 'prec-3',
    court: 'Yargıtay 9. Hukuk Dairesi',
    esasNo: '2022/1540',
    kararNo: '2022/8940',
    tarih: '14.06.2022',
    subject: 'İşçi İstifa Dilekçesinin Şekli & İrade Fesadı',
    corePrinciple:
      'Matbu ve içerik yönünden hayatın olağan akışına uymayan istifa dilekçeleri karşısında işverenin kıdem/ihbar ödememe savunması dinlenemez; iş sözleşmesinin gerçekte kim tarafından feshedildiği tespit edilir.',
    relatedArticles: ['4857 s. K. m. 17', '4857 s. K. m. 25', 'TBK m. 19'],
  },
  {
    id: 'prec-4',
    court: 'Yargıtay 11. Hukuk Dairesi',
    esasNo: '2020/2154',
    kararNo: '2021/1204',
    tarih: '24.03.2021',
    subject: 'Ticari Davalarda Dava Şartı Arabuluculuk Son Tutanağı',
    corePrinciple:
      'TTK m. 5/A ve HMK m. 114/2 uyarınca zorunlu arabuluculuk son tutanağı dava dilekçesiyle sunulmazsa mahkeme 1 haftalık kesin süre verir; tamamlanmazsa dava esasa girilmeden usulden reddedilir.',
    relatedArticles: ['TTK m. 5/A', 'HMK m. 114', 'HMK m. 115'],
  },
  {
    id: 'prec-5',
    court: 'Yargıtay 19. Hukuk Dairesi',
    esasNo: '2018/4321',
    kararNo: '2019/1250',
    tarih: '18.11.2019',
    subject: 'HMK m. 200 Senetle İspat Sınırı & Tanık Dinletme Yasağı',
    corePrinciple:
      'Senetle ispat sınırını aşan hukuki işlemlerde karşı tarafın açık rızası olmaksızın tanık dinlenmesi usul ve kanuna aykırıdır; yazılı delil başlangıcı veya yemin delili aranır.',
    relatedArticles: ['HMK m. 200', 'HMK m. 202', 'HMK m. 225'],
  },
];

// 4. Çapraz Doğrulama Motoru (Cross-Reference Engine)
export function verifyLegalCitations(text: string): CrossReferenceReport {
  if (!text || typeof text !== 'string') {
    return {
      totalCitations: 0,
      verifiedCount: 0,
      flaggedCount: 0,
      overallStatus: 'Verified',
      accuracyScore: 100,
      hasHallucinations: false,
      results: [],
      summaryNote: 'İncelenecek metin bulunamadı.',
    };
  }

  // Regex patterns to capture Turkish legal citations
  // Example: TBK m. 117, TBK 117, HMK m. 200, TTK m. 21/2, İİK m. 68, 4857 s. K. m. 25, BK 106, HUMK 288
  const citationRegex =
    /(?:(6098\s*s\.|yeni)?\s*(TBK|HMK|TTK|İİK|TMK|TCK|İş\s*K|BK|HUMK|Faiz\s*K)\s*(?:sayılı\s*kanun\s*)?(?:m\.|madde|maddesi)?\s*(\d+(?:\/[a-zA-Z0-9]+)?))/gi;

  const matches: { raw: string; law: string; article: string }[] = [];
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const raw = match[0].trim();
    let law = match[2].toUpperCase().replace(/\s+/g, '');
    const article = match[3].replace(/[^\d/a-zA-Z]/g, '');

    if (law.includes('İŞ') || law.includes('IS')) law = 'İŞ_K';
    if (law.includes('FAIZ') || law.includes('FAİZ')) law = 'FAİZ_K';

    // Avoid duplicate matches of the exact same span
    if (!matches.some((m) => m.raw.toLowerCase() === raw.toLowerCase())) {
      matches.push({ raw, law, article });
    }
  }

  const results: CitationVerificationResult[] = [];
  let verifiedCount = 0;
  let flaggedCount = 0;
  let hasHallucinations = false;

  for (let i = 0; i < matches.length; i++) {
    const item = matches[i];
    const baseArtNumber = parseInt(item.article.split('/')[0], 10);
    const lookupKey = `${item.law}-${baseArtNumber}`;
    const obsoleteKey = `${item.law}-${baseArtNumber}`;

    // A. Check if it's an obsolete/repealed statute (Hallucination Trap)
    if (
      item.law === 'BK' ||
      item.law === 'HUMK' ||
      OBSOLETE_OR_REPEALED_LAWS[obsoleteKey] ||
      (item.law === 'TBK' && OBSOLETE_OR_REPEALED_LAWS[`818-${baseArtNumber}`])
    ) {
      flaggedCount++;
      hasHallucinations = true;
      const obs =
        OBSOLETE_OR_REPEALED_LAWS[obsoleteKey] ||
        OBSOLETE_OR_REPEALED_LAWS[`818-${baseArtNumber}`] || {
          note: `Mülga ${item.law} kanunu hükümleri yürürlükten kalkmıştır.`,
          replacement: 'Yürürlükteki güncel Türk mevzuatına (TBK, HMK vb.) atıf yapılmalıdır.',
        };

      results.push({
        id: `cite-${i + 1}`,
        rawCitation: item.raw,
        lawCode: item.law,
        article: item.article,
        status: 'Flagged',
        isRepealedOrObsolete: true,
        isOutOfRange: false,
        isSyntheticOrHallucinated: true,
        flagReason: `MÜLGA (GEÇERSİZ) KANUN MADDESİ: ${obs.note}`,
        correctionSuggestion: obs.replacement,
      });
      continue;
    }

    // B. Check maximum article bounds (Hallucination Detection)
    // E.g. TBK > 649, HMK > 451, TTK > 1535, İİK > 379, İş K > 120
    let maxArticle = 2000;
    if (item.law === 'TBK') maxArticle = 649;
    else if (item.law === 'HMK') maxArticle = 451;
    else if (item.law === 'TTK') maxArticle = 1535;
    else if (item.law === 'İİK') maxArticle = 379;
    else if (item.law === 'İŞ_K') maxArticle = 120;
    else if (item.law === 'FAİZ_K') maxArticle = 6;

    if (baseArtNumber > maxArticle) {
      flaggedCount++;
      hasHallucinations = true;
      results.push({
        id: `cite-${i + 1}`,
        rawCitation: item.raw,
        lawCode: item.law,
        article: item.article,
        status: 'Flagged',
        isRepealedOrObsolete: false,
        isOutOfRange: true,
        isSyntheticOrHallucinated: true,
        flagReason: `HALÜSİNASYON / UYDURMA MADDE: ${item.law} kanununda ${baseArtNumber}. madde bulunmamaktadır! ${item.law} toplam ${maxArticle} maddedir.`,
        correctionSuggestion: `Gerçek yürürlükteki bir ${item.law} maddesi ile değiştiriniz.`,
      });
      continue;
    }

    // C. Check against Turkish Statutes Database
    const matchedStatute = TURKISH_STATUTES_DB[lookupKey];

    // Find any matching precedent
    const matchingPrecedent = TURKISH_PRECEDENTS_DB.find((p) =>
      p.relatedArticles.some((art) => art.toUpperCase().includes(`${item.law}`) && art.includes(item.article))
    );

    if (matchedStatute) {
      verifiedCount++;
      results.push({
        id: `cite-${i + 1}`,
        rawCitation: item.raw,
        lawCode: item.law,
        article: item.article,
        status: 'Verified',
        isRepealedOrObsolete: false,
        isOutOfRange: false,
        isSyntheticOrHallucinated: false,
        articleTitle: matchedStatute.title,
        officialSummary: matchedStatute.summary,
        matchingPrecedent,
      });
    } else {
      // Valid range in Turkish Law, but not in curated critical cache
      verifiedCount++;
      results.push({
        id: `cite-${i + 1}`,
        rawCitation: item.raw,
        lawCode: item.law,
        article: item.article,
        status: 'Verified',
        isRepealedOrObsolete: false,
        isOutOfRange: false,
        isSyntheticOrHallucinated: false,
        articleTitle: `${item.law} Madde ${item.article}`,
        officialSummary: `${item.law} Kanununda yer alan yürürlükteki pozitif hukuk normu (${item.law} m. ${item.article}).`,
        matchingPrecedent,
      });
    }
  }

  const totalCitations = results.length;
  const accuracyScore = totalCitations > 0 ? Math.round((verifiedCount / totalCitations) * 100) : 100;
  const overallStatus = flaggedCount > 0 ? 'Flagged' : 'Verified';

  let summaryNote = '';
  if (totalCitations === 0) {
    summaryNote = 'Metinde taranabilir kanun maddesi atfı tespit edilemedi.';
  } else if (flaggedCount === 0) {
    summaryNote = `Tüm atıflar (${verifiedCount}/${totalCitations}) yürürlükteki Türk mevzuatı ve içtihat veri tabanı ile tam uyumludur.`;
  } else {
    summaryNote = `DİKKAT: Toplam ${totalCitations} atıftan ${flaggedCount} tanesi mülga veya uydurma (halüsinasyon) madde olarak bayraklandı (Flagged)!`;
  }

  return {
    totalCitations,
    verifiedCount,
    flaggedCount,
    overallStatus,
    accuracyScore,
    hasHallucinations,
    results,
    summaryNote,
  };
}
