import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Share2,
  ExternalLink,
  Gavel,
  FileText,
  Filter,
  Check,
  Copy,
  Info,
  Scale,
  Sparkles,
  ArrowRight,
  Search,
  FolderOpen,
  CalendarDays,
  ListFilter,
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  ClientItem,
  ClientCase,
  updateCaseHearingDate,
  subscribeToClientUpdates,
  getClientList
} from '../services/clientCaseStore';

export interface TimelineDeadlineItem {
  id: string;
  caseId?: string;
  clientId?: string;
  caseNumber: string;
  court: string;
  clientName: string;
  opponentName?: string;
  title: string;
  category: 'HEARING' | 'DEADLINE' | 'PROCEDURAL' | 'STATUTE';
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  lawReference?: string;
  consequence?: string;
  status: 'URGENT' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED';
  daysRemaining: number;
  isCaseHearing?: boolean;
  notes?: string;
  source: 'case_hearing' | 'case_stage' | 'manual_event';
}

interface HomeCaseTimelineProps {
  lawyerName: string;
  lawyerSicilNo: string;
  clients: ClientItem[];
  onOpenCase?: (clientId?: string, caseId?: string) => void;
  onNavigateToPetition?: (draftNote: string) => void;
  onNavigateToFullTimeline?: () => void;
}

const STORAGE_KEY = 'ultra_hukuk_case_timeline_events';

