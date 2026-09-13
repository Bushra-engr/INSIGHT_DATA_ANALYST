import React, { useState, useMemo } from 'react';

/**
 * Authentic Seaborn-style Joint Plot component
 * Features:
 * - Top Marginal Histogram + KDE density curve (aligned with X axis)
 * - Right Marginal Histogram + KDE density curve (aligned with Y axis)
 * - Central Joint Scatter Plot with Ordinary Least Squares (OLS) regression line
 * - Top-right correlation metrics badge (Pearson r, R^2, sample size)
 */
export function JointPlotChart({ 
  points = [], 
  xName = 'Feature X', 
  yName = 'Feature Y', 
  isDark = true 
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showRegression, setShowRegression] = useState(true);

  // Calculate statistics, ranges, marginals, and OLS regression
  const plotData = useMemo(() => {
    if (!points || points.length === 0) return null;

    const validPts = points.filter(p => 
      typeof p.x === 'number' && !isNaN(p.x) && isFinite(p.x) &&
      typeof p.y === 'number' && !isNaN(p.y) && isFinite(p.y)
    );

    if (validPts.length === 0) return null;

    const n = validPts.length;
    const xVals = validPts.map(p => p.x);
    const yVals = validPts.map(p => p.y);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    // 5% padding so points don't clip on edges
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const padXMin = minX - spanX * 0.05;
    const padXMax = maxX + spanX * 0.05;
    const padYMin = minY - spanY * 0.05;
    const padYMax = maxY + spanY * 0.05;

    // Linear Association & OLS Regression
    const meanX = xVals.reduce((s, v) => s + v, 0) / n;
    const meanY = yVals.reduce((s, v) => s + v, 0) / n;
    const cov = validPts.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0) / n;
    const varX = xVals.reduce((s, v) => s + Math.pow(v - meanX, 2), 0) / n;
    const varY = yVals.reduce((s, v) => s + Math.pow(v - meanY, 2), 0) / n;
    const r = (varX > 0 && varY > 0) ? cov / (Math.sqrt(varX) * Math.sqrt(varY)) : 0;
    const r2 = Math.pow(r, 2);

    const slope = varX > 0 ? cov / varX : 0;
    const intercept = meanY - slope * meanX;

    // Marginal Bins (16 bins for high visual resolution)
    const numBins = 16;
    const binWidthX = (padXMax - padXMin) / numBins;
    const binWidthY = (padYMax - padYMin) / numBins;

    const xBins = new Array(numBins).fill(0);
    const yBins = new Array(numBins).fill(0);

    validPts.forEach(p => {
      let idxX = Math.floor((p.x - padXMin) / binWidthX);
      if (idxX >= numBins) idxX = numBins - 1;
      if (idxX < 0) idxX = 0;
      xBins[idxX]++;

      let idxY = Math.floor((p.y - padYMin) / binWidthY);
      if (idxY >= numBins) idxY = numBins - 1;
      if (idxY < 0) idxY = 0;
      yBins[idxY]++;
    });

    const maxXCount = Math.max(...xBins) || 1;
    const maxYCount = Math.max(...yBins) || 1;

    // Generate Gaussian KDE for X and Y
    const stdX = Math.sqrt(varX) || 1;
    const stdY = Math.sqrt(varY) || 1;
    const hX = 1.06 * stdX * Math.pow(n, -0.2); // Silverman's rule
    const hY = 1.06 * stdY * Math.pow(n, -0.2);

    const kdeSteps = 40;
    const kdePointsX = [];
    for (let i = 0; i <= kdeSteps; i++) {
      const x = padXMin + (i / kdeSteps) * (padXMax - padXMin);
      let density = 0;
      validPts.forEach(p => {
        const u = (x - p.x) / hX;
        density += Math.exp(-0.5 * u * u) / (Math.sqrt(2 * Math.PI) * hX);
      });
      density /= n;
      kdePointsX.push({ x, density });
    }
    const maxKdeX = Math.max(...kdePointsX.map(d => d.density)) || 1;

    const kdePointsY = [];
    for (let i = 0; i <= kdeSteps; i++) {
      const y = padYMin + (i / kdeSteps) * (padYMax - padYMin);
      let density = 0;
      validPts.forEach(p => {
        const u = (y - p.y) / hY;
        density += Math.exp(-0.5 * u * u) / (Math.sqrt(2 * Math.PI) * hY);
      });
      density /= n;
      kdePointsY.push({ y, density });
    }
    const maxKdeY = Math.max(...kdePointsY.map(d => d.density)) || 1;

    return {
      n,
      validPts: validPts.slice(0, 250), // Cap render points for optimal FPS
      padXMin,
      padXMax,
      padYMin,
      padYMax,
      r: r.toFixed(3),
      r2: r2.toFixed(3),
      slope: slope.toFixed(3),
      intercept: intercept.toFixed(2),
      equation: `y = ${slope.toFixed(2)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(2)}`,
      xBins,
      yBins,
      maxXCount,
      maxYCount,
      binWidthX,
      binWidthY,
      kdePointsX,
      maxKdeX,
      kdePointsY,
      maxKdeY
    };
  }, [points]);

  if (!plotData) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        No valid paired numeric points available for joint plot.
      </div>
    );
  }

  // SVG Canvas Dimensions
  const svgWidth = 840;
  const svgHeight = 600;

  // Layout Grid Coordinates
  const marginL = 65;
  const topHistH = 95;
  const gap = 14;
  const rightHistW = 100;
  const marginB = 55;
  const marginR = 25;

  const scatterX = marginL;
  const scatterY = topHistH + gap;
  const scatterW = svgWidth - marginL - rightHistW - gap - marginR;
  const scatterH = svgHeight - scatterY - marginB;

  const topHistX = scatterX;
  const topHistY = 15;
  const topHistW = scatterW;

  const rightHistX = scatterX + scatterW + gap;
  const rightHistY = scatterY;
  const rightHistH = scatterH;

  // Conversion Functions
  const scaleX = (x) => {
    return scatterX + ((x - plotData.padXMin) / (plotData.padXMax - plotData.padXMin)) * scatterW;
  };

  const scaleY = (y) => {
    return scatterY + scatterH - ((y - plotData.padYMin) / (plotData.padYMax - plotData.padYMin)) * scatterH;
  };

  // Generate Axis Ticks
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const val = plotData.padXMin + pct * (plotData.padXMax - plotData.padXMin);
    return { val, px: scaleX(val) };
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const val = plotData.padYMin + pct * (plotData.padYMax - plotData.padYMin);
    return { val, py: scaleY(val) };
  });

  // KDE Path Strings
  const kdePathX = plotData.kdePointsX.map((pt, i) => {
    const px = scaleX(pt.x);
    const py = topHistY + topHistH - (pt.density / plotData.maxKdeX) * (topHistH - 10);
    return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(' ');

  const kdePathY = plotData.kdePointsY.map((pt, i) => {
    const py = scaleY(pt.y);
    const px = rightHistX + (pt.density / plotData.maxKdeY) * (rightHistW - 10);
    return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(' ');

  // Regression Line Endpoints
  const regX1 = plotData.padXMin;
  const regY1 = parseFloat(plotData.slope) * regX1 + parseFloat(plotData.intercept);
  const regX2 = plotData.padXMax;
  const regY2 = parseFloat(plotData.slope) * regX2 + parseFloat(plotData.intercept);

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <div className="relative w-full space-y-3 select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Joint Bivariate Distribution: <span className="text-blue-600 dark:text-blue-400 font-mono">{xName}</span> &times; <span className="text-sky-500 font-mono">{yName}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegression(!showRegression)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showRegression
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-300"></span>
            <span>Trend Line</span>
          </button>
        </div>
      </div>

      {/* Main SVG Joint Plot Canvas */}
      <div className="w-full h-[520px] bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-xl p-2 relative shadow-sm">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="topHistGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="rightHistGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
            </linearGradient>

            <filter id="point-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* ======================================================== */}
          {/* 1. TOP MARGINAL HISTOGRAM (Feature X)                    */}
          {/* ======================================================== */}
          <g>
            {plotData.xBins.map((count, i) => {
              const bX = topHistX + (i / plotData.xBins.length) * topHistW;
              const bW = (topHistW / plotData.xBins.length) - 1.5;
              const barH = (count / plotData.maxXCount) * (topHistH - 12);
              const bY = topHistY + topHistH - barH;

              return (
                <rect
                  key={i}
                  x={bX}
                  y={bY}
                  width={Math.max(bW, 1)}
                  height={barH}
                  rx="3"
                  fill="url(#topHistGrad)"
                  className="transition-all hover:opacity-100"
                />
              );
            })}

            {/* Overlaid Smooth KDE Line for X */}
            <path
              d={kdePathX}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Top Marginal Label */}
            <text
              x={topHistX + 8}
              y={topHistY + 16}
              className="text-[11px] font-bold font-mono fill-blue-500"
            >
              Marginal X: {xName}
            </text>
          </g>

          {/* ======================================================== */}
          {/* 2. TOP RIGHT STATS CARD                                  */}
          {/* ======================================================== */}
          <g transform={`translate(${rightHistX}, ${topHistY})`}>
            <rect
              x="0"
              y="0"
              width={rightHistW + marginR - 5}
              height={topHistH}
              rx="8"
              fill={isDark ? '#111827' : '#f8fafc'}
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth="1"
            />
            <text x="8" y="18" className="text-[10px] font-bold uppercase tracking-wider fill-slate-400">
              Joint Stats
            </text>
            <text x="8" y="38" className="text-sm font-black font-mono fill-blue-500">
              r = {plotData.r}
            </text>
            <text x="8" y="55" className="text-[11px] font-mono fill-sky-400">
              R&sup2; = {plotData.r2}
            </text>
            <text x="8" y="72" className="text-[10px] font-mono fill-slate-400">
              N = {plotData.n} pts
            </text>
            <text x="8" y="87" className="text-[9px] font-bold uppercase fill-blue-400">
              {Math.abs(parseFloat(plotData.r)) >= 0.7 ? 'Strong' : Math.abs(parseFloat(plotData.r)) >= 0.35 ? 'Moderate' : 'Weak'} {parseFloat(plotData.r) >= 0 ? 'Positive' : 'Negative'}
            </text>
          </g>

          {/* ======================================================== */}
          {/* 3. CENTRAL SCATTER PLOT (X vs Y)                         */}
          {/* ======================================================== */}
          {/* Scatter Background & Grid */}
          <rect
            x={scatterX}
            y={scatterY}
            width={scatterW}
            height={scatterH}
            fill={isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.5)'}
            stroke={gridColor}
            strokeWidth="1"
            rx="6"
          />

          {/* Gridlines X */}
          {xTicks.map((t, idx) => (
            <g key={`gx-${idx}`}>
              <line
                x1={t.px}
                y1={scatterY}
                x2={t.px}
                y2={scatterY + scatterH}
                stroke={gridColor}
                strokeDasharray="3 3"
              />
              <text
                x={t.px}
                y={scatterY + scatterH + 18}
                textAnchor="middle"
                className="text-[11px] font-mono fill-slate-400 font-medium"
              >
                {t.val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Gridlines Y */}
          {yTicks.map((t, idx) => (
            <g key={`gy-${idx}`}>
              <line
                x1={scatterX}
                y1={t.py}
                x2={scatterX + scatterW}
                y2={t.py}
                stroke={gridColor}
                strokeDasharray="3 3"
              />
              <text
                x={scatterX - 10}
                y={t.py + 4}
                textAnchor="end"
                className="text-[11px] font-mono fill-slate-400 font-medium"
              >
                {t.val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Trend Line (Linear Regression) */}
          {showRegression && (
            <line
              x1={scaleX(regX1)}
              y1={scaleY(regY1)}
              x2={scaleX(regX2)}
              y2={scaleY(regY2)}
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          )}

          {/* Scatter Points */}
          {plotData.validPts.map((pt, idx) => {
            const cx = scaleX(pt.x);
            const cy = scaleY(pt.y);
            const isHovered = hoveredPoint === idx;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={isHovered ? 6.5 : 4}
                fill={isHovered ? '#38bdf8' : 'rgba(37, 99, 235, 0.75)'}
                stroke={isHovered ? '#fff' : '#2563eb'}
                strokeWidth={isHovered ? 2 : 1}
                filter={isHovered ? 'url(#point-glow)' : 'none'}
                className="cursor-pointer transition-all duration-100"
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Axis Titles */}
          <text
            x={scatterX + scatterW / 2}
            y={scatterY + scatterH + 40}
            textAnchor="middle"
            className="text-xs font-bold fill-slate-700 dark:fill-slate-300"
          >
            {xName}
          </text>

          <text
            x={20}
            y={scatterY + scatterH / 2}
            textAnchor="middle"
            transform={`rotate(-90, 20, ${scatterY + scatterH / 2})`}
            className="text-xs font-bold fill-slate-700 dark:fill-slate-300"
          >
            {yName}
          </text>

          {/* ======================================================== */}
          {/* 4. RIGHT MARGINAL HISTOGRAM (Feature Y)                  */}
          {/* ======================================================== */}
          <g>
            {plotData.yBins.map((count, i) => {
              const bH = (rightHistH / plotData.yBins.length) - 1.5;
              const bY = (scatterY + scatterH) - ((i + 1) / plotData.yBins.length) * rightHistH;
              const barW = (count / plotData.maxYCount) * (rightHistW - 10);
              const bX = rightHistX;

              return (
                <rect
                  key={i}
                  x={bX}
                  y={bY}
                  width={Math.max(barW, 1)}
                  height={Math.max(bH, 1)}
                  rx="3"
                  fill="url(#rightHistGrad)"
                  className="transition-all hover:opacity-100"
                />
              );
            })}

            {/* Overlaid Smooth Vertical KDE Line for Y */}
            <path
              d={kdePathY}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Right Marginal Label */}
            <text
              x={rightHistX + 5}
              y={scatterY + scatterH - 10}
              className="text-[10px] font-bold font-mono fill-sky-400"
            >
              Marginal Y
            </text>
          </g>
        </svg>

        {/* Hover Coordinate Popup */}
        {hoveredPoint !== null && plotData.validPts[hoveredPoint] && (
          <div
            className="absolute bg-slate-900 text-white text-[11px] font-mono px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl pointer-events-none -translate-x-1/2 -translate-y-12 z-20 space-y-0.5"
            style={{
              left: scaleX(plotData.validPts[hoveredPoint].x),
              top: scaleY(plotData.validPts[hoveredPoint].y)
            }}
          >
            <div><span className="text-blue-400 font-bold">{xName}:</span> {plotData.validPts[hoveredPoint].x.toFixed(2)}</div>
            <div><span className="text-sky-400 font-bold">{yName}:</span> {plotData.validPts[hoveredPoint].y.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Bottom Equation & Interpretation Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 uppercase font-bold text-[10px]">Fitted Regression Model</span>
          <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{plotData.equation}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 uppercase font-bold text-[10px]">Goodness of Fit (R&sup2;)</span>
          <p className="font-mono font-bold text-sky-400 mt-0.5">{plotData.r2} ({(parseFloat(plotData.r2) * 100).toFixed(1)}% explained)</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 uppercase font-bold text-[10px]">Pearson Correlation</span>
          <p className="font-mono font-bold text-blue-500 mt-0.5">r = {plotData.r} ({plotData.n} observations)</p>
        </div>
      </div>
    </div>
  );
}
