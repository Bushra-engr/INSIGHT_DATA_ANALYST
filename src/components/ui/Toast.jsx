import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts } = useApp();

  if (!toasts || toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-500 shrink-0" />
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#0F1929] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl text-xs font-medium text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {iconMap[toast.type] || iconMap.info}
          <span className="flex-1 leading-relaxed">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
