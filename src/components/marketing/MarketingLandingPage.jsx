import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  Sparkles, 
  ArrowRight, 
  UploadCloud, 
  Check, 
  CheckCircle2, 
  Activity, 
  Grid3X3, 
  Sliders, 
  ShieldCheck, 
  Database, 
  Workflow,
  LogIn
} from 'lucide-react';

export function MarketingLandingPage() {
  const { switchView, setAuthModal } = useApp();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0B0F19] text-slate-100 font-sans antialiased selection:bg-blue-600/30 selection:text-blue-400">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full max-w-full backdrop-blur-md bg-[#0B0F19]/90 border-b border-slate-800/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <button 
              onClick={() => switchView('dashboard')} 
              className="flex items-center gap-2 group focus:outline-none cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:bg-blue-500 transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                AI DATA ANALYST
              </span>
            </button>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v2.0
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-300">
            <button onClick={() => switchView('dashboard')} className="hover:text-white transition-colors cursor-pointer">Dashboard</button>
            <button onClick={() => switchView('chartmaker')} className="hover:text-white transition-colors cursor-pointer">Chart Maker</button>
            <button onClick={() => switchView('history')} className="hover:text-white transition-colors cursor-pointer">History</button>
            <button onClick={() => switchView('landing')} className="hover:text-white transition-colors cursor-pointer">Ingest Dataset</button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
              className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => switchView('dashboard')}
              className="px-3 sm:px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all cursor-pointer shrink-0"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-16 sm:pt-20 sm:pb-20 overflow-hidden w-full max-w-full">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[220px] sm:h-[280px] bg-blue-600/20 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs sm:text-sm font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>High-Speed Tabular Analytics & DuckDB Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Comprehensive Data Intelligence for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400">Modern Teams</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Upload any CSV or Excel sheet. Get instant statistical audits, correlation heatmaps, custom interactive charts, and distribution profiles — computed dynamically with sub-second performance.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => switchView('dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-600/40 hover:shadow-blue-500/50 transition-all cursor-pointer"
            >
              <span>Launch Dashboard — Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => switchView('landing')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-blue-400" />
              <span>Upload Your Dataset</span>
            </button>
          </div>

          {/* Micro Proof Points */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2 flex-wrap">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400" /> Zero configuration</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400" /> In-memory DuckDB processing</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-400" /> Enterprise data isolation</span>
          </div>
        </div>
      </section>

      {/* 3. VALUE METRIC STRIP */}
      <section className="border-y border-slate-800 bg-[#111827]/60 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-0.5">
              <div className="text-2xl font-bold font-mono text-blue-400">100%</div>
              <p className="text-xs text-slate-400">In-Memory DuckDB</p>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold font-mono text-blue-400">10+</div>
              <p className="text-xs text-slate-400">Statistical Tests</p>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold font-mono text-blue-400">Real-Time</div>
              <p className="text-xs text-slate-400">Statistical Engine</p>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold font-mono text-blue-400">&lt; 1.2s</div>
              <p className="text-xs text-slate-400">Pipeline Execution Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE CAPABILITIES (4 CARDS) */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">Platform Capabilities</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">Everything Needed to Analyze Tabular Data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1 */}
          <div className="p-5 rounded-xl bg-[#111827]/70 border border-slate-800 hover:border-blue-500/40 transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Automated Ingestion & Health Audit</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Drag-and-drop CSV or XLSX files up to 50MB. Automatically infers data types, audits null percentages, and computes data health scores with actionable recommendations.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-xl bg-[#111827]/70 border border-slate-800 hover:border-blue-500/40 transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Dynamic N &times; N Correlation Heatmap</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Calculates real Pearson correlation coefficients dynamically from active dataset records. Features blue intensity scaling, exact cell values, and interactive tooltips.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-xl bg-[#111827]/70 border border-slate-800 hover:border-blue-500/40 transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Statistical & Outlier Profiling</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Interactive Tukey box plots with 1.5&times; IQR outlier boundary fences, Gaussian Kernel Density Estimation (KDE) curves, and Ordinary Least Squares (OLS) regression metrics.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-xl bg-[#111827]/70 border border-slate-800 hover:border-blue-500/40 transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Interactive Chart & Advanced Studio</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Build custom Bar, Line, Area, or Pie charts with unaggregated row plotting support, box plots, OLS linear regression lines, and bivariate scatter analyses.
            </p>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="py-14 bg-[#111827]/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">Streamlined Workflow</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">How It Works in 3 Steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h4 className="font-bold text-base text-white">Upload Dataset</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drop your CSV or XLSX file. Instant schema extraction, null auditing, and statistical profiling occur in seconds.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h4 className="font-bold text-base text-white">Statistical & Outlier Analysis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compute Pearson correlations, Tukey outlier fences, z-score deviations, and parametric distributions in seconds.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h4 className="font-bold text-base text-white">Explore & Decide</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interact with correlation heatmaps, KPI metrics, custom chart studios, and statistical summaries in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA */}
      <section className="py-16 text-center space-y-5 px-4 sm:px-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
          Ready to Analyze Your Data?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Start exploring your datasets in 10 seconds. No setup required, zero lock-in, free forever.
        </p>
        <button
          onClick={() => switchView('dashboard')}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 7. CLEAN FOOTER */}
      <footer className="border-t border-slate-800 bg-[#0B0F19] py-8 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-xs">AI DATA ANALYST</span>
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <button onClick={() => switchView('dashboard')} className="hover:text-white transition-colors cursor-pointer">Dashboard</button>
            <button onClick={() => switchView('chartmaker')} className="hover:text-white transition-colors cursor-pointer">Chart Maker</button>
            <button onClick={() => switchView('history')} className="hover:text-white transition-colors cursor-pointer">History</button>
            <button onClick={() => switchView('landing')} className="hover:text-white transition-colors cursor-pointer">Ingest Dataset</button>
          </div>

          <p>&copy; 2026 AI Data Analyst. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
