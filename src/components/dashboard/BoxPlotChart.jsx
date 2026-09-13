import React, { useState, useMemo } from 'react';

/**
 * Computes standard Tukey 5-number summary, IQR, whiskers, and outlier points.
 */
export function computeBoxPlotStats(values) {
  if (!values || values.length === 0) return null;
  const s = [...values].filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return null;

  const min = s[0];
  const max = s[n - 1];
  const q1 = s[Math.floor(n * 0.25)];
  const median = n % 2 === 0 ? (s[n / 2 - 1] + s[n / 2]) / 2 : s[Math.floor(n / 2)];
  const q3 = s[Math.floor(n * 0.75)];
  const mean = s.reduce((a, b) => a + b, 0) / n;
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  // Real whiskers extend to the furthest datum within the fences:
  const nonOutliers = s.filter(v => v >= lowerFence && v <= upperFence);
  const lowerWhisker = nonOutliers.length > 0 ? nonOutliers[0] : min;
  const upperWhisker = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : max;
  const outliers = s.filter(v => v < lowerWhisker || v > upperWhisker);

  return {
    n,
    min,
    max,
    q1,
    median,
    mean,
    q3,
    iqr,
    lowerFence,
    upperFence,
    lowerWhisker,
    upperWhisker,
    outliers
  };
}

const PALETTE_COLORS = [
  { bg: 'rgba(37, 99, 235, 0.22)', border: '#2563eb', median: '#60a5fa' }, // Vivid Blue (Default)
  { bg: 'rgba(2, 132, 199, 0.22)', border: '#0284c7', median: '#38bdf8' }, // Sky
  { bg: 'rgba(99, 102, 241, 0.22)', border: '#6366f1', median: '#818cf8' }, // Indigo
  { bg: 'rgba(16, 185, 129, 0.22)', border: '#10b981', median: '#34d399' }, // Emerald
  { bg: 'rgba(245, 158, 11, 0.22)', border: '#f59e0b', median: '#fbbf24' }, // Amber
  { bg: 'rgba(236, 72, 153, 0.22)', border: '#ec4899', median: '#f472b6' }, // Pink
  { bg: 'rgba(139, 92, 246, 0.22)', border: '#8b5cf6', median: '#a78bfa' }, // Violet
  { bg: 'rgba(244, 63, 94, 0.22)', border: '#f43f5e', median: '#fb7185' }   // Rose
];

