import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Pin,
  PinOff,
  Search,
  Check,
  Brain,
  Scale,
  Gavel,
  ShieldAlert,
  FileText,
  Users,
  Archive,
  GitBranch,
  Crosshair,
  Smartphone,
  BarChart3,
  FlaskConical,
  Compass,
  Swords,
  Timer,
  Calendar,
  ClipboardCheck,
  SearchCheck,
  Mic,
  ScrollText,
  Camera,
  Layers,
  BookOpen,
  BookMarked,
  HardDrive
} from 'lucide-react';

export interface CustomFeatureItem {
  id: string;
  title: string;
  category: 'Ajanlar' | 'Dava' | 'Usul' | 'Dilekce' | 'Mevzuat' | 'Sistem';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  pageTarget: string; // 'workspace_full', 'petitions', 'dava_simulasyonu', 'forensic', 'analyzer', 'legislation', 'apk_download', 'buro_yonetimi'
  tabTarget?: string; // inside LawyerWorkspace or AjanKonseyiOdasi
}

export const OZELLESTIR_FEATURES: CustomFeatureItem[] = [
  // ── YENİ 4 ÖZEL AJAN ──────────────────────────────────────────
  {
    id: 'agent_usul_sure',
    title: '1. Usul & Süre Ajanı',
    category: 'Ajanlar',
    description: 'HMK Yetki, Görev & Arabuluculuk',
    icon: Timer,
    badge: 'ÖZEL AJAN',
    pageTarget: 'workspace_full',
    tabTarget: 'usul35'
  },
  {
    id: 'agent_yargitay_emsal',
    title: '2. Yargıtay Emsal Ajanı',
    category: 'Ajanlar',
    description: 'HGK, Daire & BAM İlke Kararları',
    icon: Scale,
    badge: 'ÖZEL AJAN',
    pageTarget: 'workspace_full',
    tabTarget: 'emsal'
  },
  {
    id: 'agent_seytanin_avukati',
    title: '3. Şeytanın Avukatı',
    category: 'Ajanlar',
    description: 'Karşı Savunma & Zayıf Halkalar',
    icon: Swords,
    badge: 'ÖZEL AJAN',
    pageTarget: 'workspace_full',
    tabTarget: 'devil'
  },
  {
    id: 'agent_dilekce_mimari',
    title: '4. Dilekçe Mimarı',
    category: 'Ajanlar',
    description: 'UYAP Netice-i Talep & Tensip',
    icon: FileText,
    badge: 'ÖZEL AJAN',
    pageTarget: 'petitions',
    tabTarget: 'petition'
  },

  // ── DAVA & ANALİZ MODÜLLERİ ───────────────────────────────────
  {
    id: 'portal',
    title: 'Müvekkil & Dava Portalı',
    category: 'Dava',
    description: 'Müvekkil kayıtları, aktif dava ve evrak yönetimi',
    icon: Users,
    pageTarget: 'workspace_full',
    tabTarget: 'portal'
  },
  {
    id: 'arsiv',
    title: 'Arşiv',
    category: 'Dava',
    description: 'Sonuçlanan ve arşivlenen geçmiş dava dosyaları',
    icon: Archive,
    pageTarget: 'workspace_full',
    tabTarget: 'arsiv'
  },
  {
    id: 'council',
    title: 'Baş Müşavir & Ajan Konseyi',
    category: 'Dava',
    description: 'Çoklu model orkestrasyonu ve konsültasyon odası',
    icon: Brain,
    badge: 'Müşavir',
    pageTarget: 'workspace_full',
    tabTarget: 'council'
  },
  {
    id: 'deep_analysis',
    title: 'Dava Derin Analiz',
    category: 'Dava',
    description: 'Çok katmanlı yapay zeka derin dava incelemesi',
    icon: FlaskConical,
    pageTarget: 'analyzer'
  },
  {
    id: 'analytics',
    title: 'Case Analytics',
    category: 'Dava',
    description: 'Kazanma ihtimali, süre riskleri ve dava metrikleri',
    icon: BarChart3,
    pageTarget: 'buro_yonetimi'
  },
  {
    id: 'dava_lab',
    title: 'Dava Analiz Laboratuvarı',
    category: 'Dava',
    description: 'Dosya vakıaları, delil sınıflandırma ve hukuki nitelendirme',
    icon: FlaskConical,
    pageTarget: 'workspace_full',
    tabTarget: 'analysis'
  },
  {
    id: 'briefing',
    title: 'Stratejik Dava Brifingi',
    category: 'Dava',
    description: 'Dava dosyasının 5 maddelik stratejik eylem planı',
    icon: Compass,
    pageTarget: 'workspace_full',
    tabTarget: 'briefing'
  },
  {
    id: 'devil',
    title: 'Harp Odası & Karşı Savunma',
    category: 'Dava',
    description: 'Hakim ve karşı taraf perspektifinden zayıf noktalar',
    icon: Swords,
    badge: 'Harp Odası',
    pageTarget: 'workspace_full',
    tabTarget: 'devil'
  },

  // ── USUL, DELİL & SÜRE MODÜLLERİ ─────────────────────────────
  {
    id: 'forensic',
    title: 'Adli Hakikat & Cımbız Ajanı',
    category: 'Usul',
    description: 'TCK 272 yalan tanıklık, çelişki ve sahte delil dedektörü',
    icon: Crosshair,
    badge: 'Cımbız',
    pageTarget: 'forensic'
  },
  {
    id: 'faiz',
    title: 'Zamanaşımı & Faiz',
    category: 'Usul',
    description: 'TBK 146/147 zamanaşımı, yasal, avans ve temerrüt faizi',
    icon: Timer,
    pageTarget: 'workspace_full',
    tabTarget: 'temporal'
  },
  {
    id: 'timeline',
    title: 'Dava Zaman Çizelgesi & Takvim',
    category: 'Usul',
    description: 'Celseler, ara kararlar, tebligatlar ve kesin süreler',
    icon: Calendar,
    pageTarget: 'workspace_full',
    tabTarget: 'timeline'
  },
  {
    id: 'usul35',
    title: '35 Noktalı Usul Denetimi',
    category: 'Usul',
    description: 'HMK 114/115 dava şartları ve HMK 116 ilk itirazlar süzgeci',
    icon: ClipboardCheck,
    pageTarget: 'workspace_full',
    tabTarget: 'usul35'
  },
  {
    id: 'bilirkisi',
    title: 'Bilirkişi İtiraz Lab (HMK 281)',
    category: 'Usul',
    description: 'HMK 266 yetki aşımı, hesap çelişkisi ve itiraz layihası',
    icon: SearchCheck,
    pageTarget: 'workspace_full',
    tabTarget: 'bilirkisi'
  },

  // ── DİLEKÇE, DURUŞMA & ADLİ KAYIT ────────────────────────────
  {
    id: 'durusma',
    title: 'Duruşma Stratejisi',
    category: 'Dilekce',
    description: 'Tanık çapraz sorgu taktikleri ve zapta geçirme şerhleri',
    icon: Gavel,
    pageTarget: 'workspace_full',
    tabTarget: 'durusma'
  },
  {
    id: 'audio',
    title: 'Adli Sesli Dikte & Duruşma Zaptı',
    category: 'Dilekce',
    description: 'Duruşma zaptı diktesi ve ses kaydı transkripsiyonu',
    icon: Mic,
    pageTarget: 'workspace_full',
    tabTarget: 'audio'
  },
  {
    id: 'petitions',
    title: 'UYAP Dilekçe Lab',
    category: 'Dilekce',
    description: 'Kanun maddeleri ve içtihatlarla tahkim edilmiş UYAP taslağı',
    icon: ScrollText,
    badge: 'UYAP',
    pageTarget: 'petitions'
  },
  {
    id: 'ocr',
    title: 'Adli Belge (OCR)',
    category: 'Dilekce',
    description: 'Taranmış adli evrak, müzekkere ve el yazısı okuyucu',
    icon: Camera,
    pageTarget: 'workspace_full',
    tabTarget: 'ocr'
  },

  // ── MEVZUAT & İÇTİHAT ─────────────────────────────────────────
  {
    id: 'emsal',
    title: 'Emsal Karar',
    category: 'Mevzuat',
    description: 'Yargıtay ve Danıştay içtihat arama ve sınıflandırma',
    icon: Scale,
    pageTarget: 'workspace_full',
    tabTarget: 'emsal'
  },
  {
    id: 'denetleme',
    title: 'Denetleme Paneli',
    category: 'Mevzuat',
    description: 'Zorunlu pozitif hukuk dayanağı ve mevzuat doğrulama',
    icon: Layers,
    pageTarget: 'workspace_full',
    tabTarget: 'denetleme'
  },
  {
    id: 'capraz_dogrulama',
    title: 'Mevzuat Çapraz Doğrulama',
    category: 'Mevzuat',
    description: 'Yürürlük tarihi ve mülga kanun halüsinasyon filtresi',
    icon: BookMarked,
    pageTarget: 'workspace_full',
    tabTarget: 'capraz_dogrulama'
  },
  {
    id: 'legislation',
    title: 'Mevzuat Sorgulama',
    category: 'Mevzuat',
    description: 'TBK, HMK, TTK, TMK, İİK ve Resmi Gazete kanun dizini',
    icon: BookOpen,
    pageTarget: 'legislation',
    tabTarget: 'mevzuat'
  },
  {
    id: 'sozluk',
    title: 'Hukuk Terimleri Sözlüğü',
    category: 'Mevzuat',
    description: 'Osmanlıca ve Latince adli terimler sözlüğü',
    icon: BookOpen,
    pageTarget: 'legislation',
    tabTarget: 'sozluk'
  },

  // ── SİSTEM & MOBİL ───────────────────────────────────────────
  {
    id: 'apk',
    title: 'Kişisel Mobil APK',
    category: 'Sistem',
    description: 'Kişiye özel Android APK indirme ve tek cihaz kilidi',
    icon: Smartphone,
    pageTarget: 'apk_download'
  },
  {
    id: 'git_sync',
    title: 'Seçmeli Özellikler & Git',
    category: 'Sistem',
    description: 'GitHub senkronizasyonu ve mimari özellik yönetimi',
    icon: GitBranch,
    pageTarget: 'workspace_full',
    tabTarget: 'git'
  },
  {
    id: 'raporlarim_belgelerim',
    title: 'Raporlarım & Belgelerim',
    category: 'Sistem',
    description: 'Google Drive Zero-Knowledge UDF ve PDF evrak arşivi',
    icon: HardDrive,
    badge: 'DRIVE BULUT',
    pageTarget: 'raporlarim'
  }
];

