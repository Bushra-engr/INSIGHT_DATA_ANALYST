import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Sliders, 
  History, 
  UploadCloud, 
  BarChart3, 
  HelpCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function Sidebar() {
  const { activeView, switchView } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chartmaker', label: 'Chart Maker', icon: Sliders },
    { id: 'history', label: 'History', icon: History },
    { id: 'landing', label: 'Ingest Data', icon: UploadCloud },
    { id: 'home', label: 'Product Tour', icon: Sparkles }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 xl:w-64 h-full shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] select-none z-30 transition-colors">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
        <button 
          onClick={() => switchView('dashboard')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-500 transition-colors">
            <BarChart3 className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
            AI DATA ANALYST
          </span>
        </button>
      </div>

      {/* Primary Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => switchView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors text-left ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Utility & Upgrade Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2 shrink-0">
        {/* Help */}
        <div className="space-y-0.5">
          <button 
            onClick={() => switchView('landing')}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Help & Support</span>
          </button>
        </div>

        {/* Upgrade to Pro Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Unlock advanced statistical analysis & unlimited datasets.
          </p>
          <button 
            onClick={() => alert('Pro tier subscription coming soon!')}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pt-0.5"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
