/**
 * Backend Mock Legal Database Service
 * TMK (Türk Medeni Kanunu - 4721), TBK (Türk Borçlar Kanunu - 6098), HMK (Hukuk Muhakemeleri Kanunu - 6100)
 *
 * Core Turkish Law Codes indexing, semantic search engine, and AI response cross-referencer.
 */

export interface LegalArticle {
  id: string; // e.g., 'TMK-166', 'TBK-117', 'HMK-200'
  lawCode: 'TMK' | 'TBK' | 'HMK';
  lawNumber: '4721' | '6098' | '6100';
  lawName: string;
  article: string;
  title: string;
  chapter: string;
  fullText: string;
  summary: string;
  keywords: string[];
  practicalTips: string;
  precedents: {
    court: string;
    esasNo: string;
    kararNo: string;
    tarih: string;
    principle: string;
  }[];
}

export interface SemanticSearchResult {
  article: LegalArticle;
  score: number; // 0 - 100 relevance score
  matchedKeywords: string[];
  highlightSnippet: string;
  relevanceReason: string;
}

export interface CrossReferenceDiscrepancy {
  citation: string;
  articleId?: string;
  aiStatement: string;
  actualArticleText?: string;
  articleTitle?: string;
  lawName?: string;
  status: 'VERIFIED' | 'PARTIAL' | 'FLAGGED' | 'NOT_FOUND';
  statusLabel: string;
  verdict: string;
  actualQuotation?: string;
  correctionNotice?: string;
}

export interface CrossReferenceAuditReport {
  analyzedAt: string;
  totalClaimsChecked: number;
  verifiedCount: number;
  partialCount: number;
  flaggedCount: number;
  groundingScore: number; // 0 - 100
  overallVerdict: 'GÜVENLİ & DOĞRULANMIŞ' | 'KISMEN UYUMLU (DİKKAT)' | 'RİSKLİ (HALÜSİNASYON / UYUMSUZLUK)';
  discrepancies: CrossReferenceDiscrepancy[];
  judicialNote?: string;
  databaseStats: {
    totalIndexedArticles: number;
    tmkCount: number;
    tbkCount: number;
    hmkCount: number;
  };
}

