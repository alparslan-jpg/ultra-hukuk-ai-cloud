import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Save,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Clock,
  AlertTriangle,
  Target,
  Sparkles,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  KeyRound,
  FileCheck,
  X,
  Mic,
  MicOff,
  Radio,
  Volume2,
  RefreshCw,
  Play,
  Square
} from 'lucide-react';
import {
  CaseObservationNote,
  getCaseNotes,
  saveCaseNotes
} from '../services/encryptedCaseNotesService';

interface CaseRichNotesSectionProps {
  caseId: string;
  caseNumber: string;
  court: string;
  clientName: string;
  lawyerSicilNo: string;
  onClose?: () => void;
}

const CATEGORIES: CaseObservationNote['category'][] = [
  'Duruşma İntibası',
  'Müvekkil Mülakatı',
  'Strateji & Taktik',
  'Usuli Risk & İtiraz',
  'Delil Notu',
  'Genel'
];

export function CaseRichNotesSection({
  caseId,
  caseNumber,
  court,
  clientName,
  lawyerSicilNo,
  onClose
}: CaseRichNotesSectionProps) {
  const [notes, setNotes] = useState<CaseObservationNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(true);
  const [encryptedAt, setEncryptedAt] = useState<string | undefined>(undefined);

  // Privacy screen blur toggle (Avukatlık Kanunu m. 36)
  const [isPrivacyBlurred, setIsPrivacyBlurred] = useState<boolean>(false);

  // Custom passphrase state
  const [customPassphrase, setCustomPassphrase] = useState<string>('');
  const [showPassphraseInput, setShowPassphraseInput] = useState<boolean>(false);

  // Active Note Editor Fields
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteCategory, setNoteCategory] = useState<CaseObservationNote['category']>('Duruşma İntibası');
  const [noteContentHtml, setNoteContentHtml] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Voice-to-Text Microphone Dictation State (Sesle Dava Notu Dikte Ajanı)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechInterim, setSpeechInterim] = useState<string>('');
  const [speechFinal, setSpeechFinal] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [showDictationPanel, setShowDictationPanel] = useState<boolean>(false);
  const [dictationAutoInsert, setDictationAutoInsert] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Recording duration timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((sec) => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to format legal punctuation
  const formatLegalPunctuation = (text: string) => {
    return text
      .replace(/\s*nokta\b/gi, '.')
      .replace(/\s*virgül\b/gi, ',')
      .replace(/\s*iki nokta\b/gi, ':')
      .replace(/\s*soru işareti\b/gi, '?')
      .replace(/\s*ünlem\b/gi, '!')
      .replace(/\s*yeni paragraf\b/gi, '\n\n')
      .replace(/\s*yeni satır\b/gi, '\n')
      .replace(/\s*tırnak aç\b/gi, ' "')
      .replace(/\s*tırnak kapat\b/gi, '" ')
      .replace(/\s*parantez aç\b/gi, ' (')
      .replace(/\s*parantez kapat\b/gi, ') ');
  };

  // Insert text into editor
  const insertTextIntoEditor = (textToInsert: string, asStamp: boolean = false) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (asStamp) {
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      const stampHtml = `<div style="margin: 8px 0; padding: 6px 10px; background-color: #fef3c7; border-left: 3px solid #d97706; border-radius: 4px; font-size: 12px; color: #78350f;"><strong style="color: #b45309;">🎙️ [SESLİ DAVA NOTU · ${timeStr}]:</strong> ${textToInsert}</div><p><br/></p>`;
      document.execCommand('insertHTML', false, stampHtml);
    } else {
      document.execCommand('insertText', false, `${textToInsert} `);
    }
    setNoteContentHtml(editorRef.current.innerHTML);
  };

  // Start voice dictation with Web Speech API
  const startVoiceDictation = async () => {
    setMicError(null);
    setShowDictationPanel(true);

    // Request browser audio permission if available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        console.warn('Microphone permission warning:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicError('Mikrofon erişim izni verilmedi. Lütfen tarayıcınızın adres çubuğundaki kilit simgesinden mikrofon iznini aktif edin.');
          return;
        }
      }
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setMicError('Tarayıcınız Web Speech API ses tanıma özelliğini doğrudan desteklemiyor. Aşağıdaki "Simülasyon / Test Dikte" butonunu kullanarak sesli dikte akışını hemen test edebilirsiniz.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingDuration(0);
        setSpeechInterim('');
        setSpeechFinal('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setSpeechInterim(interim);
        }

        if (finalChunk) {
          const formatted = formatLegalPunctuation(finalChunk);
          setSpeechFinal((prev) => (prev ? `${prev} ${formatted}` : formatted));
          setSpeechInterim('');

          if (dictationAutoInsert && editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, `${formatted} `);
            setNoteContentHtml(editorRef.current.innerHTML);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Mikrofon erişim izni reddedildi. Tarayıcı izinlerinizi kontrol edin.');
          stopVoiceDictation();
        } else if (event.error === 'network') {
          setMicError('Ses tanıma hizmeti bağlantı hatası oluştu.');
        } else if (event.error === 'no-speech') {
          // Keep listening
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Recognition error:', err);
      setMicError('Mikrofon başlatılamadı: ' + (err.message || 'Bilinmeyen hata'));
      setIsRecording(false);
    }
  };

  const stopVoiceDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setSpeechInterim('');
  };

  // Mock / Simulation sample dictation for testing or restricted environments
  const handleSimulatedDictation = (sampleText: string) => {
    setMicError(null);
    setShowDictationPanel(true);
    setSpeechFinal((prev) => (prev ? `${prev} ${sampleText}` : sampleText));
    insertTextIntoEditor(sampleText, true);
  };

  const editorRef = useRef<HTMLDivElement>(null);

  // Load notes on mount or when caseId changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getCaseNotes(lawyerSicilNo, caseId, caseNumber, customPassphrase || undefined)
      .then((res) => {
        if (!isMounted) return;
        setNotes(res.notes);
        setIsEncrypted(res.isEncrypted);
        setEncryptedAt(res.encryptedAt);
        if (res.notes.length > 0) {
          const first = res.notes[0];
          setActiveNoteId(first.id);
          setNoteTitle(first.title);
          setNoteCategory(first.category);
          setNoteContentHtml(first.contentHtml);
        } else {
          setActiveNoteId(null);
          setNoteTitle('');
          setNoteContentHtml('');
        }
      })
      .catch((err) => {
        console.error('Error loading encrypted notes:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [caseId, lawyerSicilNo, customPassphrase]);

  // Synchronize editor content when active note switches
  const handleSelectNote = (note: CaseObservationNote) => {
    setActiveNoteId(note.id);
    setNoteTitle(note.title);
    setNoteCategory(note.category);
    setNoteContentHtml(note.contentHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.contentHtml;
    }
  };

  // Keep editor content in sync when editor mounts or changes
  useEffect(() => {
    if (editorRef.current && noteContentHtml !== undefined) {
      if (editorRef.current.innerHTML !== noteContentHtml) {
        editorRef.current.innerHTML = noteContentHtml;
      }
    }
  }, [activeNoteId]);

  // Execute rich text formatting command
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setNoteContentHtml(editorRef.current.innerHTML);
  };

  // Insert specialized lawyer stamps
  const insertCustomStamp = (stampType: 'timestamp' | 'risk' | 'strategy') => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    let htmlToInsert = '';
    if (stampType === 'timestamp') {
      htmlToInsert = `<span style="background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; font-weight: bold;">[⏱ ${dateFormatted}]:&nbsp;</span>&nbsp;`;
    } else if (stampType === 'risk') {
      htmlToInsert = `<span style="background-color: #ffe4e6; color: #be123c; border: 1px solid #f43f5e; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">[⚠️ USULİ RİSK / İTİRAZ NOTU]:&nbsp;</span>&nbsp;`;
    } else if (stampType === 'strategy') {
      htmlToInsert = `<span style="background-color: #e0e7ff; color: #4338ca; border: 1px solid #6366f1; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">[🎯 SAVUNMA STRATEJİSİ]:&nbsp;</span>&nbsp;`;
    }

    document.execCommand('insertHTML', false, htmlToInsert);
    setNoteContentHtml(editorRef.current.innerHTML);
  };

  // Create a new observation note
  const handleAddNewNote = () => {
    const newId = `obs-${Date.now()}`;
    const newNote: CaseObservationNote = {
      id: newId,
      caseId,
      caseNumber,
      title: 'Yeni Dava Gözlem Notu',
      category: 'Duruşma İntibası',
      isConfidential: true,
      contentHtml: '<p>Gizli duruşma ve dava gözlemlerinizi buraya yazın...</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    handleSelectNote(newNote);
    saveCaseNotes(lawyerSicilNo, caseId, updated, customPassphrase || undefined);
  };

  // Save current active note
  const handleSaveActiveNote = async () => {
    if (!activeNoteId) return;

    setIsSaving(true);
    const updatedHtml = editorRef.current ? editorRef.current.innerHTML : noteContentHtml;

    const updatedList = notes.map((n) => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: noteTitle.trim() || 'Başlıksız Gözlem',
          category: noteCategory,
          contentHtml: updatedHtml,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    });

    setNotes(updatedList);
    await saveCaseNotes(lawyerSicilNo, caseId, updatedList, customPassphrase || undefined);

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Delete a note
  const handleDeleteNote = async (noteIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bu gizli gözlem notunu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      return;
    }

    const updatedList = notes.filter((n) => n.id !== noteIdToDelete);
    setNotes(updatedList);
    await saveCaseNotes(lawyerSicilNo, caseId, updatedList, customPassphrase || undefined);

    if (activeNoteId === noteIdToDelete) {
      if (updatedList.length > 0) {
        handleSelectNote(updatedList[0]);
      } else {
        setActiveNoteId(null);
        setNoteTitle('');
        setNoteContentHtml('');
        if (editorRef.current) editorRef.current.innerHTML = '';
      }
    }
  };

  // Copy clean text of active note to clipboard
  const handleCopyNoteText = () => {
    if (!editorRef.current) return;
    const text = `[DOSYA ÖZEL GÖZLEMİ - ${caseNumber}]\nBAŞLIK: ${noteTitle}\nKATEGORİ: ${noteCategory}\n\n${editorRef.current.innerText}\n\n(Gizli Avukatlık Notu - 1136 Sayılı Avukatlık Kanunu m. 36 Uyumlu)`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Calculate approximate word count
  const wordCount = editorRef.current?.innerText.trim().split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-[#0c121e] shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
      {/* Header Bar: Privacy Status & Controls */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-100/60 to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900/80 dark:to-[#0c121e] border-b border-amber-200 dark:border-amber-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Lock className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Gizli Dava Gözlemleri & Özel Notlar</span>
              <span className="font-mono text-amber-700 dark:text-amber-400">({caseNumber})</span>
            </h4>

            {/* AES-256 Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>AES-256-GCM Şifreli</span>
            </span>

            {/* Avukatlık Kanunu m. 36 Seal */}
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Av. K. m. 36 Sır Koruması</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {clientName} · {court} · Yalnızca sizin tarayıcınızda çözümlenir; sunuculara veya üçüncü şahıslara iletilmez.
          </p>
        </div>

        {/* Header Right Actions: Privacy Screen Blur, Custom Passphrase, Close */}
        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {/* Privacy Screen Blur Toggle (Müvekkil Odadayken Ekranı Gizle) */}
          <button
            type="button"
            onClick={() => setIsPrivacyBlurred(!isPrivacyBlurred)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isPrivacyBlurred
                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
            title={isPrivacyBlurred ? 'Gizlilik perdesini kaldır' : 'Müvekkil görüşmesinde ekranı gizle/bulanıklaştır'}
          >
            {isPrivacyBlurred ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isPrivacyBlurred ? 'Gizlilik Perdesi Açık' : 'Ekran Perdesi (Blur)'}</span>
          </button>

          {/* Master PIN / Passphrase Lock Toggle */}
          <button
            type="button"
            onClick={() => setShowPassphraseInput(!showPassphraseInput)}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Özel Şifreleme Parolası Ayarla"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Notlar Bölümünü Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Optional Custom Passphrase Dropdown */}
      {showPassphraseInput && (
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row items-center gap-2 text-xs animate-in fade-in duration-150">
          <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Özel Avukat Şifreleme Anahtarı (PIN):
          </span>
          <input
            type="password"
            value={customPassphrase}
            onChange={(e) => setCustomPassphrase(e.target.value)}
            placeholder="Varsayılan: Avukat Sicil No Anahtarı"
            className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 flex-1"
          />
          <span className="text-[11px] text-slate-400">
            Boş bırakırsanız sicil numaranıza özel donanımsal anahtar kullanılır.
          </span>
        </div>
      )}

      {/* Main Layout: Notes Sidebar (Left 4 cols) + Rich-Text Editor (Right 8 cols) */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 min-h-[460px] transition-all duration-300 ${isPrivacyBlurred ? 'filter blur-md select-none' : ''}`}>
        {/* LEFT COLUMN: Observations List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0a0f1a] p-3 sm:p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Gözlem Kayıtları ({notes.length})</span>
              </span>
              <button
                type="button"
                onClick={handleAddNewNote}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                title="Yeni Şifreli Gözlem Ekle"
              >
                <Plus className="w-3 h-3" />
                <span>Yeni Not</span>
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">Şifreli notlar çözülüyor...</div>
              ) : notes.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-2">
                  <p>Bu dava için henüz özel gözlem kaydı bulunmuyor.</p>
                  <button
                    type="button"
                    onClick={handleAddNewNote}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    + İlk Notu Oluştur
                  </button>
                </div>
              ) : (
                notes.map((note) => {
                  const isActive = note.id === activeNoteId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex flex-col gap-1 ${
                        isActive
                          ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-xs'
                          : 'bg-white dark:bg-[#121929] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`font-bold truncate text-xs ${isActive ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {note.title || 'Başlıksız Gözlem'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition opacity-50 hover:opacity-100"
                          title="Notu Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {note.category}
                        </span>
                        <span>{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick encryption security note */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              <Lock className="w-3 h-3" />
              <span>Lokal Kriptografik Kasa</span>
            </span>
            <span className="tabular-nums">{notes.length} Kayıt</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Rich-Text Editor Area */}
        <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-white dark:bg-[#0c121e]">
          {activeNoteId ? (
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Note Metadata Fields: Title & Category */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Gözlem Başlığı (Örn: 2. Celse Hakim İntibası, Karşı Taraf Zafiyeti...)"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#121929] border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />

                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 dark:bg-[#121929] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 shrink-0"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rich-Text Formatting Toolbar */}
              <div className="p-1.5 rounded-xl bg-slate-100/80 dark:bg-[#141d30] border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center gap-1 text-xs">
                {/* Bold */}
                <button
                  type="button"
                  onClick={() => executeFormat('bold')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Kalın (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => executeFormat('italic')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="İtalik (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onClick={() => executeFormat('underline')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Altı Çizili (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                {/* Strikethrough */}
                <button
                  type="button"
                  onClick={() => executeFormat('strikeThrough')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Üstü Çizili"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

                {/* Highlight */}
                <button
                  type="button"
                  onClick={() => executeFormat('hiliteColor', '#fef08a')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 transition"
                  title="Vurgula (Sarı Kalem)"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>

                {/* Bullet List */}
                <button
                  type="button"
                  onClick={() => executeFormat('insertUnorderedList')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Madde İşaretli Liste"
                >
                  <List className="w-3.5 h-3.5" />
                </button>

                {/* Numbered List */}
                <button
                  type="button"
                  onClick={() => executeFormat('insertOrderedList')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Numaralı Liste"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>

                {/* Blockquote */}
                <button
                  type="button"
                  onClick={() => executeFormat('formatBlock', 'blockquote')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Tanık / Heyet Alıntısı"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

                {/* Custom Attorney Stamps */}
                <button
                  type="button"
                  onClick={() => insertCustomStamp('timestamp')}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Şimdiki Zaman Damgasını Ekle"
                >
                  <Clock className="w-3 h-3 text-sky-500" />
                  <span>Zaman Ekle</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertCustomStamp('risk')}
                  className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Usuli Risk / Süre İkazı Ekle"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>Usul Riski</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertCustomStamp('strategy')}
                  className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Strateji Notu Ekle"
                >
                  <Target className="w-3 h-3 text-indigo-500" />
                  <span>Strateji</span>
                </button>

                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

                {/* Voice-to-Text Dictation Button (Mikrofonla Dava Notu Dikte Et) */}
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceDictation : startVoiceDictation}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-2 ring-rose-400/50'
                      : showDictationPanel
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                  }`}
                  title={isRecording ? 'Dikteyi durdur' : 'Dava gözlem ve duruşma notlarını sesle dikte edin'}
                >
                  {isRecording ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Dikte Ediliyor ({formatDuration(recordingDuration)})</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Sesle Dikte Et</span>
                    </>
                  )}
                </button>

                {showDictationPanel && !isRecording && (
                  <button
                    type="button"
                    onClick={() => setShowDictationPanel(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    title="Dikte panelini gizle"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* LIVE VOICE-TO-TEXT DICTATION PANEL (DAVA NOTLARI MİKROFON PANELİ) */}
              {showDictationPanel && (
                <div className="p-3 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-[#111827] dark:to-amber-950/20 border border-amber-300 dark:border-amber-700/80 rounded-xl space-y-2.5 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border flex items-center justify-center ${
                        isRecording
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400'
                      }`}>
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>Dava Notu Sesli Dikte (tr-TR)</span>
                            {isRecording && (
                              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-pulse">
                                CANLI · {formatDuration(recordingDuration)}
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isRecording
                            ? 'Konuşmanız gerçek zamanlı metne dönüştürülüyor...'
                            : 'Mikrofon hazır. Başlamak için "Dikteyi Başlat" butonuna basın.'}
                        </p>
                      </div>
                    </div>

                    {/* Controls & Wave Indicator */}
                    <div className="flex items-center gap-2">
                      {isRecording && (
                        <div className="flex items-end gap-1 h-5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_100ms] h-3" />
                          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_300ms] h-4" />
                          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_200ms] h-5" />
                          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_400ms] h-3" />
                          <span className="w-1 bg-rose-500 rounded-full animate-[bounce_1s_infinite_250ms] h-4" />
                        </div>
                      )}

                      {isRecording ? (
                        <button
                          type="button"
                          onClick={stopVoiceDictation}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Dikteyi Bitir</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startVoiceDictation}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Dikteyi Başlat</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowDictationPanel(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Paneli Kapat"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mic Error Banner if any */}
                  {micError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{micError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleSimulatedDictation(
                            'Duruşmada karşı vekil HMK m. 145 gereğince ek delil ikame talebinde bulundu. Mahkeme 2 haftalık kesin süre verdi, bir sonraki celse 18 Kasım saat 10:30 olarak belirlendi.'
                          )
                        }
                        className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0"
                      >
                        Örnek Dava Notu Ekle (Simülasyon)
                      </button>
                    </div>
                  )}

                  {/* Spoken Transcript Preview Box */}
                  <div className="p-2.5 bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Dikte Edilen Metin:</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-slate-500 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={dictationAutoInsert}
                            onChange={(e) => setDictationAutoInsert(e.target.checked)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span>Konuştukça Notun İçine Yaz</span>
                        </label>
                        {speechFinal && (
                          <button
                            type="button"
                            onClick={() => setSpeechFinal('')}
                            className="text-slate-400 hover:text-rose-500 text-[10px]"
                          >
                            Temizle
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="min-h-[44px] max-h-[80px] overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200">
                      {speechFinal && <span>{speechFinal} </span>}
                      {speechInterim && (
                        <span className="text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                          {speechInterim}...
                        </span>
                      )}
                      {!speechFinal && !speechInterim && (
                        <span className="text-slate-400 italic">
                          {isRecording
                            ? 'Mikrofona konuşun: "Duruşmada hakim davalı tanıklarının beyanını dinledi..."'
                            : 'Henüz sesli dikte yapılmadı. Başlat butonuna tıklayarak konuşabilirsiniz.'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Chips & Punctuation Inserts */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-slate-800/80 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Hızlı İşaretler:</span>
                      <button
                        type="button"
                        onClick={() => insertTextIntoEditor('.', false)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-mono"
                        title="Nokta ekle"
                      >
                        . (Nokta)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextIntoEditor(',', false)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-mono"
                        title="Virgül ekle"
                      >
                        , (Virgül)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTextIntoEditor('<br/><br/>', false)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-mono"
                        title="Yeni Paragraf"
                      >
                        ↵ Paragraf
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {speechFinal && (
                        <>
                          <button
                            type="button"
                            onClick={() => insertTextIntoEditor(speechFinal, false)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1 transition"
                            title="Dikte edilen metni imlecin olduğu yere ekle"
                          >
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Metin Ekle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTextIntoEditor(speechFinal, true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1 transition"
                            title="Damgalı sesli not olarak ekle"
                          >
                            <Mic className="w-3 h-3 text-amber-600" />
                            <span>Damgalı Not Olarak Ekle</span>
                          </button>
                        </>
                      )}

                      {/* Fast Test Simulation Dictations */}
                      <button
                        type="button"
                        onClick={() =>
                          handleSimulatedDictation(
                            'Duruşma zaptı incelendi: Davalı vekili tanık beyanlarına karşı süre talep etti, mahkeme 2 haftalık kesin süre tesis etti.'
                          )
                        }
                        className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-semibold"
                        title="Hızlı deneme amaçlı hazır sesli dava intibası ekle"
                      >
                        + Örnek Dikte Ekle
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable WYSIWYG Content Area */}
              <div className="flex-1 relative min-h-[220px]">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={() => {
                    if (editorRef.current) {
                      setNoteContentHtml(editorRef.current.innerHTML);
                    }
                  }}
                  className="w-full h-full min-h-[220px] max-h-[380px] overflow-y-auto p-4 bg-slate-50/50 dark:bg-[#121929]/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 leading-relaxed font-sans"
                  style={{ minHeight: '220px' }}
                />
              </div>

              {/* Bottom Actions Row: Save, Copy, Stats */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                  <span>{wordCount} Kelime</span>
                  <span aria-hidden="true">·</span>
                  <span>Otomatik AES-256 Korumalı</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyNoteText}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSuccess ? 'Kopyalandı' : 'Metni Kopyala'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveActiveNote}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span>Şifreleniyor...</span>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Kaydedildi</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Şifrele ve Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-xs">Görüntülemek veya düzenlemek için sol taraftan bir gözlem notu seçin ya da yeni not oluşturun.</p>
              <button
                type="button"
                onClick={handleAddNewNote}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition"
              >
                + Yeni Gizli Gözlem Ekle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
