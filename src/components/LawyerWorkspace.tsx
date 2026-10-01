import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldAlert,
  FileText,
  Search,
  FileSearch,
  Sparkles,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Calculator,
  ShieldCheck,
  FileSpreadsheet,
  Mic,
  Copy,
  Check,
  AlertCircle,
  BookOpen,
  Zap,
  ArrowRight,
  ArrowLeft,
  BookmarkCheck,
  FileCheck2,
  Shield,
  Cpu,
  RefreshCw,
  Database,
  Pin,
  CalendarDays,
  Brain,
  UploadCloud,
  BarChart3,
  Users,
  MessageSquareCode,
  GitBranch,
  FolderOpen,
  Crosshair,
  Smartphone,
  Archive
} from 'lucide-react';

import { DenetlemePaneli, HukukiDenetimBadge, AiAssistedBadge } from './DenetlemePaneli';
import { MevzuatCaprazDogrulama } from './MevzuatCaprazDogrulama';
import { MevzuatSemantikArama } from './MevzuatSemantikArama';
import { MevzuatSorgulama, PinnedLegalArticle } from './MevzuatSorgulama';
import { CaseTimeline } from './CaseTimeline';
import { DavaDerinAnaliz } from './DavaDerinAnaliz';
import { CaseAnalytics } from './CaseAnalytics';
import { MuvekkilDavaPortali, CaseFileItem } from './MuvekkilDavaPortali';
import { AjanKonseyiOdasi } from './AjanKonseyiOdasi';
import { SecmeliOzelliklerVeGitPaneli } from './SecmeliOzelliklerVeGitPaneli';
import { ClientCaseExplorerSidebar } from './ClientCaseExplorerSidebar';
import { AdliDelilVeSahitAjanPaneli } from './AdliDelilVeSahitAjanPaneli';
import { KisiselApkIndirmePaneli } from './KisiselApkIndirmePaneli';
import { ArchivedCasesTab } from './ArchivedCasesTab';
import { CaseProgressTracker, Stage } from './CaseProgressTracker';
import { CaseSummaryAgent } from './CaseSummaryAgent';
import { DavaBildirimAjani } from './DavaBildirimAjani';
import { DavaTrendiOngoru } from './DavaTrendiOngoru';
import { DavaIstatistikleriOzeti } from './DavaIstatistikleriOzeti';
import { ClientItem, ClientCase, setActiveLawyerSicil, getArchivedCases, subscribeToClientUpdates } from '../services/clientCaseStore';
import { LegalArticle } from '../services/legalDatabaseService';
import { triggerUdfDownload } from '../services/udfGeneratorService';

export interface LawyerUser {
  id: string;
  fullName: string;
  sicilNo: string;
  baroAdi: string;
  daysRemaining: number;
}

export type LawyerWorkspaceTab =
  | 'portal'
  | 'archived_cases'
  | 'council'
  | 'features_git'
  | 'forensic_audit'
  | 'apk_download'
  | 'deep_analysis'
  | 'analytics'
  | 'analysis'
  | 'briefing'
  | 'devils'
  | 'temporal'
  | 'procedural'
  | 'expert'
  | 'hearing'
  | 'petition'
  | 'precedent'
  | 'ocr'
  | 'audio'
  | 'denetleme'
  | 'crossref'
  | 'legaldb'
  | 'mevzuat'
  | 'sozluk'
  | 'timeline';

interface LawyerWorkspaceProps {
  user: LawyerUser;
  initialTab?: LawyerWorkspaceTab;
  onNavigateHome?: () => void;
}

