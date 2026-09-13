import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  History as HistoryIcon, 
  FileSpreadsheet, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Clock,
  RotateCw
} from 'lucide-react';

export function HistoryView() {
  const { history, currentAnalysis, loadDataset, deleteHistoryItem, switchView, refreshHistory } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshHistory) await refreshHistory();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HistoryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Dataset Ingestion & Analysis History</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review, activate, and switch between previously audited and profiled tabular datasets.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{isRefreshing ? 'Syncing History...' : 'Refresh History'}</span>
        </button>
      </div>

      {history && history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => {
            const isActive = currentAnalysis?.id === item.id;
            const rows = item.profile?.total_rows || item.profile?.shape?.rows || item.row_count || item.records?.length || 0;
            const cols = item.profile?.total_columns || item.profile?.shape?.columns || item.column_count || item.profile?.columns?.length || 0;
            const score = item.profile?.quality_score || item.profile?.quality?.score || 95.0;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#111827] rounded-xl border p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm ${
                  isActive 
                    ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/30' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Title & Badge */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200 dark:border-blue-800">
                      <FileSpreadsheet className="w-4 h-4" />
                    </span>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        ACTIVE NOW
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.uploaded_at || Date.now()).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={item.filename}>
                    {item.filename}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>{rows.toLocaleString()} rows</span>
                    <span>&bull;</span>
                    <span>{cols} cols</span>
                    <span>&bull;</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{score}/100</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {isActive ? (
                    <button
                      onClick={() => switchView('dashboard')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-blue-500 transition-colors shadow-sm"
                    >
                      <span>Open in Dashboard</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => loadDataset(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>Activate Dataset</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {history.length > 1 && (
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No History Items Available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your first dataset on the Ingest Data page to see your analysis logs.
          </p>
        </div>
      )}
    </div>
  );
}
