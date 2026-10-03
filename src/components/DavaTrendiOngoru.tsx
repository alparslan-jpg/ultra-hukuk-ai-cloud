import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { ClientCase } from '../services/clientCaseStore';

interface DavaTrendiOngoruProps {
  cases: ClientCase[];
}

export const DavaTrendiOngoru: React.FC<DavaTrendiOngoruProps> = ({ cases }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeTrends = async () => {
    setLoading(true);
    // Simülasyon ve Derin Muhakeme Motoru çağrısı
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock data for prediction outcomes
    setData([
      { name: 'Kazanma', value: 65, color: '#10b981' }, // emerald-500
      { name: 'Uzlaşma', value: 20, color: '#f59e0b' }, // amber-500
      { name: 'Red', value: 15, color: '#ef4444' },    // red-500
    ]);
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Dava Trendi ve Öngörü
        </h3>
        <button
          onClick={analyzeTrends}
          disabled={loading}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Analiz Et
        </button>
      </div>

      <div className="h-48 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Analiz için butona tıklayın.
          </div>
        )}
      </div>
    </div>
  );
};
