/**
 * Ultra Hukuk AI — Finans, Faiz, AAÜT ve HMK 200 Parasal Sınır Hesaplama Motoru
 * TBB Avukatlık Asgari Ücret Tarifesi (AAÜT), 3095 Sayılı Faiz Kanunu,
 * 6100 Sayılı HMK Senetle İspat ve İstinaf/Temyiz Sınırları Hesaplayıcısı.
 */

// 1. AAÜT (Avukatlık Asgari Ücret Tarifesi) Barem Dilimleri (2025-2026 Dönemi)
export interface AautDilim {
  ustLimit: number;
  oran: number; // yüzde
}

export const AAUT_NISPI_DILIMLER: AautDilim[] = [
  { ustLimit: 400000, oran: 16.0 },   // İlk 400.000 TL için %16
  { ustLimit: 800000, oran: 15.0 },   // Sonraki 400.000 TL için %15
  { ustLimit: 1600000, oran: 14.0 },  // Sonraki 800.000 TL için %14
  { ustLimit: 3200000, oran: 11.0 },  // Sonraki 1.600.000 TL için %11
  { ustLimit: 6400000, oran: 8.0 },   // Sonraki 3.200.000 TL için %8
  { ustLimit: 12800000, oran: 5.0 },  // Sonraki 6.400.000 TL için %5
  { ustLimit: Infinity, oran: 2.0 }   // 12.800.000 TL'den yukarısı için %2
];

export const MAKTU_UCRETLER = {
  sulhHukuk: 18000,
  asliyeHukuk: 30000,
  asliyeTicaret: 30000,
  isMahkemesi: 24000,
  icraTakip: 9000,
  istinafDurusmali: 24000,
  temyizDurusmali: 36000
};

/**
 * Dava Değeri Üzerinden Nispi Karşı Vekalet / Avukatlık Ücreti Hesabı
 */
export function calculateAautNispi(davaDegeri: number, mahkemeTuru: keyof typeof MAKTU_UCRETLER = 'asliyeHukuk'): {
  hesaplananUcret: number;
  maktuAsgariUcret: number;
  nihaiUcret: number;
  dilimAciklamalari: string[];
} {
  const maktu = MAKTU_UCRETLER[mahkemeTuru] || 30000;
  if (davaDegeri <= 0) {
    return {
      hesaplananUcret: 0,
      maktuAsgariUcret: maktu,
      nihaiUcret: maktu,
      dilimAciklamalari: ['Dava değeri girilmediği için maktu ücret uygulanır.']
    };
  }

  let kalan = davaDegeri;
  let toplam = 0;
  let oncekiLimit = 0;
  const aciklamalar: string[] = [];

  for (const dilim of AAUT_NISPI_DILIMLER) {
    const dilimKapasite = dilim.ustLimit - oncekiLimit;
    const islenecekTutar = Math.min(kalan, dilimKapasite);

    if (islenecekTutar > 0) {
      const dilimTutar = (islenecekTutar * dilim.oran) / 100;
      toplam += dilimTutar;
      aciklamalar.push(`${islenecekTutar.toLocaleString('tr-TR')} TL için %${dilim.oran} = ${dilimTutar.toLocaleString('tr-TR')} TL`);
      kalan -= islenecekTutar;
    }

    if (kalan <= 0) break;
    oncekiLimit = dilim.ustLimit;
  }

  // Tarife Kuralı: Nispi vekalet ücreti, maktu vekalet ücretinden az olamaz (ancak dava değerini de geçemez)
  const nihai = Math.min(davaDegeri, Math.max(toplam, maktu));

  return {
    hesaplananUcret: Math.round(toplam * 100) / 100,
    maktuAsgariUcret: maktu,
    nihaiUcret: Math.round(nihai * 100) / 100,
    dilimAciklamalari: aciklamalar
  };
}

// 2. 3095 Sayılı Faiz Kanunu (Yasal ve Ticari Avans Faiz Hesabı)
export interface FaizHesapParametreleri {
  anaPara: number;
  baslangicTarihi: string; // YYYY-MM-DD
  bitisTarihi: string; // YYYY-MM-DD
  faizTuru: 'yasal' | 'ticari_avans' | 'mevduat';
}

