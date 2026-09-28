import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  X,
  RotateCcw,
  ChevronRight,
  Gavel,
  Users,
  Calendar,
  FileText,
  Brain,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSearch,
  ArrowUpDown,
  Scale,
  Archive,
  Undo2,
  Download,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Lock,
  FileDown,
  Sparkles,
  Palette,
  ChevronDown,
  Info,
  Copy,
  Check,
  PieChart as PieChartIcon,
  Trash2,
  Eye
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { ClientItem, ClientCase, archiveCase, unarchiveCase, deleteCase } from '../services/clientCaseStore';
import { LawyerUser } from './LawyerWorkspace';
import { CaseRichNotesSection } from './CaseRichNotesSection';
import { QuickCaseSummaryModal } from './QuickCaseSummaryModal';
import {
  exportCasesToCsv,
  printSecurePdfReport,
  downloadOfflineHtmlReport,
  FlattenedCaseItem
} from '../utils/secureExportService';

interface FlattenedCase {
  client: ClientItem;
  caseItem: ClientCase;
}

export type StatusTagCategory =
  | 'durusma_bekliyor'
  | 'durusma_bugun'
  | 'durusma_yakin'
  | 'durusma_tarihsiz'
  | 'karar_asamasi'
  | 'karar_cikti'
  | 'temyiz'
  | 'istinaf'
  | 'tahkikat'
  | 'on_inceleme'
  | 'tensip'
  | 'default';

export interface StatusTagPalette {
  badgeClass: string;
  dotColor: string;
  iconColor: string;
  accentBorder: string;
  textColor: string;
  glowEffect?: string;
  badgeHoverClass?: string;
}

export const STATUS_TAG_PALETTES: Record<StatusTagCategory, StatusTagPalette> = {
  // Duruşma Bekliyor: Warm Amber / Sunset Gold
  durusma_bekliyor: {
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 shadow-xs font-bold',
    dotColor: 'bg-amber-500',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accentBorder: 'border-amber-300 dark:border-amber-700/80',
    textColor: 'text-amber-900 dark:text-amber-200',
    glowEffect: 'ring-1 ring-amber-500/20'
  },
  // Duruşma Bugün: Urgent Vivid Crimson / Alert Pulse
  durusma_bugun: {
    badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-600 font-extrabold shadow-sm',
    dotColor: 'bg-rose-600',
    iconColor: 'text-rose-600 dark:text-rose-400',
    accentBorder: 'border-rose-400 dark:border-rose-600',
    textColor: 'text-rose-950 dark:text-rose-100',
    glowEffect: 'ring-2 ring-rose-500/40 animate-pulse'
  },
  // Duruşma Yakın: Alert Orange / Rust
  durusma_yakin: {
    badgeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700/80 shadow-xs font-bold',
    dotColor: 'bg-orange-500',
    iconColor: 'text-orange-600 dark:text-orange-400',
    accentBorder: 'border-orange-300 dark:border-orange-700/80',
    textColor: 'text-orange-900 dark:text-orange-200',
    glowEffect: 'ring-1 ring-orange-500/20'
  },
  // Duruşma Tarih Bekleniyor: Warm Honey
  durusma_tarihsiz: {
    badgeClass: 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-semibold',
    dotColor: 'bg-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accentBorder: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-800 dark:text-amber-300'
  },
  // Karar Aşaması: Regal Purple / Violet
  karar_asamasi: {
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700/80 shadow-xs font-bold',
    dotColor: 'bg-purple-500',
    iconColor: 'text-purple-600 dark:text-purple-400',
    accentBorder: 'border-purple-300 dark:border-purple-700/80',
    textColor: 'text-purple-900 dark:text-purple-200',
    glowEffect: 'ring-1 ring-purple-500/20'
  },
  // Karar Çıktı / Kesinleşti: Deep Forest Emerald
  karar_cikti: {
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/80 shadow-xs font-bold',
    dotColor: 'bg-emerald-500',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentBorder: 'border-emerald-300 dark:border-emerald-700/80',
    textColor: 'text-emerald-900 dark:text-emerald-200',
    glowEffect: 'ring-1 ring-emerald-500/20'
  },
  // Temyiz (Yargıtay / Danıştay): Deep Indigo / Royal Sapphire
  temyiz: {
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700/80 shadow-xs font-bold',
    dotColor: 'bg-indigo-600',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accentBorder: 'border-indigo-300 dark:border-indigo-700/80',
    textColor: 'text-indigo-900 dark:text-indigo-200',
    glowEffect: 'ring-1 ring-indigo-500/20'
  },
  // İstinaf / BAM: Electric Blue / Cobalt
  istinaf: {
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700/80 shadow-xs font-bold',
    dotColor: 'bg-blue-600',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accentBorder: 'border-blue-300 dark:border-blue-700/80',
    textColor: 'text-blue-900 dark:text-blue-200',
    glowEffect: 'ring-1 ring-blue-500/20'
  },
  // Tahkikat & Bilirkişi: Marine Cyan
  tahkikat: {
    badgeClass: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700/80 shadow-xs font-semibold',
    dotColor: 'bg-cyan-500',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    accentBorder: 'border-cyan-300 dark:border-cyan-700/80',
    textColor: 'text-cyan-900 dark:text-cyan-200'
  },
  // Ön İnceleme: Mint Teal
  on_inceleme: {
    badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700/80 shadow-xs font-semibold',
    dotColor: 'bg-teal-500',
    iconColor: 'text-teal-600 dark:text-teal-400',
    accentBorder: 'border-teal-300 dark:border-teal-700/80',
    textColor: 'text-teal-900 dark:text-teal-200'
  },
  // Tensip & Açılış: Slate Zinc
  tensip: {
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-xs font-semibold',
    dotColor: 'bg-slate-400',
    iconColor: 'text-slate-600 dark:text-slate-400',
    accentBorder: 'border-slate-300 dark:border-slate-700',
    textColor: 'text-slate-800 dark:text-slate-200'
  },
  default: {
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-xs font-medium',
    dotColor: 'bg-slate-400',
    iconColor: 'text-slate-500',
    accentBorder: 'border-slate-300 dark:border-slate-700',
    textColor: 'text-slate-800 dark:text-slate-200'
  }
};

export function getStatusTagPalette(category: StatusTagCategory): StatusTagPalette {
  return STATUS_TAG_PALETTES[category] || STATUS_TAG_PALETTES.default;
}

export interface StatusLegendItem {
  id: string;
  category: StatusTagCategory;
  title: string;
  badgeLabel: string;
  badgeDetail: string;
  colorName: string;
  icon: React.ReactNode;
  description: string;
  targetTagFilter?: 'durusma' | 'karar' | 'temyiz' | 'tahkikat' | 'on_inceleme';
}

export const STATUS_LEGEND_ITEMS: StatusLegendItem[] = [
  {
    id: 'legend-durusma-bekliyor',
    category: 'durusma_bekliyor',
    title: 'Duruşma Bekliyor',
    badgeLabel: 'Duruşma Bekliyor',
    badgeDetail: '14.10.2026',
    colorName: 'Kehribar Altını (Amber)',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
    description: 'İleri tarihte duruşma celsesi tayin edilmiş veya duruşma günü tensip bekleyen derdest davalar.',
    targetTagFilter: 'durusma'
  },
  {
    id: 'legend-durusma-bugun',
    category: 'durusma_bugun',
    title: 'Duruşma Bugün!',
    badgeLabel: 'Duruşma Bekliyor',
    badgeDetail: 'BUGÜN!',
    colorName: 'Kırmızı Nabız (Urgent Crimson)',
    icon: <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
    description: 'Celsesi bugün görülecek, ivedi katılım gerektiren yüksek öncelikli duruşmalar (nabız animasyonlu).',
    targetTagFilter: 'durusma'
  },
  {
    id: 'legend-durusma-yakin',
    category: 'durusma_yakin',
    title: 'Duruşma Yakın',
    badgeLabel: 'Duruşma Bekliyor',
    badgeDetail: '3 gün kaldı',
    colorName: 'Kavruk Turuncu (Rust Orange)',
    icon: <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />,
    description: 'Önümüzdeki 7 gün veya daha az süresi kalmış yaklaşan duruşma celseleri.',
    targetTagFilter: 'durusma'
  },
  {
    id: 'legend-karar-asamasi',
    category: 'karar_asamasi',
    title: 'Karar Aşaması',
    badgeLabel: 'Karar Aşaması',
    badgeDetail: 'Sözlü Yargılama',
    colorName: 'Kraliyet Moru (Regal Violet)',
    icon: <Gavel className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />,
    description: 'Tahkikat safhası bitmiş, sözlü yargılama ve nihai hüküm / karar tesis aşamasındaki dosyalar.',
    targetTagFilter: 'karar'
  },
  {
    id: 'legend-karar-cikti',
    category: 'karar_cikti',
    title: 'Karara Çıktı / Kesinleşti',
    badgeLabel: 'Karara Çıktı',
    badgeDetail: 'Hüküm Kesinleşti',
    colorName: 'Zümrüt Yeşili (Deep Emerald)',
    icon: <Gavel className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    description: 'Mahkemece hükmü verilmiş veya kesinleşme şerhi düşülerek sonuçlanmış davalar.',
    targetTagFilter: 'karar'
  },
  {
    id: 'legend-temyiz',
    category: 'temyiz',
    title: 'Temyiz İncelemesi',
    badgeLabel: 'Temyiz',
    badgeDetail: 'Yargıtay İncelemesi',
    colorName: 'Kraliyet Çiviti (Deep Indigo)',
    icon: <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
    description: 'Yargıtay veya Danıştay kanun yolu incelemesi aşamasında bulunan temyiz dosyaları.',
    targetTagFilter: 'temyiz'
  },
  {
    id: 'legend-istinaf',
    category: 'istinaf',
    title: 'İstinaf İncelemesi',
    badgeLabel: 'İstinaf / BAM',
    badgeDetail: 'BAM İncelemesi',
    colorName: 'Kobalt Mavisi (Electric Blue)',
    icon: <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />,
    description: 'Bölge Adliye Mahkemesi (BAM) ilgili hukuk/ceza dairesi nezdinde istinaf incelemesinde olan davalar.',
    targetTagFilter: 'temyiz'
  },
  {
    id: 'legend-tahkikat',
    category: 'tahkikat',
    title: 'Tahkikat & Bilirkişi',
    badgeLabel: 'Tahkikat & Bilirkişi',
    badgeDetail: 'Delil & Rapor',
    colorName: 'Deniz Camgöbeği (Marine Cyan)',
    icon: <FileSearch className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />,
    description: 'Delillerin toplandığı, bilirkişi raporu, keşif ve tanık incelemesinin yapıldığı safha.'
  },
  {
    id: 'legend-on-inceleme',
    category: 'on_inceleme',
    title: 'Ön İnceleme',
    badgeLabel: 'Ön İnceleme',
    badgeDetail: 'Dava Şartları',
    colorName: 'Nane Yeşili (Mint Teal)',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />,
    description: 'HMK m.137 uyarınca ilk itirazlar, dava şartları ve tarafların sulhe teşvik edildiği safha.'
  },
  {
    id: 'legend-tensip',
    category: 'tensip',
    title: 'Tensip & Açılış',
    badgeLabel: 'Tensip & Açılış',
    badgeDetail: 'Dilekçeler Teatisi',
    colorName: 'Çinko Antrasit (Slate Zinc)',
    icon: <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />,
    description: 'Tensip zaptının hazırlandığı ve dava dilekçesi tebliği ile cevap layihalarının sunulduğu başlangıç safhası.'
  }
];