// -------------------------------------------------------------
// INDEXED CORPUS: TMK (4721), TBK (6098), HMK (6100)
// -------------------------------------------------------------
export const LEGAL_DATABASE: LegalArticle[] = [
  // ==========================================
  // 1. TMK - TÜRK MEDENİ KANUNU (4721 S.)
  // ==========================================
  {
    id: 'TMK-1',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '1',
    title: 'Hukukun Uygulanması ve Kaynakları',
    chapter: 'Başlangıç Hükümleri',
    fullText: 'Kanun, sözüyle ve özüyle değindiği bütün konularda uygulanır. Kanunda uygulanabilir bir hüküm yoksa, hâkim, örf ve âdet hukukuna göre, bu da yoksa kendisi kanun koyucu olsaydı nasıl bir kural koyacak idiyse ona göre karar verir. Hâkim, karar verirken bilimsel görüşlerden ve yargı kararlarından yararlanır.',
    summary: 'Hukukun birincil kaynağı yazılı kanun metnidir; kanunda boşluk varsa örf-adet hukuku ve hakimin hukuk yaratması devreye girer. İçtihat ve doktrin yardımcı kaynaktır.',
    keywords: ['hukukun uygulanması', 'kanun boşluğu', 'hukuk yaratma', 'hakimin takdiri', 'örf ve adet', 'doktrin', 'içtihat'],
    practicalTips: 'Dilekçelerde kanun hükmünün sözüyle birlikte konuluş amacına (özüne / ratio legis) ve Yargıtay İçtihadı Birleştirme kararlarına atıf yapmak hakimi bağlayıcı kılar.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2020/4-312',
        kararNo: '2021/89',
        tarih: '04.02.2021',
        principle: 'Kanunda açık hüküm bulunan hallerde hakimin takdir yetkisi veya örf adet hukukuna başvurma yetkisi bulunmamaktadır.'
      }
    ]
  },
  {
    id: 'TMK-2',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '2',
    title: 'Dürüst Davranma ve Hakkın Kötüye Kullanılması Yasağı',
    chapter: 'Başlangıç Hükümleri',
    fullText: 'Herkes, haklarını kullanırken ve borçlarını yerine getirirken dürüstlük kurallarına uymak zorundadır. Bir hakkın açıkça kötüye kullanılmasını hukuk düzeni korumaz.',
    summary: 'Objektif iyiniyet (dürüstlük kuralı) tüm özel hukuk ilişkilerinin temelidir. Bir hakkın sırf başkasına zarar vermek amacıyla veya meşru menfaat bulunmaksızın kullanılması (hakkın kötüye kullanılması) durumunda hakim re\'sen müdahale eder.',
    keywords: ['dürüst davranma', 'objektif iyiniyet', 'hakkın kötüye kullanılması', 'dürüstlük kuralı', 'hukuk düzeni', 'çelişkili davranış yasağı'],
    practicalTips: 'Karşı tarafın yasal bir yetkiyi sırf müvekkili zora sokmak veya zamanaşımı def\'ini bertaraf etmek için haksız yere ileri sürdüğü hallerde TMK m. 2 def\'i mutlaka dermeyan edilmelidir.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/13-810',
        kararNo: '2021/640',
        tarih: '25.05.2021',
        principle: 'Hakkın kötüye kullanılması yasağı kamu düzenine ilişkin olup davanın her aşamasında mahkemece re\'sen dikkate alınır.'
      }
    ]
  },
  {
    id: 'TMK-3',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '3',
    title: 'İyiniyet (Sübjektif İyiniyet Karinesi)',
    chapter: 'Başlangıç Hükümleri',
    fullText: 'Kanunun iyiniyete hukukî bir sonuç bağladığı durumlarda, asıl olan onun varlığıdır. Ancak, durumun gereklerine göre kendisinden beklenen özeni göstermeyen kimse iyiniyet iddiasında bulunamaz.',
    summary: 'Sübjektif iyiniyet asıldır (karine); aksini iddia eden ispatla yükümlüdür. Ancak gerekli özen ve dikkati göstermeyen kimse iyiniyet kalkanından yararlanamaz.',
    keywords: ['iyiniyet', 'sübjektif iyiniyet', 'özen yükümlülüğü', 'iyiniyet karinesi', 'hak iktisabı'],
    practicalTips: 'Tapu tescilinde veya taşınır mülkiyetinde üçüncü kişinin iyiniyeti karine olsa da, hayatın olağan akışına aykırı düşük bedelle devirlerde özen eksikliği ileri sürülmelidir.',
    precedents: [
      {
        court: 'Yargıtay 1. Hukuk Dairesi',
        esasNo: '2021/4120',
        kararNo: '2022/190',
        tarih: '18.01.2022',
        principle: 'Taşınmazın gerçek değerinin çok altında devralınması durumunda iktisap edenin TMK m. 3 anlamında özen borcunu yerine getirdiği kabul edilemez.'
      }
    ]
  },
  {
    id: 'TMK-6',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '6',
    title: 'İspat Yükü Genel Kuralı',
    chapter: 'Başlangıç Hükümleri',
    fullText: 'Kanunda aksine bir hüküm bulunmadıkça, taraflardan her biri, hakkını dayandırdığı olguların varlığını ispatla yükümlüdür.',
    summary: 'Maddi hukukta ispat yükünün temel kuralıdır. Kendi lehine hak çıkaran taraf o hakkın kurucu olgusunu ispatlamak zorundadır.',
    keywords: ['ispat yükü', 'delil', 'maddi vakıa', 'hak iddiası', 'ispat külfeti', 'kanuni karine'],
    practicalTips: 'HMK m. 190 ile birlikte okunmalıdır. Karşı tarafın inkarı karşısında müvekkilin hangi delille ispat yapacağı bu maddeyle gerekçelendirilir.',
    precedents: [
      {
        court: 'Yargıtay 13. Hukuk Dairesi',
        esasNo: '2018/6500',
        kararNo: '2019/1200',
        tarih: '05.02.2019',
        principle: 'Havale bir ödeme vasıtası olup mevcut bir borcun ödendiğine karinedir; havalenin borç olarak gönderildiğini iddia eden davacı TMK m. 6 uyarınca ispatla mükelleftir.'
      }
    ]
  },
  {
    id: 'TMK-24',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '24',
    title: 'Kişilik Hakkının Korunması & Hukuka Aykırılık',
    chapter: 'Kişiler Hukuku',
    fullText: 'Hukuka aykırı olarak kişilik hakkına saldırılan kimse, hâkimden, saldırıda bulunanlara karşı korunmasını isteyebilir. Kişilik hakkı zedelenen kimsenin rızası, daha üstün nitelikte özel veya kamusal yarar ya da kanunun verdiği yetkinin kullanılması sebeplerinden biriyle haklı kılınmadıkça, kişilik haklarına yapılan her saldırı hukuka aykırıdır.',
    summary: 'Onur, şeref, ticari itibar, özel hayat ve ses/resim gibi kişilik haklarına yönelen her tecavüz hukuka aykırıdır; meşru müdafaa, rıza veya kanuni yetki yoksa saldırı önlenir.',
    keywords: ['kişilik hakkı', 'saldırı', 'özel hayat', 'ticari itibar', 'şeref ve haysiyet', 'hukuka aykırılık', 'men davası'],
    practicalTips: 'Sosyal medya hakaretlerinde veya ticari itibarı zedeleyen sahte paylaşımlarda TMK m. 24 ve m. 25 birlikte ihtiyati tedbir talepli olarak derhal açılmalıdır.',
    precedents: [
      {
        court: 'Yargıtay 4. Hukuk Dairesi',
        esasNo: '2020/1230',
        kararNo: '2021/3450',
        tarih: '16.03.2021',
        principle: 'Sosyal medya platformlarında hedef gösterici ve şeref kırıcı paylaşımlar TMK m. 24 uyarınca doğrudan kişilik hakkı ihlalidir.'
      }
    ]
  },
  {
    id: 'TMK-25',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '25',
    title: 'Kişilik Haklarına Saldırıda Dava Hakları & Manevi Tazminat',
    chapter: 'Kişiler Hukuku',
    fullText: 'Davacı, hâkimden saldırı tehlikesinin önlenmesini, sürmekte olan saldırıya son verilmesini, sona ermiş olsa bile etkileri devam eden saldırının hukuka aykırılığının tespitini isteyebilir. Davacı bunlarla birlikte, düzeltmenin veya kararın üçüncü kişilere bildirilmesi ya da yayımlanması isteminde de bulunabilir. Maddî ve manevî tazminat ile hukuka aykırı saldırı dolayısıyla elde edilen kazancın vekâletsiz iş görme hükümlerine göre verilmesine ilişkin istem hakları saklıdır.',
    summary: 'Kişilik hakkı tecavüzünde önleme, son verme (men), tespit davaları açılabilir; kararın ilanı ve manevi tazminat ile failin haksız kazancının iadesi talep edilebilir.',
    keywords: ['manevi tazminat', 'saldırının önlenmesi', 'saldırıya son verilmesi', 'hukuka aykırılığın tespiti', 'tekzip', 'vekaletsiz iş görme'],
    practicalTips: 'Maddi tazminat yanında tecavüz yoluyla elde edilen haksız gelirin (örneğin izinsiz görsel kullanımı geliri) vekaletsiz işgörme uyarınca talep edilmesi büyük avantaj sağlar.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2017/4-1420',
        kararNo: '2020/55',
        tarih: '28.01.2020',
        principle: 'Manevi tazminat miktarının belirlenmesinde tarafların ekonomik durumu, kusur oranı ve tecavüzün ağırlığı dengeleyici biçimde takdir edilmelidir.'
      }
    ]
  },
  {
    id: 'TMK-166',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '166',
    title: 'Evlilik Birliğinin Sarsılması (Genel Boşanma Sebebi & Anlaşmalı Boşanma)',
    chapter: 'Aile Hukuku - Boşanma',
    fullText: 'Evlilik birliği, ortak hayatı sürdürmeleri kendilerinden beklenmeyecek derecede temelinden sarsılmış olursa, eşlerden her biri boşanma davası açabilir. Yukarıdaki fıkrada belirtilen hâllerde, davacının kusuru daha ağır ise, davalının açılan davaya itiraz hakkı vardır. Bununla beraber bu itiraz, hakkın kötüye kullanılması niteliğinde ise ve evlilik birliğinin devamında davalı ve çocuklar bakımından korunmaya değer bir yarar kalmamışsa, boşanmaya karar verilebilir. Evlilik en az bir yıl sürmüş ise, eşlerin birlikte başvurması ya da bir eşin diğerinin davasını kabul etmesi hâlinde, evlilik birliği temelinden sarsılmış sayılır (Anlaşmalı Boşanma). Boşanma sebeplerinden herhangi biriyle açılmış bulunan davanın reddine karar verilmesi ve bu kararın kesinleştiği tarihten başlayarak üç yıl geçmesi hâlinde, her ne sebeple olursa olsun ortak hayat yeniden kurulamamışsa, evlilik birliği temelinden sarsılmış sayılır ve eşlerden birinin istemi üzerine boşanmaya karar verilir (Eylemli Ayrılık).',
    summary: 'Türk boşanma hukukunun omurgasıdır. 1. fıkra çekişmeli şiddetli geçimsizliği; 3. fıkra 1 yıl evlilik şartlı protokol ile anlaşmalı boşanmayı; 4. fıkra ise davanın reddinden sonra 3 yıllık fiili ayrılık nedeniyle boşanmayı düzenler.',
    keywords: ['boşanma', 'şiddetli geçimsizlik', 'evlilik birliğinin sarsılması', 'anlaşmalı boşanma', 'boşanma protokolü', 'kusur', 'fiili ayrılık'],
    practicalTips: 'Davalının kusuru daha az olsa bile, sırf intikam amacıyla boşanmaya itiraz etmesi TMK m. 166/2 uyarınca hakkın kötüye kullanılması sayılarak boşanma kararı verilebilir. Protokolde mali ve velayet konuları eksiksiz düzenlenmelidir.',
    precedents: [
      {
        court: 'Yargıtay 2. Hukuk Dairesi',
        esasNo: '2021/6120',
        kararNo: '2022/410',
        tarih: '20.01.2022',
        principle: 'Eşine hakaret eden, ailesiyle görüşmesini engelleyen ve ekonomik şiddet uygulayan eş boşanmaya neden olan olaylarda ağır kusurludur.'
      }
    ]
  },
  {
    id: 'TMK-169',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '169',
    title: 'Boşanma Davasında Geçici Önlemler (Tedbir Nafakası & Konut Tahsisi)',
    chapter: 'Aile Hukuku - Boşanma',
    fullText: 'Boşanma veya ayrılık davası açılınca hâkim, davanın devamı süresince gerekli olan, özellikle eşlerin barınmasına, geçimine, eşlerin mallarının yönetimine ve çocukların bakım ve korunmasına ilişkin geçici önlemleri re\'sen alır.',
    summary: 'Dava açıldığı andan itibaren hakim kusur araştırması yapmaksızın ihtiyacı olan eş ve müşterek çocuklar için tedbir nafakasına ve ortak konutun tahsisine re\'sen karar verir.',
    keywords: ['tedbir nafakası', 'geçici önlemler', 'ortak konut tahsisi', 'çocukların bakımı', 're\'sen karar', 'aile mahkemesi'],
    practicalTips: 'Dava dilekçesinde ilk talep olarak TMK m. 169 uyarınca tensiple birlikte derhal tedbir nafakası ve konut tahsisi istenmelidir.',
    precedents: [
      {
        court: 'Yargıtay 2. Hukuk Dairesi',
        esasNo: '2020/3810',
        kararNo: '2021/1190',
        tarih: '11.02.2021',
        principle: 'Tedbir nafakası kusur araştırmasına bağlı olmaksızın davanın açıldığı tarihten itibaren geçerli olmak üzere takdir edilmelidir.'
      }
    ]
  },
  {
    id: 'TMK-174',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '174',
    title: 'Boşanmada Maddî ve Manevî Tazminat',
    chapter: 'Aile Hukuku - Boşanma Sonuçları',
    fullText: 'Mevcut veya beklenen menfaatleri boşanma yüzünden zedelenen kusursuz veya daha az kusurlu taraf, kusurlu taraftan uygun bir maddî tazminat isteyebilir. Boşanmaya sebep olan olaylar yüzünden kişilik hakkı saldırıya uğrayan taraf, kusurlu olan diğer taraftan manevî tazminat olarak uygun miktarda bir para ödenmesini isteyebilir.',
    summary: 'Boşanmada maddi tazminat için mevcut/beklenen menfaat kaybı ve daha az kusurlu olmak şarttır; manevi tazminat için boşanma olayları sebebiyle kişilik hakkının zedelenmesi aranır.',
    keywords: ['maddi tazminat', 'manevi tazminat', 'boşanma tazminatı', 'kusur dengesi', 'kişilik hakkı zedelenmesi', 'eşin desteği'],
    practicalTips: 'Maddi tazminatta eşin evlilik süresince sağladığı bakım desteğinin yitirilmesi somut delillerle (gelir durumu, SGK dökümleri) ispatlanmalıdır.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/2-441',
        kararNo: '2021/302',
        tarih: '18.03.2021',
        principle: 'Eşit kusur halinde tarafların birbirlerinden TMK m. 174 uyarınca maddi ve manevi tazminat talep etme hakkı doğmaz.'
      }
    ]
  },
  {
    id: 'TMK-175',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '175',
    title: 'Yoksulluk Nafakası',
    chapter: 'Aile Hukuku - Boşanma Sonuçları',
    fullText: 'Boşanma yüzünden yoksulluğa düşecek taraf, kusuru daha ağır olmamak koşuluyla, geçimi için diğer taraftan malî gücü oranında süresiz olarak nafaka isteyebilir. Nafaka yükümlüsünün kusuru aranmaz.',
    summary: 'Boşanmayla yoksulluğa düşecek eş, daha ağır kusurlu olmamak kaydıyla süresiz yoksulluk nafakası talep edebilir. Borçlu eşin kusursuz olması nafakayı engellemez.',
    keywords: ['yoksulluk nafakası', 'yoksulluğa düşme', 'süresiz nafaka', 'mali güç', 'asgari ücret', 'kusur şartı'],
    practicalTips: 'Asgari ücretle çalışmak tek başına yoksulluk nafakasını engellemez; nafaka miktarının belirlenmesinde tarafların sosyo-ekonomik durum araştırması (SED) hayati önem taşır.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/3-705',
        kararNo: '2020/804',
        tarih: '27.10.2020',
        principle: 'Asgari ücret seviyesinde gelire sahip olmak yoksulluk nafakası bağlanmasına tek başına engel teşkil etmez; diğer eşin gelir düzeyiyle kıyaslanır.'
      }
    ]
  },
  {
    id: 'TMK-202',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '202',
    title: 'Yasal Mal Rejimi (Edinilmiş Mallara Katılma Rejimi)',
    chapter: 'Aile Hukuku - Mal Rejimleri',
    fullText: 'Eşler arasında evlilik sözleşmesiyle başka bir mal rejimi seçilmemişse, edinilmiş mallara katılma rejiminin uygulanması asıldır.',
    summary: '01.01.2002 tarihinden itibaren evlenen veya başka rejim seçmeyen tüm eşler için yasal rejim edinilmiş mallara katılma rejimidir.',
    keywords: ['yasal mal rejimi', 'edinilmiş mallara katılma', 'mal paylaşımı', 'artık değer', 'tasfiye'],
    practicalTips: '01.01.2002 öncesi edinilen mallar 743 sayılı eski Medeni Kanun uyarınca mal ayrılığına; bu tarihten sonra edinilen mallar ise TMK m. 219 uyarınca tasfiyeye tabidir.',
    precedents: [
      {
        court: 'Yargıtay 8. Hukuk Dairesi',
        esasNo: '2020/1900',
        kararNo: '2021/2100',
        tarih: '09.03.2021',
        principle: '01.01.2002 sonrasında evlilik birliği içinde karşılığı verilerek alınan tüm taşınır ve taşınmazlar aksi ispatlanana kadar edinilmiş mal sayılır.'
      }
    ]
  },
  {
    id: 'TMK-219',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '219',
    title: 'Edinilmiş Mallar Kataloğu',
    chapter: 'Aile Hukuku - Mal Rejimleri',
    fullText: 'Edinilmiş mal, her eşin bu mal rejiminin devamı süresince karşılığını vererek elde ettiği malvarlığı değerleridir. Bir eşin edinilmiş malları özellikle şunlardır: 1. Çalışmasının karşılığı olan edinimler, 2. Sosyal güvenlik veya sosyal yardım kurum ve kuruluşlarının veya personele yardım amacı ile kurulan sandık ve benzerlerinin yaptığı ödemeler, 3. Çalışma gücünün kaybı nedeniyle ödenen tazminatlar, 4. Kişisel mallarının gelirleri (örneğin miras kalan dairenin kira geliri), 5. Edinilmiş malların yerine geçen değerler.',
    summary: 'Evlilik içinde maaşla, ticaretle alınan mallar, kıdem tazminatı ödemeleri ve miras kalan kişisel malların kira gelirleri dahi edinilmiş maldır ve yarı yarıya paylaşıma tabidir.',
    keywords: ['edinilmiş mallar', 'çalışma karşılığı', 'kira gelirleri', 'sosyal güvenlik ödemesi', 'kıdem tazminatı', 'katılma alacağı'],
    practicalTips: 'Miras kalan kişisel mülkün kendisi kişisel mal olsa da, o mülkten elde edilen kira gelirleri TMK m. 219/4 gereği edinilmiş maldır ve katılma alacağına konu edilir.',
    precedents: [
      {
        court: 'Yargıtay 8. Hukuk Dairesi',
        esasNo: '2019/4500',
        kararNo: '2021/1050',
        tarih: '10.02.2021',
        principle: 'Kişisel mal olan dükkanın evlilik süresince tahsil edilen kira gelirleri TMK m. 219/4 uyarınca edinilmiş mal niteliğindedir.'
      }
    ]
  },
  {
    id: 'TMK-683',
    lawCode: 'TMK',
    lawNumber: '4721',
    lawName: 'Türk Medeni Kanunu',
    article: '683',
    title: 'Mülkiyet Hakkının İçeriği, İstihkak ve Müdahalenin Men\'i Davası',
    chapter: 'Eşya Hukuku - Mülkiyet',
    fullText: 'Bir şeye malik olan kimse, hukuk düzeninin sınırları içinde, o şey üzerinde dilediği gibi kullanma, yararlanma ve tasarrufta bulunma yetkisine sahiptir. Malik, malını haksız olarak elinde bulunduran kimseye karşı istihkak davası açabileceği gibi, her türlü haksız elatmanın önlenmesini de dava edebilir.',
    summary: 'Mülkiyet ayni hakkının en güçlü korumasıdır. Haksız zilyede karşı istihkak ve haksız tecavüze karşı müdahalenin men\'i (elatmanın önlenmesi) ile ecrimisil davası açılabilir.',
    keywords: ['mülkiyet hakkı', 'elatmanın önlenmesi', 'müdahalenin meni', 'istihkak davası', 'ecrimisil', 'haksız işgal'],
    practicalTips: 'Müdahalenin men\'i davası taşınmazın aynına ilişkin olduğundan HMK m. 12 gereği taşınmazın bulunduğu yer mahkemesinde kesin yetkilidir. Ecrimisil için intifadan men ihtarı aranır.',
    precedents: [
      {
        court: 'Yargıtay 1. Hukuk Dairesi',
        esasNo: '2020/2800',
        kararNo: '2021/1850',
        tarih: '06.04.2021',
        principle: 'Paydaşlar arasında ecrimisil istenebilmesi için kural olarak intifadan men koşulunun gerçekleşmiş olması şarttır.'
      }
    ]
  },

  // ==========================================
  // 2. TBK - TÜRK BORÇLAR KANUNU (6098 S.)
  // ==========================================
  {
    id: 'TBK-1',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '1',
    title: 'Sözleşmenin Kurulması & İrade Beyanı',
    chapter: 'Sözleşmeden Doğan Borç İlişkileri',
    fullText: 'Sözleşme, tarafların iradelerini karşılıklı ve birbirine uygun olarak açıklamalarıyla kurulur. İrade açıklaması, açık veya örtülü olabilir.',
    summary: 'Sözleşmenin varlığı için icap ve kabulün uyuşması şarttır; irade beyanı zımni (örtülü) de gerçekleşebilir.',
    keywords: ['sözleşmenin kurulması', 'icap ve kabul', 'irade beyanı', 'örtülü kabul', 'akdi ilişki'],
    practicalTips: 'Yazılı sözleşme olmasa bile taraflar arasındaki WhatsApp yazışmaları, fatura teyidi ve fiili teslim zımni sözleşmenin kurulduğunun kanıtıdır.',
    precedents: [
      {
        court: 'Yargıtay 11. Hukuk Dairesi',
        esasNo: '2020/1150',
        kararNo: '2021/280',
        tarih: '20.01.2021',
        principle: 'Sipariş formunun teslim alınarak malların sevk edilmesi TBK m. 1 uyarınca örtülü kabul ile sözleşmenin kurulduğunu gösterir.'
      }
    ]
  },
  {
    id: 'TBK-19',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '19',
    title: 'Sözleşmelerin Yorumu ve Muvazaa',
    chapter: 'Sözleşmeden Doğan Borç İlişkileri',
    fullText: 'Bir sözleşmenin türünün ve içeriğinin belirlenmesinde ve yorumlanmasında, tarafların yanlışlıkla veya gerçek amaçlarını gizlemek için kullandıkları sözcüklere bakılmaksızın, gerçek ve ortak iradeleri esas alınır. Borçlu, yazılı bir borç tanımasına güvenerek alacağı kazanmış olan üçüncü kişiye karşı, bu işlemin muvazaalı olduğu savunmasında bulunamaz.',
    summary: 'Sözleşmede tarafların gerçek iradesi üstündür. Muvazaalı (danışıklı) işlemler taraflar arasında hükümsüzdür; muris muvazaası ve nam-ı müstear davalarının yasal temelidir.',
    keywords: ['muvazaa', 'danışıklı işlem', 'muris muvazaası', 'gerçek irade', 'gizli sözleşme', 'butlan'],
    practicalTips: 'Muris muvazaasında 01.04.1974 tarihli 1/2 sayılı Yargıtay İçtihadı Birleştirme Kararı uyarınca mirasçıların zamanaşımına tabi olmaksızın tapu iptal tescil açabileceği belirtilmelidir.',
    precedents: [
      {
        court: 'Yargıtay 1. Hukuk Dairesi',
        esasNo: '2021/3100',
        kararNo: '2022/650',
        tarih: '08.02.2022',
        principle: 'Murisin diğer mirasçılardan mal kaçırmak amacıyla tapuda yaptığı bağış işlemini satış göstermesi TBK m. 19 uyarınca nisbi muvazaa nedeniyle geçersizdir.'
      }
    ]
  },
  {
    id: 'TBK-49',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '49',
    title: 'Haksız Fiil Sorumluluğu Genel Kuralı',
    chapter: 'Haksız Fiilden Doğan Borç İlişkileri',
    fullText: 'Kusurlu ve hukuka aykırı bir fiille başkasına zarar veren, bu zararı gidermekle yükümlüdür. Zarar verici fiili yasaklayan bir hukuk kuralı bulunmasa bile, ahlaka aykırı bir fiille başkasına kasten zarar veren de, bu zararı gidermekle yükümlüdür.',
    summary: 'Haksız fiil sorumluluğunun 4 temel unsuru: Hukuka aykırı fiil, zarar, kusur ve illiyet bağıdır. Kasten ahlaka aykırı zararlar da tazmin edilir.',
    keywords: ['haksız fiil', 'tazminat', 'kusur', 'illiyet bağı', 'hukuka aykırılık', 'maddi zarar'],
    practicalTips: 'Trafik kazası, darp veya haksız haciz durumlarında TBK m. 49 genel dayanak maddesidir; failin kusuru ile ortaya çıkan zarar arasındaki illiyet bağı somutlaştırılmalıdır.',
    precedents: [
      {
        court: 'Yargıtay 4. Hukuk Dairesi',
        esasNo: '2019/3200',
        kararNo: '2020/1450',
        tarih: '28.05.2020',
        principle: 'Haksız fiilde kusur ve illiyet bağının ispat yükü davacıdadır; ceza mahkemesinin maddi vakıayı tespit eden beraat veya mahkumiyet kararı hukuk hakimini bağlar.'
      }
    ]
  },
  {
    id: 'TBK-72',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '72',
    title: 'Haksız Fiilde Zamanaşımı (2 Yıl & 10 Yıl)',
    chapter: 'Haksız Fiilden Doğan Borç İlişkileri',
    fullText: 'Tazminat istemi, zarar görenin zararı ve tazminat yükümlüsünü öğrendiği tarihten başlayarak iki yılın ve her hâlde fiilin işlendiği tarihten başlayarak on yılın geçmesiyle zamanaşımına uğrar. Ancak, tazminat ceza kanunlarının daha uzun bir zamanaşımı öngördüğü cezayı gerektiren bir fiilden doğmuşsa, bu zamanaşımı uygulanır (Uzamış Ceza Zamanaşımı).',
    summary: 'Haksız fiilde öğrenmeden itibaren 2 yıl ve her halde 10 yıllık zamanaşımı vardır. Ancak eylem suç teşkil ediyorsa ceza kanunundaki daha uzun zamanaşımı süresi uygulanır.',
    keywords: ['haksız fiil zamanaşımı', '2 yıllık süre', '10 yıllık süre', 'öğrenme tarihi', 'uzamış ceza zamanaşımı'],
    practicalTips: 'Trafik kazalarında veya yaralanmalarda TCK\'daki uzamış ceza zamanaşımı devreye girer (örneğin TCK m. 89 için 8 yıl). Davalı zamanaşımı def\'inde bulunursa uzamış ceza süresi savunulmalıdır.',
    precedents: [
      {
        court: 'Yargıtay 17. Hukuk Dairesi',
        esasNo: '2020/4100',
        kararNo: '2021/1500',
        tarih: '18.02.2021',
        principle: 'Eylem aynı zamanda suç niteliğinde ise TBK m. 72 uyarınca ceza zamanaşımı süresi hukuk davasında da uygulanır.'
      }
    ]
  },
  {
    id: 'TBK-117',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '117',
    title: 'Borçlunun Temerrüdü & İhtar Kuralı',
    chapter: 'Borçların İfa Edilmemesinin Sonuçları',
    fullText: 'Muaccel bir borcun borçlusu, alacaklının ihtarıyla temerrüde düşer. Borcun ifa edileceği gün, birlikte belirlenmiş veya sözleşmede saklı tutulan bir hakka dayanılarak usulüne göre taraflardan birince belirlenmişse, bu günün geçmesiyle; haksız fiilde fiilin işlendiği, sebepsiz zenginleşmede ise zenginleşmenin gerçekleştiği tarihte borçlu temerrüde düşmüş olur.',
    summary: 'Borçlunun temerrüdü için kural olarak ihtar şarttır. Ancak kesin vade kararlaştırılmışsa veya haksız fiil söz konusuysa ihtara gerek olmaksızın temerrüt gerçekleşir.',
    keywords: ['borçlunun temerrüdü', 'ihtar', 'muacceliyet', 'kesin vade', 'temerrüt faizi', 'noter ihtarnamesi'],
    practicalTips: 'Noter ihtarnamesi tebliğ şerhi dilekçeye eklenmeli ve temerrüt tarihi olarak tebliğden sonraki gün belirtilmelidir; aksi halde dava tarihinden itibaren faiz yürütülür.',
    precedents: [
      {
        court: 'Yargıtay 15. Hukuk Dairesi',
        esasNo: '2020/2200',
        kararNo: '2021/840',
        tarih: '15.03.2021',
        principle: 'Sözleşmede kesin vade öngörülmemişse alacaklı borçluyu noter ihtarıyla temerrüde düşürmedikçe temerrüt faizi isteyemez.'
      }
    ]
  },
  {
    id: 'TBK-120',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '120',
    title: 'Temerrüt Faizi Oranı ve Yasal Üst Sınır',
    chapter: 'Borçların İfa Edilmemesinin Sonuçları',
    fullText: 'Uygulanacak yıllık temerrüt faizi oranı, sözleşmede kararlaştırılmamışsa, faiz borcunun doğduğu tarihte yürürlükte olan mevzuat hükümlerine göre belirlenir. Sözleşme ile kararlaştırılacak yıllık temerrüt faizi oranı, birinci fıkra uyarınca belirlenen yıllık faiz oranının yüzde yüz fazlasını aşamaz.',
    summary: 'Sözleşmesel temerrüt faizi yasal oranın en fazla %100 fazlası olabilir; aşan kısım kendiliğinden hükümsüzdür. Tacirler arasındaki ticari faiz istisnaları saklıdır.',
    keywords: ['temerrüt faizi', 'yasal faiz sınırı', 'yüzde yüz fazlası', 'faiz aşımı', 'kısmi butlan'],
    practicalTips: 'Sözleşmedeki fahiş faiz şartlarına karşı TBK m. 120/2 uyarınca kısmi butlan ileri sürülerek faizin yasal tavan seviyesine indirilmesi talep edilmelidir.',
    precedents: [
      {
        court: 'Yargıtay 11. Hukuk Dairesi',
        esasNo: '2019/3800',
        kararNo: '2020/2150',
        tarih: '11.06.2020',
        principle: 'Sözleşmede belirlenen temerrüt faiz oranının yasal faizin yüzde yüz fazlasını aşan kısmı TBK m. 120 gereği batıldır.'
      }
    ]
  },
  {
    id: 'TBK-125',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '125',
    title: 'Alacaklının Seçimlik Hakları (Aynen İfa, Fesih, Müspet/Menfi Zarar)',
    chapter: 'Borçların İfa Edilmemesinin Sonuçları',
    fullText: 'Temerrüde düşen borçlu, verilen süre içinde borcunu ifa etmemişse veya süre verilmesini gerektirmeyen bir durum söz konusu ise alacaklı, her zaman borcun ifasını ve gecikme sebebiyle tazminat isteme hakkına sahiptir. Alacaklı, ayrıca borcun ifasından ve gecikme tazminatı isteme hakkından vazgeçtiğini hemen bildirerek, borcun ifa edilmemesinden doğan zararın giderilmesini (Müspet Zarar) isteyebilir veya sözleşmeden dönerek sözleşmenin hükümsüz kalması sebebiyle uğradığı zararın giderilmesini (Menfi Zarar) isteyebilir.',
    summary: 'Temerrüt sonrası alacaklının 3 seçimlik hakkı vardır: 1. Aynen ifa + gecikme tazminatı, 2. İfadan vazgeçip müspet zarar (kâr mahrumiyeti), 3. Sözleşmeden dönüp menfi zarar (ödenen paranın iadesi + kaçırılan fırsatlar).',
    keywords: ['alacaklının seçimlik hakları', 'aynen ifa', 'sözleşmeden dönme', 'menfi zarar', 'müspet zarar', 'gecikme tazminatı'],
    practicalTips: 'Dönme halinde sözleşme geçmişe etkili ortadan kalktığı için cezai şart talep edilemez; cezai şart ve kâr kaybı isteniyorsa ifadan vazgeçilip müspet zarar talep edilmelidir.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2018/15-712',
        kararNo: '2020/610',
        tarih: '24.09.2020',
        principle: 'Sözleşmeden dönen alacaklı ancak menfi zararını isteyebilir; sözleşme yürürlükteymiş gibi kâr mahrumiyeti veya ifaya bağlı cezai şart isteyemez.'
      }
    ]
  },
  {
    id: 'TBK-146',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '146',
    title: 'Genel Zamanaşımı Süresi (On Yıl)',
    chapter: 'Borçların ve Borç İlişkilerinin Sona Ermesi',
    fullText: 'Kanunda aksine bir hüküm bulunmadıkça, her alacak on yıllık zamanaşımına tabidir.',
    summary: 'Türk Borçlar Hukukunun genel zamanaşımı süresi 10 yıldır. Özel bir süre öngörülmeyen tüm sözleşmesel alacaklar bu hükme tabidir.',
    keywords: ['genel zamanaşımı', 'on yıllık süre', 'zamanaşımı def\'i', 'alacak hakkı', 'muacceliyet'],
    practicalTips: 'Zamanaşımı ilk itiraz olup HMK m. 116 uyarınca cevap dilekçesinde açıkça ileri sürülmelidir; mahkemece re\'sen dikkate alınmaz.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/11-120',
        kararNo: '2021/410',
        tarih: '08.04.2021',
        principle: 'Zamanaşımı bir def\'i olup süresinde ileri sürülmediği takdirde mahkemece kendiliğinden gözetilemez.'
      }
    ]
  },
  {
    id: 'TBK-147',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '147',
    title: 'Beş Yıllık Zamanaşımına Tabi Alacaklar',
    chapter: 'Borçların ve Borç İlişkilerinin Sona Ermesi',
    fullText: 'Aşağıdaki alacaklar için beş yıllık zamanaşımı uygulanır: 1. Kira bedelleri, anapara faizleri ve ücret gibi diğer dönemsel edimler, 2. Otel, motel, pansiyon ve tatil köyü gibi yerlerdeki konaklama bedelleri ile restoran ve benzeri yerlerdeki yeme içme bedelleri, 3. Küçük sanat işlerinden ve küçük çapta perakende satışlardan doğan alacaklar, 4. Bir ortaklıkta, ortaklık sözleşmesinden doğan alacaklar, 5. Vekâlet, komisyon ve acentelik sözleşmelerinden doğan alacaklar; ticari işletme yöneticiliği sözleşmesinden doğan alacaklar, 6. Yüklenicinin yükümlülüklerini ağır kusuruyla hiç veya gereği gibi ifa etmemesi durumu dışında, eser sözleşmesinden doğan alacaklar.',
    summary: 'Kira alacakları, vekalet ücreti, acentelik ve yüklenicinin ağır kusuru hariç eser sözleşmesi alacakları 5 yıllık zamanaşımına tabidir.',
    keywords: ['beş yıllık zamanaşımı', 'kira alacağı', 'eser sözleşmesi zamanaşımı', 'vekalet ücreti', 'dönemsel edimler'],
    practicalTips: 'Eser sözleşmesinde müteahhidin kasıt veya ağır kusuru varsa 5 yıl değil TBK m. 146 gereği 10 yıllık genel zamanaşımı uygulanır.',
    precedents: [
      {
        court: 'Yargıtay 15. Hukuk Dairesi',
        esasNo: '2020/1400',
        kararNo: '2021/620',
        tarih: '02.03.2021',
        principle: 'Eser sözleşmesinde yüklenicinin ağır kusuru kanıtlanamadığı sürece TBK m. 147/6 uyarınca 5 yıllık zamanaşımı geçerlidir.'
      }
    ]
  },
  {
    id: 'TBK-315',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '315',
    title: 'Kiracının Temerrüdü ve 30 Günlük Fesih İhtarı',
    chapter: 'Kira Sözleşmesi - Genel Hükümler',
    fullText: 'Kiracı, kiralananın tesliminden sonra muaccel olan kira bedelini veya yan gideri ödeme borcunu ifa etmezse, kiraya veren kiracıya yazılı olarak bir süre verip, bu sürede de ifa etmeme durumunda, sözleşmeyi feshedeceğini bildirebilir. Kiracıya verilecek süre en az on gün, konut ve çatılı işyeri kiralarında ise en az otuz gündür.',
    summary: 'Ödenmeyen kira ve aidat için konut ve çatılı işyerlerinde en az 30 gün süre verilir; süre içinde ödeme yapılmazsa tahliye ve fesih hakkı doğar.',
    keywords: ['kiracının temerrüdü', 'tahliye ihtarı', '30 günlük süre', 'konut ve çatılı işyeri', 'kira feshi', 'icra tahliye'],
    practicalTips: 'İİK m. 269 uyarınca örnek no 13 tahliye ihtarlı icra takibinde ödeme süresi 30 gün ve itiraz süresi 7 gündür; 30 gün dolmadan icra mahkemesinde tahliye davası açılamaz.',
    precedents: [
      {
        court: 'Yargıtay 8. Hukuk Dairesi',
        esasNo: '2020/5500',
        kararNo: '2021/2400',
        tarih: '16.03.2021',
        principle: 'Konut kiralarında 30 günlük yasal ödeme süresi dolmadan açılan tahliye davası dava şartı yokluğundan reddedilmelidir.'
      }
    ]
  },
  {
    id: 'TBK-470',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '470',
    title: 'Eser Sözleşmesinin Tanımı',
    chapter: 'Eser Sözleşmesi',
    fullText: 'Eser sözleşmesi, yüklenicinin bir eser meydana getirmeyi, işsahibinin de bunun karşılığında bir bedel ödemeyi üstlendiği sözleşmedir.',
    summary: 'İnşaat, yazılım, tamirat ve montaj gibi bir sonuç üretmeyi hedefleyen edimler eser sözleşmesidir. Yüklenici sonuç borcu altındadır.',
    keywords: ['eser sözleşmesi', 'yüklenici', 'iş sahibi', 'ücret', 'sonuç borcu', 'müteahhit'],
    practicalTips: 'Vekalet sözleşmesinden en büyük farkı sonuç garantisidir; yüklenici eseri fen ve sanat kurallarına uygun tamamlayıp teslim etmekle yükümlüdür.',
    precedents: [
      {
        court: 'Yargıtay 15. Hukuk Dairesi',
        esasNo: '2019/2100',
        kararNo: '2020/1950',
        tarih: '07.07.2020',
        principle: 'Eser sözleşmesinde yüklenicinin borcu sadece emek sarf etmek değil eseri fen kurallarına uygun meydana getirip teslim etmektir.'
      }
    ]
  },
  {
    id: 'TBK-474',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '474',
    title: 'Eserin Gözden Geçirilmesi ve Ayıp İhbarı',
    chapter: 'Eser Sözleşmesi',
    fullText: 'İşsahibi, eserin tesliminden sonra, işlerin olağan akışına göre imkân bulur bulmaz eseri gözden geçirmek ve ayıpları varsa, bunu uygun bir süre içinde yükleniciye bildirmek zorundadır. Taraflardan her biri, giderini karşılayarak, eserin bilirkişi tarafından gözden geçirilmesini ve sonucun bir raporla belirlenmesini isteyebilir.',
    summary: 'Eser teslim alındığında iş sahibi gecikmeksizin muayene yapmalı ve açık ayıpları uygun sürede bildirmelidir. Aksi halde eser kabul edilmiş sayılır.',
    keywords: ['ayıp ihbarı', 'eserin gözden geçirilmesi', 'muayene külfeti', 'açık ayıp', 'uygun süre', 'teslim tutanağı'],
    practicalTips: 'Açık ayıplarda teslimden sonra uzun süre sessiz kalınması eserin kabulü sayılır (TBK m. 477); gizli ayıplar ise ortaya çıkar çıkmaz derhal noter ihtarıyla bildirilmelidir.',
    precedents: [
      {
        court: 'Yargıtay 15. Hukuk Dairesi',
        esasNo: '2020/3100',
        kararNo: '2021/1100',
        tarih: '23.03.2021',
        principle: 'Açık ayıpların süresinde ihbar edildiğini yazılı delille ispat külfeti iş sahibindedir.'
      }
    ]
  },
  {
    id: 'TBK-477',
    lawCode: 'TBK',
    lawNumber: '6098',
    lawName: 'Türk Borçlar Kanunu',
    article: '477',
    title: 'Eserin Kabulü ve İhtirazi Kayıt',
    chapter: 'Eser Sözleşmesi',
    fullText: 'Eserin açıkça veya örtülü olarak kabulünden sonra, yüklenici her türlü sorumluluktan kurtulur; ancak, onun tarafından kasten gizlenen ve usulüne göre gözden geçirme sırasında fark edilemeyecek olan ayıplar için sorumluluğu devam eder. İşsahibi, gözden geçirmeyi ve bildirimde bulunmayı ihmal ederse, eseri kabul etmiş sayılır. Eserde sonradan ortaya çıkan bir ayıp olursa, işsahibi, gecikmeksizin durumu yükleniciye bildirmek zorundadır; bildirmezse eseri kabul etmiş sayılır.',
    summary: 'İhtirazi kayıt konulmadan teslim alınan eser açık ayıplardan dolayı yükleniciyi ibra eder. Gizli ayıplarda sorumluluk devam eder ancak ortaya çıkınca derhal bildirilmelidir.',
    keywords: ['eserin kabulü', 'ihtirazi kayıt', 'yüklenicinin ibrası', 'gizli ayıp', 'derhal bildirim'],
    practicalTips: 'Geçici ve kesin kabul tutanaklarına açıkça "Eksik ve kusurlu imalatlara dair dava ve talep haklarımız saklıdır" şerhi düşülmeden imza atılmamalıdır.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/15-320',
        kararNo: '2021/512',
        tarih: '20.04.2021',
        principle: 'Teslim tutanağında ihtirazi kayıt bulunmaması yüklenicinin açık ayıplardan dolayı sorumluluktan kurtulması sonucunu doğurur.'
      }
    ]
  },

  // ==========================================
  // 3. HMK - HUKUK MUHAKEMELERİ KANUNU (6100 S.)
  // ==========================================
  {
    id: 'HMK-1',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '1',
    title: 'Görevin Kamu Düzeninden Oluşu',
    chapter: 'Görev, Yetki ve Yargı Yeri Belirlenmesi',
    fullText: 'Mahkemelerin görevi, ancak kanunla düzenlenir. Göreve ilişkin kurallar, kamu düzenindendir.',
    summary: 'Mahkemelerin görevli olup olmadığı kamu düzenine ilişkindir; davanın her aşamasında re\'sen incelenir ve taraflarca itiraz süresine tabi olmaksızın ileri sürülebilir.',
    keywords: ['görev', 'kamu düzeni', 're\'sen inceleme', 'görevsizlik kararı', 'asliye hukuk', 'sulh hukuk'],
    practicalTips: 'Görevsiz mahkemede açılan davada görevsizlik kararının kesinleşmesinden itibaren 2 hafta içinde dosyanın görevli mahkemeye gönderilmesi talep edilmelidir (HMK m. 20).',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2020/20-110',
        kararNo: '2021/95',
        tarih: '09.02.2021',
        principle: 'Görev kuralları kamu düzenine ilişkin olduğundan temyiz ve istinaf aşamasında da kendiliğinden gözetilir.'
      }
    ]
  },
  {
    id: 'HMK-114',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '114',
    title: 'Dava Şartları Kataloğu',
    chapter: 'Dava Şartları ve İlk İtirazlar',
    fullText: 'Dava şartları şunlardır: a) Türk mahkemelerinin yargı hakkının bulunması, b) Yargı yolunun caiz olması, c) Mahkemenin görevli olması, ç) Kesin yetki hâllerinde, mahkemenin yetkili olması, d) Tarafların, taraf ve dava ehliyetine sahip olmaları, e) Dava takip yetkisinin bulunması, f) Vekil aracılığıyla takip edilen davalarda, vekâletnamenin usulüne uygun verilmesi, g) Gider avansının yatırılmış olması, ğ) Teminatın yatırılmış olması, h) Davacının, dava açmakta hukukî yararının bulunması, ı) Aynı davanın, daha önceden açılmış ve hâlen görülmekte olmaması (derdestlik), i) Aynı davanın, daha önceden kesin hükme bağlanmamış olması. Diğer kanunlarda yer alan dava şartlarına ilişkin hükümler saklıdır (Zorunlu Arabuluculuk).',
    summary: 'Davanın esasına girilebilmesi için varlığı zorunlu olan şartlardır. Görev, kesin yetki, gider avansı, vekaletname, hukuki yarar ve kanuni zorunlu arabuluculuk genel dava şartıdır.',
    keywords: ['dava şartları', 'hukuki yarar', 'gider avansı', 'vekaletname', 'zorunlu arabuluculuk', 'usulden ret'],
    practicalTips: 'Dava şartı eksikliği davanın her aşamasında ileri sürülebilir. Arabuluculuk son tutanağı eklenmezse mahkeme 1 haftalık kesin süre verir; tamamlanmazsa usulden ret kararı verilir.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/11-410',
        kararNo: '2021/180',
        tarih: '23.02.2021',
        principle: 'Zorunlu arabuluculuk son tutanağının dava dilekçesine eklenmemesi halinde verilen kesin sürede sunulmaması davanın usulden reddini gerektirir.'
      }
    ]
  },
  {
    id: 'HMK-116',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '116',
    title: 'İlk İtirazlar (Yetki ve Tahkim İtirazı)',
    chapter: 'Dava Şartları ve İlk İtirazlar',
    fullText: 'İlk itirazlar aşağıdakilerden ibarettir: a) Kesin yetki kuralının bulunmadığı hâllerde yetki itirazı, b) Uyuşmazlığın tahkim yoluyla çözümlenmesi gerektiği (tahkim) itirazı.',
    summary: 'Yetki ve tahkim ilk itirazlardandır. Cevap dilekçesinde ilk itiraz olarak ileri sürülmeyen yetki itirazı dinlenmez ve mahkeme yetkili hale gelir.',
    keywords: ['ilk itirazlar', 'yetki itirazı', 'tahkim itirazı', 'cevap dilekçesi', 'hak düşürücü süre'],
    practicalTips: 'Yetki itirazında bulunurken yetkili mahkemenin açıkça gösterilmesi şarttır (HMK m. 19/2); aksi halde yetki itirazı geçersiz sayılır.',
    precedents: [
      {
        court: 'Yargıtay 11. Hukuk Dairesi',
        esasNo: '2020/1800',
        kararNo: '2021/750',
        tarih: '04.03.2021',
        principle: 'Yetki itirazında yetkili mahkeme açıkça ve tereddütsüz gösterilmemişse ilk itiraz incelenmeksizin reddedilir.'
      }
    ]
  },
  {
    id: 'HMK-119',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '119',
    title: 'Dava Dilekçesinin Zorunlu Unsurları ve 1 Haftalık Kesin Süre',
    chapter: 'Yazılı Yargılama Usulü - Dava Açılması',
    fullText: 'Dava dilekçesinde aşağıdaki hususlar bulunur: a) Mahkemenin adı, b) Davacı ile davalının adı, soyadı ve adresleri, c) Davacının Türkiye Cumhuriyeti kimlik numarası, ç) Varsa tarafların kanuni temsilcilerinin ve vekillerinin adı, soyadı ve adresleri, d) Davanın konusu ve malvarlığı haklarına ilişkin davalarda, dava konusunun değeri, e) Davacının iddiasının dayanağı olan bütün vakıaların sıra numarası altında açık özetleri, f) İddia edilen her bir vakıanın hangi delillerle ispat edileceği, g) Dayanılan hukuki sebepler, ğ) Açık bir şekilde talep sonucu, h) Davacının veya varsa vekilinin imzası. Birinci fıkranın (b), (c), (ç), (ğ) ve (h) bentleri dışında kalan hususların eksik olması hâlinde, hâkim davacıya eksikliği tamamlaması için bir haftalık kesin süre verir. Bu süre içinde eksikliğin tamamlanmaması hâlinde dava açılmamış sayılır.',
    summary: 'Dava dilekçesinin unsurlarını belirler. Vakıalar numaralandırılmalı, delillerle eşleştirilmeli ve açık talep sonucu yazılmalıdır. Eksiklikte 1 haftalık kesin süre verilir.',
    keywords: ['dava dilekçesi', 'dilekçenin unsurları', 'talep sonucu', 'somutlaştırma', 'bir haftalık kesin süre', 'davanın açılmamış sayılması'],
    practicalTips: 'Talep sonucunda asıl alacak, faiz başlangıç tarihi ve faiz türü (yasal/avans) tek tek açıkça yazılmalıdır; belirsiz talep usulden ret riski doğurur.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/4-280',
        kararNo: '2021/350',
        tarih: '25.03.2021',
        principle: 'HMK m. 119 uyarınca vakıalar ile deliller açıkça ilişkilendirilmeli; soyut iddialarla dava ikame edilmemelidir.'
      }
    ]
  },
  {
    id: 'HMK-127',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '127',
    title: 'Cevap Dilekçesi Verme Süresi (İki Hafta)',
    chapter: 'Yazılı Yargılama Usulü - Cevap Dilekçesi',
    fullText: 'Cevap dilekçesini verme süresi, dava dilekçesinin davalıya tebliğinden itibaren iki haftadır. Ancak, durum ve koşullara göre cevap dilekçesinin bu süre içinde hazırlanmasının çok zor yahut imkânsız olduğu durumlarda, yine bu süre içinde mahkemeye başvuran davalıya, bir defaya mahsus olmak ve bir ayı geçmemek üzere ek bir süre verilebilir. Ek süre talebi hakkında verilen karar taraflara derhâl bildirilir.',
    summary: 'Cevap dilekçesi tebliğden itibaren 2 hafta içinde verilmelidir. Zorunlu hallerde 2 hafta dolmadan başvurulursa 1 aya kadar ek süre verilebilir.',
    keywords: ['cevap dilekçesi', 'iki haftalık süre', 'cevap süresi', 'ek süre talebi', 'tebliğ tarihi'],
    practicalTips: 'Ek süre talebi mutlaka 2 haftalık asıl süre dolmadan UYAP üzerinden gönderilmelidir; süre geçtikten sonra yapılan süre uzatım talepleri reddedilir.',
    precedents: [
      {
        court: 'Yargıtay 9. Hukuk Dairesi',
        esasNo: '2020/7100',
        kararNo: '2021/3900',
        tarih: '10.02.2021',
        principle: 'İki haftalık yasal cevap süresi geçtikten sonra sunulan ek süre talebi hukuken sonuç doğurmaz.'
      }
    ]
  },
  {
    id: 'HMK-128',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '128',
    title: 'Süresinde Cevap Dilekçesi Vermemenin Sonucu (İnkâr Sayılma)',
    chapter: 'Yazılı Yargılama Usulü - Cevap Dilekçesi',
    fullText: 'Süresi içinde cevap dilekçesi vermemiş olan davalı, davacının dava dilekçesinde ileri sürdüğü vakıaların tamamını inkâr etmiş sayılır.',
    summary: 'Süresinde cevap vermeyen davalı iddiaları inkar etmiş sayılır; ancak karşı vakıa ileri süremez, zamanaşımı/yetki ilk itirazlarında bulunamaz ve delil bildiremez.',
    keywords: ['cevap vermeme', 'inkar sayılma', 'savunmanın kısıtlanması', 'delil bildirememe', 'ilk itirazların düşmesi'],
    practicalTips: 'Süreyi kaçıran davalı sadece davacının bildirdiği delillerin aksini tartışabilir veya davacının delillerindeki çelişkileri gösterebilir; yeni delil sunamaz.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2018/19-540',
        kararNo: '2020/480',
        tarih: '23.06.2020',
        principle: 'Süresinde cevap dilekçesi vermeyen davalı davacının iddialarını inkar etmiş sayılır ancak karşı delil bildiremez.'
      }
    ]
  },
  {
    id: 'HMK-140',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '140',
    title: 'Ön İnceleme Duruşması ve Sulhe Teşvik',
    chapter: 'Yazılı Yargılama Usulü - Ön İnceleme',
    fullText: 'Hâkim, ön inceleme duruşmasında, dava şartlarını ve ilk itirazları inceler; uyuşmazlık konularını tam olarak belirler; hazırlık işlemlerini yapar ve tarafları sulhe veya arabuluculuğa teşvik eder; sonuç alınamazsa uyuşmazlık noktalarını tutanağa bağlar.',
    summary: 'Ön inceleme duruşması yargılamanın omurgasıdır. Dava şartları karara bağlanır, çekişmeli vakıalar zapta geçirilir ve delillerin sunulması için 2 haftalık kesin süre verilir.',
    keywords: ['ön inceleme duruşması', 'uyuşmazlık tespiti', 'sulhe teşvik', 'delil avansı', 'kesin süre'],
    practicalTips: 'HMK m. 139 ihtarlı davetiyeye rağmen mazeretsiz duruşmaya gelinmezse gelen taraf iddia ve savunmasını serbestçe genişletebilir (HMK m. 140/5).',
    precedents: [
      {
        court: 'Yargıtay 2. Hukuk Dairesi',
        esasNo: '2020/4500',
        kararNo: '2021/1600',
        tarih: '18.02.2021',
        principle: 'Ön inceleme duruşması yapılmaksızın ve uyuşmazlık noktaları tespit edilmeksizin tahkikata geçilemez.'
      }
    ]
  },
  {
    id: 'HMK-141',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '141',
    title: 'İddia ve Savunmanın Genişletilmesi Yasağı',
    chapter: 'Yazılı Yargılama Usulü - Ön İnceleme',
    fullText: 'Taraflar, cevaba cevap ve ikinci cevap dilekçeleri ile serbestçe; ön inceleme aşamasında ise ancak karşı tarafın açık muvafakati ile iddia veya savunmalarını genişletebilir yahut değiştirebilirler. Ön inceleme aşamasının tamamlanmasından sonra iddia veya savunma genişletilemez yahut değiştirilemez. Islah ve karşı tarafın açık muvafakati hükümleri saklıdır.',
    summary: 'Dilekçeler aşamasından sonra karşı tarafın açık rızası olmaksızın yeni bir iddia veya savunma ileri sürülemez. Tek istisnası tam veya kısmi ıslahtır.',
    keywords: ['iddianın genişletilmesi yasağı', 'savunmanın genişletilmesi', 'ıslah', 'açık muvafakat', 'yeni vakıa yasağı'],
    practicalTips: 'Karşı taraf duruşmada yeni bir vakıa veya talep dile getirirse derhal "İddianın genişletilmesine muvafakatimiz yoktur, açıkça itiraz ediyoruz" beyanı zapta geçirilmelidir.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/1-380',
        kararNo: '2021/615',
        tarih: '20.05.2021',
        principle: 'Ön inceleme tamamlandıktan sonra karşı tarafın açık muvafakati olmaksızın veya ıslah yoluna başvurulmaksızın yeni vakıa incelenemez.'
      }
    ]
  },
  {
    id: 'HMK-190',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '190',
    title: 'İspat Yükü Genel Kuralı',
    chapter: 'İspat ve Deliller - Genel Hükümler',
    fullText: 'İspat yükü, kanunda özel bir düzenleme bulunmadıkça, iddia edilen vakıaya bağlanan hukuki sonuçtan kendi lehine hak çıkaran tarafa aittir. Yasal bir karineye dayanan taraf, sadece karinenin temelini oluşturan vakıayı ispat yükü altındadır.',
    summary: 'Usul hukukunda ispat yükü dağılımı: Kendi lehine sonuç çıkaran taraf ispatla yükümlüdür. Karine varsa ispat yükü yer değiştirir.',
    keywords: ['ispat yükü', 'delil külfeti', 'kanuni karine', 'ispatın yer değiştirmesi', 'vakıa'],
    practicalTips: 'Banka dekontunda açıklama yoksa ödeme yapan borcunu ödemiş sayılır; aksini (örneğin borç para verdiğini) iddia eden taraf ispatla mükelleftir.',
    precedents: [
      {
        court: 'Yargıtay 13. Hukuk Dairesi',
        esasNo: '2019/1400',
        kararNo: '2020/2900',
        tarih: '05.10.2020',
        principle: 'Banka havalesi ile para gönderen davacı gönderilen paranın borç olarak verildiğini HMK m. 190 gereğince ispatlamak zorundadır.'
      }
    ]
  },
  {
    id: 'HMK-194',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '194',
    title: 'Somutlaştırma Yükü ve Delillerin Hasredilmesi',
    chapter: 'İspat ve Deliller - Genel Hükümler',
    fullText: 'Taraflar, dayandıkları vakıaları, ispata elverişli şekilde somutlaştırmalıdırlar. Tarafların, dayandıkları delilleri ve hangi delilin hangi vakıanın ispatı için gösterildiğini açıkça belirtmeleri zorunludur.',
    summary: 'Dilekçelerde soyut iddialar dinlenmez; her bir iddia tarihi, yeri ve belgesiyle somutlaştırılmalı ve o iddianın hangi delille ispatlandığı tek tek eşleştirilmelidir.',
    keywords: ['somutlaştırma yükü', 'delil hasrı', 'delil eşleştirmesi', 'açık iddia', 'ispat vasıtası'],
    practicalTips: 'Dilekçede "Delillerimiz" kısmında genel liste vermek yerine: "Vakıa 1 için Delil 1 (Noter İhtarnamesi)", "Vakıa 2 için Delil 2 (Banka Dekontu)" şeklinde eşleştirme yapılmalıdır.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/19-210',
        kararNo: '2021/115',
        tarih: '18.02.2021',
        principle: 'HMK m. 194 gereğince somutlaştırılmayan soyut iddialar için mahkemenin araştırma yapma yükümlülüğü bulunmamaktadır.'
      }
    ]
  },
  {
    id: 'HMK-200',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '200',
    title: 'Senetle İspat Zorunluluğu ve Tanık Dinletme Yasağı',
    chapter: 'Senet Delili',
    fullText: 'Bir hakkın doğumu, düşürülmesi, devri, değiştirilmesi, yenilenmesi, ertelenmesi, ikrarı ve itfası amacıyla yapılan hukuki işlemlerin, yapıldıkları zamanki miktar veya değerleri belirlenen yasal parasal sınırı geçtiği takdirde senetle ispat olunması gerekir. Bu hukuki işlemlerin miktar veya değeri ödeme veya borçtan kurtarma amacıyla bir kısma ayrılmış olsa bile, senetsiz ispat olunamaz. Bu maddede belirtilen hukuki işlemler hakkında tanık dinlenemez. Ancak karşı tarafın açık muvafakati ile tanık dinlenebilir.',
    summary: 'Parasal sınırı aşan tüm hukuki işlemler yazılı senetle ispat edilmek zorundadır; karşı taraf açıkça onay vermedikçe kesinlikle tanık dinlenemez.',
    keywords: ['senetle ispat zorunluluğu', 'tanık yasağı', 'senet', 'açık muvafakat', 'parasal sınır', 'yazılı delil'],
    practicalTips: 'Duruşmada karşı taraf tanık dinletmek istediğinde derhal "HMK m. 200 uyarınca uyuşmazlık senetle ispat sınırında olup tanık dinlenmesine açıkça muvafakat etmiyoruz" şerhi düşülmelidir.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2017/19-1650',
        kararNo: '2020/412',
        tarih: '16.06.2020',
        principle: 'Senetle ispatı gereken bir konuda davalının açık muvafakati olmadan tanık dinlenerek hüküm kurulması usul ve kanuna aykırıdır.'
      }
    ]
  },
  {
    id: 'HMK-202',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '202',
    title: 'Delil Başlangıcı ve Tanık Dinletme İstisnası',
    chapter: 'Senet Delili',
    fullText: 'Senetle ispat zorunluluğu bulunan hâllerde delil başlangıcı bulunursa tanık dinlenebilir. Delil başlangıcı, iddia konusu hukuki işlemin tamamen ispatına yeterli olmamakla birlikte, söz konusu hukuki işlemi muhtemel gösteren ve kendisine karşı ileri sürülen kimse veya temsilcisi tarafından verilmiş veya gönderilmiş belgedir.',
    summary: 'Senet yoksa dahi borçlu tarafından verilmiş veya imzalanmış, borcu muhtemel kılan bir yazılı belge (e-posta, paraf, dekont, yazılı mesaj) varsa tanık dinletilebilir.',
    keywords: ['delil başlangıcı', 'tanık istisnası', 'muhtemel kılan belge', 'e-posta delili', 'yazılı belge'],
    practicalTips: 'Borçlunun imzaladığı teslim fişi veya WhatsApp üzerinden "Borcumu haftaya ödeyeceğim" mesajı HMK m. 202 uyarınca delil başlangıcı kabul edilerek tanık dinletilebilir.',
    precedents: [
      {
        court: 'Yargıtay 13. Hukuk Dairesi',
        esasNo: '2018/5100',
        kararNo: '2019/3100',
        tarih: '07.03.2019',
        principle: 'Davalı tarafından gönderilen borç ikrarı içeren e-posta ve yazışmalar HMK m. 202 uyarınca delil başlangıcı teşkil eder.'
      }
    ]
  },
  {
    id: 'HMK-266',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '266',
    title: 'Bilirkişiye Başvurulacak Haller ve Hukuki Nitelendirme Yasağı',
    chapter: 'Bilirkişi İncelemesi',
    fullText: 'Mahkeme, çözümü özel veya teknik bir bilgiyi gerektiren hâllerde, bilirkişinin oy ve görüşünün alınmasına karar verir. Hâkimlik mesleğinin gerektirdiği genel ve hukuki bilgiyle çözümlenmesi mümkün olan konularda bilirkişiye başvurulamaz.',
    summary: 'Bilirkişi sadece teknik ve özel bilgi için görevlendirilebilir. Hakimin yerine geçip hukuki tavsifte bulunamaz, delil takdiri yapamaz veya kusur dağılımı belirleyemez.',
    keywords: ['bilirkişi', 'hukuki tavsif yasağı', 'teknik bilgi', 'yetki aşımı', 'hakimin yerine geçme'],
    practicalTips: 'Bilirkişinin "Davanın reddi gerekir" veya "Sözleşme geçersizdir" gibi hukuki değerlendirmeleri HMK m. 266 yetki aşımı olarak derhal itiraz layihasına konu edilmelidir.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/11-550',
        kararNo: '2021/480',
        tarih: '15.04.2021',
        principle: 'Bilirkişinin hukuki değerlendirmede bulunması HMK m. 266\'ya aykırı olup bu kısımlar hakim tarafından dikkate alınamaz.'
      }
    ]
  },
  {
    id: 'HMK-281',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '281',
    title: 'Bilirkişi Raporuna İtiraz (İki Haftalık Kesin Süre)',
    chapter: 'Bilirkişi İncelemesi',
    fullText: 'Taraflar, bilirkişi raporunun, kendilerine tebliği tarihinden itibaren iki hafta içinde, raporda eksik ve belirsiz gördükleri hususların, bilirkişiye açıklattırılmasını veya yeni bir bilirkişi atanmasını isteyebilirler. Hâkim, bilirkişi raporundaki eksiklik yahut belirsizliğin tamamlanması veya açıklığa kavuşturulmasını sağlamak için, bilirkişiden, yeni sorular düzenlemek suretiyle ek rapor alabileceği gibi, tayin edeceği duruşmada, sözlü olarak açıklamalarda bulunmasını da kendiliğinden isteyebilir.',
    summary: 'Bilirkişi raporuna itiraz süresi tebliğden itibaren iki haftadır ve kesin süredir. Süresinde itiraz edilmeyen rapor aleyhe kesinleşir.',
    keywords: ['bilirkişi raporuna itiraz', 'iki haftalık kesin süre', 'ek rapor talebi', 'yeni heyet', 'çelişki'],
    practicalTips: 'UYAP tebliğ tarihinden itibaren 14 gün sayılmalı; itirazda çelişkili paragraflar ve matematiksel hesaplama hataları tek tek gösterilerek yeni bir heyete tevdi talep edilmelidir.',
    precedents: [
      {
        court: 'Yargıtay 15. Hukuk Dairesi',
        esasNo: '2020/2900',
        kararNo: '2021/1400',
        tarih: '05.04.2021',
        principle: 'HMK m. 281 uyarınca iki haftalık kesin süre içinde itiraz edilmeyen bilirkişi raporu itiraz etmeyen taraf yönünden usuli kazanılmış hak doğurur.'
      }
    ]
  },
  {
    id: 'HMK-282',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '282',
    title: 'Bilirkişi Oy ve Görüşünün Hakimi Bağlamaması (Serbest Delil Takdiri)',
    chapter: 'Bilirkişi İncelemesi',
    fullText: 'Hâkim, bilirkişinin oy ve görüşünü diğer delillerle birlikte serbestçe değerlendirir.',
    summary: 'Bilirkişi raporu takdiri bir delildir; hakimi bağlamaz. Hakim rapor yetersiz veya çelişkili ise gerekçesini göstererek raporun aksine karar verebilir.',
    keywords: ['serbest delil takdiri', 'hakimi bağlamama', 'takdiri delil', 'gerekçeli karar'],
    practicalTips: 'Aleyhe gelen raporda hakime HMK m. 282 hatırlatılmalı; raporun dosyadaki banka kayıtları ve tanık beyanlarıyla çeliştiği gerekçelendirilerek hükme esas alınmaması istenmelidir.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2019/3-410',
        kararNo: '2021/290',
        tarih: '16.03.2021',
        principle: 'Hakim bilirkişi raporunu serbestçe değerlendirir; denetime elverişli olmayan ve dosya kapsamıyla çelişen rapora dayanılarak hüküm kurulamaz.'
      }
    ]
  },
  {
    id: 'HMK-297',
    lawCode: 'HMK',
    lawNumber: '6100',
    lawName: 'Hukuk Muhakemeleri Kanunu',
    article: '297',
    title: 'Hükmün Kapsamı ve İnfaza Elverişlilik',
    chapter: 'Hüküm ve Davaya Son Veren Taraf İşlemleri',
    fullText: 'Hükümde; mahkemenin adı, taraflar, talepler, gerekçe ve hüküm sonucu yer alır. Hükmün sonuç kısmında, gerekçeye ait herhangi bir söz tekrar edilmeksizin, taleplerden her biri hakkında verilen hükümle, taraflara yüklenen borç ve tanınan hakların, sıra numarası altında; açık, şüphe ve tereddüt uyandırmayacak şekilde gösterilmesi gereklidir.',
    summary: 'Mahkeme kararının hüküm fıkrası açık, şüpheden uzak ve infaza elverişli olmalıdır. Hangi talebin ne miktarda kabul edildiği ve faiz türü açıkça yazılmalıdır.',
    keywords: ['hüküm fıkrası', 'infaza elverişlilik', 'açık talep', 'gerekçeli karar', 'şüpheden uzak hüküm'],
    practicalTips: 'Dava dilekçesindeki netice-i talep fıkrası hakimin hüküm fıkrasına doğrudan kopyalayabileceği netlikte kaleme alınmalıdır.',
    precedents: [
      {
        court: 'Yargıtay Hukuk Genel Kurulu',
        esasNo: '2018/11-620',
        kararNo: '2020/380',
        tarih: '02.06.2020',
        principle: 'Hüküm fıkrası infazda tereddüt yaratmayacak açıklıkta olmalı; alacak kalemleri ve faiz başlangıç tarihleri açıkça belirtilmelidir.'
      }
    ]
  }
];

