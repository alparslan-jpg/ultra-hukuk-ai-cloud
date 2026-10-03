import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Lock,
  Eye,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  FileCode,
  Calendar,
  Layers
} from 'lucide-react';
import { ReportExportService, ReportItem } from '../services/reportExportService';

interface RaporlarimBelgelerimModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSicilNo?: string;
  lawyerName?: string;
}

export function RaporlarimBelgelerimModal({
  isOpen,
  onClose,
  userSicilNo = '8109',
  lawyerName = 'Av. Osman Turgut'
}: RaporlarimBelgelerimModalProps) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<{ name: string; content: string } | null>(null);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const items = await ReportExportService.listReports(userSicilNo);
      setReports(items);
    } catch (err: any) {
      console.warn('Raporlar alınırken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, userSicilNo]);

  if (!isOpen) return null;

  const handleDownload = async (report: ReportItem) => {
    setDecryptingId(report.id);
    try {
      await ReportExportService.downloadAndDecrypt(report.id, report.name, userSicilNo);
      setStatusMessage(`✅ "${report.name}" şifresi çözüldü ve cihazınıza indirildi.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(`İndirme ve şifre çözme hatası: ${err.message}`);
    } finally {
      setDecryptingId(null);
    }
  };

  const handlePreview = async (report: ReportItem) => {
    setDecryptingId(report.id);
    try {
      const content = await ReportExportService.downloadAndDecrypt(report.id, report.name, userSicilNo);
      setPreviewContent({ name: report.name, content });
    } catch (err: any) {
      alert(`Önizleme yüklenemedi: ${err.message}`);
    } finally {
      setDecryptingId(null);
    }
  };

  const filteredReports = reports.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0f172a]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <HardDrive className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Raporlarım & Belgelerim
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Google Drive (AES-256-GCM)
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lawyerName} ({userSicilNo}) izole bulut klasöründeki UDF, PDF ve strateji raporları.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#11192b]/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rapor adı veya UYAP dosya adı ile filtrele..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Toplam: <strong className="text-amber-600 dark:text-amber-400 font-mono">{filteredReports.length}</strong> evrak</span>
          </div>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Reports List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google Drive güvenli deposundan şifreli raporlar taranıyor...
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-16 text-center space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <FileCode className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Kayıtlı Rapor Bulunmuyor
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Baş Hukuk Müşaviri veya Dilekçe Ajanı üzerinden hazırladığınız UDF ve PDF dilekçeler otomatik olarak buraya şifrelenerek yedeklenir.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const isUdf = report.name.endsWith('.udf');
              const isPdf = report.name.endsWith('.pdf');
              const isDecrypting = decryptingId === report.id;

              return (
                <div
                  key={report.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#11192b] hover:border-amber-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isUdf
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : isPdf
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {isUdf ? <FileCode className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {report.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          AES-256
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.uploadedAt).toLocaleDateString('tr-TR')}
                        </span>
                        <span>{(report.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span className="capitalize font-medium text-slate-600 dark:text-slate-300">
                          {isUdf ? 'UYAP UDF Belgesi' : isPdf ? 'Resmi PDF Raporu' : 'Hukuki Evrak'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      disabled={isDecrypting}
                      onClick={() => handlePreview(report)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-500" />
                      <span>{isDecrypting ? 'Çözülüyor...' : 'Görüntüle'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDecrypting}
                      onClick={() => handleDownload(report)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDecrypting ? 'İndiriliyor...' : 'İndir & Çöz'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0f172a]/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Knowledge: Evraklarınız yalnızca sizin cihazınızda çözülebilir.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Kapat
          </button>
        </div>
      </div>

      {/* Önizleme Modal */}
      {previewContent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0e1524] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>{previewContent.name} (Şifresi Çözülmüş Canlı Önizleme)</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewContent(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {previewContent.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
