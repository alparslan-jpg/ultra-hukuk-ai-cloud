import React, { useState, useEffect } from 'react';
import { Bell, Mail, Loader2, Sparkles } from 'lucide-react';
import { ClientItem } from '../services/clientCaseStore';

interface DavaBildirimAjaniProps {
  lawyerName: string;
}

export const DavaBildirimAjani: React.FC<DavaBildirimAjaniProps> = ({ lawyerName }) => {
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Simulating UYAP monitoring
  useEffect(() => {
    const mockNotifications = [
      "2024/782 Esas: Yeni bilirkişi raporu sisteme yüklendi.",
      "2023/1104 Esas: İstinaf dilekçesi kabul edildi.",
      "2024/412 Esas: Duruşma tarihi güncellendi: 02.10.2026."
    ];
    setNotifications(mockNotifications);
  }, []);

  const sendDailySummary = async () => {
    setSending(true);
    try {
      // In a real application, this would call an API route that uses the OAuth token 
      // to send an email via Gmail API.
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      alert('Günlük özet e-postası başarıyla gönderildi.');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('E-posta gönderilirken bir hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-500" />
          Dava Bildirim Ajanı
        </h3>
        <button
          onClick={sendDailySummary}
          disabled={sending || notifications.length === 0}
          className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          Günlük Özeti Gönder
        </button>
      </div>

      <ul className="space-y-2">
        {notifications.map((n, i) => (
          <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <Sparkles className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
};
