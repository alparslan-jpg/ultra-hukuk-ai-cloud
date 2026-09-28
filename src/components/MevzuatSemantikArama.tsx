import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { LegalArticle, SemanticSearchResult, CrossReferenceAuditReport } from '../services/legalDatabaseService';

interface Props {
  initialCaseContext?: string;
  initialAiText?: string;
  onApplyArticleToPetition?: (citationText: string) => void;
}

export function MevzuatSemantikArama({ initialCaseContext, initialAiText, onApplyArticleToPetition }: Props) {
  // Search State
  const [query, setQuery] = useState<string>('');
  const [lawFilter, setLawFilter] = useState<'ALL' | 'TMK' | 'TBK' | 'HMK'>('ALL');
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [searchType, setSearchType] = useState<string>('');
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Suggested Queries State
  const [suggestedCategories, setSuggestedCategories] = useState<any[]>([]);

  // Database Stats State
  const [dbStats, setDbStats] = useState<any>(null);

  // Cross-Reference State
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'crossref'>('search');
  const [crossRefInputText, setCrossRefInputText] = useState<string>(initialAiText || '');
  const [crossRefReport, setCrossRefReport] = useState<CrossReferenceAuditReport | null>(null);
  const [isCrossRefLoading, setIsCrossRefLoading] = useState<boolean>(false);
  const [crossRefCopied, setCrossRefCopied] = useState<boolean>(false);

  // Fetch initial stats and suggestions
  useEffect(() => {
    fetch('/api/legal-database/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDbStats(data);
        }
      })
      .catch((err) => console.warn('Could not fetch legal database stats:', err));

    fetch('/api/legal-database/suggested-queries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.suggestions) {
          setSuggestedCategories(data.suggestions);
        }
      })
      .catch((err) => console.warn('Could not fetch suggested queries:', err));

    // Default initial search
    handleSearch('evlilik birliği şiddetli geçimsizlik nafaka ve süreler');
  }, []);

  // Update cross-reference text if prop changes
  useEffect(() => {
    if (initialAiText && !crossRefInputText) {
      setCrossRefInputText(initialAiText);
    }
  }, [initialAiText]);

  const handleSearch = async (searchKeyword?: string) => {
    const q = (searchKeyword !== undefined ? searchKeyword : query).trim();
    if (!q) return;

    if (searchKeyword !== undefined) {
      setQuery(searchKeyword);
    }

    setIsSearching(true);
    setExecutiveSummary('');

    try {
      const res = await fetch('/api/legal-database/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          lawFilter,
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
      console.error('Legal database search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRunCrossReference = async () => {
    if (!crossRefInputText.trim()) return;

    setIsCrossRefLoading(true);
    try {
      const res = await fetch('/api/legal-database/cross-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: crossRefInputText,
          caseContext: initialCaseContext
        })
      });
      const data = await res.json();
      if (data.success) {
        setCrossRefReport(data);
      }
    } catch (err) {
      console.error('Cross-reference error:', err);
    } finally {
      setIsCrossRefLoading(false);
    }
  };

  const handleCopyArticle = (article: LegalArticle) => {
    const textToCopy = `[${article.lawName} m. ${article.article} - ${article.title}]\n"${article.fullText}"\n\n(Pratik Hukuki Çerçeve: ${article.summary})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyToPetition = (article: LegalArticle) => {
    if (onApplyArticleToPetition) {
      const formatted = `${article.lawCode} m. ${article.article} (${article.title}) uyarınca: "${article.fullText}"`;
      onApplyArticleToPetition(formatted);
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

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation */}
      <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Mevzuat Semantik Arama & Madde Doğrulama Servisi
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                TMK • TBK • HMK Çekirdek Dizin
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Yapay zeka yanıtlarını doğrudan yürürlükteki pozitif Türk kanun metinleriyle çapraz denetleyin;
              doğal dille mevzuat taraması yapın.
            </p>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0b101d] p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('search')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'search'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Semantik Mevzuat Arama</span>
            </button>
            <button
              onClick={() => setActiveSubTab('crossref')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'crossref'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AI Yanıtı Çapraz Denetimi</span>
              {crossRefReport && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    crossRefReport.groundingScore >= 80
                      ? 'bg-emerald-500/20 text-emerald-600'
                      : 'bg-rose-500/20 text-rose-600'
                  }`}
                >
                  %{crossRefReport.groundingScore}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Database Index Metrics Bar */}
        {dbStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-1">
            <div className="bg-slate-50 dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Toplam Taranan Madde
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {dbStats.totalIndexedArticles} Madde
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Tam Metin
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-purple-500 tracking-wider block">
                TMK (4721 S.) Medeni Kanun
              </span>
              <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {dbStats.coverage?.TMK?.count || 12} Madde
                <span className="text-[10px] font-normal text-slate-400 ml-1.5">Aile & Eşya & Başlangıç</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">
                TBK (6098 S.) Borçlar Kanunu
              </span>
              <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {dbStats.coverage?.TBK?.count || 14} Madde
                <span className="text-[10px] font-normal text-slate-400 ml-1.5">Temerrüt & Kira & Eser</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-sky-500 tracking-wider block">
                HMK (6100 S.) Usul Muhakemeleri
              </span>
              <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {dbStats.coverage?.HMK?.count || 16} Madde
                <span className="text-[10px] font-normal text-slate-400 ml-1.5">Dava Şartı & İspat & Senet</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SUB TAB 1: SEMANTİK MEVZUAT ARAMA                         */}
      {/* ========================================================= */}
      {activeSubTab === 'search' && (
        <div className="space-y-6">
          {/* Search Input Box */}
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Doğal dille arayın: örn. 'boşanmada şiddetli geçimsizlik ve kusur', 'yüklenicinin ayıba karşı tekeffülü', 'HMK 200 senetle ispat'..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0b101d] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Law Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0b101d] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                {(['ALL', 'TMK', 'TBK', 'HMK'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLawFilter(filter)}
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

            {/* Suggested Fast Queries */}
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

          {/* AI Executive Synthesis if Available */}
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

          {/* Search Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>
                Bulunan Eşleşme: <strong className="text-slate-800 dark:text-slate-200">{totalFound}</strong> kanun maddesi
              </span>
              {searchType === 'EXACT_CITATION' && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Birebir Madde Numarası Eşleşmesi
                </span>
              )}
            </div>

            {searchResults.length === 0 && !isSearching && (
              <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Aradığınız kritere uygun kanun maddesi bulunamadı
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Arama ifadenizi değiştirebilir veya doğrudan kanun adı ve maddesi belirtebilirsiniz (örn: "TBK 117", "HMK 200", "TMK 166").
                </p>
              </div>
            )}

            {searchResults.map((item) => {
              const { article, score, matchedKeywords, highlightSnippet, relevanceReason } = item;
              const isExpanded = expandedArticleId === article.id;
              const isCopied = copiedId === article.id;

              return (
                <div
                  key={article.id}
                  className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Article Card Header */}
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
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        %{score} Eşleşme
                      </span>
                      <button
                        onClick={() => handleCopyArticle(article)}
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

                      {onApplyArticleToPetition && (
                        <button
                          onClick={() => handleApplyToPetition(article)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg transition font-semibold border border-amber-200 dark:border-amber-800"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Dilekçeye Aktar</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Snippet / Relevance Reason */}
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

                  {/* Expanded Full Verbatim Text & Practical Litigator Tips */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                      {/* Exact Statutory Full Text */}
                      <div className="bg-amber-50/40 dark:bg-[#0e1626] border border-amber-200/60 dark:border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-amber-500" />
                            Birebir Resmi Kanun Metni (Yürürlükteki Pozitif Hukuk Metni):
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
                          ⚖️ Avukat İçin Usul Tuzağı & Pratik Uygulama Notu:
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
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB TAB 2: AI YANITI ÇAPRAZ DENETİMİ                      */}
      {/* ========================================================= */}
      {activeSubTab === 'crossref' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                Yapay Zeka Hukuk Ajanı Yanıtını Çapraz Denetle
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Dava analizi veya dilekçe taslağı metnini buraya yapıştırın. Sistem, metindeki tüm kanun maddesi
                atıflarını (TMK, TBK, HMK vb.) çekirdek veri tabanımızdaki gerçek madde metinleriyle karşılaştırıp
                uyum ve halüsinasyon denetim raporu üretir.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={6}
                value={crossRefInputText}
                onChange={(e) => setCrossRefInputText(e.target.value)}
                placeholder="Denetlenecek yapay zeka çıktısını veya dilekçe metnini buraya yapıştırınız (Örn: 'Davalı TBK m. 117 gereğince temerrüde düşmüş olup HMK m. 200 senetle ispat kuralı gereğince tanık dinletilemez...')"
                className="w-full p-3.5 bg-slate-50 dark:bg-[#0b101d] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-sky-500 transition"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {initialAiText && (
                    <button
                      onClick={() => setCrossRefInputText(initialAiText)}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline decoration-dotted"
                    >
                      Dava Analiz Metnini Tekrar Yükle
                    </button>
                  )}
                </div>

                <button
                  onClick={handleRunCrossReference}
                  disabled={isCrossRefLoading || !crossRefInputText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50"
                >
                  {isCrossRefLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mevzuatla Karşılaştırılıyor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Gerçek Kanun Metni ile Çapraz Doğrula</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Cross Reference Report Output */}
          {crossRefReport && (
            <div className="space-y-4">
              {/* Score & Verdict Card */}
              <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Genel Hukuki Güvenilirlik Değerlendirmesi
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`text-2xl font-extrabold ${
                          crossRefReport.groundingScore >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : crossRefReport.groundingScore >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        %{crossRefReport.groundingScore}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          crossRefReport.overallVerdict.includes('GÜVENLİ')
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : crossRefReport.overallVerdict.includes('KISMEN')
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {crossRefReport.overallVerdict}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="text-center">
                      <span className="text-slate-400 block text-[10px]">Taranan Atıf</span>
                      <span className="text-slate-800 dark:text-slate-200 text-sm font-bold">
                        {crossRefReport.totalClaimsChecked}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-emerald-500 block text-[10px]">Doğrulandı</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        {crossRefReport.verifiedCount}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-amber-500 block text-[10px]">Kısmen Uyumlu</span>
                      <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">
                        {crossRefReport.partialCount}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-rose-500 block text-[10px]">Riskli / Hatalı</span>
                      <span className="text-rose-600 dark:text-rose-400 text-sm font-bold">
                        {crossRefReport.flaggedCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Judicial Note */}
                {crossRefReport.judicialNote && (
                  <div className="mt-4 p-3.5 bg-slate-50 dark:bg-[#0b101d] rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    <strong className="text-slate-900 dark:text-slate-100 block mb-1 font-semibold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-sky-500" />
                      Yargıtay Standartlarında Denetim Şerhi:
                    </strong>
                    {crossRefReport.judicialNote}
                  </div>
                )}
              </div>

              {/* Side-by-Side Discrepancies */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Madde Madde Karşılaştırma & Gerçek Kanun Metni:
                </h4>

                {crossRefReport.discrepancies.map((disc, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {disc.citation}
                        </span>
                        {disc.articleTitle && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({disc.articleTitle})
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          disc.status === 'VERIFIED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : disc.status === 'PARTIAL'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {disc.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Left: AI Statement */}
                      <div className="bg-slate-50 dark:bg-[#0b101d] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
                          Metindeki İddia / Sav:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed">
                          "{disc.aiStatement}"
                        </p>
                      </div>

                      {/* Right: Real Statute Text */}
                      <div className="bg-amber-50/30 dark:bg-[#0e1626] p-3.5 rounded-xl border border-amber-200/50 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider block">
                          Veri Tabanındaki Birebir Kanun Metni:
                        </span>
                        <p className="text-slate-900 dark:text-slate-100 font-serif leading-relaxed">
                          {disc.actualArticleText || disc.actualQuotation || 'Kanun metni bulunamadı.'}
                        </p>
                      </div>
                    </div>

                    {/* Verdict & Correction Notice */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        <strong>Denetim Kararı:</strong> {disc.verdict}
                      </p>
                      {disc.correctionNotice && (
                        <p className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                          ⚠️ Düzeltme Notu: {disc.correctionNotice}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
