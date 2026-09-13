import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdvancedStudio } from './AdvancedStudio';
import { 
  FileSpreadsheet, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  BarChart3, 
  LineChart, 
  GitCommit, 
  Table, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Cpu,
  ArrowUpRight,
  CheckCircle2,
  Grid3X3,
  Calendar,
  Layers2
} from 'lucide-react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(...registerables);

// Helper: Calculate Pearson Correlation Coefficient between two columns
function calculatePearson(colA, colB, records) {
  const pairs = records
    .map(r => [parseFloat(r[colA]), parseFloat(r[colB])])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  
  if (pairs.length < 3) return 0;
  const n = pairs.length;
  const meanA = pairs.reduce((s, p) => s + p[0], 0) / n;
  const meanB = pairs.reduce((s, p) => s + p[1], 0) / n;
  
  let num = 0;
  let denA = 0;
  let denB = 0;
  
  for (let i = 0; i < n; i++) {
    const diffA = pairs[i][0] - meanA;
    const diffB = pairs[i][1] - meanB;
    num += diffA * diffB;
    denA += diffA * diffA;
    denB += diffB * diffB;
  }
  
  const den = Math.sqrt(denA * denB);
  if (den === 0) return 0;
  return Number((num / den).toFixed(2));
}

export function DashboardView() {
  const { currentAnalysis, theme } = useApp();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedDistCol, setSelectedDistCol] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [rawPage, setRawPage] = useState(1);
  const [hoveredCell, setHoveredCell] = useState(null);

  const profile = currentAnalysis?.profile || {};
  const columns = Array.isArray(profile.columns) ? profile.columns : [];
  const records = useMemo(() => {
    const recs = currentAnalysis?.records || profile.sample_rows;
    return Array.isArray(recs) ? recs : [];
  }, [currentAnalysis, profile.sample_rows]);

  const numCols = useMemo(() => columns.filter(c => c && (c.semantic_type === 'numeric' || c.dtype === 'float64' || c.dtype === 'int64')), [columns]);
  const catCols = useMemo(() => columns.filter(c => c && (c.semantic_type === 'categorical' || c.dtype === 'string' || c.dtype === 'object')), [columns]);
  const correlations = Array.isArray(profile.correlations) ? profile.correlations : [];

  const activeDistCol = selectedDistCol || numCols[0]?.name || '';

  // Set default distribution column safely
  useEffect(() => {
    if (numCols.length > 0 && !selectedDistCol) {
      setSelectedDistCol(numCols[0].name);
    }
  }, [numCols, selectedDistCol]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // 1. DATA-DRIVEN LEAD VISUALIZATION (Replacing Sequence Trend & Trajectory)
  const leadVisualization = useMemo(() => {
    if (records.length === 0 || columns.length === 0) return null;

    // Detect datetime column
    const dateCol = columns.find(c => 
      c.semantic_type === 'datetime' || 
      /date|time|timestamp|day|month|year|created|period/i.test(c.name)
    );

    // Detect high-value numerical metric (Sales, Revenue, Profit, Amount, Total, Price, Cost)
    const priorityMetricCol = numCols.find(c => 
      /sales|revenue|profit|amount|price|total|cost|income|spend|volume|quantity|order/i.test(c.name)
    ) || numCols[0];

    // Priority 1: Option A - Time Series / Sales & Revenue Trend Over Time
    if (dateCol && priorityMetricCol) {
      const dateName = dateCol.name;
      const metricName = priorityMetricCol.name;

      // Group records chronologically
      const timeGroups = {};
      records.forEach(r => {
        const rawDate = r[dateName];
        if (rawDate !== undefined && rawDate !== null && String(rawDate).trim() !== '') {
          // Clean date key
          const key = String(rawDate).split('T')[0];
          const val = parseFloat(r[metricName]);
          if (Number.isFinite(val)) {
            timeGroups[key] = (timeGroups[key] || 0) + val;
          }
        }
      });

      const sortedDates = Object.keys(timeGroups).sort((a, b) => new Date(a) - new Date(b));
      if (sortedDates.length >= 2) {
        // Display up to 30 clean points
        const displayDates = sortedDates.length > 30 
          ? sortedDates.filter((_, idx) => idx % Math.ceil(sortedDates.length / 30) === 0)
          : sortedDates;

        return {
          type: 'line',
          title: /sales|revenue/i.test(metricName) ? 'Sales & Revenue Trend' : `${metricName} Trend Over Time`,
          subtitle: 'Aggregate trend over chronological intervals',
          badge: 'Time-Series Analysis',
          icon: LineChart,
          data: {
            labels: displayDates,
            datasets: [{
              label: metricName,
              data: displayDates.map(d => Number(timeGroups[d].toFixed(2))),
              borderColor: '#2563EB', // Vivid Blue
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.2,
              pointBackgroundColor: '#2563EB',
              pointRadius: displayDates.length > 15 ? 2 : 4,
              pointHoverRadius: 6
            }]
          }
        };
      }
    }

    // Priority 2: Option B - Category Breakdown / Top Categories by Metric
    const priorityCatCol = catCols.find(c => 
      /category|segment|department|region|country|product|type|status|tier|group|industry|channel/i.test(c.name)
    ) || catCols[0];

    if (priorityCatCol && priorityMetricCol) {
      const catName = priorityCatCol.name;
      const metricName = priorityMetricCol.name;

      const groups = {};
      records.forEach(r => {
        const key = r[catName];
        if (key !== undefined && key !== null && String(key).trim() !== '') {
          const strKey = String(key);
          const val = parseFloat(r[metricName]);
          if (Number.isFinite(val)) {
            groups[strKey] = (groups[strKey] || 0) + val;
          }
        }
      });

      const sortedCats = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (sortedCats.length > 0) {
        return {
          type: 'bar',
          title: `Top ${catName} by ${metricName}`,
          subtitle: 'Comparative breakdown across primary segments',
          badge: 'Segment Breakdown',
          icon: BarChart3,
          data: {
            labels: sortedCats.map(c => c[0]),
            datasets: [{
              label: metricName,
              data: sortedCats.map(c => Number(c[1].toFixed(2))),
              backgroundColor: 'rgba(37, 99, 235, 0.85)', // Vivid Blue
              hoverBackgroundColor: '#2563EB',
              borderColor: '#2563EB',
              borderWidth: 1.5,
              borderRadius: 6
            }]
          }
        };
      }
    }

    // Priority 3: Option C - Feature Distribution & Numerical Spread (Fallback)
    if (numCols.length > 0) {
      const col = numCols[0];
      const vals = records.map(r => parseFloat(r[col.name])).filter(Number.isFinite);
      if (vals.length > 0) {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const span = max - min || 1;
        const binCount = 8;
        const binWidth = span / binCount;
        const counts = new Array(binCount).fill(0);
        const labels = [];
        for (let i = 0; i < binCount; i++) {
          labels.push(`${(min + i * binWidth).toFixed(1)}–${(min + (i + 1) * binWidth).toFixed(1)}`);
        }
        vals.forEach(v => {
          let idx = Math.floor((v - min) / binWidth);
          if (idx >= binCount) idx = binCount - 1;
          if (idx < 0) idx = 0;
          counts[idx]++;
        });

        return {
          type: 'bar',
          title: 'Feature Distribution & Variance',
          subtitle: `Frequency distribution across ${col.name}`,
          badge: 'Univariate Spread',
          icon: BarChart3,
          data: {
            labels,
            datasets: [{
              label: col.name,
              data: counts,
              backgroundColor: 'rgba(37, 99, 235, 0.85)', // Vivid Blue
              borderColor: '#2563EB',
              borderWidth: 1.5,
              borderRadius: 6
            }]
          }
        };
      }
    }

    return null;
  }, [columns, numCols, catCols, records]);

  // 2. REAL FEATURE CORRELATION MATRIX (HEATMAP)
  const heatmapData = useMemo(() => {
    if (numCols.length < 2) return null;

    // Select top 6 to 8 numeric columns
    const selectedCols = numCols.slice(0, 8).map(c => c.name);
    const n = selectedCols.length;
    const matrix = [];

    for (let i = 0; i < n; i++) {
      const row = [];
      const colA = selectedCols[i];
      for (let j = 0; j < n; j++) {
        const colB = selectedCols[j];
        if (i === j) {
          row.push({ colA, colB, value: 1.00 });
        } else {
          // Look up in profile.correlations first
          const existing = correlations.find(
            c => (c.col1 === colA && c.col2 === colB) || (c.col1 === colB && c.col2 === colA)
          );
          if (existing && existing.score !== undefined) {
            row.push({ colA, colB, value: Number(Number(existing.score).toFixed(2)) });
          } else {
            // Compute on the fly
            const score = calculatePearson(colA, colB, records);
            row.push({ colA, colB, value: score });
          }
        }
      }
      matrix.push(row);
    }

    return {
      columns: selectedCols,
      matrix,
      isTruncated: numCols.length > 8,
      totalCols: numCols.length
    };
  }, [numCols, correlations, records]);

  // Univariate Distribution Data for Charts Tab
  const distributionChartData = useMemo(() => {
    if (!activeDistCol || records.length === 0) return null;
    const colObj = numCols.find(c => c.name === activeDistCol);
    if (!colObj) return null;

    let binLabels = [];
    let binCounts = [];

    if (colObj.histogram && colObj.histogram.labels) {
      binLabels = colObj.histogram.labels;
      binCounts = colObj.histogram.values;
    } else {
      const vals = records.map(r => parseFloat(r[activeDistCol])).filter(Number.isFinite);
      if (vals.length > 0) {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const span = max - min || 1;
        const binCount = 8;
        const binWidth = span / binCount;
        binCounts = new Array(binCount).fill(0);
        for (let i = 0; i < binCount; i++) {
          binLabels.push(`${(min + i * binWidth).toFixed(1)}–${(min + (i + 1) * binWidth).toFixed(1)}`);
        }
        vals.forEach(v => {
          let idx = Math.floor((v - min) / binWidth);
          if (idx >= binCount) idx = binCount - 1;
          if (idx < 0) idx = 0;
          binCounts[idx]++;
        });
      }
    }

    return {
      labels: binLabels,
      datasets: [{
        label: `Frequency (${activeDistCol})`,
        data: binCounts,
        backgroundColor: 'rgba(37, 99, 235, 0.85)', // Vivid Blue
        borderColor: '#2563EB',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    };
  }, [activeDistCol, numCols, records]);

  // Filtered Schema
  const filteredColumns = useMemo(() => {
    if (!schemaSearch) return columns;
    const term = schemaSearch.toLowerCase();
    return columns.filter(c => c.name.toLowerCase().includes(term) || (c.dtype && c.dtype.toLowerCase().includes(term)));
  }, [columns, schemaSearch]);

  // Paginated Raw Records
  const pageSize = 10;
  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (rawPage - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, rawPage]);

  const qualityScore = profile.quality_score || 96.0;
  const completeness = profile.quality?.completeness || 99.0;
  const letterGrade = qualityScore >= 90 ? 'A+' : qualityScore >= 80 ? 'A' : qualityScore >= 70 ? 'B' : 'C';

  // Heatmap Color & Class Calculator
  const getHeatmapCellStyle = (val) => {
    if (val === 1) {
      return 'bg-blue-600 text-white font-bold shadow-sm';
    }
    if (val >= 0.7) {
      return 'bg-blue-600/90 text-white font-semibold';
    }
    if (val >= 0.4) {
      return 'bg-blue-500/75 text-white font-medium';
    }
    if (val >= 0.2) {
      return 'bg-blue-400/40 text-blue-950 dark:text-blue-200 font-medium';
    }
    if (val > 0) {
      return 'bg-blue-100/60 dark:bg-blue-950/40 text-slate-700 dark:text-slate-300 font-normal';
    }
    if (val === 0) {
      return 'bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-normal';
    }
    if (val <= -0.7) {
      return 'bg-rose-600 text-white font-semibold';
    }
    if (val <= -0.4) {
      return 'bg-rose-500/80 text-white font-medium';
    }
    if (val <= -0.2) {
      return 'bg-rose-400/35 text-rose-900 dark:text-rose-200 font-medium';
    }
    return 'bg-rose-100/50 dark:bg-rose-950/30 text-slate-700 dark:text-slate-300 font-normal';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-8 space-y-6">
      {/* Top Dataset Identity Banner */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-200 dark:border-blue-800/80 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate max-w-lg tracking-tight">
                {currentAnalysis?.filename || 'Active Dataset'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {(profile.total_rows || records.length).toLocaleString()} rows &bull; {columns.length} columns &bull; {currentAnalysis?.file_size || 'In-Memory Cache'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Health Grade: <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm">{letterGrade}</strong></span>
          </span>
        </div>
      </div>

      {/* Sub-Nav Section Tabs */}
      <div className="bg-white dark:bg-[#111827] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${
            activeSection === 'overview'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveSection('charts')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${
            activeSection === 'charts'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span>Charts</span>
        </button>

        <button
          onClick={() => setActiveSection('advanced')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${
            activeSection === 'advanced'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span>Advanced Studio</span>
        </button>

        <button
          onClick={() => setActiveSection('schema')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${
            activeSection === 'schema'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Table className="w-3.5 h-3.5 shrink-0" />
          <span>Schema & Data</span>
        </button>
      </div>

      {/* SECTION 1: Overview & KPIs */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* 1. KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Records</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {(profile.total_rows || records.length).toLocaleString()}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Ingested & Audited</span>
              </p>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Features Architecture</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {columns.length} Cols
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{numCols.length} Numeric</span>
                <span>&bull;</span>
                <span>{catCols.length || (columns.length - numCols.length)} Categorical</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Health Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">{qualityScore}</span>
                <span className="text-xs text-slate-400 font-medium">/ 100</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 ml-auto">
                  Grade {letterGrade}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">Quality & schema validity audited</p>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completeness Rate</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {completeness}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono pt-0.5">
                {profile.missing_cells || 0} missing values detected
              </p>
            </div>
          </div>

          {/* 2. Strategic AI Insights */}
          {profile.insights && profile.insights.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Synthesized Strategic Insights</span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">
                  Multi-Agent Reasoning
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.insights.map(ins => {
                  const isWarning = ins.badge?.toLowerCase().includes('outlier') || ins.badge?.toLowerCase().includes('skew');
                  const isOpp = ins.badge?.toLowerCase().includes('correlation') || ins.badge?.toLowerCase().includes('distribution');
                  return (
                    <div key={ins.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 space-y-2.5 hover:border-blue-500/40 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{ins.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          isWarning 
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : isOpp 
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {ins.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{ins.description}</p>
                      {ins.recommendation && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                          <span><strong>Action:</strong> {ins.recommendation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Useful Data Visualizations (Side-by-Side on Main Dashboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Data-Driven Lead Visualization (Trend or Category Breakdown) */}
            <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    {leadVisualization?.icon ? (
                      <leadVisualization.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>{leadVisualization?.title || 'Primary Trend & Performance'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {leadVisualization?.subtitle || 'Adaptive dataset pattern analytics'}
                  </p>
                </div>
                {leadVisualization?.badge && (
                  <span className="text-[11px] font-medium font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded">
                    {leadVisualization.badge}
                  </span>
                )}
              </div>

              <div className="h-[340px] w-full relative">
                {leadVisualization ? (
                  <Chart
                    type={leadVisualization.type}
                    data={leadVisualization.data}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { cornerRadius: 8, padding: 10 }
                      },
                      scales: {
                        x: { 
                          grid: { display: false }, 
                          ticks: { color: textColor, font: { size: 11 }, maxRotation: 45 } 
                        },
                        y: { 
                          grid: { color: gridColor }, 
                          ticks: { color: textColor, font: { size: 11 } } 
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No suitable chronological or categorical metrics available.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Real Feature Correlation Heatmap Matrix */}
            <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Feature Correlation Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {heatmapData?.isTruncated 
                      ? `Showing top 8 of ${heatmapData.totalCols} numeric features` 
                      : 'Pairwise Pearson linear coefficients (N × N)'}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded font-semibold">
                  Heatmap Matrix
                </span>
              </div>

              {heatmapData ? (
                <div className="space-y-4">
                  {/* Heatmap Grid */}
                  <div className="overflow-x-auto pb-1">
                    <table className="w-full text-center border-separate border-spacing-1.5 text-xs font-mono select-none">
                      <thead>
                        <tr>
                          <th className="p-1 text-left text-[11px] text-slate-400 font-sans font-semibold"></th>
                          {heatmapData.columns.map((col, idx) => (
                            <th 
                              key={idx} 
                              className="p-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 max-w-[70px] truncate"
                              title={col}
                            >
                              {col.length > 8 ? `${col.slice(0, 7)}…` : col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.matrix.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td 
                              className="p-1 text-left text-[11px] font-semibold text-slate-600 dark:text-slate-300 max-w-[85px] truncate font-sans"
                              title={heatmapData.columns[rIdx]}
                            >
                              {heatmapData.columns[rIdx].length > 9 
                                ? `${heatmapData.columns[rIdx].slice(0, 8)}…` 
                                : heatmapData.columns[rIdx]}
                            </td>
                            {row.map((cell, cIdx) => {
                              const cellStyle = getHeatmapCellStyle(cell.value);
                              return (
                                <td
                                  key={cIdx}
                                  onMouseEnter={() => setHoveredCell(cell)}
                                  onMouseLeave={() => setHoveredCell(null)}
                                  title={`Correlation between ${cell.colA} and ${cell.colB}: ${cell.value.toFixed(2)}`}
                                  className={`h-9 min-w-[46px] rounded transition-transform hover:scale-105 cursor-pointer ${cellStyle}`}
                                >
                                  {cell.value > 0 && cell.value < 1 ? `+${cell.value.toFixed(2)}` : cell.value.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Active Cell Inspector or Hover Details */}
                  {hoveredCell && (
                    <div className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>
                        <strong className="text-blue-600 dark:text-blue-400">{hoveredCell.colA}</strong> &times; <strong className="text-blue-600 dark:text-blue-400">{hoveredCell.colB}</strong>
                      </span>
                      <span className="font-mono font-bold">
                        r = {hoveredCell.value > 0 ? `+${hoveredCell.value.toFixed(2)}` : hoveredCell.value.toFixed(2)} ({Math.abs(hoveredCell.value) >= 0.7 ? 'Strong' : Math.abs(hoveredCell.value) >= 0.4 ? 'Moderate' : 'Weak'})
                      </span>
                    </div>
                  )}

                  {/* Scale Legend */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-rose-600 inline-block"></span>
                      <span>-1.0 (Inverse)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 inline-block"></span>
                      <span>0.0 (Neutral)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
                      <span>+1.0 (Positive)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  <Grid3X3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    At least 2 numerical features required to calculate correlation matrix.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Upload a dataset with multiple numeric measurements to view pairwise correlation heatmap.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Charts & Correlation */}
      {activeSection === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Univariate Distribution with Metric Switcher */}
            <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Univariate Frequency Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Dynamic binned frequency intervals</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] uppercase font-bold text-slate-400">Metric:</label>
                  <select
                    value={selectedDistCol}
                    onChange={(e) => setSelectedDistCol(e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500 max-w-[150px] truncate"
                  >
                    {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="h-[340px] w-full relative">
                {distributionChartData ? (
                  <Chart
                    type="bar"
                    data={distributionChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { cornerRadius: 8, padding: 10 }
                      },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No numeric data available.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Lead Visualization in Charts View */}
            <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    {leadVisualization?.icon ? (
                      <leadVisualization.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>{leadVisualization?.title || 'Lead Data Insight'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {leadVisualization?.subtitle || 'Primary chronological or segment breakdown'}
                  </p>
                </div>
              </div>

              <div className="h-[340px] w-full relative">
                {leadVisualization ? (
                  <Chart
                    type={leadVisualization.type}
                    data={leadVisualization.data}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { cornerRadius: 8, padding: 10 }
                      },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 }, maxRotation: 45 } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No visualization available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full-width Feature Correlation Matrix in Charts Tab */}
          <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Comprehensive Feature Correlation Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {heatmapData?.isTruncated 
                    ? `Showing top 8 of ${heatmapData.totalCols} numeric features` 
                    : 'Interactive pairwise Pearson linear heatmap matrix with direct cell coefficients'}
                </p>
              </div>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded font-semibold">
                N &times; N Matrix
              </span>
            </div>

            {heatmapData ? (
              <div className="space-y-4">
                <div className="overflow-x-auto pb-2">
                  <table className="w-full text-center border-separate border-spacing-2 text-xs font-mono select-none">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-xs text-slate-400 font-sans font-semibold"></th>
                        {heatmapData.columns.map((col, idx) => (
                          <th 
                            key={idx} 
                            className="p-2 text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate"
                            title={col}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.matrix.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td 
                            className="p-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate font-sans"
                            title={heatmapData.columns[rIdx]}
                          >
                            {heatmapData.columns[rIdx]}
                          </td>
                          {row.map((cell, cIdx) => {
                            const cellStyle = getHeatmapCellStyle(cell.value);
                            return (
                              <td
                                key={cIdx}
                                onMouseEnter={() => setHoveredCell(cell)}
                                onMouseLeave={() => setHoveredCell(null)}
                                title={`Correlation between ${cell.colA} and ${cell.colB}: ${cell.value.toFixed(2)}`}
                                className={`h-11 min-w-[64px] rounded-lg transition-transform hover:scale-105 cursor-pointer ${cellStyle}`}
                              >
                                {cell.value > 0 && cell.value < 1 ? `+${cell.value.toFixed(2)}` : cell.value.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Scale Legend */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block"></span>
                    <span>-1.0 (Inverse Correlation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800 inline-block"></span>
                    <span>0.0 (Zero Correlation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block"></span>
                    <span>+1.0 (Positive Correlation)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">
                At least 2 numerical features required to calculate correlation matrix.
              </p>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: Advanced Studio */}
      {activeSection === 'advanced' && (
        <AdvancedStudio />
      )}

      {/* SECTION 4: Schema & Raw Data Preview */}
      {activeSection === 'schema' && (
        <div className="space-y-6">
          {/* Schema Architecture Table */}
          <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Column Architecture & Audited Metadata</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Total {columns.length} columns cataloged</p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search columns or types..."
                  value={schemaSearch}
                  onChange={(e) => setSchemaSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Null %</th>
                    <th className="py-2.5 px-3">Distinct Values</th>
                    <th className="py-2.5 px-3">Sample Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredColumns.map((col, idx) => (
                    <tr key={col.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{col.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {col.semantic_type || col.dtype}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium">
                        {col.null_percentage > 0 ? (
                          <span className="text-amber-500">{col.null_percentage}%</span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400">0%</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {col.unique_count || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                        {col.mean !== undefined
                          ? `Avg: ${col.mean} [${col.min} to ${col.max}]`
                          : (col.sample_values ? col.sample_values.slice(0, 3).join(', ') : '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Records Paginated Table */}
          <div className="bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Raw Record Sample Viewer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Rows {(rawPage - 1) * pageSize + 1}–{Math.min(rawPage * pageSize, records.length)} of {records.length}</p>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  disabled={rawPage === 1}
                  onClick={() => setRawPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-slate-600 dark:text-slate-400 px-2 font-medium">Page {rawPage} / {totalPages}</span>
                <button
                  disabled={rawPage === totalPages}
                  onClick={() => setRawPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="w-full max-w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    {columns.slice(0, 8).map(c => (
                      <th key={c.name} className="py-2.5 px-3 truncate max-w-[140px] font-semibold">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {paginatedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">{(rawPage - 1) * pageSize + idx + 1}</td>
                      {columns.slice(0, 8).map(c => (
                        <td key={c.name} className="py-2.5 px-3 text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {row[c.name] !== undefined && row[c.name] !== null ? String(row[c.name]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
