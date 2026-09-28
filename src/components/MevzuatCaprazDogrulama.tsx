import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  RefreshCw,
  Scale,
  FileText,
  BadgeAlert,
  ExternalLink,
  Wand2,
  Copy,
  Check,
  Search,
  Gavel
} from 'lucide-react';
import {
  verifyLegalCitations,
  CrossReferenceReport,
  CitationVerificationResult,
  TURKISH_PRECEDENTS_DB
} from '../services/turkishLegalCorpusService';
import { AiAssistedBadge } from './DenetlemePaneli';

interface MevzuatCaprazDogrulamaProps {
  lawyerSicilNo: string;
  initialText?: string;
  onTextUpdate?: (updatedText: string) => void;
}

export const MevzuatCaprazDogrulama: React.FC<MevzuatCaprazDogrulamaProps> = ({
  lawyerSicilNo,
  initialText = '',
  onTextUpdate,
}) => {
  const [inputText, setInputText] = useState<string>(
    initialText || ''
  );
  const [report, setReport] = useState<CrossReferenceReport>(() =>
    verifyLegalCitations(initialText || '')
  );
  const [selectedCitation, setSelectedCitation] = useState<CitationVerificationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'flagged'>('all');

  // Re-run verification whenever inputText changes
  useEffect(() => {
    const rep = verifyLegalCitations(inputText);
    setReport(rep);
    if (rep.results.length > 0 && !selectedCitation) {
      setSelectedCitation(rep.results[0]);
    }
  }, [inputText]);

  // Handle single-click auto-correction of flagged or hallucinated statutes
  const handleAutoFixCitation = (flaggedResult: CitationVerificationResult) => {
    if (!flaggedResult.correctionSuggestion) return;

    let newText = inputText;
    // If it's an obsolete law, replace with suggested statute
    if (flaggedResult.rawCitation.includes('BK') && flaggedResult.correctionSuggestion.includes('TBK')) {
      newText = newText.replace(new RegExp(flaggedResult.rawCitation, 'g'), '6098 S. TBK m. 125');
    } else if (flaggedResult.rawCitation.includes('999')) {
      newText = newText.replace(new RegExp(flaggedResult.rawCitation, 'g'), 'TBK m. 120 (Yasal Temerrüt Faizi)');
    } else if (flaggedResult.rawCitation.includes('750')) {
      newText = newText.replace(new RegExp(flaggedResult.rawCitation, 'g'), 'HMK m. 200 (Senetle İspat Kuralı)');
    } else {
      newText = newText.replace(new RegExp(flaggedResult.rawCitation, 'g'), flaggedResult.correctionSuggestion);
    }

    setInputText(newText);
    if (onTextUpdate) onTextUpdate(newText);
  };

  const filteredResults = report.results.filter((res) => {
    if (activeFilter === 'verified') return res.status === 'Verified';
    if (activeFilter === 'flagged') return res.status === 'Flagged';
    return true;
  });

  const handleCopyReport = () => {
    const lines = report.results.map((r, i) => {
      const statusBadge = r.status === 'Verified' ? '[VERIFIED]' : '[FLAGGED]';
      const reason = r.flagReason ? ` - UYARI: ${r.flagReason}` : '';
      return `${i + 1}. ${statusBadge} ${r.rawCitation}: ${r.articleTitle || ''}${reason}`;
    });

    const output = `[TÜRK HUKUK MEVZUATI VE İÇTİHAT ÇAPRAZ DOĞRULAMA RAPORU]\nAVUKAT SİCİL NO: ${lawyerSicilNo}\nGENEL DURUM: ${report.overallStatus}\nDOĞRULUK SKORU: %${report.accuracyScore}\nTOPLAM ATIF: ${report.totalCitations} (Onaylı: ${report.verifiedCount}, Bayraklı: ${report.flaggedCount})\n\n${lines.join('\n')}`;

    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Overview Banner */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-[#0d162b] dark:via-[#121f3d] dark:to-[#0f1933] border border-slate-200 dark:border-sky-500/30 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200 dark:border-sky-500/30">
                <Gavel className="w-5 h-5 text-sky-600 dark:text-sky-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                  Mevzuat & Emsal İçtihat Çapraz Doğrulama Servisi
                </h2>
                <span className="text-[11px] font-mono text-sky-600 dark:text-sky-300">
                  Turkish Law & Precedent Cross-Reference Engine (Corpus Integrity)
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Dilekçe ve savunma metinlerinizdeki her bir kanun maddesini (TBK, HMK, TTK, İİK, İş K. vb.) ve içtihadı yürürlükteki pozitif Türk hukuku veri tabanı ile karşılaştırır; <strong>uydurma (halüsinasyon)</strong> veya <strong>mülga (yürürlükten kalkan)</strong> maddeleri anında tespit ederek <strong>'Verified'</strong> veya <strong>'Flagged'</strong> olarak damgalar.
            </p>
          </div>

          <AiAssistedBadge lawyerSicilNo={lawyerSicilNo} />
        </div>

        {/* 2. Real-Time Corpus Score & Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 dark:bg-[#091122] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Çapraz Denetim Durumu</div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded border ${
                  report.overallStatus === 'Verified'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-500/30 animate-pulse'
                }`}
              >
                {report.overallStatus === 'Verified' ? 'VERIFIED (ONAYLI)' : 'FLAGGED (BAYRAKLI)'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#091122] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Mevzuat Doğruluk Oranı</div>
            <div className="text-lg font-black font-mono mt-0.5 text-sky-600 dark:text-sky-400">
              %{report.accuracyScore}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#091122] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Doğrulanan Maddeler</div>
            <div className="text-lg font-black font-mono mt-0.5 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{report.verifiedCount} / {report.totalCitations}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#091122] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Bayraklanan (Hatalı/Uydurma)</div>
            <div className="text-lg font-black font-mono mt-0.5 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <BadgeAlert className="w-4 h-4" />
              <span>{report.flaggedCount} Madde</span>
            </div>
          </div>
        </div>

        {/* 3. Hallucination Warning Banner (If Any Flagged Item Exists) */}
        {report.hasHallucinations && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-900 dark:text-rose-100 font-bold block">
                  🚨 HALÜSİNASYON / MÜLGA MEVZUAT UYARISI:
                </strong>
                Metinde Türk kanunlarında bulunmayan sınır dışı maddeler veya yürürlükten kalkan mülga kanun hükümleri tespit edildi. Dilekçenizde bu maddelerin kullanılması mahkemede itibar kaybına ve usulden redde yol açabilir!
              </div>
            </div>

            <button
              onClick={() => {
                const flagged = report.results.filter((r) => r.status === 'Flagged');
                flagged.forEach(handleAutoFixCitation);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition flex-shrink-0 text-xs shadow-md shadow-rose-600/30"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Hatalı Maddeleri Otomatik Düzelt</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Interactive Input & Verification Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Text */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-[#131e36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Çapraz Denetlenecek Hukuki Metin (Dilekçe / Savunma / Brifing)
              </label>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                Canlı Tarama Aktif
              </span>
            </div>

            <textarea
              rows={11}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (onTextUpdate) onTextUpdate(e.target.value);
              }}
              placeholder="Dava iddialarınızı veya dilekçe metninizi buraya yazınız..."
              className="w-full bg-slate-50 dark:bg-[#0a0f1d] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
            />

            <div className="p-3 bg-slate-50 dark:bg-[#0a1224] rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <span>Metninizdeki tüm kanun maddesi atıfları (ör: TBK m. 117, HMK m. 200, İİK m. 67) anlık taranır ve yürürlük kontrolü yapılır.</span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı' : 'Denetim Raporunu Kopyala'}</span>
              </button>

              <button
                type="button"
                onClick={() => setReport(verifyLegalCitations(inputText))}
                className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition font-bold shadow-lg shadow-sky-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yeniden Tara</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Cross-Referenced Articles List & Details */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-[#131e36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Tespit Edilen Kanun Maddeleri ({report.totalCitations})
              </h3>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#091122] p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-0.5 rounded transition ${
                    activeFilter === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Tümü ({report.totalCitations})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('verified')}
                  className={`px-2 py-0.5 rounded transition ${
                    activeFilter === 'verified'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Verified ({report.verifiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('flagged')}
                  className={`px-2 py-0.5 rounded transition ${
                    activeFilter === 'flagged' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Flagged ({report.flaggedCount})
                </button>
              </div>
            </div>

            {/* Articles List */}
            {filteredResults.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredResults.map((item) => {
                  const isVerified = item.status === 'Verified';
                  const isSelected = selectedCitation?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCitation(item)}
                      className={`p-4 rounded-xl border transition cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'ring-2 ring-sky-500'
                          : ''
                      } ${
                        isVerified
                          ? 'bg-slate-50 dark:bg-[#0a1224] border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-rose-50/50 dark:bg-[#1a0f18] border-rose-500/40 hover:border-rose-500/70'
                      }`}
                    >
                      {/* Atıf Başlığı ve Durum Rozeti */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              isVerified
                                ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {item.rawCitation}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {item.articleTitle || `${item.lawCode} Madde ${item.article}`}
                          </span>
                        </div>

                        {/* Status Badge: Verified or Flagged */}
                        <span
                          className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300 border border-rose-500/40 animate-pulse'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>VERIFIED</span>
                            </>
                          ) : (
                            <>
                              <BadgeAlert className="w-3.5 h-3.5 text-rose-500" />
                              <span>FLAGGED</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Summary or Flag Explanation */}
                      {isVerified ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#080d1a] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          {item.officialSummary}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-rose-800 dark:text-rose-200 bg-rose-100/60 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 space-y-1">
                            <strong className="block text-rose-900 dark:text-rose-100 font-bold">
                              ⚠️ Gerekçe:
                            </strong>
                            <p>{item.flagReason}</p>
                          </div>

                          {item.correctionSuggestion && (
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                💡 Öneri: {item.correctionSuggestion}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAutoFixCitation(item);
                                }}
                                className="text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1 rounded-md transition flex items-center gap-1 shadow-sm"
                              >
                                <Wand2 className="w-3 h-3" />
                                <span>Düzelt</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Emsal Karar Eşleşmesi Varsa */}
                      {item.matchingPrecedent && (
                        <div className="bg-slate-100/70 dark:bg-[#0b1326] border border-sky-300/40 dark:border-sky-500/30 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400 font-bold text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              Emsal: {item.matchingPrecedent.court} ({item.matchingPrecedent.esasNo} E.)
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              {item.matchingPrecedent.tarih}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                            "{item.matchingPrecedent.corePrinciple}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-[#0a0f1d] rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                <Search className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Bu filtreye uygun kanun maddesi atfı bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
