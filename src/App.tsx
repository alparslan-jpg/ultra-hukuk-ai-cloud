import React, { useState, useEffect } from 'react';
import { LawyerWorkspace, LawyerUser, LawyerWorkspaceTab } from './components/LawyerWorkspace';
import { AdminatorPanel } from './components/AdminatorPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { AdliDelilVeSahitAjanPaneli } from './components/AdliDelilVeSahitAjanPaneli';
import { DavaDerinAnaliz } from './components/DavaDerinAnaliz';
import { KisiselApkIndirmePaneli } from './components/KisiselApkIndirmePaneli';
import { KvkkConsentModal, getKvkkConsent, KvkkConsentRecord } from './components/KvkkConsentModal';
import { HomeCaseTimeline } from './components/HomeCaseTimeline';
import { LawyerCaseListSection } from './components/LawyerCaseListSection';
import { LawyerCaseAnalyticsCharts } from './components/LawyerCaseAnalyticsCharts';
import { DailyTaskReminders } from './components/DailyTaskReminders';
import { LoginScreen } from './components/LoginScreen';
import { HukukiHesaplamaAraclariModal } from './components/HukukiHesaplamaAraclariModal';
import { AjanKonseyiOdasi } from './components/AjanKonseyiOdasi';
import {
  getClientList,
  setActiveLawyerSicil,
  subscribeToClientUpdates,
  ClientItem
} from './services/clientCaseStore';
import {
  Scale,
  Shield,
  UserCheck,
  Lock,
  ArrowLeft,
  UserPlus,
  Users,
  FolderOpen,
  Crosshair,
  Brain,
  FileText,
  BookOpen,
  Smartphone,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Camera,
  Calculator
} from 'lucide-react';

export type AppPage =
  | 'home'
  | 'clients'
  | 'forensic'
  | 'analyzer'
  | 'petitions'
  | 'legislation'
  | 'apk_download'
  | 'workspace_full';

