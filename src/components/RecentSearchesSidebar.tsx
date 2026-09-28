import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Sparkles,
  BookOpen,
  Scale,
  X,
  Trash2,
  RotateCcw,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import {
  RecentSearchItem,
  getRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
  resetToDefaultRecentSearches,
  subscribeRecentSearches
} from '../services/recentSearchesService';

interface RecentSearchesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTerm: (term: string, preferredAction: 'glossary' | 'mevzuat') => void;
  currentActiveTerm?: string;
  variant?: 'drawer' | 'docked' | 'card';
}

export function RecentSearchesSidebar({
  isOpen,
  onClose,
  onSelectTerm,
  currentActiveTerm,
  variant = 'drawer'
}: RecentSearchesSidebarProps) {
  const [recentItems, setRecentItems] = useState<RecentSearchItem[]>(() => getRecentSearches());
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [selectedFeedbackTerm, setSelectedFeedbackTerm] = useState<string | null>(null);

  // Subscribe to changes in recent searches store
  useEffect(() => {
    const unsubscribe = subscribeRecentSearches((updated) => {
      setRecentItems(updated);
    });
    return unsubscribe;
  }, []);

  const handleItemClick = (term: string, action: 'glossary' | 'mevzuat') => {
    setSelectedFeedbackTerm(term);
    setTimeout(() => setSelectedFeedbackTerm(null), 1200);
    onSelectTerm(term, action);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeRecentSearch(id);
  };

  const handleClearAll = () => {
    clearRecentSearches();
    setConfirmClear(false);
  };

  const formatRelativeTime = (isoString: string): string => {
    try {
      const now = Date.now();
      const itemTime = new Date(isoString).getTime();
      const diffMinutes = Math.floor((now - itemTime) / (1000 * 60));

      if (diffMinutes < 1) return 'Az önce';
      if (diffMinutes < 60) return `${diffMinutes} dk önce`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} sa önce`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Dün';
      return `${diffDays} gün önce`;
    } catch {
      return 'Yakın zamanda';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0e1524] text-slate-900 dark:text-slate-100 select-none">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#121929]/50 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100">
              Son Aramalar
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold">
              {recentItems.length}/5
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Son 5 hukuki kavram & mevzuat araması (Hızlı Erişim)
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          title="Paneli Kapat"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action / Toolbar Sub-bar */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs bg-slate-50/30 dark:bg-[#101726]">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Flame className="w-3 h-3 text-amber-500" />
          <span>Kayıtlı Hukuki Terimler</span>
        </span>

        {recentItems.length > 0 ? (
          confirmClear ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-[11px] text-rose-500 font-semibold">Silinsin mi?</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
              >
                Evet
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                İptal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-[11px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
              title="Son arama geçmişini temizle"
            >
              <Trash2 className="w-3 h-3" />
              <span>Temizle</span>
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => resetToDefaultRecentSearches()}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Örnek Terimleri Yükle</span>
          </button>
        )}
      </div>

      {/* Main List of 5 Recent Terms */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {recentItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
            <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Arama Geçmişi Temiz
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mevzuat arama çubuğunu veya Hukuk Terimleri Sözlüğü'nü kullandıkça aradığınız son 5 terim otomatik olarak bu alana kaydedilecektir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => resetToDefaultRecentSearches()}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-semibold transition"
            >
              Sık Aranan Hukuki Kavramları Getir
            </button>
          </div>
        ) : (
          recentItems.map((item, index) => {
            const isCurrentActive =
              currentActiveTerm &&
              currentActiveTerm.toLowerCase().trim() === item.term.toLowerCase().trim();
            const isJustSelected = selectedFeedbackTerm === item.term;

            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border p-3 text-xs transition-all duration-150 ${
                  isJustSelected
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300'
                    : isCurrentActive
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-[#131b2c]/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Ranking & Term Title */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleItemClick(item.term, item.source)}
                        className="text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block w-full transition cursor-pointer"
                        title={item.term}
                      >
                        {item.term}
                      </button>

                      {/* Unboxed Metadata (Category & Timestamp) */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 flex-wrap font-mono">
                        <span className="text-slate-600 dark:text-slate-300 font-sans font-medium">
                          {item.category || 'Hukuk Terimi'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeTime(item.timestamp)}</span>
                        {item.searchCount > 1 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              {item.searchCount}x arandı
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Single Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, item.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition opacity-60 group-hover:opacity-100 shrink-0"
                    title="Listeden Çıkar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Direct Action Jump Buttons */}
                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Action 1: Open in AI Glossary */}
                    <button
                      type="button"
                      onClick={() => handleItemClick(item.term, 'glossary')}
                      className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Hukuk Terimleri Sözlüğü'nde AI ile Aç"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Sözlükte Gör</span>
                    </button>

                    {/* Action 2: Search in Legislation */}
                    <button
                      type="button"
                      onClick={() => handleItemClick(item.term, 'mevzuat')}
                      className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Pozitif Mevzuat Dizininde Semantik Ara"
                    >
                      <Scale className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Mevzuatta Ara</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                    {isJustSelected ? (
                      <span className="text-emerald-500 flex items-center gap-0.5 font-bold">
                        <Check className="w-3 h-3" /> Açıldı
                      </span>
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Privacy & Scope Seal */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#121929]/60 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Yerel Önbellek & Gizlilik Koruması</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Son aramalarınız 1136 Sayılı Avukatlık Kanunu m. 36 ve KVKK ilkeleri uyarınca yalnızca yerel tarayıcı hafızanızda tutulur; hiçbir dış sunucuya gönderilmez.
        </p>
      </div>
    </div>
  );

  // If used as an embedded/docked card or column
  if (variant === 'docked') {
    if (!isOpen) return null;
    return (
      <aside
        className="w-80 shrink-0 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[700px] sticky top-20 bg-white dark:bg-[#0e1524] animate-in slide-in-from-right duration-200"
        aria-label="Son Aramalar Paneli"
      >
        {sidebarContent}
      </aside>
    );
  }

  // Drawer modal overlay
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-[#0e1524] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Son Aramalar Kenar Çubuğu"
      >
        {sidebarContent}
      </div>
    </div>
  );
}
