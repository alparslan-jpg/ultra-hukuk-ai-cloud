const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `Aşağıdaki JSON şemasında SADECE geçerli bir JSON çıktısı üret (markdown veya ek metin olmasın):
{
  "davaOzeti": "string (Davanın somut özeti)",
  "davaTuru": "string (Hukuki niteleme)",
  "gorevliYetkiliMahkeme": "string (Örn: İstanbul Anadolu 4. Asliye Ticaret Mahkemesi)",
  "kazanmaIhtimali": number (0 ile 100 arası),
  "hukukiTeshis": "string (Temel hukuki değerlendirme)",
  "kritikVakialar": ["Vakıa 1", "Vakıa 2"],
  "iddiaVeSavunmaKurgusu": {
    "davaciIddialari": ["İddia 1", "İddia 2"],
    "davaliSavunmalari": ["Savunma 1", "Savunma 2"],
    "defilerVeItirazlar": ["Zamanaşımı, yetki veya derdestlik itirazı"]
  },
  "delilVeEvrakDenetimi": {
    "gucluDeliller": ["Delil 1"],
    "zayifVeyaKuskuluDeliller": ["Eksik veya şüpheli delil"],
    "senetleIspatKuraliHMK200": "string (HMK 200 senetle ispat sınırının somut olaya etkisi)",
    "mikroAyrintilarVeEksikler": ["Mikro detay 1: İhtirazi kayıt / imza / tebliğ şerhi"]
  },
  "usuliTuzaklarVeRiskler": {
    "zamanasimiRiski": "string (TBK veya TTK zamanaşımı durumu)",
    "hakDusurucuSureler": ["Süre 1", "Süre 2"],
    "gorevYetkiSorunu": "string",
    "davaSartiEksiklikleri": ["Arabuluculuk tutanağı, gider avansı vb."]
  },
  "derinHukukiMuhakeme": {
    "doktrinVeYargitayIctihati": "string (İlgili Yargıtay dairesi yaklaşımı)",
    "seytaninAvukatiKarsiTaarruz": ["Karşı tarafın en tehlikeli hamlesi ve buna karşı kalkan"],
    "stratejikEylemPlani": ["1. Adım", "2. Adım", "3. Adım"],
    "hakimNazarindaSonucTahmini": "string"
  },
  "kanunMaddeleriAtiflari": ["HMK m. 200", "TBK m. 117"]
}`;

const replacementStr = `ÖNEMLİ KURAL: Tüm dosyaları tek tek analiz et. Derin Akıl (Pro) seçildiğinde çok detaylı, Hızlı (Flash) seçildiğinde kısa sürede sonuçlandır. Ancak her iki durumda da Ajan Konseyinin 4 uzman ajanının tespitlerini ayrı ayrı raporla ve EN SONDA Baş Avukat olarak her şeyi toparla, açık noktaları ve ilişkileri çok detaylı analiz raporu halinde yaz.

Aşağıdaki JSON şemasında SADECE geçerli bir JSON çıktısı üret (markdown veya ek metin olmasın):
{
  "usulSuresiAjaniRaporu": {
    "gorevliYetkiliMahkeme": "string",
    "arabuluculukDavaSarti": "string",
    "zamanasimiVeHakDusurucuSureler": ["string"],
    "hmkUyarisiVeAcilAdimlar": ["string"]
  },
  "yargitayEmsalAjaniRaporu": {
    "benzerVakialardaYargitayYaklasimi": "string",
    "hgkDaiveBamIlkeKararlari": ["string"],
    "leheVeAleyheEmsalKarsilastirmasi": "string"
  },
  "seytaninAvukatiRaporu": {
    "karsiTarafNeYapar": "string",
    "dosyadakiZayifHalkalarVeAciklar": ["string"],
    "delilCeliskiVeRiskleri": ["string"],
    "karsiSavunmaStratejisi": "string"
  },
  "dilekceMimariRaporu": {
    "uyapNeticeiTalepOnerisi": "string",
    "tensipVeMuzekkereTalepleri": ["string"],
    "dilekceKurgusuHiyerarsisi": ["string"]
  },
  "basHukukMusaviriSentezi": {
    "davaOzetiVeTeshis": "string",
    "tumAjanlarinVerileriniBirlestirenDerinAnaliz": "string (Burada her dosyayı tek tek sentezleyip açıkları bulan DEVASA ve ÇOK DETAYLI hukuki muhakeme metni olsun)",
    "kazanmaIhtimali": number (0 ile 100 arası),
    "stratejikYolHaritasiVurgusu": "string"
  }
}`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content, 'utf8');
console.log('Done replacing JSON schema.');
