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
import { AgentCapabilitiesDrawer } from './components/AgentCapabilitiesDrawer';
import { UniversalAiAssistantDrawer } from './components/UniversalAiAssistantDrawer';
import { KurumsalBuroYonetimi } from './components/KurumsalBuroYonetimi';
import { MultiAgentDavaSimulasyonu } from './components/MultiAgentDavaSimulasyonu';
import { OzellestirDropdown, OZELLESTIR_FEATURES, CustomFeatureItem } from './components/OzellestirDropdown';
import { RaporlarimBelgelerimModal } from './components/RaporlarimBelgelerimModal';
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
  Calculator,
  Building2,
  Swords,
  HardDrive
} from 'lucide-react';

export type AppPage =
  | 'home'
  | 'clients'
  | 'forensic'
  | 'analyzer'
  | 'petitions'
  | 'legislation'
  | 'apk_download'
  | 'workspace_full'
  | 'buro_yonetimi'
  | 'dava_simulasyonu';

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
  const [raporlarModalOpen, setRaporlarModalOpen] = useState<boolean>(false);

  // Özelleştirilmiş Menü Sabitlenen Sekmeler (Pinned Tabs)
  const [pinnedCustomFeatureIds, setPinnedCustomFeatureIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ultra_pinned_custom_tabs') || '["agent_usul_sure", "agent_seytanin_avukati"]');
    } catch {
      return ['agent_usul_sure', 'agent_seytanin_avukati'];
    }
  });

  const handleTogglePinFeature = (featureId: string) => {
    setPinnedCustomFeatureIds((prev) => {
      const updated = prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId];
      localStorage.setItem('ultra_pinned_custom_tabs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectCustomFeature = (feature: CustomFeatureItem) => {
    if (feature.pageTarget === 'raporlarim') {
      setRaporlarModalOpen(true);
      return;
    }
    if (feature.pageTarget === 'workspace_full') {
      if (feature.tabTarget) {
        setWorkspaceInitialTab(feature.tabTarget as any);
      }
      setCurrentPage('workspace_full');
    } else if (feature.pageTarget === 'petitions') {
      setCurrentPage('petitions');
    } else if (feature.pageTarget === 'legislation') {
      if (feature.tabTarget) {
        setWorkspaceInitialTab(feature.tabTarget as any);
      }
      setCurrentPage('legislation');
    } else {
      setCurrentPage(feature.pageTarget as any);
    }
  };

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
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e1524]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 py-2 shadow-sm w-full">
        <div className="w-full flex items-center justify-between gap-3">
          
          {/* Sol Bölüm: Avukat Bilgisi + Ultra Hukuk Logo + Sola Kaydırılmış Navigasyon Butonları */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-x-auto no-scrollbar">
            
            {/* Yetkili Avukat Bilgisi */}
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl text-xs shadow-sm shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="text-left hidden md:block max-w-[150px] truncate">
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

            {/* Ultra Hukuk Marka & Logo (Çalışma Portalı yazısı kaldırıldı) */}
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 text-left group shrink-0"
              title="Ana Sayfaya Dön"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm text-slate-950 font-black group-hover:scale-105 transition-transform shrink-0">
                <Scale className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase" style={{ fontFamily: 'var(--font-legal)' }}>
                Ultra Hukuk
              </span>
            </button>

            {/* Sola Kaydırılmış Navigasyon Butonları */}
            <nav className="flex items-center gap-1 bg-slate-100/90 dark:bg-[#141d30]/90 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs font-semibold shrink-0">
              {/* 1. Ana Sayfa */}
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  currentPage === 'home'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>Ana Sayfa</span>
              </button>

              {/* 2. Dosyalarım & Dava Takip */}
              <button
                type="button"
                onClick={() => setCurrentPage('workspace_full')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  currentPage === 'workspace_full'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Dosyalarım & Dava Takip</span>
              </button>

              {/* 3. AI Dilekçe */}
              <button
                type="button"
                onClick={() => setCurrentPage('petitions')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  currentPage === 'petitions'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>AI Dilekçe</span>
              </button>

              {/* 4. Multi-Agent Dava Simülasyonu */}
              <button
                type="button"
                onClick={() => setCurrentPage('dava_simulasyonu')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  currentPage === 'dava_simulasyonu'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Dava Simülasyonu</span>
              </button>

              {/* 5. Finans & Muhasebe (Apilex) */}
              <button
                type="button"
                onClick={() => setCurrentPage('buro_yonetimi')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  currentPage === 'buro_yonetimi'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Finans & Muhasebe</span>
              </button>

              {/* 6. Evrak Analizörü */}
              <button
                type="button"
                onClick={() => setCurrentPage('analyzer')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  currentPage === 'analyzer'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Evrak Analizörü
              </button>

              {/* 7. Cımbız Ajanı */}
              <button
                type="button"
                onClick={() => setCurrentPage('forensic')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  currentPage === 'forensic'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Cımbız Ajanı
              </button>

              {/* 8. Mevzuat */}
              <button
                type="button"
                onClick={() => setCurrentPage('legislation')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  currentPage === 'legislation'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Mevzuat
              </button>

              {/* 9. Hesaplama */}
              <button
                type="button"
                onClick={() => setHesaplamaModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-300 flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Hesaplama</span>
              </button>
            </nav>
          </div>

          {/* Sağ Kenar: ThemeToggle */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <ThemeToggle />
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 pb-14 w-full max-w-[100vw] overflow-x-hidden">
      {/* Top Application Global Header - Tam Genişlik, Sola Dayalı Navigasyon */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e1524]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-2 sm:px-4 py-2 shadow-sm w-full">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Sol Bölüm: Yetkili Avukat + Logo & Ultra Hukuk + Sola Kaydırılmış Navigasyon Butonları */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
            
            {/* Yetkili Avukat Bilgisi (Sol üst köşede en başta) */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs shadow-sm shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="text-left hidden md:block max-w-[140px] truncate">
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

            {/* Ultra Hukuk Marka & Logo (Çalışma Portalı yazısı ve / tamamen kaldırıldı) */}
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 text-left group shrink-0"
              title="Ana Sayfaya Dön"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm text-slate-950 font-black group-hover:scale-105 transition-transform shrink-0">
                <Scale className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase" style={{ fontFamily: 'var(--font-legal)' }}>
                Ultra Hukuk
              </span>
            </button>

            {/* Sola Kaydırılmış Navigasyon Butonları */}
            <nav className="flex items-center gap-1 bg-slate-100/90 dark:bg-[#141d30]/90 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs font-semibold shrink-0">
              {/* 1. Ana Sayfa */}
              <button
                type="button"
                onClick={() => setCurrentPage('home')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  currentPage === 'home'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>Ana Sayfa</span>
              </button>

              {/* 2. Dava Takip */}
              <button
                type="button"
                onClick={() => setCurrentPage('workspace_full')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  currentPage === 'workspace_full'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Dava Takip</span>
              </button>

              {/* 3. AI Dilekçe */}
              <button
                type="button"
                onClick={() => setCurrentPage('petitions')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  currentPage === 'petitions'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>AI Dilekçe</span>
              </button>

              {/* 4. Dava Simülasyonu */}
              <button
                type="button"
                onClick={() => setCurrentPage('dava_simulasyonu')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  currentPage === 'dava_simulasyonu'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Simülasyon</span>
              </button>

              {/* 5. Finans */}
              <button
                type="button"
                onClick={() => setCurrentPage('buro_yonetimi')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  currentPage === 'buro_yonetimi'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Finans</span>
              </button>

              {/* 6. Evrak Analizörü */}
              <button
                type="button"
                onClick={() => setCurrentPage('analyzer')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                  currentPage === 'analyzer'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Evrak Analiz
              </button>

              {/* 7. Cımbız Ajanı */}
              <button
                type="button"
                onClick={() => setCurrentPage('forensic')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                  currentPage === 'forensic'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Cımbız
              </button>

              {/* 8. Mevzuat */}
              <button
                type="button"
                onClick={() => setCurrentPage('legislation')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                  currentPage === 'legislation'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Mevzuat
              </button>

              {/* Sabitlenen Özel Sekmeler (Pinned Custom Tabs) */}
              {pinnedCustomFeatureIds.map((featId) => {
                const feat = OZELLESTIR_FEATURES.find((f) => f.id === featId);
                if (!feat) return null;
                const IconC = feat.icon;
                const isCurrent =
                  currentPage === feat.pageTarget &&
                  (!feat.tabTarget || workspaceInitialTab === feat.tabTarget);

                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleSelectCustomFeature(feat)}
                    className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                      isCurrent
                        ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    title={feat.description}
                  >
                    <IconC className="w-3.5 h-3.5 text-amber-500" />
                    <span>{feat.title}</span>
                  </button>
                );
              })}

              {/* 9. ÖZELLEŞTİR Dropdown Menüsü */}
              <OzellestirDropdown
                onSelectFeature={handleSelectCustomFeature}
                pinnedFeatureIds={pinnedCustomFeatureIds}
                onTogglePin={handleTogglePinFeature}
                activeFeatureId={workspaceInitialTab}
              />
            </nav>
          </div>

          {/* Sağ Bölüm: Hesaplama Araçları ve Tema Butonu */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setHesaplamaModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-orange-500/30 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Yargı & İcra Hesaplama Araçları"
            >
              <Calculator className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="hidden sm:inline">Hesaplama</span>
            </button>
            <ThemeToggle />
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
        {/* ========================================================
            PAGE: KURUMSAL BÜRO YÖNETİMİ & FİNANS (APİLEX HİBRİT)
            ======================================================== */}
        {currentPage === 'buro_yonetimi' && (
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


            <KurumsalBuroYonetimi
              lawyerName={currentLawyer.fullName}
              lawyerSicilNo={currentLawyer.sicilNo}
              onNavigateToPetitions={() => setCurrentPage('petitions')}
            />
          </div>
        )}

        {/* ========================================================
            PAGE: MULTI-AGENT DAVA SİMÜLASYONU (CLAUDE 3.5 & OPUS)
            ======================================================== */}
        {currentPage === 'dava_simulasyonu' && (
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


            <MultiAgentDavaSimulasyonu
              onApplyToPetition={() => setCurrentPage('petitions')}
            />
          </div>
        )}

        {currentPage === 'forensic' && (
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


            <AdliDelilVeSahitAjanPaneli
              initialCaseNo=""
              initialCourt=""
              initialSubject=""
              initialPlaintiff=""
              initialDefendant=""
              onApplyToPetition={() => setCurrentPage('petitions')}
              onNavigateToTab={() => {}}
            />
          </div>
        )}

        {/* ========================================================
            PAGE 4: DAVA EVRAK ANALİZÖRÜ (FLASH & PRO) ALT SAYFASI
            ======================================================== */}
        {currentPage === 'analyzer' && (
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


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
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


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
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


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
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


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
          <div className="w-full px-3 sm:px-6 py-3 space-y-4">


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
        <div className="w-full px-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
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
      <RaporlarimBelgelerimModal
        isOpen={raporlarModalOpen}
        onClose={() => setRaporlarModalOpen(false)}
        userSicilNo={currentLawyer?.sicilNo}
        lawyerName={currentLawyer?.fullName}
      />
      <HukukiHesaplamaAraclariModal
        isOpen={hesaplamaModalOpen}
        onClose={() => setHesaplamaModalOpen(false)}
      />

      {/* 5 Grup ve 17 Uzman Ajan Beceri & Bağlantı Matrisi Açılır Penceresi (Yalnızca Ana Sayfada) */}
      {currentPage === 'home' && (
        <AgentCapabilitiesDrawer
        onNavigateToPage={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToTab={(tab) => {
          setWorkspaceInitialTab(tab as LawyerWorkspaceTab);
          setCurrentPage('workspace_full');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      )}
    </div>
  );
}
