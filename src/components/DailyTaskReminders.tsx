import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Calendar,
  ChevronRight,
  FileText,
  Gavel,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Filter,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Info,
  Layers,
  ChevronDown,
  CalendarClock
} from 'lucide-react';
import { ClientItem, ClientCase } from '../services/clientCaseStore';
import { LawyerUser } from './LawyerWorkspace';

export interface DailyTaskItem {
  id: string;
  title: string;
  actionRequired: string;
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime?: string; // e.g. "17:00"
  caseNumber?: string;
  court?: string;
  clientName?: string;
  clientId?: string;
  caseId?: string;
  category: 'HEARING' | 'PLEADINGS' | 'OBJECTION' | 'EVIDENCE' | 'LICENSE' | 'CUSTOM';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  statutoryReference?: string; // e.g. "HMK m. 281", "HMK m. 127"
  isCompleted: boolean;
  completedAt?: string;
  isCustom?: boolean;
}

interface DailyTaskRemindersProps {
  lawyer: LawyerUser;
  clients: ClientItem[];
  onOpenCase?: (clientId: string, caseId: string) => void;
  onNavigateToPetition?: (caseNumber: string, subject: string) => void;
  onNavigateToFullTimeline?: () => void;
}

// Calculate days difference relative to current reference date (anchor: 2026-09-25)
function getDaysRemaining(targetDateStr: string): number {
  try {
    const target = new Date(targetDateStr);
    // Use either current date or 2026-09-25 as reference point
    const ref = new Date();
    const effectiveYear = ref.getFullYear();
    const referenceDate = effectiveYear === 2026 ? ref : new Date(2026, 8, 25);
    
    // Normalize to midnight
    const tMs = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const rMs = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
    
    return Math.ceil((tMs - rMs) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function formatDateTurkish(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function DailyTaskReminders({
  lawyer,
  clients,
  onOpenCase,
  onNavigateToPetition,
  onNavigateToFullTimeline
}: DailyTaskRemindersProps) {
  const storageKey = `ultra_hukuk_daily_tasks_${lawyer.sicilNo}`;

  // Completed task IDs set persisted in localStorage
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`${storageKey}_completed`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom user-added tasks persisted in localStorage
  const [customTasks, setCustomTasks] = useState<DailyTaskItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`${storageKey}_custom`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active filter tab
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HEARING' | 'PLEADINGS' | 'COMPLETED'>('ALL');

  // Inline "New Task" form visibility & state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskAction, setNewTaskAction] = useState<string>('');
  const [newTaskDate, setNewTaskDate] = useState<string>('2026-09-28');
  const [newTaskPriority, setNewTaskPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [newTaskCategory, setNewTaskCategory] = useState<'PLEADINGS' | 'HEARING' | 'OBJECTION' | 'CUSTOM'>('PLEADINGS');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<string>('');

  // Persist completed tasks whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_completed`, JSON.stringify(completedTaskIds));
    } catch (e) {
      console.warn('Failed to persist completed daily tasks:', e);
    }
  }, [completedTaskIds, storageKey]);

  // Persist custom tasks whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_custom`, JSON.stringify(customTasks));
    } catch (e) {
      console.warn('Failed to persist custom daily tasks:', e);
    }
  }, [customTasks, storageKey]);

  // Generate automated time-sensitive tasks based on the current lawyer's active cases
  const derivedCaseTasks = useMemo(() => {
    const tasks: DailyTaskItem[] = [];

    clients.forEach((client) => {
      (client.cases || []).forEach((c) => {
        // Skip archived cases
        if (c.isArchived) return;

        // 1. Hearing deadline reminders
        if (c.nextHearingDate) {
          const daysLeft = getDaysRemaining(c.nextHearingDate);
          
          if (daysLeft >= 0 && daysLeft <= 45) {
            let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
            let action = 'Duruşma zaptı ve tensip evraklarını incele, UYAP mazeret kontrolü yap.';
            
            if (daysLeft <= 3) {
              priority = 'CRITICAL';
              action = 'Duruşmaya 3 günden az kaldı! Şahit beyanları ve delil listesini UYAP üzerinden son kez kontrol edin.';
            } else if (daysLeft <= 7) {
              priority = 'HIGH';
              action = 'Duruşma hazırlığı: Karşı taraf iddialarına yönelik son beyan layihasını sisteme yükleyin.';
            }

            tasks.push({
              id: `hearing-${c.id}`,
              title: `${c.court} - Duruşma Hazırlığı`,
              actionRequired: action,
              deadlineDate: c.nextHearingDate,
              deadlineTime: '09:30',
              caseNumber: c.caseNumber,
              court: c.court,
              clientName: client.fullName,
              clientId: client.id,
              caseId: c.id,
              category: 'HEARING',
              priority,
              statutoryReference: 'HMK m. 186',
              isCompleted: completedTaskIds.includes(`hearing-${c.id}`)
            });
          }
        }

        // 2. Specific case-stage statutory deadlines
        if (c.stage === 'Tahkikat & Bilirkişi') {
          // Check for Bilirkişi Raporu
          const hasReport = c.files?.some((f) => f.type === 'Bilirkişi Raporu');
          if (hasReport) {
            tasks.push({
              id: `objection-report-${c.id}`,
              title: `Bilirkişi Raporuna İtiraz & Ek Rapor Talebi (${c.caseNumber})`,
              actionRequired: 'HMK m. 281 uyarınca tebliğden itibaren 2 haftalık kesin itiraz süresi dolmadan itiraz layihasını sunun.',
              deadlineDate: '2026-09-30',
              deadlineTime: '17:00',
              caseNumber: c.caseNumber,
              court: c.court,
              clientName: client.fullName,
              clientId: client.id,
              caseId: c.id,
              category: 'OBJECTION',
              priority: 'CRITICAL',
              statutoryReference: 'HMK m. 281 (2 Hafta Kesin Süre)',
              isCompleted: completedTaskIds.includes(`objection-report-${c.id}`)
            });
          }
        } else if (c.stage === 'Dava Açılışı & Tensip') {
          tasks.push({
            id: `tensip-response-${c.id}`,
            title: `Tensip Zaptı Gereklerinin Yerine Getirilmesi (${c.caseNumber})`,
            actionRequired: 'Tensip zaptında bildirilen eksik gider avansı ve delil listesini UYAP sistemine yükleyin.',
            deadlineDate: '2026-10-05',
            deadlineTime: '17:00',
            caseNumber: c.caseNumber,
            court: c.court,
            clientName: client.fullName,
            clientId: client.id,
            caseId: c.id,
            category: 'PLEADINGS',
            priority: 'HIGH',
            statutoryReference: 'HMK m. 122 & 127',
            isCompleted: completedTaskIds.includes(`tensip-response-${c.id}`)
          });
        } else if (c.stage === 'İstinaf / Temyiz') {
          tasks.push({
            id: `istinaf-followup-${c.id}`,
            title: `Bölge Adliye Mahkemesi İstinaf Layihası Takibi (${c.caseNumber})`,
            actionRequired: 'İstinaf harç makbuzu ve karşı taraf cevap layihasına karşı beyan dilekçesini teyit edin.',
            deadlineDate: '2026-10-10',
            deadlineTime: '17:00',
            caseNumber: c.caseNumber,
            court: c.court,
            clientName: client.fullName,
            clientId: client.id,
            caseId: c.id,
            category: 'PLEADINGS',
            priority: 'MEDIUM',
            statutoryReference: 'HMK m. 345',
            isCompleted: completedTaskIds.includes(`istinaf-followup-${c.id}`)
          });
        }
      });
    });

    // 3. Time-sensitive lawyer hardware & token check
    if (lawyer.daysRemaining <= 60) {
      tasks.push({
        id: `license-audit-${lawyer.sicilNo}`,
        title: `Mobil Güvenlik Kilidi ve Sicil Lisans Senkronizasyonu`,
        actionRequired: `Sicil ${lawyer.sicilNo} için tek kullanımlık 24 saatlik APK kurulum mühürünü teyit edin. Lisans kalan süre: ${lawyer.daysRemaining} gün.`,
        deadlineDate: '2026-10-01',
        category: 'LICENSE',
        priority: 'MEDIUM',
        statutoryReference: 'Av. Kanunu m. 35 & 42',
        isCompleted: completedTaskIds.includes(`license-audit-${lawyer.sicilNo}`)
      });
    }

    return tasks;
  }, [clients, lawyer, completedTaskIds]);

  // Combine derived tasks with user-added custom tasks
  const allTasks = useMemo(() => {
    const list = [...derivedCaseTasks, ...customTasks];
    
    // Sort by:
    // 1. Completion status (incomplete first)
    // 2. Priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
    // 3. Deadline date ascending
    const priorityWeight: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3
    };

    return list.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const pDiff = (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
    });
  }, [derivedCaseTasks, customTasks]);

  // Filter tasks based on activeFilter
  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'CRITICAL':
        return allTasks.filter((t) => !t.isCompleted && (t.priority === 'CRITICAL' || getDaysRemaining(t.deadlineDate) <= 5));
      case 'HEARING':
        return allTasks.filter((t) => t.category === 'HEARING');
      case 'PLEADINGS':
        return allTasks.filter((t) => t.category === 'PLEADINGS' || t.category === 'OBJECTION');
      case 'COMPLETED':
        return allTasks.filter((t) => t.isCompleted);
      case 'ALL':
      default:
        return allTasks;
    }
  }, [allTasks, activeFilter]);

  // Metrics
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter((t) => t.isCompleted).length;
  const criticalCount = allTasks.filter((t) => !t.isCompleted && (t.priority === 'CRITICAL' || getDaysRemaining(t.deadlineDate) <= 3)).length;
  const pendingCount = totalCount - completedCount;

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    if (completedTaskIds.includes(taskId)) {
      setCompletedTaskIds((prev) => prev.filter((id) => id !== taskId));
      setCustomTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: false, completedAt: undefined } : t))
      );
    } else {
      setCompletedTaskIds((prev) => [...prev, taskId]);
      setCustomTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t))
      );
    }
  };

  // Add new custom reminder
  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let attachedCase: { caseNumber?: string; court?: string; clientName?: string; clientId?: string; caseId?: string } = {};
    if (selectedCaseIdx) {
      const [clientId, caseId] = selectedCaseIdx.split(':::');
      const c = clients.find((cl) => cl.id === clientId);
      const cs = c?.cases?.find((caseItem) => caseItem.id === caseId);
      if (c && cs) {
        attachedCase = {
          caseNumber: cs.caseNumber,
          court: cs.court,
          clientName: c.fullName,
          clientId: c.id,
          caseId: cs.id
        };
      }
    }

    const newTask: DailyTaskItem = {
      id: `custom-task-${Date.now()}`,
      title: newTaskTitle.trim(),
      actionRequired: newTaskAction.trim() || 'Avukatın takvimine eklediği ivedi görev.',
      deadlineDate: newTaskDate,
      category: newTaskCategory,
      priority: newTaskPriority,
      isCompleted: false,
      isCustom: true,
      ...attachedCase
    };

    setCustomTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskAction('');
    setShowAddModal(false);
  };

  // Delete custom task
  const handleDeleteCustomTask = (taskId: string) => {
    setCustomTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTaskIds((prev) => prev.filter((id) => id !== taskId));
  };

  return (
    <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CalendarClock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>Daily Task Reminders</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">· Günlük Görev ve Süre Hatırlatıcıları</span>
            </h3>

            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                {criticalCount} Acil Süre
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">{lawyer.fullName}</strong> için yaklaşan duruşmalar, HMK 281 bilirkişi itirazları ve tensip kesin sürelerine dayalı eylem listesi.
          </p>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Hızlı Görev Ekle</span>
          </button>

          {onNavigateToFullTimeline && (
            <button
              type="button"
              onClick={onNavigateToFullTimeline}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Tüm takvimi ve zaman çizelgesini aç"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>UYAP Takvimi</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. COMPACT FILTER BAR & SUMMARY STATS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Interactive Filter Tabs (Buttons allowed by constitution) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Tümü ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
              activeFilter === 'CRITICAL'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Acil / Süreler ({criticalCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('HEARING')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeFilter === 'HEARING'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Duruşmalar
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('PLEADINGS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeFilter === 'PLEADINGS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Dilekçe & İtiraz
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              activeFilter === 'COMPLETED'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Tamamlanan ({completedCount})
          </button>
        </div>

        {/* Progress & Counter Summary */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 self-end sm:self-center font-mono">
          <span>{pendingCount} bekleyen görev</span>
          <span aria-hidden="true">·</span>
          <span>%{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0} tamamlandı</span>
        </div>
      </div>

      {/* 3. COMPACT NOTIFICATION LIST */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Bu filtrede bekleyen süre veya görev bulunmuyor.
            </div>
            <p className="text-[11px]">
              Tüm duruşma ve dilekçe takviminiz kontrol edildi. Yeni görev eklemek için "Hızlı Görev Ekle" butonunu kullanabilirsiniz.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const daysLeft = getDaysRemaining(task.deadlineDate);
            const isUrgent = daysLeft >= 0 && daysLeft <= 3;
            const isPast = daysLeft < 0;

            return (
              <div
                key={task.id}
                className={`group relative rounded-xl border p-3 sm:py-2.5 sm:px-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                    : isUrgent
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-300'
                    : 'bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                }`}
              >
                {/* Left Accent indicator for priority */}
                <div
                  className={`absolute left-0 top-2 bottom-2 w-1 rounded-r ${
                    task.isCompleted
                      ? 'bg-slate-300 dark:bg-slate-700'
                      : task.priority === 'CRITICAL' || isUrgent
                      ? 'bg-rose-500'
                      : task.priority === 'HIGH'
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                />

                {/* Main Content Area */}
                <div className="flex items-start sm:items-center gap-3 pl-1.5 min-w-0">
                  {/* Complete Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="mt-0.5 sm:mt-0 p-1 rounded-lg text-slate-400 hover:text-emerald-600 transition shrink-0"
                    title={task.isCompleted ? 'Tamamlanmadı olarak işaretle' : 'Görevi tamamlandı olarak işaretle'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5 hover:text-slate-600 dark:hover:text-slate-200" />
                    )}
                  </button>

                  {/* Task Text & Metadata */}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          task.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Clean Unboxed Metadata with Typographic Separator (Zero-pill discipline) */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {task.caseNumber && (
                          <>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{task.caseNumber}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        {task.court && (
                          <>
                            <span className="truncate max-w-[140px] sm:max-w-[200px]">{task.court}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        {task.statutoryReference && (
                          <>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">{task.statutoryReference}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span
                          className={`font-semibold ${
                            task.isCompleted
                              ? 'text-slate-400'
                              : isPast
                              ? 'text-rose-600 dark:text-rose-400'
                              : isUrgent
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isPast
                            ? 'Süre doldu'
                            : daysLeft === 0
                            ? 'Bugün son gün'
                            : daysLeft === 1
                            ? 'Yarın (1 gün kaldı)'
                            : `${daysLeft} gün kaldı`}
                        </span>
                      </div>
                    </div>

                    <p
                      className={`text-xs leading-relaxed truncate max-w-[480px] lg:max-w-[650px] ${
                        task.isCompleted ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.actionRequired}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pl-7 sm:pl-0">
                  {/* Action 1: Petition Shortcut */}
                  {onNavigateToPetition && task.caseNumber && (
                    <button
                      type="button"
                      onClick={() => onNavigateToPetition(task.caseNumber!, task.title)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 transition"
                      title="Bu dava için dilekçe taslağı hazırla"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Dilekçe</span>
                    </button>
                  )}

                  {/* Action 2: Open Case Detail */}
                  {onOpenCase && task.clientId && task.caseId && (
                    <button
                      type="button"
                      onClick={() => onOpenCase(task.clientId!, task.caseId!)}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-medium flex items-center gap-1 transition"
                      title="Müvekkil ve dava dosyasını aç"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Dosya</span>
                    </button>
                  )}

                  {/* Delete custom task button */}
                  {task.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomTask(task.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition"
                      title="Görevi kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. MODAL: ADD CUSTOM TASK */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Yeni Günlük Süre / Görev Hatırlatıcısı
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Görev / Eylem Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: HMK 281 Bilirkişi Raporuna İtiraz Layihası Sun"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Eylem Detayı & Hatırlatıcı Notu
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: UYAP üzerinden ek rapor talebi verilecek, vezneye 800 TL yatırılacak."
                  value={newTaskAction}
                  onChange={(e) => setNewTaskAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Son Süre Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Öncelik Derecesi
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CRITICAL">Kritik (Kesin Süre)</option>
                    <option value="HIGH">Yüksek Öncelik</option>
                    <option value="MEDIUM">Normal Süre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İlişkili Dava Dosyası (İsteğe Bağlı)
                </label>
                <select
                  value={selectedCaseIdx}
                  onChange={(e) => setSelectedCaseIdx(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Genel Ofis Görevi (Bağlantısız)</option>
                  {clients.map((c) =>
                    (c.cases || []).map((cs) => (
                      <option key={`${c.id}:::${cs.id}`} value={`${c.id}:::${cs.id}`}>
                        {cs.caseNumber} - {cs.court} ({c.fullName})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shadow-sm"
                >
                  Görevi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
