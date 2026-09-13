import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CONFIG } from '../../services/config';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Sliders, Download, Layers, BarChart3 } from 'lucide-react';

ChartJS.register(...registerables);

// Gaussian KDE — same algorithm as AdvancedStudio univariate tab
function gaussianKDE(values, bandwidth, points) {
  const n = values.length;
  if (n === 0) return points.map(() => 0);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n);
  const bw = bandwidth || (1.06 * std * Math.pow(n, -0.2)) || 1;
  return points.map(x =>
    values.reduce((sum, xi) => sum + Math.exp(-0.5 * Math.pow((x - xi) / bw, 2)), 0) /
    (n * bw * Math.sqrt(2 * Math.PI))
  );
}


export function ChartMakerView() {
  const { currentAnalysis, theme } = useApp();
  const chartRef = useRef(null);

  const columns = Array.isArray(currentAnalysis?.profile?.columns) ? currentAnalysis.profile.columns : [];
  const records = useMemo(() => {
    const recs = currentAnalysis?.records || currentAnalysis?.profile?.sample_rows;
    return Array.isArray(recs) ? recs : [];
  }, [currentAnalysis]);
  const numCols = useMemo(() => columns.filter(c => c && (c.semantic_type === 'numeric' || c.dtype === 'float64' || c.dtype === 'int64')), [columns]);
  const catCols = useMemo(() => columns.filter(c => c && (c.semantic_type === 'categorical' || c.dtype === 'string' || c.dtype === 'object')), [columns]);

  // Controls State (Default to 'blue' Vivid Blue)
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('none'); // Default to None!
  const [hueAxis, setHueAxis] = useState('none');
  const [palette, setPalette] = useState('blue');
  const [customColor, setCustomColor] = useState('#6366f1');
  const [aggregation, setAggregation] = useState('sum');

  const activeXAxis = xAxis || columns[0]?.name || '';
  const isKdeType = chartType === 'kde' || chartType === 'histkde';

  // Set default axes safely via useEffect
  useEffect(() => {
    if (columns.length > 0 && !xAxis) {
      setXAxis(columns[0].name);
    }
  }, [columns, xAxis]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const palObj = palette === 'custom'
    ? { primary: customColor, colors: [customColor, customColor + 'bb', customColor + '77'] }
    : (CONFIG.COLOR_PALETTES[palette] || CONFIG.COLOR_PALETTES.blue);
  const primaryColor = palObj.primary || '#2563eb';
  const themeColors = palObj.colors;

  // Compute Custom Chart Data
  const chartData = useMemo(() => {
    if (!activeXAxis || records.length === 0) return null;

    const isYNone = !yAxis || yAxis === 'none';

    // ── KDE / Histogram+KDE (density plots — always univariate on X) ──────
    if (chartType === 'kde' || chartType === 'histkde') {
      const validVals = records.map(r => parseFloat(r[activeXAxis])).filter(Number.isFinite);
      if (validVals.length === 0) return null;

      const min = Math.min(...validVals);
      const max = Math.max(...validVals);

      if (chartType === 'kde') {
        const kdePoints = 80;
        const step = (max - min) / (kdePoints - 1) || 1;
        const xs = Array.from({ length: kdePoints }, (_, i) => min + i * step);
        const ys = gaussianKDE(validVals, null, xs);
        return {
          labels: xs.map(v => v.toFixed(2)),
          datasets: [{
            type: 'line',
            label: `KDE — ${activeXAxis}`,
            data: ys,
            borderColor: primaryColor,
            backgroundColor: `${primaryColor}30`,
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.4,
            fill: true
          }]
        };
      }

      // histkde — histogram bars + KDE line overlay
      const binCount = 10;
      const binWidth = (max - min) / binCount || 1;
      const binCounts = new Array(binCount).fill(0);
      const histLabels = Array.from({ length: binCount }, (_, i) => {
        const b0 = min + i * binWidth;
        const b1 = min + (i + 1) * binWidth;
        return `${b0.toFixed(1)}–${b1.toFixed(1)}`;
      });
      validVals.forEach(v => {
        let idx = Math.floor((v - min) / binWidth);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        binCounts[idx]++;
      });
      const binMids = Array.from({ length: binCount }, (_, i) => min + (i + 0.5) * binWidth);
      const scaledKde = gaussianKDE(validVals, null, binMids).map(v => v * validVals.length * binWidth);
      return {
        labels: histLabels,
        datasets: [
          {
            type: 'bar',
            label: `Histogram — ${activeXAxis}`,
            data: binCounts,
            backgroundColor: `${primaryColor}99`,
            borderColor: primaryColor,
            borderWidth: 1,
            borderRadius: 4,
            order: 2
          },
          {
            type: 'line',
            label: `KDE — ${activeXAxis}`,
            data: scaledKde,
            borderColor: themeColors[2] || primaryColor,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.4,
            fill: false,
            order: 1
          }
        ]
      };
    }

    // ── Standard Charts ───────────────────────────────────────────────────

    // 1. Single Variable / Univariate Frequency Distribution (when Y is None)
    if (isYNone) {
      const colObj = columns.find(c => c.name === activeXAxis);
      const isNumCol = colObj ? (colObj.semantic_type === 'numeric' || colObj.dtype === 'float64' || colObj.dtype === 'int64') : false;
      const validRows = records.filter(r => r[activeXAxis] !== undefined && r[activeXAxis] !== null && String(r[activeXAxis]).trim() !== '');

      const labels = [];
      const data = [];

      if (isNumCol) {
        // Numeric Binned Intervals
        const numericVals = validRows.map(r => parseFloat(r[activeXAxis])).filter(Number.isFinite);
        if (numericVals.length > 0) {
          const min = Math.min(...numericVals);
          const max = Math.max(...numericVals);
          const span = max - min || 1;
          const binCount = 8;
          const binWidth = span / binCount;
          const counts = new Array(binCount).fill(0);

          for (let i = 0; i < binCount; i++) {
            const b0 = min + i * binWidth;
            const b1 = min + (i + 1) * binWidth;
            labels.push(`${b0.toFixed(1)}–${b1.toFixed(1)}`);
          }

          numericVals.forEach(v => {
            let idx = Math.floor((v - min) / binWidth);
            if (idx >= binCount) idx = binCount - 1;
            if (idx < 0) idx = 0;
            counts[idx]++;
          });

          data.push(...counts);
        }
      } else {
        // Categorical Value Counts
        const counts = {};
        validRows.forEach(r => {
          const val = String(r[activeXAxis]);
          counts[val] = (counts[val] || 0) + 1;
        });

        // Top 10 categories
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        sorted.forEach(([k, v]) => {
          labels.push(k);
          data.push(v);
        });
      }

      return {
        labels,
        datasets: [{
          type: chartType === 'area' ? 'line' : chartType,
          label: `Count (${activeXAxis})`,
          data,
          backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? themeColors : `${primaryColor}cc`,
          borderColor: primaryColor,
          borderWidth: 1.5,
          borderRadius: 6,
          fill: chartType === 'area'
        }]
      };
    }

    // 2. Multi-Variable (X vs Y) Aggregated Charts
    const validRows = records.filter(r => r[activeXAxis] !== undefined && r[yAxis] !== undefined && r[yAxis] !== null);

    if (aggregation === 'none' || aggregation === 'raw') {
      const slice = validRows.slice(0, 100);
      return {
        labels: slice.map((r, i) => r[activeXAxis] !== undefined ? String(r[activeXAxis]) : `#${i + 1}`),
        datasets: [{
          type: chartType === 'area' ? 'line' : chartType,
          label: `${yAxis} (Raw / No Aggregation)`,
          data: slice.map(r => parseFloat(r[yAxis]) || 0),
          backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? themeColors : `${primaryColor}cc`,
          borderColor: primaryColor,
          borderWidth: 1.5,
          borderRadius: 6,
          fill: chartType === 'area'
        }]
      };
    }

    // Aggregations: Sum, Mean, Count, Min, Max, Median
    const groups = {};
    validRows.forEach(r => {
      const key = String(r[activeXAxis]);
      const val = parseFloat(r[yAxis]);
      if (!isNaN(val)) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(val);
      }
    });

    const labels = Object.keys(groups).slice(0, 15);
    const data = labels.map(k => {
      const vals = groups[k];
      if (aggregation === 'sum') return vals.reduce((a, b) => a + b, 0);
      if (aggregation === 'mean') return vals.reduce((a, b) => a + b, 0) / vals.length;
      if (aggregation === 'count') return vals.length;
      if (aggregation === 'min') return Math.min(...vals);
      if (aggregation === 'max') return Math.max(...vals);
      if (aggregation === 'median') {
        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      if (aggregation === 'std') {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / vals.length;
        return parseFloat(Math.sqrt(variance).toFixed(2));
      }
      if (aggregation === 'variance') {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / vals.length;
        return parseFloat(variance.toFixed(2));
      }
      return vals[0] || 0;
    });

    return {
      labels,
      datasets: [{
        type: chartType === 'area' ? 'line' : chartType,
        label: `${aggregation.toUpperCase()} of ${yAxis}`,
        data,
        backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? themeColors : `${primaryColor}cc`,
        borderColor: primaryColor,
        borderWidth: 1.5,
        borderRadius: 6,
        fill: chartType === 'area'
      }]
    };
  }, [activeXAxis, yAxis, chartType, palette, customColor, aggregation, records, columns, primaryColor, themeColors]);

  const downloadChartImage = () => {
    const chart = chartRef.current;
    if (chart) {
      const url = chart.toBase64Image();
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chart_${activeXAxis}_${yAxis || 'Univariate'}.png`;
      a.click();
    }
  };
  // Determine root Chart.js type for the <Chart> component
  const resolvedChartJsType = chartType === 'kde' ? 'line'
    : chartType === 'area' ? 'line'
    : chartType === 'histkde' ? 'bar'
    : chartType;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Interactive Chart Studio</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build custom univariate distributions and bivariate multi-dimensional visual charts. Set Y-Axis to "None" for pure single-variable frequency plots.
          </p>
        </div>

        <button
          onClick={downloadChartImage}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Image (PNG)</span>
        </button>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        {/* Chart Type */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Graph</option>
            <option value="area">Area Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="doughnut">Doughnut Chart</option>
            <option value="kde">KDE Plot (Density)</option>
            <option value="histkde">Histogram + KDE</option>
          </select>
        </div>

        {/* X-Axis */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">X-Axis / Metric 1</label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            {columns.map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.dtype})</option>
            ))}
          </select>
        </div>

        {/* Y-Axis */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Y-Axis / Metric 2{' '}
            <span className="text-[10px] text-blue-500 font-normal">
              {isKdeType ? '(N/A for KDE)' : '(None = Univariate)'}
            </span>
          </label>
          <select
            value={isKdeType ? 'none' : yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            disabled={isKdeType}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="none">None (Frequency Distribution)</option>
            {numCols.map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.dtype})</option>
            ))}
          </select>
        </div>

        {/* Aggregation */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Aggregation</label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="none">None (No Aggregation)</option>
            <option value="sum">Sum (Total)</option>
            <option value="mean">Average (Mean)</option>
            <option value="count">Record Count</option>
            <option value="min">Minimum (Min)</option>
            <option value="max">Maximum (Max)</option>
            <option value="median">Median</option>
            <option value="std">Standard Deviation (Std Dev)</option>
            <option value="variance">Variance</option>
          </select>
        </div>

        {/* Palette */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Color Palette</label>
          <select
            value={palette}
            onChange={(e) => setPalette(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="blue">Vivid Blue (Default)</option>
            <option value="oceanic">Oceanic Azure</option>
            <option value="cyberpunk">Cyberpunk Neon</option>
            <option value="sunset">Sunset Coral</option>
            <option value="amethyst">Radiant Amethyst</option>
            <option value="custom">Custom Color</option>
          </select>
          {palette === 'custom' && (
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                title="Pick custom color"
              />
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">{customColor}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {activeXAxis}{' '}
                {isKdeType ? '— Density Distribution'
                  : (yAxis && yAxis !== 'none' ? `vs ${yAxis}` : '(Univariate Distribution)')}
              </h3>
              <p className="text-xs text-slate-400">Rendered via Chart.js Reactive Engine</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {chartType.toUpperCase()}
          </span>
        </div>

        <div className="h-[480px] w-full relative">
          {chartData ? (
            <Chart
              ref={chartRef}
              type={resolvedChartJsType}
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { color: textColor, font: { size: 11, weight: 'bold' } }
                  },
                  tooltip: { cornerRadius: 8, padding: 10 }
                },
                scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
                  x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                  y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
                }
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select columns above to generate customized chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
