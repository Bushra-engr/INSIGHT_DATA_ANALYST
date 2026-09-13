import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingView } from './components/landing/LandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ChartMakerView } from './components/chartmaker/ChartMakerView';
import { HistoryView } from './components/history/HistoryView';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer } from './components/ui/Toast';
import { MarketingLandingPage } from './components/marketing/MarketingLandingPage';
import { GlobalLoadingBar } from './components/ui/GlobalLoadingBar';

export function MainLayout() {
  const { activeView } = useApp();

  // Standalone Marketing Landing Page
  if (activeView === 'home') {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0B0F19] text-slate-100 antialiased selection:bg-blue-600/30 selection:text-blue-400">
        <GlobalLoadingBar />
        <MarketingLandingPage />
        <AuthModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-full overflow-hidden bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex relative antialiased selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-400 transition-colors">
      <GlobalLoadingBar />
      {/* Slim Desktop Sidebar Navigation (Fixed Full Viewport Height) */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Compact Top Header Bar */}
        <Navbar />

        {/* Dynamic View Router with Independent Scroll Container */}
        <main className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden">
          {activeView === 'landing' && <LandingView />}
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'chartmaker' && <ChartMakerView />}
          {activeView === 'history' && <HistoryView />}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return <MainLayout />;
}
