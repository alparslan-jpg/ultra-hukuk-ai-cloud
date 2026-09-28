import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Scale,
  Pin,
  PinOff,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  FileText,
  Filter,
  Layers,
  Database,
  Tag,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  BookmarkCheck,
  Trash2,
  Edit3,
  ExternalLink,
  Clock
} from 'lucide-react';
import { LegalArticle, SemanticSearchResult } from '../services/legalDatabaseService';
import { HukukTerimleriSozlugu } from './HukukTerimleriSozlugu';
import { RecentSearchesSidebar } from './RecentSearchesSidebar';
import {
  RecentSearchItem,
  getRecentSearches,
  addRecentSearch,
  subscribeRecentSearches
} from '../services/recentSearchesService';

export interface PinnedLegalArticle {
  article: LegalArticle;
  pinnedAt: string;
  lawyerNote?: string;
  relevanceTag?: 'Esas Savunma' | 'Görev / Yetki' | 'Zamanaşımı' | 'İspat / Delil' | 'Tazminat / Alacak' | 'Genel';
}

interface MevzuatSorgulamaProps {
  initialCaseContext?: string;
  initialDavaTuru?: string;
  initialSubTab?: 'search' | 'glossary' | 'pinned';
  pinnedArticles: PinnedLegalArticle[];
  onTogglePinArticle: (article: LegalArticle, tag?: PinnedLegalArticle['relevanceTag'], note?: string) => void;
  onUpdateArticleNote?: (articleId: string, note: string, tag?: PinnedLegalArticle['relevanceTag']) => void;
  onApplyArticleToPetition?: (citationText: string) => void;
  onApplyArticleToAnalysis?: (text: string) => void;
}

