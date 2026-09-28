import React from 'react';
import { Scale, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4">
      <div className="bg-white dark:bg-[#0e1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Scale className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Ultra Hukuk</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Avukat Çalışma Portalı'na giriş yapın</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold transition hover:bg-slate-800 dark:hover:bg-white"
          >
            <User className="w-5 h-5" />
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  );
};
