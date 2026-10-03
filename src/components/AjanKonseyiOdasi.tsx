import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain,
  Mic,
  MicOff,
  Send,
  Upload,
  Paperclip,
  Sparkles,
  Gavel,
  Scale,
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Copy,
  ChevronDown,
  Layers,
  FileCheck2,
  FileCode,
  Lock,
  FolderOpen,
  HelpCircle,
  Cpu,
  MessageSquare,
  X,
  Archive,
  FolderPlus,
  Crosshair,
  Activity,
  BarChart3,
  FlaskConical,
  Swords,
  Timer,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  Users, Trash2,
} from 'lucide-react';
import { CaseFileItem } from './MuvekkilDavaPortali';
import { MuvekkilYonetimi } from './MuvekkilYonetimi';
import { PartyContextService, SelectedPartyContext, PartySide } from '../services/partyContextService';
import { DataExtractionAndSyncService } from '../services/dataExtractionAndSyncService';
import { ReportExportService } from '../services/reportExportService';

interface AjanKonseyiOdasiProps {
  lawyerName?: string;
  lawyerSicilNo?: string;
  initialCaseContext?: {
    clientName: string;
    caseNumber: string;
    subject: string;
    files: CaseFileItem[];
  } | null;
  onApplyToPetition?: (text: string) => void;
  onSyncGit?: () => void;
  onNavigateTo?: (page: string) => void;
}

interface MessageItem {
  id: string;
  sender: 'lawyer' | 'council';
  text: string;
  timestamp: string;
  audioDuration?: string;
  consultationData?: any;
}

