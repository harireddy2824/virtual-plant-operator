/**
 * Chart.js Integration & Telemetry Visualization Module
 */

/* global Chart */

import { MAX_CHART_POINTS, SENSOR_THRESHOLDS } from './config.js';
import { el } from './ui-utils.js';

export function createChartConfig(label, colour, metric) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.06)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  return {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor: colour,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${colour}33`);
          gradient.addColorStop(1, `${colour}00`);
          return gradient;
        },
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: {
          ticks: { color: textColor, maxTicksLimit: 8 },
          grid: { color: gridColor },
        },
        y: {
          suggestedMin: SENSOR_THRESHOLDS[metric]?.min ?? 0,
          suggestedMax: SENSOR_THRESHOLDS[metric]?.max ?? 100,
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
      },
      interaction: { mode: "index", intersect: false },
    },
  };
}

export function initCharts(chartsStore) {
  const chartConfigs = [
    ["temperature-chart", "Temperature",  "#ef4444", "temperature"],
    ["pressure-chart",    "Pressure",     "#38bdf8", "pressure"],
    ["flow-chart",        "Flow Rate",    "#10b981", "flow_rate"],
    ["vibration-chart",   "Vibration",    "#f59e0b", "vibration"],
  ];

  chartConfigs.forEach(([id, label, colour, metric]) => {
    const ctx = el(id)?.getContext("2d");
    if (!ctx) return;
    chartsStore[metric] = new Chart(ctx, createChartConfig(label, colour, metric));
  });
}

export function pushToChart(chartsStore, metric, value, timeLabel) {
  const chart = chartsStore[metric];
  if (!chart) return;
  chart.data.labels.push(timeLabel);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > MAX_CHART_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update("none");
}