export function MevzuatSorgulama({
  initialCaseContext,
  initialDavaTuru,
  initialSubTab = 'search',
  pinnedArticles,
  onTogglePinArticle,
  onUpdateArticleNote,
  onApplyArticleToPetition,
  onApplyArticleToAnalysis
}: MevzuatSorgulamaProps) {
  // View mode: 'search' | 'glossary' | 'pinned'
  const [activeSubView, setActiveSubView] = useState<'search' | 'glossary' | 'pinned'>(initialSubTab || 'search');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubView(initialSubTab);
    }
  }, [initialSubTab]);

  // Search States
  const [query, setQuery] = useState<string>('');
  const [lawFilter, setLawFilter] = useState<'ALL' | 'TMK' | 'TBK' | 'HMK'>('ALL');
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [searchType, setSearchType] = useState<string>('');
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAllPinned, setCopiedAllPinned] = useState<boolean>(false);

  // Suggestions & Stats
  const [suggestedCategories, setSuggestedCategories] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);

  // View state: 'search' or 'pinned_tray'
  const [showPinnedTray, setShowPinnedTray] = useState<boolean>(pinnedArticles.length > 0);
  const [editingNoteArticleId, setEditingNoteArticleId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [tempTag, setTempTag] = useState<PinnedLegalArticle['relevanceTag']>('Genel');

  // Recent Searches Sidebar State
  const [showRecentSearches, setShowRecentSearches] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => getRecentSearches());
  const [activeGlossaryLookupTerm, setActiveGlossaryLookupTerm] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsub = subscribeRecentSearches((items) => {
      setRecentSearches(items);
    });
    return unsub;
  }, []);

  // Load stats and suggested queries on mount
  useEffect(() => {
    fetch('/api/legal-database/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDbStats(data);
        }
      })
      .catch((err) => console.warn('Legal database stats error:', err));

    fetch('/api/legal-database/suggested-queries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.suggestions) {
          setSuggestedCategories(data.suggestions);
        }
      })
      .catch((err) => console.warn('Suggested queries error:', err));

    // Run initial contextual search
    const defaultQuery = initialDavaTuru || (initialCaseContext ? initialCaseContext.slice(0, 80) : 'temerrüt ve senetle ispat');
    handleSearch(defaultQuery);
  }, []);

  const handleSearch = async (overrideKeyword?: string, overrideFilter?: 'ALL' | 'TMK' | 'TBK' | 'HMK') => {
    const q = (overrideKeyword !== undefined ? overrideKeyword : query).trim();
    if (!q) return;

    if (overrideKeyword !== undefined) {
      setQuery(overrideKeyword);
    }

    const currentFilter = overrideFilter !== undefined ? overrideFilter : lawFilter;

    // Record to last 5 recent legal searches (KVKK local storage)
    if (q && q.length >= 2) {
      addRecentSearch(q, currentFilter !== 'ALL' ? currentFilter : undefined, 'mevzuat');
    }

    setIsSearching(true);
    setExecutiveSummary('');

    try {
      const res = await fetch('/api/legal-database/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          lawFilter: currentFilter,
          limit: 12,
          minScore: 10,
          caseContext: initialCaseContext
        })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
        setTotalFound(data.totalFound || 0);
        setSearchType(data.searchType || 'SEMANTIC_NLP');
        if (data.executiveSummary) {
          setExecutiveSummary(data.executiveSummary);
        }
        if (data.results && data.results.length > 0) {
          setExpandedArticleId(data.results[0].article.id);
        }
      }
    } catch (err) {
      console.error('Mevzuat search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const isArticlePinned = (articleId: string) => {
    return pinnedArticles.some((p) => p.article.id === articleId);
  };

  const getPinnedItem = (articleId: string) => {
    return pinnedArticles.find((p) => p.article.id === articleId);
  };

  const handleTogglePin = (article: LegalArticle) => {
    onTogglePinArticle(article, 'Genel', '');
  };

  const handleStartEditNote = (pinned: PinnedLegalArticle) => {
    setEditingNoteArticleId(pinned.article.id);
    setTempNoteText(pinned.lawyerNote || '');
    setTempTag(pinned.relevanceTag || 'Genel');
  };

  const handleSaveNote = (articleId: string) => {
    if (onUpdateArticleNote) {
      onUpdateArticleNote(articleId, tempNoteText, tempTag);
    }
    setEditingNoteArticleId(null);
  };

  const handleCopySingle = (article: LegalArticle) => {
    const citation = `[${article.lawName} m. ${article.article} - ${article.title}]\n"${article.fullText}"\n(Pratik Uygulama Notu: ${article.practicalTips})`;
    navigator.clipboard.writeText(citation);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllPinned = () => {
    if (pinnedArticles.length === 0) return;
    const allText = pinnedArticles
      .map((p, idx) => {
        const art = p.article;
        return `${idx + 1}. [${art.lawCode} m. ${art.article} - ${art.title}] (${p.relevanceTag || 'Genel'})\n"${art.fullText}"\n${
          p.lawyerNote ? `Avukat Dosya Notu: ${p.lawyerNote}\n` : ''
        }Pratik Usul Şerhi: ${art.practicalTips}`;
      })
      .join('\n\n----------------------------------------\n\n');

    navigator.clipboard.writeText(allText);
    setCopiedAllPinned(true);
    setTimeout(() => setCopiedAllPinned(false), 2200);
  };

  const handleApplySingleToPetition = (article: LegalArticle, customNote?: string) => {
    if (onApplyArticleToPetition) {
      const formatted = `${article.lawCode} m. ${article.article} (${article.title}) HÜKMÜ UYARINCA:\n"${article.fullText}"${
        customNote ? `\n\n[İddia / Savunma Gerekçemiz]: ${customNote}` : ''
      }`;
      onApplyArticleToPetition(formatted);
    }
  };

  const handleApplyAllPinnedToPetition = () => {
    if (!onApplyArticleToPetition || pinnedArticles.length === 0) return;
    const combined = pinnedArticles
      .map(
        (p) =>
          `${p.article.lawCode} m. ${p.article.article} (${p.article.title}) HÜKMÜ VE USUL ŞERHİ:\n"${p.article.fullText}"${
            p.lawyerNote ? `\n[Dosya Stratejisi]: ${p.lawyerNote}` : ''
          }`
      )
      .join('\n\n');
    onApplyArticleToPetition(combined);
  };

  const handleApplyToAnalysisLaboratory = (article: LegalArticle) => {
    if (onApplyArticleToAnalysis) {
      const summary = `${article.lawCode} m. ${article.article} (${article.title}): ${article.summary}`;
      onApplyArticleToAnalysis(summary);
    }
  };

  const getLawBadgeColor = (lawCode: string) => {
    switch (lawCode) {
      case 'TMK':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'TBK':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'HMK':
        return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getTagBadgeColor = (tag?: string) => {
    switch (tag) {
      case 'Esas Savunma':
        return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Görev / Yetki':
        return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'Zamanaşımı':
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'İspat / Delil':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Tazminat / Alacak':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    }
  };

  // Filter search results by chapter if selected
  const displayedResults = searchResults.filter((item) => {
    if (selectedChapter === 'ALL') return true;
    return item.article.chapter === selectedChapter;
  });

  // Unique chapters in current search results
  const availableChapters = Array.from(new Set(searchResults.map((r) => r.article.chapter)));

  const handleSelectRecentTerm = (term: string, preferredAction: 'glossary' | 'mevzuat') => {
    if (preferredAction === 'glossary') {
      setActiveGlossaryLookupTerm(term);
      setActiveSubView('glossary');
    } else {
      setActiveSubView('search');
      setQuery(term);
      handleSearch(term);
    }
    setShowRecentSearches(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs: Mevzuat Dizin vs Hukuk Terimleri Sözlüğü vs İğnelenen Maddeler */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveSubView('search')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeSubView === 'search'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Pozitif Mevzuat Dizin & Arama (TMK, TBK, HMK)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('glossary')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeSubView === 'glossary'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm'
              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Hukuk Terimleri Sözlüğü</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/30">
            AI Destekli
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubView('pinned');
            setShowPinnedTray(true);
          }}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeSubView === 'pinned'
              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <Pin className={`w-4 h-4 ${pinnedArticles.length > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
          <span>İğnelenen Maddeler</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold font-mono">
            {pinnedArticles.length}
          </span>
        </button>

        {/* Recent Searches Sidebar Action Button */}
        <div className="ml-auto flex items-center gap-2 pl-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRecentSearches(!showRecentSearches)}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition text-xs cursor-pointer border ${
              showRecentSearches
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Son 5 Hukuki Kavram Arama Geçmişi Kenar Çubuğu"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Son Aramalar</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold">
              {recentSearches.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: HUKUK TERİMLERİ SÖZLÜĞÜ (AI DESTEKLİ) */}
      {activeSubView === 'glossary' && (
        <HukukTerimleriSozlugu
          onSearchMevzuat={(statuteQuery) => {
            setActiveSubView('search');
            handleSearch(statuteQuery);
          }}
          onApplyToPetition={onApplyArticleToPetition}
          onNavigateBackToMevzuat={() => setActiveSubView('search')}
          initialTermToLookup={activeGlossaryLookupTerm}
          onOpenRecentSearches={() => setShowRecentSearches(true)}
        />
      )}

      {/* VIEW 2 & 3: MEVZUAT SORGULAMA VE İĞNELENENLER */}
      {activeSubView !== 'glossary' && (
        <>
          {/* Top Banner / Header */}
          <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Mevzuat Sorgulama & Dava Dosyasına Madde İğneleme
              </h2>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                · TMK, TBK, HMK Çekirdek Dizin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pozitif hukuk normlarını semantik aramayla keşfedin; davanızla doğrudan ilgili kanun maddelerini dosyaya
              iğneleyerek dilekçe ve analiz laboratuvarına aktarın.
            </p>
          </div>

          {/* Quick Toggle for Pinned Tray */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowPinnedTray(!showPinnedTray)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                pinnedArticles.length > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${pinnedArticles.length > 0 ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span>Dosyaya İğnelenen Maddeler</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[10px] font-bold ml-1 font-mono tabular-nums">
                {pinnedArticles.length}
              </span>
            </button>
          </div>
        </div>

        {/* Database Index Stats Mini Bar */}
        {dbStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-1">
            <div className="bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Toplam Taranan Madde
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  {dbStats.totalIndexedArticles} Madde
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Tam Metin
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider block">
                TMK (4721 Sayılı)
              </span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 tabular-nums">
                {dbStats.coverage?.TMK?.count || 13} Madde
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1.5">Boşanma, Nafaka, Mal Rejimi</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
                TBK (6098 Sayılı)
              </span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 tabular-nums">
                {dbStats.coverage?.TBK?.count || 13} Madde
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1.5">Temerrüt, Kira, Ayıp, Faiz</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider block">
                HMK (6100 Sayılı)
              </span>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 tabular-nums">
                {dbStats.coverage?.HMK?.count || 16} Madde
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1.5">Dava Şartı, İspat, Senet, Bilirkişi</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CASE PINNED ARTICLES TRAY (DOSYAYA İĞNELENEN MADDELER)    */}
      {/* ========================================================= */}
      {showPinnedTray && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 dark:via-slate-900 dark:to-[#0e1626] border-2 border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Aktif Dava Dosyasına İğnelenen Kanun Maddeleri ({pinnedArticles.length})
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {pinnedArticles.length > 0 && (
                <>
                  <button
                    onClick={handleCopyAllPinned}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition font-semibold border border-slate-200 dark:border-slate-700"
                    title="Tüm İğnelenen Maddeleri ve Notları Kopyala"
                  >
                    {copiedAllPinned ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 font-bold">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tümünü Kopyala</span>
                      </>
                    )}
                  </button>

                  {onApplyArticleToPetition && (
                    <button
                      onClick={handleApplyAllPinnedToPetition}
                      className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition font-bold shadow-sm"
                      title="Tüm İğnelenen Maddeleri UYAP Dilekçesine Hukuki Dayanak Olarak Ekle"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tümünü Dilekçeye Aktar</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {pinnedArticles.length === 0 ? (
            <div className="text-center py-6 px-4 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-amber-500/30 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <BookmarkCheck className="w-8 h-8 text-amber-500/40 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Henüz bu dava dosyasına iğnelenmiş bir kanun maddesi yok.
              </p>
              <p>
                Aşağıdaki arama sonuçlarında beğendiğiniz maddelerin üzerindeki{' '}
                <strong className="text-amber-600 dark:text-amber-400">"Dosyaya İğnele"</strong> butonuna basarak
                maddeleri ve strateji notlarınızı bu panoda toplayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pinnedArticles.map((p) => {
                const isEditing = editingNoteArticleId === p.article.id;
                return (
                  <div
                    key={p.article.id}
                    className="bg-white dark:bg-[#131d31] border border-amber-500/30 rounded-xl p-4 shadow-xs space-y-2.5 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Pinned Card Top */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getLawBadgeColor(
                              p.article.lawCode
                            )}`}
                          >
                            {p.article.lawCode} m. {p.article.article}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getTagBadgeColor(
                              p.relevanceTag
                            )}`}
                          >
                            {p.relevanceTag || 'Genel'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTogglePin(p.article)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition"
                            title="Dosyadan İğneyi Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {p.article.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-serif line-clamp-2 mt-1">
                        "{p.article.fullText}"
                      </p>

                      {/* Lawyer Note Area */}
                      {isEditing ? (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">Kategori:</span>
                            <select
                              value={tempTag}
                              onChange={(e) => setTempTag(e.target.value as any)}
                              className="text-[11px] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100"
                            >
                              <option value="Genel">Genel</option>
                              <option value="Esas Savunma">Esas Savunma</option>
                              <option value="Görev / Yetki">Görev / Yetki</option>
                              <option value="Zamanaşımı">Zamanaşımı</option>
                              <option value="İspat / Delil">İspat / Delil</option>
                              <option value="Tazminat / Alacak">Tazminat / Alacak</option>
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            placeholder="Bu maddenin dava dosyasındaki kullanım gerekçesi (örn: Davalının zamanaşımı def'ine karşı ileri sürülecek)..."
                            className="w-full p-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none text-slate-800 dark:text-slate-100"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingNoteArticleId(null)}
                              className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-700"
                            >
                              İptal
                            </button>
                            <button
                              onClick={() => handleSaveNote(p.article.id)}
                              className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-600 text-white rounded hover:bg-amber-700"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between bg-amber-50/60 dark:bg-slate-800/60 p-2 rounded-lg border border-amber-200/50 dark:border-slate-700/60 text-[11px]">
                          <div className="flex-1 mr-2">
                            {p.lawyerNote ? (
                              <span className="text-amber-900 dark:text-amber-200 font-medium">
                                📌 <strong>Strateji Notu:</strong> {p.lawyerNote}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Dosya strateji notu eklenmedi...</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleStartEditNote(p)}
                            className="p-1 text-slate-400 hover:text-amber-600 transition"
                            title="Notu / Etiketi Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => handleCopySingle(p.article)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition"
                        title="Metni Kopyala"
                      >
                        Kopyala
                      </button>

                      {onApplyArticleToPetition && (
                        <button
                          onClick={() => handleApplySingleToPetition(p.article, p.lawyerNote)}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-[11px] font-bold border border-amber-200 dark:border-amber-800 transition"
                        >
                          Dilekçeye Ekle
                        </button>
                      )}

                      {onApplyArticleToAnalysis && (
                        <button
                          onClick={() => handleApplyToAnalysisLaboratory(p.article)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition ml-auto"
                          title="Dava Analiz Laboratuvarına Kanıt Olarak Ekle"
                        >
                          Analize Aktar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SEARCH BAR & FILTERS                                      */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Doğal dille arayın: örn. 'boşanmada şiddetli geçimsizlik ve kusur', 'yüklenicinin ayıba karşı tekeffülü', 'HMK 200 senetle ispat'..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Law Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141d30] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            {(['ALL', 'TMK', 'TBK', 'HMK'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setLawFilter(filter);
                  handleSearch(query, filter);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  lawFilter === filter
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'Tümü' : filter}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50 shrink-0"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Taranıyor...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Mevzuatta Ara</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Access to Last 5 Searched Legal Terms */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto text-xs pb-0.5">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Son Aramalar:
            </span>
            {recentSearches.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setQuery(item.term);
                  handleSearch(item.term);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 shrink-0 border cursor-pointer font-medium ${
                  query.toLowerCase().trim() === item.term.toLowerCase().trim()
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title={`Mevzuatta ara: ${item.term}`}
              >
                <span>{item.term}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowRecentSearches(true)}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline shrink-0 font-semibold flex items-center gap-0.5 ml-1 cursor-pointer"
            >
              <span>Kenar Çubuğu (5)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Chapter / Topic Filter if multiple available in search */}
        {availableChapters.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 shrink-0 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Konu Filtresi:
            </span>
            <button
              onClick={() => setSelectedChapter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                selectedChapter === 'ALL'
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Tüm Konular ({searchResults.length})
            </button>
            {availableChapters.map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChapter(ch)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                  selectedChapter === ch
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        {/* Suggested Queries Fast Pills */}
        {suggestedCategories.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-semibold text-slate-400">
                Örnek Uygulama Sorguları (Hızlı Tıklama):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedCategories.flatMap((cat) =>
                cat.queries.slice(0, 2).map((qStr: string, idx: number) => (
                  <button
                    key={`${cat.category}-${idx}`}
                    onClick={() => handleSearch(qStr)}
                    className="text-[11px] px-2.5 py-1 bg-slate-50 dark:bg-[#0e1626] hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-800 rounded-lg transition text-left"
                  >
                    {qStr}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Executive Strategy Synthesis */}
      {executiveSummary && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Normatif Strateji & Dava Dosyası Özeti</span>
          </div>
          <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed whitespace-pre-line">
            {executiveSummary}
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* SEARCH RESULTS LIST                                       */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Bulunan Eşleşme:{' '}
            <strong className="text-slate-800 dark:text-slate-200">{displayedResults.length}</strong> kanun maddesi
          </span>
          {searchType === 'EXACT_CITATION' && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Birebir Madde Numarası Eşleşmesi
            </span>
          )}
        </div>

        {displayedResults.length === 0 && !isSearching && (
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Aradığınız kritere uygun kanun maddesi bulunamadı
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Arama ifadenizi değiştirebilir veya doğrudan kanun adı ve maddesi belirtebilirsiniz (örn: "TBK 117", "HMK
              200", "TMK 166").
            </p>
          </div>
        )}

        {displayedResults.map((item) => {
          const { article, score } = item;
          const isExpanded = expandedArticleId === article.id;
          const isCopied = copiedId === article.id;
          const pinned = isArticlePinned(article.id);
          const pinnedItem = getPinnedItem(article.id);

          return (
            <div
              key={article.id}
              className={`bg-white dark:bg-[#131d31] border rounded-2xl p-5 shadow-sm transition ${
                pinned
                  ? 'border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getLawBadgeColor(
                      article.lawCode
                    )}`}
                  >
                    {article.lawCode} m. {article.article}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {article.title}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {article.chapter}
                  </span>

                  {pinned && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                      <Pin className="w-3 h-3 fill-amber-500" />
                      Dosyaya İğnelendi
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    %{score} Uyum
                  </span>

                  {/* Pin / Unpin Button */}
                  <button
                    onClick={() => handleTogglePin(article)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-bold transition border ${
                      pinned
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border-slate-200 dark:border-slate-700'
                    }`}
                    title={pinned ? 'İğneyi Kaldır' : 'Bu Kanun Maddesini Dava Dosyasına İğnele'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${pinned ? 'fill-white' : ''}`} />
                    <span>{pinned ? 'İğnelendi' : 'Dosyaya İğnele'}</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopySingle(article)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition font-medium border border-slate-200 dark:border-slate-700"
                    title="Resmi Madde Metnini Kopyala"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>

                  {/* Apply to Petition Button */}
                  {onApplyArticleToPetition && (
                    <button
                      onClick={() => handleApplySingleToPetition(article, pinnedItem?.lawyerNote)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg transition font-semibold border border-amber-200 dark:border-amber-800"
                      title="Bu maddeyi doğrudan dilekçe taslağına aktar"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Dilekçeye Aktar</span>
                    </button>
                  )}

                  {/* Expand / Collapse Button */}
                  <button
                    onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Summary Snippet */}
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif bg-slate-50 dark:bg-[#0b101d] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-slate-100 block font-sans text-[11px] uppercase tracking-wider mb-1 text-amber-600 dark:text-amber-400">
                    Kanun Hükmü Özeti:
                  </strong>
                  {article.summary}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Anahtar Kavramlar:</span>
                  {article.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Expanded Verbatim Official Text & Litigation Notes */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                  {/* Exact Statutory Full Text */}
                  <div className="bg-amber-50/40 dark:bg-[#0e1626] border border-amber-200/60 dark:border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-500" />
                        Birebir Resmi Kanun Metni (Yürürlükteki Pozitif Hukuk Normu):
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {article.lawName} - Sayı: {article.lawNumber}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif whitespace-pre-line text-xs pl-2 border-l-2 border-amber-500">
                      {article.fullText}
                    </p>
                  </div>

                  {/* Practical Litigator Tips */}
                  <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 rounded-xl p-3.5 space-y-1">
                    <span className="font-bold text-sky-900 dark:text-sky-300 block">
                      ⚖️ Avukat İçin Usul Tuzağı & Pratik Uygulama Şerhi:
                    </span>
                    <p className="text-sky-800 dark:text-sky-200 leading-relaxed">
                      {article.practicalTips}
                    </p>
                  </div>

                  {/* Court Precedents */}
                  {article.precedents && article.precedents.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                        🏛️ İlgili Yargıtay Emsal Kararları:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {article.precedents.map((prec, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-slate-50 dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                              <span>{prec.court}</span>
                              <span className="font-mono text-slate-500">
                                E. {prec.esasNo} / K. {prec.kararNo} ({prec.tarih})
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                              "{prec.principle}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* RECENT SEARCHES SIDEBAR (SON 5 HUKUKİ ARAMA KENAR ÇUBUĞU) */}
      <RecentSearchesSidebar
        isOpen={showRecentSearches}
        onClose={() => setShowRecentSearches(false)}
        onSelectTerm={handleSelectRecentTerm}
        currentActiveTerm={activeSubView === 'glossary' ? activeGlossaryLookupTerm : query}
      />
    </div>
  );
}
