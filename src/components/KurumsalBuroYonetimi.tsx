import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  Users,
  Calendar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  FileText,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Printer,
  ChevronRight,
  Calculator,
  Briefcase,
  AlertTriangle,
  Scale,
  FolderOpen,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export interface KurumsalBuroYonetimiProps {
  lawyerName?: string;
  lawyerSicilNo?: string;
  onNavigateToPetitions?: () => void;
}

// Financial Transaction Record
interface FinansKaydi {
  id: string;
  tarih: string;
  tur: 'tahsilat' | 'masraf' | 'avans' | 'smm';
  kategori: string;
  aciklama: string;
  muvekkilAdi: string;
  dosyaNo: string;
  tutar: number;
  paraBirimi: 'TRY' | 'USD' | 'EUR';
  durum: 'tamamlandi' | 'beklemede' | 'iptal';
}

// Client CRM Record
interface MuvekkilCRM {
  id: string;
  adSoyadVeyaUnvan: string;
  tur: 'Tüzel Kişi (Şirket)' | 'Gerçek Kişi (Şahıs)';
  vergiVeyaTcNo: string;
  telefon: string;
  eposta: string;
  sozlesmeTipi: 'Aylık Kurumsal Danışmanlık' | 'Dava Başı Ücret' | 'Başarı Primi (%15)';
  aktifDavaSayisi: number;
  toplamTahakkuk: number;
  tahsilEdilen: number;
  kalanBakiye: number;
  sonIslemTarihi: string;
}

// Case Hearing / Safahat Record
interface CelseKaydi {
  id: string;
  dosyaNo: string;
  mahkeme: string;
  davaTuru: string;
  muvekkil: string;
  karsiTaraf: string;
  durusmaTarihi: string;
  durusmaSaati: string;
  celseAsamasi: 'Ön İnceleme' | 'Tahkikat' | 'Bilirkişi İncelemesi' | 'Sözlü Yargılama / Karar';
  kritikSure: string;
  gorevliAvukat: string;
  durum: 'Yaklaşıyor' | 'Tamamlandı' | 'Ertelendi';
}

