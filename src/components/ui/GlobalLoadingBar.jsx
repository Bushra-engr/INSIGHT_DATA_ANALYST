import React from 'react';
import { useApp } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';

export function GlobalLoadingBar() {
  const { authActionLoading } = useApp();

  if (!authActionLoading || !authActionLoading.active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      {/* Top Animated Glowing Progress Line */}
      <div className="h-1 w-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden shadow-sm">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 animate-pulse w-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" 
        />
      </div>

      {/* Floating Centered Status Pill */}
      {authActionLoading.label && (
        <div className="fixed top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-700/40 dark:border-slate-300/40">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 dark:text-blue-600 shrink-0" />
          <span className="tracking-tight">{authActionLoading.label}</span>
        </div>
      )}
    </div>
  );
}
