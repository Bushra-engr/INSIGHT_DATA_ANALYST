import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileDown, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  LogIn, 
  ChevronDown,
  LayoutDashboard,
  Sliders,
  History,
  UploadCloud,
  Menu,
  X,
  Plus,
  Sparkles,
  UserCheck
} from 'lucide-react';

export function Navbar() {
  const { 
    currentAnalysis, 
    theme, 
    toggleTheme, 
    exportToPDF, 
    user, 
    setAuthModal, 
    logoutUser,
    switchToGuestMode,
    activeView,
    switchView
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalRows = currentAnalysis?.profile?.total_rows || currentAnalysis?.profile?.shape?.rows || currentAnalysis?.row_count || currentAnalysis?.records?.length || 0;
  const isGuest = !user?.email || user.email === 'guest@analyst.io' || user.email.includes('analyst');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chartmaker', label: 'Chart Maker', icon: Sliders },
    { id: 'history', label: 'History', icon: History },
    { id: 'landing', label: 'Ingest Data', icon: UploadCloud },
    { id: 'home', label: 'Product Tour', icon: Sparkles }
  ];

  const handleNavClick = (id) => {
    switchView(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 w-full max-w-full bg-white dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="h-14 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 w-full max-w-full">
        {/* Left: Mobile Toggle & Active Dataset Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          {/* Active Dataset Pill */}
          {currentAnalysis ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs min-w-0">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px] sm:max-w-[140px] md:max-w-[180px]">
                {currentAnalysis.filename}
              </span>
              <span className="hidden md:inline text-slate-400 font-mono text-[11px] shrink-0">
                ({totalRows.toLocaleString()} rows)
              </span>
              <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                ACTIVE
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Data Workspace</span>
            </div>
          )}
        </div>

        {/* Center: Clean Spacer */}
        <div className="flex-1" />

        {/* Right: Actions, Theme, and Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Primary Action Button: Ingest New Dataset */}
          <button
            onClick={() => switchView('landing')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
            title="Ingest New Dataset"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ingest</span>
          </button>

          {/* PDF Export (Visible on Dashboard) */}
          {activeView === 'dashboard' && currentAnalysis && (
            <button
              onClick={exportToPDF}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0"
              title="Export Report to PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export PDF</span>
            </button>
          )}

          {/* Theme Toggle (Sun/Moon) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Account / Direct Sign In Button */}
          {!user || isGuest ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                Guest Mode
              </span>
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden md:inline font-semibold truncate max-w-[120px]">{user?.name || 'Account'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Account'}</p>
                    {user?.email && (
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      switchToGuestMode();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Switch to Guest Mode</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logoutUser();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-rose-500 font-semibold border-t border-slate-100 dark:border-slate-800/80 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] px-4 py-3 space-y-1 shadow-lg">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full px-3 py-2 rounded-lg text-[14px] font-medium flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
