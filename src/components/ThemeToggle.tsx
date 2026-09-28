import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none ${
        isDark
          ? 'bg-[#141d30] text-amber-300 border-slate-800 hover:bg-slate-800/80 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
      } ${className}`}
      title={isDark ? 'Gündüz moduna geç' : 'Gece moduna geç'}
      aria-label="Gece/Gündüz Temasını Değiştir"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Gündüz</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
          <span className="hidden sm:inline">Gece</span>
        </>
      )}
    </button>
  );
}