const initialLawyers: LawyerUser[] = [
  {
    id: 'usr-8109',
    fullName: 'Av. Osman Turgut',
    sicilNo: '8109',
    baroAdi: 'İstanbul Barosu',
    daysRemaining: 365,
  },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'workspace' | 'admin'>(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#admin' || window.location.pathname === '/admin')) {
      return 'admin';
    }
    return 'workspace';
  });

  const [registeredLawyersList, setRegisteredLawyersList] = useState<LawyerUser[]>(initialLawyers);
  const [currentLawyer, setCurrentLawyer] = useState<LawyerUser>(initialLawyers[0]);
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<LawyerWorkspaceTab>('portal');

  const [lawyerDropdownOpen, setLawyerDropdownOpen] = useState<boolean>(false);
  const [customLawyerModalOpen, setCustomLawyerModalOpen] = useState<boolean>(false);
  const [newLawyerName, setNewLawyerName] = useState<string>('');
  const [newLawyerSicil, setNewLawyerSicil] = useState<string>('');
  const [newLawyerBaro, setNewLawyerBaro] = useState<string>('İstanbul Barosu');

  // Scoped lawyer clients and cases for live KPI & lists
  const [lawyerClients, setLawyerClients] = useState<ClientItem[]>([]);

  // KVKK Consent & AI Disclaimer State
  const [kvkkModalOpen, setKvkkModalOpen] = useState<boolean>(false);
  const [kvkkConsentRecord, setKvkkConsentRecord] = useState<KvkkConsentRecord | null>(() =>
    getKvkkConsent(initialLawyers[0].sicilNo)
  );

  // Hukuki Hesaplama Araçları Modal State
  const [hesaplamaModalOpen, setHesaplamaModalOpen] = useState<boolean>(false);

  // Update scoped store and KVKK consent status when lawyer changes
  useEffect(() => {
    if (currentLawyer?.sicilNo) {
      setActiveLawyerSicil(currentLawyer.sicilNo);
      setLawyerClients(getClientList());
      const saved = getKvkkConsent(currentLawyer.sicilNo);
      setKvkkConsentRecord(saved);
      // Auto open KVKK consent modal if not accepted yet
      if (!saved) {
        setKvkkModalOpen(true);
      }
    }
  }, [currentLawyer?.sicilNo]);

  useEffect(() => {
    const unsubscribe = subscribeToClientUpdates((updated) => {
      setLawyerClients(updated);
    });
    return unsubscribe;
  }, []);

  // Hash router listener (#admin vs #workspace)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentMode('admin');
      } else if (window.location.hash === '#workspace' || window.location.hash === '') {
        setCurrentMode('workspace');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Login gate — placed AFTER all hooks (React Rules of Hooks)
  if (!isAuthenticated) {
    return (
      <LoginScreen 
        onLogin={(userData) => { 
          setIsAuthenticated(true); 
          if (userData && !userData.isAdmin) {
            setCurrentLawyer(userData);
          }
        }} 
      />
    );
  }

  const handleAddNewLawyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLawyerName.trim() || !newLawyerSicil.trim()) return;
    const newLawyer: LawyerUser = {
      id: `usr-${Date.now()}`,
      fullName: newLawyerName.trim(),
      sicilNo: newLawyerSicil.trim(),
      baroAdi: newLawyerBaro,
      daysRemaining: 90,
    };
    setRegisteredLawyersList((prev) => [...prev, newLawyer]);
    setCurrentLawyer(newLawyer);
    setNewLawyerName('');
    setNewLawyerSicil('');
    setCustomLawyerModalOpen(false);
    setLawyerDropdownOpen(false);
  };

  // Calculate live stats for the current lawyer
  const totalActiveCasesCount = lawyerClients.reduce(
    (acc, c) => acc + (c.cases?.filter((cs) => !cs.isArchived).length || 0),
    0
  );
  const totalArchivedCasesCount = lawyerClients.reduce(
    (acc, c) => acc + (c.cases?.filter((cs) => cs.isArchived).length || 0),
    0
  );
  const totalCasesCount = totalActiveCasesCount;
  const totalFilesCount = lawyerClients.reduce(
    (acc, c) =>
      acc +
      (c.cases
        ?.filter((cs) => !cs.isArchived)
        .reduce((fAcc, cs) => fAcc + (cs.files?.length || 0), 0) || 0),
    0
  );

  // ==========================================
  // BAĞIMSIZ SAYFA: ADMINATOR YÖNETİM PORTALI
  // ==========================================
  if (currentMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e1626]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Adminatör Yönetici Portalı
                  <span className="text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 font-semibold">
                    Bağımsız Sistem
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Merkezi Lisans, Güvenlik Kütüğü ve Baro Yetkilendirme Konsolu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '';
                  setCurrentMode('workspace');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
                <span>Avukat Portalına Dön</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <AdminatorPanel
            onBackToWorkspace={() => {
              window.location.hash = '';
              setCurrentMode('workspace');
            }}
          />
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-[#0e1626]/50 py-3.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              Yalnızca Yetkili Sistem Yöneticisi Girişi
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-400">Adminatör Güvenlik Konsolu v2.6.4</span>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // ANA UYGULAMA: BÜTÜNLÜKLÜ ÇOK SAYFALI AVUKAT ÇALIŞMA ALANI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Global Header - 3-Zone Dashboard Contract */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e1524]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Zone 1: Clean Brand Wordmark & Context Breadcrumb */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2.5 text-left group"
              title="Ana Sayfaya Dön"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm text-slate-950 font-black group-hover:scale-105 transition-transform shrink-0">
                <Scale className="w-4 h-4 text-slate-950" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase" style={{ fontFamily: 'var(--font-legal)' }}>
                  Ultra Hukuk
                </span>
                <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">/</span>
                <span className="hidden sm:inline text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[140px] md:max-w-[200px]">
                  {currentPage === 'home' && 'Çalışma Portalı'}
                  {currentPage === 'forensic' && 'Adli Hakikat (Cımbız)'}
                  {currentPage === 'analyzer' && 'Dava Evrak Analizörü'}
                  {currentPage === 'petitions' && 'Dilekçe & Ajanlar'}
                  {currentPage === 'legislation' && 'Mevzuat & İçtihat'}
                  {currentPage === 'apk_download' && 'Mobil APK'}
                  {currentPage === 'workspace_full' && 'Tümleşik Çalışma Masası'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Segmented interactive tabs with clear active state) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-[#141d30]/90 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                currentPage === 'home'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Ana Sayfa
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('forensic')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                currentPage === 'forensic'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Cımbız Ajanı
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('analyzer')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                currentPage === 'analyzer'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Evrak Analizörü
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('petitions')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                currentPage === 'petitions'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Dilekçe & Ajanlar
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('legislation')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                currentPage === 'legislation'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Mevzuat
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('apk_download')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                currentPage === 'apk_download'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Mobil APK
            </button>
            <button
              type="button"
              onClick={() => setHesaplamaModalOpen(true)}
              className="px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5" />
              Hesaplama
            </button>
          </nav>

          {/* Zone 3: Primary Utility & Profile Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            {/* Yetkili Avukat Bilgisi (Av. Osman Turgut - Sicil: 8109) */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs shadow-sm">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="text-left hidden sm:block max-w-[160px] truncate">
                <span className="font-bold text-slate-800 dark:text-slate-100 block leading-tight truncate">
                  {currentLawyer.fullName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums font-mono">
                  {currentLawyer.baroAdi} • Sicil: {currentLawyer.sicilNo}
                </span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono tabular-nums">
                {currentLawyer.daysRemaining}G
              </span>
            </div>

            {/* KVKK ve Açık Rıza Durum Butonu */}
            <button
              type="button"
              onClick={() => setKvkkModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
                kvkkConsentRecord
                  ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 animate-pulse'
              }`}
              title="KVKK Aydınlatma Metni ve Açık Rıza Onay Belgesi"
            >
              {kvkkConsentRecord ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden md:inline font-mono">KVKK Onaylı</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline font-mono font-bold">KVKK Onayı Bekliyor</span>
                </>
              )}
            </button>

            {/* Independent Adminator switch */}
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#admin';
                setCurrentMode('admin');
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold transition shadow-sm"
              title="Bağımsız Adminatör Yönetici Paneline Geç"
            >
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              <span>Adminatör</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal: Yeni Avukat Profili Girişi */}
      {customLawyerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" /> Yeni Avukat Hesabı / Sicil Tanımlama
              </h3>
              <button
                onClick={() => setCustomLawyerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewLawyer} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Avukat Adı ve Soyadı:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Av. Selin Kara"
                  value={newLawyerName}
                  onChange={(e) => setNewLawyerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Baro Sicil Numarası:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 42109"
                  value={newLawyerSicil}
                  onChange={(e) => setNewLawyerSicil(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Kayıtlı Baro:</label>
                <select
                  value={newLawyerBaro}
                  onChange={(e) => setNewLawyerBaro(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="İstanbul Barosu">İstanbul Barosu</option>
                  <option value="Ankara Barosu">Ankara Barosu</option>
                  <option value="İzmir Barosu">İzmir Barosu</option>
                  <option value="Bursa Barosu">Bursa Barosu</option>
                  <option value="Antalya Barosu">Antalya Barosu</option>
                  <option value="Adana Barosu">Adana Barosu</option>
                  <option value="Trabzon Barosu">Trabzon Barosu</option>
                  <option value="Diğer Baro">Diğer Baro</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                Her avukat için ayrı ve bağımsız dosya alanı açılır. Bir avukatın müvekkili ve evrakları diğer avukatlar tarafından görülemez.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCustomLawyerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition shadow-md"
                >
                  Profili Oluştur & Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Dynamic View Area */}
      <main className="flex-1 w-full overflow-hidden flex flex-col">
        {/* ========================================================
            PAGE 1: ANA SAYFA (BAŞ HUKUK MÜŞAVİRİ & AJAN KONSEYİ - TAM SAYFA)
            ======================================================== */}
        {currentPage === 'home' && (
          <div className="flex-1 w-full overflow-hidden" style={{ height: 'calc(100vh - 76px)' }}>
            <AjanKonseyiOdasi
              lawyerName={currentLawyer.fullName}
              lawyerSicilNo={currentLawyer.sicilNo}
              onNavigateTo={(page) => setCurrentPage(page as any)}
            />
          </div>
        )}
{/* ========================================================
            PAGE 3: ADLİ HAKİKAT & ŞAHİT ÇELİŞKİSİ (CIMBIZ AJANI) ALT SAYFASI
            ======================================================== */}
        {currentPage === 'forensic' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#131d31] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ana Sayfa'ya Dön</span>
              </button>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Alt Sayfa: <strong className="text-rose-600 dark:text-rose-400">Adli Delil ve Şahit Çelişkisi (Cımbız Ajanı)</strong>
              </div>
            </div>

            <AdliDelilVeSahitAjanPaneli
              initialCaseNo="2024/782 Esas"
              initialCourt="İstanbul 14. Asliye Ticaret Mahkemesi"
              initialSubject="Ticari Fatura ve İrsaliyeye Dayalı İtirazın İptali Davası"
              initialPlaintiff="Atlas Tekstil Sanayi ve Dış Ticaret A.Ş."
              initialDefendant="Bosphorus Lojistik Depolama Ltd. Şti."
              onApplyToPetition={() => setCurrentPage('petitions')}
              onNavigateToTab={() => {}}
            />
          </div>
        )}

        {/* ========================================================
            PAGE 4: DAVA EVRAK ANALİZÖRÜ (FLASH & PRO) ALT SAYFASI
            ======================================================== */}
        {currentPage === 'analyzer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#131d31] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ana Sayfa'ya Dön</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Kamera ile Evrak Tarama (OCR) Aktif</span>
                </span>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Alt Sayfa: <strong className="text-emerald-600 dark:text-emerald-400">Dava Evrak Analizörü (Gemini Flash & Pro)</strong>
                </div>
              </div>
            </div>

            <DavaDerinAnaliz
              lawyerSicilNo={currentLawyer.sicilNo}
              onApplyToPetition={() => setCurrentPage('petitions')}
              onNavigateToTimeline={() => setCurrentPage('workspace_full')}
              onNavigateToCrossref={() => setCurrentPage('legislation')}
            />
          </div>
        )}

        {/* ========================================================
            PAGE 5: UYAP DİLEKÇE & HARP ODASI ALT SAYFASI
            ======================================================== */}
        {currentPage === 'petitions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#131d31] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ana Sayfa'ya Dön</span>
              </button>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Alt Sayfa: <strong className="text-indigo-600 dark:text-indigo-400">UYAP Dava Dilekçesi ve Savunma Harp Odası</strong>
              </div>
            </div>

            <LawyerWorkspace
              user={currentLawyer}
              initialTab="petition"
              onNavigateHome={() => setCurrentPage('home')}
            />
          </div>
        )}

        {/* ========================================================
            PAGE 6: MEVZUAT & İÇTİHAT SORGULAMA ALT SAYFASI
            ======================================================== */}
        {currentPage === 'legislation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#131d31] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ana Sayfa'ya Dön</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorkspaceInitialTab(workspaceInitialTab === 'sozluk' ? 'mevzuat' : 'sozluk')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{workspaceInitialTab === 'sozluk' ? 'Kanun Maddeleri Dizinine Geç' : 'Hukuk Terimleri Sözlüğü (AI)'}</span>
                </button>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:block">
                  Alt Sayfa: <strong className="text-amber-600 dark:text-amber-400">Türk Pozitif Mevzuat & Terimler Sözlüğü</strong>
                </div>
              </div>
            </div>

            <LawyerWorkspace
              user={currentLawyer}
              initialTab={workspaceInitialTab === 'sozluk' ? 'sozluk' : 'mevzuat'}
              onNavigateHome={() => setCurrentPage('home')}
            />
          </div>
        )}

        {/* ========================================================
            PAGE 7: KİŞİYE ÖZEL MOBİL APK İNDİRME ALT SAYFASI
            ======================================================== */}
        {currentPage === 'apk_download' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#131d31] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ana Sayfa'ya Dön</span>
              </button>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Alt Sayfa: <strong className="text-teal-600 dark:text-teal-400">Kişiye Özel Mobil APK İndirme & Donanım Kilidi</strong>
              </div>
            </div>

            <KisiselApkIndirmePaneli
              user={currentLawyer}
              onNavigateBack={() => setCurrentPage('home')}
            />
          </div>
        )}

        {/* ========================================================
            PAGE 8: TÜMLEŞİK ÇALIŞMA MASASI ALT SAYFASI
            ======================================================== */}
        {currentPage === 'workspace_full' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-[#131d31] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ana Sayfa'ya Dön</span>
              </button>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Alt Sayfa: <strong className="text-amber-600 dark:text-amber-400">Tümleşik Avukat Çalışma Masası</strong>
              </div>
            </div>

            <LawyerWorkspace
              user={currentLawyer}
              initialTab={workspaceInitialTab}
              onNavigateHome={() => {
                setWorkspaceInitialTab('portal');
                setCurrentPage('home');
              }}
            />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0e1626]/70 backdrop-blur-md py-4 px-6 text-xs text-slate-600 dark:text-slate-400 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Ultra Hukuk AI • 1136 Sayılı Kanun ve KVKK Kapsamında Uçtan Uca İzole</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono">
            <span>Sicil: {currentLawyer.sicilNo}</span>
            <span>HWID Mühürlü</span>
            <button
              type="button"
              onClick={() => setKvkkModalOpen(true)}
              className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>KVKK & Açık Rıza Metni</span>
            </button>
            <span>v2.6.4 Çok Sayfalı Mimari</span>
          </div>
        </div>
      </footer>

      {/* KVKK Aydınlatma Metni & Açık Rıza Modal */}
      <KvkkConsentModal
        isOpen={kvkkModalOpen}
        onClose={() => setKvkkModalOpen(false)}
        sicilNo={currentLawyer.sicilNo}
        lawyerFullName={currentLawyer.fullName}
        onConsentSuccess={(rec) => {
          setKvkkConsentRecord(rec);
        }}
      />

      {/* Hukuki Hesaplama Araçları Modal (AAÜT, Faiz, SMM, HMK 200) */}
      <HukukiHesaplamaAraclariModal
        isOpen={hesaplamaModalOpen}
        onClose={() => setHesaplamaModalOpen(false)}
      />
    </div>
  );
}
