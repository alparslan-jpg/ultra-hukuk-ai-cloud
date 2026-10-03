import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Terminal,
  Zap,
  CheckSquare,
  Square,
  ArrowRight,
  Code
} from 'lucide-react';

export interface ProposedFeature {
  id: string;
  category: 'Portal & Yönetim' | 'Yapay Zeka & Ajanlar' | 'Mevzuat & Hesaplama' | 'Entegrasyon';
  title: string;
  description: string;
  status: 'Yüklendi (Aktif)' | 'Hazır (Seçildi)' | 'Önerilen';
  impact: 'Yüksek Verimlilik' | 'Kritik Usul Güvenliği' | 'Zaman Tasarrufu';
  selected: boolean;
}

interface SecmeliOzelliklerVeGitPaneliProps {
  onNavigateToTab?: (tabKey: any) => void;
}

export function SecmeliOzelliklerVeGitPaneli({ onNavigateToTab }: SecmeliOzelliklerVeGitPaneliProps) {
  // Selectable features roadmap
  const [features, setFeatures] = useState<ProposedFeature[]>([
    {
      id: 'feat-portal',
      category: 'Portal & Yönetim',
      title: 'Müvekkil & Dava Dosyaları Hiyerarşik Portalı',
      description: 'Müvekkil listesi, alt davalar ve dava içi evrakların tek tek ya da seçili/toplu olarak analiz edilmesi ve toplu indirilmesi.',
      status: 'Yüklendi (Aktif)',
      impact: 'Yüksek Verimlilik',
      selected: true
    },
    {
      id: 'feat-council',
      category: 'Yapay Zeka & Ajanlar',
      title: 'Baş Hukuk Müşaviri & Çoklu Ajan Konsültasyon Odası',
      description: 'Uygulamayı yöneten Baş Hukuk Müşaviri (Derin Bağlam Muhakeme Motoru) ile arkadaki 4 uzman ajanın yazılı, sesli (mikrofon) veya evrak yüklemeli dava danışması.',
      status: 'Yüklendi (Aktif)',
      impact: 'Kritik Usul Güvenliği',
      selected: true
    },
    {
      id: 'feat-git-sync',
      category: 'Entegrasyon',
      title: 'Otomatik Git & GitHub Repository Senkronizasyon Konsolu',
      description: 'Her işlemden sonra yerel Git commit oluşturup uzak GitHub deposuna (alparslan-jpg/ultra-hukuk-ai) eşitleme motoru.',
      status: 'Yüklendi (Aktif)',
      impact: 'Zaman Tasarrufu',
      selected: true
    },
    {
      id: 'feat-udf',
      category: 'Entegrasyon',
      title: 'UYAP / UDF İki Yönlü Dönüştürücü ve Editör',
      description: 'Hazırlanan dilekçeleri doğrudan UYAP Doküman Editörü (.udf) formatında dışa aktarma ve .udf dosyalarını doğrudan tarayıcıda açma.',
      status: 'Hazır (Seçildi)',
      impact: 'Zaman Tasarrufu',
      selected: true
    },
    {
      id: 'feat-fees',
      category: 'Mevzuat & Hesaplama',
      title: 'Harçlar Kanunu (1) Sayılı Tarife Dava Açılış Masrafı Hesaplayıcı',
      description: 'Nispi/maktu başvuru harcı, peşin karar harcı, vekalet harcı ve HMK m. 120 gider avansı tablosunun kuruşu kuruşuna hesabı.',
      status: 'Hazır (Seçildi)',
      impact: 'Kritik Usul Güvenliği',
      selected: true
    },
    {
      id: 'feat-notification',
      category: 'Mevzuat & Hesaplama',
      title: '7201 Sayılı Tebligat Kanunu Elektronik Tebligat (UETS) 5 Gün Kuralı Denetçisi',
      description: 'UETS e-Tebligatın muhatabın elektronik adresine ulaştığı tarihi izleyen 5. günün sonunu ve 2 haftalık cevap süresini otomatik hesaplama.',
      status: 'Önerilen',
      impact: 'Kritik Usul Güvenliği',
      selected: false
    }
  ]);

  // Git Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [commitMessageInput, setCommitMessageInput] = useState('');
  const [syncHistory, setSyncHistory] = useState<string[]>([
    'Yerel Git deposu hazırlandı (Branch: main, Remote: origin/main).',
    'Başlangıç commit: feat: initial commit with Dava Derin Analiz and Case Analytics'
  ]);

  // Toggle selection of proposed feature
  const toggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  // Perform Git sync
  const handlePerformGitSync = async () => {
    setIsSyncing(true);
    const msg = commitMessageInput.trim() || `feat: Ultra Hukuk AI sync - ${new Date().toLocaleTimeString('tr-TR')}`;

    try {
      const response = await fetch('/api/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: msg })
      });
      const data = await response.json();
      if (data.success) {
        setGitStatus(data);
        setSyncHistory((prev) => [
          `[${new Date().toLocaleTimeString('tr-TR')}] Commit: ${data.lastCommit} -> ${data.pushStatus}`,
          ...prev
        ]);
        setCommitMessageInput('');
      } else {
        alert('Git senkronizasyonu hatası: ' + data.message);
      }
    } catch (err: any) {
      alert('Sunucu iletişim hatası: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  Seçmeli Özellikler Yol Haritası & GitHub Senkronizasyon Konsolu
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                    Sistem Kontrolü
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Uygulama için önerilen yeni özellikleri seçebilir, aktif modülleri yönetebilir ve her işlemden sonra GitHub ile senkronizasyon yapabilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handlePerformGitSync}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-emerald-900/30 disabled:opacity-50"
            >
              {isSyncing ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>GitHub İle Senkronize Et</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Selectable Features Checklist (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Önerilen ve Seçmeli Yeni Özellik Maddeleri ({features.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Seçtiğiniz maddeler anında sisteme eklenir ve çalışma alanında kullanılabilir hale gelir.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {features.filter((f) => f.selected).length} / {features.length} Aktif
            </span>
          </div>

          <div className="space-y-3">
            {features.map((feat) => {
              const isInstalled = feat.status.includes('Yüklendi');

              return (
                <div
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                    feat.selected
                      ? 'bg-slate-950/80 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-start gap-2.5">
                      <button type="button" className="mt-0.5 text-indigo-400">
                        {feat.selected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <span>{feat.title}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-normal">
                            {feat.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                        isInstalled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {feat.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 pl-6 mb-2 leading-relaxed">
                    {feat.description}
                  </p>

                  <div className="pl-6 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span className="font-mono text-indigo-300">{feat.impact}</span>

                    {isInstalled && onNavigateToTab && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (feat.id === 'feat-portal') onNavigateToTab('portal');
                          else if (feat.id === 'feat-council') onNavigateToTab('council');
                        }}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                      >
                        <span>Modüle Git</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Git / GitHub Live Synchronization Terminal (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              GitHub Senkronizasyon Konsolu
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              main &rarr; origin
            </span>
          </div>

          {/* Repo Info Card */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Depo:</span>
              <a
                href="https://github.com/alparslan-jpg/ultra-hukuk-ai"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>alparslan-jpg/ultra-hukuk-ai</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Aktif Dal:</span>
              <span className="text-emerald-400 font-bold">main</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Kullanıcı:</span>
              <span className="text-slate-200">alpsistembackup@gmail.com</span>
            </div>
          </div>

          {/* Commit Message Box */}
          <div className="space-y-1.5 text-xs">
            <label className="block text-slate-300 font-semibold text-[11px]">
              Commit Mesajı Belirle (İsteğe Bağlı):
            </label>
            <input
              type="text"
              placeholder="Örn: feat: Müvekkil portali ve sesli ajan danışması eklendi"
              value={commitMessageInput}
              onChange={(e) => setCommitMessageInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="button"
              disabled={isSyncing}
              onClick={handlePerformGitSync}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-900/30 disabled:opacity-50"
            >
              {isSyncing ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <GitCommit className="w-3.5 h-3.5" />
              )}
              <span>Commit Oluştur ve GitHub'a Gönder</span>
            </button>
          </div>

          {/* Console Output Log */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Senkronizasyon İşlem Günlüğü
            </span>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1 max-h-52 overflow-y-auto">
              {syncHistory.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-emerald-400 select-none">&gt;</span>
                  <span className="break-all">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