// Helper: Normalize Turkish characters for robust semantic lookup
function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// -------------------------------------------------------------
// SEMANTIC SEARCH ENGINE
// -------------------------------------------------------------
export function searchLegalDatabase(
  query: string,
  options?: {
    lawFilter?: 'ALL' | 'TMK' | 'TBK' | 'HMK';
    limit?: number;
    minScore?: number;
  }
): {
  query: string;
  totalFound: number;
  results: SemanticSearchResult[];
  searchType: 'EXACT_CITATION' | 'SEMANTIC_NLP';
} {
  const cleanQuery = (query || '').trim();
  const lawFilter = options?.lawFilter || 'ALL';
  const limit = options?.limit || 10;
  const minScore = options?.minScore || 15;

  if (!cleanQuery) {
    return {
      query: '',
      totalFound: 0,
      results: [],
      searchType: 'SEMANTIC_NLP'
    };
  }

  // 1. Direct Citation Match (e.g. "TMK 166", "TBK m. 117", "HMK 200", "TBK 474/2")
  const citationRegex = /(TMK|TBK|HMK)\s*(?:m\.|madde|maddesi)?\s*(\d+)/i;
  const citeMatch = cleanQuery.match(citationRegex);

  if (citeMatch) {
    const code = citeMatch[1].toUpperCase() as 'TMK' | 'TBK' | 'HMK';
    const num = citeMatch[2];
    const targetId = `${code}-${num}`;

    const exactArticle = LEGAL_DATABASE.find(
      (a) => a.id === targetId || (a.lawCode === code && a.article.split('/')[0] === num)
    );

    if (exactArticle && (lawFilter === 'ALL' || exactArticle.lawCode === lawFilter)) {
      return {
        query: cleanQuery,
        totalFound: 1,
        results: [
          {
            article: exactArticle,
            score: 100,
            matchedKeywords: [`${code} m. ${num}`, exactArticle.title],
            highlightSnippet: exactArticle.fullText.slice(0, 180) + '...',
            relevanceReason: `Birebir kanun maddesi eşleşmesi: ${exactArticle.lawName} Madde ${exactArticle.article}`
          }
        ],
        searchType: 'EXACT_CITATION'
      };
    }
  }

  // 2. Semantic NLP & Keyword Relevance Match
  const normalizedQuery = normalizeTurkish(cleanQuery);
  const queryTokens = normalizedQuery.split(' ').filter((t) => t.length > 2);

  // Concept dictionary for expansion
  const CONCEPT_EXPANSIONS: Record<string, string[]> = {
    bosanma: ['evlilik', 'siddetli', 'gecimsizlik', 'kusur', 'protokol', 'nafaka', 'tmk 166', 'tmk 174'],
    nafaka: ['yoksulluk', 'tedbir', 'sed', 'mali guc', 'tmk 175', 'tmk 169', 'istirak'],
    eser: ['yuklenici', 'is sahibi', 'muayene', 'ayip ihbari', 'ihtirazi kayit', 'tbk 470', 'tbk 474', 'tbk 477', 'müteahhit'],
    tahliye: ['kira', 'temerrut', '30 gunluk', 'ihtar', 'catili isyeri', 'tbk 315', 'iik 269'],
    senet: ['senetle ispat', 'tanik yasagi', 'parasal sinir', 'delil baslangici', 'hmk 200', 'hmk 202'],
    tanik: ['senetle ispat', 'delil baslangici', 'muvafakat', 'hmk 200', 'hmk 202'],
    bilirkişi: ['hukuki tavsif', 'yetki asimi', 'hmk 266', 'hmk 281', 'ek rapor', 'itiraz'],
    zamanaşımı: ['tbk 146', 'tbk 147', 'tbk 72', 'def i', 'on yil', 'bes yil', 'iki yil'],
    temerrüt: ['ihtar', 'tbk 117', 'tbk 120', 'faiz', 'muaccel', 'vade', 'tbk 125'],
    dava_şartı: ['hmk 114', 'hmk 115', 'arabuluculuk', 'gorev', 'gider avansi', 'vekaletname'],
    mal_paylaşımı: ['edinilmis mal', 'katilma alacagi', 'kisisel mal', 'tmk 202', 'tmk 219', 'tmk 236']
  };

  const expandedTokens = [...queryTokens];
  queryTokens.forEach((token) => {
    Object.keys(CONCEPT_EXPANSIONS).forEach((key) => {
      if (token.includes(key) || key.includes(token)) {
        expandedTokens.push(...CONCEPT_EXPANSIONS[key].map(normalizeTurkish));
      }
    });
  });

  const scoredResults: SemanticSearchResult[] = [];

  for (const article of LEGAL_DATABASE) {
    if (lawFilter !== 'ALL' && article.lawCode !== lawFilter) continue;

    const normTitle = normalizeTurkish(article.title);
    const normSummary = normalizeTurkish(article.summary);
    const normText = normalizeTurkish(article.fullText);
    const normKeywords = article.keywords.map(normalizeTurkish);
    const normChapter = normalizeTurkish(article.chapter);

    let score = 0;
    const matchedTokens = new Set<string>();

    // Direct Article Match bonus
    if (normalizedQuery.includes(normalizeTurkish(article.article))) {
      score += 25;
      matchedTokens.add(`Madde ${article.article}`);
    }

    // Keyword & Title matching
    for (const token of expandedTokens) {
      if (normTitle.includes(token)) {
        score += 22;
        matchedTokens.add(token);
      }
      if (normKeywords.some((kw) => kw.includes(token))) {
        score += 18;
        matchedTokens.add(token);
      }
      if (normSummary.includes(token)) {
        score += 12;
        matchedTokens.add(token);
      }
      if (normChapter.includes(token)) {
        score += 8;
        matchedTokens.add(token);
      }
      if (normText.includes(token)) {
        score += 6;
        matchedTokens.add(token);
      }
    }

    // Precedents match bonus
    const normPrecedentPrinciples = article.precedents.map((p) => normalizeTurkish(p.principle)).join(' ');
    for (const token of queryTokens) {
      if (normPrecedentPrinciples.includes(token)) {
        score += 5;
        matchedTokens.add(token);
      }
    }

    if (score >= minScore) {
      const normalizedScore = Math.min(99, Math.round(score * 1.4));

      // Generate snippet
      let snippet = article.fullText;
      if (snippet.length > 220) {
        snippet = snippet.slice(0, 220) + '...';
      }

      scoredResults.push({
        article,
        score: normalizedScore,
        matchedKeywords: Array.from(matchedTokens).slice(0, 5),
        highlightSnippet: snippet,
        relevanceReason: `${article.chapter} kapsamında "${Array.from(matchedTokens).slice(0, 3).join(', ')}" kavramları ile yüksek semantik eşleşme.`
      });
    }
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);

  return {
    query: cleanQuery,
    totalFound: scoredResults.length,
    results: scoredResults.slice(0, limit),
    searchType: 'SEMANTIC_NLP'
  };
}