export interface VisualStatusTag {
  id: string;
  category: StatusTagCategory;
  label: string;
  detail?: string;
  fileCount: number;
  palette: StatusTagPalette;
  badgeClass: string;
  dotColor: string;
  pulsing?: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

export function getCaseVisualStatusTags(caseItem: ClientCase): VisualStatusTag[] {
  const tags: VisualStatusTag[] = [];
  const courtLower = (caseItem.court || '').toLowerCase();
  const subjectLower = (caseItem.subject || '').toLowerCase();
  const stageLower = (caseItem.stage || '').toLowerCase();
  const fileCount = (caseItem.files || []).length;

  // 1. Temyiz / İstinaf Tag ('Temyiz' vs 'İstinaf')
  const isTemyiz =
    courtLower.includes('yargıtay') ||
    courtLower.includes('danıştay') ||
    subjectLower.includes('temyiz') ||
    stageLower.includes('temyiz');
  const isIstinaf =
    courtLower.includes('bölge adliye') ||
    courtLower.includes('istinaf') ||
    courtLower.includes('bam');
  const isAppellate = caseItem.stage === 'İstinaf / Temyiz' || isTemyiz || isIstinaf;

  if (isAppellate) {
    const category: StatusTagCategory = isTemyiz ? 'temyiz' : isIstinaf ? 'istinaf' : 'temyiz';
    const palette = getStatusTagPalette(category);
    const label = isTemyiz ? 'Temyiz' : isIstinaf ? 'İstinaf / Temyiz' : 'Temyiz';
    const detail = isTemyiz ? 'Yargıtay İncelemesi' : isIstinaf ? 'BAM İncelemesi' : 'Kanun Yolu';
    tags.push({
      id: 'tag-temyiz',
      category,
      label,
      detail,
      fileCount,
      palette,
      icon: <Scale className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />,
      badgeClass: palette.badgeClass,
      dotColor: palette.dotColor,
      tooltip: 'Dosya istinaf / temyiz kanun yolu incelemesi aşamasındadır'
    });
  }

  // 2. Karar Aşaması Tag ('Karar Aşaması', 'Karara Çıktı')
  const isClosed = caseItem.status === 'Closed';
  const isKarar =
    caseItem.stage === 'Sözlü Yargılama' ||
    isClosed ||
    stageLower.includes('karar') ||
    subjectLower.includes('karar');
  if (isKarar) {
    const category: StatusTagCategory = isClosed ? 'karar_cikti' : 'karar_asamasi';
    const palette = getStatusTagPalette(category);
    tags.push({
      id: 'tag-karar',
      category,
      label: isClosed ? 'Karara Çıktı' : 'Karar Aşaması',
      detail: isClosed ? 'Hüküm Kesinleşti' : 'Sözlü Yargılama & Hüküm',
      fileCount,
      palette,
      icon: <Gavel className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />,
      badgeClass: palette.badgeClass,
      dotColor: palette.dotColor,
      tooltip: isClosed
        ? 'Dava karara bağlanmış ve kesinleşmiştir'
        : 'Dava sözlü yargılama ve nihai hüküm / karar aşamasındadır'
    });
  }

  // 3. Duruşma Bekliyor Tag ('Duruşma Bekliyor')
  if (caseItem.nextHearingDate) {
    const today = new Date(2026, 8, 25);
    today.setHours(0, 0, 0, 0);
    const target = new Date(caseItem.nextHearingDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let detail = '';
    let category: StatusTagCategory = 'durusma_bekliyor';
    let pulsing = false;

    if (diff < 0) {
      detail = `${Math.abs(diff)} gün önce`;
      category = 'default';
    } else if (diff === 0) {
      detail = 'BUGÜN!';
      category = 'durusma_bugun';
      pulsing = true;
    } else if (diff <= 7) {
      detail = `${diff} gün kaldı`;
      category = 'durusma_yakin';
      pulsing = true;
    } else {
      detail = `${caseItem.nextHearingDate} (${diff} gün)`;
      category = 'durusma_bekliyor';
      pulsing = false;
    }

    const palette = getStatusTagPalette(category);

    tags.push({
      id: 'tag-durusma-bekliyor',
      category,
      label: 'Duruşma Bekliyor',
      detail,
      fileCount,
      palette,
      icon: <Clock className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />,
      badgeClass: palette.badgeClass,
      dotColor: palette.dotColor,
      pulsing,
      tooltip: `Sonraki duruşma celsesi: ${caseItem.nextHearingDate} (${detail})`
    });
  } else if (caseItem.status === 'Open' && !isKarar) {
    const category: StatusTagCategory = 'durusma_tarihsiz';
    const palette = getStatusTagPalette(category);
    tags.push({
      id: 'tag-durusma-bekliyor',
      category,
      label: 'Duruşma Bekliyor',
      detail: 'Tarih Bekleniyor',
      fileCount,
      palette,
      icon: <Clock className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />,
      badgeClass: palette.badgeClass,
      dotColor: palette.dotColor,
      pulsing: false,
      tooltip: 'Yeni celse duruşma günü tensip/ara karar ile belirlenecektir'
    });
  }

  // 4. Procedural Stages (Tahkikat & Bilirkişi, Ön İnceleme, Tensip)
  if (caseItem.stage === 'Tahkikat & Bilirkişi' && !isKarar) {
    const category: StatusTagCategory = 'tahkikat';
    const palette = getStatusTagPalette(category);
    tags.push({
      id: 'tag-tahkikat',
      category,
      label: 'Tahkikat & Bilirkişi',
      detail: 'Delil & Rapor',
      fileCount,
      palette,
      icon: <FileSearch className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />,
      badgeClass: palette.badgeClass,
      dotColor: palette.dotColor,
      tooltip: 'Tahkikat safhası: Deliller toplanmakta ve bilirkişi incelemesi yürütülmektedir'
    });
  } else if (caseItem.stage === 'Ön İnceleme' && !isKarar) {
    const category: StatusTagCategory = 'on_inceleme';
    const palette = getStatusTagPalette(category);
    tags.push({
      id: 'tag-on-inceleme',
      category,
      label: 'Ön İnceleme',
      detail: 'Dava Şartları',
      fileCount,
      palette,
      icon: <CheckCircle2 className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />,
      badgeClass: palette.badgeClass,
      dotColor: palette.dotColor,
      tooltip: 'Ön inceleme safhası: İlk itirazlar, sulhe davet ve uyuşmazlık konuları tespiti'
    });
  } else if (caseItem.stage === 'Dava Açılışı & Tensip' && !isKarar) {
    const category: StatusTagCategory = 'tensip';
    const palette = getStatusTagPalette(category);
    tags.push({
      id: 'tag-tensip',
      category,
      label: 'Tensip & Açılış',
      detail: 'Dilekçeler Teatisi',
      fileCount,
      palette,
      icon: <FileText className={`w-3.5 h-3.5 ${palette.iconColor} shrink-0`} />,
      badgeClass: palette.badgeClass,
      dotColor: palette.dotColor,
      tooltip: 'Tensip zaptı tanzimi, dava dilekçesi tebliği ve cevap süreci'
    });
  }

  return tags;
}

interface LawyerCaseListSectionProps {
  lawyer: LawyerUser;
  clients: ClientItem[];
  onOpenCase: (clientId: string, caseId: string) => void;
  onOpenAllCases: () => void;
  onNavigateToAnalyzer: (caseNumber?: string) => void;
  onNavigateToPetition: (caseNumber?: string, subject?: string) => void;
  onNavigateToArchived?: () => void;
}

type StatusFilter = 'ALL' | 'Open' | 'Pending' | 'Closed';
type TagFilter = 'ALL' | 'durusma' | 'karar' | 'temyiz' | 'tahkikat' | 'on_inceleme';
export type SortOption =
  | 'default'
  | 'date_created_desc'
  | 'date_created_asc'
  | 'last_updated_desc'
  | 'last_updated_asc'
  | 'case_number_asc'
  | 'case_number_desc'
  | 'hearing_asc'
  | 'case_desc'
  | 'client_asc';

export function getCaseCreatedTimestamp(caseItem: ClientCase): number {
  if (caseItem.openedDate) {
    const t = new Date(caseItem.openedDate).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

export function getCaseLastUpdatedTimestamp(caseItem: ClientCase): number {
  if (caseItem.updatedAt) {
    const t = new Date(caseItem.updatedAt).getTime();
    if (!isNaN(t)) return t;
  }
  let latestTime = getCaseCreatedTimestamp(caseItem);
  (caseItem.files || []).forEach((f) => {
    if (f.uploadedAt) {
      let fTime = 0;
      if (f.uploadedAt.includes('.')) {
        const parts = f.uploadedAt.split('.');
        if (parts.length === 3) {
          fTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
        }
      } else {
        fTime = new Date(f.uploadedAt).getTime();
      }
      if (!isNaN(fTime) && fTime > latestTime) {
        latestTime = fTime;
      }
    }
  });
  return latestTime;
}

export function LawyerCaseListSection({
  lawyer,
  clients,
  onOpenCase,
  onOpenAllCases,
  onNavigateToAnalyzer,
  onNavigateToPetition,
  onNavigateToArchived
}: LawyerCaseListSectionProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [courtTypeFilter, setCourtTypeFilter] = useState<string>('ALL');
  const [selectedCourt, setSelectedCourt] = useState<string>('ALL');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [tagFilter, setTagFilter] = useState<TagFilter>('ALL');
  const [hasHearingOnly, setHasHearingOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Archive Case Modal State
  const [archiveModalData, setArchiveModalData] = useState<{
    clientId: string;
    clientName: string;
    caseItem: ClientCase;
  } | null>(null);
  const [archiveReasonInput, setArchiveReasonInput] = useState<string>('Karar Kesinleşti / İcra Edildi');
  const [archiveCustomReason, setArchiveCustomReason] = useState<string>('');
  const [archiveToast, setArchiveToast] = useState<{
    caseNumber: string;
    clientId: string;
    caseId: string;
  } | null>(null);

  // Permanent Delete Case Modal State
  const [deleteModalData, setDeleteModalData] = useState<{
    clientId: string;
    clientName: string;
    caseItem: ClientCase;
  } | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [deleteToast, setDeleteToast] = useState<{
    caseNumber: string;
    clientName: string;
  } | null>(null);

  // Secure Export Modal State (100% local processing, zero network transmission)
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'html'>('csv');
  const [includeContactDetails, setIncludeContactDetails] = useState<boolean>(true);
  const [includeFinancialValues, setIncludeFinancialValues] = useState<boolean>(true);
  const [includeEvidenceCount, setIncludeEvidenceCount] = useState<boolean>(true);
  const [includePrivacySeal, setIncludePrivacySeal] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<{
    message: string;
    format: string;
    count: number;
  } | null>(null);

  // Copied Case Info Notification State
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<{
    caseNumber: string;
    clientName: string;
    statusText: string;
  } | null>(null);

  // Hover-triggered Case Number Preview State
  const [hoveredCasePreviewId, setHoveredCasePreviewId] = useState<string | null>(null);

  // Search input focus and suggestions dropdown state
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [showAllSuggestionsModal, setShowAllSuggestionsModal] = useState<boolean>(false);
  const [suggestionsModalTab, setSuggestionsModalTab] = useState<'all' | 'cases' | 'clients' | 'courts' | 'courtTypes' | 'tags' | 'opponents' | 'files'>('all');
  const [suggestionsModalSearch, setSuggestionsModalSearch] = useState<string>('');

  // Handler to copy case number, client name, and status to clipboard
  const handleCopyCaseInfo = (e: React.MouseEvent, caseItem: ClientCase, client: ClientItem) => {
    e.stopPropagation();

    const statusText =
      caseItem.status === 'Open'
        ? 'Derdest'
        : caseItem.status === 'Pending'
        ? 'Beklemede'
        : 'Kapalı';

    const textToCopy = `Esas No: ${caseItem.caseNumber} | Müvekkil: ${client.fullName} | Durum: ${statusText}`;

    // Modern clipboard API with reliable fallback
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopiedCaseId(caseItem.id);
    setCopyToast({
      caseNumber: caseItem.caseNumber,
      clientName: client.fullName,
      statusText
    });

    setTimeout(() => {
      setCopiedCaseId((curr) => (curr === caseItem.id ? null : curr));
    }, 2500);

    setTimeout(() => {
      setCopyToast(null);
    }, 3500);
  };

  // Expanded Rich-Text Notes Case ID
  const [expandedNotesCaseId, setExpandedNotesCaseId] = useState<string | null>(null);

  // Quick Case Summary Modal State (LLM-generated entire case history & active status)
  const [quickSummaryModalData, setQuickSummaryModalData] = useState<{
    client: ClientItem;
    caseItem: ClientCase;
  } | null>(null);

  // Status Tag Color Coding Legend / Key state
  const [showStatusLegend, setShowStatusLegend] = useState(false);

  // Flatten active (non-archived) cases for dashboard view
  const allCases = useMemo<FlattenedCase[]>(() => {
    const list: FlattenedCase[] = [];
    clients.forEach((c) => {
      (c.cases || []).forEach((cs) => {
        if (!cs.isArchived) {
          list.push({ client: c, caseItem: cs });
        }
      });
    });
    return list;
  }, [clients]);

  // Count total archived cases across all clients for this lawyer
  const archivedCasesCount = useMemo(() => {
    let count = 0;
    clients.forEach((c) => {
      (c.cases || []).forEach((cs) => {
        if (cs.isArchived) count++;
      });
    });
    return count;
  }, [clients]);

  const handleConfirmArchive = () => {
    if (!archiveModalData) return;
    const finalReason =
      archiveReasonInput === 'Diğer (Özel Açıklama)' && archiveCustomReason.trim()
        ? archiveCustomReason.trim()
        : archiveReasonInput;

    const ok = archiveCase(archiveModalData.clientId, archiveModalData.caseItem.id, finalReason);
    if (ok) {
      const archivedCaseNumber = archiveModalData.caseItem.caseNumber;
      const cid = archiveModalData.clientId;
      const csid = archiveModalData.caseItem.id;
      setArchiveModalData(null);
      setArchiveToast({ caseNumber: archivedCaseNumber, clientId: cid, caseId: csid });
      setTimeout(() => {
        setArchiveToast(null);
      }, 6000);
    }
  };

  const handleUndoArchive = (clientId: string, caseId: string) => {
    unarchiveCase(clientId, caseId);
    setArchiveToast(null);
  };

  // Permanently remove case from portfolio after user confirmation
  const handleConfirmPermanentDelete = () => {
    if (!deleteModalData) return;
    const { clientId, clientName, caseItem } = deleteModalData;
    const cNumber = caseItem.caseNumber;

    deleteCase(clientId, caseItem.id);

    setDeleteModalData(null);
    setDeleteConfirmationText('');
    setDeleteToast({
      caseNumber: cNumber,
      clientName
    });

    setTimeout(() => {
      setDeleteToast(null);
    }, 5000);
  };

  // Distinct Courts from existing cases
  const availableCourts = useMemo(() => {
    const courtsSet = new Set<string>();
    allCases.forEach(({ caseItem }) => {
      if (caseItem.court && caseItem.court.trim()) {
        courtsSet.add(caseItem.court.trim());
      }
    });
    return Array.from(courtsSet).sort();
  }, [allCases]);

  // Distinct Court Types for fast real-time categorization
  const availableCourtTypes = useMemo(() => {
    const set = new Set<string>();
    allCases.forEach(({ caseItem }) => {
      const c = (caseItem.court || '').trim();
      if (!c) return;
      if (c.includes('Ticaret')) set.add('Asliye Ticaret');
      else if (c.includes('İş')) set.add('İş Mahkemesi');
      else if (c.includes('İcra')) set.add('İcra Mahkemesi');
      else if (c.includes('Asliye Hukuk')) set.add('Asliye Hukuk');
      else if (c.includes('Sulh Hukuk')) set.add('Sulh Hukuk');
      else if (c.includes('Aile')) set.add('Aile Mahkemesi');
      else if (c.includes('Tüketici')) set.add('Tüketici Mahkemesi');
      else if (c.includes('Fikri')) set.add('Fikri ve Sınai Haklar');
      else if (c.includes('Ceza')) set.add('Ceza Mahkemesi');
      else set.add(c);
    });
    return Array.from(set).sort();
  }, [allCases]);

  // Real-time breakdown of matches as lawyer types
  const queryMatchSummary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    let matchCase = 0;
    let matchClient = 0;
    let matchCourt = 0;
    allCases.forEach(({ client, caseItem }) => {
      if (caseItem.caseNumber.toLowerCase().includes(q)) matchCase++;
      if (client.fullName.toLowerCase().includes(q)) matchClient++;
      if (caseItem.court.toLowerCase().includes(q)) matchCourt++;
    });
    return { matchCase, matchClient, matchCourt };
  }, [allCases, searchQuery]);

  // Distinct Clients
  const availableClients = useMemo(() => {
    return clients.map((c) => ({ id: c.id, name: c.fullName })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [clients]);

  // Count cases per visual status tag
  const tagCounts = useMemo(() => {
    let durusma = 0;
    let karar = 0;
    let temyiz = 0;
    let tahkikat = 0;
    let onInceleme = 0;

    allCases.forEach(({ caseItem }) => {
      const tags = getCaseVisualStatusTags(caseItem);
      if (tags.some((t) => t.id === 'tag-durusma-bekliyor')) durusma++;
      if (tags.some((t) => t.id === 'tag-karar')) karar++;
      if (tags.some((t) => t.id === 'tag-temyiz')) temyiz++;
      if (tags.some((t) => t.id === 'tag-tahkikat')) tahkikat++;
      if (tags.some((t) => t.id === 'tag-on-inceleme')) onInceleme++;
    });

    return { durusma, karar, temyiz, tahkikat, onInceleme };
  }, [allCases]);

  // Comprehensive Smart Suggestions for the Lawyer Case Portfolio
  const allPortfolioSuggestions = useMemo(() => {
    // 1. Dava Numaraları ve Konuları
    const caseSuggestions = allCases.map(({ caseItem, client }) => ({
      id: `case-${caseItem.id}`,
      type: 'case' as const,
      label: caseItem.caseNumber,
      secondary: `${client.fullName} • ${caseItem.court}`,
      categoryBadge: 'Esas No',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      action: () => {
        setSearchQuery(caseItem.caseNumber);
        setIsSearchFocused(false);
      }
    }));

    // 2. Müvekkiller
    const clientSuggestions = availableClients.map((cli) => {
      const clientCasesCount = allCases.filter((c) => c.client.id === cli.id).length;
      return {
        id: `client-${cli.id}`,
        type: 'client' as const,
        label: cli.name,
        secondary: `${clientCasesCount} aktif/bağlı dava dosyası`,
        categoryBadge: 'Müvekkil',
        badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
        action: () => {
          setSelectedClient(cli.id);
          setSearchQuery(cli.name);
          setIsSearchFocused(false);
        }
      };
    });

    // 3. Mahkemeler & Mahkeme Türleri
    const courtSuggestions = availableCourts.map((court) => {
      const courtCasesCount = allCases.filter((c) => c.caseItem.court === court).length;
      return {
        id: `court-${court}`,
        type: 'court' as const,
        label: court,
        secondary: `${courtCasesCount} dosya görülüyor`,
        categoryBadge: 'Mahkeme',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        action: () => {
          setSelectedCourt(court);
          setSearchQuery(court);
          setIsSearchFocused(false);
        }
      };
    });

    // 4. Mahkeme Türleri
    const courtTypeSuggestions = availableCourtTypes.map((ctype) => {
      const count = allCases.filter((c) => c.caseItem.court.toLowerCase().includes(ctype.toLowerCase())).length;
      return {
        id: `court-type-${ctype}`,
        type: 'court_type' as const,
        label: ctype,
        secondary: `${count} adet dava`,
        categoryBadge: 'Mahkeme Türü',
        badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
        action: () => {
          setCourtTypeFilter(ctype);
          setIsSearchFocused(false);
        }
      };
    });

    // 5. Durum & Safahat Etiketleri (Tüm Yargılama Aşamaları)
    const tagSuggestions = [
      {
        id: 'tag-sug-durusma',
        type: 'tag' as const,
        label: 'Duruşma Bekleyen Davalar',
        secondary: `${tagCounts.durusma} dosya duruşma takviminde`,
        categoryBadge: 'Duruşma',
        badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30',
        action: () => {
          setTagFilter('durusma');
          setIsSearchFocused(false);
        }
      },
      {
        id: 'tag-sug-karar',
        type: 'tag' as const,
        label: 'Karar Aşamasındaki Davalar',
        secondary: `${tagCounts.karar} dosya hüküm / tefhim aşamasında`,
        categoryBadge: 'Karar',
        badgeClass: 'bg-purple-500/15 text-purple-800 dark:text-purple-200 border-purple-500/30',
        action: () => {
          setTagFilter('karar');
          setIsSearchFocused(false);
        }
      },
      {
        id: 'tag-sug-temyiz',
        type: 'tag' as const,
        label: 'Temyiz / İstinaf Dosyaları',
        secondary: `${tagCounts.temyiz} dosya üst mahkemede (Yargıtay/BAM)`,
        categoryBadge: 'Temyiz',
        badgeClass: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 border-indigo-500/30',
        action: () => {
          setTagFilter('temyiz');
          setIsSearchFocused(false);
        }
      },
      {
        id: 'tag-sug-tahkikat',
        type: 'tag' as const,
        label: 'Tahkikat & Bilirkişi İncelemesi',
        secondary: `${tagCounts.tahkikat} dosya delil toplama ve rapor aşamasında`,
        categoryBadge: 'Tahkikat',
        badgeClass: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border-cyan-500/30',
        action: () => {
          setSearchQuery('Tahkikat');
          setIsSearchFocused(false);
        }
      },
      {
        id: 'tag-sug-on-inceleme',
        type: 'tag' as const,
        label: 'Ön İnceleme Aşaması',
        secondary: `${tagCounts.onInceleme} dosya tensip ve ilk duruşma hazırlığında`,
        categoryBadge: 'Ön İnceleme',
        badgeClass: 'bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/30',
        action: () => {
          setSearchQuery('Ön İnceleme');
          setIsSearchFocused(false);
        }
      }
    ];

    // 6. Karşı Taraf (Opponents) Önerileri
    const opponentSet = new Map<string, number>();
    allCases.forEach(({ caseItem }) => {
      if (caseItem.opponentName && caseItem.opponentName !== 'Belirtilmedi') {
        opponentSet.set(caseItem.opponentName, (opponentSet.get(caseItem.opponentName) || 0) + 1);
      }
    });
    const opponentSuggestions = Array.from(opponentSet.entries()).map(([opponentName, count]) => ({
      id: `opponent-${opponentName}`,
      type: 'opponent' as const,
      label: opponentName,
      secondary: `${count} davada karşı taraf`,
      categoryBadge: 'Karşı Taraf',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      action: () => {
        setSearchQuery(opponentName);
        setIsSearchFocused(false);
      }
    }));

    // 7. Evrak ve Delil Türleri (Files & Evidentiary Documents)
    const fileTypeSet = new Map<string, number>();
    allCases.forEach(({ caseItem }) => {
      caseItem.files?.forEach((f) => {
        if (f.type) {
          fileTypeSet.set(f.type, (fileTypeSet.get(f.type) || 0) + 1);
        }
      });
    });
    const fileTypeSuggestions = Array.from(fileTypeSet.entries()).map(([fileType, count]) => ({
      id: `file-type-${fileType}`,
      type: 'file_type' as const,
      label: fileType,
      secondary: `${count} adet kayıtlı evrak / delil`,
      categoryBadge: 'Evrak / Belge',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      action: () => {
        setSearchQuery(fileType);
        setIsSearchFocused(false);
      }
    }));

    return {
      all: [
        ...caseSuggestions,
        ...clientSuggestions,
        ...courtSuggestions,
        ...courtTypeSuggestions,
        ...tagSuggestions,
        ...opponentSuggestions,
        ...fileTypeSuggestions
      ],
      cases: caseSuggestions,
      clients: clientSuggestions,
      courts: courtSuggestions,
      courtTypes: courtTypeSuggestions,
      tags: tagSuggestions,
      opponents: opponentSuggestions,
      fileTypes: fileTypeSuggestions
    };
  }, [allCases, availableClients, availableCourts, availableCourtTypes, tagCounts]);

  // Filtered Suggestions based on query or top suggestions
  const activeSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Top 8 suggestions when input is empty
      return allPortfolioSuggestions.all.slice(0, 8);
    }
    return allPortfolioSuggestions.all.filter((item) =>
      item.label.toLowerCase().includes(q) || item.secondary.toLowerCase().includes(q)
    );
  }, [allPortfolioSuggestions, searchQuery]);

  // Case Status Distribution Pie Chart Data (Dava Durum Dağılımı: Derdest, Beklemede, Kapalı)
  const statusDistributionData = useMemo(() => {
    let openCount = 0;
    let pendingCount = 0;
    let closedCount = 0;

    allCases.forEach(({ caseItem }) => {
      if (caseItem.status === 'Open') openCount++;
      else if (caseItem.status === 'Pending') pendingCount++;
      else if (caseItem.status === 'Closed') closedCount++;
    });

    const total = allCases.length || 1;

    return [
      {
        name: 'Derdest (Açık)',
        statusKey: 'Open' as const,
        value: openCount,
        percent: Math.round((openCount / total) * 100),
        color: '#10b981', // emerald-500
        darkColor: '#059669',
        badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      },
      {
        name: 'Beklemede',
        statusKey: 'Pending' as const,
        value: pendingCount,
        percent: Math.round((pendingCount / total) * 100),
        color: '#f59e0b', // amber-500
        darkColor: '#d97706',
        badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
      },
      {
        name: 'Kapalı (Sonuçlanan)',
        statusKey: 'Closed' as const,
        value: closedCount,
        percent: Math.round((closedCount / total) * 100),
        color: '#64748b', // slate-500
        darkColor: '#475569',
        badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
      }
    ].filter((item) => item.value > 0);
  }, [allCases]);

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    return (
      searchQuery.trim().length > 0 ||
      courtTypeFilter !== 'ALL' ||
      selectedCourt !== 'ALL' ||
      selectedClient !== 'ALL' ||
      statusFilter !== 'ALL' ||
      tagFilter !== 'ALL' ||
      hasHearingOnly ||
      sortBy !== 'default'
    );
  }, [searchQuery, courtTypeFilter, selectedCourt, selectedClient, statusFilter, tagFilter, hasHearingOnly, sortBy]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCourtTypeFilter('ALL');
    setSelectedCourt('ALL');
    setSelectedClient('ALL');
    setStatusFilter('ALL');
    setTagFilter('ALL');
    setHasHearingOnly(false);
    setSortBy('default');
  };

