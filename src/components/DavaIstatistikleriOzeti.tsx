import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { PieChart as PieChartIcon, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { ClientItem } from '../services/clientCaseStore';

interface DavaIstatistikleriOzetiProps {
  clients: ClientItem[];
}

export const DavaIstatistikleriOzeti: React.FC<DavaIstatistikleriOzetiProps> = ({ clients }) => {
  // Calculate Stats
  const allCases = clients.flatMap(c => c.cases || []);
  const closedCases = allCases.filter(c => c.status === 'Closed');
  
  const successRate = closedCases.length > 0 
    ? Math.round((closedCases.length / allCases.filter(c => c.status !== 'Pending').length) * 100) 
    : 0;

  const avgDuration = closedCases.length > 0
    ? Math.round(closedCases.reduce((acc, c) => {
        const opened = new Date(c.openedDate).getTime();
        const closed = new Date(c.archivedAt || new Date().toISOString()).getTime();
        return acc + (closed - opened) / (1000 * 60 * 60 * 24);
      }, 0) / closedCases.length)
    : 0;

  const data = [
    { name: 'Açık', value: allCases.filter(c => c.status === 'Open').length },
    { name: 'Bekleyen', value: allCases.filter(c => c.status === 'Pending').length },
    { name: 'Kapalı', value: closedCases.length },
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Dava İstatistikleri Özeti', 20, 20);
    doc.setFontSize(12);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
    doc.text(`Başarı Oranı: %${successRate}`, 20, 40);
    doc.text(`Ortalama Dava Süresi: ${avgDuration} Gün`, 20, 50);
    doc.text('Dava Dağılımı:', 20, 60);
    data.forEach((item, index) => {
      doc.text(`${item.name}: ${item.value}`, 30, 70 + (index * 10));
    });
    doc.save('dava_istatistikleri_ozeti.pdf');
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-sky-500" />
          Dava İstatistikleri Özeti
        </h3>
        <button
          onClick={exportPDF}
          className="text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-semibold"
        >
          <FileText className="w-4 h-4" />
          Raporu Dışa Aktar
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Başarı Oranı</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{successRate}%</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Ort. Süre</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">{avgDuration} Gün</p>
        </div>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'transparent'}} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <Cell fill="#0ea5e9" />
              <Cell fill="#f59e0b" />
              <Cell fill="#64748b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
