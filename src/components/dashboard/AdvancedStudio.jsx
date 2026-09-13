import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CONFIG } from '../../services/config';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { 
  BarChart2, 
  ScatterChart, 
  Layers, 
  TrendingUp, 
  Grid, 
  Activity, 
  SlidersHorizontal,
  TableProperties,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

import { BoxPlotChart, computeBoxPlotStats } from './BoxPlotChart';
import { JointPlotChart } from './JointPlotChart';

ChartJS.register(...registerables);

export function AdvancedStudio() {
  const { currentAnalysis, theme } = useApp();

  // Active Tab: univariate | bivariate | boxplot | regplot | jointplot | pairplot
  const [activeTab, setActiveTab] = useState('univariate');

  // Datasets and columns
  const columns = Array.isArray(currentAnalysis?.profile?.columns) ? currentAnalysis.profile.columns : [];
  const numCols = useMemo(() => columns.filter(c => c && (c.semantic_type === 'numeric' || c.dtype === 'float64' || c.dtype === 'int64')), [columns]);
  const catCols = useMemo(() => columns.filter(c => c && (c.semantic_type === 'categorical' || c.dtype === 'string' || c.dtype === 'object')), [columns]);
  const records = useMemo(() => {
    const recs = currentAnalysis?.records || currentAnalysis?.profile?.sample_rows;
    return Array.isArray(recs) ? recs : [];
  }, [currentAnalysis]);

  // Tab 1: Univariate Controls (Default Blue)
  const [univMetric, setUnivMetric] = useState('');
  const [univType, setUnivType] = useState('histkde');
  const [univBins, setUnivBins] = useState(12);
  const [univPalette, setUnivPalette] = useState('blue');

  // Tab 2: Bivariate Controls
  const [bivX, setBivX] = useState('');
  const [bivY, setBivY] = useState('');
  const [bivHue, setBivHue] = useState('none');
  const [bivAgg, setBivAgg] = useState('mean');

  // Tab 3: Boxplot Controls
  const [boxMetric, setBoxMetric] = useState('');
  const [boxGroup, setBoxGroup] = useState('none');
  const [boxHue, setBoxHue] = useState('none');

  // Tab 4: Regplot Controls
  const [regX, setRegX] = useState('');
  const [regY, setRegY] = useState('');

  // Tab 5: Joint Plot Controls
  const [jointX, setJointX] = useState('');
  const [jointY, setJointY] = useState('');

  // Tab 6: Pair Plot Controls
  const [pairFeatures, setPairFeatures] = useState([]);

  // Active Safe Fallbacks
  const activeUniv = univMetric || numCols[0]?.name || '';
  const activeBivX = bivX || columns[0]?.name || '';
  const activeBivY = bivY || numCols[0]?.name || '';
  const activeBox = boxMetric || numCols[0]?.name || '';
  const activeRegX = regX || numCols[0]?.name || '';
  const activeRegY = regY || numCols[1]?.name || numCols[0]?.name || '';
  const activeJointX = jointX || numCols[0]?.name || '';
  const activeJointY = jointY || numCols[1]?.name || numCols[0]?.name || '';

  // Synchronize defaults safely via useEffect
  useEffect(() => {
    if (numCols.length > 0) {
      if (!univMetric) setUnivMetric(numCols[0].name);
      if (!bivX) setBivX(columns[0]?.name || numCols[0].name);
      if (!bivY) setBivY(numCols[0].name);
      if (!boxMetric) setBoxMetric(numCols[0].name);
      if (!regX) setRegX(numCols[0].name);
      if (!regY) setRegY(numCols[1]?.name || numCols[0].name);
      if (!jointX) setJointX(numCols[0].name);
      if (!jointY) setJointY(numCols[1]?.name || numCols[0].name);
      if (pairFeatures.length === 0) {
        setPairFeatures(numCols.slice(0, 3).map(c => c.name));
      }
    }
  }, [numCols, columns]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // ==========================================
  // 1. UNIVARIATE (Histogram & Gaussian KDE)
  // ==========================================
  const univData = useMemo(() => {
    if (!activeUniv || records.length === 0) return null;
    const colObj = numCols.find(c => c.name === activeUniv);
    let values = records.map(r => parseFloat(r[activeUniv])).filter(v => !isNaN(v) && isFinite(v));

    if (values.length === 0 && colObj) {
      const mean = colObj.mean || 50;
      const std = colObj.std || 10;
      for (let i = 0; i < 60; i++) values.push(mean + (Math.random() - 0.5) * std * 2);
    }
    if (values.length === 0) return null;

    values.sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const span = max - min || 1;
    const binCount = Number(univBins) || 12;
    const binWidth = span / binCount;

    const binLabels = [];
    const binCounts = new Array(binCount).fill(0);
    const binMids = [];

    for (let i = 0; i < binCount; i++) {
      const b0 = min + i * binWidth;
      const b1 = min + (i + 1) * binWidth;
      binLabels.push(`${b0.toFixed(1)}–${b1.toFixed(1)}`);
      binMids.push(b0 + binWidth / 2);
    }

    values.forEach(v => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      binCounts[idx]++;
    });

    // Gaussian KDE
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance) || 1;
    const h = 1.06 * std * Math.pow(n, -0.2);

    const kdeCounts = binMids.map(x => {
      let density = 0;
      values.forEach(xi => {
        const u = (x - xi) / h;
        density += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
      });
      density = density / (n * h);
      return parseFloat((density * n * binWidth).toFixed(2));
    });

    // Moments
    const skewness = (values.reduce((s, v) => s + Math.pow(v - mean, 3), 0) / n) / Math.pow(std, 3);
    const kurtosis = (values.reduce((s, v) => s + Math.pow(v - mean, 4), 0) / n) / Math.pow(std, 4) - 3;
    const median = values[Math.floor(n / 2)];

    const pal = CONFIG.COLOR_PALETTES[univPalette] || CONFIG.COLOR_PALETTES.blue;
    const primary = pal.primary || '#2563eb';

    const datasets = [];
    if (univType === 'histkde' || univType === 'hist') {
      datasets.push({
        type: 'bar',
        label: `Frequency (${activeUniv})`,
        data: binCounts,
        backgroundColor: `${primary}cc`,
        borderColor: primary,
        borderWidth: 1.5,
        borderRadius: 6,
        order: 2
      });
    }

    if (univType === 'histkde' || univType === 'kde') {
      datasets.push({
        type: 'line',
        label: `Gaussian KDE Density Curve`,
        data: kdeCounts,
        borderColor: '#0284c7',
        borderWidth: 2.5,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        order: 1
      });
    }

    return {
      chartData: { labels: binLabels, datasets },
      stats: {
        n,
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        std: std.toFixed(2),
        skewness: skewness.toFixed(3),
        kurtosis: kurtosis.toFixed(3),
        min: min.toFixed(2),
        max: max.toFixed(2)
      }
    };
  }, [activeUniv, univBins, univType, univPalette, records, numCols]);

  // ==========================================
  // 2. BIVARIATE ANALYSIS
  // ==========================================
  const bivData = useMemo(() => {
    if (!activeBivX || !activeBivY || records.length === 0) return null;

    const colX = columns.find(c => c.name === activeBivX);
    const isXNumeric = colX ? (colX.semantic_type === 'numeric' || colX.dtype === 'float64' || colX.dtype === 'int64') : false;

    // Calculate correlation if both X and Y are numeric
    let correlationStats = null;
    if (isXNumeric) {
      const validPairs = records.map(r => ({
        x: parseFloat(r[activeBivX]),
        y: parseFloat(r[activeBivY])
      })).filter(p => !isNaN(p.x) && isFinite(p.x) && !isNaN(p.y) && isFinite(p.y));

      if (validPairs.length > 0) {
        const n = validPairs.length;
        const meanX = validPairs.reduce((s, p) => s + p.x, 0) / n;
        const meanY = validPairs.reduce((s, p) => s + p.y, 0) / n;
        const cov = validPairs.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0) / n;
        const varX = validPairs.reduce((s, p) => s + Math.pow(p.x - meanX, 2), 0) / n;
        const varY = validPairs.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0) / n;
        const r = (varX > 0 && varY > 0) ? cov / (Math.sqrt(varX) * Math.sqrt(varY)) : 0;
        correlationStats = {
          r: r.toFixed(3),
          cov: cov.toFixed(2),
          count: n,
          points: validPairs
        };
      }
    }

    // 1. None Option: Raw Observations / Scatter Plot
    if (bivAgg === 'none') {
      if (isXNumeric && correlationStats) {
        return {
          type: 'numeric',
          r: correlationStats.r,
          cov: correlationStats.cov,
          count: correlationStats.count,
          chartData: {
            datasets: [{
              type: 'scatter',
              label: `${activeBivX} vs ${activeBivY} (Raw Scatter)`,
              data: correlationStats.points.slice(0, 200),
              backgroundColor: 'rgba(37, 99, 235, 0.75)',
              borderColor: '#2563eb',
              pointRadius: 4.5,
              pointHoverRadius: 7
            }]
          }
        };
      } else {
        const rawRows = records
          .filter(r => r[activeBivX] !== undefined && r[activeBivY] !== undefined && !isNaN(parseFloat(r[activeBivY])))
          .slice(0, 50);

        const labels = rawRows.map((r, i) => `${String(r[activeBivX])} (#${i + 1})`);
        const values = rawRows.map(r => parseFloat(r[activeBivY]) || 0);

        return {
          type: 'categorical',
          r: correlationStats?.r || null,
          cov: correlationStats?.cov || null,
          count: correlationStats?.count || null,
          categories: labels,
          chartData: {
            labels,
            datasets: [{
              type: 'bar',
              label: `Raw ${activeBivY} (No Aggregation)`,
              data: values,
              backgroundColor: 'rgba(37, 99, 235, 0.8)',
              borderColor: '#1d4ed8',
              borderWidth: 1.5,
              borderRadius: 6
            }]
          }
        };
      }
    }

    // 2. Aggregations (mean, sum, median, min, max, count, std, variance)
    const groups = {};
    records.forEach(r => {
      const rawCat = r[activeBivX];
      const cat = rawCat !== undefined && rawCat !== null ? String(rawCat).trim() : 'Unknown';
      const val = parseFloat(r[activeBivY]);
      if (!isNaN(val) && isFinite(val)) {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(val);
      }
    });

    let categories = Object.keys(groups);
    if (categories.length === 0) return null;

    if (isXNumeric) {
      categories.sort((a, b) => parseFloat(a) - parseFloat(b));
    }
    categories = categories.slice(0, 18);

    const values = categories.map(cat => {
      const arr = groups[cat];
      if (!arr || arr.length === 0) return 0;

      if (bivAgg === 'sum') {
        return parseFloat(arr.reduce((a, b) => a + b, 0).toFixed(2));
      }
      if (bivAgg === 'median') {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const med = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        return parseFloat(med.toFixed(2));
      }
      if (bivAgg === 'min') {
        return parseFloat(Math.min(...arr).toFixed(2));
      }
      if (bivAgg === 'max') {
        return parseFloat(Math.max(...arr).toFixed(2));
      }
      if (bivAgg === 'count') {
        return arr.length;
      }
      if (bivAgg === 'std') {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
        return parseFloat(Math.sqrt(variance).toFixed(2));
      }
      if (bivAgg === 'variance') {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
        return parseFloat(variance.toFixed(2));
      }
      // default: mean
      return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
    });

    const aggLabels = {
      mean: 'Mean (Average)',
      sum: 'Sum (Total)',
      median: 'Median',
      min: 'Min (Minimum)',
      max: 'Max (Maximum)',
      count: 'Count (Frequency)',
      std: 'Std Dev (Standard Deviation)',
      variance: 'Variance'
    };

    const labelText = `${(aggLabels[bivAgg] || bivAgg).toUpperCase()} of ${activeBivY}`;

    return {
      type: 'categorical',
      r: correlationStats ? correlationStats.r : null,
      cov: correlationStats ? correlationStats.cov : null,
      count: correlationStats ? correlationStats.count : null,
      categories,
      groups,
      chartData: {
        labels: categories,
        datasets: [{
          type: 'bar',
          label: labelText,
          data: values,
          backgroundColor: 'rgba(37, 99, 235, 0.8)',
          borderColor: '#1d4ed8',
          borderWidth: 1.5,
          borderRadius: 6
        }]
      }
    };
  }, [activeBivX, activeBivY, bivHue, bivAgg, records, columns]);

  // ==========================================
  // 3. BOXPLOT & OUTLIER AUDIT (Univariate & Bivariate with Hue)
  // ==========================================
  const boxData = useMemo(() => {
    if (!activeBox || records.length === 0) return null;

    const allVals = records.map(r => parseFloat(r[activeBox])).filter(v => !isNaN(v) && isFinite(v));
    const overallStats = computeBoxPlotStats(allVals);
    if (!overallStats) return null;

    const hasX = boxGroup && boxGroup !== 'none';
    const hasHue = boxHue && boxHue !== 'none' && boxHue !== boxGroup;

    // 1. Pure Univariate (No X, No Hue)
    if (!hasX && !hasHue) {
      return {
        isGrouped: false,
        hasHue: false,
        stats: overallStats
      };
    }

    // 2. Univariate with Hue only (No X, Hue chosen)
    if (!hasX && hasHue) {
      const hueGroups = {};
      records.forEach(r => {
        const hVal = r[boxHue] !== undefined && r[boxHue] !== null ? String(r[boxHue]).trim() : 'Unknown';
        const val = parseFloat(r[activeBox]);
        if (!isNaN(val) && isFinite(val)) {
          if (!hueGroups[hVal]) hueGroups[hVal] = [];
          hueGroups[hVal].push(val);
        }
      });

      const distinctHues = Object.keys(hueGroups).slice(0, 6);
      const groupList = distinctHues.map((hVal, hIdx) => ({
        name: hVal,
        displayName: hVal,
        hueValue: hVal,
        hueIndex: hIdx,
        stats: computeBoxPlotStats(hueGroups[hVal])
      })).filter(g => g.stats);

      return {
        isGrouped: true,
        hasHue: true,
        hueName: boxHue,
        hueValues: distinctHues,
        groups: groupList,
        stats: overallStats
      };
    }

    // 3. Bivariate (X chosen, No Hue)
    if (hasX && !hasHue) {
      const groups = {};
      records.forEach(r => {
        const cat = r[boxGroup] !== undefined && r[boxGroup] !== null ? String(r[boxGroup]).trim() : 'Unknown';
        const val = parseFloat(r[activeBox]);
        if (!isNaN(val) && isFinite(val)) {
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(val);
        }
      });

      const catNames = Object.keys(groups).slice(0, 8);
      const groupList = catNames.map(c => ({
        name: c,
        displayName: c,
        stats: computeBoxPlotStats(groups[c])
      })).filter(g => g.stats);

      return {
        isGrouped: true,
        hasHue: false,
        xName: boxGroup,
        groups: groupList,
        stats: overallStats
      };
    }

    // 4. Bivariate with Hue (Both X and Hue chosen)
    const distinctHuesSet = new Set();
    const xGroups = {};

    records.forEach(r => {
      const xCat = r[boxGroup] !== undefined && r[boxGroup] !== null ? String(r[boxGroup]).trim() : 'Unknown';
      const hVal = r[boxHue] !== undefined && r[boxHue] !== null ? String(r[boxHue]).trim() : 'Unknown';
      const val = parseFloat(r[activeBox]);

      if (!isNaN(val) && isFinite(val)) {
        distinctHuesSet.add(hVal);
        if (!xGroups[xCat]) xGroups[xCat] = {};
        if (!xGroups[xCat][hVal]) xGroups[xCat][hVal] = [];
        xGroups[xCat][hVal].push(val);
      }
    });

    const distinctX = Object.keys(xGroups).slice(0, 5);
    const distinctHues = Array.from(distinctHuesSet).slice(0, 4);

    const groupList = [];
    distinctX.forEach(xCat => {
      distinctHues.forEach((hVal, hIdx) => {
        const vals = xGroups[xCat]?.[hVal];
        if (vals && vals.length > 0) {
          const stats = computeBoxPlotStats(vals);
          if (stats) {
            groupList.push({
              name: `${xCat} - ${hVal}`,
              displayName: xCat,
              subName: hVal,
              xCategory: xCat,
              hueValue: hVal,
              hueIndex: hIdx,
              stats
            });
          }
        }
      });
    });

    return {
      isGrouped: true,
      hasHue: true,
      xName: boxGroup,
      hueName: boxHue,
      hueValues: distinctHues,
      groups: groupList,
      stats: overallStats
    };
  }, [activeBox, boxGroup, boxHue, records]);

  // ==========================================
  // 4. REGPLOT (OLS Linear Regression)
  // ==========================================
  const regData = useMemo(() => {
    if (!activeRegX || !activeRegY || records.length === 0) return null;

    const points = [];
    records.forEach(r => {
      const x = parseFloat(r[activeRegX]);
      const y = parseFloat(r[activeRegY]);
      if (!isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
        points.push({ x, y });
      }
    });

    if (points.length === 0) return null;

    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

    const denomM = (sumX2 - sumX * meanX);
    const slope = denomM !== 0 ? (sumXY - sumX * meanY) / denomM : 0;
    const intercept = meanY - slope * meanX;

    const ssTot = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
    const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const r2 = ssTot !== 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 0;

    const denomR = Math.sqrt((sumX2 - n * meanX * meanX) * (sumY2 - n * meanY * meanY));
    const r = denomR !== 0 ? (sumXY - n * meanX * meanY) / denomR : 0;

    const sortedX = [...points].sort((a, b) => a.x - b.x);
    const minX = sortedX[0].x;
    const maxX = sortedX[sortedX.length - 1].x;
    const linePoints = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];

    return {
      slope: slope.toFixed(4),
      intercept: intercept.toFixed(4),
      r2: r2.toFixed(3),
      r: r.toFixed(3),
      n,
      equation: `y = ${slope.toFixed(3)}x ${intercept >= 0 ? '+ ' + intercept.toFixed(3) : '- ' + Math.abs(intercept).toFixed(3)}`,
      chartData: {
        datasets: [
          {
            type: 'scatter',
            label: 'Data Samples',
            data: points.slice(0, 180),
            backgroundColor: 'rgba(37, 99, 235, 0.65)',
            borderColor: '#2563eb',
            pointRadius: 4.5
          },
          {
            type: 'line',
            label: `OLS Fit (${slope >= 0 ? '+' : ''}${slope.toFixed(2)})`,
            data: linePoints,
            borderColor: '#2563eb',
            borderWidth: 2.5,
            pointRadius: 0,
            fill: false
          }
        ]
      }
    };
  }, [activeRegX, activeRegY, records]);

  // ==========================================
  // 5. JOINT PLOT (Scatter + Marginal Hists)
  // ==========================================
  const jointPoints = useMemo(() => {
    if (!activeJointX || !activeJointY || records.length === 0) return [];

    const points = [];
    records.forEach(r => {
      const x = parseFloat(r[activeJointX]);
      const y = parseFloat(r[activeJointY]);
      if (!isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
        points.push({ x, y });
      }
    });

    return points;
  }, [activeJointX, activeJointY, records]);

  // ==========================================
  // 6. PAIR PLOT (Scatter Matrix Grid)
  // ==========================================
  const pairData = useMemo(() => {
    if (pairFeatures.length < 2 || records.length === 0) return null;

    const matrix = [];
    for (let i = 0; i < pairFeatures.length; i++) {
      const row = [];
      for (let j = 0; j < pairFeatures.length; j++) {
        const feat1 = pairFeatures[i];
        const feat2 = pairFeatures[j];

        if (i === j) {
          const vals = records.map(r => parseFloat(r[feat1])).filter(v => !isNaN(v) && isFinite(v));
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          const span = max - min || 1;
          const bins = 6;
          const w = span / bins;
          const counts = new Array(bins).fill(0);
          vals.forEach(v => {
            let idx = Math.floor((v - min) / w);
            if (idx >= bins) idx = bins - 1;
            if (idx < 0) idx = 0;
            counts[idx]++;
          });
          row.push({ isDiag: true, feat: feat1, counts });
        } else {
          const pairs = [];
          records.forEach(r => {
            const v1 = parseFloat(r[feat1]);
            const v2 = parseFloat(r[feat2]);
            if (!isNaN(v1) && isFinite(v1) && !isNaN(v2) && isFinite(v2)) {
              pairs.push({ x: v1, y: v2 });
            }
          });
          const n = pairs.length;
          const m1 = pairs.reduce((s, p) => s + p.x, 0) / n;
          const m2 = pairs.reduce((s, p) => s + p.y, 0) / n;
          const cov = pairs.reduce((s, p) => s + (p.x - m1) * (p.y - m2), 0) / n;
          const v1 = pairs.reduce((s, p) => s + Math.pow(p.x - m1, 2), 0) / n;
          const v2 = pairs.reduce((s, p) => s + Math.pow(p.y - m2, 2), 0) / n;
          const r = (v1 > 0 && v2 > 0) ? cov / (Math.sqrt(v1) * Math.sqrt(v2)) : 0;
          row.push({ isDiag: false, feat1, feat2, r: r.toFixed(2), pts: pairs.slice(0, 30) });
        }
      }
      matrix.push(row);
    }

    return { matrix, features: pairFeatures };
  }, [pairFeatures, records]);

  // Tab Navigation List
  const tabs = [
    { id: 'univariate', label: 'Univariate (Hist/KDE)', icon: BarChart2 },
    { id: 'bivariate', label: 'Bivariate Analysis', icon: Activity },
    { id: 'boxplot', label: 'Boxplot & Outliers', icon: Layers },
    { id: 'regplot', label: 'Regplot (OLS Regression)', icon: TrendingUp },
    { id: 'jointplot', label: 'Joint Distribution', icon: ScatterChart },
    { id: 'pairplot', label: 'Pair Plot Matrix', icon: Grid }
  ];

  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-6 transition-all w-full max-w-full overflow-hidden">
      {/* Studio Header & Dynamic Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Advanced Statistical Visual Studio</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Histograms, Gaussian KDEs, Bivariate tests, Box & Whisker spreads, OLS Regressions, Joint & Pair plots.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar text-xs font-medium max-w-full">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: UNIVARIATE (HISTOGRAM & KDE) */}
      {/* ========================================== */}
      {activeTab === 'univariate' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Feature Metric</label>
              <select
                value={univMetric}
                onChange={(e) => setUnivMetric(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Visualization Subtype</label>
              <select
                value={univType}
                onChange={(e) => setUnivType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="histkde">Histogram + Gaussian KDE Overlay</option>
                <option value="hist">Histogram Only</option>
                <option value="kde">Gaussian KDE Curve Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bin Granularity</label>
              <select
                value={univBins}
                onChange={(e) => setUnivBins(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="8">8 Bins (Broad Intervals)</option>
                <option value="12">12 Bins (Standard)</option>
                <option value="18">18 Bins (Granular)</option>
                <option value="25">25 Bins (High Definition)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Color Palette</label>
              <select
                value={univPalette}
                onChange={(e) => setUnivPalette(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="blue">Vivid Blue (Default)</option>
                <option value="oceanic">Oceanic Azure</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="sunset">Sunset Coral</option>
                <option value="amethyst">Radiant Amethyst</option>
              </select>
            </div>
          </div>

          <div className="h-[400px] w-full relative">
            {univData?.chartData ? (
              <Chart
                type="bar"
                data={univData.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
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
                Select a numeric feature to render univariate histogram & KDE curve.
              </div>
            )}
          </div>

          {univData?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Mean</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{univData.stats.mean}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Median</span>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{univData.stats.median}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Std Dev</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{univData.stats.std}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Skewness</span>
                <p className="font-mono font-bold text-sky-500 mt-0.5">{univData.stats.skewness}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Kurtosis</span>
                <p className="font-mono font-bold text-amber-500 mt-0.5">{univData.stats.kurtosis}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Min</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{univData.stats.min}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Max</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{univData.stats.max}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: BIVARIATE ANALYSIS */}
      {/* ========================================== */}
      {activeTab === 'bivariate' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Feature X (Independent / Category)</label>
              <select
                value={bivX}
                onChange={(e) => setBivX(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {columns.map(c => <option key={c.name} value={c.name}>{c.name} ({c.semantic_type || c.dtype})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Feature Y (Numeric Dependent)</label>
              <select
                value={bivY}
                onChange={(e) => setBivY(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Aggregation Metric</label>
              <select
                value={bivAgg}
                onChange={(e) => setBivAgg(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="none">None (Raw Data / No Aggregation)</option>
                <option value="mean">Mean (Average)</option>
                <option value="sum">Sum (Total)</option>
                <option value="median">Median</option>
                <option value="min">Minimum (Min)</option>
                <option value="max">Maximum (Max)</option>
                <option value="count">Count (Frequency)</option>
                <option value="std">Standard Deviation (Std Dev)</option>
                <option value="variance">Variance</option>
              </select>
            </div>
          </div>

          <div className="h-[400px] w-full relative">
            {bivData?.chartData ? (
              <Chart
                type={bivData.type === 'numeric' ? 'scatter' : 'bar'}
                data={bivData.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
                    tooltip: { cornerRadius: 8, padding: 10 }
                  },
                  scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Select features to view bivariate relationship.
              </div>
            )}
          </div>

          {bivData?.r && (
            <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pearson Correlation: r = {bivData.r}</span>
              </div>
              <span className="font-mono text-slate-500 dark:text-slate-400 font-medium">Covariance: {bivData.cov} &bull; N = {bivData.count}</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: BOXPLOT & OUTLIER AUDIT */}
      {/* ========================================== */}
      {activeTab === 'boxplot' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Feature Y (Target Metric)</label>
              <select
                value={boxMetric}
                onChange={(e) => setBoxMetric(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Feature X (Grouping / Category)</label>
              <select
                value={boxGroup}
                onChange={(e) => setBoxGroup(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="none">None (Univariate / Entire Dataset)</option>
                {columns.map(c => <option key={c.name} value={c.name}>{c.name} ({c.semantic_type || c.dtype})</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hue (Subgroup Split)</label>
              <select
                value={boxHue}
                onChange={(e) => setBoxHue(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="none">None (No Subgroup)</option>
                {catCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="w-full relative">
            {boxData ? (
              <BoxPlotChart
                data={boxData}
                featureName={activeBox}
                isGrouped={boxData.isGrouped}
                isDark={isDark}
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Select a numeric feature to inspect box & whisker spread.
              </div>
            )}
          </div>

          {boxData?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">IQR Spread (Q3 - Q1)</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 text-base">
                  {boxData.stats.iqr.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">Middle 50% Range</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Lower Outlier Fence</span>
                <p className="font-mono font-bold text-sky-500 mt-1 text-base">
                  {boxData.stats.lowerFence.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">Q1 - 1.5 &times; IQR</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Upper Outlier Fence</span>
                <p className="font-mono font-bold text-amber-500 mt-1 text-base">
                  {boxData.stats.upperFence.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">Q3 + 1.5 &times; IQR</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Outliers Flagged</span>
                <p className="font-mono font-bold text-rose-500 mt-1 text-base">
                  {boxData.stats.outliers.length} records ({((boxData.stats.outliers.length / boxData.stats.n) * 100).toFixed(1)}%)
                </p>
                <span className="text-[10px] text-slate-400">Outside Thresholds</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: REGPLOT (OLS LINEAR REGRESSION) */}
      {/* ========================================== */}
      {activeTab === 'regplot' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Independent Variable (X)</label>
              <select
                value={regX}
                onChange={(e) => setRegX(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Dependent Variable (Y)</label>
              <select
                value={regY}
                onChange={(e) => setRegY(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="h-[400px] w-full relative">
            {regData?.chartData ? (
              <Chart
                type="scatter"
                data={regData.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
                    tooltip: { cornerRadius: 8, padding: 10 }
                  },
                  scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Select variables to compute ordinary least squares regression.
              </div>
            )}
          </div>

          {regData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Regression Equation</span>
                <p className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">{regData.equation}</p>
                <p className="text-[11px] text-slate-500">Slope: {regData.slope} &bull; Intercept: {regData.intercept}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Goodness of Fit (R&sup2;)</span>
                <p className="font-mono font-bold text-base text-sky-500">{regData.r2}</p>
                <p className="text-[11px] text-slate-500">{(parseFloat(regData.r2) * 100).toFixed(1)}% variance explained</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Pearson r Correlation</span>
                <p className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">{regData.r}</p>
                <p className="text-[11px] text-slate-500">
                  {Math.abs(regData.r) >= 0.7 ? 'Strong' : Math.abs(regData.r) >= 0.4 ? 'Moderate' : 'Weak'} Linear Association
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: JOINT PLOT (MARGINAL DISTRIBUTIONS) */}
      {/* ========================================== */}
      {activeTab === 'jointplot' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Feature X (Horizontal Axis)</label>
              <select
                value={jointX}
                onChange={(e) => setJointX(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Feature Y (Vertical Axis)</label>
              <select
                value={jointY}
                onChange={(e) => setJointY(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                {numCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="w-full">
            {jointPoints && jointPoints.length > 0 ? (
              <JointPlotChart
                points={jointPoints}
                xName={activeJointX}
                yName={activeJointY}
                isDark={isDark}
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Select variables to view joint distribution.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 6: PAIR PLOT (SCATTER MATRIX GRID) */}
      {/* ========================================== */}
      {activeTab === 'pairplot' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                Select 3 to 4 Numeric Features for Pairwise Matrix
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {pairFeatures.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {numCols.slice(0, 8).map(col => {
                const isSelected = pairFeatures.includes(col.name);
                return (
                  <button
                    key={col.name}
                    onClick={() => {
                      if (isSelected) {
                        if (pairFeatures.length > 2) {
                          setPairFeatures(pairFeatures.filter(f => f !== col.name));
                        }
                      } else {
                        if (pairFeatures.length < 4) {
                          setPairFeatures([...pairFeatures, col.name]);
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500'
                    }`}
                  >
                    {col.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matrix Grid with Contained Scroll */}
          {pairData?.matrix && (
            <div className="w-full max-w-full overflow-x-auto">
              <div className="min-w-[650px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 shadow-sm">
                {pairData.matrix.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid divide-x divide-slate-200 dark:divide-slate-800" style={{ gridTemplateColumns: `repeat(${pairFeatures.length}, minmax(0, 1fr))` }}>
                    {row.map((cell, colIdx) => (
                      <div key={colIdx} className="p-3 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between min-h-[130px]">
                        {cell.isDiag ? (
                          // Diagonal Histogram
                          <div className="flex flex-col justify-between h-full">
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono uppercase truncate">{cell.feat}</span>
                            <div className="flex items-end gap-1.5 h-16 pt-2">
                              {cell.counts.map((c, idx) => {
                                const maxC = Math.max(...cell.counts) || 1;
                                const pct = (c / maxC) * 100;
                                return (
                                  <div
                                    key={idx}
                                    style={{ height: `${pct}%` }}
                                    className="flex-1 bg-blue-600/80 rounded-t"
                                    title={`Bin ${idx + 1}: ${c}`}
                                  ></div>
                                );
                              })}
                            </div>
                            <span className="text-[10px] text-slate-400 text-center font-medium">Univariate Dist</span>
                          </div>
                        ) : (
                          // Off-diagonal Scatter Summary
                          <div className="flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between text-xs text-slate-400 truncate">
                              <span className="truncate font-semibold text-slate-700 dark:text-slate-300">{cell.feat1}</span>
                              <span className="font-mono font-medium ml-1 text-slate-400">vs</span>
                            </div>

                            <div className="py-2 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                                Math.abs(cell.r) >= 0.5 
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}>
                                r = {cell.r > 0 ? `+${cell.r}` : cell.r}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span className="truncate">{cell.feat2}</span>
                              <span>{Math.abs(cell.r) >= 0.5 ? 'Strong Corr' : 'Weak Corr'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