export function HomeCaseTimeline({
  lawyerName,
  lawyerSicilNo,
  clients,
  onOpenCase,
  onNavigateToPetition,
  onNavigateToFullTimeline
}: HomeCaseTimelineProps) {
  // View mode: 'stream' | 'calendar' | 'matrix'
  const [activeView, setActiveView] = useState<'stream' | 'calendar' | 'matrix'>('stream');
  
  // Filter state
  const [filterType, setFilterType] = useState<'ALL' | 'URGENT' | 'HEARING' | 'DEADLINE' | 'COMPLETED'>('ALL');
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date(2026, 8, 25)); // Sept 2026 current app time
  const [selectedCalendarDayStr, setSelectedCalendarDayStr] = useState<string>('2026-09-28');

  // Manual & persisted custom events
  const [manualEvents, setManualEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load manual timeline events:', e);
    }
    return [];
  });

  // Persist manual events
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(manualEvents));
    } catch (e) {
      console.warn('Failed to save manual timeline events:', e);
    }
  }, [manualEvents]);

  // Modal State for Adding New Deadline / Hearing
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCaseId, setNewCaseId] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<TimelineDeadlineItem['category']>('DEADLINE');
  const [newDate, setNewDate] = useState<string>('2026-10-05');
  const [newTime, setNewTime] = useState<string>('10:00');
  const [newLawRef, setNewLawRef] = useState<string>('HMK m. 281');
  const [newConsequence, setNewConsequence] = useState<string>('2 haftalık kesin süre içinde itiraz edilmezse rapor hükme esas alınır.');
  const [newNotes, setNewNotes] = useState<string>('');
  const [calcNoticeDate, setCalcNoticeDate] = useState<string>('2026-09-25');
  const [calcRule, setCalcRule] = useState<string>('hmk_281');

  // Copy feedback state
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // All Cases list flat (excluding archived cases to keep timeline clutter-free)
  const allCasesFlat = useMemo(() => {
    const list: { client: ClientItem; caseItem: ClientCase }[] = [];
    clients.forEach((cli) => {
      (cli.cases || []).forEach((cs) => {
        if (!cs.isArchived) {
          list.push({ client: cli, caseItem: cs });
        }
      });
    });
    return list;
  }, [clients]);

  // Aggregate and dynamically calculate timeline events
  const aggregatedEvents = useMemo(() => {
    const items: TimelineDeadlineItem[] = [];
    const today = new Date(2026, 8, 25); // Sept 25, 2026 current app baseline
    today.setHours(0, 0, 0, 0);

    // Helper: calculate remaining days and status
    const calculateDaysAndStatus = (dateStr: string, manualStatus?: string) => {
      if (manualStatus === 'COMPLETED') {
        return { days: 0, status: 'COMPLETED' as const };
      }
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      let status: TimelineDeadlineItem['status'] = 'UPCOMING';
      if (days < 0) {
        status = 'EXPIRED';
      } else if (days <= 3) {
        status = 'URGENT';
      } else if (days <= 7) {
        status = 'URGENT';
      }
      return { days, status };
    };

    // 1. Dynamic Events from Cases: Next Hearing Dates
    allCasesFlat.forEach(({ client, caseItem }) => {
      if (caseItem.nextHearingDate) {
        const { days, status } = calculateDaysAndStatus(caseItem.nextHearingDate);
        items.push({
          id: `case-hearing-${caseItem.id}`,
          caseId: caseItem.id,
          clientId: client.id,
          caseNumber: caseItem.caseNumber,
          court: caseItem.court,
          clientName: client.fullName,
          opponentName: caseItem.opponentName,
          title: `${caseItem.caseNumber} Duruşma / Sözlü Yargılama Celsesi`,
          category: 'HEARING',
          date: caseItem.nextHearingDate,
          time: '10:30',
          lawReference: 'HMK m. 147 & 186',
          consequence: 'Duruşmaya mazeretsiz katılınmaması halinde HMK 150 gereği dosya işlemden kaldırılabilir.',
          status,
          daysRemaining: days,
          isCaseHearing: true,
          notes: `Safahat: ${caseItem.stage}. Karşı Taraf: ${caseItem.opponentName}`,
          source: 'case_hearing'
        });
      }

      // If case has opening date & stage, optionally generate procedural milestone
      if (caseItem.openedDate && caseItem.stage === 'Dava Açılışı & Tensip') {
        // Tensip tebliğ + 2 hafta cevap süresi
        const openD = new Date(caseItem.openedDate);
        const replyD = new Date(openD);
        replyD.setDate(replyD.getDate() + 14);
        const replyStr = replyD.toISOString().split('T')[0];
        const { days, status } = calculateDaysAndStatus(replyStr);

        items.push({
          id: `case-stage-reply-${caseItem.id}`,
          caseId: caseItem.id,
          clientId: client.id,
          caseNumber: caseItem.caseNumber,
          court: caseItem.court,
          clientName: client.fullName,
          opponentName: caseItem.opponentName,
          title: `Cevap Dilekçesi Verme ve İlk İtiraz Süresi`,
          category: 'DEADLINE',
          date: replyStr,
          time: '17:00',
          lawReference: 'HMK m. 122 & 127',
          consequence: '2 haftalık kesin süre içinde cevap verilmezse davacının dava dilekçesindeki vakıalar inkar edilmiş sayılır.',
          status,
          daysRemaining: days,
          notes: `Tensip zaptı tebliğine istinaden hesaplanan kanuni yasal cevap süresi.`,
          source: 'case_stage'
        });
      }
    });

    // 2. Manual & Custom Events stored in localStorage
    manualEvents.forEach((ev: any) => {
      const { days, status } = calculateDaysAndStatus(ev.date, ev.status);
      
      // Match case info if available
      const matchingCase = allCasesFlat.find(
        (c) => c.caseItem.caseNumber === ev.caseNo || c.caseItem.id === ev.caseId
      );

      items.push({
        id: ev.id,
        caseId: matchingCase?.caseItem.id || ev.caseId,
        clientId: matchingCase?.client.id || ev.clientId,
        caseNumber: ev.caseNo || matchingCase?.caseItem.caseNumber || 'Genel Usul',
        court: ev.court || matchingCase?.caseItem.court || 'Yetkili Mahkeme',
        clientName: matchingCase?.client.fullName || ev.clientName || lawyerName,
        opponentName: matchingCase?.caseItem.opponentName || ev.opponentName,
        title: ev.title || 'Usuli Süre / Duruşma',
        category: ev.category || 'DEADLINE',
        date: ev.date,
        time: ev.time || '10:00',
        lawReference: ev.lawReference || 'HMK',
        consequence: ev.consequence || 'Yasal süre kaçırılması halinde usuli hak düşer.',
        status: ev.status === 'COMPLETED' ? 'COMPLETED' : status,
        daysRemaining: days,
        notes: ev.notes,
        source: 'manual_event'
      });
    });

    // Sort chronologically ascending
    return items.sort((a, b) => {
      if (a.date === b.date) {
        return (a.time || '').localeCompare(b.time || '');
      }
      return a.date.localeCompare(b.date);
    });
  }, [allCasesFlat, manualEvents, lawyerName]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return aggregatedEvents.filter((item) => {
      // Type Filter
      if (filterType === 'URGENT' && item.status !== 'URGENT') return false;
      if (filterType === 'HEARING' && item.category !== 'HEARING') return false;
      if (filterType === 'DEADLINE' && item.category !== 'DEADLINE' && item.category !== 'STATUTE' && item.category !== 'PROCEDURAL') return false;
      if (filterType === 'COMPLETED' && item.status !== 'COMPLETED') return false;

      // Case Filter
      if (selectedCaseFilter !== 'ALL' && item.caseNumber !== selectedCaseFilter) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.caseNumber.toLowerCase().includes(q) ||
          item.court.toLowerCase().includes(q) ||
          item.clientName.toLowerCase().includes(q) ||
          (item.lawReference || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [aggregatedEvents, filterType, selectedCaseFilter, searchQuery]);

  // Statistics counters for tabs
  const stats = useMemo(() => {
    const total = aggregatedEvents.length;
    const urgent = aggregatedEvents.filter((e) => e.status === 'URGENT').length;
    const hearings = aggregatedEvents.filter((e) => e.category === 'HEARING').length;
    const deadlines = aggregatedEvents.filter((e) => e.category === 'DEADLINE' || e.category === 'STATUTE').length;
    const completed = aggregatedEvents.filter((e) => e.status === 'COMPLETED').length;
    return { total, urgent, hearings, deadlines, completed };
  }, [aggregatedEvents]);

  // Toggle Completion
  const handleToggleComplete = (eventId: string) => {
    // If it's a manual event, toggle in manualEvents
    const isManual = manualEvents.some((e) => e.id === eventId);
    if (isManual) {
      setManualEvents((prev) =>
        prev.map((e) => {
          if (e.id === eventId) {
            return {
              ...e,
              status: e.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED'
            };
          }
          return e;
        })
      );
    } else {
      // Convert to completed record in manualEvents
      const item = aggregatedEvents.find((e) => e.id === eventId);
      if (item) {
        setManualEvents((prev) => [
          ...prev.filter((e) => e.id !== eventId),
          {
            ...item,
            id: eventId,
            status: item.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED'
          }
        ]);
      }
    }
  };

  // Delete Event
  const handleDeleteEvent = (eventId: string) => {
    setManualEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // Procedural Deadline Calculator for Modal
  const calculateDeadlineFromRule = (noticeDateStr: string, rule: string) => {
    const base = new Date(noticeDateStr);
    if (isNaN(base.getTime())) return new Date();
    const result = new Date(base);

    switch (rule) {
      case 'hmk_281': // Bilirkişi raporuna itiraz: 2 Hafta
      case 'hmk_122': // Cevap dilekçesi: 2 Hafta
      case 'hmk_345': // İstinaf başvuru süresi: 2 Hafta
      case 'hmk_361': // Temyiz başvuru süresi: 2 Hafta
        result.setDate(result.getDate() + 14);
        break;
      case 'hmk_394': // İhtiyati tedbire itiraz: 1 Hafta
        result.setDate(result.getDate() + 7);
        break;
      case 'is_kanunu': // İşe iade: 1 Ay
        result.setMonth(result.getMonth() + 1);
        break;
      case 'tbk_72': // Haksız fiil: 2 Yıl
        result.setFullYear(result.getFullYear() + 2);
        break;
      case 'tbk_146': // Genel zamanaşımı: 10 Yıl
        result.setFullYear(result.getFullYear() + 10);
        break;
      default:
        result.setDate(result.getDate() + 14);
    }

    // HMK m. 93 Hafta sonu kuralı (Cumartesi/Pazar -> Pazartesi)
    const day = result.getDay();
    if (day === 6) result.setDate(result.getDate() + 2);
    else if (day === 0) result.setDate(result.getDate() + 1);

    // HMK m. 104 Adli Tatil kuralı (20 Temmuz - 31 Ağustos arasına denk gelirse -> 7 Eylül)
    const month = result.getMonth(); // 6: July, 7: Aug
    const dt = result.getDate();
    if ((month === 6 && dt >= 20) || month === 7) {
      result.setMonth(8); // Sept
      result.setDate(7);
    }

    return result;
  };

  const handleApplyRuleCalculation = () => {
    const computed = calculateDeadlineFromRule(calcNoticeDate, calcRule);
    const dateStr = computed.toISOString().split('T')[0];
    setNewDate(dateStr);

    if (calcRule === 'hmk_281') {
      setNewTitle('Bilirkişi Raporuna İtiraz ve Ek Rapor Talebi');
      setNewLawRef('HMK m. 281');
      setNewConsequence('2 haftalık kesin süre içinde itiraz edilmezse rapor hükme esas alınır.');
    } else if (calcRule === 'hmk_122') {
      setNewTitle('Cevap Dilekçesi Verme ve İlk İtirazlar');
      setNewLawRef('HMK m. 122');
      setNewConsequence('Süresinde cevap verilmezse davacının vakıaları inkar edilmiş sayılır.');
    } else if (calcRule === 'hmk_345') {
      setNewTitle('İstinaf Kanun Yoluna Başvuru Dilekçesi');
      setNewLawRef('HMK m. 345');
      setNewConsequence('Gerekçeli kararın tebliğinden itibaren 2 haftada istinaf edilmezse karar kesinleşir.');
    } else if (calcRule === 'hmk_394') {
      setNewTitle('İhtiyati Tedbir Kararına İtiraz');
      setNewLawRef('HMK m. 394');
      setNewConsequence('1 haftalık yasal sürede itiraz edilmezse tedbir infazı kesinleşir.');
    }
  };

  // Add new event submit handler
  const handleAddNewEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    let targetCase = allCasesFlat.find((c) => c.caseItem.id === newCaseId);
    if (!targetCase && allCasesFlat.length > 0) {
      targetCase = allCasesFlat[0];
    }

    const newEv = {
      id: `ev-${Date.now()}`,
      caseId: targetCase?.caseItem.id,
      clientId: targetCase?.client.id,
      caseNo: targetCase?.caseItem.caseNumber || 'Genel Usul',
      court: targetCase?.caseItem.court || 'Yetkili Mahkeme',
      clientName: targetCase?.client.fullName || lawyerName,
      opponentName: targetCase?.caseItem.opponentName,
      title: newTitle.trim(),
      category: newCategory,
      date: newDate,
      time: newTime || '10:00',
      lawReference: newLawRef.trim() || 'HMK',
      consequence: newConsequence.trim() || 'Yasal kesin sürenin kaçırılması halinde usuli hak düşer.',
      notes: newNotes.trim(),
      status: 'UPCOMING'
    };

    setManualEvents((prev) => [newEv, ...prev]);

    // If it's a hearing date and a case is selected, update the case in clientCaseStore!
    if (newCategory === 'HEARING' && targetCase) {
      updateCaseHearingDate(targetCase.client.id, targetCase.caseItem.id, newDate);
    }

    // Reset and close
    setShowAddModal(false);
    setNewTitle('');
    setNewNotes('');
  };

  // Export UYAP / Official Calendar Summary
  const handleExportSummary = () => {
    const header = `========================================================================
T.C. ADALET BAKANLIĞI UYAP / AVUKAT SÜRE & DURUŞMA İCMAL ÇİZELGESİ
Yetkili Avukat: ${lawyerName} (Baro Sicil No: ${lawyerSicilNo})
Rapor Alma Tarihi: ${new Date().toLocaleString('tr-TR')}
Toplam Kayıtlı Süre & Duruşma Sayısı: ${aggregatedEvents.length}
========================================================================\n\n`;

    const body = aggregatedEvents
      .map((ev, i) => {
        return `[#${i + 1}] TARİH: ${ev.date} ${ev.time || ''} | KALAN SÜRE: ${ev.daysRemaining >= 0 ? `${ev.daysRemaining} Gün Kaldı` : 'GECİKMİŞ'}
Dava / Esas No: ${ev.caseNumber}
Mahkeme: ${ev.court}
Müvekkil: ${ev.clientName} | Karşı Taraf: ${ev.opponentName || 'Belirtilmedi'}
İşlem Türü: ${ev.category} - ${ev.title}
Mevzuat Dayanağı: ${ev.lawReference || 'HMK'}
Usuli Sonuç / Risk: ${ev.consequence || 'Yasal hak düşer.'}
Durum: ${ev.status}
${ev.notes ? `Özel Not: ${ev.notes}` : ''}
------------------------------------------------------------------------`;
      })
      .join('\n\n');

    const full = header + body;
    const blob = new Blob([full], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Av_${lawyerSicilNo}_UYAP_Sure_Icmali_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const text = aggregatedEvents
      .map(
        (e) =>
          `• ${e.date} (${e.daysRemaining >= 0 ? `${e.daysRemaining} gün` : 'Gecikmiş'}): [${e.caseNumber}] ${e.title} - ${e.court} (${e.lawReference || 'HMK'})`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNotification('Süre ve duruşma özeti panoya kopyalandı.');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Prepare petition action
  const handleDraftPetitionForEvent = (event: TimelineDeadlineItem) => {
    const draftNote = `T.C. ${event.court}\nESAS NO: ${event.caseNumber}\nDAVACI (MÜVEKKİL): ${event.clientName}\nDAVALI: ${event.opponentName || 'Karşı Taraf'}\nKONU: ${event.title} (${event.lawReference || 'HMK'})\n\nUSULİ İŞLEM VE AÇIKLAMA:\nİşbu dava dosyasında tebliğ olunan ${event.title} kapsamında ${event.lawReference || 'HMK'} uyarınca yasal süresi içinde beyan ve itirazlarımızın sunulmasıdır.\n\nSÜRE VE USUL RİSKİ: ${event.consequence || ''}\nTarih: ${event.date}`;
    if (onNavigateToPetition) {
      onNavigateToPetition(draftNote);
    }
  };

  // Calendar Helpers (Month calculations)
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const startOffset = (firstDayOfWeek + 6) % 7; // Monday = 0

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Events grouped by date for the calendar
  const eventsByDate = useMemo(() => {
    const map: Record<string, TimelineDeadlineItem[]> = {};
    aggregatedEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [aggregatedEvents]);

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 transition-all">
      {/* Top Header & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          {/* Clean Unboxed Metadata with typographic separators */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex-wrap">
            <span className="font-semibold text-amber-700 dark:text-amber-400">UYAP Dava & Duruşma Radarı</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {allCasesFlat.length} Aktif Dosya Takipte
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">HMK 93 & 104 Usul Takvimi Aktif</span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <span>Dava Süreleri ve Duruşma Zaman Çizelgesi</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Av. {lawyerName} adına kayıtlı tüm dava dosyalarının duruşma günleri, bilirkişi itirazları ve hak düşürücü yasal süreleri dinamik olarak takip edilmektedir.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
          {/* View Mode Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveView('stream')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'stream'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Zaman Çizelgesi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Aylık Takvim</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Risk Tablosu</span>
            </button>
          </div>

          {/* Add New Deadline Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Yeni Duruşma veya Yasal Süre Tanımla"
          >
            <Plus className="w-4 h-4" />
            <span>+ Süre / Duruşma Ekle</span>
          </button>

          {/* Export & Copy dropdown / buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition"
              title="Özeti Kopyala"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportSummary}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition"
              title="UYAP Süre İcmalini TXT Olarak İndir"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Copied Notification Toast */}
      {copiedNotification && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Filter and Search Bar (Single-Line Controls & Segmented Filters) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Filters (Segmented interactive buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs scrollbar-thin">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Tüm Olaylar ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('URGENT')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'URGENT'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kritik (≤7 Gün) ({stats.urgent})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('HEARING')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'HEARING'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Duruşmalar ({stats.hearings})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('DEADLINE')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'DEADLINE'
                ? 'bg-sky-600 text-white font-bold shadow-sm'
                : 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40 hover:bg-sky-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Usuli Süreler ({stats.deadlines})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tamamlananlar ({stats.completed})</span>
          </button>
        </div>

        {/* Case Selector Dropdown & Live Search */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          {/* Case Dropdown */}
          <select
            value={selectedCaseFilter}
            onChange={(e) => setSelectedCaseFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium max-w-[170px] truncate"
            title="Dava Dosyasına Göre Filtrele"
          >
            <option value="ALL">Tüm Dava Dosyaları</option>
            {allCasesFlat.map(({ caseItem, client }) => (
              <option key={caseItem.id} value={caseItem.caseNumber}>
                {caseItem.caseNumber} - {client.fullName}
              </option>
            ))}
          </select>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ara (Esas, konu, kanun)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 w-36 sm:w-44 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          VIEW 1: INTERACTIVE TIMELINE STREAM (DEFAULT)
          ======================================================== */}
      {activeView === 'stream' && (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            /* Empty State */
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {searchQuery || selectedCaseFilter !== 'ALL' || filterType !== 'ALL'
                    ? 'Filtreye uygun yaklaşan süre veya duruşma bulunamadı.'
                    : 'Henüz kayıtlı bir duruşma veya yasal süre bulunmuyor.'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Dava dosyalarınıza duruşma tarihi atayabilir veya HMK uyarınca bilirkişi itirazı, cevap dilekçesi gibi yasal süreleri tek tıkla tanımlayabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ İlk Duruşma veya Süreyi Tanımla</span>
              </button>
            </div>
          ) : (
            /* Chronological Timeline Track */
            <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 space-y-4">
              {filteredEvents.map((item) => {
                const isUrgent = item.status === 'URGENT';
                const isCompleted = item.status === 'COMPLETED';
                const isExpired = item.status === 'EXPIRED';

                return (
                  <div
                    key={item.id}
                    className={`relative bg-white dark:bg-[#131d31] border rounded-2xl p-4 sm:p-5 transition-all shadow-sm hover:shadow-md ${
                      isCompleted
                        ? 'border-emerald-500/30 opacity-75 bg-slate-50/50 dark:bg-slate-900/50'
                        : isUrgent
                        ? 'border-rose-500/40 bg-gradient-to-r from-rose-500/[0.04] to-transparent'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Node Dot on Timeline Spine */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 sm:w-7 sm:h-7 -translate-x-1/2 rounded-full border-2 flex items-center justify-center text-white shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-600 border-white dark:border-[#111827]'
                          : isUrgent
                          ? 'bg-rose-600 border-white dark:border-[#111827] ring-4 ring-rose-500/20 animate-pulse'
                          : item.category === 'HEARING'
                          ? 'bg-amber-600 border-white dark:border-[#111827]'
                          : 'bg-sky-600 border-white dark:border-[#111827]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : item.category === 'HEARING' ? (
                        <Gavel className="w-3.5 h-3.5 text-white" />
                      ) : isUrgent ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>

                    {/* Card Content Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        {/* Clean Metadata Line (Zero-Pill Discipline) */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            {item.caseNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {item.court}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            Müvekkil: <strong className="text-slate-800 dark:text-slate-200">{item.clientName}</strong>
                          </span>
                          {item.opponentName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                Karşı: {item.opponentName}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title and Category */}
                        <h4
                          className={`text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap ${
                            isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          <span>{item.title}</span>
                          {item.category === 'HEARING' && (
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              Duruşma Celsesi
                            </span>
                          )}
                          {item.category === 'DEADLINE' && (
                            <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                              Usuli Kesin Süre
                            </span>
                          )}
                        </h4>
                      </div>

                      {/* Right Date and Urgency Countdown */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span className="tabular-nums">{item.date}</span>
                          {item.time && (
                            <span className="text-slate-400 tabular-nums">· {item.time}</span>
                          )}
                        </div>

                        <div className="font-mono text-xs font-bold tabular-nums">
                          {isCompleted ? (
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> İfa Edildi
                            </span>
                          ) : isExpired ? (
                            <span className="text-slate-400">Süresi Geçti</span>
                          ) : item.daysRemaining === 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> BUGÜN!
                            </span>
                          ) : item.daysRemaining <= 3 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {item.daysRemaining} Gün Kaldı
                            </span>
                          ) : item.daysRemaining <= 7 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {item.daysRemaining} Gün Kaldı
                            </span>
                          ) : (
                            <span className="text-sky-600 dark:text-sky-400">
                              +{item.daysRemaining} Gün
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Consequence & Legal Reference Warning Box */}
                    {(item.consequence || item.lawReference) && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold">
                            <Scale className="w-3 h-3" />
                            Dayanak: {item.lawReference || 'HMK Hükümleri'}
                          </span>
                          <span>Yasal Hak Düşürücü Süre Takibi</span>
                        </div>
                        {item.consequence && (
                          <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                            <strong className="text-rose-600 dark:text-rose-400 font-semibold">Usuli Risk: </strong>
                            {item.consequence}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] italic">
                            Not: {item.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Bar (Zero Dead Clicks) */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2">
                        {/* Mark complete toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                            isCompleted
                              ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Tamamlandı (Geri Al)' : 'Tamamlandı Olarak İşaretle'}</span>
                        </button>

                        {/* Open Case file */}
                        {item.clientId && item.caseId && onOpenCase && (
                          <button
                            type="button"
                            onClick={() => onOpenCase(item.clientId, item.caseId)}
                            className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-semibold transition flex items-center gap-1.5"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Dosyayı İncele</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Draft Petition Shortcut */}
                        {onNavigateToPetition && (
                          <button
                            type="button"
                            onClick={() => handleDraftPetitionForEvent(item)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="Bu süre için dilekçe taslağı hazırla"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Dilekçe Hazırla</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {/* Delete if manual event */}
                        {item.source === 'manual_event' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(item.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Bu kaydı sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW 2: MONTHLY CALENDAR MATRIX VIEW
          ======================================================== */}
      {activeView === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Month Grid (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-500" />
                <span>
                  {monthNames[currentMonth]} {currentYear}
                </span>
              </h4>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(2026, 8, 25))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1 border-b border-slate-200 dark:border-slate-800">
              <span>Pzt</span>
              <span>Sal</span>
              <span>Çar</span>
              <span>Per</span>
              <span>Cum</span>
              <span className="text-amber-600 dark:text-amber-500">Cmt</span>
              <span className="text-rose-600 dark:text-rose-500">Paz</span>
            </div>

            {/* Calendar Days Cells Grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Empty leading offsets */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="h-16 sm:h-20 rounded-xl bg-transparent opacity-30" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = eventsByDate[dateStr] || [];
                const isSelected = selectedCalendarDayStr === dateStr;
                const isToday = dateStr === '2026-09-25';
                const hasUrgent = dayEvents.some((e) => e.status === 'URGENT');
                const hasHearing = dayEvents.some((e) => e.category === 'HEARING');

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedCalendarDayStr(dateStr)}
                    className={`h-16 sm:h-20 p-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
                        : isToday
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#141d30] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono font-bold text-xs tabular-nums ${
                          isToday
                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {dayEvents.length > 0 && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasUrgent
                              ? 'bg-rose-500 animate-pulse'
                              : hasHearing
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                          }`}
                        />
                      )}
                    </div>

                    {/* Day events micro indicator list */}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                          title={`${ev.caseNumber} - ${ev.title}`}
                        >
                          {ev.caseNumber}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-mono pl-1">
                          +{dayEvents.length - 2} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Drilldown Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  <span>Günlük Adli Ajanda</span>
                </h4>
                <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                  {selectedCalendarDayStr}
                </span>
              </div>

              {/* Day Events List */}
              {eventsByDate[selectedCalendarDayStr]?.length ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {eventsByDate[selectedCalendarDayStr].map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.caseNumber}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {item.time || '10:00'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.court} • Müvekkil: <strong>{item.clientName}</strong>
                      </div>
                      {item.consequence && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                          {item.consequence}
                        </div>
                      )}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item.id)}
                          className="text-[11px] text-slate-600 dark:text-slate-300 hover:underline font-semibold"
                        >
                          {item.status === 'COMPLETED' ? 'Geri Al' : 'Tamamla'}
                        </button>
                        {onNavigateToPetition && (
                          <button
                            type="button"
                            onClick={() => handleDraftPetitionForEvent(item)}
                            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold"
                          >
                            Dilekçe Yaz →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p>Bu tarihte kayıtlı duruşma veya usuli süre bulunmuyor.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setNewDate(selectedCalendarDayStr);
                setShowAddModal(true);
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs font-semibold transition"
            >
              + Bu Güne Yeni Süre / Duruşma Ekle
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 3: EXECUTIVE USUL & RISK TABLE (MATRIX)
          ======================================================== */}
      {activeView === 'matrix' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#141d30] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tarih & Kalan Gün</th>
                <th className="py-3 px-4">Dava / Esas No</th>
                <th className="py-3 px-4">Mahkeme & Müvekkil</th>
                <th className="py-3 px-4">İşlem & Açıklama</th>
                <th className="py-3 px-4">Dayanak Kanun</th>
                <th className="py-3 px-4">Usuli Sonuç / Risk</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111827]">
              {filteredEvents.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                    item.status === 'COMPLETED' ? 'opacity-60 bg-slate-50/30' : ''
                  }`}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {item.date} {item.time && <span className="text-slate-400 text-[10px]">· {item.time}</span>}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums mt-0.5">
                      {item.status === 'COMPLETED' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tamamlandı</span>
                      ) : item.status === 'URGENT' ? (
                        <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                          {item.daysRemaining} Gün Kaldı (Acil)
                        </span>
                      ) : (
                        <span className="text-sky-600 dark:text-sky-400">+{item.daysRemaining} Gün</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {item.caseNumber}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{item.court}</div>
                    <div className="text-[11px] text-slate-500">Müvekkil: {item.clientName}</div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                    <div>{item.title}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{item.category}</span>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {item.lawReference || 'HMK'}
                  </td>

                  <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                    {item.consequence || 'Yasal kesin süre takibi.'}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(item.id)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[11px]"
                      >
                        {item.status === 'COMPLETED' ? 'Geri Al' : 'Tamamla'}
                      </button>
                      {onNavigateToPetition && (
                        <button
                          type="button"
                          onClick={() => handleDraftPetitionForEvent(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px]"
                        >
                          Dilekçe
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD NEW DEADLINE / HEARING EVENT WITH HMK PRESET CALCULATOR
          ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                <span>Yeni Duruşma veya Yasal Süre Kaydı</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* HMK Usul Hesaplama Asistanı Kutusu */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HMK Otomatik Süre Hesaplayıcı (Hafta Sonu m.93 & Adli Tatil m.104 Uyumlu)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-0.5">
                    Tebliğ / Başlangıç Tarihi:
                  </label>
                  <input
                    type="date"
                    value={calcNoticeDate}
                    onChange={(e) => setCalcNoticeDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-0.5">
                    Usul Kuralı & Süre:
                  </label>
                  <select
                    value={calcRule}
                    onChange={(e) => setCalcRule(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="hmk_281">Bilirkişi İtirazı (HMK 281 - 2 Hafta)</option>
                    <option value="hmk_122">Cevap Dilekçesi (HMK 122 - 2 Hafta)</option>
                    <option value="hmk_345">İstinaf Başvurusu (HMK 345 - 2 Hafta)</option>
                    <option value="hmk_394">İhtiyati Tedbire İtiraz (HMK 394 - 1 Hafta)</option>
                    <option value="is_kanunu">İşe İade Başvurusu (1 Ay)</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyRuleCalculation}
                className="w-full py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition"
              >
                Tarih ve Usul Şablonunu Forma Aktar
              </button>
            </div>

            {/* Event Form */}
            <form onSubmit={handleAddNewEventSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  İlgili Dava Dosyası:
                </label>
                <select
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Genel Usul / Harici Dosya</option>
                  {allCasesFlat.map(({ caseItem, client }) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.caseNumber} - {client.fullName} ({caseItem.court})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  İşlem / Süre Başlığı:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Bilirkişi Raporuna İtiraz / 2. Duruşma Celsesi"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kategori:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  >
                    <option value="DEADLINE">Usuli Kesin Süre</option>
                    <option value="HEARING">Duruşma / Celse</option>
                    <option value="PROCEDURAL">Tensip & Keşif</option>
                    <option value="STATUTE">Hak Düşürücü Süre</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Son Tarih:
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Saat:
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Mevzuat Dayanağı (Madde):
                </label>
                <input
                  type="text"
                  placeholder="Örn: HMK m. 281, TBK m. 146"
                  value={newLawRef}
                  onChange={(e) => setNewLawRef(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kaçırılması Halinde Usuli Risk / Sonuç:
                </label>
                <textarea
                  rows={2}
                  value={newConsequence}
                  onChange={(e) => setNewConsequence(e.target.value)}
                  placeholder="Örn: Süresinde itiraz edilmezse rapor bağlayıcı hale gelir."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Özel Avukat Notu:
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bilirkişi heyeti hesaplamasında faiz hesabı yanlış..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition shadow-md"
                >
                  Süreyi Kaydet ve Takvime Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
