import React, { useState, useMemo, useEffect } from 'react';
import {
  Archive,
  Search,
  RotateCcw,
  Gavel,
  Users,
  Calendar,
  FileText,
  Trash2,
  Brain,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Filter,
  X,
  ExternalLink,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import {
  ClientItem,
  ClientCase,
  getClientList,
  unarchiveCase,
  deleteCase,
  downloadDocumentsPackage,
  subscribeToClientUpdates
} from '../services/clientCaseStore';

interface ArchivedCasesTabProps {
  onNavigateToPortal?: () => void;
  onNavigateToPetition?: (text: string) => void;
  onNavigateToDeepAnalysis?: (caseNumber?: string) => void;
}

export function ArchivedCasesTab({
  onNavigateToPortal,
  onNavigateToPetition,
  onNavigateToDeepAnalysis
}: ArchivedCasesTabProps) {
  const [clients, setClients] = useState<ClientItem[]>(() => getClientList());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<{ title: string; text: string; type: 'success' | 'info' } | null>(null);
  const [confirmUnarchiveModal, setConfirmUnarchiveModal] = useState<{ clientId: string; caseItem: ClientCase; clientName: string } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ clientId: string; caseId: string; caseNumber: string } | null>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = subscribeToClientUpdates((updated) => {
      setClients(updated);
    });
    return unsub;
  }, []);

  // Show temporary toast
  const triggerToast = (title: string, text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ title, text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Flatten all archived cases
  const archivedCases = useMemo(() => {
    const list: { client: ClientItem; caseItem: ClientCase }[] = [];
    clients.forEach((c) => {
      (c.cases || []).forEach((cs) => {
        if (cs.isArchived) {
          list.push({ client: c, caseItem: cs });
        }
      });
    });
    return list;
  }, [clients]);

  // Unique courts among archived cases
  const availableCourts = useMemo(() => {
    const set = new Set<string>();
    archivedCases.forEach(({ caseItem }) => {
      if (caseItem.court) set.add(caseItem.court.trim());
    });
    return Array.from(set).sort();
  }, [archivedCases]);

  // Unique clients among archived cases
  const availableClients = useMemo(() => {
    const map = new Map<string, string>();
    archivedCases.forEach(({ client }) => {
      map.set(client.id, client.fullName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [archivedCases]);

  // Filtered list
  const filteredCases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return archivedCases.filter(({ client, caseItem }) => {
      if (query) {
        const matchCaseNo = caseItem.caseNumber.toLowerCase().includes(query);
        const matchCourt = caseItem.court.toLowerCase().includes(query);
        const matchClient = client.fullName.toLowerCase().includes(query);
        const matchSubject = caseItem.subject.toLowerCase().includes(query);
        const matchOpponent = (caseItem.opponentName || '').toLowerCase().includes(query);
        const matchReason = (caseItem.archiveReason || '').toLowerCase().includes(query);

        if (!matchCaseNo && !matchCourt && !matchClient && !matchSubject && !matchOpponent && !matchReason) {
          return false;
        }
      }

      if (selectedCourt !== 'ALL' && caseItem.court !== selectedCourt) {
        return false;
      }

      if (selectedClient !== 'ALL' && client.id !== selectedClient) {
        return false;
      }

      return true;
    });
  }, [archivedCases, searchQuery, selectedCourt, selectedClient]);

  // Handle restoring / unarchiving case
  const handleExecuteUnarchive = (clientId: string, caseItem: ClientCase) => {
    const ok = unarchiveCase(clientId, caseItem.id);
    if (ok) {
      setConfirmUnarchiveModal(null);
      triggerToast(
        'Dosya Aktife Döndürüldü',
        `"${caseItem.caseNumber}" esas numaralı dava başarıyla aktif çalışma masasına ve ana sayfa dava listesine geri taşındı.`
      );
    }
  };

  // Handle permanent delete
  const handleExecuteDelete = (clientId: string, caseId: string, caseNumber: string) => {
    deleteCase(clientId, caseId);
    setConfirmDeleteModal(null);
    triggerToast(
      'Dosya Sistemden Silindi',
      `"${caseNumber}" esas numaralı dava dosyası ve ekli evraklar kalıcı olarak silindi.`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white dark:bg-slate-900 border border-emerald-500/50 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{toastMessage.title}</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{toastMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#161f33] to-[#121c2f] border border-amber-500/30 rounded-2xl p-5 shadow-lg text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
              <Archive className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Arşivlenen Dava Dosyaları
                </h2>
                <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-bold">
                  {archivedCases.length} Dosya Arşivde
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  Aktif Görünümden İzole
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Bu sekmede sonuçlanan, sulh olunan veya aktif takibi sona erdirilmiş davalar güvenle saklanır. 
                Arşivlenen davalar ana sayfa kontrol panelini ve derdest dava listesini kalabalıktan arındırır; dilediğiniz zaman tek tıkla <strong>aktife geri alabilirsiniz</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
            {onNavigateToPortal && (
              <button
                type="button"
                onClick={onNavigateToPortal}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Aktif Dava Portalı</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Toplam Arşivlenen Dosya:</span>
            <span className="text-lg font-bold font-mono text-amber-400">{archivedCases.length} Adet</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Farklı Mahkeme Kütüğü:</span>
            <span className="text-lg font-bold font-mono text-sky-400">{availableCourts.length} Mahkeme</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Kapsanan Müvekkil Sayısı:</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{availableClients.length} Müvekkil</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Saklanan Delil & Evrak:</span>
            <span className="text-lg font-bold font-mono text-purple-400">
              {archivedCases.reduce((acc, c) => acc + (c.caseItem.files?.length || 0), 0)} Evrak
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {archivedCases.length > 0 && (
        <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Arşivde ara (Esas No, Mahkeme, Müvekkil, Arşiv Sebebi veya Konu)..."
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Court Filter */}
            {availableCourts.length > 1 && (
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Tüm Mahkemeler ({availableCourts.length})</option>
                {availableCourts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Client Filter */}
            {availableClients.length > 1 && (
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Tüm Müvekkiller ({availableClients.length})</option>
                {availableClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || selectedCourt !== 'ALL' || selectedClient !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCourt('ALL');
                  setSelectedClient('ALL');
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content: List or Empty States */}
      {archivedCases.length === 0 ? (
        <div className="bg-white dark:bg-[#131d31] border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
            <Archive className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Henüz Arşivlenmiş Bir Dava Dosyası Yok
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Derdest dava listenizi kalabalıktan arındırmak ve sonuçlanan dosyaları muhafaza etmek için, ana sayfadaki dava listesinde bulunan <strong>"Arşivle"</strong> butonunu kullanabilirsiniz.
            </p>
          </div>
          {onNavigateToPortal && (
            <button
              type="button"
              onClick={onNavigateToPortal}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition inline-flex items-center gap-2 shadow-sm"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Aktif Dava Listesine Git</span>
            </button>
          )}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Arama kriterlerinize uygun arşivlenmiş dava dosyası bulunamadı.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCourt('ALL');
              setSelectedClient('ALL');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map(({ client, caseItem }) => {
            const archiveDateFormatted = caseItem.archivedAt
              ? new Date(caseItem.archivedAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Belirtilmedi';

            return (
              <div
                key={caseItem.id}
                className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-sm transition space-y-3"
              >
                {/* Top Status & Meta Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/25">
                      {caseItem.caseNumber}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      <Gavel className="w-3 h-3 text-slate-400" />
                      <span>{caseItem.court}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      <Archive className="w-3 h-3" />
                      <span>Arşivlendi</span>
                    </span>

                    {caseItem.archiveReason && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                        Sebep: <strong className="text-slate-700 dark:text-slate-200">{caseItem.archiveReason}</strong>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 self-start sm:self-auto">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Arşivlenme Tarihi: {archiveDateFormatted}</span>
                  </div>
                </div>

                {/* Case Subject */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                    {caseItem.subject}
                  </h4>
                </div>

                {/* Client, Opponent, & Files Details */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-slate-500 dark:text-slate-400 text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    Müvekkil: <strong className="text-slate-800 dark:text-slate-200 ml-0.5">{client.fullName}</strong>
                    <span className="text-[10px] font-mono text-slate-400">({client.type})</span>
                  </span>

                  <span className="text-slate-300 dark:text-slate-700">•</span>

                  <span>
                    Karşı Taraf: <span className="text-slate-700 dark:text-slate-300 font-medium">{caseItem.opponentName || 'Belirtilmedi'}</span>
                  </span>

                  {caseItem.estimatedValue && caseItem.estimatedValue !== 'Belirtilmedi' && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                        Uyuşmazlık Değeri: {caseItem.estimatedValue}
                      </span>
                    </>
                  )}

                  {caseItem.files && caseItem.files.length > 0 && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                        <FileText className="w-3 h-3" />
                        <span>{caseItem.files.length} Evrak Arşivde Kayıtlı</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* RESTORE / UNARCHIVE BUTTON */}
                    <button
                      type="button"
                      onClick={() => setConfirmUnarchiveModal({ clientId: client.id, caseItem, clientName: client.fullName })}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Bu davayı arşivden çıkarıp aktif ana sayfa dava listesine geri yükler"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Aktife Geri Al</span>
                    </button>

                    {/* UYAP PETITION */}
                    {onNavigateToPetition && (
                      <button
                        type="button"
                        onClick={() => {
                          const summary = `[ARŞİVLENMİŞ DAVA REF]\nEsas No: ${caseItem.caseNumber}\nMahkeme: ${caseItem.court}\nMüvekkil: ${client.fullName}\nKarşı Taraf: ${caseItem.opponentName}\nDava Konusu: ${caseItem.subject}\nArşiv Notu: ${caseItem.archiveReason || 'Arşiv Kaydı'}`;
                          onNavigateToPetition(summary);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition flex items-center gap-1"
                        title="Bu arşivlenmiş dosya bilgileriyle dilekçe hazırla"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Dilekçe Lab</span>
                      </button>
                    )}

                    {/* DEEP ANALYSIS */}
                    {onNavigateToDeepAnalysis && (
                      <button
                        type="button"
                        onClick={() => onNavigateToDeepAnalysis(caseItem.caseNumber)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Derin Analiz</span>
                      </button>
                    )}

                    {/* DOWNLOAD DOCUMENTS */}
                    {caseItem.files && caseItem.files.length > 0 && (
                      <button
                        type="button"
                        onClick={() => downloadDocumentsPackage(client.fullName, caseItem.caseNumber, caseItem.files)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1"
                        title="Arşivlenmiş tüm delil ve evrakları TXT paketi olarak indir"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Evrakları İndir</span>
                      </button>
                    )}
                  </div>

                  {/* PERMANENT DELETE */}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteModal({ clientId: client.id, caseId: caseItem.id, caseNumber: caseItem.caseNumber })}
                    className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition flex items-center gap-1"
                    title="Bu dava kaydını tamamen sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kalıcı Sil</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM RESTORE / UNARCHIVE MODAL */}
      {confirmUnarchiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Davayı Aktif Çalışma Masasına Geri Yükle
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dosya ana sayfa dashboard'una ve derdest listeye geri taşınacaktır.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400">Esas No:</span>{' '}
                <strong className="text-amber-600 dark:text-amber-400 font-mono">
                  {confirmUnarchiveModal.caseItem.caseNumber}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Mahkeme:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">{confirmUnarchiveModal.caseItem.court}</span>
              </div>
              <div>
                <span className="text-slate-400">Müvekkil:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">{confirmUnarchiveModal.clientName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Bu dosyayı arşivden çıkarmak istediğinizden emin misiniz? Dava aktif derdest statüsüne geri dönecek ve ana sayfa dava takibinde görünür olacaktır.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmUnarchiveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleExecuteUnarchive(confirmUnarchiveModal.clientId, confirmUnarchiveModal.caseItem)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Aktife Geri Al</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Dava Dosyasını Kalıcı Olarak Sil
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-rose-600 dark:text-rose-400 font-mono">
                {confirmDeleteModal.caseNumber}
              </strong>{' '}
              numaralı dosyayı ve tüm delil eklerini sistemden tamamen silmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() =>
                  handleExecuteDelete(
                    confirmDeleteModal.clientId,
                    confirmDeleteModal.caseId,
                    confirmDeleteModal.caseNumber
                  )
                }
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kalıcı Olarak Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