export function AjanKonseyiOdasi({
  lawyerName,
  lawyerSicilNo,
  initialCaseContext,
  onApplyToPetition,
  onSyncGit,
  onNavigateTo
}: AjanKonseyiOdasiProps) {
  // Madde 6: Derin Analiz Zorunluluğu (Hızlı ve hafifletilmiş modeller tamamen tasfiye edilmiştir)
  const orchestratorModel = 'pro';
  const [showMuvekkilPanel, setShowMuvekkilPanel] = useState(false);
  const [activeModule, setActiveModule] = useState<string>('musavir');
  const [archivedCases, setArchivedCases] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ultra_archived_cases') || '[]'); } catch { return []; }
  });
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [savedCaseSuccess, setSavedCaseSuccess] = useState(false);

  // Input states
  const [inputText, setInputText] = useState('');
  const [lehineText, setLehineText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; content: string; type: string }>>([]);
  const [selectedCaseNote, setSelectedCaseNote] = useState<string>(
    initialCaseContext
      ? `Müvekkil: ${initialCaseContext.clientName} | Dava: ${initialCaseContext.caseNumber} - ${initialCaseContext.subject}`
      : ''
  );

  // Party Context & Client-Biased AI Engine State
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

  // Audio / Speech-to-Text State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Loading & Consultation State
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState<MessageItem[]>([
    {
      id: 'welcome-msg',
      sender: 'council',
      timestamp: '09:00',
      text: 'Merhaba Sayın Avukatım. Ben Ultra Hukuk AI Baş Hukuk Müşaviriyim. Arka planda HMK/CMK Usul ve Süre Ajanı, Yargıtay Emsal İçtihat Ajanı, Şeytanın Avukatı (Harp Odası) ve UYAP Dilekçe Mimarı ajanlarım aktif olarak görev başında çalışmaktadır.\n\nYeni gelen veya derdest bir dava dosyanızın evraklarını yükleyebilir, vakıaları yazabilir veya mikrofon simgesine basarak sesli anlatabilirsiniz. Size hangi mahkemede dava açılacağı, zorunlu arabuluculuk şartı, harçlar, adım adım dava yol haritası ve dilekçe kurgusu dahil net cevaplar vereceğiz.'
    }
  ]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setAudioTranscript(currentTranscript);
        setInputText((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Toggle voice recording
  const handleToggleRecording = () => {
    if (!speechSupported) {
      alert('Tarayıcınızda Web Speech API mikrofon desteği bulunmamaktadır. Lütfen Chrome veya Edge kullanınız veya vakıaları metin olarak yazınız.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setAudioTranscript('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Attach a local text/document file
  // Sınırlandırılmış, optimize edilmiş evrak verisi (413 Payload Too Large engelleme)
  const sanitizeFilesForPayload = (files: Array<{ name: string; content?: string; type?: string }>) => {
    return (files || []).slice(0, 10).map((f) => ({
      name: f.name || 'Belge',
      type: f.type || 'Evrak',
      content: typeof f.content === 'string' ? f.content.slice(0, 8000) : ''
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = (event.target?.result as string) || '';
        const content = raw.length > 30000 ? raw.slice(0, 30000) + '\n... (önizleme kısaltıldı)' : raw;
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            content: content || 'Evrak içeriği okundu.',
            type: file.type || 'Hukuki Belge'
          }
        ]);

        // Arka Plan AI Veri Çıkarma Ekibi: Davacı, Davalı, Mahkeme ve Dava Bilgilerini Anında Çıkarır
        try {
          const extracted = DataExtractionAndSyncService.extractFromText(raw, file.name);
          if (extracted.plaintiffs.length > 0 || extracted.defendants.length > 0) {
            DataExtractionAndSyncService.autoSyncExtractedDataToClients(extracted);
            setPartyContext(PartyContextService.get());
          }
        } catch (err) {
          console.warn('Otomatik taraf çıkarımı:', err);
        }
      };
      reader.readAsText(file);
    });
  };

  // Remove attached file
  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Send consultation request to AI Council
  const handleSendConsultation = async () => {
    const query = inputText.trim();
    if (!query && attachedFiles.length === 0 && !selectedCaseNote) {
      alert('Lütfen danışmak istediğiniz hukuki konuyu yazınız, sesli anlatınız veya bir evrak yükleyiniz.');
      return;
    }

    // Stop voice if recording
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userMessage: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: 'lawyer',
      text: query || 'Eklenen dava evrakları ve dosya bağlamı hakkında detaylı yol haritası ve danışma talebi.',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setConsultationHistory((prev) => [...prev, userMessage]);
    setInputText('');
    setIsConsulting(true);

    try {
      const activeLehine = partyContext.selectedPartyName
        ? `${partyContext.side}: ${partyContext.selectedPartyName}`
        : (lehineText || undefined);

      const response = await fetch('/api/ai/agent-council-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          contextFiles: sanitizeFilesForPayload(attachedFiles),
          activeCaseContext: selectedCaseNote,
          lehine: activeLehine,
          partyBiasDirective: partyContext.biasPromptDirective,
          orchestratorModel,
          inputMode: isRecording ? 'voice' : 'text'
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `Sunucu hatası (${response.status})`;
        try { const errJson = JSON.parse(errText); if (errJson.message) errMsg = errJson.message; } catch {}
        throw new Error(errMsg);
      }
      const cType = response.headers.get('content-type') || '';
      if (!cType.includes('application/json')) {
        throw new Error('Sunucu yanıtı alınamadı (Ağ/Proxy zaman aşımı). Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.');
      }
      const data = await response.json();
      if (data.success) {
        const isChat = data.mode === 'chat';
        const councilMessage: MessageItem = {
          id: `cns-${Date.now()}`,
          sender: 'council',
          text: data.answerToUserQuestion || data.orchestratorSummary || 'Cevap alındı.',
          timestamp: data.timestamp || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          consultationData: isChat ? undefined : data
        };
        setConsultationHistory((prev) => [...prev, councilMessage]);
      } else {
        alert('Danışma oluşturulurken bir hata oluştu: ' + (data.message || 'Bilinmeyen hata'));
      }
    } catch (err: any) {
      alert('Sunucu iletişim hatası: ' + err.message);
    } finally {
      setIsConsulting(false);
    }
  };


  // ── Evrak analiz ──────────────────────────────────────────────────────────
  // ── Evrak analiz ──────────────────────────────────────────────────────────
  const handleFileAction = async (idx: number, action: 'analiz' | 'detayli' | 'cimbiz') => {
    const f = attachedFiles[idx];
    if (!f) return;
    const labels = { analiz: 'Analiz Et', detayli: 'Detaylı Analiz', cimbiz: 'Cımbızla (TCK 272)' };
    const prompts = {
      analiz:   `Evrakı analiz et ve özet çıkar:\n\n${f.name}\n${(f.content || '').substring(0, 2000)}`,
      detayli:  `Evrakı detaylı hukuki analiz et (delil değeri, hukuki nitelendirme, usul geçerliliği):\n\n${f.name}\n${(f.content || '').substring(0, 3000)}`,
      cimbiz:   `Cımbızlama yap: çelişki, zayıf nokta, sahte bilgi, karşı taraf avantajı tespit et:\n\nTCK 272 / Cımbız modu aktif\n\n${f.name}\n${(f.content || '').substring(0, 3000)}`
    };
    const userMsg: MessageItem = { id: `fa-${Date.now()}`, sender: 'lawyer', text: `📎 ${labels[action]}: ${f.name}`, timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) };
    setConsultationHistory(p => [...p, userMsg]);
    setIsConsulting(true);
    try {
      const r = await fetch('/api/ai/agent-council-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompts[action], contextFiles: sanitizeFilesForPayload([f]), activeCaseContext: selectedCaseNote, orchestratorModel, inputMode: 'text' })
      });
      if (!r.ok) {
        const errText = await r.text();
        let errMsg = `Sunucu hatası (${r.status})`;
        try { const errJson = JSON.parse(errText); if (errJson.message) errMsg = errJson.message; } catch {}
        throw new Error(errMsg);
      }
      const cTypeF = r.headers.get('content-type') || '';
      if (!cTypeF.includes('application/json')) {
        throw new Error('Sunucu yanıtı alınamadı (Ağ/Proxy zaman aşımı). Lütfen tekrar deneyin.');
      }
      const d = await r.json();
      if (d.success) {
        setConsultationHistory(p => [...p, { id: `cns-${Date.now()}`, sender: 'council', text: d.answerToUserQuestion || d.orchestratorSummary || 'Analiz tamamlandı.', timestamp: d.timestamp || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), consultationData: d.mode !== 'chat' ? d : undefined }]);
      }
    } catch (e: any) { alert('Hata: ' + e.message); }
    finally { setIsConsulting(false); }
  };

  // ── Dava dosyası oluştur & arşivle ────────────────────────────────────────
  
  const handleExportUdf = async (msg: MessageItem) => {
    try {
      const court = partyContext.courtName || 'İstanbul Nöbetçi Asliye Hukuk Mahkemesi';
      const caseNo = partyContext.esasNo || '2026/Belirlenmedi Esas';
      const filename = `${court.replace(/[^a-zA-Z0-9ÇĞİÖŞÜçğıöşü]/g, '_')}_${Date.now()}.udf`;
      const res = await ReportExportService.exportAndBackupUdf(
        filename,
        msg.text + (msg.consultationData?.dilekceTavsiyesi?.dilekceTuru ? `\n\n${msg.consultationData.dilekceTavsiyesi.dilekceTuru}` : ''),
        {
          court,
          caseNo,
          plaintiff: partyContext.plaintiffName,
          defendant: partyContext.defendantName,
          lawyerName,
          lawyerSicil: lawyerSicilNo,
          documentTitle: msg.consultationData?.dilekceTavsiyesi?.dilekceTuru || 'Dava ve Savunma Strateji Raporu'
        },
        lawyerSicilNo
      );
      alert(res.message);
    } catch (e: any) {
      alert('UDF oluşturma hatası: ' + e.message);
    }
  };

  const handleExportPdf = async (msg: MessageItem) => {
    try {
      const court = partyContext.courtName || 'İstanbul Nöbetçi Asliye Hukuk Mahkemesi';
      const caseNo = partyContext.esasNo || '2026/Belirlenmedi Esas';
      const filename = `${court.replace(/[^a-zA-Z0-9ÇĞİÖŞÜçğıöşü]/g, '_')}_${Date.now()}.pdf`;
      const res = await ReportExportService.exportAndBackupPdf(
        filename,
        msg.text + (msg.consultationData?.dilekceTavsiyesi?.dilekceTuru ? `\n\n${msg.consultationData.dilekceTavsiyesi.dilekceTuru}` : ''),
        {
          court,
          caseNo,
          plaintiff: partyContext.plaintiffName,
          defendant: partyContext.defendantName,
          lawyerName,
          lawyerSicil: lawyerSicilNo,
          documentTitle: msg.consultationData?.dilekceTavsiyesi?.dilekceTuru || 'Dava ve Savunma Strateji Raporu'
        },
        lawyerSicilNo
      );
      alert(res.message);
    } catch (e: any) {
      alert('PDF oluşturma hatası: ' + e.message);
    }
  };

  const handleCreateCaseFile = async () => {
    const hasContent = inputText.trim() || attachedFiles.length > 0 || selectedCaseNote || consultationHistory.length > 1;
    if (!hasContent) { alert('Dava dosyası oluşturmak için önce dava bilgisi girin, evrak yükleyin veya danışma yapın.'); return; }
    setIsSavingCase(true);
    const history = consultationHistory.map(m => `[${m.sender === 'lawyer' ? 'Avukat' : 'Müşavir'}] ${m.text}`).slice(-6).join('\n\n');
    const fileNames = attachedFiles.map(f2 => f2.name).join(', ');
    try {
      const r = await fetch('/api/ai/agent-council-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `DAVA DOSYASI OLUŞTUR:\n1. Müvekkil kaydı bilgilerini özetle\n2. Dava dosyası özeti (mahkeme, taraflar, konu, talep, deliller)\n3. Kapsamlı dilekçe taslağı (kanun maddeleriyle)\n4. Önerilen dava stratejisi\n\nDanışma geçmişi:\n${history}\n\nEvraklar: ${fileNames || 'Yok'}\nBağlam: ${selectedCaseNote || 'Belirtilmemiş'}\nLehine: ${lehineText || 'Belirtilmemiş'}`,
          contextFiles: sanitizeFilesForPayload(attachedFiles),
          activeCaseContext: selectedCaseNote,
          lehine: lehineText,
          orchestratorModel: 'pro',
          inputMode: 'text'
        })
      });
      if (!r.ok) {
        const errText = await r.text();
        let errMsg = `Sunucu hatası (${r.status})`;
        try { const errJson = JSON.parse(errText); if (errJson.message) errMsg = errJson.message; } catch {}
        throw new Error(errMsg);
      }
      const cTypeC = r.headers.get('content-type') || '';
      if (!cTypeC.includes('application/json')) {
        throw new Error('Dava dosyası oluşturulurken zaman aşımı oluştu. Lütfen tekrar deneyin.');
      }
      const d = await r.json();
      const summary = d.answerToUserQuestion || d.orchestratorSummary || 'Dava dosyası oluşturuldu.';
      const newCase = { id: `case-${Date.now()}`, date: new Date().toISOString(), lawyerName: lawyerName || '', lawyerSicilNo: lawyerSicilNo || '', caseContext: selectedCaseNote || 'Dava Dosyası', lehine: lehineText, files: attachedFiles.map(f2 => f2.name), summary, consultationCount: consultationHistory.length };
      const updated = [newCase, ...archivedCases].slice(0, 50);
      setArchivedCases(updated);
      localStorage.setItem('ultra_archived_cases', JSON.stringify(updated));
      setConsultationHistory(p => [...p, { id: `arch-${Date.now()}`, sender: 'council', text: `✅ DAVA DOSYASI OLUŞTURULDU VE ARŞİVLENDİ\n\n${summary}`, timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }]);
      setSavedCaseSuccess(true);
      setTimeout(() => setSavedCaseSuccess(false), 4000);
    } catch (e: any) { alert('Hata: ' + e.message); }
    finally { setIsSavingCase(false); }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Banner & Multi-Agent Matrix Bar */}
      <div className="bg-white dark:bg-[#0e1524] border-b border-slate-200 dark:border-slate-800/80 px-5 py-4 shadow-sm relative overflow-hidden backdrop-blur-md shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Brain className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  Baş Hukuk Müşaviri & Ajan Konseyi Konsültasyon Odası
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    · Çoklu Model Orkestrasyonu
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uygulamayı yöneten Baş Hukuk Müşaviri ve arka planda çalışan 4 uzman ajanla dava kurgusu, görevli mahkeme, yol haritası ve dilekçe mimarisi.
                </p>
              </div>
            </div>
          </div>

          {/* View Switcher, Model Toggle & Git Sync */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Görünüm Seçimi: Müvekkil Portali vs Ajan Konseyi Odası */}
            <div className="flex items-center bg-slate-100 dark:bg-[#141d30] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setShowMuvekkilPanel(true);
                  setActiveModule('muvekkil');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  showMuvekkilPanel
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Müvekkil & Dava Portali</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMuvekkilPanel(false);
                  setActiveModule('musavir');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  !showMuvekkilPanel && activeModule !== 'arsiv'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Ajan Konseyi Odası</span>
              </button>

              {archivedCases.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMuvekkilPanel(false);
                    setActiveModule('arsiv');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeModule === 'arsiv'
                      ? 'bg-amber-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Arşiv ({archivedCases.length})</span>
                </button>
              )}
            </div>

            {/* Derin Akıl (Zorunlu Hukuki Muhakeme - Madde 6) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Derin Analiz & Harp Odası (Zorunlu Aktif)</span>
            </div>

            {onSyncGit && (
              <button
                type="button"
                onClick={onSyncGit}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Değişiklikleri ve analizleri GitHub'a senkronize et"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                <span>GitHub Senkronize</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Background Agents Live Status Ticker */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">1. Usul & Süre Ajanı</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">HMK Yetki, Görev & Arabuluculuk</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">2. Yargıtay Emsal Ajanı</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">HGK, Daire & BAM İlke Kararları</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">3. Şeytanın Avukatı</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Karşı Savunma & Zayıf Halkalar</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141d30]/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">4. Dilekçe Mimarı</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">UYAP Netice-i Talep & Tensip</div>
            </div>
          </div>
        </div>
      </div>{/* end Top Banner */}

      {/* TARAF SEÇİMİ VE %100 MÜVEKKİL YANLISI SAVUNMA KALKANI */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-100 to-indigo-500/10 dark:from-amber-950/30 dark:via-[#111928] dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Taraf Seçimi & Savunma Kalkanı:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            (Hangi tarafı seçerseniz tüm sistem %100 o müvekkili savunacak şekilde kurgulanır)
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Davacı Seçimi */}
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition ${
            partyContext.side === 'Davacı'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-bold'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
          }`}>
            <input
              type="checkbox"
              checked={partyContext.side === 'Davacı'}
              onChange={() => handleSelectSide(partyContext.side === 'Davacı' ? 'none' : 'Davacı')}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-medium">Davacı:</span>
            <span className="font-bold underline decoration-dotted">
              {partyContext.plaintiffName || 'Belirlenmedi'}
            </span>
            {partyContext.side === 'Davacı' && (
              <span className="text-[10px] bg-emerald-700 px-1.5 py-0.5 rounded-full font-bold ml-1">Müvekkil</span>
            )}
          </label>

          {/* Davalı Seçimi */}
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition ${
            partyContext.side === 'Davalı'
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-bold'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
          }`}>
            <input
              type="checkbox"
              checked={partyContext.side === 'Davalı'}
              onChange={() => handleSelectSide(partyContext.side === 'Davalı' ? 'none' : 'Davalı')}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Davalı:</span>
            <span className="font-bold underline decoration-dotted">
              {partyContext.defendantName || 'Belirlenmedi'}
            </span>
            {partyContext.side === 'Davalı' && (
              <span className="text-[10px] bg-blue-700 px-1.5 py-0.5 rounded-full font-bold ml-1">Müvekkil</span>
            )}
          </label>

          {/* Aktif Savunma Modu Rozeti */}
          {partyContext.side !== 'none' ? (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-xs animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>%100 {partyContext.side} ({partyContext.selectedPartyName || 'Müvekkil'}) Savunması Aktif</span>
            </div>
          ) : (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 italic">
              (Lütfen müvekkilinizin tarafını işaretleyiniz)
            </div>
          )}
        </div>
      </div>

      {/* BODY: Tam Genişlik Çalışma Alanı (Sol Menü Kaldırıldı) */}
      <div className="flex flex-1 overflow-hidden" style={{minHeight: 0}}>
        <div className="flex-1 flex flex-col overflow-hidden" style={{minHeight: 0}}>

      {/* Main Conversation & Roadmap Display */}
        {showMuvekkilPanel ? (
          <MuvekkilYonetimi
            onCaseSelected={(ctx) => {
              setSelectedCaseNote(`Müvekkil: ${ctx.clientName} | Dava: ${ctx.caseNumber} - ${ctx.subject}`);
              setAttachedFiles(ctx.files.map(f => ({ name: f.name, content: f.content || '', type: f.type || 'Hukuki Belge' })));
              setShowMuvekkilPanel(false);
              setActiveModule('musavir');
            }}
            onWritePetition={(ctx) => {
              const summary = `Müvekkil: ${ctx.clientName}\nDava: ${ctx.caseNumber} - ${ctx.subject}\nEvrak Sayısı: ${ctx.files.length}`;
              if (onApplyToPetition) {
                onApplyToPetition(summary);
              }
              if (onNavigateTo) {
                onNavigateTo('petitions');
              } else {
                setActiveModule('dilekce');
                setShowMuvekkilPanel(false);
              }
            }}
          />
        ) : activeModule === 'arsiv' ? (
          <div className="flex-1 bg-white dark:bg-[#0e1524] flex flex-col overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Archive className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Arşivlenen Davalar</h3>
                  <p className="text-xs text-slate-500">Sistemde arşivlenen dava dosyaları ({archivedCases.length})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {archivedCases.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Tüm arşivlenen dava dosyalarını silmek istediğinize emin misiniz?')) {
                        setArchivedCases([]);
                        localStorage.removeItem('ultra_archived_cases');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tüm Arşivi Temizle</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveModule('musavir')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
                >
                  Danışma Odasına Dön
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {archivedCases.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Archive className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                  <p className="text-sm font-semibold">Arşivde dava dosyası bulunmuyor.</p>
                  <p className="text-xs text-slate-500 mt-1">Dava dosyaları tamamen temizlendi.</p>
                </div>
              ) : (
                archivedCases.map((c: any, idx: number) => (
                  <div key={c.id || idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141d30] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.caseContext || 'Dava Dosyası'}</div>
                        <div className="text-[11px] text-slate-400">Tarih: {new Date(c.date).toLocaleString('tr-TR')} {c.lehine ? `· Lehine: ${c.lehine}` : ''}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = archivedCases.filter((_, i) => i !== idx);
                          setArchivedCases(updated);
                          localStorage.setItem('ultra_archived_cases', JSON.stringify(updated));
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                        title="Bu dosyayı sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {c.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto font-sans leading-relaxed bg-white dark:bg-[#0e1524] p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        {c.summary}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
      <div className="flex-1 bg-white dark:bg-[#0e1524] flex flex-col overflow-hidden" style={{minHeight: 0}}>
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {consultationHistory.map((msg) => {
            const isLawyer = msg.sender === 'lawyer';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${isLawyer ? 'justify-end' : 'justify-start'}`}
              >
                {!isLawyer && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400">
                    <Brain className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4.5 space-y-3 ${
                    isLawyer
                      ? 'bg-sky-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-50 dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className={`flex items-center justify-between gap-3 text-[11px] pb-1 border-b ${
                    isLawyer ? 'border-white/20 opacity-90' : 'border-slate-200 dark:border-slate-800 opacity-70'
                  }`}>
                    <span className="font-bold flex items-center gap-1.5">
                      {isLawyer ? 'Avukat' : 'Baş Hukuk Müşaviri & Ajan Konseyi'}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums">{msg.timestamp}</span>
                  </div>

                  {/* Main Message Text */}
                  <p className="whitespace-pre-line text-xs font-normal leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Deep Structured Consultation Cards (If available) */}
                  {msg.consultationData && (
                    <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {/* KVKK & Avukat İnceleme Sorumluluk Şerhi */}
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-[11px] flex items-center gap-2">
                        <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          <strong>1136 S.K. m. 34 & KVKK:</strong> Ajan konseyi tavsiyeleri nihai otomatik karar değildir; taslak dilekçe ve talepler sorumlu avukatın bizzat denetim ve onayından sonra UYAP'a sunulmalıdır.
                        </span>
                      </div>

                      {/* İnceleme Bilgileri */}
                      {(msg.consultationData.incelemeLehineBilgi || msg.consultationData.incelemeTarihi) && (
                        <div className="flex flex-wrap gap-3 text-[10px]">
                          {msg.consultationData.incelemeLehineBilgi && msg.consultationData.incelemeLehineBilgi !== 'Belirtilmemiş' && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold">
                              👤 {msg.consultationData.incelemeLehineBilgi} LEHİNE
                            </span>
                          )}
                          {msg.consultationData.incelemeTarihi && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              📅 İnceleme Tarihi: {msg.consultationData.incelemeTarihi}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Süre Kaçırma Uyarıları (KRİTİK) */}
                      {msg.consultationData.sureKacirmaUyarilari && msg.consultationData.sureKacirmaUyarilari.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-700 space-y-2">
                          <h4 className="font-bold text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            ⏰ UYAP Süre Kontrol ve Kaçırma Uyarıları
                          </h4>
                          <div className="space-y-1.5">
                            {msg.consultationData.sureKacirmaUyarilari.map((uyari: any, idx: number) => (
                              <div key={idx} className={`flex flex-wrap items-center gap-2 p-2 rounded-lg text-[11px] ${
                                uyari.durum === 'Gecikmiş' ? 'bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700' :
                                uyari.durum === 'ACIL' ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700' :
                                'bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700'
                              }`}>
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                                  uyari.durum === 'Gecikmiş' ? 'bg-rose-600 text-white' :
                                  uyari.durum === 'ACIL' ? 'bg-amber-600 text-white' :
                                  'bg-emerald-600 text-white'
                                }`}>{uyari.durum}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{uyari.evrak}</span>
                                <span className="text-slate-500">|</span>
                                <span className="text-slate-600 dark:text-slate-400">{uyari.sureTuru}</span>
                                <span className="text-slate-500">|</span>
                                <span className="text-slate-600 dark:text-slate-400">UYAP Gönderim: {uyari.uyapGonderimTarihi}</span>
                                <span className="text-slate-500">→</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{uyari.kalan}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.consultationData.courtAndJurisdiction && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-2">
                          <h4 className="font-bold text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1.5">
                            <Gavel className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Görevli ve Yetkili Mahkeme / Usuli Dava Şartları
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <strong className="text-slate-500 dark:text-slate-400">Görevli Mahkeme: </strong>
                              <span className="text-slate-900 dark:text-slate-100">{msg.consultationData.courtAndJurisdiction.gorevliMahkeme}</span>
                            </div>
                            <div>
                              <strong className="text-slate-500 dark:text-slate-400">Yetkili Mahkeme: </strong>
                              <span className="text-slate-900 dark:text-slate-100">{msg.consultationData.courtAndJurisdiction.yetkiliMahkeme}</span>
                            </div>
                            <div className="md:col-span-2">
                              <strong className="text-slate-500 dark:text-slate-400">Zorunlu Arabuluculuk: </strong>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{msg.consultationData.courtAndJurisdiction.arabuluculukSarti}</span>
                            </div>
                            <div className="md:col-span-2">
                              <strong className="text-slate-500 dark:text-slate-400">Harç & Gider Avansı: </strong>
                              <span className="text-slate-700 dark:text-slate-300 tabular-nums">{msg.consultationData.courtAndJurisdiction.harcVeGiderAvansiTahmini}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step-by-Step Roadmap */}
                      {msg.consultationData.davaYolHaritasi && msg.consultationData.davaYolHaritasi.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-2">
                          <h4 className="font-bold text-sky-700 dark:text-sky-300 text-xs flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            Dava Stratejisi ve Adım Adım Eylem Haritası
                          </h4>
                          <div className="space-y-2">
                            {msg.consultationData.davaYolHaritasi.map((step: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-[#141d30]/80 border border-slate-200 dark:border-slate-800/80">
                                <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-[10px] shrink-0 tabular-nums">
                                  {step.step || idx + 1}
                                </span>
                                <div className="space-y-0.5 flex-1">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{step.action}</div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                    <span>Zamanlama: <strong className="text-amber-600 dark:text-amber-400 tabular-nums">{step.deadline}</strong></span>
                                    <span className="font-mono text-slate-400 dark:text-slate-500">{step.legalBasis}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Petition & Claim Recommendation */}
                      {msg.consultationData.dilekceTavsiyesi && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Verilecek Dilekçe & Netice-i Talep Kurgusu
                            </h4>
                            {onApplyToPetition && (
                              <button
                                type="button"
                                onClick={() => {
                                  const petitionText = `DİLEKÇE TÜRÜ: ${msg.consultationData.dilekceTavsiyesi.dilekceTuru}\n\nNETİCE-İ TALEP MADDELERİ:\n${msg.consultationData.dilekceTavsiyesi.talepSonucuMaddeleri.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}\n\nDELİL LİSTESİ:\n${msg.consultationData.dilekceTavsiyesi.delilListesi.join('\n')}`;
                                  onApplyToPetition(petitionText);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold flex items-center gap-1 transition"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Dilekçe Laboratuvarına Aktar</span>
                              </button>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                            Tavsiye Edilen Dilekçe: <span className="text-amber-700 dark:text-amber-300">{msg.consultationData.dilekceTavsiyesi.dilekceTuru}</span>
                          </div>

                          {/* Netice-i Talep Maddeleri */}
                          <div className="space-y-1 bg-slate-50 dark:bg-[#141d30]/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Netice-i Talep Önerisi:</span>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                              {msg.consultationData.dilekceTavsiyesi.talepSonucuMaddeleri?.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Tensip Talepleri */}
                          {msg.consultationData.dilekceTavsiyesi.tensipTalepleri && (
                            <div className="space-y-1 bg-slate-50 dark:bg-[#141d30]/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Mahkemeden İlk Celse Öncesi İstenecek Tensip Talepleri:</span>
                              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
                                {msg.consultationData.dilekceTavsiyesi.tensipTalepleri.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4 Agent Special Insights Grid */}
                      {msg.consultationData.agentInsights && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                          <div className="p-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Gavel className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Usul Ajanı Notu:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300">{msg.consultationData.agentInsights.usulAjan}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                              <Scale className="w-3 h-3 text-sky-600 dark:text-sky-400" /> Yargıtay Emsal Notu:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300">{msg.consultationData.agentInsights.ictihatAjan}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Şeytanın Avukatı Uyarısı:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300">{msg.consultationData.agentInsights.seytaninAvukatiAjan}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <FileCheck2 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Dilekçe Mimarı Uyarısı:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300">{msg.consultationData.agentInsights.dilekceAjan}</p>
                          </div>
                        </div>
                      )}

                      {/* Evrak Referansları (Dip Notlar) */}
                      {msg.consultationData.dilekceTavsiyesi?.evrakReferanslari && msg.consultationData.dilekceTavsiyesi.evrakReferanslari.length > 0 && (
                        <div className="bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400 flex items-center gap-1">
                            <FileCheck2 className="w-3 h-3" /> Evrak Referansları (Dip Notlar)
                          </span>
                          <div className="space-y-1.5">
                            {msg.consultationData.dilekceTavsiyesi.evrakReferanslari.map((ref: any, i: number) => (
                              <div key={i} className="flex gap-2 text-[11px]">
                                <span className="text-violet-600 dark:text-violet-400 font-bold shrink-0">[{ref.no || i + 1}]</span>
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ref.evrakAdi}</span>
                                  {ref.bolum && <span className="text-slate-500 dark:text-slate-400">, {ref.bolum}</span>}
                                  {ref.aciklama && <p className="text-slate-600 dark:text-slate-400 mt-0.5">{ref.aciklama}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      
                      {/* UYAP UDF & PDF DIŞA AKTARMA VE GOOGLE DRIVE ŞİFRELİ YEDEKLEME */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-500" />
                          <span>Google Drive Zero-Knowledge Şifreli Yedekleme:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleExportUdf(msg)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                            title="UYAP Editör uyumlu XML formatında UDF oluştur ve Drive'a şifreli yedekle"
                          >
                            <FileCode className="w-3.5 h-3.5 text-rose-600" />
                            <span>UYAP UDF İndir & Yedekle</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportPdf(msg)}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                            title="Resmi mahkeme formatında A4 PDF raporu oluştur ve Drive'a şifreli yedekle"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>Resmi PDF İndir & Yedekle</span>
                          </button>
                        </div>
                      </div>
  
                      {/* Emsal Kararlar — Doktrin & Kaynak URL */}
                      {msg.consultationData.emsalKararlar && msg.consultationData.emsalKararlar.length > 0 && (
                        <div className="bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                            <Scale className="w-3 h-3" /> Emsal Kararlar — Doktrin & Kaynak
                          </span>
                          <div className="space-y-2">
                            {msg.consultationData.emsalKararlar.map((emsal: any, i: number) => (
                              <div key={i} className="text-[11px] p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 space-y-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">📌 {emsal.karar}</p>
                                {emsal.doktrinKaynagi && (
                                  <p className="text-violet-700 dark:text-violet-400 italic">
                                    📚 Doktrin: {emsal.doktrinKaynagi}
                                  </p>
                                )}
                                {emsal.ozet && <p className="text-slate-600 dark:text-slate-400">{emsal.ozet}</p>}
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {emsal.kaynak && (
                                    <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-medium">
                                      📖 {emsal.kaynak}
                                    </span>
                                  )}
                                  {emsal.url && (
                                    <a href={emsal.url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline text-[10px]">
                                      🔗 {emsal.url}
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isLawyer && (
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 text-sky-400">
                    <span className="text-xs font-bold font-mono">AV</span>
                  </div>
                )}
              </div>
            );
          })}

          {isConsulting && (
            <div className="flex gap-3 text-xs justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400">
                <Brain className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>
                  Baş Hukuk Müşaviri ({orchestratorModel === 'pro' ? 'Derin Bağlam ve Külliyat Muhakeme Motoru' : 'Hızlı Tasnif ve Operasyon Motoru'}) ve 4 arka plan ajanı uyuşmazlığı inceliyor...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input & Controls Bottom Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#090d16] space-y-3">
          {/* Active Case Context Chip & Attached Files Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {selectedCaseNote && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                <FolderOpen className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="truncate max-w-[280px]">{selectedCaseNote}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCaseNote('')}
                  className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 ml-1 font-bold"
                >
                  &times;
                </button>
              </span>
            )}

            {attachedFiles.map((file, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 flex items-center gap-1.5 font-mono text-[11px]"
              >
                <Paperclip className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span className="truncate max-w-[160px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachedFile(idx)}
                  className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200 ml-1 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}

            {isRecording && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 flex items-center gap-1.5 animate-pulse text-[11px]">
                <Mic className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span>Sesli anlatım dinleniyor... (Konuşabilirsiniz)</span>
              </span>
            )}
          </div>

          {/* Lehine Alanı & Yüklenen Dosyalar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={lehineText}
                  onChange={(e) => setLehineText(e.target.value)}
                  placeholder=".............. LEHİNE (İsim Soyisim yazarak kimin lehine inceleme/dilekçe olduğunu belirtin)"
                  className="w-full bg-white dark:bg-[#141d30] border border-amber-300 dark:border-amber-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-amber-400/70 dark:placeholder-amber-500/50 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-amber-600 dark:text-amber-400 font-semibold">LEHİNE</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
              <span>📅 İnceleme Tarihi: <strong className="text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('tr-TR')}</strong></span>
            </div>
          </div>

          {/* Yüklenen Dosyalar Listesi */}
          {attachedFiles.length > 0 && (
            <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 mb-2">
              <p className="text-[10px] text-slate-400 font-semibold mb-1.5">📎 Yüklenen Evraklar ({attachedFiles.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {attachedFiles.map((f, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800">
                    <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 max-w-[120px] truncate font-medium">{f.name}</span>
                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, 'analiz')}
                      className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[9px] font-semibold hover:bg-sky-200 dark:hover:bg-sky-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />Analiz Et
                    </button>
                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, 'detayli')}
                      className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[9px] font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <Layers className="w-2.5 h-2.5" />Detaylı Analiz
                    </button>
                    <button type="button" disabled={isConsulting} onClick={() => handleFileAction(idx, 'cimbiz')}
                      className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-[9px] font-semibold hover:bg-rose-200 dark:hover:bg-rose-800 transition disabled:opacity-40 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />Cımbızla
                    </button>
                    <button type="button" onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-0.5 ml-auto" title="Evrakı Kaldır">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Area & Action Buttons */}
          <div className="flex items-end gap-2">
            {/* File Upload Trigger */}
            <label className="p-2.5 rounded-xl bg-white dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition shadow-sm" title="Sınırsız dosya yükle — tüm dosya çeşitleri">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.pdf,.docx,.doc,.rtf,.jpg,.jpeg,.png,.xlsx,.xls,.pptx,.html,.xml,.udf,.csv"
              />
            </label>

            {/* Speech-to-Text Button */}
            <button
              type="button"
              onClick={handleToggleRecording}
              className={`p-2.5 rounded-xl border transition shadow-sm ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-white dark:bg-[#141d30] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
              title={isRecording ? 'Kaydı Durdur' : 'Sesli Anlatım Başlat'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input textarea */}
            <div className="flex-1 relative">
              <textarea
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendConsultation();
                  }
                }}
                placeholder="Vakıaları yazın, evrak yükleyin veya sesli anlatın..."
                className="w-full bg-white dark:bg-[#141d30] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none shadow-sm"
              />
            </div>

            {/* Dava Dosyası Oluştur */}
            <button
              type="button"
              disabled={isSavingCase || isConsulting}
              onClick={handleCreateCaseFile}
              className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0 ${
                savedCaseSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white disabled:opacity-40'
              }`}
              title="Dava dosyası oluştur, müvekkil kaydı yap, dilekçe taslağı üret ve arşivle"
            >
              {isSavingCase ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : savedCaseSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Kaydedildi!</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span className="hidden sm:inline whitespace-nowrap">Dava Dosyası Oluştur</span>
                </>
              )}
            </button>

            {/* Send Button */}
            <button
              type="button"
              disabled={isConsulting}
              onClick={handleSendConsultation}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center transition disabled:opacity-40 shadow-sm"
              title="Baş Hukuk Müşavirine ve Ajan Konseyine Gönder"
            >
              {isConsulting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
        )}
        </div>{/* end right panel */}
      </div>{/* end sidebar flex row */}
    </div>
  );
}
