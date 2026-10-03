import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderOpen,
  FileText,
  FileCheck,
  Download,
  Search,
  Plus,
  ArrowRight,
  ChevronRight,
  Gavel,
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Trash2,
  CheckSquare,
  Square,
  Upload,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Briefcase,
  X,
  FileCode,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import {
  CaseFileItem,
  ClientCase,
  ClientItem,
  getClientList,
  saveClientList,
  subscribeToClientUpdates,
  updateCaseStatus
} from '../services/clientCaseStore';
import { PartyContextService, SelectedPartyContext, PartySide } from '../services/partyContextService';
import { DataExtractionAndSyncService } from '../services/dataExtractionAndSyncService';

export type { CaseFileItem, ClientCase, ClientItem };

interface MuvekkilDavaPortaliProps {
  onConsultCouncil?: (context: { clientName: string; caseNumber: string; subject: string; files: CaseFileItem[] }) => void;
  onNavigateToPetition?: (text: string) => void;
  onSyncGit?: () => void;
}

export function MuvekkilDavaPortali({
  onConsultCouncil,
  onNavigateToPetition,
  onSyncGit
}: MuvekkilDavaPortaliProps) {
  // Master hierarchical dataset from centralized store
  const [clients, setClients] = useState<ClientItem[]>(() => getClientList());

  useEffect(() => {
    const unsub = subscribeToClientUpdates((updated) => {
      setClients(updated);
    });
    return unsub;
  }, []);

  const updateClientsAndStore = (updater: (prev: ClientItem[]) => ClientItem[]) => {
    setClients((prev) => {
      const next = updater(prev);
      saveClientList(next);
      return next;
    });
  };

  // Navigation states
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'All' | 'Gerçek Kişi' | 'Tüzel Kişi / Şirket'>('All');

  // Selection states for files (Batch Operations)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [analyzingFileId, setAnalyzingFileId] = useState<string | null>(null);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchAnalysisModal, setBatchAnalysisModal] = useState<any | null>(null);
  const [singleAnalysisModal, setSingleAnalysisModal] = useState<CaseFileItem | null>(null);

  // Party Context & 100% Client-Biased AI Engine State
  const [partyContext, setPartyContext] = useState<SelectedPartyContext>(() => PartyContextService.get());

  useEffect(() => {
    const unsub = PartyContextService.subscribe((ctx) => {
      setPartyContext(ctx);
    });
    return unsub;
  }, []);

  const handleSelectSide = (side: PartySide) => {
    const updated = PartyContextService.selectSide(side);
    setPartyContext(updated);
  };

  // Modals for adding client / case / file
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);

  // New Client Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'Gerçek Kişi' | 'Tüzel Kişi / Şirket'>('Tüzel Kişi / Şirket');
  const [newClientIdNumber, setNewClientIdNumber] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // New Case Form
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newCourt, setNewCourt] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newOpponent, setNewOpponent] = useState('');
  const [newEstimatedValue, setNewEstimatedValue] = useState('');

  // New File Form
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<CaseFileItem['type']>('Tensip Zaptı');
  const [newFileContent, setNewFileContent] = useState('');

  // Multi-file upload state
  const [pendingFiles, setPendingFiles] = useState<{name: string; size: number; type: string; content: string}[]>([]);

  const detectFileType = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.includes('tensip') || name.includes('zapt')) return 'Tensip Zaptı';
    if (name.includes('bilirkisi') || name.includes('rapor')) return 'Bilirkişi Raporu';
    if (name.includes('fatura') || name.includes('irsaliye')) return 'Fatura / İrsaliye';
    if (name.includes('ihtar')) return 'İhtarname';
    if (name.includes('durusma') || name.includes('tutanak')) return 'Duruşma Tutanağı';
    if (name.includes('sozlesme') || name.includes('sözleşme')) return 'Sözleşme';
    if (name.includes('vekaletname') || name.includes('vekalet')) return 'Vekaletname';
    if (name.includes('dekont') || name.includes('banka')) return 'Banka Dekontu';
    return 'Diğer';
  };

  const handleMultiFileSelect = (files: File[]) => {
    const newPending = files.map(file => ({
      name: file.name,
      size: file.size,
      type: detectFileType(file.name),
      content: `${file.name} — ${Math.round(file.size / 1024)} KB — Sisteme yüklenmiştir.`
    }));
    setPendingFiles(prev => [...prev, ...newPending]);
  };

  const handleBatchFileUpload = () => {
    if (!selectedCaseId || !selectedClientId || pendingFiles.length === 0) return;
    const newFiles: CaseFileItem[] = pendingFiles.map((pf, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: pf.name.endsWith('.pdf') || pf.name.endsWith('.docx') || pf.name.endsWith('.jpg') || pf.name.endsWith('.png') ? pf.name : `${pf.name}.pdf`,
      type: pf.type,
      size: pf.size || 50000,
      uploadedAt: new Date().toLocaleDateString('tr-TR'),
      evidentiaryValue: 'Yazılı Delil Başlangıcı' as const,
      contentPreview: pf.content || 'Belge içeriği sisteme kaydedilmiştir.',
      analysisSummary: 'Yeni yüklenen evrak incelenmeye hazırdır.',
    }));
    updateClientsAndStore((prev) =>
      prev.map((c) => c.id === selectedClientId
        ? { ...c, cases: c.cases.map((cs) => cs.id === selectedCaseId ? { ...cs, files: [...newFiles, ...cs.files] } : cs) }
        : c
      )
    );
    setPendingFiles([]);
    setShowAddFileModal(false);
  };

  // Currently active selected client & case
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  const selectedCase = selectedClient?.cases.find((cs) => cs.id === selectedCaseId) || selectedClient?.cases[0] || null;

  // Global Senkronizasyon: Seçili dosya değiştiğinde tüm sistem bileşenlerine ve AI Dilekçe/Simülasyona aktar
  useEffect(() => {
    if (selectedCase && selectedClient) {
      const pContext = PartyContextService.get();
      const isDefendant = pContext.side === 'Davalı';
      const plaintiffName = isDefendant ? ((selectedCase as any)?.opponent || (selectedCase as any)?.defendant || 'Davacı') : selectedClient.fullName;
      const defendantName = isDefendant ? selectedClient.fullName : ((selectedCase as any)?.opponent || (selectedCase as any)?.defendant || 'Davalı');
      const side = pContext.side === 'none' ? 'Davacı' : pContext.side;
      
      const updated = PartyContextService.set({
        plaintiffName,
        defendantName,
        courtName: selectedCase.court,
        esasNo: selectedCase.caseNumber,
        subject: selectedCase.subject,
        side
      });
      setPartyContext(updated);
    }
  }, [selectedCase?.id, selectedClient?.id]);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchType = clientTypeFilter === 'All' || c.type === clientTypeFilter;
    const matchSearch =
      searchQuery === '' ||
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idNumber.includes(searchQuery) ||
      c.cases.some((cs) => cs.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || cs.court.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  // Toggle single file selection
  const toggleFileSelect = (id: string) => {
    setSelectedFileIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Toggle all files in selected case
  const toggleSelectAllFiles = () => {
    if (!selectedCase) return;
    const allIds = selectedCase.files.map((f) => f.id);
    if (selectedFileIds.length === allIds.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(allIds);
    }
  };

  // Download single file
  const handleDownloadSingle = (file: CaseFileItem) => {
    const textData = `=== ULTRA HUKUK AI - DAVA EVRAKI ÇIKTISI ===\nDosya Adı: ${file.name}\nTürü: ${file.type}\nİspat Gücü: ${file.evidentiaryValue}\nİlgili Norm: ${file.lawArticle || 'Belirtilmedi'}\nYüklenme Tarihi: ${file.uploadedAt}\n\n[İÇERİK ÖZETİ & METNİ]\n${file.contentPreview}\n\n[HUKUKİ DEĞERLENDİRME]\n${file.analysisSummary || 'Standart usul denetimi yapılmıştır.'}\n`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.[^/.]+$/, '') + '_UltraHukuk.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Batch download selected files
  const handleDownloadBatch = () => {
    if (!selectedCase) return;
    const targetFiles = selectedCase.files.filter((f) => selectedFileIds.includes(f.id));
    if (targetFiles.length === 0) {
      alert('Lütfen indirmek için en az bir dosya seçin.');
      return;
    }

    let batchContent = `========================================================\nULTRA HUKUK AI - TOPLU DAVA EVRAKLARI PAKETİ\nMüvekkil: ${selectedClient?.fullName}\nDava: ${selectedCase.caseNumber} - ${selectedCase.court}\nToplam Seçilen Belge: ${targetFiles.length} Adet\nTarih: ${new Date().toLocaleString('tr-TR')}\n========================================================\n\n`;

    targetFiles.forEach((file, index) => {
      batchContent += `--------------------------------------------------------\n[BELGE ${index + 1} / ${targetFiles.length}]: ${file.name}\nTürü: ${file.type} | İspat Niteliği: ${file.evidentiaryValue}\nDayanak Norm: ${file.lawArticle || 'Mevzuat Genel'}\n--------------------------------------------------------\nİçerik: ${file.contentPreview}\n\nAnaliz Notu: ${file.analysisSummary || 'İncelendi.'}\n\n`;
    });

    const blob = new Blob([batchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCase.caseNumber.replace(/[\/\s]/g, '_')}_Toplu_Evrak_Paketi.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Run single file analysis
  const handleAnalyzeSingleFile = async (file: CaseFileItem) => {
    setAnalyzingFileId(file.id);
    try {
      const response = await fetch('/api/ai/batch-document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [file],
          caseSubject: selectedCase?.subject
        })
      });
      const data = await response.json();
      if (data.success && data.documentAnalyses.length > 0) {
        const result = data.documentAnalyses[0];
        setSingleAnalysisModal({
          ...file,
          analysisSummary: result.ozet,
          evidentiaryValue: result.ispatGucu as any,
          lawArticle: result.usulNotu
        });
      } else {
        setSingleAnalysisModal(file);
      }
    } catch (err) {
      setSingleAnalysisModal(file);
    } finally {
      setAnalyzingFileId(null);
    }
  };

  // Run batch analysis on selected files
  const handleAnalyzeBatch = async () => {
    if (!selectedCase) return;
    const targetFiles = selectedCase.files.filter((f) => selectedFileIds.includes(f.id));
    if (targetFiles.length === 0) {
      alert('Lütfen analiz edilecek en az bir dosya seçin.');
      return;
    }

    setBatchAnalyzing(true);
    try {
      const response = await fetch('/api/ai/batch-document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: targetFiles,
          caseSubject: selectedCase.subject
        })
      });
      const data = await response.json();
      if (data.success) {
        setBatchAnalysisModal(data);
      } else {
        alert('Toplu analiz sırasında bir sorun oluştu.');
      }
    } catch (err) {
      alert('Sunucu ile iletişim kurulamadı.');
    } finally {
      setBatchAnalyzing(false);
    }
  };

  // Add new client submit
  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newClient: ClientItem = {
      id: `cli-${Date.now()}`,
      fullName: newClientName,
      type: newClientType,
      idNumber: newClientIdNumber || '10000000000',
      email: newClientEmail || 'iletisim@muvekkil.av.tr',
      phone: newClientPhone || '+90 500 000 00 00',
      address: 'İstanbul',
      notes: newClientNotes,
      cases: []
    };

    updateClientsAndStore((prev) => [newClient, ...prev]);
    setSelectedClientId(newClient.id);
    setSelectedCaseId(null);
    setShowAddClientModal(false);
    // Reset
    setNewClientName('');
    setNewClientIdNumber('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientNotes('');
  };

  // Add new case submit
  const handleAddCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber.trim() || !selectedClientId) return;

    const newCase: ClientCase = {
      id: `case-${Date.now()}`,
      caseNumber: newCaseNumber,
      court: newCourt || 'İstanbul Asliye Hukuk Mahkemesi',
      subject: newSubject || 'Genel Hukuki Uyuşmazlık',
      status: 'Open',
      openedDate: new Date().toISOString().split('T')[0],
      stage: 'Dava Açılışı & Tensip',
      estimatedValue: newEstimatedValue || 'Belirsiz',
      opponentName: newOpponent || 'Davalı Taraf',
      files: []
    };

    updateClientsAndStore((prev) =>
      prev.map((c) => (c.id === selectedClientId ? { ...c, cases: [newCase, ...c.cases] } : c))
    );
    setSelectedCaseId(newCase.id);
    setShowAddCaseModal(false);
    // Reset
    setNewCaseNumber('');
    setNewCourt('');
    setNewSubject('');
    setNewOpponent('');
    setNewEstimatedValue('');
  };

  // Add new file submit
  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !selectedCaseId || !selectedClientId) return;

    const newFile: CaseFileItem = {
      id: `file-${Date.now()}`,
      name: newFileName.endsWith('.pdf') || newFileName.endsWith('.docx') ? newFileName : `${newFileName}.pdf`,
      type: newFileType,
      size: 150000 + Math.floor(Math.random() * 200000),
      uploadedAt: new Date().toLocaleDateString('tr-TR'),
      evidentiaryValue: 'Yazılı Delil Başlangıcı',
      contentPreview: newFileContent || 'Belge içeriği ve evrak metni sisteme kaydedilmiştir.',
      analysisSummary: 'Yeni eklenen evrak incelenmeye hazırdır.',
      lawArticle: 'HMK m. 199 & m. 200'
    };

    updateClientsAndStore((prev) =>
      prev.map((c) =>
        c.id === selectedClientId
          ? {
              ...c,
              cases: c.cases.map((cs) => (cs.id === selectedCaseId ? { ...cs, files: [newFile, ...cs.files] } : cs))
            }
          : c
      )
    );
    setShowAddFileModal(false);
    // Reset
    setNewFileName('');
    setNewFileContent('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-2">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-600 dark:text-sky-400">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  Müvekkil & Dava Dosyaları Yönetim Portalı
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    · Hiyerarşik Dosya Ağı
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Müvekkil &rarr; Dava Dosyaları &rarr; Evraklar hiyerarşisi. Dosyaları tek tek veya seçili olarak toplu analiz edebilir ve indirebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddClientModal(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Müvekkil Oluştur</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column Hierarchical Navigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Column 1: Müvekkil Listesi (3 Cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
              <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Müvekkiller ({filteredClients.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddClientModal(true)}
              className="px-2.5 py-1 bg-sky-600/10 hover:bg-sky-600/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5"/>
              <span>Müvekkil Oluştur</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Müvekkil ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 rounded-xl pl-7 pr-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setClientTypeFilter('All')}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  clientTypeFilter === 'All' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 font-semibold' : 'bg-slate-50 dark:bg-[#141d30] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setClientTypeFilter('Tüzel Kişi / Şirket')}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  clientTypeFilter === 'Tüzel Kişi / Şirket' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 font-semibold' : 'bg-slate-50 dark:bg-[#141d30] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                Şirketler
              </button>
              <button
                type="button"
                onClick={() => setClientTypeFilter('Gerçek Kişi')}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  clientTypeFilter === 'Gerçek Kişi' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 font-semibold' : 'bg-slate-50 dark:bg-[#141d30] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                Şahıslar
              </button>
            </div>
          </div>

          {/* Client List Items */}
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {filteredClients.length === 0 ? (
              <div className="py-10 px-3 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                <div className="w-9 h-9 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mx-auto">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kayıtlı Müvekkil Bulunmuyor
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[190px] mx-auto">
                  Dava evrakı yüklediğinizde müvekkil ve taraflar yapay zeka tarafından otomatik oluşturulur veya manuel ekleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition shadow-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Müvekkil Oluştur</span>
                </button>
              </div>
            ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClientId === client.id;
              return (
                <div
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setSelectedCaseId(client.cases[0]?.id || null);
                    setSelectedFileIds([]);
                  }}
                  className={`p-4 rounded-xl border text-sm cursor-pointer transition ${
                    isSelected
                      ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-400 dark:border-sky-500/50 shadow-sm ring-1 ring-sky-500/20'
                      : 'bg-white dark:bg-[#141d30]/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#141d30]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{client.fullName}</span>
                    <span className="text-xs px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 font-mono tabular-nums">
                      {client.cases.length} Dava
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>{client.type}</span>
                    <span className="font-mono text-slate-400 dark:text-slate-500 tabular-nums">{client.idNumber}</span>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Column 2: Müvekkile Ait Davalar (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  Müvekkilin Davaları ({selectedClient?.cases.length || 0})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                  {selectedClient?.fullName || 'Müvekkil seçilmedi'}
                </p>
              </div>
              <button
                type="button"
                disabled={!selectedClient}
                onClick={() => setShowAddCaseModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Dava</span>
              </button>
            </div>

            {/* Cases List */}
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 mt-3">
              {!selectedClient ? (
                <div className="py-12 px-3 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-400 mx-auto opacity-70" />
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Müvekkil Seçilmedi
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Davaları görüntülemek için sol listeden bir müvekkil seçiniz.
                  </p>
                </div>
              ) : selectedClient.cases.length === 0 ? (
                <div className="py-10 px-3 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                  <Briefcase className="w-8 h-8 text-amber-500/60 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kayıtlı Dava Bulunmuyor
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[210px] mx-auto">
                    Bu müvekkile ait açık veya derdest dava kaydı yoktur.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddCaseModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition shadow-xs inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>İlk Davayı Aç</span>
                  </button>
                </div>
              ) : (
                selectedClient.cases.map((c) => {
                  const isSelected = selectedCaseId === c.id;
                  const currentStatus =
                    c.status === 'Open' || c.status === 'Açık' ? 'Açık' :
                    c.status === 'Closed' || c.status === 'Kapalı' ? 'Kapalı' :
                    c.status === 'Pending' || c.status === 'Beklemede' ? 'Beklemede' :
                    'Üst Mahkemede';

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setSelectedFileIds([]);
                      }}
                      className={`p-3.5 rounded-xl border text-sm cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400 dark:border-amber-500/50 shadow-sm ring-1 ring-amber-500/20'
                          : 'bg-white dark:bg-[#141d30]/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#141d30]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm tabular-nums">{c.caseNumber}</span>
                        <select
                          value={currentStatus}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (selectedClient) {
                              updateCaseStatus(selectedClient.id, c.id, e.target.value as any);
                            }
                          }}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer outline-none transition ${
                            currentStatus === 'Açık'
                              ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30'
                              : currentStatus === 'Beklemede'
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                              : currentStatus === 'Üst Mahkemede'
                              ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                          }`}
                        >
                          <option value="Açık" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Açık</option>
                          <option value="Beklemede" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Beklemede</option>
                          <option value="Üst Mahkemede" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Üst Mahkemede</option>
                          <option value="Kapalı" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Kapalı</option>
                        </select>
                      </div>

                      <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                        <Gavel className="w-4 h-4 shrink-0" />
                        <span className="truncate">{c.court}</span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                        {c.subject}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <span>Aşama: <strong className="text-slate-700 dark:text-slate-300">{c.stage}</strong></span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums">{c.files.length} Evrak</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dava Safahatı & Tensip İncelemesi (GRİ ALAN Optimizasyonu) */}
          {selectedCase ? (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#121b2d] rounded-xl p-3 border border-slate-200/70 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dava Safahatı & Tensip Özeti</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                  Aktif Takip
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 dark:text-slate-500">Mahkeme:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{selectedCase.court}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 dark:text-slate-500">Esas No:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedCase.caseNumber}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 dark:text-slate-500">Aşama:</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{selectedCase.stage}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 dark:text-slate-500">Kayıtlı Evrak:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedCase.files.length} Adet</span>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Tensip & Süre Notu:</span>
                  </div>
                  Cevap dilekçesi, delil listesi ve tensip zaptındaki kesin süreler Ajan Konseyi ve Usul Ajanı tarafından senkronize denetlenmektedir.
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#121b2d]/50 rounded-xl p-3 border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <Scale className="w-5 h-5 text-slate-400 mx-auto mb-1 opacity-60" />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                Safahat ve tensip özeti için bir dava seçiniz.
              </span>
            </div>
          )}
        </div>

        {/* Column 3: Dava Dosyaları & Evraklar (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4">
          {/* Header & Batch Action Bar */}
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-emerald-500" />
                  Dava Evrakları & Dosyaları ({selectedCase?.files.length || 0})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {selectedCase?.caseNumber || 'Dava Seçilmedi'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!selectedCase}
                  onClick={() => setShowAddFileModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-1 transition shadow-sm disabled:opacity-40"
                >
                  <Upload className="w-4 h-4" />
                  <span>Evrak Yükle</span>
                </button>

                {onConsultCouncil && selectedCase && (
                  <button
                    type="button"
                    onClick={() =>
                      onConsultCouncil({
                        clientName: selectedClient?.fullName || '',
                        caseNumber: selectedCase.caseNumber,
                        subject: selectedCase.subject,
                        files: selectedCase.files
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-1 transition shadow-sm"
                    title="Bu davayı Baş Hukuk Müşavirine danış"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Müşavire Danış</span>
                  </button>
                )}
              </div>
            </div>

            {/* TARAF SEÇİMİ VE %100 MÜVEKKİL YANLISI SAVUNMA KALKANI (MOR ALAN — AÇILIR PENCERE / POPOVER) */}
            <div className="relative">
              <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border border-purple-500/30 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Müvekkil Tarafı:</span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-xs border ${
                    partyContext.side === 'Davacı'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                      : partyContext.side === 'Davalı'
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40'
                      : partyContext.side === 'Müşteki'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                      : partyContext.side === 'Kurum'
                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}>
                    {partyContext.side !== 'none'
                      ? `${partyContext.side} (${partyContext.selectedPartyName || selectedClient?.fullName || 'Aktif'})`
                      : 'Belirlenmedi (Objektif)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPartyDropdown((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <span>Taraf Sıfatı Belirle</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPartyDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Açılır Pencere (Popover Modal) */}
              {showPartyDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 p-3.5 bg-white dark:bg-[#0f172a] rounded-xl shadow-xl border border-purple-500/30 ring-1 ring-black/5 dark:ring-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <ShieldAlert className="w-4 h-4 text-purple-500" />
                      <span>Taraf Seçimi & %100 Müvekkil Kalkanı</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPartyDropdown(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Seçtiğiniz taraf sıfatına göre Ajan Konseyi, Yargıtay emsal taraması ve dilekçe mimarisi %100 bu tarafı savunacak ve karşı taraf argümanlarını çürütecektir.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Davacı */}
                    <div
                      onClick={() => {
                        const newSide = partyContext.side === 'Davacı' ? 'none' : 'Davacı';
                        handleSelectSide(newSide);
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                        partyContext.side === 'Davacı'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={partyContext.side === 'Davacı'}
                          onChange={() => {}}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 block">Davacı (Müvekkil)</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] block">
                            {partyContext.plaintiffName || selectedClient?.fullName || 'Belirlenmedi'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        HMK m.119
                      </span>
                    </div>

                    {/* Davalı */}
                    <div
                      onClick={() => {
                        const newSide = partyContext.side === 'Davalı' ? 'none' : 'Davalı';
                        handleSelectSide(newSide);
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                        partyContext.side === 'Davalı'
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500/30'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={partyContext.side === 'Davalı'}
                          onChange={() => {}}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold text-blue-700 dark:text-blue-400 block">Davalı (Müvekkil)</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] block">
                            {partyContext.defendantName || (selectedCase as any)?.opponent || (selectedCase as any)?.defendant || 'Belirlenmedi'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                        HMK m.126
                      </span>
                    </div>

                    {/* Müşteki / Mağdur */}
                    <div
                      onClick={() => {
                        const newSide = partyContext.side === 'Müşteki' ? 'none' : 'Müşteki';
                        handleSelectSide(newSide);
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                        partyContext.side === 'Müşteki'
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/30'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={partyContext.side === 'Müşteki'}
                          onChange={() => {}}
                          className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold text-rose-700 dark:text-rose-400 block">Müşteki / Mağdur</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] block">
                            {selectedClient?.fullName || 'Belirlenmedi'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                        CMK m.237
                      </span>
                    </div>

                    {/* Kurum / Şirket */}
                    <div
                      onClick={() => {
                        const newSide = partyContext.side === 'Kurum' ? 'none' : 'Kurum';
                        handleSelectSide(newSide);
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                        partyContext.side === 'Kurum'
                          ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/30'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={partyContext.side === 'Kurum'}
                          onChange={() => {}}
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold text-purple-700 dark:text-purple-400 block">Kurum / Tüzel Kişi</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] block">
                            {selectedClient?.type === 'Tüzel Kişi / Şirket' ? selectedClient.fullName : 'Şirket/Kurum'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                        TTK / İYUK
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Batch Controls Toolbar */}
            {selectedCase && selectedCase.files.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  onClick={toggleSelectAllFiles}
                  className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  {selectedFileIds.length === selectedCase.files.length ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedFileIds.length === selectedCase.files.length
                      ? 'Seçimi Kaldır'
                      : `Tümünü Seç (${selectedFileIds.length}/${selectedCase.files.length})`}
                  </span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedFileIds.length === 0 || batchAnalyzing}
                    onClick={handleAnalyzeBatch}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-sm font-semibold flex items-center gap-1 transition disabled:opacity-40"
                  >
                    {batchAnalyzing ? (
                      <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>Seçilenleri Toplu Analiz Et</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedFileIds.length === 0}
                    onClick={handleDownloadBatch}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-sm font-semibold flex items-center gap-1 transition disabled:opacity-40"
                  >
                    <Download className="w-4 h-4 text-sky-500" />
                    <span>Toplu İndir</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Files List Items */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {selectedCase && selectedCase.files.length > 0 ? (
              selectedCase.files.map((file) => {
                const isSelected = selectedFileIds.includes(file.id);
                const isCurrentlyAnalyzing = analyzingFileId === file.id;

                return (
                  <div
                    key={file.id}
                    className={`p-4 rounded-xl border text-sm transition ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/50 shadow-sm'
                        : 'bg-white dark:bg-[#141d30]/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFileSelect(file.id)}
                          className="mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          )}
                        </button>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                            <span className="truncate max-w-[220px]" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 tabular-nums">
                            <span>{file.type}</span>
                            <span aria-hidden="true">·</span>
                            <span>{Math.round(file.size / 1024)} KB</span>
                            <span aria-hidden="true">·</span>
                            <span>{file.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      {/* Evidentiary Value Badge */}
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono border border-amber-200 dark:border-amber-800 shrink-0 font-medium">
                        {file.evidentiaryValue}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-[#090d16] p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 mb-2 leading-relaxed">
                      {file.contentPreview}
                    </p>

                    {/* File Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-sm">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {file.lawArticle || 'HMK Genel'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isCurrentlyAnalyzing}
                          onClick={() => handleAnalyzeSingleFile(file)}
                          className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          {isCurrentlyAnalyzing ? (
                            <span className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Brain className="w-2.5 h-2.5" />
                          )}
                          <span>Analiz Et</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(file)}
                          className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                          title="Evrakı indir"
                        >
                          <Download className="w-2.5 h-2.5 text-sky-500" />
                          <span>İndir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                Bu dava dosyasına henüz evrak eklenmemiş. Yukarıdaki "Evrak Yükle" butonunu kullanabilirsiniz.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single File Analysis Modal */}
      {singleAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Evrak Hukuki Analiz Raporu
                </h3>
                <p className="text-sm text-slate-400 font-mono">{singleAnalysisModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSingleAnalysisModal(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">İspat Gücü & HMK Niteliği</span>
                <div className="font-bold text-amber-300 text-base">{singleAnalysisModal.evidentiaryValue}</div>
                <div className="text-sm text-slate-300">{singleAnalysisModal.lawArticle}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Yapay Zeka Analiz Notu</span>
                <p className="text-slate-200 leading-relaxed">
                  {singleAnalysisModal.analysisSummary || 'Belge uyuşmazlığın ispatı bakımından geçerli yazılı delil niteliğindedir.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Evrak İçerik Özeti</span>
                <p className="text-slate-300 font-mono text-sm leading-relaxed">
                  {singleAnalysisModal.contentPreview}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadSingle(singleAnalysisModal)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Raporu İndir</span>
              </button>
              <button
                type="button"
                onClick={() => setSingleAnalysisModal(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Analysis Modal */}
      {batchAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Toplu Dava Evrakları Karşılaştırmalı Analiz Sentezi
                </h3>
                <p className="text-sm text-slate-400">
                  {batchAnalysisModal.totalFilesAnalyzed} adet evrak çapraz denetimden geçirildi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBatchAnalysisModal(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Synthesis Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-1">
                <span className="text-xs text-emerald-400 font-semibold uppercase">Genel Delil Gücü</span>
                <div className="font-bold text-emerald-300">
                  {batchAnalysisModal.comparativeSynthesis?.genelDelilKuvveti}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/50 space-y-1">
                <span className="text-xs text-sky-400 font-semibold uppercase">Çelişki Durumu</span>
                <div className="font-bold text-sky-300">
                  {batchAnalysisModal.comparativeSynthesis?.celiskiDurumu}
                </div>
              </div>
            </div>

            {/* Detailed per-file summary */}
            <div className="space-y-2 text-sm">
              <h4 className="font-bold text-slate-300">Tek Tek İncelenen Evraklar:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {batchAnalysisModal.documentAnalyses?.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{item.fileName}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                        {item.hukukiNitelik}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{item.ozet}</p>
                    <div className="text-xs text-slate-500 font-mono">İspat Gücü: {item.ispatGucu}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDownloadBatch}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Seçili Dosyaları İndir</span>
              </button>
              <button
                type="button"
                onClick={() => setBatchAnalysisModal(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Yeni Müvekkil Ekle */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Portföye Yeni Müvekkil Ekle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClientSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Müvekkil Adı / Şirket Ünvanı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Anadolu Dış Ticaret A.Ş. veya Ahmet Yılmaz"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Müvekkil Türü</label>
                  <select
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Tüzel Kişi / Şirket">Tüzel Kişi / Şirket</option>
                    <option value="Gerçek Kişi">Gerçek Kişi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">TCKN / VKN</label>
                  <input
                    type="text"
                    placeholder="11 haneli TCKN veya 10 haneli VKN"
                    value={newClientIdNumber}
                    onChange={(e) => setNewClientIdNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="+90 5..."
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">E-Posta</label>
                  <input
                    type="email"
                    placeholder="ornek@muvekkil.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Avukat Notları</label>
                <textarea
                  rows={2}
                  placeholder="Vekaletname bilgileri, özel anlaşmalar veya iletişim notları..."
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-md shadow-sky-900/30 cursor-pointer"
                >
                  Müvekkili Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Yeni Dava Ekle */}
      {showAddCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                Müvekkil İçin Yeni Dava Dosyası Aç
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCaseModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCaseSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Esas Numarası *</label>
                  <input
                    type="text"
                    required
                    placeholder="2025/144 Esas"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dava Değeri</label>
                  <input
                    type="text"
                    placeholder="350.000 TL"
                    value={newEstimatedValue}
                    onChange={(e) => setNewEstimatedValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görevli Mahkeme</label>
                <input
                  type="text"
                  placeholder="İstanbul 14. Asliye Ticaret Mahkemesi"
                  value={newCourt}
                  onChange={(e) => setNewCourt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Karşı Taraf (Davalı / Davacı)</label>
                <input
                  type="text"
                  placeholder="Karşı taraf şahıs veya şirket adı"
                  value={newOpponent}
                  onChange={(e) => setNewOpponent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dava Konusu & Özeti</label>
                <textarea
                  rows={2}
                  placeholder="Uyuşmazlık özeti ve temel hukuki talep..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCaseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-md shadow-amber-900/30"
                >
                  Davayı Aç & Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Çoklu Evrak Yükle */}
      {showAddFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Dava Dosyasına Evrak Yükle (Çoklu)
              </h3>
              <button type="button" onClick={() => { setShowAddFileModal(false); setPendingFiles([]); }} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
              onClick={() => document.getElementById('multi-file-input')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-950/20'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-950/20'); }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-950/20'); handleMultiFileSelect(Array.from(e.dataTransfer.files)); }}
            >
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-base text-slate-400 font-medium">Dosyaları sürükleyin veya tıklayarak seçin</p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOCX, JPG, PNG, XLSX — Birden fazla dosya seçebilirsiniz</p>
              <input id="multi-file-input" type="file" multiple accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.xlsx,.xls,.txt,.rtf" className="hidden"
                onChange={(e) => { if (e.target.files) handleMultiFileSelect(Array.from(e.target.files)); e.target.value = ''; }} />
            </div>
            {pendingFiles.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                <p className="text-xs text-slate-400 font-semibold">{pendingFiles.length} dosya seçildi:</p>
                {pendingFiles.map((pf, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2 text-sm border border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="text-slate-200 truncate max-w-[200px]">{pf.name}</span>
                      <span className="text-slate-500 shrink-0">{Math.round(pf.size / 1024)} KB</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select value={pf.type} onChange={(e) => setPendingFiles(prev => prev.map((f, i) => i === idx ? {...f, type: e.target.value} : f))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300">
                        <option value="Tensip Zaptı">Tensip Zaptı</option>
                        <option value="Bilirkişi Raporu">Bilirkişi Raporu</option>
                        <option value="Fatura / İrsaliye">Fatura / İrsaliye</option>
                        <option value="İhtarname">İhtarname</option>
                        <option value="Duruşma Tutanağı">Duruşma Tutanağı</option>
                        <option value="Sözleşme">Sözleşme</option>
                        <option value="Vekaletname">Vekaletname</option>
                        <option value="Banka Dekontu">Banka Dekontu</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                      <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300 p-0.5">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => { setShowAddFileModal(false); setPendingFiles([]); }} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold">Vazgeç</button>
              <button type="button" disabled={pendingFiles.length === 0} onClick={handleBatchFileUpload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-emerald-900/30">
                {pendingFiles.length > 0 ? `${pendingFiles.length} Evrakı Ekle & Dosyala` : 'Evrak Seçin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