export function LawyerWorkspace({ user, initialTab, onNavigateHome }: LawyerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<LawyerWorkspaceTab>(initialTab || 'portal');
  const [archivedCasesCount, setArchivedCasesCount] = useState<number>(() => {
    return getArchivedCases().length;
  });

  useEffect(() => {
    const unsub = subscribeToClientUpdates(() => {
      setArchivedCasesCount(getArchivedCases().length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sync active lawyer sicil to scoped storage
  useEffect(() => {
    if (user?.sicilNo) {
      setActiveLawyerSicil(user.sicilNo);
    }
  }, [user?.sicilNo]);

  // Client & Case Explorer Sidebar state
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);

  // Multi-agent consultation context passed from client case files
  const [councilCaseContext, setCouncilCaseContext] = useState<{
    clientName: string;
    caseNumber: string;
    subject: string;
    files: CaseFileItem[];
  } | null>(null);

  // Global Git Sync notification trigger
  const handleQuickGitSync = async () => {
    try {
      const res = await fetch('/api/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: `feat: sync from workspace - ${new Date().toLocaleTimeString('tr-TR')}` })
      });
      const data = await res.json();
      if (data.success) {
        alert(`GitHub ile Senkronize Edildi!\nDal: ${data.branch}\nSon Commit: ${data.lastCommit}\n${data.pushStatus}`);
      } else {
        alert('Git senkronizasyon uyarısı: ' + data.message);
      }
    } catch (e: any) {
      alert('Git sync bağlantı hatası: ' + e.message);
    }
  };

  // Pinned Legal Articles State (TMK, TBK, HMK) across the active case workspace
  const [pinnedArticles, setPinnedArticles] = useState<PinnedLegalArticle[]>(() => {
    try {
      const saved = localStorage.getItem('ultra_hukuk_pinned_articles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ultra_hukuk_pinned_articles', JSON.stringify(pinnedArticles));
    } catch (e) {
      console.warn('Could not save pinned articles to localStorage:', e);
    }
  }, [pinnedArticles]);

  const handleTogglePinArticle = (article: LegalArticle, tag?: PinnedLegalArticle['relevanceTag'], note?: string) => {
    setPinnedArticles((prev) => {
      const exists = prev.some((p) => p.article.id === article.id);
      if (exists) {
        return prev.filter((p) => p.article.id !== article.id);
      } else {
        return [
          ...prev,
          {
            article,
            pinnedAt: new Date().toISOString(),
            lawyerNote: note || '',
            relevanceTag: tag || 'Genel'
          }
        ];
      }
    });
  };

  const handleUpdateArticleNote = (articleId: string, note: string, tag?: PinnedLegalArticle['relevanceTag']) => {
    setPinnedArticles((prev) =>
      prev.map((p) => {
        if (p.article.id === articleId) {
          return {
            ...p,
            lawyerNote: note,
            relevanceTag: tag || p.relevanceTag || 'Genel'
          };
        }
        return p;
      })
    );
  };

  // Denetleme & Çapraz Doğrulama Metin Aktarım State
  const [denetlemeInitialText, setDenetlemeInitialText] = useState<string>('');
  const [crossRefText, setCrossRefText] = useState<string>('');

  // Adli Ses & Duruşma Zaptı State
  const [audioType, setAudioType] = useState<string>('durusma_zapti');
  const [audioTranscriptText, setAudioTranscriptText] = useState<string>('');
  const [audioResult, setAudioResult] = useState<any>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

  // 1. Dava Dosyası & Analiz Laboratuvarı State (Başlangıçta Temiz ve Boş)
  const [davaOzeti, setDavaOzeti] = useState<string>('');
  const [clientClaims, setClientClaims] = useState<string>('');
  const [kanitListesi, setKanitListesi] = useState<string>('');
  const [tarafSifati, setTarafSifati] = useState<string>('Davacı');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // 2. Savunma & Karşı Görüş Kurgusu (Harp Odası) State
  const [devilSummary, setDevilSummary] = useState<string>('');
  const [devilResult, setDevilResult] = useState<any>(null);
  const [isDevilLoading, setIsDevilLoading] = useState<boolean>(false);

  // 3. Hak Düşürücü Süre & Faiz Hesaplama State
  const [eventDate, setEventDate] = useState<string>('');
  const [claimType, setClaimType] = useState<string>('genel');
  const [principalAmount, setPrincipalAmount] = useState<number>(0);
  const [isCommercialInterest, setIsCommercialInterest] = useState<boolean>(true);
  const [temporalResult, setTemporalResult] = useState<any>(null);
  const [isTemporalLoading, setIsTemporalLoading] = useState<boolean>(false);

  // 4. Usul ve Dava Şartları İncelemesi (HMK m. 114 / 116)
  const [procCourt, setProcCourt] = useState<string>('');
  const [procCommercial, setProcCommercial] = useState<boolean>(true);
  const [procMediation, setProcMediation] = useState<boolean>(true);
  const [procPoa, setProcPoa] = useState<boolean>(true);
  const [procAmount, setProcAmount] = useState<string>('');
  const [procSummary, setProcSummary] = useState<string>('');
  const [procResult, setProcResult] = useState<any>(null);
  const [isProcLoading, setIsProcLoading] = useState<boolean>(false);

  // 5. Bilirkişi Rapor İncelemesi (HMK 266 / 281)
  const [reportSummary, setReportSummary] = useState<string>('');
  const [expertResult, setExpertResult] = useState<any>(null);
  const [isExpertLoading, setIsExpertLoading] = useState<boolean>(false);

  // 6. Duruşma Hazırlığı & Sorgu Taktikleri (HMK 254-257)
  const [hearingStage, setHearingStage] = useState<string>('Tanık Dinleme ve Delil Tespiti');
  const [witnessStatement, setWitnessStatement] = useState<string>('');
  const [hearingResult, setHearingResult] = useState<any>(null);
  const [isHearingLoading, setIsHearingLoading] = useState<boolean>(false);

  // 7. UYAP Uyumlu Dava / Cevap Dilekçesi Taslağı
  const [court, setCourt] = useState<string>('');
  const [client, setClient] = useState<string>('');
  const [opponent, setOpponent] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [caseNo, setCaseNo] = useState<string>('');
  const [petitionDetails, setPetitionDetails] = useState<string>('');
  const [petitionText, setPetitionText] = useState<string>('');
  const [isPetitionLoading, setIsPetitionLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // 8. Emsal Karar ve Yargıtay İçtihatları
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [precedents, setPrecedents] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);

  // 9. Adli Evrak / Belge Çözümleme (OCR)
  const [ocrText, setOcrText] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);

  // 10. Stratejik Dava Brifingi State
  const [briefingText, setBriefingText] = useState<string>('');
  const [briefingContext, setBriefingContext] = useState<string>('sozlesme');
  const [isBriefingLoading, setIsBriefingLoading] = useState<boolean>(false);
  const [briefingResult, setBriefingResult] = useState<any>(null);
  const [briefingCopied, setBriefingCopied] = useState<boolean>(false);

  // Kullanıcı değiştiğinde veya yeni dosya istendiğinde tüm formları temizle
  const handleClearAllCaseData = () => {
    setDavaOzeti('');
    setClientClaims('');
    setKanitListesi('');
    setDevilSummary('');
    setDevilResult(null);
    setEventDate('');
    setPrincipalAmount(0);
    setTemporalResult(null);
    setProcCourt('');
    setProcSummary('');
    setProcAmount('');
    setProcResult(null);
    setReportSummary('');
    setExpertResult(null);
    setWitnessStatement('');
    setHearingResult(null);
    setCourt('');
    setClient('');
    setOpponent('');
    setSubject('');
    setCaseNo('');
    setPetitionDetails('');
    setPetitionText('');
    setSearchQuery('');
    setPrecedents([]);
    setOcrText('');
    setOcrResult(null);
    setBriefingText('');
    setBriefingResult(null);
    setAudioTranscriptText('');
    setAudioResult(null);
    setAnalysisResult(null);
    setDenetlemeInitialText('');
    setCrossRefText('');
  };

  // Müvekkil & Dava Gezgininden seçilen dosyayı aktif Çalışma Masasına aktar
  const handleSelectCaseFromExplorer = (clientItem: ClientItem, clientCase: ClientCase) => {
    setCaseNo(clientCase.caseNumber);
    setCourt(clientCase.court);
    setProcCourt(clientCase.court);
    setSubject(clientCase.subject);
    setDavaOzeti(clientCase.subject);
    setClient(clientItem.fullName);
    setOpponent(clientCase.opponentName);
    setProcAmount(clientCase.estimatedValue);
    setTarafSifati('Davacı Vekili');

    if (clientCase.files && clientCase.files.length > 0) {
      const formattedFiles = clientCase.files
        .map((f, i) => `${i + 1}. [${f.type}] ${f.name} - İspat Niteliği: ${f.evidentiaryValue} (${f.lawArticle || 'HMK m. 199'})`)
        .join('\n');
      setKanitListesi(formattedFiles);
    }
  };

  // Her kullanıcı girişinde / seçiminde ilgili kullanıcının dosyasını sıfırla/başlat
  useEffect(() => {
    handleClearAllCaseData();
  }, [user.id]);

  const handleCaseBriefing = async () => {
    if (!briefingText.trim()) return;
    setIsBriefingLoading(true);
    try {
      const res = await fetch('/api/ai/case-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalText: briefingText,
          contextType: briefingContext,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setBriefingResult(data);
    } catch (err) {
      alert('Case Briefing analizi sırasında bir hata oluştu.');
    } finally {
      setIsBriefingLoading(false);
    }
  };

  const copyBriefingToClipboard = (data: any) => {
    if (!data) return;
    const lines = [
      `=== ULTRA HUKUK AI: CASE BRIEFING RAPORU ===`,
      `Başlık: ${data.title || 'Hukuki Uyuşmazlık Analizi'}`,
      `Tarih: ${data.analyzedAt ? new Date(data.analyzedAt).toLocaleString('tr-TR') : new Date().toLocaleString('tr-TR')}`,
      `Risk Seviyesi: ${data.overallRiskLevel || 'BİLDİRİLMEMİŞ'}`,
      `Kaynak Motor: ${data.source || 'Gemini 3.8 Flash'}`,
      ``,
      `--- YÖNETİCİ ÖZETİ ---`,
      data.executiveSummary || '',
      ``,
      `--- BİRİNCİL HUKUKİ RİSKLER ---`,
      ...(data.primaryLegalRisks || []).map(
        (r: any, i: number) =>
          `${i + 1}. [${r.severity}] ${r.risk}\n   Mevzuat Dayanağı: ${r.legalBasis}\n   Önleme/Savunma Stratejisi: ${r.mitigation}\n`
      ),
      `--- TEMEL HUKUKİ ARGÜMANLAR ---`,
      ...(data.keyArguments || []).map(
        (a: any, i: number) =>
          `${i + 1}. [${a.side}] (Etki: ${a.impactLevel})\n   Argüman: ${a.argument}\n   Dayanak: ${a.legalGround}\n`
      ),
      `--- USULİ UYARILAR & SÜRELER ---`,
      ...(data.proceduralAlerts || []).map((p: string) => `• ${p}`),
      ``,
      `--- UYGULANABİLİR KANUN MADDELERİ ---`,
      (data.applicableStatutes || []).join(', '),
      ``,
      `--- STRATEJİK EYLEM ÖNERİLERİ ---`,
      ...(data.strategicRecommendations || []).map((s: string) => `✓ ${s}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setBriefingCopied(true);
    setTimeout(() => setBriefingCopied(false), 2200);
  };

  // Handlers
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/complete-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          davaOzeti,
          clientClaims: [clientClaims],
          kanitListesi: [kanitListesi],
          muvekkilTarafSifati: tarafSifati,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      alert('Analiz sırasında hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDevilsAdvocate = async () => {
    setIsDevilLoading(true);
    try {
      const res = await fetch('/api/ai/devils-advocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseSummary: devilSummary,
          clientClaims: 'Müvekkilin tazminat ve alacak talepleri',
          evidenceList: 'Tanık beyanları ve banka kayıtları',
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setDevilResult(data);
    } catch (err) {
      alert('Şeytanın Avukatı analizi alınamadı.');
    } finally {
      setIsDevilLoading(false);
    }
  };

  const handleTemporalCalc = async () => {
    setIsTemporalLoading(true);
    try {
      const res = await fetch('/api/ai/temporal-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDate,
          claimType,
          principalAmount,
          interestType: isCommercialInterest ? 'commercial' : 'legal',
          isCommercial: isCommercialInterest,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setTemporalResult(data);
    } catch (err) {
      alert('Zamanaşımı ve faiz hesabı yapılamadı.');
    } finally {
      setIsTemporalLoading(false);
    }
  };

  const handleProceduralAudit = async () => {
    setIsProcLoading(true);
    try {
      const res = await fetch('/api/ai/procedural-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court: procCourt,
          isCommercial: procCommercial,
          hasMediationReport: procMediation,
          hasPowerOfAttorney: procPoa,
          claimAmount: procAmount,
          claimsSummary: procSummary,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setProcResult(data);
    } catch (err) {
      alert('Usul denetimi tamamlanamadı.');
    } finally {
      setIsProcLoading(false);
    }
  };

  const handleExpertAudit = async () => {
    setIsExpertLoading(true);
    try {
      const res = await fetch('/api/ai/expert-report-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportSummary,
          clientPerspective: 'Rapor haksız ve taraflı hazırlanmıştır, itiraz edilmelidir.',
          caseSubject: 'Eser Sözleşmesinden Kaynaklanan Hakediş',
          lawyerName: user.fullName,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setExpertResult(data);
    } catch (err) {
      alert('Bilirkişi incelemesi yapılamadı.');
    } finally {
      setIsExpertLoading(false);
    }
  };

  const handleHearingPrep = async () => {
    setIsHearingLoading(true);
    try {
      const res = await fetch('/api/ai/hearing-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStage: hearingStage,
          witnessStatements: witnessStatement,
          opponentClaims: 'İş ayıplı ve geç teslim edilmiştir.',
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setHearingResult(data);
    } catch (err) {
      alert('Duruşma simülasyonu çalıştırılamadı.');
    } finally {
      setIsHearingLoading(false);
    }
  };

  const handleGeneratePetition = async () => {
    setIsPetitionLoading(true);
    try {
      const res = await fetch('/api/ai/petition-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court,
          client,
          opponent,
          subject,
          caseNo,
          details: petitionDetails,
          lawyerName: user.fullName,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setPetitionText(data.petitionText || '');
    } catch (err) {
      alert('Dilekçe taslağı oluşturulamadı.');
    } finally {
      setIsPetitionLoading(false);
    }
  };

  const handlePrecedentSearch = async () => {
    setIsSearchLoading(true);
    try {
      const res = await fetch('/api/ai/precedent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setPrecedents(data.precedents || []);
    } catch (err) {
      alert('Emsal karar aramasında hata oluştu.');
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleOcr = async () => {
    setIsOcrLoading(true);
    try {
      const res = await fetch('/api/ai/document-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'tutanak_tarama.pdf',
          documentText: ocrText,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setOcrResult(data);
      if (data.extractedText && !ocrText) {
        setOcrText(data.extractedText);
      }
    } catch (err) {
      alert('Belge okuma hatası.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleAudioTranscribe = async () => {
    setIsAudioLoading(true);
    try {
      const res = await fetch('/api/ai/audio-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioType,
          lawyerSicilNo: user.sicilNo,
        }),
      });
      const data = await res.json();
      setAudioResult(data);
      if (data.transcription) {
        setAudioTranscriptText(data.transcription);
      }
    } catch (err) {
      alert('Ses kaydı transkripsiyonu sırasında bir hata oluştu.');
    } finally {
      setIsAudioLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Çoklu Model (Multi-Model) Stratejisi & Hukuki Denetleme Kalkanı Bilgi Şeridi */}
      <div className="bg-gradient-to-r from-[#0d1527] via-[#131d33] to-[#0e172a] border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">
                  Avukat Çalışma Masası — Dosya ve Dava Yönetim Merkezi
                </h2>
                <span className="text-[10px] font-mono bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  POZİTİF MEVZUAT UYUMLU
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1136 Sayılı Avukatlık Kanunu m. 34, 6100 Sayılı HMK, TBK, TTK ve Yargıtay Hukuk Genel Kurulu ilke kararlarına dayalı güvenli çalışma masası.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] flex-wrap">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Ana Sayfaya ve Modül Merkezine Dön"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ana Sayfa</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExplorerOpen(!isExplorerOpen)}
              className={`text-xs px-3.5 py-1.5 rounded-xl border font-semibold transition flex items-center gap-1.5 shadow-sm ${
                isExplorerOpen
                  ? 'border-sky-500 bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/40'
                  : 'border-sky-500/40 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60'
              }`}
              title="Müvekkil, dava ve evrak hiyerarşisi kenar çubuğunu açar veya kapatır"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Müvekkil & Dava Gezgini</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isExplorerOpen ? 'bg-white/20 text-white' : 'bg-sky-500/20 text-sky-600 dark:text-sky-300'}`}>
                Sidebar
              </span>
            </button>
            <div className="text-[11px] font-mono bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              Sicil: <strong className="text-amber-600 dark:text-amber-400">{user.sicilNo}</strong> ({user.baroAdi})
            </div>
          </div>
        </div>

        {/* Dosya Durum Çubuğu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-[#0b101d] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">Taraf Sıfatı:</span>
            <span className="font-bold text-amber-600 dark:text-amber-300">{tarafSifati}</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-[#0b101d] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">Dava Dosyası:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {caseNo || 'Henüz Esas No Girilmedi'}
            </span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-[#0b101d] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">Görevli Mahkeme:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {court || procCourt || 'Belirtilmedi'}
            </span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-[#0b101d] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">Mevzuat Güvencesi:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">HMK m. 119 Somutlaştırma</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('portal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'portal'
              ? 'bg-gradient-to-r from-sky-500/25 to-blue-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span className="font-bold">Müvekkil & Dava Portalı</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-medium">
            Hiyerarşik Dosyalar
          </span>
        </button>

        <button
          onClick={() => setActiveTab('archived_cases')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'archived_cases'
              ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
          title="Sonuçlanan ve aktif listeden kaldırılan arşivlenmiş davalar"
        >
          <Archive className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="font-bold">Arşivlenen Davalar</span>
          {archivedCasesCount > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold">
              {archivedCasesCount} Arşiv
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-mono">
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('council')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'council'
              ? 'bg-gradient-to-r from-indigo-500/25 to-purple-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <MessageSquareCode className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="font-bold">Baş Müşavir & Ajan Konseyi</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-medium">
            Sesli + 4 Ajan
          </span>
        </button>

        <button
          onClick={() => setActiveTab('features_git')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'features_git'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="font-bold">Seçmeli Özellikler & Git</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            GitHub Sync
          </span>
        </button>

        <button
          onClick={() => setActiveTab('forensic_audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'forensic_audit'
              ? 'bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-indigo-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="font-bold">Adli Hakikat & Cımbız Ajanı</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-medium">
            TCK 272 / Cımbız
          </span>
        </button>

        <button
          onClick={() => setActiveTab('apk_download')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'apk_download'
              ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-sky-500/25 text-emerald-900 dark:text-emerald-200 border border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="font-bold">Kişisel Mobil APK</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
            Sicil Mühürlü
          </span>
        </button>

        <button
          onClick={() => setActiveTab('deep_analysis')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'deep_analysis'
              ? 'bg-gradient-to-r from-sky-500/25 to-indigo-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span className="font-bold">Dava Derin Analiz</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-medium">
            Flash & Pro
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-indigo-500/25 to-sky-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="font-bold">Case Analytics</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-medium">
            D3.js
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'analysis'
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Dava Analiz Laboratuvarı</span>
        </button>

        <button
          onClick={() => setActiveTab('briefing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'briefing'
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Stratejik Dava Brifingi</span>
        </button>

        <button
          onClick={() => setActiveTab('devils')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'devils'
              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          <span>Harp Odası & Karşı Savunma</span>
        </button>

        <button
          onClick={() => setActiveTab('temporal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'temporal'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Zamanaşımı & Faiz</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'timeline'
              ? 'bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/50 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>Dava Zaman Çizelgesi & Takvim</span>
        </button>

        <button
          onClick={() => setActiveTab('procedural')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'procedural'
              ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>35 Noktalı Usul Denetimi</span>
        </button>

        <button
          onClick={() => setActiveTab('expert')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'expert'
              ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
          <span>Bilirkişi İtiraz Lab (HMK 281)</span>
        </button>

        <button
          onClick={() => setActiveTab('hearing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'hearing'
              ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Gavel className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>Duruşma Stratejisi</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'audio'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Adli Sesli Dikte & Duruşma Zaptı</span>
        </button>

        <button
          onClick={() => setActiveTab('petition')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'petition'
              ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>UYAP Dilekçe Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('precedent')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'precedent'
              ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
          <span>Emsal Karar</span>
        </button>

        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'ocr'
              ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
          }`}
        >
          <FileSearch className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Adli Belge / Evrak Okuma (OCR)</span>
        </button>

        <button
          onClick={() => setActiveTab('denetleme')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'denetleme'
              ? 'bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="font-bold">Denetleme Paneli (Mevzuat & Atıf)</span>
        </button>

        <button
          onClick={() => setActiveTab('crossref')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'crossref'
              ? 'bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/50 shadow-sm'
              : 'text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 border border-sky-500/30'
          }`}
        >
          <Gavel className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span className="font-bold">Mevzuat Çapraz Doğrulama</span>
        </button>

        <button
          onClick={() => setActiveTab('mevzuat')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'mevzuat' || activeTab === 'legaldb'
              ? 'bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="font-bold">Mevzuat Sorgulama</span>
          {pinnedArticles.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-0.5">
              <Pin className="w-2.5 h-2.5 fill-white" />
              {pinnedArticles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sozluk')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'sozluk'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm ring-1 ring-indigo-500/50'
              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="font-bold">Hukuk Terimleri Sözlüğü</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/30">
            AI
          </span>
        </button>
      </div>


      {/* TAB 1: DAVA ANALİZ LABORATUVARI */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            {/* Quick Switch to Dava Derin Analiz Banner */}
            <div className="p-3 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                  Evrak yükleyerek <strong>Gemini Flash & Pro</strong> ile derin analiz yapmak ister misiniz?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('deep_analysis')}
                className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-500/40 rounded-lg text-[11px] font-semibold whitespace-nowrap transition"
              >
                Derin Analiz
              </button>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Dava Dosyası Veri Girişi
              </h2>
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-medium">
                HMK m. 119 Uyumlu
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Müvekkilin Taraf Sıfatı</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTarafSifati('Davacı')}
                    className={`py-2 rounded-xl font-semibold border transition ${
                      tarafSifati === 'Davacı'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Davacı Müvekkil
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarafSifati('Davalı')}
                    className={`py-2 rounded-xl font-semibold border transition ${
                      tarafSifati === 'Davalı'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Davalı Müvekkil
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Davanın Somut Özeti ve Vakıalar</label>
                <textarea
                  rows={4}
                  value={davaOzeti}
                  onChange={(e) => setDavaOzeti(e.target.value)}
                  placeholder="Dava konusunu, iddia ve savunmaya esas teşkil eden somut vakıaları giriniz..."
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Hukuki Talepler ve İddialar</label>
                <input
                  type="text"
                  value={clientClaims}
                  onChange={(e) => setClientClaims(e.target.value)}
                  placeholder="Müvekkilin temel hukuki talepleri..."
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Mevcut Delil ve Belgeler</label>
                  {pinnedArticles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const statutesText = pinnedArticles.map((p) => `${p.article.lawCode} m. ${p.article.article}`).join(', ');
                        setKanitListesi((prev) => (prev ? `${prev}, [Kanun Dayanakları: ${statutesText}]` : `[Kanun Dayanakları: ${statutesText}]`));
                      }}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Pin className="w-2.5 h-2.5 fill-amber-500" />
                      <span>İğnelenen {pinnedArticles.length} Maddeyi Ekle</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={kanitListesi}
                  onChange={(e) => setKanitListesi(e.target.value)}
                  placeholder="Sözleşme, dekont, fatura, tanık, bilirkişi raporu..."
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                disabled={isAnalyzing}
                onClick={handleAnalyze}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Dava Dosyası ve Deliller İnceleniyor...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4 text-slate-950" />
                    <span>Dava ve Delil Analizini Başlat</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('briefing')}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-2.5 rounded-xl text-[11px] font-medium transition flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    Belirli Bir Madde / İhtarname mi Var? Stratejik Dava Brifingine Git
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                </button>
              </div>

              {caseNo && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <CaseProgressTracker
                    caseNumber={caseNo}
                    stages={[
                      { id: '1', name: 'Dava Açılışı', status: 'COMPLETED' },
                      { id: '2', name: 'Ön İnceleme', status: 'COMPLETED' },
                      { id: '3', name: 'Tahkikat', status: 'CURRENT' },
                      { id: '4', name: 'Karar', status: 'PENDING' }
                    ]}
                  />
                  <CaseSummaryAgent caseData={{
                    id: 'current-case',
                    caseNumber: caseNo,
                    court: court,
                    subject: subject,
                    status: 'Open',
                    openedDate: new Date().toISOString().split('T')[0],
                    stage: 'Dava Açılışı & Tensip',
                    estimatedValue: procAmount || '0 TL',
                    opponentName: opponent,
                    files: []
                  }} />
                  <DavaBildirimAjani lawyerName={user.fullName} />
                  <DavaTrendiOngoru cases={[]} />
                  <DavaIstatistikleriOzeti clients={[]} />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {analysisResult ? (
              <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">{analysisResult.source}</span>
                    <h3 className="text-base font-bold text-slate-100 mt-1">{analysisResult.davaTuru}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Görevli Mahkeme: <strong className="text-slate-300">{analysisResult.mahkeme}</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Kazanma İhtimali</span>
                    <span className="text-2xl font-black text-emerald-400">{analysisResult.kazanmaIhtimali}%</span>
                  </div>
                </div>

                <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-100 mb-1 flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5 text-amber-400" /> Hukuki Çerçeve ve Ön Değerlendirme
                  </p>
                  {analysisResult.genelOzet}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lehe Olan Unsurlar ({analysisResult.leheUnsurlar?.length || 0})
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {analysisResult.leheUnsurlar?.map((item: string, idx: number) => (
                        <li key={idx} className="leading-snug">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Aleyhe Unsurlar ve Riskler ({analysisResult.aleyheUnsurlar?.length || 0})
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {analysisResult.aleyheUnsurlar?.map((item: string, idx: number) => (
                        <li key={idx} className="leading-snug">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-[#0e1626] border border-amber-900/40 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" /> Şeytanın Avukatı Karşı Tezler ve Usul Tuzakları
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="font-semibold text-amber-300 mb-1">Davacı Tezine Hücum:</p>
                      <ul className="text-slate-300 space-y-1 list-disc list-inside">
                        {analysisResult.seytaninAvukatiDavaci?.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="font-semibold text-rose-300 mb-1">Davalı Tezine Hücum:</p>
                      <ul className="text-slate-300 space-y-1 list-disc list-inside">
                        {analysisResult.seytaninAvukatiDavali?.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {analysisResult.savunmaKalkaniOnerisi && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-xs text-amber-200">
                      <strong>Savunma Kalkanı:</strong> {analysisResult.savunmaKalkaniOnerisi}
                    </div>
                  )}
                </div>

                {analysisResult.hakimPerspektifi && (
                  <div className="bg-[#0b0f19] border border-sky-900/40 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-sky-400 flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-sky-400" /> Bağımsız Hakim Perspektifi (Olası Şüphe ve Eksiklikler)
                    </h4>
                    <p className="text-[10px] text-slate-500 italic">
                      BU BİR KARAR TAHMİNİ DEĞİLDİR — dosyanın olası soru/itiraz noktalarını öngörmeye yönelik hazırlık listesidir.
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {analysisResult.hakimPerspektifi?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.kanunReferanslari && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">Uygulanabilir Kanun Maddeleri:</span>
                    {analysisResult.kanunReferanslari.map((k: string, idx: number) => (
                      <span key={idx} className="bg-slate-800 text-amber-300 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700">
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <HukukiDenetimBadge lawyerSicilNo={user.sicilNo} variant="compact" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('mevzuat');
                      }}
                      className="text-xs bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                    >
                      <Database className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Mevzuat Sorgulama & İğnele</span>
                      {pinnedArticles.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                          {pinnedArticles.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCrossRefText(`${davaOzeti}\n${clientClaims}`);
                        setActiveTab('crossref');
                      }}
                      className="text-xs bg-sky-500/10 dark:bg-sky-500/20 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                    >
                      <Gavel className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                      <span>Maddeleri Çapraz Doğrula</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDenetlemeInitialText(`${davaOzeti}\n${clientClaims}`);
                        setActiveTab('denetleme');
                      }}
                      className="text-xs bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Denetleme Paneline Aktar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl">
                  <Scale className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Dava Dosyası Henüz Çözümlenmedi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Sol panelden müvekkil taraf sıfatını, somut dava özetini, talepleri ve delilleri girip <strong>"Dava ve Delil Analizini Başlat"</strong> butonuna tıklayın.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: STRATEJİK DAVA BRİFİNGİ */}
      {activeTab === 'briefing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol Kolon: Hukuki Metin Girdi Kartı */}
          <div className="lg:col-span-5 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Stratejik Dava Brifingi: Metin Girişi
              </h2>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                Ön İnceleme & Usul
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sözleşme maddesi, ihtarname, dava dilekçesi pasajı veya bilirkişi tespitini yapıştırın. Sistem metindeki <strong>birincil hukuki riskleri</strong>, <strong>temel savunma/iddia argümanlarını</strong> ve usul tuzaklarını anında ayıklar.
            </p>

            {/* Metin Bağlam Türü */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-300 block">Metin Bağlamı / Belge Türü</label>
              <select
                value={briefingContext}
                onChange={(e) => setBriefingContext(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value="sozlesme">Sözleşme Maddesi & Özel Hüküm (TBK Kapsamı)</option>
                <option value="dava_dilekcesi">Dava / Cevap Dilekçesi Pasajı (HMK / TTK)</option>
                <option value="ihtarname">Noter İhtarnamesi & Temerrüt Bildirimi</option>
                <option value="bilirkisi">Bilirkişi Raporu Alıntısı & Teknik Tespit</option>
                <option value="tutanak">Duruşma Zaptı / Tanık İfadesi (HMK m. 254-257)</option>
                <option value="genel">Serbest Hukuki Uyuşmazlık Metni</option>
              </select>
            </div>

            {/* Hukuki Metin Alanı */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">İncelenecek Hukuki Metin</label>
                <span className="text-[10px] text-slate-500 font-mono">{briefingText.length} karakter</span>
              </div>
              <textarea
                rows={8}
                value={briefingText}
                onChange={(e) => setBriefingText(e.target.value)}
                placeholder="İncelenecek sözleşme hükmü, fesih bildirimi, fatura itiraz metni veya dava vakıalarını buraya yapıştırın..."
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500 transition font-sans text-xs leading-relaxed resize-none"
              />
            </div>

            <button
              disabled={isBriefingLoading || !briefingText.trim()}
              onClick={handleCaseBriefing}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isBriefingLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Gemini Risk & Argüman Analizi Yapıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Brifing Çıkar: Riskleri ve Argümanları Ayrıştır</span>
                </>
              )}
            </button>
          </div>

          {/* Sağ Kolon: Case Briefing Analiz Sonuç Kartı */}
          <div className="lg:col-span-7 space-y-4">
            {briefingResult ? (
              <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-5">
                {/* Header & Risk Banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {briefingResult.source || 'Gemini 3.8 Flash'}
                      </span>
                      {briefingResult.overallRiskLevel && (
                        <span
                          className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded border ${
                            briefingResult.overallRiskLevel === 'CRITICAL'
                              ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                              : briefingResult.overallRiskLevel === 'HIGH'
                              ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                              : briefingResult.overallRiskLevel === 'MEDIUM'
                              ? 'bg-yellow-950/60 border-yellow-600 text-yellow-300'
                              : 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          }`}
                        >
                          RİSK SEVİYESİ: {briefingResult.overallRiskLevel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-1">{briefingResult.title}</h3>
                  </div>

                  <button
                    onClick={() => copyBriefingToClipboard(briefingResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition self-start"
                  >
                    {briefingCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Brifingi Kopyala</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1. Yönetici Özeti */}
                {briefingResult.executiveSummary && (
                  <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" /> Hukuki Yönetici Özeti
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{briefingResult.executiveSummary}</p>
                  </div>
                )}

                {/* 2. BİRİNCİL HUKUKİ RİSKLER */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Birincil Hukuki Riskler & Tehlikeler
                  </h4>
                  <div className="space-y-2.5">
                    {briefingResult.primaryLegalRisks?.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#0b0f19] border border-rose-900/30 hover:border-rose-700/50 rounded-xl p-3.5 space-y-2 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-xs text-slate-100 flex items-start gap-2">
                            <span className="text-rose-400 font-mono text-[11px] mt-0.5">{idx + 1}.</span>
                            <span>{r.risk}</span>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                              r.severity === 'CRITICAL'
                                ? 'bg-rose-900/60 text-rose-200 border border-rose-700'
                                : r.severity === 'HIGH'
                                ? 'bg-amber-900/60 text-amber-200 border border-amber-700'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {r.severity}
                          </span>
                        </div>

                        {r.legalBasis && (
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span className="text-slate-500">Mevzuat Dayanağı:</span>
                            <span className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {r.legalBasis}
                            </span>
                          </div>
                        )}

                        {r.mitigation && (
                          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-2.5 text-[11px] text-emerald-300 leading-relaxed">
                            <strong className="text-emerald-400">Önleme / Savunma Stratejisi:</strong> {r.mitigation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. TEMEL HUKUKİ ARGÜMANLAR */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-sky-400" /> Temel Hukuki Argümanlar ve Tezler
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {briefingResult.keyArguments?.map((arg: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#0b0f19] border border-sky-950/50 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              arg.side?.toLowerCase().includes('davacı') || arg.side?.toLowerCase().includes('alacaklı')
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                            }`}
                          >
                            {arg.side}
                          </span>
                          {arg.impactLevel && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Etki Gücü: <strong className="text-amber-300">{arg.impactLevel}</strong>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{arg.argument}</p>
                        {arg.legalGround && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                            <strong className="text-slate-500">Dayanak / Karine:</strong> {arg.legalGround}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Usuli Alarmlar & Süreler */}
                {briefingResult.proceduralAlerts && briefingResult.proceduralAlerts.length > 0 && (
                  <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" /> Usuli Alarmlar ve Hak Düşürücü Süreler
                    </h4>
                    <ul className="text-xs text-amber-200/90 space-y-1.5 list-disc list-inside">
                      {briefingResult.proceduralAlerts.map((alertItem: string, idx: number) => (
                        <li key={idx}>{alertItem}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Uygulanabilir Mevzuat Hükümleri */}
                {briefingResult.applicableStatutes && briefingResult.applicableStatutes.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 block">Doğrudan Uygulanacak Mevzuat:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {briefingResult.applicableStatutes.map((st: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-mono border border-slate-700"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Stratejik Eylem Önerileri */}
                {briefingResult.strategicRecommendations && briefingResult.strategicRecommendations.length > 0 && (
                  <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Operasyonel Eylem Planı & Avukatlık Tavsiyesi
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {briefingResult.strategicRecommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <AiAssistedBadge lawyerSicilNo={user.sicilNo} variant="compact" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('mevzuat');
                      }}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                    >
                      <Database className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mevzuat Sorgulama & İğnele</span>
                      {pinnedArticles.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                          {pinnedArticles.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCrossRefText(briefingText);
                        setActiveTab('crossref');
                      }}
                      className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                    >
                      <Gavel className="w-3.5 h-3.5 text-sky-400" />
                      <span>Maddeleri Çapraz Doğrula (Verified/Flagged)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDenetlemeInitialText(briefingText);
                        setActiveTab('denetleme');
                      }}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Bu Brifingi Denetleme Panelinde Doğrula</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-200">Case Briefing Henüz Çalıştırılmadı</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Sol taraftaki hazır senaryolardan birini seçin veya müvekkilinizin uyuşmazlık metnini/sözleşme maddesini yapıştırıp <strong>"Brifing Çıkar"</strong> butonuna basın.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left pt-2">
                  <div className="p-3 bg-[#0b0f19] border border-slate-800/80 rounded-xl text-xs space-y-1">
                    <span className="text-amber-400 font-bold block">1. Risk Taraması</span>
                    <span className="text-[11px] text-slate-400">Zamanaşımı, hak düşürücü süre, ispat külfeti ve yetki tuzakları.</span>
                  </div>
                  <div className="p-3 bg-[#0b0f19] border border-slate-800/80 rounded-xl text-xs space-y-1">
                    <span className="text-sky-400 font-bold block">2. Argümanlar</span>
                    <span className="text-[11px] text-slate-400">Davacı ve davalı için kanun ve Yargıtay dayanaklı tezler.</span>
                  </div>
                  <div className="p-3 bg-[#0b0f19] border border-slate-800/80 rounded-xl text-xs space-y-1">
                    <span className="text-emerald-400 font-bold block">3. Savunma Kalkanı</span>
                    <span className="text-[11px] text-slate-400">Riski bertaraf edecek önleme ve stratejik eylem adımları.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ŞEYTANIN AVUKATI (HARP ODASI) */}
      {activeTab === 'devils' && (
        <div className="space-y-6">
          <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Şeytanın Avukatı — Harp Odası ve Karşı Hamle Simülasyonu
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Müvekkilinizin tezini bağımsız bir karşı taraf avukatı gözüyle acımasızca test eder; zayıf karınları ve usul tuzaklarını önceden tespit eder.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-300 block">Saldırıya Uğratılacak Dava / Savunma Kurgusu</label>
              <textarea
                rows={3}
                value={devilSummary}
                onChange={(e) => setDevilSummary(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
              <button
                disabled={isDevilLoading}
                onClick={handleDevilsAdvocate}
                className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                {isDevilLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                <span>Tezi Test Et ve Saldırı Açıklarını Bul</span>
              </button>
            </div>
          </div>

          {devilResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#131d31] border border-rose-900/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Davacı Tezine Karşı En Kritik Açıklar
                </h3>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  {devilResult.davaciTeziZayifliklari?.map((z: string, i: number) => (
                    <li key={i} className="leading-relaxed">{z}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#131d31] border border-amber-900/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Davalı Savunmasına Karşı Zayıflıklar
                </h3>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  {devilResult.davaliTeziZayifliklari?.map((z: string, i: number) => (
                    <li key={i} className="leading-relaxed">{z}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-sky-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" /> Usul Tuzakları ve Zamanaşımı Def'ileri
                </h3>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  {devilResult.usulTuzaklari?.map((z: string, i: number) => (
                    <li key={i} className="leading-relaxed">{z}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#131d31] border border-emerald-900/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Önerilen Savunma Kalkanı ve İspat Hamlesi
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                  {devilResult.savunmaKalkaniOnerisi}
                </p>
                {devilResult.senetleIspatKurali && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <strong>HMK m. 200 Senet Kuralı:</strong> {devilResult.senetleIspatKurali.join('; ')}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <AiAssistedBadge lawyerSicilNo={user.sicilNo} variant="compact" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCrossRefText(devilSummary);
                        setActiveTab('crossref');
                      }}
                      className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                    >
                      <Gavel className="w-3.5 h-3.5 text-sky-400" />
                      <span>İddiaları Çapraz Doğrula (Verified/Flagged)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDenetlemeInitialText(devilSummary);
                        setActiveTab('denetleme');
                      }}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Denetleme Paneline Aktar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ZAMANAŞIMI & FAİZ HESAPLAMA MOTORU (TEMPORAL LAW ENGINE) */}
      {activeTab === 'temporal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" /> Zamanaşımı ve Faiz Hesaplama Parametreleri
            </h2>
            <p className="text-xs text-slate-400">
              TBK m. 146/147, 4857 s.K. m. 32 zamanaşımı denetimi ve 3095 Sayılı Kanun faiz hesaplayıcısı.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Uyuşmazlık / Muacceliyet Tarihi</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Uyuşmazlık / Alacak Türü</label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                >
                  <option value="genel">Sözleşmesel Alacak (TBK m. 146 - 10 Yıl)</option>
                  <option value="is_hukuku">İşçilik / Ücret Alacağı (İş K. m. 32 - 5 Yıl)</option>
                  <option value="kira">Kira Bedeli / Dava (TBK m. 147 - 5 Yıl)</option>
                  <option value="haksiz_fiil">Haksız Fiil / Tazminat (TBK m. 72 - 2/10 Yıl)</option>
                  <option value="donme_ayipli">Ayıplı Mal Satışı (TBK m. 244 - 2 Yıl)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Asıl Alacak Tutarı (TL)</label>
                <input
                  type="number"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Faiz Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCommercialInterest(false)}
                    className={`py-2 rounded-xl font-semibold border transition ${
                      !isCommercialInterest
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Yasal Faiz (%24)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCommercialInterest(true)}
                    className={`py-2 rounded-xl font-semibold border transition ${
                      isCommercialInterest
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Ticari Avans (%48)
                  </button>
                </div>
              </div>

              <button
                disabled={isTemporalLoading}
                onClick={handleTemporalCalc}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {isTemporalLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                <span>Zamanaşımı ve Faizi Hesapla</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Hesaplama Sonucu ve Usuli Süreler
            </h3>

            {temporalResult ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Asıl Alacak</span>
                    <strong className="text-base text-slate-100">
                      {temporalResult.aslAlacak?.toLocaleString('tr-TR')} TL
                    </strong>
                  </div>

                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Hesaplanan Faiz</span>
                    <strong className="text-base text-amber-300">
                      +{temporalResult.hesaplananFaiz?.toLocaleString('tr-TR')} TL
                    </strong>
                  </div>

                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
                    <span className="text-slate-400 block text-[11px]">Toplam İcra/Dava Talebi</span>
                    <strong className="text-base text-emerald-400 font-black">
                      {temporalResult.toplamTalep?.toLocaleString('tr-TR')} TL
                    </strong>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${temporalResult.isExpired ? 'bg-rose-950/30 border-rose-800/60' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      {temporalResult.isExpired ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      Zamanaşımı Durumu: {temporalResult.zamanAsimiDurumu}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      Geçen: {temporalResult.gecenYil} Yıl ({temporalResult.gecenGun} Gün)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dayanak: <strong>{temporalResult.kanunDayanagi}</strong> | Yasal Süre Sınırı: {temporalResult.zamanAsimiSiniri}
                  </p>
                </div>

                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" /> Kritik Usuli Süre Takvimi (HMK / İYUK)
                  </h4>
                  <div className="space-y-1.5">
                    {temporalResult.usuliSureler?.map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border-b border-slate-800/60 py-1">
                        <span className="text-slate-300">{s.ad}</span>
                        <span className="text-amber-400 font-mono font-semibold">{s.sure}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">Bu süreleri ve zamanaşımını dinamik takvimde takip edin:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                    <span>Dava Zaman Çizelgesine ve Takvime Git</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#0b0f19] rounded-xl border border-dashed border-slate-800">
                <Calculator className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Soldaki parametreleri doldurup hesaplama yapın.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: 35 NOKTALI USUL VE DAVA ŞARTI DENETİMİ */}
      {activeTab === 'procedural' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> 35 Noktalı Usul Denetimi (LawArticleValidator)
            </h2>
            <p className="text-xs text-slate-400">
              HMK m. 114 Dava Şartları, m. 116 İlk İtirazlar ve m. 119 Dilekçe Zorunlu Unsurlarını otomatik denetler.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Görevli Mahkeme</label>
                <input
                  type="text"
                  value={procCourt}
                  onChange={(e) => setProcCourt(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Dava Değeri</label>
                <input
                  type="text"
                  value={procAmount}
                  onChange={(e) => setProcAmount(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="space-y-2 bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={procCommercial}
                    onChange={(e) => setProcCommercial(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>Ticari Uyuşmazlık (TTK m. 4 kapsamında)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={procMediation}
                    onChange={(e) => setProcMediation(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>Zorunlu Arabuluculuk Son Tutanağı Mevcut (TTK 5/A)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={procPoa}
                    onChange={(e) => setProcPoa(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>Baro Pulu ve Onaylı Vekaletname Ekli (HMK 114/1-f)</span>
                </label>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Dava Özeti / Açıklama</label>
                <textarea
                  rows={2}
                  value={procSummary}
                  onChange={(e) => setProcSummary(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2 text-slate-200"
                />
              </div>

              <button
                disabled={isProcLoading}
                onClick={handleProceduralAudit}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {isProcLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>35 Noktalı Usul Denetimini Çalıştır</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Usul Denetimi Raporu ve Risk Puanı
            </h3>

            {procResult ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{procResult.davaSartlariDurumu}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{procResult.gorevVeYetkiAnalizi}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Usul Uygunluk Puanı</span>
                    <span className={`text-2xl font-black ${procResult.usulUygunlukPuani >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {procResult.usulUygunlukPuani}/100
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Tespit Edilen Usul Riskleri ve Uyarılar
                  </h4>
                  <div className="space-y-1.5">
                    {procResult.tespitEdilenRiskler?.map((r: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-sky-300">HMK m. 119 Zorunlu Unsur Kontrolleri</h4>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    {procResult.dilekceZorunluUnsurlar?.map((u: string, idx: number) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#0b0f19] rounded-xl border border-dashed border-slate-800">
                <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Soldaki parametreleri doldurup denetimi başlatın.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: BİLİRKİŞİ RAPORU İNCELEME & İTİRAZ LABORATUVARI */}
      {activeTab === 'expert' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-orange-400" /> Bilirkişi Raporu İnceleme Ajanı (HMK 266 / 281)
            </h2>
            <p className="text-xs text-slate-400">
              Bilirkişinin hakimin yerine geçip hukuki tavsifte bulunmasını ve hesap hatalarını tespit eder, 2 haftalık kesin süreye tabi itiraz layihası üretir.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Tebliğ Edilen Rapor Özeti / Sonuç Kısmı</label>
                <textarea
                  rows={5}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-3 text-slate-200"
                />
              </div>

              <button
                disabled={isExpertLoading}
                onClick={handleExpertAudit}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-600/20"
              >
                {isExpertLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>Raporu Denetle ve İtiraz Layihası Hazırla</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-orange-400" /> HMK m. 281 İtiraz Layihası ve İhlal Analizi
              </h3>
              {expertResult?.itirazDilekcesiTaslagi && (
                <button
                  onClick={() => copyToClipboard(expertResult.itirazDilekcesiTaslagi)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı' : 'Panoya Kopyala'}</span>
                </button>
              )}
            </div>

            {expertResult ? (
              <div className="space-y-3 text-xs">
                <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl space-y-1">
                  <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Tespit Edilen Yetki Aşımı ve Çelişkiler:
                  </h4>
                  <ul className="text-slate-300 space-y-1 list-disc list-inside">
                    {expertResult.tespitEdilenCeliskiler?.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Üretilen Resmi İtiraz Layihası:</label>
                  <textarea
                    readOnly
                    rows={10}
                    value={expertResult.itirazDilekcesiTaslagi}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-3 font-mono text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#0b0f19] rounded-xl border border-dashed border-slate-800">
                <FileSpreadsheet className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Soldaki alana bilirkişi raporunu girip inceletin.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DURUŞMA VE ÇAPRAZ SORGU SİMÜLATÖRÜ */}
      {activeTab === 'hearing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Mic className="w-4 h-4 text-cyan-400" /> Duruşma Hazırlığı & Çapraz Sorgu Ajanı (HMK 254-257)
            </h2>
            <p className="text-xs text-slate-400">
              Tanık çapraz sorgusunda sorulacak sorular, usuli itirazlar ve zapta geçirilmesi gereken şerhler.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Duruşma Celsesi / Aşaması</label>
                <input
                  type="text"
                  value={hearingStage}
                  onChange={(e) => setHearingStage(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Karşı Taraf Tanığının Beyanı veya İddiaları</label>
                <textarea
                  rows={4}
                  value={witnessStatement}
                  onChange={(e) => setWitnessStatement(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-3 text-slate-200"
                />
              </div>

              <button
                disabled={isHearingLoading}
                onClick={handleHearingPrep}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-600/20"
              >
                {isHearingLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                <span>Çapraz Sorgu ve Duruşma Stratejisini Üret</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Mic className="w-4 h-4 text-cyan-400" /> Çapraz Sorgu Soruları ve Zapta Geçirilecek Şerhler
            </h3>

            {hearingResult ? (
              <div className="space-y-4 text-xs">
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-400">Tanığa Yöneltilecek Çapraz Sorgu Soruları (HMK m. 254-257):</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    {hearingResult.tanikCaprazSorguSorulari?.map((q: string, idx: number) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-rose-300">Duruşma Zaptına Geçirilmesi Zorunlu Şerhler:</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    {hearingResult.zaptaGecirilecekSerhler?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-cyan-950/20 border border-cyan-900/40 p-3.5 rounded-xl text-slate-300">
                  <strong className="text-cyan-300 block mb-1">Hakime Sunulacak Sözlü Beyan:</strong>
                  {hearingResult.hakimeSunulacakSozluBeyan}
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">Duruşma celsenizi ve takvim hatırlatmasını takip edin:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                    <span>Dava Takvimini Görüntüle</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#0b0f19] rounded-xl border border-dashed border-slate-800">
                <Mic className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Duruşma bilgilerini girip simülasyonu başlatın.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: UYAP DİLEKÇE LABORATUVARI */}
      {activeTab === 'petition' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" /> UYAP Dilekçe Parametreleri
            </h2>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Mahkeme</label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Davacı (Müvekkil)</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Davalı (Karşı Taraf)</label>
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Konu</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold block text-xs">Olay Açıklamaları ve Hukuki Dayanaklar</label>
                  {pinnedArticles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allPinnedText = pinnedArticles
                          .map(
                            (p) =>
                              `${p.article.lawCode} m. ${p.article.article} (${p.article.title}): "${p.article.fullText}"${
                                p.lawyerNote ? ` [İddia / Savunma Gerekçemiz: ${p.lawyerNote}]` : ''
                              }`
                          )
                          .join('\n\n');
                        setPetitionDetails((prev) =>
                          prev
                            ? `${prev}\n\n[DOSYAYA İĞNELENEN MEVZUAT HÜKÜMLERİ]:\n${allPinnedText}`
                            : `[DOSYAYA İĞNELENEN MEVZUAT HÜKÜMLERİ]:\n${allPinnedText}`
                        );
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold transition"
                      title="Dosyaya iğnelenen tüm maddeleri dilekçeye ekle"
                    >
                      <Pin className="w-3 h-3 fill-amber-400" />
                      <span>İğnelenen {pinnedArticles.length} Maddeyi Aktar</span>
                    </button>
                  )}
                </div>

                {pinnedArticles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-[#0e1626] border border-amber-500/20 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 text-amber-400" /> İğnelenenler:
                    </span>
                    {pinnedArticles.map((p) => (
                      <button
                        key={p.article.id}
                        type="button"
                        onClick={() => {
                          const singleText = `${p.article.lawCode} m. ${p.article.article} (${p.article.title}) uyarınca: "${p.article.fullText}"${
                            p.lawyerNote ? ` (Gerekçe: ${p.lawyerNote})` : ''
                          }`;
                          setPetitionDetails((prev) => (prev ? `${prev}\n\n${singleText}` : singleText));
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-950/40 text-amber-300 border border-slate-700 hover:border-amber-600 transition flex items-center gap-1"
                        title="Dilekçeye eklemek için tıklayın"
                      >
                        <span>+ {p.article.lawCode} m. {p.article.article}</span>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={petitionDetails}
                  onChange={(e) => setPetitionDetails(e.target.value)}
                  placeholder="Davanın somut vakıaları, deliller ve kanun maddeleri..."
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                disabled={isPetitionLoading}
                onClick={handleGeneratePetition}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPetitionLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                <span>UYAP Formatında Dilekçe Taslağı Oluştur</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> Üretilen UYAP Dilekçe Metni
              </h3>
              {petitionText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerUdfDownload(
                        `UYAP_${(caseNo || 'Dava_Dilekcesi').replace(/[^a-zA-Z0-9]/g, '_')}`,
                        petitionText,
                        {
                          court,
                          caseNo,
                          subject: subject,
                          plaintiff: client,
                          defendant: opponent,
                          lawyerName: user.fullName,
                          lawyerSicil: user.sicilNo,
                          documentTitle: 'UYAP Dava Dilekçesi Taslağı'
                        }
                      );
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg border border-emerald-500 flex items-center gap-1.5 transition shadow-sm"
                    title="Adalet Bakanlığı UYAP Editörde açılabilir .udf formatında indir"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>UYAP (.UDF) İndir</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(petitionText)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopyalandı' : 'Panoya Kopyala'}</span>
                  </button>
                </div>
              )}
            </div>

            {petitionText ? (
              <div className="space-y-3">
                <textarea
                  readOnly
                  rows={16}
                  value={petitionText}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none"
                />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <AiAssistedBadge variant="stamp" lawyerSicilNo={user.sicilNo} />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('mevzuat');
                      }}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-xl flex items-center gap-1.5 transition flex-shrink-0 font-bold"
                    >
                      <Database className="w-4 h-4 text-amber-400" />
                      <span>Mevzuat Sorgulama & İğnele</span>
                      {pinnedArticles.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                          {pinnedArticles.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCrossRefText(petitionText);
                        setActiveTab('crossref');
                      }}
                      className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-2 rounded-xl flex items-center gap-1.5 transition flex-shrink-0 font-bold"
                    >
                      <Gavel className="w-4 h-4 text-sky-400" />
                      <span>Dilekçe Maddelerini Çapraz Doğrula</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDenetlemeInitialText(petitionText);
                        setActiveTab('denetleme');
                      }}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-xl flex items-center gap-1.5 transition flex-shrink-0 font-bold"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Dilekçeyi Denetleme Panelinde Doğrula</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-[#0b0f19] rounded-xl border border-dashed border-slate-800">
                <FileText className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Soldaki parametreleri doldurup taslak oluşturun.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: EMSAL KARAR ARAMA */}
      {activeTab === 'precedent' && (
        <div className="space-y-5">
          <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-400" /> Yargıtay & Danıştay İçtihat Tarama Ajanı
            </h2>
            <p className="text-xs text-slate-400">
              Yargıtay Hukuk Genel Kurulu, Ceza Genel Kurulu ve ilgili dairelerin emsal kararlarını sorgulayın.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Örn: senetle ispat sınırı tanık dinlenmesi, işe iade feshin geçersizliği..."
                className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                onKeyDown={(e) => e.key === 'Enter' && handlePrecedentSearch()}
              />
              <button
                disabled={isSearchLoading}
                onClick={handlePrecedentSearch}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSearchLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>İçtihat Ara</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {precedents.map((p, idx) => (
              <div key={idx} className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-2 hover:border-slate-700 transition">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">{p.mahkeme}</span>
                  <span className="font-mono text-slate-400">{p.esasKarar}</span>
                  <span className="text-slate-500">{p.tarih}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                  {p.ozet}
                </p>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="text-teal-400 font-semibold">İlgili Mevzuat:</span>
                  <span className="font-mono">{p.ilgiliMaddeler}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: GÖRSEL BELGE OKUMA / OCR */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-purple-400" /> Taranmış Adli Evrak & Belge Okuma
            </h2>
            <p className="text-xs text-slate-400">
              Mahkeme tutanakları, delil listeleri veya fotoğrafı çekilmiş adli belgeler satır satır taranır.
            </p>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">Belge Metni veya Tutanak İçeriği</label>
              <textarea
                rows={8}
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="İncelenecek adli evrak, tutanak veya delil metnini buraya yapıştırın..."
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
              <button
                disabled={isOcrLoading}
                onClick={handleOcr}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isOcrLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
                <span>Belgeyi Oku ve Hukuki Alanları Ayrıştır</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Otomatik Ayrıştırılan Adli Veriler
            </h3>

            {ocrResult ? (
              <div className="space-y-3 text-xs">
                <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Belge Türü:</span>
                    <strong className="text-slate-200">{ocrResult.tespitEdilenAlanlar?.belgeTuru}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Mahkeme:</span>
                    <strong className="text-slate-200">{ocrResult.tespitEdilenAlanlar?.mahkeme}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Dosya / Esas No:</span>
                    <strong className="text-amber-400 font-mono">{ocrResult.tespitEdilenAlanlar?.esasNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dava Değeri / Talep:</span>
                    <strong className="text-emerald-400 font-mono">{ocrResult.tespitEdilenAlanlar?.talepMiktari}</strong>
                  </div>
                </div>

                <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-xl text-purple-200 text-xs">
                  <span className="font-semibold block mb-0.5">OCR Notu:</span>
                  {ocrResult.belgeOkumaNotu}
                </div>

                {/* Evrakta Yapay Zeka (AI) Kullanım İzi & Tespit Notu */}
                {ocrResult.yapayZekaIzTespiti && (
                  <div className={`p-4 rounded-xl border ${
                    ocrResult.yapayZekaIzTespiti.aiDetected
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  } space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className={`w-4 h-4 ${ocrResult.yapayZekaIzTespiti.aiDetected ? 'text-rose-400' : 'text-emerald-400'}`} />
                        <span className="font-bold text-xs">Evrakta Yapay Zeka (AI) İz Tespiti</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        ocrResult.yapayZekaIzTespiti.aiDetected
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        AI Skoru: %{ocrResult.yapayZekaIzTespiti.aiDetectionScore}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {ocrResult.yapayZekaIzTespiti.aiDetectionNote}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="font-semibold text-slate-300">Denetleme Protokolü: </span>
                      Şablon LLM kalıpları, uydurma içtihat ve gerçek dışı madde atıfları taranmıştır.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#0b0f19] rounded-xl border border-dashed border-slate-800">
                <FileSearch className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Henüz evrak taranmadı.</p>
              </div>
            )}
          </div>

          {/* GÖZDEN KAÇABİLECEK MİKRO AYRINTILAR & USUL RİSKLERİ (Tam Genişlik) */}
          {ocrResult && ocrResult.gozdenKacanMikroAyrintilar && (
            <div className="lg:col-span-12 bg-[#131d31] border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Gözden Kaçabilecek Bütün İnce Ayrıntılar & Usul Tuzakları (HMK / TTK / TBK)
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  Adli Belge Analiz Modülü
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Evrak üzerindeki imza, yetki, tebliğ tarihi, ihtirazi kayıt ve zamanaşımı gibi gözden kaçması halinde davayı kaybettirebilecek mikro detaylar aşağıda listelenmiştir:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {ocrResult.gozdenKacanMikroAyrintilar.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#0b0f19] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 space-y-2 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{item.detay}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        item.onemDerecesi === 'KRİTİK'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {item.onemDerecesi}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.tespit}
                    </p>
                    {item.kanunDayanagi && (
                      <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                        <BookOpen className="w-3 h-3" />
                        <span>Mevzuat Dayanağı: {item.kanunDayanagi}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <HukukiDenetimBadge variant="stamp" lawyerSicilNo={user.sicilNo} />
                <button
                  type="button"
                  onClick={() => {
                    setDenetlemeInitialText(ocrResult.belgeIcerigiMetin || ocrResult.hukukiIcerikOzeti || '');
                    setActiveTab('denetleme');
                  }}
                  className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-xl flex items-center gap-1.5 transition flex-shrink-0 font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Evrak İddialarını Denetleme Panelinde Doğrula</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 11: ADLİ SESLİ DİKTE & DURUŞMA ZAPTI TRANSKRİPSİYONU */}
      {activeTab === 'audio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Adli Sesli Dikte & Duruşma Zaptı Motoru
              </h2>
              <span className="text-[10px] font-mono bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Adli Transkripsiyon
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Duruşma ses kayıtları, müvekkil mülakatları ve avukat sesli dikte notları yüksek adli doğrulukla ve konuşmacı ayrımıyla (Hakim, Davacı Vekili, Davalı Vekili) metne dönüştürülür.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Kayıt Türü & Senaryo</label>
                <select
                  value={audioType}
                  onChange={(e) => setAudioType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="durusma_zapti">Duruşma Zaptı & Karar Tutanakları</option>
                  <option value="muvekkil_gorusme">Müvekkil Olay Anlatımı & Mülakat</option>
                  <option value="avukat_dikte">Avukat Hızlı Dikte Notu & Dilekçe Taslağı</option>
                  <option value="tanik_beyani">Tanık Dinleme & Çapraz Sorgu Kaydı</option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-[#0b0f19] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Kayıt Modeli:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Adli Zabıt & Konuşmacı Ayrımı</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Duruşmada zapta geçen iddialar, süre talepleri (HMK m. 127) ve hakimin ara kararları çözümlenecektir.
                </div>
              </div>

              <button
                disabled={isAudioLoading}
                onClick={handleAudioTranscribe}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {isAudioLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                <span>Adli Ses Kaydını Çözümle & Transkribe Et</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Adli Transkripsiyon & Konuşmacı Ayrımı
              </h3>
              {audioTranscriptText && (
                <button
                  onClick={() => copyToClipboard(audioTranscriptText)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı' : 'Zaptı Kopyala'}</span>
                </button>
              )}
            </div>

            {audioResult ? (
              <div className="space-y-4 text-xs">
                {/* Konuşmacı Dağılımı Rozetleri */}
                {audioResult.konusmaciDagilimi && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {audioResult.konusmaciDagilimi.map((speaker: any, sIdx: number) => (
                      <div key={sIdx} className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-700 dark:text-amber-300 text-xs">{speaker.konusmaci}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{speaker.kelimeSayisi} kelime</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {speaker.yasalYetki || speaker.temelIddia || speaker.temelSavunma}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metin Çıktısı */}
                <div className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700/80 rounded-xl p-4 font-mono text-xs text-slate-900 dark:text-slate-200 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
                  {audioTranscriptText}
                </div>

                {/* Usul İkazları */}
                {audioResult.usuliUyarilar && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
                    <span className="font-bold text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Zapt Edilen Kritik Usul Uyarıları & Kesin Süreler:
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                      {audioResult.usuliUyarilar.map((uyari: string, uIdx: number) => (
                        <li key={uIdx}>{uyari}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <HukukiDenetimBadge variant="stamp" lawyerSicilNo={user.sicilNo} />
                  <button
                    type="button"
                    onClick={() => {
                      setDenetlemeInitialText(audioTranscriptText);
                      setActiveTab('denetleme');
                    }}
                    className="text-xs bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center gap-1.5 transition flex-shrink-0 font-bold"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Zaptı Denetleme Panelinde Doğrula</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                <Mic className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Soldaki butona tıklayarak adli ses kaydı transkripsiyonunu başlatın.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 12: ZORUNLU HUKUKİ DAYANAK & MEVZUAT DENETLEME PANELİ */}
      {activeTab === 'denetleme' && (
        <DenetlemePaneli
          lawyerSicilNo={user.sicilNo}
          initialText={denetlemeInitialText || `${davaOzeti}\n${clientClaims}`}
          caseSummary={davaOzeti}
          clientClaims={clientClaims}
          onVerifiedTextExport={(verifiedText) => {
            setPetitionDetails(verifiedText);
            setActiveTab('petition');
          }}
          onNavigateToCrossRef={(text) => {
            setCrossRefText(text);
            setActiveTab('crossref');
          }}
        />
      )}

      {/* TAB 13: MEVZUAT & EMSAL İÇTİHAT ÇAPRAZ DOĞRULAMA SERVİSİ (VERIFIED / FLAGGED) */}
      {activeTab === 'crossref' && (
        <MevzuatCaprazDogrulama
          lawyerSicilNo={user.sicilNo}
          initialText={crossRefText || denetlemeInitialText || `${davaOzeti}\n${clientClaims}`}
          onTextUpdate={(updatedText) => {
            setCrossRefText(updatedText);
          }}
        />
      )}

      {/* TAB 14: MEVZUAT SORGULAMA & DAVA DOSYASINA MADDE İĞNELEME & HUKUK TERİMLERİ SÖZLÜĞÜ */}
      {(activeTab === 'mevzuat' || activeTab === 'legaldb' || activeTab === 'sozluk') && (
        <MevzuatSorgulama
          initialCaseContext={davaOzeti ? `Dava Özeti: ${davaOzeti}\nİddialar: ${clientClaims}` : undefined}
          initialDavaTuru={analysisResult?.davaTuru}
          initialSubTab={activeTab === 'sozluk' ? 'glossary' : 'search'}
          pinnedArticles={pinnedArticles}
          onTogglePinArticle={handleTogglePinArticle}
          onUpdateArticleNote={handleUpdateArticleNote}
          onApplyArticleToPetition={(citationText) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${citationText}` : citationText));
            setActiveTab('petition');
          }}
          onApplyArticleToAnalysis={(text) => {
            setKanitListesi((prev) => (prev ? `${prev}\n\n[Mevzuat Dayanağı]: ${text}` : `[Mevzuat Dayanağı]: ${text}`));
            setActiveTab('analysis');
          }}
        />
      )}

      {/* TAB 15: DAVA ZAMAN ÇİZELGESİ & DİNAMİK TAKVİM (CASE TIMELINE) */}
      {activeTab === 'timeline' && (
        <CaseTimeline
          caseSummary={davaOzeti}
          eventDate={eventDate}
          clientClaims={clientClaims}
          courtName={court || (analysisResult?.yetkiliGorevliMahkeme)}
          caseNumber={caseNo}
          onApplyToPetition={(text) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${text}` : text));
            setActiveTab('petition');
          }}
        />
      )}

      {/* TAB 16: DAVA DERİN ANALİZ (GEMINI FLASH VS PRO TOGGLE & CASE FILES UPLOAD) */}
      {activeTab === 'deep_analysis' && (
        <DavaDerinAnaliz
          lawyerSicilNo={user.sicilNo}
          onApplyToPetition={(text) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${text}` : text));
            setActiveTab('petition');
          }}
          onNavigateToTimeline={() => {
            setActiveTab('timeline');
          }}
          onNavigateToCrossref={(article) => {
            setCrossRefText(article);
            setActiveTab('crossref');
          }}
        />
      )}

      {/* TAB 17: CASE ANALYTICS DASHBOARD (D3.JS CASE STATUS DISTRIBUTION & UPCOMING DEADLINES) */}
      {activeTab === 'analytics' && (
        <CaseAnalytics
          user={{
            fullName: user.fullName,
            sicilNo: user.sicilNo,
            baroAdi: user.baroAdi,
          }}
          onNavigateToTimeline={() => {
            setActiveTab('timeline');
          }}
          onNavigateToDeepAnalysis={() => {
            setActiveTab('deep_analysis');
          }}
          onSelectCaseForPetition={(caseSummary) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${caseSummary}` : caseSummary));
            setActiveTab('petition');
          }}
        />
      )}

      {/* TAB 18: MÜVEKKİL & DAVA PORTALİ (HİYERARŞİK MÜVEKKİL -> DAVA -> EVRAKLAR) */}
      {activeTab === 'portal' && (
        <MuvekkilDavaPortali
          onConsultCouncil={(context) => {
            setCouncilCaseContext(context);
            setActiveTab('council');
          }}
          onNavigateToPetition={(text) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${text}` : text));
            setActiveTab('petition');
          }}
          onSyncGit={handleQuickGitSync}
        />
      )}

      {/* YENİ TAB: ARŞİVLENEN DAVALAR (ARCHIVED CASES) */}
      {activeTab === 'archived_cases' && (
        <ArchivedCasesTab
          onNavigateToPortal={() => setActiveTab('portal')}
          onNavigateToPetition={(text) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${text}` : text));
            setActiveTab('petition');
          }}
          onNavigateToDeepAnalysis={(caseNumber) => {
            setActiveTab('deep_analysis');
          }}
        />
      )}

      {/* TAB 19: BAŞ HUKUK MÜŞAVİRİ & AJAN KONSEYİ KONSÜLTASYON ODASI */}
      {activeTab === 'council' && (
        <AjanKonseyiOdasi
          initialCaseContext={councilCaseContext}
          onApplyToPetition={(text) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${text}` : text));
            setActiveTab('petition');
          }}
          onSyncGit={handleQuickGitSync}
        />
      )}

      {/* TAB 20: SEÇMELİ ÖZELLİKLER & GITHUB SENKRONİZASYON KONSOLU */}
      {activeTab === 'features_git' && (
        <SecmeliOzelliklerVeGitPaneli
          onNavigateToTab={(tabKey) => {
            setActiveTab(tabKey);
          }}
        />
      )}

      {/* TAB 21: ADLİ HAKİKAT, ŞAHİT ÇELİŞKİSİ & CIMBIZ AJANI LABORATUVARI */}
      {activeTab === 'forensic_audit' && (
        <AdliDelilVeSahitAjanPaneli
          initialCaseNo={caseNo || '2024/782 Esas'}
          initialCourt={court || procCourt || 'İstanbul 14. Asliye Ticaret Mahkemesi'}
          initialSubject={davaOzeti || 'Ticari Fatura ve İrsaliyeye Dayalı İtirazın İptali Davası'}
          initialPlaintiff={client || 'Atlas Tekstil Sanayi ve Dış Ticaret A.Ş.'}
          initialDefendant={opponent || 'Bosphorus Lojistik Depolama Ltd. Şti.'}
          onApplyToPetition={(text) => {
            setPetitionDetails((prev) => (prev ? `${prev}\n\n${text}` : text));
            setActiveTab('petition');
          }}
          onNavigateToTab={(tabKey: any) => {
            setActiveTab(tabKey);
          }}
        />
      )}

      {/* TAB 22: KİŞİYE ÖZEL MOBİL APK İNDİRME & MÜHÜRLEME */}
      {activeTab === 'apk_download' && (
        <KisiselApkIndirmePaneli
          user={user}
          onNavigateBack={() => setActiveTab('portal')}
        />
      )}

      {/* Müvekkil & Dava Gezgini (Client & Case Explorer Sidebar) */}
      <ClientCaseExplorerSidebar
        isOpen={isExplorerOpen}
        onToggle={() => setIsExplorerOpen(!isExplorerOpen)}
        onSelectCaseForWorkspace={handleSelectCaseFromExplorer}
        onConsultCouncil={(context) => {
          setCouncilCaseContext(context);
          setActiveTab('council');
        }}
        onApplyToPetition={(text) => {
          setPetitionDetails((prev) => (prev ? `${prev}\n\n${text}` : text));
          setActiveTab('petition');
        }}
      />
    </div>
  );
}

