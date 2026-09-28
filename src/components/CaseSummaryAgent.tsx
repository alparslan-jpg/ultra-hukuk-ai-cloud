import React, { useState } from 'react';
import { Sparkles, FileText, Loader2, RefreshCw } from 'lucide-react';
import { ClientCase } from '../services/clientCaseStore';
import jsPDF from 'jspdf';

interface CaseSummaryAgentProps {
  caseData: ClientCase;
}

export const CaseSummaryAgent: React.FC<CaseSummaryAgentProps> = ({ caseData }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const generateSummary = async () => {
    setLoading(true);
    setProgress(10);
    try {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 20, 90));
      }, 300);

      const response = await fetch('/api/ai/case-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseData }),
      });
      clearInterval(interval);
      setProgress(100);
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Özet oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const exportToPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Dava Özet Raporu", 105, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Dava Numarası: ${caseData.caseNumber}`, 20, 40);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 48);
    
    doc.line(20, 55, 190, 55);
    
    doc.setFontSize(11);
    const splitSummary = doc.splitTextToSize(summary, 170);
    doc.text(splitSummary, 20, 70);
    
    doc.save(`dava_ozeti_${caseData.caseNumber.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Dava Özetleme Ajanı
        </h3>
        
        {loading && (
          <div className="w-32">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
      
      {summary ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-amber-500 pl-3">
            {summary}
          </p>
          <button
            onClick={exportToPDF}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition font-semibold"
          >
            <FileText className="w-4 h-4" />
            PDF Olarak İndir (Müvekkil Raporu)
          </button>
        </div>
      ) : (
        <button
          onClick={generateSummary}
          disabled={loading}
          className="w-full text-xs py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          {loading ? 'Analiz ediliyor...' : 'Güncel UYAP Verileriyle Özetle'}
        </button>
      )}
    </div>
  );
};