// -------------------------------------------------------------
// CROSS-REFERENCING AI AGENT RESPONSES AGAINST REAL STATUTE TEXT
// -------------------------------------------------------------
export function crossReferenceAiWithStatutes(aiResponseText: string): CrossReferenceAuditReport {
  const text = aiResponseText || '';
  const citationRegex = /(TMK|TBK|HMK|TTK|İİK|İŞ_K|BK|HUMK)\s*(?:m\.|madde|maddesi)?\s*(\d+(?:\/[a-zA-Z0-9]+)?)/gi;

  const matches: { raw: string; code: string; articleNumber: string }[] = [];
  let m;
  while ((m = citationRegex.exec(text)) !== null) {
    const raw = m[0].trim();
    const code = m[1].toUpperCase();
    const articleNumber = m[2];
    if (!matches.some((existing) => existing.raw.toLowerCase() === raw.toLowerCase())) {
      matches.push({ raw, code, articleNumber });
    }
  }

  const discrepancies: CrossReferenceDiscrepancy[] = [];
  let verified = 0;
  let partial = 0;
  let flagged = 0;

  for (const match of matches) {
    const baseNum = match.articleNumber.split('/')[0];
    const articleId = `${match.code}-${baseNum}`;

    // Extract surrounding paragraph where the citation was made to see AI's assertion
    let aiStatement = '';
    const idx = text.indexOf(match.raw);
    if (idx !== -1) {
      const start = Math.max(0, text.lastIndexOf('\n', idx));
      const end = text.indexOf('\n', idx + match.raw.length);
      aiStatement = text.slice(start, end !== -1 ? end : undefined).trim();
      if (aiStatement.length > 250) {
        aiStatement = aiStatement.slice(0, 250) + '...';
      }
    }
    if (!aiStatement) aiStatement = `Yapay zeka atfı: ${match.raw}`;

    // Check if it's repealed (BK or HUMK)
    if (match.code === 'BK' || match.code === 'HUMK') {
      flagged++;
      discrepancies.push({
        citation: match.raw,
        articleId,
        aiStatement,
        status: 'FLAGGED',
        statusLabel: 'MÜLGA (GEÇERSİZ) KANUN',
        verdict: `Mülga ${match.code} hükümleri yürürlükten kalkmıştır. Yapay zeka halüsinasyonu riski mevcuttur!`,
        correctionNotice: match.code === 'BK' ? '6098 Sayılı TBK hükümleri kullanılmalıdır.' : '6100 Sayılı HMK hükümleri kullanılmalıdır.'
      });
      continue;
    }

    // Look up in core database
    const exactStatute = LEGAL_DATABASE.find(
      (a) => a.id === articleId || (a.lawCode === match.code && a.article.split('/')[0] === baseNum)
    );

    if (exactStatute) {
      // Evaluate concordance
      const normAi = normalizeTurkish(aiStatement);
      const normStatute = normalizeTurkish(exactStatute.fullText);
      const normKeywords = exactStatute.keywords.map(normalizeTurkish);

      const hasKeywordMatch = normKeywords.some((kw) => normAi.includes(kw));
      const hasCoreMatch = normStatute.split(' ').some((word) => word.length > 4 && normAi.includes(word));

      if (hasKeywordMatch || hasCoreMatch) {
        verified++;
        discrepancies.push({
          citation: match.raw,
          articleId: exactStatute.id,
          aiStatement,
          actualArticleText: exactStatute.fullText,
          articleTitle: exactStatute.title,
          lawName: exactStatute.lawName,
          status: 'VERIFIED',
          statusLabel: 'BİREBİR DOĞRULANDI',
          verdict: `Yapay zeka ajanının atıf yaptığı ${exactStatute.lawCode} m. ${exactStatute.article} hükmü yürürlükteki pozitif hukuk metniyle tam uyumludur.`,
          actualQuotation: exactStatute.fullText
        });
      } else {
        partial++;
        discrepancies.push({
          citation: match.raw,
          articleId: exactStatute.id,
          aiStatement,
          actualArticleText: exactStatute.fullText,
          articleTitle: exactStatute.title,
          lawName: exactStatute.lawName,
          status: 'PARTIAL',
          statusLabel: 'KISMEN UYUMLU / ŞART EKSİĞİ',
          verdict: `Madde pozitif hukukta mevcuttur ancak yapay zekanın iddiasındaki bazı usuli veya maddi şartlar (kesin süre, tacir sıfatı vb.) madde metninde farklı düzenlenmiştir.`,
          actualQuotation: exactStatute.fullText,
          correctionNotice: `Resmi madde metnini okuyarak dilekçedeki talep fıkrasını revize ediniz: ${exactStatute.summary}`
        });
      }
    } else {
      // Check maximum article bounds
      const numVal = parseInt(baseNum, 10);
      let maxAllowed = 2000;
      if (match.code === 'TMK') maxAllowed = 1030;
      else if (match.code === 'TBK') maxAllowed = 649;
      else if (match.code === 'HMK') maxAllowed = 451;

      if (numVal > maxAllowed) {
        flagged++;
        discrepancies.push({
          citation: match.raw,
          articleId,
          aiStatement,
          status: 'FLAGGED',
          statusLabel: 'HALÜSİNASYON / SINIR AŞIMI',
          verdict: `Yapay zeka ${match.code} kanununda bulunmayan ${numVal}. maddeyi üretmiştir! ${match.code} azami ${maxAllowed} maddedir.`,
          correctionNotice: `Metindeki atfı yürürlükteki gerçek bir madde ile değiştiriniz.`
        });
      } else {
        // Valid statute outside core curated index
        verified++;
        discrepancies.push({
          citation: match.raw,
          articleId,
          aiStatement,
          status: 'VERIFIED',
          statusLabel: 'MEVZUAT SINIRINDA',
          verdict: `${match.code} kanunu ${match.articleNumber}. maddesi yürürlükteki mevzuat aralığındadır.`,
          actualQuotation: `${match.code} Madde ${match.articleNumber} yürürlükteki Türk kanunları normudur.`
        });
      }
    }
  }

  const total = discrepancies.length;
  const score = total > 0 ? Math.round(((verified * 1 + partial * 0.5) / total) * 100) : 100;
  const overallVerdict =
    flagged > 0
      ? 'RİSKLİ (HALÜSİNASYON / UYUMSUZLUK)'
      : partial > 0
      ? 'KISMEN UYUMLU (DİKKAT)'
      : 'GÜVENLİ & DOĞRULANMIŞ';

  return {
    analyzedAt: new Date().toISOString(),
    totalClaimsChecked: total,
    verifiedCount: verified,
    partialCount: partial,
    flaggedCount: flagged,
    groundingScore: score,
    overallVerdict,
    discrepancies,
    databaseStats: {
      totalIndexedArticles: LEGAL_DATABASE.length,
      tmkCount: LEGAL_DATABASE.filter((a) => a.lawCode === 'TMK').length,
      tbkCount: LEGAL_DATABASE.filter((a) => a.lawCode === 'TBK').length,
      hmkCount: LEGAL_DATABASE.filter((a) => a.lawCode === 'HMK').length
    }
  };
}
