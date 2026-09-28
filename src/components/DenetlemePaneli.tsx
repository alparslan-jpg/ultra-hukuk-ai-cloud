import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  FileCheck2,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Scale,
  FileText,
  BadgeAlert,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export interface AnalyzedStatement {
  id: string;
  statementText: string;
  hasLegalBasis: boolean;
  normType?: 'kanun' | 'tuzuk' | 'yonetmelik' | 'doktrin' | 'ictihat' | null;
  detectedCitation?: string;
  flagReason?: string;
  suggestedCitations?: string[];
  explanation?: string;
  userVerified?: boolean;
}

interface DenetlemePaneliProps {
  lawyerSicilNo: string;
  initialText?: string;
  caseSummary?: string;
  clientClaims?: string;
  onVerifiedTextExport?: (verifiedText: string) => void;
  onNavigateToCrossRef?: (text: string) => void;
}

export const HukukiDenetimBadge: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'compact' | 'stamp';
  lawyerSicilNo?: string;
}> = ({ size = 'md', variant = 'full', lawyerSicilNo = '8109' }) => {
  if (variant === 'stamp') {
    return (
      <div className="border border-indigo-500/40 bg-indigo-950/20 dark:bg-indigo-950/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 flex-shrink-0" />
          <span className="font-bold text-amber-600 dark:text-amber-300 tracking-wider">
            RESMİ POZİTİF MEVZUAT UYGUNLUK DÖKÜMÜ
          </span>
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-600 dark:text-slate-300 text-[11px]">HMK m. 119 & m. 194 Somutlaştırma Uygunluğu</span>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700/80">
          Avukat Sicil: <span className="text-amber-600 dark:text-amber-400 font-semibold">{lawyerSicilNo}</span> • 1136 S. K. m. 34 Mesleki Özen Denetimi
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono text-[10px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>MEVZUAT ONAYLI</span>
      </span>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs shadow-sm">
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      <span className="font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase font-mono text-[10px]">
        MEVZUAT & ATIF DENETİMLİ
      </span>
      <span className="text-slate-300 dark:text-slate-700">|</span>
      <span className="text-[11px] text-slate-600 dark:text-slate-400">
        1136 S.K. m. 34: Avukat Denetimi & Onayı Şarttır
      </span>
    </div>
  );
};

// Aliased for backward compatibility
export const AiAssistedBadge = HukukiDenetimBadge;

export const DenetlemePaneli: React.FC<DenetlemePaneliProps> = ({
  lawyerSicilNo,
  initialText = '',
  caseSummary = '',
  clientClaims = '',
  onVerifiedTextExport,
  onNavigateToCrossRef,
}) => {
  const [inputText, setInputText] = useState<string>(initialText || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [strictEnforcement, setStrictEnforcement] = useState<boolean>(true);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [statements, setStatements] = useState<AnalyzedStatement[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Manual editing / attaching state for a flagged statement
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedNormType, setSelectedNormType] = useState<'kanun' | 'tuzuk' | 'yonetmelik' | 'doktrin' | 'ictihat'>('kanun');
  const [customCitation, setCustomCitation] = useState<string>('');

  const runLegalBasisAudit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/verify-legal-basis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementsText: inputText,
          lawyerSicilNo,
        }),
      });
      const data = await res.json();
      setAuditResult(data);
      if (data.analyzedStatements && Array.isArray(data.analyzedStatements)) {
        setStatements(data.analyzedStatements);
      }
    } catch (e) {
      alert('Hukuki dayanak denetimi sırasında bağlantı hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Attach legal citation to a statement
  const handleAttachCitation = (id: string, citationText: string, normType: 'kanun' | 'tuzuk' | 'yonetmelik' | 'doktrin' | 'ictihat' = 'kanun') => {
    setStatements((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            hasLegalBasis: true,
            userVerified: true,
            normType,
            detectedCitation: citationText,
            explanation: `Kullanıcı/Avukat tarafından ${citationText} dayanağı ile onaylandı.`,
            flagReason: undefined,
          };
        }
        return item;
      })
    );
    setEditingId(null);
    setCustomCitation('');
  };

  // Calculate real-time stats
  const totalStmts = statements.length;
  const verifiedCount = statements.filter((s) => s.hasLegalBasis || s.userVerified).length;
  const unverifiedCount = totalStmts - verifiedCount;
  const complianceScore = totalStmts > 0 ? Math.round((verifiedCount / totalStmts) * 100) : 0;

  const handleCopyVerifiedDocument = () => {
    const verifiedLines = statements.map((s, idx) => {
      const citation = s.detectedCitation ? ` [Dayanak: ${s.detectedCitation}]` : ' [MEVZUAT ATIFI BULUNAMADI]';
      return `${idx + 1}. ${s.statementText}${citation}`;
    });

    const header = `[RESMİ UYAP DİLEKÇE METNİ — POZİTİF MEVZUAT VE İÇTİHAT DENETİMLİ]\nAVUKAT SİCİL NO: ${lawyerSicilNo}\nHUKUKİ DENETİM PUANI: %${complianceScore}\nDENETİM TARİHİ: ${new Date().toLocaleDateString('tr-TR')}\n=======================================================\n\n`;

    const fullDoc = header + verifiedLines.join('\n\n');
    navigator.clipboard.writeText(fullDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onVerifiedTextExport) onVerifiedTextExport(fullDoc);
  };

  return (
    <div className="space-y-6">
      {/* 1. Üst Başlık ve Hukuki Denetim Damgası */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-[#0d1527] dark:via-[#121c32] dark:to-[#0f182c] border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                Hukuki Denetleme Paneli (Mevzuat & Atıf Zorunluluğu)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              6100 Sayılı HMK m. 119/1-e ve m. 194 (somutlaştırma yükü) gereğince, davada ileri sürülen her iddia yürürlükteki bir pozitif hukuk kuralına (Kanun, Tüzük, Yönetmelik veya Doktrin) bağlanmalıdır.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {onNavigateToCrossRef && (
              <button
                type="button"
                onClick={() => onNavigateToCrossRef(inputText)}
                className="text-xs bg-sky-50 dark:bg-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition font-bold"
              >
                <Scale className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>Maddeleri Çapraz Doğrula (Verified/Flagged)</span>
              </button>
            )}
            <AiAssistedBadge lawyerSicilNo={lawyerSicilNo} />
          </div>
        </div>

        {/* Katı Denetleme Kalkanı Anahtarı */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${strictEnforcement ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Zorunlu Mevzuat Doğrulama Modu (Strict Grounding Enforcement)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Kanun, tüzük veya doktrin atfı bulunmayan soyut ifadeler kırmızı bayrakla (flag) işaretlenir ve avukat onayına zorlanır.
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={strictEnforcement}
              onChange={(e) => setStrictEnforcement(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
          </label>
        </div>
      </div>

      {/* 2. Giriş ve İddia Denetleme Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Denetlenecek İddia, Savunma veya Dava Metni
              </label>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                Her Cümle Ayrı Taranır
              </span>
            </div>

            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="İncelenecek dava iddialarını veya dilekçe metnini buraya yazınız..."
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
            />

            {/* Hızlı Aktarım Butonları (Dava Dosyasından) */}
            {(caseSummary || clientClaims) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 self-center">Dosyadan Çek:</span>
                {caseSummary && (
                  <button
                    type="button"
                    onClick={() => setInputText(caseSummary)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 transition"
                  >
                    Dava Özeti
                  </button>
                )}
                {clientClaims && (
                  <button
                    type="button"
                    onClick={() => setInputText(clientClaims)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 transition"
                  >
                    Müvekkil İddiaları
                  </button>
                )}
              </div>
            )}

            <button
              disabled={isLoading || !inputText.trim()}
              onClick={runLegalBasisAudit}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-white" />
              )}
              <span>Tüm İddiaları Mevzuata (Kanun / Tüzük / Doktrin) Tara & Denetle</span>
            </button>
          </div>

          {/* Hızlı Bilgilendirme Kutusu */}
          <div className="bg-slate-50 dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Denetleme Protokolü Kriterleri:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li><strong className="text-slate-800 dark:text-slate-300">Kanun:</strong> TBK, HMK, TTK, İİK, TMK, TCK vb. açık madde numarası ile eşleşmelidir.</li>
              <li><strong className="text-slate-800 dark:text-slate-300">Tüzük & Yönetmelik:</strong> Resmi Gazete tarih/sayısı veya ilgili yönetmelik adı.</li>
              <li><strong className="text-slate-800 dark:text-slate-300">Doktrin:</strong> Hukukçu akademisyen (Prof. Dr. vb.) veya şerh atfı.</li>
              <li><strong className="text-slate-800 dark:text-slate-300">İçtihat:</strong> Yargıtay Hukuk Genel Kurulu (HGK) veya Daire ilke kararı.</li>
            </ul>
          </div>
        </div>

        {/* 3. Denetim Sonuçları ve İfade Bazlı Doğrulama Paneli */}
        <div className="lg:col-span-7 space-y-4">
          {statements.length > 0 ? (
            <div className="bg-[#131d31] border border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Skor ve Özet Kartı */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1d] border border-slate-800/90 rounded-xl p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">Hukuki Dayanak Doğruluk Skoru:</span>
                    <span
                      className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        complianceScore >= 80
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : complianceScore >= 50
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      %{complianceScore}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Toplam {totalStmts} beyan</span> •
                    <span className="text-emerald-400 font-semibold">{verifiedCount} onaylı dayanak</span> •
                    <span className="text-rose-400 font-semibold">{unverifiedCount} bayraklı (eksik)</span>
                  </div>
                </div>

                <button
                  onClick={handleCopyVerifiedDocument}
                  disabled={strictEnforcement && unverifiedCount > 0}
                  className={`text-xs px-3.5 py-2 rounded-xl border flex items-center gap-2 font-bold transition shadow-sm ${
                    strictEnforcement && unverifiedCount > 0
                      ? 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/20'
                  }`}
                  title={
                    strictEnforcement && unverifiedCount > 0
                      ? 'Dışa aktarmadan önce lütfen bayraklı beyanlara dayanak ekleyin!'
                      : 'Onaylı UYAP metnini kopyalayın'
                  }
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı' : 'Onaylı UYAP Metnini Al'}</span>
                </button>
              </div>

              {/* Katı Mod Uyarı İkazı */}
              {strictEnforcement && unverifiedCount > 0 && (
                <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ZORUNLU DENETLEME UYARISI: </span>
                    Metinde kanun veya tüzük maddesine dayanmayan {unverifiedCount} adet soyut iddia tespit edilmiştir. Mahkemede somutlaştırma yükü itirazıyla karşılaşmamak için lütfen aşağıdaki bayraklı ifadelere kanun/doktrin dayanağı bağlayınız.
                  </div>
                </div>
              )}

              {/* Her Bir İddianın Ayrı Ayrı Denetim Kartları */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {statements.map((stmt, idx) => {
                  const isBacked = stmt.hasLegalBasis || stmt.userVerified;
                  const isEditing = editingId === stmt.id;

                  return (
                    <div
                      key={stmt.id || idx}
                      className={`p-4 rounded-xl border transition space-y-3 ${
                        isBacked
                          ? 'bg-[#0b1220] border-emerald-500/30'
                          : 'bg-[#181119] border-rose-500/40 shadow-sm'
                      }`}
                    >
                      {/* Cümle Başlığı ve Durum Rozeti */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">
                            #{idx + 1}
                          </span>
                          <p className="text-xs text-slate-100 font-medium leading-relaxed">
                            {stmt.statementText}
                          </p>
                        </div>

                        {isBacked ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>MEVZUAT ONAYLI</span>
                          </span>
                        ) : (
                          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold font-mono animate-pulse">
                            <BadgeAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span>BAYRAKLANDI (DAYANAKSIZ)</span>
                          </span>
                        )}
                      </div>

                      {/* Tespit Edilen veya Onaylanan Dayanak */}
                      {isBacked && stmt.detectedCitation && (
                        <div className="flex items-center gap-2 text-xs bg-emerald-950/30 border border-emerald-900/40 rounded-lg px-3 py-2 text-emerald-300">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-[11px]">
                            {stmt.normType ? stmt.normType.toUpperCase() : 'MEVZUAT'}: {stmt.detectedCitation}
                          </span>
                        </div>
                      )}

                      {/* Dayanak Yoksa: Bayrak Gerekçesi ve Hızlı Öneriler */}
                      {!isBacked && (
                        <div className="space-y-2.5">
                          <div className="text-[11px] text-rose-300/90 bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5">
                            <span className="font-semibold block mb-0.5 text-rose-200">
                              ⚠️ Hukuki Dayanak Eksikliği:
                            </span>
                            {stmt.flagReason || 'Bu beyan pozitif hukuk normu (kanun, tüzük, doktrin) atfı içermemektedir.'}
                          </div>

                          {/* Önerilen Kanun Maddeleri (Tıklanabilir Chip'ler) */}
                          {stmt.suggestedCitations && stmt.suggestedCitations.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Önerilen Hukuki Dayanaklar (Tıklayarak Doğrulayınız):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {stmt.suggestedCitations.map((sug, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => handleAttachCitation(stmt.id, sug, 'kanun')}
                                    className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                                  >
                                    <Plus className="w-3 h-3 text-amber-400" />
                                    <span>{sug}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Manuel Kanun / Doktrin Bağlama Butonu */}
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(stmt.id);
                                setCustomCitation('');
                              }}
                              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5 pt-1"
                            >
                              <span>+ Özel Kanun Maddesi / Doktrin Şerhi Yazarak Doğrula</span>
                            </button>
                          ) : (
                            <div className="bg-[#0c1424] border border-sky-500/40 rounded-xl p-3 space-y-2.5 mt-2">
                              <div className="text-xs font-bold text-slate-200">
                                Bu İddiayı Pozitif Hukuk Normuna Bağlayın:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select
                                  value={selectedNormType}
                                  onChange={(e: any) => setSelectedNormType(e.target.value)}
                                  className="bg-[#080d1a] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                                >
                                  <option value="kanun">Kanun Maddesi</option>
                                  <option value="tuzuk">Tüzük</option>
                                  <option value="yonetmelik">Yönetmelik / Tebliğ</option>
                                  <option value="doktrin">Doktrin (Şerh/Görüş)</option>
                                  <option value="ictihat">Yargıtay/HGK Kararı</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Örn: TBK m. 117 veya Prof. Dr. Fikret Eren Borçlar Şerhi s. 450"
                                  value={customCitation}
                                  onChange={(e) => setCustomCitation(e.target.value)}
                                  className="sm:col-span-2 bg-[#080d1a] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1"
                                >
                                  İptal
                                </button>
                                <button
                                  type="button"
                                  disabled={!customCitation.trim()}
                                  onClick={() =>
                                    handleAttachCitation(stmt.id, customCitation.trim(), selectedNormType)
                                  }
                                  className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition disabled:opacity-50"
                                >
                                  Dayanağı Bağla ve Doğrula
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Alt Bilgi Damgası */}
              <AiAssistedBadge variant="stamp" lawyerSicilNo={lawyerSicilNo} />
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-[#131d31] rounded-2xl border border-dashed border-slate-800 space-y-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                <Scale className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">Denetim Sonuçları Burada Görünecektir</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Soldaki kutudan iddiaları girip <strong>"Tüm İddiaları Mevzuata Tara & Denetle"</strong> butonuna basınız.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