export function calculateFaiz(params: FaizHesapParametreleri): {
  anaPara: number;
  gunSayisi: number;
  uygulananYillikOran: number;
  toplamFaiz: number;
  toplamAlacak: number;
  gunlukFaiz: number;
} {
  const d1 = new Date(params.baslangicTarihi);
  const d2 = new Date(params.bitisTarihi);

  const diffTime = Math.max(0, d2.getTime() - d1.getTime());
  const gunSayisi = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 3095 s. Kanun Güncel Oranları: Yasal Faiz %24, Ticari Avans %48
  let yillikOran = 24.0;
  if (params.faizTuru === 'ticari_avans') {
    yillikOran = 48.0;
  } else if (params.faizTuru === 'mevduat') {
    yillikOran = 50.0;
  }

  // Faiz = (Ana Para * Yıllık Oran * Gün Sayısı) / 36500
  const faiz = (params.anaPara * yillikOran * gunSayisi) / 36500;
  const gunlukFaiz = (params.anaPara * yillikOran) / 36500;

  return {
    anaPara: params.anaPara,
    gunSayisi,
    uygulananYillikOran: yillikOran,
    toplamFaiz: Math.round(faiz * 100) / 100,
    toplamAlacak: Math.round((params.anaPara + faiz) * 100) / 100,
    gunlukFaiz: Math.round(gunlukFaiz * 100) / 100
  };
}

// 3. Serbest Meslek Makbuzu (SMM) Hesaplayıcı
export function calculateSmm(tutar: number, kdvOrani: number = 20, stopajOrani: number = 20, hesapTuru: 'brutten' | 'netten' = 'brutten') {
  let brut = 0;
  let stopaj = 0;
  let netUcret = 0;
  let kdv = 0;
  let tahsilEdilen = 0;

  if (hesapTuru === 'brutten') {
    brut = tutar;
    stopaj = (brut * stopajOrani) / 100;
    netUcret = brut - stopaj;
    kdv = (brut * kdvOrani) / 100;
    tahsilEdilen = netUcret + kdv;
  } else {
    // Net ücretten brüte gitme
    brut = tutar / (1 - stopajOrani / 100);
    stopaj = brut - tutar;
    netUcret = tutar;
    kdv = (brut * kdvOrani) / 100;
    tahsilEdilen = netUcret + kdv;
  }

  return {
    brutUcret: Math.round(brut * 100) / 100,
    stopajTutari: Math.round(stopaj * 100) / 100,
    netUcret: Math.round(netUcret * 100) / 100,
    kdvTutari: Math.round(kdv * 100) / 100,
    tahsilEdilenToplam: Math.round(tahsilEdilen * 100) / 100
  };
}

// 4. Yıllara Göre HMK m. 200 ve Parasal Sınırlar Tablosu
export const HMK_PARASAL_SINIRLAR = [
  { yil: 2026, senetleIspatSiniri: 45000, istinafKesinlikSiniri: 42000, temyizKesinlikSiniri: 580000 },
  { yil: 2025, senetleIspatSiniri: 33720, istinafKesinlikSiniri: 31250, temyizKesinlikSiniri: 418000 },
  { yil: 2024, senetleIspatSiniri: 23430, istinafKesinlikSiniri: 21210, temyizKesinlikSiniri: 284000 },
  { yil: 2023, senetleIspatSiniri: 14800, istinafKesinlikSiniri: 13500, temyizKesinlikSiniri: 181000 }
];

export function checkHmk200(davaMiktari: number, yil: number = 2026): {
  isSenetZorunlu: boolean;
  sinirTutari: number;
  aciklama: string;
} {
  const row = HMK_PARASAL_SINIRLAR.find(r => r.yil === yil) || HMK_PARASAL_SINIRLAR[0];
  const isZorunlu = davaMiktari > row.senetleIspatSiniri;

  return {
    isSenetZorunlu: isZorunlu,
    sinirTutari: row.senetleIspatSiniri,
    aciklama: isZorunlu
      ? `Uyuşmazlık tutarı (${davaMiktari.toLocaleString('tr-TR')} TL), ${yil} yılı HMK m. 200 senetle ispat sınırını (${row.senetleIspatSiniri.toLocaleString('tr-TR')} TL) AŞMAKTADIR. İspat ancak senet (yazılı delil) ile mümkündür; karşı tarafın açık rızası olmaksızın tanık dinlenemez!`
      : `Uyuşmazlık tutarı (${davaMiktari.toLocaleString('tr-TR')} TL), ${yil} yılı senetle ispat sınırının (${row.senetleIspatSiniri.toLocaleString('tr-TR')} TL) altındadır; tanık ve her türlü takdiri delille ispat caizdir.`
  };
}