export function KurumsalBuroYonetimi({
  lawyerName = 'Av. Osman Turgut',
  lawyerSicilNo = '8109',
  onNavigateToPetitions
}: KurumsalBuroYonetimiProps) {
  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'finans' | 'crm' | 'celse' | 'smm'>('finans');

  // RBAC Role: 'yonetici' (Managing Partner) vs 'bagli' (Associate)
  const [userRole, setUserRole] = useState<'yonetici' | 'bagli'>('yonetici');
  const [hideSensitiveBalances, setHideSensitiveBalances] = useState<boolean>(false);

  // Filter states
  const [finansFilter, setFinansFilter] = useState<'hepsi' | 'tahsilat' | 'masraf' | 'avans'>('hepsi');
  const [crmSearchQuery, setCrmSearchQuery] = useState<string>('');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState<boolean>(false);
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);

  // Initial Mock Financial Data
  const [finansIslemleri, setFinansIslemleri] = useState<FinansKaydi[]>([
    {
      id: 'tx-101',
      tarih: '02.10.2026',
      tur: 'tahsilat',
      kategori: 'Vekalet Ücreti',
      aciklama: 'Atlas Tekstil A.Ş. 1. Taksit Vekalet Ücreti',
      muvekkilAdi: 'Atlas Tekstil San. Tic. A.Ş.',
      dosyaNo: '2026/842 Esas',
      tutar: 175000,
      paraBirimi: 'TRY',
      durum: 'tamamlandi'
    },
    {
      id: 'tx-102',
      tarih: '01.10.2026',
      tur: 'masraf',
      kategori: 'Bilirkişi Avansı',
      aciklama: 'İstanbul 14. ATM - Hesap Bilirkişisi Ücreti Yatırıldı',
      muvekkilAdi: 'Bosphorus Lojistik Ltd.',
      dosyaNo: '2024/782 Esas',
      tutar: 14500,
      paraBirimi: 'TRY',
      durum: 'tamamlandi'
    },
    {
      id: 'tx-103',
      tarih: '29.09.2026',
      tur: 'avans',
      kategori: 'Gider Avansı',
      aciklama: 'Keşif ve Harç Gider Avansı Tahsilatı',
      muvekkilAdi: 'Kaya Mimarlık Ltd. Şti.',
      dosyaNo: '2025/1104 Esas',
      tutar: 45000,
      paraBirimi: 'TRY',
      durum: 'tamamlandi'
    },
    {
      id: 'tx-104',
      tarih: '28.09.2026',
      tur: 'masraf',
      kategori: 'UYAP Harç & Tebligat',
      aciklama: 'İstinaf Başvuru Harcı ve Tebligat Masrafı',
      muvekkilAdi: 'Mert Aksoy',
      dosyaNo: '2026/301 Esas',
      tutar: 6850,
      paraBirimi: 'TRY',
      durum: 'tamamlandi'
    },
    {
      id: 'tx-105',
      tarih: '25.09.2026',
      tur: 'tahsilat',
      kategori: 'Aylık Danışmanlık',
      aciklama: 'Ekim 2026 Sürekli Şirket Danışmanlığı Sabit Hakediş',
      muvekkilAdi: 'Demir Çelik Sanayi A.Ş.',
      dosyaNo: 'Danışmanlık Portföyü',
      tutar: 120000,
      paraBirimi: 'TRY',
      durum: 'tamamlandi'
    }
  ]);

  // Initial Mock Client CRM Data
  const [muvekkiller, setMuvekkiller] = useState<MuvekkilCRM[]>([
    {
      id: 'cli-1',
      adSoyadVeyaUnvan: 'Atlas Tekstil San. Tic. A.Ş.',
      tur: 'Tüzel Kişi (Şirket)',
      vergiVeyaTcNo: '0981248901',
      telefon: '+90 (212) 444 88 90',
      eposta: 'hukuk@atlas-tekstil.com.tr',
      sozlesmeTipi: 'Aylık Kurumsal Danışmanlık',
      aktifDavaSayisi: 4,
      toplamTahakkuk: 450000,
      tahsilEdilen: 350000,
      kalanBakiye: 100000,
      sonIslemTarihi: '02.10.2026'
    },
    {
      id: 'cli-2',
      adSoyadVeyaUnvan: 'Bosphorus Lojistik Depolama Ltd. Şti.',
      tur: 'Tüzel Kişi (Şirket)',
      vergiVeyaTcNo: '1849102488',
      telefon: '+90 (216) 555 12 34',
      eposta: 'finans@bosphoruslog.com',
      sozlesmeTipi: 'Dava Başı Ücret',
      aktifDavaSayisi: 2,
      toplamTahakkuk: 180000,
      tahsilEdilen: 120000,
      kalanBakiye: 60000,
      sonIslemTarihi: '01.10.2026'
    },
    {
      id: 'cli-3',
      adSoyadVeyaUnvan: 'Mert Aksoy',
      tur: 'Gerçek Kişi (Şahıs)',
      vergiVeyaTcNo: '34891023812',
      telefon: '+90 (532) 987 65 43',
      eposta: 'mert.aksoy@gmail.com',
      sozlesmeTipi: 'Başarı Primi (%15)',
      aktifDavaSayisi: 1,
      toplamTahakkuk: 95000,
      tahsilEdilen: 45000,
      kalanBakiye: 50000,
      sonIslemTarihi: '28.09.2026'
    },
    {
      id: 'cli-4',
      adSoyadVeyaUnvan: 'Demir Çelik Sanayi A.Ş.',
      tur: 'Tüzel Kişi (Şirket)',
      vergiVeyaTcNo: '2981049281',
      telefon: '+90 (212) 321 00 11',
      eposta: 'yonetim@demircelik.com.tr',
      sozlesmeTipi: 'Aylık Kurumsal Danışmanlık',
      aktifDavaSayisi: 6,
      toplamTahakkuk: 720000,
      tahsilEdilen: 600000,
      kalanBakiye: 120000,
      sonIslemTarihi: '25.09.2026'
    }
  ]);

  // Initial Hearing & Celse Schedule Data
  const [celseTakvimi] = useState<CelseKaydi[]>([
    {
      id: 'cls-1',
      dosyaNo: '2024/782 Esas',
      mahkeme: 'İstanbul 14. Asliye Ticaret Mahkemesi',
      davaTuru: 'Ticari İtirazın İptali',
      muvekkil: 'Atlas Tekstil A.Ş.',
      karsiTaraf: 'Bosphorus Lojistik Ltd.',
      durusmaTarihi: '08.10.2026',
      durusmaSaati: '10:30',
      celseAsamasi: 'Bilirkişi İncelemesi',
      kritikSure: 'Bilirkişi raporuna 2 haftalık kesin itiraz süresi: 12.10.2026',
      gorevliAvukat: 'Av. Osman Turgut',
      durum: 'Yaklaşıyor'
    },
    {
      id: 'cls-2',
      dosyaNo: '2025/1104 Esas',
      mahkeme: 'Bakırköy 3. Asliye Hukuk Mahkemesi',
      davaTuru: 'Tapu İptali ve Tescil (TMK 713)',
      muvekkil: 'Kaya Mimarlık Ltd.',
      karsiTaraf: 'Hazine ve Maliye Bakanlığı',
      durusmaTarihi: '14.10.2026',
      durusmaSaati: '11:15',
      celseAsamasi: 'Tahkikat',
      kritikSure: 'Keşif masrafı tamamlama son günü: 10.10.2026',
      gorevliAvukat: 'Av. Osman Turgut',
      durum: 'Yaklaşıyor'
    },
    {
      id: 'cls-3',
      dosyaNo: '2026/301 Esas',
      mahkeme: 'İstanbul 8. İş Mahkemesi',
      davaTuru: 'İşe İade & Kıdem Tazminatı',
      muvekkil: 'Mert Aksoy',
      karsiTaraf: 'Global Lojistik A.Ş.',
      durusmaTarihi: '22.10.2026',
      durusmaSaati: '14:00',
      celseAsamasi: 'Ön İnceleme',
      kritikSure: 'İlk itirazlar ve delil listesi teati süresi',
      gorevliAvukat: 'Av. Osman Turgut',
      durum: 'Yaklaşıyor'
    }
  ]);

  // SMM Calculator State
  const [smmBrutUcret, setSmmBrutUcret] = useState<number>(50000);
  const [smmKdvOrani, setSmmKdvOrani] = useState<number>(20);
  const [smmStopajOrani, setSmmStopajOrani] = useState<number>(20);
  const [smmTevkifatVarMi, setSmmTevkifatVarMi] = useState<boolean>(false);
  const [smmTevkifatOrani, setSmmTevkifatOrani] = useState<string>('5/10'); // 5/10 or 9/10

  // SMM Calculations
  const stopajTutari = (smmBrutUcret * smmStopajOrani) / 100;
  const kdvTutari = (smmBrutUcret * smmKdvOrani) / 100;
  const tevkifatTutari = smmTevkifatVarMi
    ? (kdvTutari * parseInt(smmTevkifatOrani.split('/')[0])) / parseInt(smmTevkifatOrani.split('/')[1])
    : 0;
  const netEleGecen = smmBrutUcret - stopajTutari;
  const muvekkilTahsilat = smmBrutUcret + kdvTutari - tevkifatTutari - stopajTutari; // Net + KDV

  // Financial KPI totals
  const toplamTahsilat = finansIslemleri
    .filter((f) => f.tur === 'tahsilat' && f.durum === 'tamamlandi')
    .reduce((sum, f) => sum + f.tutar, 0);

  const toplamMasraf = finansIslemleri
    .filter((f) => f.tur === 'masraf' && f.durum === 'tamamlandi')
    .reduce((sum, f) => sum + f.tutar, 0);

  const toplamAvans = finansIslemleri
    .filter((f) => f.tur === 'avans' && f.durum === 'tamamlandi')
    .reduce((sum, f) => sum + f.tutar, 0);

  const netKasaBakiyesi = toplamTahsilat + toplamAvans - toplamMasraf;

  const toplamKalanAlacak = muvekkiller.reduce((sum, m) => sum + m.kalanBakiye, 0);

  // Form states for new transaction
  const [newTxTur, setNewTxTur] = useState<'tahsilat' | 'masraf' | 'avans'>('tahsilat');
  const [newTxKategori, setNewTxKategori] = useState<string>('Vekalet Ücreti');
  const [newTxMuvekkil, setNewTxMuvekkil] = useState<string>('Atlas Tekstil San. Tic. A.Ş.');
  const [newTxDosya, setNewTxDosya] = useState<string>('2026/842 Esas');
  const [newTxTutar, setNewTxTutar] = useState<string>('15000');
  const [newTxAciklama, setNewTxAciklama] = useState<string>('');

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const tutarNum = parseFloat(newTxTutar) || 0;
    if (tutarNum <= 0) return;

    const yeniKayit: FinansKaydi = {
      id: `tx-${Date.now()}`,
      tarih: new Date().toLocaleDateString('tr-TR'),
      tur: newTxTur,
      kategori: newTxKategori,
      aciklama: newTxAciklama || `${newTxKategori} kaydı`,
      muvekkilAdi: newTxMuvekkil,
      dosyaNo: newTxDosya,
      tutar: tutarNum,
      paraBirimi: 'TRY',
      durum: 'tamamlandi'
    };

    setFinansIslemleri([yeniKayit, ...finansIslemleri]);
    setShowAddTransactionModal(false);
    setNewTxAciklama('');
    setNewTxTutar('15000');
  };

  // Filtered transactions
  const filteredFinans = finansIslemleri.filter((f) => {
    if (finansFilter === 'hepsi') return true;
    return f.tur === finansFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Apilex Integration Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Apilex Kurumsal Büro Entegrasyonu
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                RBAC v2.4
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-7 h-7 text-amber-400" />
              Ultra Hukuk AI — Kurumsal Büro Yönetimi
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Müvekkil CRM havuzu, gelir/gider kasa defteri, celse ve safahat ajandası,
              serbest meslek makbuzu (SMM) kurgusu ve rol tabanlı erişim yetkilendirmesi (RBAC).
            </p>
          </div>

          {/* RBAC Role Switcher & Security Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              {userRole === 'yonetici' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              )}
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Aktif RBAC Rolü</div>
                <div className="text-xs font-bold text-white">
                  {userRole === 'yonetici' ? 'Yönetici Avukat (Partner)' : 'Bağlı Avukat (Associate)'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
              <button
                type="button"
                onClick={() => setUserRole('yonetici')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  userRole === 'yonetici'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Yönetici
              </button>
              <button
                type="button"
                onClick={() => setUserRole('bagli')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  userRole === 'bagli'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Bağlı Avukat
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('finans')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'finans'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Kasa & Finans Yönetimi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'crm'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Müvekkil CRM & Sözleşmeler</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('celse')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'celse'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Dava, Celse & Safahat Ajandası</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('smm')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'smm'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>SMM & Tevkifat Hesaplayıcı</span>
          </button>
        </div>
      </div>

      {/* RBAC WARNING FOR ASSOCIATE (IF FINANS OR RESTRICTED) */}
      {userRole === 'bagli' && activeTab === 'finans' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300">
                RBAC Korumalı Finans Alanı (Bağlı Avukat Yetkisi Sınırlı)
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                1136 Sayılı Kanun ve büro yönetmeliği gereğince büro ortak kasa bilançosu ve toplam gelir dökümü gizlenmiştir. Yalnızca kendi atandığınız dosya masraflarını görebilirsiniz.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUserRole('yonetici')}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shrink-0"
          >
            Yönetici Moduna Geç
          </button>
        </div>
      )}

      {/* TAB 1: FINANS & KASA */}
      {activeTab === 'finans' && (
        <div className="space-y-6">
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Toplam Tahsilat */}
            <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Toplam Tahsilat (Gelir)</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {userRole === 'bagli' ? '•••••• ₺' : `₺${toplamTahsilat.toLocaleString('tr-TR')}`}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-2 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Son 30 günde +%18 artış</span>
              </div>
            </div>

            {/* Toplam Dosya Masrafı & Gider */}
            <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Dosya Masrafı & Harçlar</span>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                ₺{toplamMasraf.toLocaleString('tr-TR')}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2">
                <span>Bilirkişi, tebligat, keşif harçları</span>
              </div>
            </div>

            {/* Alınan Gider Avansları */}
            <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Müvekkil Gider Avansı</span>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                ₺{toplamAvans.toLocaleString('tr-TR')}
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-2 font-medium">
                <span>Emanet hesapta bloke</span>
              </div>
            </div>

            {/* Net Kasa Bakiyesi (Yöneticiye Özel) */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-amber-500/30 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Net Kasa & Bilanço
                </span>
                <button
                  type="button"
                  onClick={() => setHideSensitiveBalances(!hideSensitiveBalances)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {hideSensitiveBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {userRole === 'bagli' || hideSensitiveBalances
                  ? '•••••••• ₺'
                  : `₺${netKasaBakiyesi.toLocaleString('tr-TR')}`}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2">
                <span>Tahsilat + Avans - Masraflar</span>
              </div>
            </div>
          </div>

          {/* Action Bar: Filter & Add New Transaction */}
          <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFinansFilter('hepsi')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  finansFilter === 'hepsi'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tümü ({finansIslemleri.length})
              </button>
              <button
                type="button"
                onClick={() => setFinansFilter('tahsilat')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  finansFilter === 'tahsilat'
                    ? 'bg-emerald-500 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tahsilatlar
              </button>
              <button
                type="button"
                onClick={() => setFinansFilter('masraf')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  finansFilter === 'masraf'
                    ? 'bg-rose-500 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Masraflar
              </button>
              <button
                type="button"
                onClick={() => setFinansFilter('avans')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  finansFilter === 'avans'
                    ? 'bg-indigo-500 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Avanslar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddTransactionModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Finansal İşlem Ekle</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-[#131d31] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>Kasa Hareketleri ve Dekont Kütüğü</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {filteredFinans.length} Kayıt Gösteriliyor
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">İşlem Türü</th>
                    <th className="py-3 px-4">Kategori & Açıklama</th>
                    <th className="py-3 px-4">Müvekkil / Dosya</th>
                    <th className="py-3 px-4 text-right">Tutar (TRY)</th>
                    <th className="py-3 px-4 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredFinans.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {tx.tarih}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.tur === 'tahsilat' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Tahsilat (+)
                          </span>
                        )}
                        {tx.tur === 'masraf' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Dosya Masrafı (-)
                          </span>
                        )}
                        {tx.tur === 'avans' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Gider Avansı
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {tx.kategori}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {tx.aciklama}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {tx.muvekkilAdi}
                        </div>
                        <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                          {tx.dosyaNo}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            tx.tur === 'tahsilat'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : tx.tur === 'masraf'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }
                        >
                          {tx.tur === 'masraf' ? '-' : '+'}₺{tx.tutar.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Onaylandı</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MÜVEKKİL CRM & PORTFÖY */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Müvekkil adı, vergi numarası veya e-posta ile ara..."
                value={crmSearchQuery}
                onChange={(e) => setCrmSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddClientModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Müvekkil Portföyü Aç</span>
              </button>
            </div>
          </div>

          {/* Client Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {muvekkiller
              .filter(
                (m) =>
                  m.adSoyadVeyaUnvan.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
                  m.vergiVeyaTcNo.includes(crmSearchQuery)
              )
              .map((muvekkil) => (
                <div
                  key={muvekkil.id}
                  className="bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {muvekkil.tur}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {muvekkil.adSoyadVeyaUnvan}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        VKN/TC: {muvekkil.vergiVeyaTcNo} • {muvekkil.telefon}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      {muvekkil.sozlesmeTipi}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">Aktif Dava</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {muvekkil.aktifDavaSayisi} Dosya
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">Tahsil Edilen</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ₺{muvekkil.tahsilEdilen.toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">Açık Bakiye</div>
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        ₺{muvekkil.kalanBakiye.toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-500">
                      Son İşlem: {muvekkil.sonIslemTarihi}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('smm');
                        setSmmBrutUcret(muvekkil.kalanBakiye > 0 ? muvekkil.kalanBakiye : 35000);
                      }}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>SMM Kes</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: DAVA, CELSE & SAFAHAT AJANDASI */}
      {activeTab === 'celse' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#131d31] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>UYAP Entegreli Celse & Hak Düşürücü Süre Takvimi</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Duruşma günleri, bilirkişi raporuna itiraz mühletleri ve istinaf/temyiz süreleri.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              3 Yaklaşan Duruşma
            </span>
          </div>

          <div className="space-y-3">
            {celseTakvimi.map((celse) => (
              <div
                key={celse.id}
                className="bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center font-mono font-bold leading-none shrink-0 border border-amber-500/20">
                      <span className="text-xs">{celse.durusmaTarihi.split('.')[0]}</span>
                      <span className="text-[9px] uppercase font-sans">Ekim</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {celse.dosyaNo}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {celse.mahkeme}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {celse.davaTuru} — {celse.muvekkil} vs. {celse.karsiTaraf}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Celse Aşaması: {celse.celseAsamasi}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      ⏰ {celse.durusmaSaati}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Kritik Usul & Hak Düşürücü Süre: </strong>
                    <span>{celse.kritikSure}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-500">
                    Sorumlu: <strong>{celse.gorevliAvukat}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {onNavigateToPetitions && (
                      <button
                        type="button"
                        onClick={onNavigateToPetitions}
                        className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold transition flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Dilekçe Hazırla</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SMM HESAPLAYICI (SERBEST MESLEK MAKBUZU & TEVKİFAT) */}
      {activeTab === 'smm' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="bg-white dark:bg-[#131d31] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-500" />
                <span>Serbest Meslek Makbuzu (SMM) Parametreleri</span>
              </h3>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                193 Sayılı GVK & 3065 KDVK
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Brüt Vekalet Ücreti (TL):
              </label>
              <input
                type="number"
                value={smmBrutUcret}
                onChange={(e) => setSmmBrutUcret(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Gelir Vergisi Stopajı (%):
                </label>
                <select
                  value={smmStopajOrani}
                  onChange={(e) => setSmmStopajOrani(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value={20}>%20 (Standart Avukatlık)</option>
                  <option value={0}>%0 (Muaf / Nihai Tüketici)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  KDV Oranı (%):
                </label>
                <select
                  value={smmKdvOrani}
                  onChange={(e) => setSmmKdvOrani(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value={20}>%20 (Genel Oran)</option>
                  <option value={10}>%10 (Adli Yardım vb.)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smmTevkifatVarMi}
                  onChange={(e) => setSmmTevkifatVarMi(e.target.checked)}
                  className="rounded border-slate-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Kamu / Kurumsal KDV Tevkifatı Uygula (5/10 veya 9/10)
                </span>
              </label>

              {smmTevkifatVarMi && (
                <div className="mt-3 pl-6">
                  <label className="text-xs text-slate-500 block mb-1">Tevkifat Oranı:</label>
                  <select
                    value={smmTevkifatOrani}
                    onChange={(e) => setSmmTevkifatOrani(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="5/10">5/10 (Danışmanlık ve Avukatlık Hizmetleri)</option>
                    <option value="9/10">9/10 (Özel Belirlenmiş Alıcılar)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* SMM Receipt Preview & Print Card */}
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#131d31] dark:to-[#0d1424] p-5 rounded-2xl border-2 border-dashed border-amber-500/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  e-Serbest Meslek Makbuzu Taslağı
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Yazdır / PDF</span>
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Brüt Vekalet Ücreti:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₺{smmBrutUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                <span className="font-sans">GV Stopajı (%{smmStopajOrani}):</span>
                <span>-₺{stopajTutari.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Hesaplanan KDV (%{smmKdvOrani}):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  +₺{kdvTutari.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {smmTevkifatVarMi && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                  <span className="font-sans">KDV Tevkifatı ({smmTevkifatOrani}):</span>
                  <span>-₺{tevkifatTutari.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 bg-slate-100 dark:bg-slate-900/80 px-2 rounded-lg font-bold text-slate-900 dark:text-slate-100">
                <span className="font-sans">Net Ele Geçen (Net Ücret):</span>
                <span>₺{netEleGecen.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between py-2 bg-amber-500/10 border border-amber-500/30 px-3 rounded-xl text-amber-800 dark:text-amber-300 font-extrabold text-sm">
                <span className="font-sans">Müvekkilden Tahsil Edilecek Toplam:</span>
                <span>₺{muvekkilTahsilat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              Avukat: <strong>{lawyerName}</strong> (Sicil: {lawyerSicilNo})<br />
              Düzenleme Tarihi: <strong>{new Date().toLocaleDateString('tr-TR')}</strong><br />
              Açıklama: Karşı taraf vekalet ücreti veya akdi vekalet ücreti makbuzu olarak GİB e-Arşiv/e-SMM portalına aktarılabilir.
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YENİ FİNANSAL İŞLEM EKLE */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131d31] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Yeni Kasa & Finans Kaydı</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTransactionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  İşlem Türü:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['tahsilat', 'masraf', 'avans'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTxTur(t)}
                      className={`py-2 rounded-xl font-bold uppercase text-[10px] transition ${
                        newTxTur === t
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Kategori:
                </label>
                <input
                  type="text"
                  required
                  value={newTxKategori}
                  onChange={(e) => setNewTxKategori(e.target.value)}
                  placeholder="Vekalet Ücreti, Bilirkişi Masrafı, UYAP Harcı..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Tutar (TRY):
                  </label>
                  <input
                    type="number"
                    required
                    value={newTxTutar}
                    onChange={(e) => setNewTxTutar(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    İlgili Dosya No:
                  </label>
                  <input
                    type="text"
                    required
                    value={newTxDosya}
                    onChange={(e) => setNewTxDosya(e.target.value)}
                    placeholder="2026/842 Esas"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Müvekkil Adı / Unvanı:
                </label>
                <input
                  type="text"
                  required
                  value={newTxMuvekkil}
                  onChange={(e) => setNewTxMuvekkil(e.target.value)}
                  placeholder="Müvekkil şirket veya şahıs adı"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  İşlem Açıklaması:
                </label>
                <textarea
                  rows={2}
                  value={newTxAciklama}
                  onChange={(e) => setNewTxAciklama(e.target.value)}
                  placeholder="Banka dekontu no veya vezne makbuzu detayı..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTransactionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
