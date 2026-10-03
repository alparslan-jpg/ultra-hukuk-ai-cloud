import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal, Play, RotateCcw, CheckCircle2, AlertTriangle,
  Brain, Shield, Sparkles, Swords, Gavel, Cpu, ArrowRight,
  Maximize2, Minimize2, Copy, Check
} from 'lucide-react';

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  stage: string;
  percent: number;
  agent: string;
  message: string;
  isError?: boolean;
}

interface AgentActivityConsoleProps {
  initialDocumentText?: string;
  fileName?: string;
  onAnalysisComplete?: (result: any) => void;
  className?: string;
}

export function AgentActivityConsole({
  initialDocumentText = '',
  fileName = '',
  onAnalysisComplete,
  className = ''
}: AgentActivityConsoleProps) {
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentAgent, setCurrentAgent] = useState<string>('Boşta (Hazır)');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<any | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runStreamPipeline = async (inputText: string = initialDocumentText) => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(5);
    setLogs([]);
    setFinalResult(null);
    setCurrentAgent('Sistem Muhafızı');

    const addLog = (stage: string, percent: number, agent: string, message: string, isError = false) => {
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          timestamp: new Date().toLocaleTimeString('tr-TR'),
          stage,
          percent,
          agent,
          message,
          isError
        }
      ]);
      setProgress(percent);
      setCurrentAgent(agent);
    };

    addLog('init', 5, 'Orkestratör', 'SSE Kanalı açılıyor, canlı ajan akışı başlatıldı...');

    try {
      const response = await fetch('/api/v1/ai/stream-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: inputText || 'Hukuki alacak ve itirazın iptali davası evrakı.',
          fileName: fileName || 'dava_evraki.pdf'
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Sunucu hatası (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', '').trim());
              if (data.stage === 'complete') {
                addLog(data.stage, 100, data.agent, data.message);
                setFinalResult(data.payload);
                if (onAnalysisComplete) onAnalysisComplete(data.payload);
              } else if (data.stage === 'error') {
                addLog(data.stage, 100, data.agent, data.message, true);
              } else {
                addLog(data.stage, data.percent, data.agent, data.message);
              }
            } catch {
              // Non-JSON line
            }
          }
        }
      }
    } catch (err: any) {
      addLog('error', 100, 'Hata Dedektörü', `Bağlantı koptu veya hata oluştu: ${err?.message}`, true);
    } finally {
      setIsRunning(false);
    }
  };

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.agent}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes('Veri Çıkarım')) return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    if (agent.includes('Tasnif')) return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30';
    if (agent.includes('Şeytanın')) return 'text-rose-400 bg-rose-950/60 border-rose-500/30';
    if (agent.includes('Hakem')) return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
    if (agent.includes('Müşavir')) return 'text-purple-400 bg-purple-950/60 border-purple-500/30';
    return 'text-sky-400 bg-sky-950/60 border-sky-500/30';
  };

  return (
    <div className={`bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs ${isExpanded ? 'fixed inset-4 z-50' : className}`}>
      {/* Terminal Title Bar */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 cursor-pointer hover:opacity-80" onClick={() => setLogs([])} title="Temizle" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 cursor-pointer hover:opacity-80" onClick={() => setIsExpanded(!isExpanded)} title="Büyüt/Küçült" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-200 tracking-tight">Ultra Hukuk AI — Ajan Aktivite Konsolu (SSE)</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-sans">
            v2.6 Live Stream
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{currentAgent} çalışıyor...</span>
            </div>
          )}

          <button
            type="button"
            onClick={copyLogs}
            disabled={logs.length === 0}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Logları Kopyala"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Tam Ekran"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => runStreamPipeline()}
            disabled={isRunning}
            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-sans font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'İşleniyor...' : 'Ajanları Başlat'}</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-900 h-1">
        <div
          className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Terminal Log Area */}
      <div className="p-4 space-y-2 overflow-y-auto flex-1 max-h-[380px] min-h-[160px] bg-[#070b14] text-slate-300 select-text leading-relaxed">
        {logs.length === 0 ? (
          <div className="text-slate-500 flex flex-col items-center justify-center py-8 text-center space-y-2">
            <Cpu className="w-8 h-8 text-slate-600 animate-pulse" />
            <p>Ajan Konsolu beklemede. Evrak analizi veya simülasyon başlattığınızda satır satır akış burada görünecektir.</p>
            <button
              onClick={() => runStreamPipeline()}
              className="text-indigo-400 hover:text-indigo-300 underline font-sans text-xs cursor-pointer mt-1"
            >
              Örnek Canlı Akışı Başlat
            </button>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1 rounded transition">
              <span className="text-slate-500 shrink-0 text-[11px] font-sans">[{log.timestamp}]</span>
              <span className={`px-2 py-0.5 rounded text-[10px] border font-bold shrink-0 ${getAgentColor(log.agent)}`}>
                {log.agent}
              </span>
              <span className={`flex-1 break-words ${log.isError ? 'text-rose-400 font-semibold' : 'text-slate-200'}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Final Synthesis Banner (if completed) */}
      {finalResult && (
        <div className="p-3 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/60 border-t border-slate-800 flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200 font-bold">
              Kazanma Olasılığı: %{finalResult.winningProbability || 80}
            </span>
            <span className="text-slate-400">
              · {finalResult.classification?.specificDisputeType || 'Dava Analizi Tamamlandı'}
            </span>
          </div>
          <span className="text-emerald-400 font-semibold">Tüm Ajan Raporları Hazır</span>
        </div>
      )}
    </div>
  );
}