  // Filtered & Sorted cases
  const filteredCases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allCases
      .filter(({ client, caseItem }) => {
        // Search query: match caseNumber, court, client.fullName, subject, or opponentName instantly
        if (query) {
          const matchCaseNo = caseItem.caseNumber.toLowerCase().includes(query);
          const matchCourt = caseItem.court.toLowerCase().includes(query);
          const matchClient = client.fullName.toLowerCase().includes(query);
          const matchSubject = caseItem.subject.toLowerCase().includes(query);
          const matchOpponent = (caseItem.opponentName || '').toLowerCase().includes(query);

          if (!matchCaseNo && !matchCourt && !matchClient && !matchSubject && !matchOpponent) {
            return false;
          }
        }

        // Court type general filter
        if (courtTypeFilter !== 'ALL') {
          const courtLower = (caseItem.court || '').toLowerCase();
          const targetLower = courtTypeFilter.toLowerCase().replace('mahkemesi', '').trim();
          if (!courtLower.includes(targetLower)) {
            return false;
          }
        }

        // Specific Court filter
        if (selectedCourt !== 'ALL' && caseItem.court !== selectedCourt) {
          return false;
        }

        // Client filter
        if (selectedClient !== 'ALL' && client.id !== selectedClient) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'ALL' && caseItem.status !== statusFilter) {
          return false;
        }

        // Tag filter (e.g. 'Duruşma Bekliyor', 'Karar Aşaması', 'Temyiz')
        if (tagFilter !== 'ALL') {
          const tags = getCaseVisualStatusTags(caseItem);
          if (tagFilter === 'durusma' && !tags.some((t) => t.id === 'tag-durusma-bekliyor')) {
            return false;
          }
          if (tagFilter === 'karar' && !tags.some((t) => t.id === 'tag-karar')) {
            return false;
          }
          if (tagFilter === 'temyiz' && !tags.some((t) => t.id === 'tag-temyiz')) {
            return false;
          }
          if (tagFilter === 'tahkikat' && !tags.some((t) => t.id === 'tag-tahkikat')) {
            return false;
          }
          if (tagFilter === 'on_inceleme' && !tags.some((t) => t.id === 'tag-on-inceleme')) {
            return false;
          }
        }

        // Upcoming hearing only filter
        if (hasHearingOnly && !caseItem.nextHearingDate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 1. Date Created (Açılış Tarihi)
        if (sortBy === 'date_created_desc') {
          const diff = getCaseCreatedTimestamp(b.caseItem) - getCaseCreatedTimestamp(a.caseItem);
          if (diff !== 0) return diff;
          return b.caseItem.caseNumber.localeCompare(a.caseItem.caseNumber, undefined, { numeric: true });
        }
        if (sortBy === 'date_created_asc') {
          const diff = getCaseCreatedTimestamp(a.caseItem) - getCaseCreatedTimestamp(b.caseItem);
          if (diff !== 0) return diff;
          return a.caseItem.caseNumber.localeCompare(b.caseItem.caseNumber, undefined, { numeric: true });
        }

        // 2. Last Updated (Son Güncelleme)
        if (sortBy === 'last_updated_desc') {
          const diff = getCaseLastUpdatedTimestamp(b.caseItem) - getCaseLastUpdatedTimestamp(a.caseItem);
          if (diff !== 0) return diff;
          return b.caseItem.caseNumber.localeCompare(a.caseItem.caseNumber, undefined, { numeric: true });
        }
        if (sortBy === 'last_updated_asc') {
          const diff = getCaseLastUpdatedTimestamp(a.caseItem) - getCaseLastUpdatedTimestamp(b.caseItem);
          if (diff !== 0) return diff;
          return a.caseItem.caseNumber.localeCompare(b.caseItem.caseNumber, undefined, { numeric: true });
        }

        // 3. Case Number (Esas / Dava No)
        if (sortBy === 'case_number_asc') {
          return a.caseItem.caseNumber.localeCompare(b.caseItem.caseNumber, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (sortBy === 'case_number_desc' || sortBy === 'case_desc') {
          return b.caseItem.caseNumber.localeCompare(a.caseItem.caseNumber, undefined, { numeric: true, sensitivity: 'base' });
        }

        // 4. Hearing Date & Client
        if (sortBy === 'hearing_asc') {
          if (!a.caseItem.nextHearingDate) return 1;
          if (!b.caseItem.nextHearingDate) return -1;
          return a.caseItem.nextHearingDate.localeCompare(b.caseItem.nextHearingDate);
        }
        if (sortBy === 'client_asc') {
          return a.client.fullName.localeCompare(b.client.fullName, 'tr');
        }

        return 0;
      });
  }, [allCases, searchQuery, courtTypeFilter, selectedCourt, selectedClient, statusFilter, tagFilter, hasHearingOnly, sortBy]);

