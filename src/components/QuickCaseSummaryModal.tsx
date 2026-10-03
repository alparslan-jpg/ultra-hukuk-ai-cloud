import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Gavel,
  Scale,
  ShieldCheck,
  Clock,
  ArrowRight,
  FileText,
  Brain,
  Layers,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ClientCase, ClientItem } from '../services/clientCaseStore';

export interface QuickCaseSummaryData {
  success: boolean;
  modelUsed?: string;
  caseNumber?: string;
  generatedAt?: string;
  executiveHeadline: string;
  currentLegalStatus: {
    statusLabel: string;
    currentStage: string;
    hearingCountdown: string;
    riskLevel: string;
    proceduralStanding: string;
  };
  caseHistoryBullets: string[];
  keyLegalTakeaways: string[];
  upcomingDeadlinesAndActions: string[];
}

interface QuickCaseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: ClientCase | null;
  client: ClientItem | null;
  lawyerSicilNo?: string;
  onNavigateToAnalyzer?: (caseNumber?: string) => void;
  onNavigateToPetition?: (caseNumber?: string, subject?: string) => void;
}

export function QuickCaseSummaryModal({
  isOpen,
  onClose,
  caseItem,
  client,
  lawyerSicilNo = '8109',
  onNavigateToAnalyzer,
  onNavigateToPetition
}: QuickCaseSummaryModalProps) {
  const [summaryData, setSummaryData] = useState<QuickCaseSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch LLM-generated summary when modal opens for a case
  useEffect(() => {
    if (!isOpen || !caseItem || !client) {
      setSummaryData(null);
      setErrorMessage(null);
      return;
    }

    fetchSummary();
  }, [isOpen, caseItem?.id]);

  const fetchSummary = async () => {
    if (!caseItem || !client) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/quick-case-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseNumber: caseItem.caseNumber,
          court: caseItem.court,
          subject: caseItem.subject,
          clientName: client.fullName,
          clientType: client.type,
          opponentName: caseItem.opponentName,
          status: caseItem.status,
          nextHearingDate: caseItem.nextHearingDate,
          stage: caseItem.stage,
          estimatedValue: caseItem.estimatedValue,
          files: caseItem.files || [],
          lawyerSicilNo
        })
      });

      const data = await res.json();
      if (data.success) {
        setSummaryData(data);
      } else {
        setErrorMessage(data.message || 'Dava özeti oluşturulamadı.');
      }
    } catch (err: any) {
      console.error('Quick case summary error:', err);
      setErrorMessage('Yapay zeka sunucusuna bağlanılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !caseItem || !client) return null;

  const handleCopySummary = () => {
    if (!summaryData) return;
    const text = `[HIZLI DAVA ÖZETİ VE AKTİF HUKUKİ DURUM]\n` +
      `DOSYA: ${caseItem.caseNumber} - ${caseItem.court}\n` +
      `MÜVEKKİL: ${client.fullName} (${client.type})\n` +
      `KARŞI TARAF: ${caseItem.opponentName || 'Belirtilmedi'}\n\n` +
      `GENEL DEĞERLENDİRME:\n${summaryData.executiveHeadline}\n\n` +
      `GÜNCEL HUKUKİ DURUM:\n` +
      `• Durum: ${summaryData.currentLegalStatus.statusLabel}\n` +
      `• Safahat: ${summaryData.currentLegalStatus.currentStage}\n` +
      `• Duruşma / Takvim: ${summaryData.currentLegalStatus.hearingCountdown}\n` +
      `• Risk Seviyesi: ${summaryData.currentLegalStatus.riskLevel}\n` +
      `• Usul Pozisyonu: ${summaryData.currentLegalStatus.proceduralStanding}\n\n` +
      `KRONOLOJİK DAVA TARİHÇESİ:\n` +
      summaryData.caseHistoryBullets.map((b, i) => `${i + 1}. ${b}`).join('\n') + `\n\n` +
      `KRİTİK HUKUKİ DAYANAKLAR & VAKIALAR:\n` +
      summaryData.keyLegalTakeaways.map((t, i) => `• ${t}`).join('\n') + `\n\n` +
      `YAKLAŞAN SÜRELER VE AVUKAT EYLEM PLANI:\n` +
      summaryData.upcomingDeadlinesAndActions.map((a, i) => `• ${a}`).join('\n') + `\n\n` +
      `(Üretici Model: ${summaryData.modelUsed || 'Derin Hukuki Muhakeme Motoru'} · Ultra Hukuk AI)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToPetition = () => {
    if (!onNavigateToPetition || !summaryData) return;
    onClose();
    onNavigateToPetition(caseItem.caseNumber, caseItem.subject);
  };

  const handleSendToAnalyzer = () => {
    if (!onNavigateToAnalyzer) return;
    onClose();
    onNavigateToAnalyzer(caseItem.caseNumber);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Hızlı Dava Özeti Modalı"
      >
        {/* 1. Modal Top Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-amber-500/10 via-slate-50 to-indigo-500/5 dark:from-amber-950/30 dark:via-[#0e1626] dark:to-[#0c121e] flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-tight bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/25">
                {caseItem.caseNumber}
              </span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                {caseItem.court}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Derin Hukuki Muhakeme Özeti</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {caseItem.subject}
            </h3>

            {/* Unboxed Metadata Line */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap font-mono">
              <span>Müvekkil: <strong className="text-slate-700 dark:text-slate-300 font-sans">{client.fullName}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Karşı Taraf: <strong className="text-slate-700 dark:text-slate-300 font-sans">{caseItem.opponentName || 'Belirtilmedi'}</strong></span>
              {caseItem.estimatedValue && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Değer: {caseItem.estimatedValue}</span>
                </>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-800 dark:text-slate-200">
          {isLoading ? (
            /* Loading Skeleton / AI Thinking State */
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Dava Dosyası ve Yargılama Geçmişi Çözümleniyor...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Derin Hukuki Muhakeme Motoru; mahkeme tensip zaptını, safahat aşamalarını ve yürürlükteki pozitif mevzuatı tarayarak yönetici özetini hazırlıyor.
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={fetchSummary}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tekrar Dene</span>
              </button>
            </div>
          ) : summaryData ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* SECTION A: EXECUTIVE HEADLINE */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1.5 shadow-xs">
                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Dava Özeti & Yönetici Teşhisi</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                  {summaryData.executiveHeadline}
                </p>
              </div>

              {/* SECTION B: CURRENT ACTIVE LEGAL STATUS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Dava Durumu & Aşaması
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {summaryData.currentLegalStatus.statusLabel}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {summaryData.currentLegalStatus.currentStage}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Duruşma / Takvim Günü
                  </span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span>{summaryData.currentLegalStatus.hearingCountdown}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {caseItem.nextHearingDate ? `Tarih: ${caseItem.nextHearingDate}` : 'Celse günü bekleniyor'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Risk & Usul Durumu
                  </span>
                  <div className="font-bold text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{summaryData.currentLegalStatus.riskLevel}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {summaryData.currentLegalStatus.proceduralStanding}
                  </div>
                </div>
              </div>

              {/* SECTION C: BULLETED ENTIRE CASE HISTORY */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-500" />
                    <span>Dava Geçmişi ve Safahat Aşamaları ({summaryData.caseHistoryBullets.length} Aşama)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Kronolojik Akış</span>
                </div>

                <ul className="space-y-2.5">
                  {summaryData.caseHistoryBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION D: KEY LEGAL TAKEAWAYS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-500" />
                    <span>Kritik Hukuki Dayanaklar & Delil Değerlendirmesi</span>
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">HMK / TBK / TTK</span>
                </div>

                <ul className="space-y-2">
                  {summaryData.keyLegalTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION E: UPCOMING DEADLINES & ACTIONS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-[#141b2b] border border-amber-200/80 dark:border-amber-900/50 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-900/40">
                  <h4 className="font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Yaklaşan Kesin Süreler ve Avukat Aksiyon Planı</span>
                  </h4>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold">Öncelikli</span>
                </div>

                <ul className="space-y-2">
                  {summaryData.upcomingDeadlinesAndActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {/* 3. Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0c121e] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              disabled={!summaryData || isLoading}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı' : 'Özeti Kopyala'}</span>
            </button>

            <button
              type="button"
              onClick={fetchSummary}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              title="Yapay zeka analizini yeniden çalıştır"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yeniden Üret</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPetition && (
              <button
                type="button"
                onClick={handleSendToPetition}
                className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dilekçeye Aktar</span>
              </button>
            )}

            {onNavigateToAnalyzer && (
              <button
                type="button"
                onClick={handleSendToAnalyzer}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Evrak Analizörüne Git</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