export function BoxPlotChart({ data, featureName, isGrouped, isDark = true }) {
  const [hoveredBox, setHoveredBox] = useState(null);
  const [hoveredOutlier, setHoveredOutlier] = useState(null);

  // Determine overall global min and max across all boxes (including outliers)
  const { allStats, globalMin, globalMax } = useMemo(() => {
    if (!data) return { allStats: [], globalMin: 0, globalMax: 100 };

    let items = [];
    if (isGrouped && Array.isArray(data.groups)) {
      items = data.groups.filter(g => g.stats);
    } else if (data.stats) {
      items = [{ name: featureName, stats: data.stats }];
    }

    if (items.length === 0) return { allStats: [], globalMin: 0, globalMax: 100 };

    let minVal = Infinity;
    let maxVal = -Infinity;

    items.forEach(item => {
      const s = item.stats;
      if (s.min < minVal) minVal = s.min;
      if (s.max > maxVal) maxVal = s.max;
    });

    // Add 8% padding to top and bottom so whiskers/outliers aren't touching edges
    const span = maxVal - minVal || 1;
    const paddedMin = minVal - span * 0.08;
    const paddedMax = maxVal + span * 0.08;

    return { allStats: items, globalMin: paddedMin, globalMax: paddedMax };
  }, [data, featureName, isGrouped]);

  if (!allStats || allStats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        No valid numeric data available to render box plot.
      </div>
    );
  }

  // Dimensions
  const numBoxes = allStats.length;
  const svgWidth = Math.max(800, numBoxes * 75 + 140);
  const svgHeight = 430;
  const padLeft = 70;
  const padRight = 50;
  const padTop = 30;
  const padBottom = 70;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Scale function
  const yScale = (val) => {
    const range = globalMax - globalMin || 1;
    const pct = (val - globalMin) / range;
    return padTop + chartHeight - pct * chartHeight;
  };

  // Generate 5 Y-axis tick marks
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    const range = globalMax - globalMin;
    for (let i = 0; i <= count; i++) {
      const val = globalMin + (i / count) * range;
      ticks.push({ val, y: yScale(val) });
    }
    return ticks;
  }, [globalMin, globalMax]);

  const slotWidth = chartWidth / (numBoxes || 1);
  const boxWidth = Math.min(slotWidth * 0.55, 80);

  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="relative w-full select-none">
      {/* Hue Legend Banner */}
      {data?.hasHue && data?.hueValues && data.hueValues.length > 0 && (
        <div className="flex items-center gap-3 mb-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Hue ({data.hueName}):</span>
          <div className="flex items-center gap-3 flex-wrap">
            {data.hueValues.map((hVal, hIdx) => {
              const c = PALETTE_COLORS[hIdx % PALETTE_COLORS.length];
              return (
                <div key={hVal} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-xs border shadow-xs inline-block"
                    style={{ backgroundColor: c.bg, borderColor: c.border }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{hVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="w-full h-[430px] overflow-x-auto no-scrollbar">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
        <defs>
          <filter id="box-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Horizontal Gridlines & Y-Axis Labels */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={padLeft}
              y1={t.y}
              x2={padLeft + chartWidth}
              y2={t.y}
              stroke={gridLineColor}
              strokeDasharray="4 4"
            />
            <text
              x={padLeft - 12}
              y={t.y + 4}
              textAnchor="end"
              className="text-[11px] font-mono fill-slate-400 font-semibold"
            >
              {t.val.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Y Axis Baseline */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={padTop + chartHeight}
          stroke={gridLineColor}
          strokeWidth="1.5"
        />

        {/* X Axis Baseline */}
        <line
          x1={padLeft}
          y1={padTop + chartHeight}
          x2={padLeft + chartWidth}
          y2={padTop + chartHeight}
          stroke={gridLineColor}
          strokeWidth="1.5"
        />

        {/* Render Each Box & Whisker */}
        {allStats.map((item, idx) => {
          const s = item.stats;
          const color = item.hueIndex !== undefined 
            ? PALETTE_COLORS[item.hueIndex % PALETTE_COLORS.length] 
            : PALETTE_COLORS[idx % PALETTE_COLORS.length];
          const centerX = padLeft + idx * slotWidth + slotWidth / 2;
          const boxLeft = centerX - boxWidth / 2;

          const yUpperWhisker = yScale(s.upperWhisker);
          const yLowerWhisker = yScale(s.lowerWhisker);
          const yQ3 = yScale(s.q3);
          const yMedian = yScale(s.median);
          const yQ1 = yScale(s.q1);
          const yMean = yScale(s.mean);
          const boxHeight = Math.max(yQ1 - yQ3, 2);

          const capWidth = boxWidth * 0.45;
          const isHovered = hoveredBox === idx;

          return (
            <g
              key={idx}
              className="cursor-pointer transition-transform duration-150"
              onMouseEnter={() => setHoveredBox(idx)}
              onMouseLeave={() => setHoveredBox(null)}
            >
              {/* Whisker Line (Lower Whisker to Q1) */}
              <line
                x1={centerX}
                y1={yLowerWhisker}
                x2={centerX}
                y2={yQ1}
                stroke={color.border}
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {/* Lower Whisker Cap */}
              <line
                x1={centerX - capWidth / 2}
                y1={yLowerWhisker}
                x2={centerX + capWidth / 2}
                y2={yLowerWhisker}
                stroke={color.border}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Whisker Line (Q3 to Upper Whisker) */}
              <line
                x1={centerX}
                y1={yUpperWhisker}
                x2={centerX}
                y2={yQ3}
                stroke={color.border}
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {/* Upper Whisker Cap */}
              <line
                x1={centerX - capWidth / 2}
                y1={yUpperWhisker}
                x2={centerX + capWidth / 2}
                y2={yUpperWhisker}
                stroke={color.border}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Main IQR Box (Q1 to Q3) */}
              <rect
                x={boxLeft}
                y={yQ3}
                width={boxWidth}
                height={boxHeight}
                rx="6"
                fill={color.bg}
                stroke={color.border}
                strokeWidth={isHovered ? '2.5' : '2'}
                filter={isHovered ? 'url(#box-glow)' : 'none'}
                className="transition-all"
              />

              {/* Median Line */}
              <line
                x1={boxLeft}
                y1={yMedian}
                x2={boxLeft + boxWidth}
                y2={yMedian}
                stroke={color.median}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Mean Indicator (Diamond) */}
              <polygon
                points={`
                  ${centerX},${yMean - 4} 
                  ${centerX + 4},${yMean} 
                  ${centerX},${yMean + 4} 
                  ${centerX - 4},${yMean}
                `}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth="1"
              />

              {/* Outlier Points (Red/Amber Glowing Dots) */}
              {s.outliers.map((val, outIdx) => {
                const outY = yScale(val);
                // Jitter outlier x slightly if multiple outliers
                const jitter = s.outliers.length > 1 ? ((outIdx % 3) - 1) * 6 : 0;
                const ptX = centerX + jitter;
                return (
                  <g
                    key={outIdx}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredOutlier({ val, category: item.name, x: ptX, y: outY });
                    }}
                    onMouseLeave={() => setHoveredOutlier(null)}
                  >
                    <circle
                      cx={ptX}
                      cy={outY}
                      r="4.5"
                      fill="#f43f5e"
                      stroke="#fff"
                      strokeWidth="1.5"
                      className="hover:scale-125 transition-transform"
                    />
                  </g>
                );
              })}

              {/* Single Box Dimension Reference Labels on the Right */}
              {numBoxes === 1 && (
                <g className="font-mono text-[11px] font-bold">
                  {/* Upper Whisker Label */}
                  <text x={boxLeft + boxWidth + 12} y={yUpperWhisker + 4} fill="#94a3b8">
                    Max: <tspan fill={color.border}>{s.upperWhisker.toFixed(1)}</tspan>
                  </text>
                  {/* Q3 Label */}
                  <text x={boxLeft + boxWidth + 12} y={yQ3 + 4} fill="#94a3b8">
                    Q3 (75%): <tspan fill="#ec4899">{s.q3.toFixed(1)}</tspan>
                  </text>
                  {/* Median Label */}
                  <text x={boxLeft + boxWidth + 12} y={yMedian + 4} fill="#94a3b8">
                    Median: <tspan fill={color.median}>{s.median.toFixed(1)}</tspan>
                  </text>
                  {/* Mean Label */}
                  <text x={boxLeft - 12} y={yMean + 4} textAnchor="end" fill="#f59e0b">
                    Mean: {s.mean.toFixed(1)} &diams;
                  </text>
                  {/* Q1 Label */}
                  <text x={boxLeft + boxWidth + 12} y={yQ1 + 4} fill="#94a3b8">
                    Q1 (25%): <tspan fill="#2563eb">{s.q1.toFixed(1)}</tspan>
                  </text>
                  {/* Lower Whisker Label */}
                  <text x={boxLeft + boxWidth + 12} y={yLowerWhisker + 4} fill="#94a3b8">
                    Min: <tspan fill={color.border}>{s.lowerWhisker.toFixed(1)}</tspan>
                  </text>
                </g>
              )}

              {/* Category Name on X-Axis */}
              <text
                x={centerX}
                y={padTop + chartHeight + 20}
                textAnchor="middle"
                className="text-[11px] font-bold fill-slate-700 dark:fill-slate-300 max-w-[100px] truncate"
              >
                {item.displayName || item.name}
              </text>
              {item.subName && (
                <text
                  x={centerX}
                  y={padTop + chartHeight + 33}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-blue-600 dark:fill-blue-400"
                >
                  {item.subName}
                </text>
              )}
              <text
                x={centerX}
                y={padTop + chartHeight + (item.subName ? 46 : 34)}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-400"
              >
                (N={s.n})
              </text>
            </g>
          );
        })}
      </svg>
      </div>

      {/* Floating Glassmorphic Tooltip on Box Hover */}
      {hoveredBox !== null && allStats[hoveredBox] && (
        <div
          className="absolute top-4 right-4 bg-white/95 dark:bg-[#111827]/95 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl p-4 text-xs z-20 backdrop-blur-md space-y-1.5 w-64 pointer-events-none"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5 font-bold">
            <span className="text-slate-900 dark:text-white truncate">
              {allStats[hoveredBox].xCategory 
                ? `${allStats[hoveredBox].xCategory} • ${allStats[hoveredBox].hueValue}` 
                : allStats[hoveredBox].name}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-mono">N={allStats[hoveredBox].stats.n}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]">
            <span className="text-slate-400">Max / Whisker:</span>
            <span className="text-right font-bold text-slate-800 dark:text-slate-200">{allStats[hoveredBox].stats.upperWhisker.toFixed(2)}</span>
            <span className="text-slate-400">Q3 (75%):</span>
            <span className="text-right font-bold text-pink-400">{allStats[hoveredBox].stats.q3.toFixed(2)}</span>
            <span className="text-slate-400">Median (50%):</span>
            <span className="text-right font-bold text-blue-600 dark:text-blue-400">{allStats[hoveredBox].stats.median.toFixed(2)}</span>
            <span className="text-slate-400">Mean (&mu;):</span>
            <span className="text-right font-bold text-amber-500">{allStats[hoveredBox].stats.mean.toFixed(2)}</span>
            <span className="text-slate-400">Q1 (25%):</span>
            <span className="text-right font-bold text-sky-400">{allStats[hoveredBox].stats.q1.toFixed(2)}</span>
            <span className="text-slate-400">Min / Whisker:</span>
            <span className="text-right font-bold text-slate-800 dark:text-slate-200">{allStats[hoveredBox].stats.lowerWhisker.toFixed(2)}</span>
            <span className="text-slate-400">IQR (Spread):</span>
            <span className="text-right font-bold text-blue-500">{allStats[hoveredBox].stats.iqr.toFixed(2)}</span>
            <span className="text-slate-400">Outliers:</span>
            <span className="text-right font-bold text-rose-400">
              {allStats[hoveredBox].stats.outliers.length} ({((allStats[hoveredBox].stats.outliers.length / allStats[hoveredBox].stats.n) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      {/* Outlier Hover Popup */}
      {hoveredOutlier && (
        <div
          className="absolute bg-rose-500 text-white text-[11px] font-mono font-bold px-2 py-1 rounded-md shadow-lg pointer-events-none -translate-x-1/2 -translate-y-8"
          style={{ left: hoveredOutlier.x, top: hoveredOutlier.y }}
        >
          Outlier: {hoveredOutlier.val.toFixed(2)}
        </div>
      )}
    </div>
  );
}