  // Direct 1-Click CSV Export for currently filtered cases
  const handleExportFilteredCsv = () => {
    if (filteredCases.length === 0) return;

    const sanitize = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+@\-\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const headers = [
      'Sıra No',
      'Esas / Dava No',
      'Müvekkil Adı',
      'Dava Durumu',
      'Ekli Dosya / Evrak Sayısı',
      'Mahkeme',
      'Dava Konusu',
      'Dava Safahatı',
      'Sonraki Duruşma Tarihi',
      'Karşı Taraf',
      'Açılış Tarihi',
      'Sorumlu Avukat',
      'Rapor Tarihi'
    ];

    const nowStr = new Date().toLocaleString('tr-TR');

    const rows = filteredCases.map((item, idx) => {
      const { client, caseItem } = item;
      const fileCount = caseItem.files ? caseItem.files.length : 0;
      const statusText =
        caseItem.status === 'Open'
          ? 'Derdest'
          : caseItem.status === 'Pending'
          ? 'Beklemede'
          : 'Kapalı';

      return [
        sanitize(idx + 1),
        sanitize(caseItem.caseNumber),
        sanitize(client.fullName),
        sanitize(statusText),
        sanitize(fileCount),
        sanitize(caseItem.court),
        sanitize(caseItem.subject),
        sanitize(caseItem.stage || '-'),
        sanitize(caseItem.nextHearingDate || 'Belirtilmedi'),
        sanitize(caseItem.opponentName || '-'),
        sanitize(caseItem.openedDate || '-'),
        sanitize(lawyer.fullName),
        sanitize(nowStr)
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const cleanDate = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Filtrelenen_Davalar_Raporu_${cleanDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportToast({
      message: `${filteredCases.length} adet filtrelenmiş dava dosyası CSV (Excel) olarak yerel cihazınıza aktarıldı.`,
      format: 'CSV',
      count: filteredCases.length
    });
    setTimeout(() => {
      setExportToast(null);
    }, 6000);
  };

  // Local-only secure export handler
  const handleExecuteExport = async () => {
    const targetCases: FlattenedCaseItem[] =
      exportScope === 'filtered' ? filteredCases : allCases;

    if (targetCases.length === 0) return;

    setIsExporting(true);
    const scopeLabel =
      exportScope === 'filtered'
        ? `Filtrelenen Davalar (${targetCases.length} Dosya)`
        : `Tüm Dava Portföyü (${targetCases.length} Dosya)`;

    const exportOptions = {
      includeContactDetails,
      includeFinancialValues,
      includeEvidenceCount,
      includePrivacySeal,
      scopeLabel
    };

    try {
      if (exportFormat === 'csv') {
        exportCasesToCsv(targetCases, lawyer, exportOptions);
        setExportToast({
          message: 'Dava portföyü güvenli CSV (Excel uyumlu) olarak yerel cihazınıza indirildi.',
          format: 'CSV',
          count: targetCases.length
        });
      } else if (exportFormat === 'pdf') {
        await printSecurePdfReport(targetCases, lawyer, exportOptions);
        setExportToast({
          message: 'Resmi UYAP / Baro dava fihristi PDF yazdırma penceresine aktarıldı.',
          format: 'PDF',
          count: targetCases.length
        });
      } else if (exportFormat === 'html') {
        downloadOfflineHtmlReport(targetCases, lawyer, exportOptions);
        setExportToast({
          message: 'Çevrimdışı güvenli HTML dava raporu yerel cihazınıza kaydedildi.',
          format: 'HTML',
          count: targetCases.length
        });
      }

      setShowExportModal(false);
      setTimeout(() => {
        setExportToast(null);
      }, 6000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Quick preset filter applicator
  const applyPreset = (preset: 'all' | 'open' | 'hearings' | 'durusma' | 'karar' | 'temyiz' | 'ticaret' | 'is') => {
    if (preset === 'all') {
      handleResetFilters();
    } else if (preset === 'open') {
      setStatusFilter('Open');
      setTagFilter('ALL');
      setHasHearingOnly(false);
    } else if (preset === 'hearings' || preset === 'durusma') {
      setTagFilter('durusma');
      setStatusFilter('ALL');
    } else if (preset === 'karar') {
      setTagFilter('karar');
      setStatusFilter('ALL');
    } else if (preset === 'temyiz') {
      setTagFilter('temyiz');
      setStatusFilter('ALL');
    } else if (preset === 'ticaret') {
      setTagFilter('ALL');
      const ticaretCourt = availableCourts.find((c) => c.toLowerCase().includes('ticaret'));
      if (ticaretCourt) {
        setSelectedCourt(ticaretCourt);
      } else {
        setSearchQuery('Ticaret');
      }
    } else if (preset === 'is') {
      setTagFilter('ALL');
      const isCourt = availableCourts.find((c) => c.toLowerCase().includes('iş mahkemesi'));
      if (isCourt) {
        setSelectedCourt(isCourt);
      } else {
        setSearchQuery('İş Mahkemesi');
      }
    }
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 rounded px-0.5 font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Helper to calculate days remaining until hearing
  const getHearingBadgeInfo = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date(2026, 8, 25);
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let text = `${dateStr}`;
    let badgeClass = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';

    if (diff < 0) {
      text = `Duruşma Geçti (${Math.abs(diff)} gün önce)`;
      badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    } else if (diff === 0) {
      text = `Bugün Duruşma Var!`;
      badgeClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse font-bold';
    } else if (diff <= 7) {
      text = `Duruşma: ${dateStr} (${diff} gün kaldı)`;
      badgeClass = 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold';
    } else {
      text = `Duruşma: ${dateStr} (${diff} gün)`;
    }

    return { text, badgeClass, diff };
  };

  return (
    <div className="LawyerCaseListSection bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* 1. Header Row with Real-Time Search & Filtering Bar */}
      <div className="flex flex-col gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FolderOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {lawyer.fullName} Adına Kayıtlı Dava Dosyaları
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold tabular-nums">
                {filteredCases.length} / {allCases.length} Dosya
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Yetkili olduğunuz davaları esas numarası, mahkeme türü veya müvekkil adına göre anlık olarak arayın ve filtreleyin.
            </p>
          </div>

          {/* Mini Case Status Distribution Pie Chart (Recharts) */}
          {allCases.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              {/* Pie Chart SVG container */}
              <div className="w-[48px] h-[48px] relative shrink-0">
                <ResponsiveContainer width={48} height={48}>
                  <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap">
                              <span className="font-bold">{item.name}</span>: {item.value} dosya ({item.percent}%)
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={statusDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={13}
                      outerRadius={22}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          onClick={() => setStatusFilter(statusFilter === entry.statusKey ? 'ALL' : entry.statusKey)}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center total icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <PieChartIcon className="w-3 h-3 text-amber-500/80" />
                </div>
              </div>

              {/* Status breakdown legend badges */}
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                  <PieChartIcon className="w-3 h-3 text-amber-500" />
                  <span>Durum Dağılımı:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {statusDistributionData.map((item) => (
                    <button
                      key={item.statusKey}
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === item.statusKey ? 'ALL' : item.statusKey)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                        statusFilter === item.statusKey
                          ? `${item.badgeBg} ring-1 ring-current font-bold`
                          : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                      title={`${item.name} davaları filtrele (${item.value} adet, %${item.percent})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.statusKey === 'Open' ? 'Derdest' : item.statusKey === 'Pending' ? 'Beklemede' : 'Kapalı'}</span>
                      <strong className="font-mono tabular-nums">{item.value}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {archivedCasesCount > 0 && onNavigateToArchived && (
              <button
                type="button"
                onClick={onNavigateToArchived}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Arşivlenen davaları görüntüle"
              >
                <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{archivedCasesCount} Arşivli Dava</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Direct Export CSV Button for currently filtered cases */}
            <button
              type="button"
              onClick={handleExportFilteredCsv}
              disabled={filteredCases.length === 0}
              className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                filteredCases.length === 0
                  ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  : 'border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
              title={`Filtrelenen ${filteredCases.length} davayı CSV raporu olarak indir (Esas No, Müvekkil Adı, Durum, Dosya Sayısı)`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export ({filteredCases.length} CSV)</span>
            </button>

            {/* Renk ve Durum Göstergesi (Status Legend Key) Butonu */}
            <button
              type="button"
              onClick={() => setShowStatusLegend(!showStatusLegend)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer font-semibold ${
                showStatusLegend
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 ring-2 ring-amber-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
              }`}
              title="Dava durum etiketlerinin renk kodlama rehberini ve anlamlarını göster"
            >
              <Palette className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Renk Rehberi (Key)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showStatusLegend ? 'rotate-180 text-amber-600' : 'text-slate-400'}`} />
            </button>

            {/* Güvenli Dışa Aktar Modalı Butonu (PDF / Seçenekler) */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 font-medium transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
              title="Gelişmiş dışa aktarma seçenekleri ve PDF yazdırma"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Rapor Seçenekleri</span>
            </button>

            <button
              type="button"
              onClick={onOpenAllCases}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <span>Tüm Dosyaları Aç</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* REAL-TIME HEADER SEARCH & FILTERING BAR (BAŞLIK ANLIK ARAMA VE FİLTRELEME ÇUBUĞU) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Live Search Input with Suggestions Dropdown */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500 dark:text-amber-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Esas No (2024/782), Müvekkil adı veya Mahkeme türü ile anında filtrele..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Aramayı Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Smart Suggestions Floating Dropdown */}
            {isSearchFocused && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSearchFocused(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-500/20 text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{searchQuery ? 'Eşleşen Arama Önerileri' : 'Önerilen Hızlı Arama & Filtreler'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllSuggestionsModal(true)}
                      className="font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span>Önerilerin tamamını göster ({allPortfolioSuggestions.all.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Suggestions List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {activeSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Arama terimine uygun öneri bulunamadı.
                      </div>
                    ) : (
                      activeSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            item.action();
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/50 dark:hover:bg-slate-800/60 transition flex items-center justify-between gap-3 text-xs cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${item.badgeClass}`}>
                              {item.categoryBadge}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {item.secondary}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer Button */}
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowAllSuggestionsModal(true);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Önerilerin Tamamını Göster (Dava, Müvekkil, Mahkeme & Durumlar)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Real-Time Selectors: Court Type & Client */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Mahkeme Türü (Court Type) */}
            <div className="min-w-[155px] relative">
              <select
                value={courtTypeFilter}
                onChange={(e) => setCourtTypeFilter(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                title="Mahkeme Türüne Göre Filtrele"
              >
                <option value="ALL">🏛️ Tüm Mahkeme Türleri</option>
                {availableCourtTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Müvekkil Seçici */}
            <div className="min-w-[150px] relative">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                title="Müvekkile Göre Filtrele"
              >
                <option value="ALL">👤 Tüm Müvekkiller ({availableClients.length})</option>
                {availableClients.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Header Sorting Dropdown (Sıralama Seçici) */}
            <div className="min-w-[170px] relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`w-full py-2.5 pl-8 pr-3 bg-slate-50 dark:bg-[#0c121e] border rounded-xl text-xs font-semibold focus:outline-none transition cursor-pointer ${
                  sortBy !== 'default'
                    ? 'border-amber-500/80 text-amber-900 dark:text-amber-200 bg-amber-50/40 dark:bg-amber-950/30 ring-1 ring-amber-500/40'
                    : 'border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:border-amber-500'
                }`}
                title="Dava listesini Açılış Tarihi, Son Güncelleme veya Esas Numarasına göre sırala"
              >
                <option value="default">↕️ Sıralama: Varsayılan</option>
                <optgroup label="Açılış Tarihi (Date Created)">
                  <option value="date_created_desc">📅 Açılış: Yeniden Eskiye (Azalan)</option>
                  <option value="date_created_asc">📅 Açılış: Eskiden Yeniye (Artan)</option>
                </optgroup>
                <optgroup label="Son Güncelleme (Last Updated)">
                  <option value="last_updated_desc">⚡ Son Güncelleme: Yeniden Eskiye</option>
                  <option value="last_updated_asc">⚡ Son Güncelleme: Eskiden Yeniye</option>
                </optgroup>
                <optgroup label="Esas No (Case Number)">
                  <option value="case_number_asc">🔢 Esas No: Artan (A-Z / 1-9)</option>
                  <option value="case_number_desc">🔢 Esas No: Azalan (Z-A / 9-1)</option>
                </optgroup>
                <optgroup label="Diğer Kriterler">
                  <option value="hearing_asc">⏱️ Yaklaşan Duruşma Tarihi</option>
                  <option value="client_asc">👤 Müvekkil Adı (A-Z)</option>
                </optgroup>
              </select>
            </div>

            {/* Gelişmiş Filtreler Butonu */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                showAdvancedFilters || statusFilter !== 'ALL' || hasHearingOnly || sortBy !== 'default'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-slate-50 dark:bg-[#0c121e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Gelişmiş Dava Durumu ve Sıralama Filtrelerini Göster"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Detaylar</span>
            </button>

            {/* Clear All Filters Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition shrink-0 cursor-pointer"
                title="Tüm Arama ve Filtreleri Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sıfırla</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Typing Match Badges & Quick Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
          {/* Live match pills as lawyer types */}
          <div className="flex flex-wrap items-center gap-1.5">
            {searchQuery && queryMatchSummary && (
              <>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">Anlık Eşleşmeler:</span>
                {queryMatchSummary.matchCase > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Esas No ({queryMatchSummary.matchCase})</span>
                  </span>
                )}
                {queryMatchSummary.matchClient > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    <span>Müvekkil ({queryMatchSummary.matchClient})</span>
                  </span>
                )}
                {queryMatchSummary.matchCourt > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Mahkeme ({queryMatchSummary.matchCourt})</span>
                  </span>
                )}
                {queryMatchSummary.matchCase === 0 && queryMatchSummary.matchClient === 0 && queryMatchSummary.matchCourt === 0 && (
                  <span className="text-[11px] text-rose-500 italic">
                    Eşleşen dosya bulunamadı
                  </span>
                )}
              </>
            )}

            {!searchQuery && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Hızlı filtreler:</span>
              </span>
            )}
          </div>

        {/* QUICK FILTER ROW (HIZLI DURUM FİLTRELERİ BÖLÜMÜ) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold text-xs border border-amber-500/25 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Hızlı Filtre (Quick Filter):</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:inline">
              Tek tıkla durum kategorilerine göre dava listesini filtreleyin
            </span>
            <button
              type="button"
              onClick={() => setShowStatusLegend(!showStatusLegend)}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold ml-1 cursor-pointer"
              title="Dava durum etiketlerinin renk kodlama rehberini ve anlamlarını göster"
            >
              <Palette className="w-3 h-3" />
              <span>{showStatusLegend ? 'Renk Rehberini Gizle' : 'Renk Rehberi (Key)'}</span>
            </button>

            {/* Direct button: Önerilerin Tamamını Göster */}
            <button
              type="button"
              onClick={() => setShowAllSuggestionsModal(true)}
              className="text-[11px] text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:underline flex items-center gap-1 font-bold ml-1.5 cursor-pointer bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800/80 transition"
              title="Portföydeki tüm önerileri (Esas No, Müvekkil, Mahkeme, Durum) göster"
            >
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>Önerilerin tamamını göster</span>
            </button>
          </div>

          {/* Toggleable Buttons for 'Duruşma Bekliyor', 'Karar Aşaması', and 'Temyiz' */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Toggle 'Tümü' (All cases) */}
            <button
              type="button"
              onClick={() => {
                setCourtTypeFilter('ALL');
                setSelectedCourt('ALL');
                setSelectedClient('ALL');
                setTagFilter('ALL');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                courtTypeFilter === 'ALL' && selectedCourt === 'ALL' && selectedClient === 'ALL' && tagFilter === 'ALL' && !searchQuery
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Tüm dava dosyalarını göster"
            >
              <span>Tüm Dosyalar</span>
              <span className="font-mono text-[10px] opacity-80 font-bold">({allCases.length})</span>
            </button>

            {/* Toggleable 'Duruşma Bekliyor' Button */}
            <button
              type="button"
              onClick={() => setTagFilter(tagFilter === 'durusma' ? 'ALL' : 'durusma')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                tagFilter === 'durusma'
                  ? `${STATUS_TAG_PALETTES.durusma_bekliyor.badgeClass} ring-2 ring-amber-500/50 scale-[1.02]`
                  : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100/80'
              }`}
              title="Duruşma Bekleyen Dosyaları Filtrele (Aç / Kapat)"
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_TAG_PALETTES.durusma_bekliyor.dotColor} ${tagFilter === 'durusma' ? 'animate-pulse' : ''}`} />
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Duruşma Bekliyor</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20 tabular-nums">
                {tagCounts.durusma}
              </span>
            </button>

            {/* Toggleable 'Karar Aşaması' Button */}
            <button
              type="button"
              onClick={() => setTagFilter(tagFilter === 'karar' ? 'ALL' : 'karar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                tagFilter === 'karar'
                  ? `${STATUS_TAG_PALETTES.karar_asamasi.badgeClass} ring-2 ring-purple-500/50 scale-[1.02]`
                  : 'bg-purple-50/70 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 hover:bg-purple-100/80'
              }`}
              title="Karar Aşamasındaki / Karara Çıkmış Dosyaları Filtrele (Aç / Kapat)"
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_TAG_PALETTES.karar_asamasi.dotColor}`} />
              <Gavel className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Karar Aşaması</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20 tabular-nums">
                {tagCounts.karar}
              </span>
            </button>

            {/* Toggleable 'Temyiz' Button */}
            <button
              type="button"
              onClick={() => setTagFilter(tagFilter === 'temyiz' ? 'ALL' : 'temyiz')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                tagFilter === 'temyiz'
                  ? `${STATUS_TAG_PALETTES.temyiz.badgeClass} ring-2 ring-indigo-500/50 scale-[1.02]`
                  : 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100/80'
              }`}
              title="Temyiz / İstinaf İncelemesindeki Dosyaları Filtrele (Aç / Kapat)"
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_TAG_PALETTES.temyiz.dotColor}`} />
              <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Temyiz / İstinaf</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20 tabular-nums">
                {tagCounts.temyiz}
              </span>
            </button>

            {/* Shortcut Court Type Buttons */}
            <button
              type="button"
              onClick={() => {
                setCourtTypeFilter(courtTypeFilter === 'Asliye Ticaret' ? 'ALL' : 'Asliye Ticaret');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                courtTypeFilter === 'Asliye Ticaret'
                  ? 'bg-slate-700 text-white font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              🏛️ Ticaret
            </button>
            <button
              type="button"
              onClick={() => {
                setCourtTypeFilter(courtTypeFilter === 'İş Mahkemesi' ? 'ALL' : 'İş Mahkemesi');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                courtTypeFilter === 'İş Mahkemesi'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100'
              }`}
            >
              ⚖️ İş Mahkemesi
            </button>
          </div>
        </div>

        {/* COLOR CODING SYSTEM LEGEND / KEY PANEL (DURUM ETİKETLERİ RENK REHBERİ) */}
        {showStatusLegend && (
          <div className="pt-3 pb-1 border-t border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
            <div className="bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-inner space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Palette className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                      <span>Dava Durum Etiketleri & Renk Kodlama Rehberi (Status Tag Legend / Key)</span>
                      <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        10 Renk Kategorisi
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dava kartlarındaki renkli rozetler safahatı ve aciliyeti simgeler. Kategoriye tıklayarak doğrudan filtre uygulayabilirsiniz.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatusLegend(false)}
                  className="self-end sm:self-center text-xs px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer font-medium"
                  title="Rehberi Kapat"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Kapat</span>
                </button>
              </div>

              {/* Grid of Legend Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {STATUS_LEGEND_ITEMS.map((item) => {
                  const palette = STATUS_TAG_PALETTES[item.category] || STATUS_TAG_PALETTES.default;
                  const isPulsing = item.category === 'durusma_bugun';
                  const isFilterActive =
                    item.targetTagFilter && tagFilter === item.targetTagFilter;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.targetTagFilter) {
                          setTagFilter(tagFilter === item.targetTagFilter ? 'ALL' : item.targetTagFilter);
                        }
                      }}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isFilterActive
                          ? 'ring-2 ring-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80 shadow-xs'
                          : 'bg-white dark:bg-[#131d31] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      } ${item.targetTagFilter ? 'cursor-pointer hover:shadow-xs' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        {/* Sample Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold shadow-2xs ${palette.badgeClass} ${palette.glowEffect || ''}`}
                        >
                          {isPulsing ? (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${palette.dotColor}`} />
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${palette.dotColor}`} />
                            </span>
                          ) : (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${palette.dotColor}`} />
                          )}
                          {item.icon}
                          <span className="tracking-tight">{item.badgeLabel}</span>
                          {item.badgeDetail && (
                            <span className="text-[9px] opacity-85 font-mono border-l border-current/25 pl-1 ml-0.5">
                              {item.badgeDetail}
                            </span>
                          )}
                          {/* Sample file count badge */}
                          <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[8px] font-mono font-extrabold bg-black/10 dark:bg-white/20 border border-current/25">
                            2
                          </span>
                        </span>

                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          {item.colorName}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.description}
                      </p>

                      {item.targetTagFilter && (
                        <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <span>{isFilterActive ? '✓ Filtre Devrede' : 'Tıkla ve filtrele'}</span>
                          <ChevronRight className="w-3 h-3 opacity-70" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanatory Footer Bar for Circular Count & Pulse */}
              <div className="p-2.5 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-mono font-extrabold bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs shrink-0">
                    2
                  </span>
                  <span>
                    <strong>Dairesel Sayı Rozeti ([N]):</strong> Her durum etiketinin sonundaki dairesel rozet, o dava dosyasına yüklenmiş ekli delil belgesi, tensip zaptı ve evrak adedini gösterir.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-rose-500" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                  </span>
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    Nabız Efekti: Acil duruşma gününü gösterir.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Export Success Notification */}
      {exportToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              {exportToast.message}
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100 font-mono text-[11px] font-bold">
              {exportToast.count} Dosya · {exportToast.format}
            </span>
            <button
              type="button"
              onClick={() => setExportToast(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Archive Success Notification with Undo */}
      {archiveToast && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200">
              <strong>"{archiveToast.caseNumber}"</strong> numaralı dava arşivlendi ve aktif listeden kaldırıldı.
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleUndoArchive(archiveToast.clientId, archiveToast.caseId)}
              className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/70 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold text-[11px] transition flex items-center gap-1 shadow-sm active:scale-95"
            >
              <Undo2 className="w-3 h-3" />
              <span>Geri Al</span>
            </button>
            {onNavigateToArchived && (
              <button
                type="button"
                onClick={onNavigateToArchived}
                className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline font-semibold"
              >
                Arşiv Sekmesini Aç →
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Advanced Filters Expandable Tray (Dava Durumu, Sıralama, Duruşma Filtreleri) */}
      <div className="space-y-3">
        {showAdvancedFilters && (
          <div className="p-3.5 bg-slate-50 dark:bg-[#0c121e]/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-200 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Dava Durumu:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Tüm Durumlar (Açık, Beklemede, Kapalı)</option>
                  <option value="Open">Derdest / Açık Davalar (Open)</option>
                  <option value="Pending">Beklemede / İstinaf Aşaması (Pending)</option>
                  <option value="Closed">Karara Çıktı / Kesinleşti (Closed)</option>
                </select>
              </div>

              {/* Hearing Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Duruşma Kriteri:
                </label>
                <button
                  type="button"
                  onClick={() => setHasHearingOnly(!hasHearingOnly)}
                  className={`w-full py-1.5 px-3 rounded-lg border text-left font-semibold flex items-center justify-between transition ${
                    hasHearingOnly
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span>Yalnızca Duruşma Günü Olanlar</span>
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${hasHearingOnly ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-400'}`}>
                    {hasHearingOnly && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </span>
                </button>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Sıralama Ölçütü:
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="default">Varsayılan (Kayıt Sırası)</option>
                    <optgroup label="Açılış Tarihi (Date Created)">
                      <option value="date_created_desc">Açılış Tarihi: Yeniden Eskiye (Azalan)</option>
                      <option value="date_created_asc">Açılış Tarihi: Eskiden Yeniye (Artan)</option>
                    </optgroup>
                    <optgroup label="Son Güncelleme (Last Updated)">
                      <option value="last_updated_desc">Son Güncelleme: Yeniden Eskiye (Azalan)</option>
                      <option value="last_updated_asc">Son Güncelleme: Eskiden Yeniye (Artan)</option>
                    </optgroup>
                    <optgroup label="Esas No (Case Number)">
                      <option value="case_number_asc">Esas No: Artan (A-Z / 1-9)</option>
                      <option value="case_number_desc">Esas No: Azalan (Z-A / 9-1)</option>
                    </optgroup>
                    <optgroup label="Diğer Kriterler">
                      <option value="hearing_asc">Yaklaşan Duruşma Tarihine Göre</option>
                      <option value="client_asc">Müvekkil Adına Göre (A-Z)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Quick Filter Chips / Presets Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-500" /> Hızlı Filtreler:
          </span>

          <button
            type="button"
            onClick={() => applyPreset('all')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
              !isFilterActive
                ? 'bg-amber-500 text-white border-amber-600 font-bold'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Tümü ({allCases.length})
          </button>

          <button
            type="button"
            onClick={() => applyPreset('durusma')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition flex items-center gap-1 ${
              tagFilter === 'durusma'
                ? 'bg-amber-600 text-white border-amber-700 font-bold shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>⏱️ Duruşma Bekliyor</span>
            <span className="font-mono text-[10px] opacity-80 font-bold">({tagCounts.durusma})</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('karar')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition flex items-center gap-1 ${
              tagFilter === 'karar'
                ? 'bg-purple-600 text-white border-purple-700 font-bold shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
            }`}
          >
            <span>⚖️ Karar Aşaması</span>
            <span className="font-mono text-[10px] opacity-80 font-bold">({tagCounts.karar})</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('temyiz')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition flex items-center gap-1 ${
              tagFilter === 'temyiz'
                ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <span>🏛️ Temyiz / İstinaf</span>
            <span className="font-mono text-[10px] opacity-80 font-bold">({tagCounts.temyiz})</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('open')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
              statusFilter === 'Open'
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Derdest / Açık Davalar
          </button>

          <button
            type="button"
            onClick={() => applyPreset('hearings')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
              hasHearingOnly
                ? 'bg-sky-600 text-white border-sky-700 font-bold'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Yaklaşan Duruşmalar
          </button>

          {availableCourts.some((c) => c.toLowerCase().includes('ticaret')) && (
            <button
              type="button"
              onClick={() => applyPreset('ticaret')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
                selectedCourt.toLowerCase().includes('ticaret') || searchQuery.toLowerCase() === 'ticaret'
                  ? 'bg-amber-600 text-white border-amber-700 font-bold'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Ticaret Mahkemeleri
            </button>
          )}

          {availableCourts.some((c) => c.toLowerCase().includes('iş mahkemesi')) && (
            <button
              type="button"
              onClick={() => applyPreset('is')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
                selectedCourt.toLowerCase().includes('iş mahkemesi') || searchQuery.toLowerCase().includes('iş mahkemesi')
                  ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              İş Mahkemeleri
            </button>
          )}
        </div>

        {/* Active Filters Summary Bar */}
        {isFilterActive && (
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px]">
            <span className="font-semibold text-amber-900 dark:text-amber-300">Aktif Arama & Filtreler:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                Kelime: <strong>"{searchQuery}"</strong>
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCourt !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                Mahkeme: <strong>{selectedCourt}</strong>
                <button type="button" onClick={() => setSelectedCourt('ALL')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedClient !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                Müvekkil: <strong>{availableClients.find((c) => c.id === selectedClient)?.name}</strong>
                <button type="button" onClick={() => setSelectedClient('ALL')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                Durum: <strong>{statusFilter === 'Open' ? 'Derdest' : statusFilter === 'Pending' ? 'Beklemede' : 'Kapalı'}</strong>
                <button type="button" onClick={() => setStatusFilter('ALL')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {tagFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                Etiket: <strong>
                  {tagFilter === 'durusma'
                    ? 'Duruşma Bekliyor'
                    : tagFilter === 'karar'
                    ? 'Karar Aşaması'
                    : tagFilter === 'temyiz'
                    ? 'Temyiz / İstinaf'
                    : tagFilter === 'tahkikat'
                    ? 'Tahkikat & Bilirkişi'
                    : 'Ön İnceleme'}
                </strong>
                <button type="button" onClick={() => setTagFilter('ALL')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {hasHearingOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                <strong>Sadece Duruşmalı</strong>
                <button type="button" onClick={() => setHasHearingOnly(false)} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortBy !== 'default' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                Sıralama: <strong>
                  {sortBy === 'date_created_desc'
                    ? 'Açılış: Yeni → Eski'
                    : sortBy === 'date_created_asc'
                    ? 'Açılış: Eski → Yeni'
                    : sortBy === 'last_updated_desc'
                    ? 'Son Güncelleme: Yeni → Eski'
                    : sortBy === 'last_updated_asc'
                    ? 'Son Güncelleme: Eski → Yeni'
                    : sortBy === 'case_number_asc'
                    ? 'Esas No: Artan'
                    : sortBy === 'case_number_desc' || sortBy === 'case_desc'
                    ? 'Esas No: Azalan'
                    : sortBy === 'hearing_asc'
                    ? 'Duruşma Tarihi'
                    : 'Müvekkil (A-Z)'}
                </strong>
                <button type="button" onClick={() => setSortBy('default')} className="hover:text-rose-500" title="Sıralamayı Varsayılana Döndür">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto text-amber-700 dark:text-amber-400 hover:underline font-bold"
            >
              Tümünü Temizle
            </button>
          </div>
        )}
      </div>

      {/* 4. Case Cards List or Empty State */}
      {allCases.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <p className="text-xs text-slate-500">Bu avukat profili için henüz kayıtlı müvekkil veya dava bulunmamaktadır.</p>
          <button
            type="button"
            onClick={onOpenAllCases}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow-sm"
          >
            + İlk Müvekkil ve Davayı Ekle
          </button>
        </div>
      ) : filteredCases.length === 0 ? (
        /* Empty Search Results State */
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Arama kriterlerinize uygun dava dosyası bulunamadı
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {searchQuery && (
                <>
                  "<span className="font-semibold text-slate-700 dark:text-slate-300">{searchQuery}</span>" ifadesi{' '}
                </>
              )}
              {selectedCourt !== 'ALL' && (
                <>
                  "<span className="font-semibold text-slate-700 dark:text-slate-300">{selectedCourt}</span>" mahkemesi{' '}
                </>
              )}
              için eşleşen dosya kaydı mevcut değil. Farklı bir esas numarası, mahkeme veya müvekkil adı deneyebilir ya da filtreleri sıfırlayabilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Arama ve Filtreleri Temizle</span>
          </button>
        </div>
      ) : (
        /* Case Cards List */
        <div className="space-y-3">
          {filteredCases.map(({ client, caseItem }) => {
            const statusTags = getCaseVisualStatusTags(caseItem);
            const isNotesExpanded = expandedNotesCaseId === caseItem.id;

            return (
              <div
                key={caseItem.id}
                className={`p-4 rounded-xl transition-all flex flex-col gap-3 text-xs group shadow-sm hover:shadow ${
                  isNotesExpanded
                    ? 'bg-amber-50/20 dark:bg-[#0c121e] border-2 border-amber-500/50 dark:border-amber-500/50 ring-2 ring-amber-500/10'
                    : 'bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Section: Case Meta & Identifiers */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Top Badges: Case Number, Visual Status Tags, Court, Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Case Number with Hover-Trigger Metadata Preview Card */}
                    <div
                      className="relative inline-block"
                      onMouseEnter={() => setHoveredCasePreviewId(caseItem.id)}
                      onMouseLeave={() => setHoveredCasePreviewId(null)}
                    >
                      <div
                        className="inline-flex items-center gap-1.5 font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-tight bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 hover:border-amber-500/40 shadow-xs cursor-help transition"
                        title="Dava meta verilerini önizlemek için üzerine gelin"
                      >
                        <span>{highlightMatch(caseItem.caseNumber, searchQuery)}</span>
                        <Eye className="w-3 h-3 text-amber-500/60 group-hover:text-amber-500" />
                      </div>

                      {/* Hover Trigger Preview Popover Card */}
                      {hoveredCasePreviewId === caseItem.id && (
                        <div
                          className="absolute left-0 top-full mt-2 z-50 w-80 sm:w-96 p-3.5 bg-white dark:bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 pointer-events-none"
                          style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.25))' }}
                        >
                          {/* Mini Header */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {caseItem.caseNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Hızlı Özet</span>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                caseItem.status === 'Open'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : caseItem.status === 'Pending'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-500/15 text-slate-500'
                              }`}
                            >
                              {caseItem.status === 'Open' ? 'Derdest' : caseItem.status === 'Pending' ? 'Beklemede' : 'Kapalı'}
                            </span>
                          </div>

                          {/* 3 Key Metadata Fields: Assigned Court, Last Update Date, Latest Document Title */}
                          <div className="space-y-2 text-xs">
                            {/* 1. Assigned Court */}
                            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                              <Gavel className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Görevli Mahkeme</div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={caseItem.court}>
                                  {caseItem.court}
                                </div>
                              </div>
                            </div>

                            {/* 2. Last Update Date */}
                            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Son Güncelleme / İşlem Tarihi</div>
                                <div className="font-medium text-slate-700 dark:text-slate-200">
                                  {caseItem.updatedAt
                                    ? new Date(caseItem.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                                    : caseItem.files && caseItem.files.length > 0 && caseItem.files[caseItem.files.length - 1].uploadedAt
                                    ? caseItem.files[caseItem.files.length - 1].uploadedAt
                                    : caseItem.openedDate
                                    ? new Date(caseItem.openedDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                                    : 'Kayıt bulunamadı'}
                                </div>
                              </div>
                            </div>

                            {/* 3. Latest Document Title */}
                            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                              <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Son Eklenen Evrak / Delil</div>
                                {caseItem.files && caseItem.files.length > 0 ? (
                                  <div>
                                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 truncate" title={caseItem.files[caseItem.files.length - 1].name}>
                                      {caseItem.files[caseItem.files.length - 1].name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                      <span className="font-medium">{caseItem.files[caseItem.files.length - 1].type}</span>
                                      {caseItem.files[caseItem.files.length - 1].uploadedAt && (
                                        <span>• {caseItem.files[caseItem.files.length - 1].uploadedAt}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[11px]">
                                    Henüz yüklenmiş evrak bulunmuyor
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stage & Müvekkil Footer */}
                            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                              <span>Müvekkil: <strong className="text-slate-700 dark:text-slate-300">{client.fullName}</strong></span>
                              <span className="font-medium text-amber-600 dark:text-amber-400">{caseItem.stage}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visual Status Tags for instant readability (e.g., 'Duruşma Bekliyor', 'Karar Aşaması', 'Temyiz') */}
                    {statusTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shadow-xs transition-all ${tag.palette.badgeClass} ${tag.palette.glowEffect || ''}`}
                        title={`${tag.tooltip} · ${tag.fileCount} evrak/delil dosyası`}
                      >
                        {tag.pulsing ? (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tag.palette.dotColor}`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${tag.palette.dotColor}`} />
                          </span>
                        ) : (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${tag.palette.dotColor}`} />
                        )}
                        {tag.icon}
                        <span className="tracking-tight">{tag.label}</span>
                        {tag.detail && (
                          <span className="text-[10px] opacity-85 font-mono font-normal border-l border-current/25 pl-1.5 ml-0.5">
                            {tag.detail}
                          </span>
                        )}

                        {/* Small circular badge displaying the number of documents/files associated with that specific case */}
                        <span
                          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-extrabold bg-black/10 dark:bg-white/20 border border-current/25 shadow-2xs tabular-nums shrink-0"
                          title={`Bu dava dosyasına kayıtlı ${tag.fileCount} adet evrak / delil belgesi`}
                        >
                          {tag.fileCount}
                        </span>
                      </span>
                    ))}

                    {/* Court Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs">
                      <Gavel className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{highlightMatch(caseItem.court, searchQuery)}</span>
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-1 rounded-lg font-semibold text-[10px] uppercase tracking-wide border ${
                        caseItem.status === 'Open'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : caseItem.status === 'Pending'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {caseItem.status === 'Open' ? 'Derdest' : caseItem.status === 'Pending' ? 'Beklemede' : 'Kapalı'}
                    </span>
                  </div>

                  {/* Case Subject */}
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                    {highlightMatch(caseItem.subject, searchQuery)}
                  </div>

                  {/* Client & Opponent Line */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      Müvekkil: <strong className="text-slate-800 dark:text-slate-200 font-bold ml-0.5">{highlightMatch(client.fullName, searchQuery)}</strong>
                      <span className="text-[10px] font-mono text-slate-400">({client.type})</span>
                    </span>

                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

                    <span>
                      Karşı Taraf: <span className="text-slate-700 dark:text-slate-300 font-medium">{caseItem.opponentName || 'Belirtilmedi'}</span>
                    </span>

                    {caseItem.estimatedValue && caseItem.estimatedValue !== 'Belirtilmedi' && (
                      <>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold tabular-nums">
                          Değer: {caseItem.estimatedValue}
                        </span>
                      </>
                    )}

                    {caseItem.files && caseItem.files.length > 0 && (
                      <>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <FileText className="w-3 h-3" />
                          <span>{caseItem.files.length} Evrak / Delil</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Section: Quick Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-800">
                  {/* Private Encrypted Case Observations Action Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedNotesCaseId(isNotesExpanded ? null : caseItem.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer border ${
                      isNotesExpanded
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs'
                        : 'bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80'
                    }`}
                    title="Bu davaya özel şifreli gözlemleri ve zengin metin notlarını aç/kapat"
                  >
                    <Lock className={`w-3.5 h-3.5 ${isNotesExpanded ? 'text-slate-950' : 'text-amber-600 dark:text-amber-400'}`} />
                    <span>{isNotesExpanded ? 'Notları Kapat' : 'Özel Notlar'}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isNotesExpanded
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}>
                      Şifreli
                    </span>
                  </button>

                  {/* Copy Case Info Button */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyCaseInfo(e, caseItem, client)}
                    className={`px-2.5 py-1.5 rounded-xl border font-semibold transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                      copiedCaseId === caseItem.id
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                    title="Dava bilgilerini (Esas No, Müvekkil, Durum) panoya kopyala"
                  >
                    {copiedCaseId === caseItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Bilgiyi Kopyala</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCase(client.id, caseItem.id)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm flex items-center gap-1 active:scale-95"
                    title="Müvekkil & Dava Portalı'nda Dosyayı Aç"
                  >
                    <span>Dosyayı İncele</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToAnalyzer(caseItem.caseNumber)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-sm flex items-center gap-1 active:scale-95"
                    title="Evrak Analizörü ile Delil ve Tensip Zaptını İncele"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Analiz Et</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToPetition(caseItem.caseNumber, caseItem.subject)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-sm flex items-center gap-1 active:scale-95"
                    title="Bu dava için UYAP Dilekçesi Hazırla"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dilekçe</span>
                  </button>

                  {/* Archive Case Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveModalData({
                        clientId: client.id,
                        clientName: client.fullName,
                        caseItem
                      });
                      setArchiveReasonInput('Karar Kesinleşti / İcra Edildi');
                      setArchiveCustomReason('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Bu davayı arşivleyerek ana sayfa aktif listeden kaldır"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-500" />
                    <span>Arşivle</span>
                  </button>

                  {/* Permanent Delete Case Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalData({
                        clientId: client.id,
                        clientName: client.fullName,
                        caseItem
                      });
                      setDeleteConfirmationText('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-semibold text-rose-600 dark:text-rose-400 transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Bu dava dosyasını kalıcı olarak sil (Onay gerektirir)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span className="hidden sm:inline">Sil</span>
                  </button>
                </div>
              </div>

              {/* Expanded Rich-Text Private Notes Section */}
              {isNotesExpanded && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <CaseRichNotesSection
                    caseId={caseItem.id}
                    caseNumber={caseItem.caseNumber}
                    court={caseItem.court}
                    clientName={client.fullName}
                    lawyerSicilNo={lawyer.sicilNo}
                    onClose={() => setExpandedNotesCaseId(null)}
                  />
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* MODAL: DAVAYI ARŞİVLEME ONAYI & GEREKÇE */}
      {archiveModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Dava Dosyasını Arşivle
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bu dosya aktif ana sayfa görünümünden kaldırılacak ve 'Arşivlenen Davalar' sekmesine taşınacaktır.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchiveModalData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Details Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/25">
                    {archiveModalData.caseItem.caseNumber}
                  </span>
                  {getCaseVisualStatusTags(archiveModalData.caseItem).map((tag) => (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${tag.palette.badgeClass} ${tag.palette.glowEffect || ''}`}
                      title={`${tag.tooltip} · ${tag.fileCount} evrak`}
                    >
                      {tag.icon}
                      <span>{tag.label}</span>
                      <span
                        className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-mono font-extrabold bg-black/10 dark:bg-white/20 border border-current/25 shadow-2xs tabular-nums shrink-0"
                        title={`Bu davaya kayıtlı ${tag.fileCount} adet evrak`}
                      >
                        {tag.fileCount}
                      </span>
                    </span>
                  ))}
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {archiveModalData.caseItem.court}
                </span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                {archiveModalData.caseItem.subject}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Müvekkil: <strong className="text-slate-700 dark:text-slate-200">{archiveModalData.clientName}</strong>
              </div>
            </div>

            {/* Archive Reason Selector */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Arşivleme Sebebi / Dosya Durumu
              </label>
              <select
                value={archiveReasonInput}
                onChange={(e) => setArchiveReasonInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Karar Kesinleşti / İcra Edildi">Karar Kesinleşti / İcra Edildi (Lehe Hüküm)</option>
                <option value="Sulh & İbra Sağlandı">Sulh & İbra Sağlandı (Anlaşma)</option>
                <option value="Dava Feragat / Kabul Nedeniyle Bitti">Dava Feragat / Kabul Nedeniyle Sona Erdi</option>
                <option value="Görevsizlik / Yetkisizlik Kararı">Görevsizlik / Yetkisizlik Kararı Kesinleşti</option>
                <option value="Müvekkil ile Azil / İstifa">Müvekkil ile Azil / İstifa İlişkisi Sona Erdi</option>
                <option value="Pasif Dosya Takibi">Pasif Dosya Takibi (Beklemeye Alındı)</option>
                <option value="Diğer (Özel Açıklama)">Diğer (Özel Açıklama Giriniz)</option>
              </select>

              {archiveReasonInput === 'Diğer (Özel Açıklama)' && (
                <input
                  type="text"
                  value={archiveCustomReason}
                  onChange={(e) => setArchiveCustomReason(e.target.value)}
                  placeholder="Özel arşivleme gerekçesi veya notunuzu giriniz..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              )}
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-2">
              <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                Arşivlenen dava dosyaları silinmez; tüm delilleri, evrakları ve duruşma notlarıyla birlikte <strong>LawyerWorkspace &gt; Arşivlenen Davalar</strong> sekmesinde korunur ve istenildiği an tek tıkla aktife geri döndürülebilir.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setArchiveModalData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Davayı Arşivle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAVAYI KALICI OLARAK SİLME ONAYI (PERMANENT DELETE CONFIRMATION) */}
      {deleteModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                    <span>Dava Dosyasını Kalıcı Olarak Sil</span>
                  </h3>
                  <p className="text-xs text-rose-700/80 dark:text-rose-400/80">
                    Bu işlem geri alınamaz ve dosyaya ait tüm veriler sistemden tamamen kaldırılır.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalData(null);
                  setDeleteConfirmationText('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Case Summary Box */}
            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/25">
                  {deleteModalData.caseItem.caseNumber}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {deleteModalData.caseItem.court}
                </span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                {deleteModalData.caseItem.subject}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                <span>Müvekkil: <strong>{deleteModalData.clientName}</strong></span>
                {deleteModalData.caseItem.files && deleteModalData.caseItem.files.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {deleteModalData.caseItem.files.length} Ekli Belge / Evrak silinecek
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Warning Message Box */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <span>⚠️ Dikkat: Arşivlemek Yerine Kalıcı Silme!</span>
              </div>
              <p className="text-[11px]">
                Eğer bu davayı ileride incelemek veya istatistiklerde tutmak istiyorsanız, kalıcı silme yerine <strong>"Arşivle"</strong> seçeneğini tercih edebilirsiniz. Kalıcı silme yapıldığında dava numarası, tutanaklar ve delil dosyaları yerel veritabanından bütünüyle temizlenir.
              </p>
            </div>

            {/* Confirmation typing prompt */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Onaylamak için lütfen kutuya <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold">SİL</span> yazın:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="SİL"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 uppercase tracking-widest focus:outline-none focus:border-rose-500"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalData(null);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'SİL'}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kalıcı Olarak Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GÜVENLİ VE YEREL DAVA / MÜVEKKİL DIŞA AKTARIMI (PDF & CSV) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Güvenli Dava ve Müvekkil Dışa Aktarımı
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      100% Yerel İşlem
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Resmi UYAP/Baro uyumlu PDF fihristi veya Excel uyumlu CSV tablosu olarak cihazınıza kaydedin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection: Filtered vs All */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                1. Dışa Aktarılacak Dosya Kapsamı:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportScope('filtered')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    exportScope === 'filtered'
                      ? 'bg-amber-500/10 border-amber-500/60 dark:border-amber-500 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-amber-500" />
                      Filtrelenen Davalar
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-[11px]">
                      {filteredCases.length} Dosya
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    {isFilterActive
                      ? 'Geçerli arama ve filtre kriterlerinizle eşleşen dava listesi.'
                      : 'Şu anda tüm aktif davalar listelenmektedir.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    exportScope === 'all'
                      ? 'bg-amber-500/10 border-amber-500/60 dark:border-amber-500 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                      Tüm Portföy
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-[11px]">
                      {allCases.length} Dosya
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    {lawyer.fullName} adına kayıtlı tüm açık ve derdest dava dosyaları.
                  </p>
                </button>
              </div>
            </div>

            {/* Format Selection: CSV vs PDF vs HTML */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                2. Dışa Aktarma Formatı:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* CSV */}
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl border text-left transition ${
                    exportFormat === 'csv'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs">CSV (Excel)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Excel, Numbers ve LibreOffice uyumlu. UTF-8 BOM ve formül enjeksiyon korumalı.
                  </p>
                </button>

                {/* PDF */}
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-xl border text-left transition ${
                    exportFormat === 'pdf'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-xs">PDF Belgesi</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Resmi A4 yatay UYAP dava fihristi. Yazdırmaya ve PDF kaydetmeye hazır.
                  </p>
                </button>

                {/* Offline HTML */}
                <button
                  type="button"
                  onClick={() => setExportFormat('html')}
                  className={`p-3 rounded-xl border text-left transition ${
                    exportFormat === 'html'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-sky-500" />
                    <span className="font-bold text-xs">Çevrimdışı HTML</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    İnternetsiz açılabilir, bağımsız taşınabilir tek dosya web raporu.
                  </p>
                </button>
              </div>
            </div>

            {/* Customization & Data Privacy Toggles */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                3. Alan ve Gizlilik Tercihleri:
              </label>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeContactDetails}
                    onChange={(e) => setIncludeContactDetails(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold">Müvekkil İletişim Bilgileri</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Telefon numarası, e-posta adresi ve kayıtlı müvekkil adresi sütunları
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeFinancialValues}
                    onChange={(e) => setIncludeFinancialValues(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold">Dava Uyuşmazlık Değerleri</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Dava değeri (TL/Döviz) ve talep edilen alacak tutarları
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeEvidenceCount}
                    onChange={(e) => setIncludeEvidenceCount(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold">Delil ve Evrak Sayıları</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Her dosyaya ait kayıtlı PDF/UDF evrak ve delil listesi adetleri
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={includePrivacySeal}
                    onChange={(e) => setIncludePrivacySeal(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold">Resmi Kaşe / İmza ve Bütünlük Mührü</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Avukatlık Kanunu m. 36 gizlilik şerhi ve yerel SHA bütünlük doğrulama kodu
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Privacy & Zero-Data-Leak Guarantee */}
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Tamamen Yerel ve Güvenli İşlem:</strong> Dışa aktarma işlemi %100 tarayıcınızın yerel belleğinde (Client-side Blob / Print API) gerçekleştirilir. Müvekkillerinizin kimlik numaraları, dava içerikleri ve iletişim bilgileri kesinlikle hiçbir uzak sunucuya veya üçüncü taraf servise gönderilmez.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Seçilen:{' '}
                <strong>
                  {exportScope === 'filtered' ? filteredCases.length : allCases.length} Dosya
                </strong>
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleExecuteExport}
                  disabled={isExporting || (exportScope === 'filtered' ? filteredCases.length === 0 : allCases.length === 0)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>İşleniyor...</span>
                    </>
                  ) : exportFormat === 'pdf' ? (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF Olarak Yazdır / Kaydet</span>
                    </>
                  ) : exportFormat === 'csv' ? (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Güvenli CSV İndir</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>HTML Raporu İndir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ÖNERİLERİN TAMAMINI GÖSTER (ALL PORTFOLIO SUGGESTIONS & SEARCH DIRECTORY) */}
      {showAllSuggestionsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-amber-500/40 dark:border-slate-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>Portföy Arama & Filtreleme Önerileri Rehberi</span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                      {allPortfolioSuggestions.all.length} Tam Öneri Listesi
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Esas numaraları, müvekkiller, karşı taraflar, görevli mahkemeler, safahatlar ve evrak türleri dahil eksiksiz fihrist
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAllSuggestionsModal(false);
                  setSuggestionsModalSearch('');
                  setSuggestionsModalTab('all');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search & Filter Controls inside Modal */}
            <div className="space-y-2 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={suggestionsModalSearch}
                  onChange={(e) => setSuggestionsModalSearch(e.target.value)}
                  placeholder="Öneriler içinde hızlıca ara (örn. 2024, Ticaret, Fatura, Şirket)..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition font-medium"
                />
                {suggestionsModalSearch && (
                  <button
                    type="button"
                    onClick={() => setSuggestionsModalSearch('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Tümü ({allPortfolioSuggestions.all.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('cases')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'cases'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Esas No ({allPortfolioSuggestions.cases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('clients')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'clients'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Müvekkiller ({allPortfolioSuggestions.clients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('opponents')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'opponents'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Karşı Taraflar ({allPortfolioSuggestions.opponents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('courts')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'courts'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Mahkemeler ({allPortfolioSuggestions.courts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('courtTypes')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'courtTypes'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Mahkeme Türleri ({allPortfolioSuggestions.courtTypes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('tags')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'tags'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Safahat & Durum ({allPortfolioSuggestions.tags.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestionsModalTab('files')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    suggestionsModalTab === 'files'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Evrak / Delil ({allPortfolioSuggestions.fileTypes.length})
                </button>
              </div>
            </div>

            {/* Scrollable Body: Categorized Suggestions */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-xs">
              {/* Category 1: Esas Numaraları (Dava Dosyaları) */}
              {(suggestionsModalTab === 'all' || suggestionsModalTab === 'cases') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>Dava Esas Numaraları ({allPortfolioSuggestions.cases.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Tıklayınca doğrudan filtreler</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allPortfolioSuggestions.cases
                      .filter((sug) =>
                        !suggestionsModalSearch ||
                        sug.label.toLowerCase().includes(suggestionsModalSearch.toLowerCase()) ||
                        sug.secondary.toLowerCase().includes(suggestionsModalSearch.toLowerCase())
                      )
                      .map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            sug.action();
                            setShowAllSuggestionsModal(false);
                            setSuggestionsModalSearch('');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-500/40 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
                              {sug.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold">
                              Esas No
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                            {sug.secondary}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Category 2: Müvekkiller */}
              {(suggestionsModalTab === 'all' || suggestionsModalTab === 'clients') && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold text-sky-800 dark:text-sky-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-500" />
                      <span>Kayıtlı Müvekkiller ({allPortfolioSuggestions.clients.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Müvekkile ait davaları listeler</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allPortfolioSuggestions.clients
                      .filter((sug) =>
                        !suggestionsModalSearch ||
                        sug.label.toLowerCase().includes(suggestionsModalSearch.toLowerCase()) ||
                        sug.secondary.toLowerCase().includes(suggestionsModalSearch.toLowerCase())
                      )
                      .map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            sug.action();
                            setShowAllSuggestionsModal(false);
                            setSuggestionsModalSearch('');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-500/40 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                              {sug.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-bold">
                              Müvekkil
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                            {sug.secondary}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Category 3: Karşı Taraflar (Opponents) */}
              {(suggestionsModalTab === 'all' || suggestionsModalTab === 'opponents') && allPortfolioSuggestions.opponents.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-rose-500" />
                      <span>Karşı Taraflar & Davalı/Davacı Hasım ({allPortfolioSuggestions.opponents.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Karşı tarafa göre filtreler</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allPortfolioSuggestions.opponents
                      .filter((sug) =>
                        !suggestionsModalSearch ||
                        sug.label.toLowerCase().includes(suggestionsModalSearch.toLowerCase()) ||
                        sug.secondary.toLowerCase().includes(suggestionsModalSearch.toLowerCase())
                      )
                      .map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            sug.action();
                            setShowAllSuggestionsModal(false);
                            setSuggestionsModalSearch('');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-500/40 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                              {sug.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-bold shrink-0">
                              Karşı Taraf
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                            {sug.secondary}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Category 4: Görevli Mahkemeler */}
              {(suggestionsModalTab === 'all' || suggestionsModalTab === 'courts') && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-500" />
                      <span>Görevli Mahkemeler ({allPortfolioSuggestions.courts.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Mahkemeye göre filtreler</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allPortfolioSuggestions.courts
                      .filter((sug) =>
                        !suggestionsModalSearch ||
                        sug.label.toLowerCase().includes(suggestionsModalSearch.toLowerCase()) ||
                        sug.secondary.toLowerCase().includes(suggestionsModalSearch.toLowerCase())
                      )
                      .map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            sug.action();
                            setShowAllSuggestionsModal(false);
                            setSuggestionsModalSearch('');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/40 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {sug.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold shrink-0">
                              Mahkeme
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                            {sug.secondary}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Category 5: Mahkeme Türleri */}
              {(suggestionsModalTab === 'all' || suggestionsModalTab === 'courtTypes') && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold text-purple-800 dark:text-purple-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-500" />
                      <span>Mahkeme Türleri & Uzmanlık Alanları ({allPortfolioSuggestions.courtTypes.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Yargı koluna göre filtreler</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {allPortfolioSuggestions.courtTypes
                      .filter((sug) =>
                        !suggestionsModalSearch ||
                        sug.label.toLowerCase().includes(suggestionsModalSearch.toLowerCase()) ||
                        sug.secondary.toLowerCase().includes(suggestionsModalSearch.toLowerCase())
                      )
                      .map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            sug.action();
                            setShowAllSuggestionsModal(false);
                            setSuggestionsModalSearch('');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-500/40 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                              {sug.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold shrink-0">
                              Yargı Dalı
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                            {sug.secondary}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Category 6: Durum ve Safahat Filtreleri */}
              {(suggestionsModalTab === 'all' || suggestionsModalTab === 'tags') && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold text-indigo-800 dark:text-indigo-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-indigo-500" />
                      <span>Dava Durum & Safahat Önerileri ({allPortfolioSuggestions.tags.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Aciliyet ve yargılama aşaması</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allPortfolioSuggestions.tags
                      .filter((sug) =>
                        !suggestionsModalSearch ||
                        sug.label.toLowerCase().includes(suggestionsModalSearch.toLowerCase()) ||
                        sug.secondary.toLowerCase().includes(suggestionsModalSearch.toLowerCase())
                      )
                      .map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            sug.action();
                            setShowAllSuggestionsModal(false);
                            setSuggestionsModalSearch('');
                          }}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-500/40 text-left transition group cursor-pointer"
                        >
                          <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {sug.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {sug.secondary}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Category 7: Evrak ve Delil Türleri */}
              {(suggestionsModalTab === 'all' || suggestionsModalTab === 'files') && allPortfolioSuggestions.fileTypes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold text-teal-800 dark:text-teal-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-500" />
                      <span>Evrak & Delil Belgesi Türleri ({allPortfolioSuggestions.fileTypes.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Belge türüne göre filtreler</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {allPortfolioSuggestions.fileTypes
                      .filter((sug) =>
                        !suggestionsModalSearch ||
                        sug.label.toLowerCase().includes(suggestionsModalSearch.toLowerCase()) ||
                        sug.secondary.toLowerCase().includes(suggestionsModalSearch.toLowerCase())
                      )
                      .map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            sug.action();
                            setShowAllSuggestionsModal(false);
                            setSuggestionsModalSearch('');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-500/40 text-left transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 truncate">
                              {sug.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-bold shrink-0">
                              Evrak
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                            {sug.secondary}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setShowAllSuggestionsModal(false);
                  setSuggestionsModalSearch('');
                }}
                className="text-amber-700 dark:text-amber-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tüm Filtreleri Sıfırla</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAllSuggestionsModal(false);
                  setSuggestionsModalSearch('');
                  setSuggestionsModalTab('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST: CASE INFO COPIED TO CLIPBOARD */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-300 flex items-center gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>Dava Bilgileri Kopyalandı</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 dark:text-emerald-700">
                  Panoda
                </span>
              </div>
              <p className="text-[11px] text-slate-300 dark:text-slate-600 truncate mt-0.5">
                <strong>{copyToast.caseNumber}</strong> • {copyToast.clientName} ({copyToast.statusText})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCopyToast(null)}
              className="text-slate-400 hover:text-white dark:hover:text-slate-800 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOAST: PERMANENT CASE DELETION */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-rose-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-rose-800 flex items-center gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-rose-200">
                <span>Dava Dosyası Kalıcı Olarak Silindi</span>
              </div>
              <p className="text-[11px] text-rose-300/90 truncate mt-0.5">
                <strong>{deleteToast.caseNumber}</strong> no'lu dosya ({deleteToast.clientName}) portföyden kaldırıldı.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteToast(null)}
              className="text-rose-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOAST: EXPORT NOTIFICATION */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-emerald-900 text-emerald-100 dark:bg-emerald-950 dark:text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>Dışa Aktarma Başarılı</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
                  {exportToast.format}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 truncate mt-0.5">
                {exportToast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExportToast(null)}
              className="text-emerald-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