interface OzellestirDropdownProps {
  onSelectFeature: (feature: CustomFeatureItem) => void;
  pinnedFeatureIds: string[];
  onTogglePin: (featureId: string) => void;
  activeFeatureId?: string;
}

export function OzellestirDropdown({
  onSelectFeature,
  pinnedFeatureIds,
  onTogglePin,
  activeFeatureId
}: OzellestirDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFeatures = OZELLESTIR_FEATURES.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Hepsi' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Özelleştir Butonu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 text-xs font-bold border cursor-pointer ${
          isOpen
            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600 shadow-md shadow-amber-500/20'
            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:border-amber-500/50 shadow-xs'
        }`}
        title="Uygulama Modüllerini, Özel Ajanları ve Çalışma Ekranlarını Özelleştir"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>ÖZELLEŞTİR</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-amber-500'}`} />
      </button>

      {/* Açılır Menü (Dropdown Popover) */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[340px] sm:w-[460px] max-h-[82vh] bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Başlık & Arama Çubuğu */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#121c30]/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Özelleştirme ve Modül Portalı
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    4 Özel Ajan ve 24 Hukuk Aracı arasından seçim yapın veya sabitleyin
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {OZELLESTIR_FEATURES.length} Modül
              </span>
            </div>

            {/* Arama Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Modül veya ajan ara (örn: Usul, Şeytanın Avukatı, Bilirkişi)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Kategori Filtreleri */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 text-[10px] no-scrollbar">
              {['Hepsi', 'Ajanlar', 'Dava', 'Usul', 'Dilekce', 'Mevzuat', 'Sistem'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-slate-200/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat === 'Ajanlar' ? '🌟 Özel Ajanlar' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Modül Listesi (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredFeatures.map((item) => {
              const IconComp = item.icon;
              const isPinned = pinnedFeatureIds.includes(item.id);
              const isActive = activeFeatureId === item.id;

              return (
                <div
                  key={item.id}
                  className={`group pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'hover:bg-slate-100/80 dark:hover:bg-[#142036]/80'
                  }`}
                  onClick={() => {
                    onSelectFeature(item);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      item.badge === 'ÖZEL AJAN'
                        ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500 border border-indigo-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            item.badge === 'ÖZEL AJAN'
                              ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Sabitleme (Pin) Butonu */}
                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onTogglePin(item.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isPinned
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                      title={isPinned ? 'Üst menüden kaldır' : 'Üst navigasyon menüsüne sabitle'}
                    >
                      {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredFeatures.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Aramanızla eşleşen modül bulunamadı.
              </div>
            )}
          </div>

          {/* Alt Bilgi */}
          <div className="p-2.5 bg-slate-50 dark:bg-[#0c1220] border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>İpucu: Sağdaki iğne (<Pin className="w-2.5 h-2.5 inline" />) simgesine basarak menüye sabitleyebilirsiniz.</span>
          </div>
        </div>
      )}
    </div>
  );
}
