import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  LineChart, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Loader2,
  Database,
  BrainCircuit,
  BarChart2,
} from 'lucide-react';

// ── Pipeline step definitions ────────────────────────────────────────────────
// pctStart/pctEnd bracket the onProgress range that maps to each step.
const PIPELINE_STEPS = [
  {
    num: '01',
    icon: Database,
    title: 'Upload Dataset',
    desc: 'Schema extraction, null auditing, and statistical profiling.',
    pctStart: 0,
    pctEnd: 40,
    activeLabel: 'Reading & ingesting file bytes...',
    doneLabel:   'File ingested ✓',
  },
  {
    num: '02',
    icon: BrainCircuit,
    title: 'Statistical & Outlier Analysis',
    desc: 'Pearson correlations, Tukey outlier fences, z-score deviations, and distributions.',
    pctStart: 40,
    pctEnd: 85,
    activeLabel: 'Computing statistical audits & outlier detection...',
    doneLabel:   'Analysis complete ✓',
  },
  {
    num: '03',
    icon: BarChart2,
    title: 'Explore & Decide',
    desc: 'Correlation heatmaps, KPI metrics, Chart Studio, and statistical insights.',
    pctStart: 85,
    pctEnd: 101,
    activeLabel: 'Finalizing results & building dashboard...',
    doneLabel:   'Ready to explore ✓',
  },
];

function getStepState(step, progress, isRunning) {
  if (!isRunning) return 'idle';
  if (progress >= step.pctEnd) return 'done';
  if (progress >= step.pctStart) return 'active';
  return 'pending';
}

function PipelineTracker({ uploadProgress }) {
  const { isUploading, progress, status } = uploadProgress;

  return (
    <div className="space-y-3">
      {/* Progress bar + label */}
      {isUploading && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold truncate">{status}</span>
            <span className="ml-auto text-xs font-bold font-mono text-slate-500 dark:text-slate-400 shrink-0">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PIPELINE_STEPS.map((step) => {
          const state = getStepState(step, progress, isUploading);
          const Icon = step.icon;
          const isDoneStep   = state === 'done';
          const isActiveStep = state === 'active';

          return (
            <div
              key={step.num}
              className={`relative p-4 rounded-xl border transition-all duration-500 ${
                isActiveStep
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md shadow-blue-500/10'
                  : isDoneStep
                  ? 'border-emerald-400/60 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] opacity-60'
              }`}
            >
              {/* Step number badge + category icon */}
              <div className="flex items-start justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                  isActiveStep ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/40'
                  : isDoneStep  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}>
                  {isActiveStep ? <Loader2 className="w-4 h-4 animate-spin" />
                   : isDoneStep  ? <CheckCircle2 className="w-4 h-4" />
                   : <span>{step.num}</span>}
                </div>
                <Icon className={`w-4 h-4 mt-1 ${
                  isActiveStep ? 'text-blue-500'
                  : isDoneStep  ? 'text-emerald-500'
                  : 'text-slate-400 dark:text-slate-600'
                }`} />
              </div>

              <h4 className={`font-bold text-sm mb-1 ${
                isActiveStep ? 'text-blue-700 dark:text-blue-300'
                : isDoneStep  ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-700 dark:text-slate-300'
              }`}>
                {step.title}
              </h4>

              <p className={`text-[11px] leading-relaxed ${
                isActiveStep || isDoneStep ? 'text-slate-600 dark:text-slate-400'
                : 'text-slate-400 dark:text-slate-600'
              }`}>
                {isActiveStep ? step.activeLabel : isDoneStep ? step.doneLabel : step.desc}
              </p>

              {/* Pulse dot on active step */}
              {isActiveStep && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


export function LandingView() {
  const { handleFileUpload, loadDemoDataset, uploadProgress } = useApp();
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 overflow-x-hidden">
      {/* Hero Header */}
      <div className="text-center space-y-3.5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>High-Performance Tabular Analytics Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Comprehensive Analytics for <br />
          <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 bg-clip-text text-transparent">
            Complex Tabular Datasets
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Ingest CSV or Excel files to instantly generate comprehensive statistical audits, univariate & bivariate visual studios, OLS regressions, and high-precision data quality insights.
        </p>
      </div>

      {/* Upload Zone Card */}
      <div className="max-w-xl mx-auto bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {uploadProgress.isUploading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <UploadCloud className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Pipeline Running — see steps below</h3>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
              isDragOver
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-blue-200 dark:border-blue-800">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Drag & Drop your dataset here, or <span className="text-blue-600 dark:text-blue-400 underline underline-offset-4 font-bold">browse</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              Supports .CSV and .XLSX files up to 50MB. Complete statistical profile generated automatically.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">CSV</span>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">XLSX</span>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">50MB Max</span>
            </div>
          </div>
        )}

        {/* Demo Dataset Action */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Don't have a dataset ready?</span>
          </div>
          <button
            onClick={loadDemoDataset}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Load Demo Dataset (14,850 records)</span>
          </button>
        </div>
      </div>

      {/* ── LIVE ANALYSIS PIPELINE TRACKER ──────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <BrainCircuit className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Analysis Pipeline
          </span>
          {uploadProgress.isUploading ? (
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-pulse">
              RUNNING
            </span>
          ) : (
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
              IDLE — upload a file to start
            </span>
          )}
        </div>
        <PipelineTracker uploadProgress={uploadProgress} />
      </div>

      {/* Feature Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Automated Quality Audits</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Instant evaluation of data health: null cell auditing, completeness scores, Tukey outlier fences, and schema classification.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
            <LineChart className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Statistical Visual Studio</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            High-definition Univariate distributions, Gaussian KDE overlays, OLS Linear Regression lines with R², Box & Whisker plots, and Joint distributions.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <Sliders className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Interactive Chart Studio</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Build custom Bar, Line, Area, or Pie charts. Select Y-Axis as "None" to instantly produce univariate frequency distributions and binned intervals.
          </p>
        </div>
      </div>
    </div>
  );
}
