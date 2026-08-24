import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { SensorReading } from '../../types/telemetry';
import {
  TrendingUp,
  Activity,
  Sliders,
  ZoomIn,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Gauge as GaugeIcon,
  Droplets,
  Zap,
  Clock,
} from 'lucide-react';

ChartJS.register(...registerables, zoomPlugin);

interface AnalyticsPaneProps {
  sensors: SensorReading;
  navClock: string;
}

interface MetricStats {
  current: number;
  avg: number;
  min: number;
  max: number;
  trend: string;
  status: 'Normal' | 'Warning' | 'Critical';
  aiHealth: number;
}

export const AnalyticsPane: React.FC<AnalyticsPaneProps> = ({ sensors, navClock }) => {
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const presCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vibCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const chartInstancesRef = useRef<Record<string, ChartJS>>({});
  const historyRef = useRef<Record<string, number[]>>({
    temp: [68.5, 69.2, 70.1, 71.4, 72.0, 70.8, 69.9, sensors.temperature || 70.4],
    pres: [49.8, 50.1, 50.4, 51.2, 50.9, 49.9, 50.3, sensors.pressure || 50.2],
    flow: [76.2, 75.8, 74.9, 75.1, 74.5, 75.3, 74.9, sensors.flow_rate || 74.8],
    vib: [0.28, 0.29, 0.31, 0.33, 0.30, 0.32, 0.34, sensors.vibration || 0.32],
  });

  // Calculate top KPI stats
  const getStats = (vals: number[], warnThresh: number, critThresh: number, inv = false): MetricStats => {
    if (!vals.length) return { current: 0, avg: 0, min: 0, max: 0, trend: '+0.0%', status: 'Normal', aiHealth: 100 };
    const current = vals[vals.length - 1];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    const first = vals[0] || 1;
    const pct = (((current - first) / first) * 100).toFixed(1);
    const trend = `${Number(pct) >= 0 ? '+' : ''}${pct}%`;

    let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
    if (inv) {
      status = current < critThresh ? 'Critical' : current < warnThresh ? 'Warning' : 'Normal';
    } else {
      status = current >= critThresh ? 'Critical' : current >= warnThresh ? 'Warning' : 'Normal';
    }

    const aiHealth = status === 'Critical' ? 45 : status === 'Warning' ? 72 : 98;
    return { current, avg, min, max, trend, status, aiHealth };
  };

  const tempStats = getStats(historyRef.current.temp, 90, 95);
  const presStats = getStats(historyRef.current.pres, 70, 75);
  const flowStats = getStats(historyRef.current.flow, 50, 30, true);
  const vibStats = getStats(historyRef.current.vib, 0.8, 1.0);

  useEffect(() => {
    // Append current sensor reading to historical buffers
    if (sensors.temperature) historyRef.current.temp.push(sensors.temperature);
    if (sensors.pressure) historyRef.current.pres.push(sensors.pressure);
    if (sensors.flow_rate) historyRef.current.flow.push(sensors.flow_rate);
    if (sensors.vibration) historyRef.current.vib.push(sensors.vibration);

    Object.keys(historyRef.current).forEach((k) => {
      if (historyRef.current[k].length > 30) historyRef.current[k].shift();
    });

    const gridColor = '#E5E7EB';
    const textColor = '#64748B';

    const configs = [
      { ref: tempCanvasRef, id: 'temp', label: 'Temperature (°C)', color: '#DC2626', warn: 90, crit: 95, vals: historyRef.current.temp },
      { ref: presCanvasRef, id: 'pres', label: 'Pressure (bar)', color: '#4B5563', warn: 70, crit: 75, vals: historyRef.current.pres },
      { ref: flowCanvasRef, id: 'flow', label: 'Flow Rate (L/min)', color: '#16A34A', warn: 50, crit: 30, vals: historyRef.current.flow },
      { ref: vibCanvasRef, id: 'vib', label: 'Vibration (g)', color: '#F59E0B', warn: 0.8, crit: 1.0, vals: historyRef.current.vib },
    ];

    configs.forEach(({ ref, id, label, color, warn, crit, vals }) => {
      if (!ref.current) return;
      const ctx = ref.current.getContext('2d');
      if (!ctx) return;

      if (chartInstancesRef.current[id]) {
        chartInstancesRef.current[id].destroy();
      }

      const labels = vals.map((_, idx) => `T-${vals.length - 1 - idx}s`);
      
      // Generate 10 AI prediction forecast points with dashed line
      const predLabels = Array.from({ length: 10 }, (_, i) => `+${i + 1}s (AI)`);
      const allLabels = [...labels, ...predLabels];

      const lastVal = vals[vals.length - 1] || 50;
      const predData = new Array(vals.length - 1).fill(null);
      predData.push(lastVal);
      for (let i = 1; i <= 10; i++) {
        predData.push(Number((lastVal + (Math.sin(i) * 0.5 * (lastVal * 0.02))).toFixed(2)));
      }

      const warnThresholdLine = new Array(allLabels.length).fill(warn);
      const critThresholdLine = new Array(allLabels.length).fill(crit);

      // Point background colors for anomaly markers
      const pointColors = vals.map((v) => (v >= crit ? '#DC2626' : v >= warn ? '#F59E0B' : color));
      const pointRadii = vals.map((v) => (v >= warn ? 6 : 2));

      chartInstancesRef.current[id] = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: allLabels,
          datasets: [
            {
              label: `${label} (Live Telemetry)`,
              data: vals,
              borderColor: color,
              backgroundColor: `${color}1A`,
              fill: true,
              tension: 0.35,
              pointRadius: pointRadii,
              pointBackgroundColor: pointColors,
              pointHoverRadius: 7,
              borderWidth: 2.5,
            },
            {
              label: `${label} (AI Forecast Prediction)`,
              data: predData,
              borderColor: `${color}AA`,
              borderDash: [6, 6],
              fill: false,
              tension: 0.35,
              pointRadius: 0,
              borderWidth: 2,
            },
            {
              label: 'Warning Threshold',
              data: warnThresholdLine,
              borderColor: '#F59E0B77',
              borderDash: [3, 3],
              fill: false,
              pointRadius: 0,
              borderWidth: 1,
            },
            {
              label: 'Critical Threshold',
              data: critThresholdLine,
              borderColor: '#DC262677',
              borderDash: [3, 3],
              fill: false,
              pointRadius: 0,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400, easing: 'easeOutQuart' },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { color: '#475569', font: { size: 10, weight: 'bold' }, boxWidth: 12 },
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              titleColor: '#1E293B',
              bodyColor: '#475569',
            },
            zoom: {
              pan: { enabled: true, mode: 'x' },
              zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
            },
          },
          scales: {
            x: { ticks: { color: textColor, maxTicksLimit: 10 }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } },
          },
        },
      });
    });
  }, [sensors]);

  const handleResetZoom = () => {
    Object.values(chartInstancesRef.current).forEach((c: any) => c.resetZoom?.());
  };

  return (
    <div className="tab-pane fade show active cockpit-bg p-3 rounded-4">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom border-secondary">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Activity color="#4B5563" size={24} />
            Executive SCADA Telemetry Analytics
          </h4>
          <span className="text-muted small">
            Live multi-variate telemetry stream with AI prediction forecast, zoom/pan brush controls, and anomaly point markers
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge header-time-field px-3 py-2">
            <Clock size={14} className="me-1" /> {navClock} UTC
          </span>
          <button className="btn btn-sm btn-outline-info d-flex align-items-center gap-1" onClick={handleResetZoom}>
            <RotateCcw size={14} /> Reset Chart Zoom
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* ========================================================================= */}
        {/* 1. TEMPERATURE CHART & TOP KPI STRIP                                      */}
        {/* ========================================================================= */}
        <div className="col-12 col-xl-6">
          <div className="cockpit-glass-card">
            {/* Top 7-Metric KPI Strip */}
            <div className="row g-2 mb-3 pb-2 border-bottom border-secondary">
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Current</span>
                <strong className="text-danger font-mono">{tempStats.current.toFixed(1)}°C</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Average</span>
                <strong className="text-dark font-mono">{tempStats.avg.toFixed(1)}°C</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Min / Max</span>
                <strong className="text-dark font-mono">{tempStats.min.toFixed(0)}/{tempStats.max.toFixed(0)}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">24h Trend</span>
                <strong className="text-info font-mono">{tempStats.trend}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Status</span>
                <span className={`badge ${tempStats.status === 'Critical' ? 'badge-status-crit' : tempStats.status === 'Warning' ? 'badge-status-warn' : 'badge-status-good'}`}>
                  {tempStats.status}
                </span>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">AI Health</span>
                <strong className="text-success font-mono">{tempStats.aiHealth}/100</strong>
              </div>
            </div>

            <div className="chart-header d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                <Thermometer color="#EF4444" size={16} /> Temperature Vector (°C)
              </span>
              <span className="badge badge-status-info small">Warn &gt;90°C | Crit &gt;95°C</span>
            </div>
            <div style={{ height: '220px' }}>
              <canvas ref={tempCanvasRef}></canvas>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PRESSURE CHART & TOP KPI STRIP                                         */}
        {/* ========================================================================= */}
        <div className="col-12 col-xl-6">
          <div className="cockpit-glass-card">
            {/* Top 7-Metric KPI Strip */}
            <div className="row g-2 mb-3 pb-2 border-bottom border-secondary">
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Current</span>
                <strong className="text-primary font-mono">{presStats.current.toFixed(1)} bar</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Average</span>
                <strong className="text-dark font-mono">{presStats.avg.toFixed(1)} bar</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Min / Max</span>
                <strong className="text-dark font-mono">{presStats.min.toFixed(0)}/{presStats.max.toFixed(0)}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">24h Trend</span>
                <strong className="text-info font-mono">{presStats.trend}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Status</span>
                <span className={`badge ${presStats.status === 'Critical' ? 'badge-status-crit' : presStats.status === 'Warning' ? 'badge-status-warn' : 'badge-status-good'}`}>
                  {presStats.status}
                </span>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">AI Health</span>
                <strong className="text-success font-mono">{presStats.aiHealth}/100</strong>
              </div>
            </div>

            <div className="chart-header d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                <GaugeIcon color="#4B5563" size={16} /> Pressure Vector (bar)
              </span>
              <span className="badge badge-status-info small">Warn &gt;70 bar | Crit &gt;75 bar</span>
            </div>
            <div style={{ height: '220px' }}>
              <canvas ref={presCanvasRef}></canvas>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FLOW RATE CHART & TOP KPI STRIP                                        */}
        {/* ========================================================================= */}
        <div className="col-12 col-xl-6">
          <div className="cockpit-glass-card">
            {/* Top 7-Metric KPI Strip */}
            <div className="row g-2 mb-3 pb-2 border-bottom border-secondary">
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Current</span>
                <strong className="text-success font-mono">{flowStats.current.toFixed(1)} L/m</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Average</span>
                <strong className="text-dark font-mono">{flowStats.avg.toFixed(1)} L/m</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Min / Max</span>
                <strong className="text-dark font-mono">{flowStats.min.toFixed(0)}/{flowStats.max.toFixed(0)}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">24h Trend</span>
                <strong className="text-info font-mono">{flowStats.trend}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Status</span>
                <span className={`badge ${flowStats.status === 'Critical' ? 'badge-status-crit' : flowStats.status === 'Warning' ? 'badge-status-warn' : 'badge-status-good'}`}>
                  {flowStats.status}
                </span>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">AI Health</span>
                <strong className="text-success font-mono">{flowStats.aiHealth}/100</strong>
              </div>
            </div>

            <div className="chart-header d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                <Droplets color="#16A34A" size={16} /> Flow Rate Vector (L/min)
              </span>
              <span className="badge badge-status-info small">Warn &lt;50 L/min | Crit &lt;30 L/min</span>
            </div>
            <div style={{ height: '220px' }}>
              <canvas ref={flowCanvasRef}></canvas>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. VIBRATION CHART & TOP KPI STRIP                                        */}
        {/* ========================================================================= */}
        <div className="col-12 col-xl-6">
          <div className="cockpit-glass-card">
            {/* Top 7-Metric KPI Strip */}
            <div className="row g-2 mb-3 pb-2 border-bottom border-secondary">
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Current</span>
                <strong className="text-warning font-mono">{vibStats.current.toFixed(3)} g</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Average</span>
                <strong className="text-dark font-mono">{vibStats.avg.toFixed(3)} g</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Min / Max</span>
                <strong className="text-dark font-mono">{vibStats.min.toFixed(2)}/{vibStats.max.toFixed(2)}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">24h Trend</span>
                <strong className="text-info font-mono">{vibStats.trend}</strong>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">Status</span>
                <span className={`badge ${vibStats.status === 'Critical' ? 'badge-status-crit' : vibStats.status === 'Warning' ? 'badge-status-warn' : 'badge-status-good'}`}>
                  {vibStats.status}
                </span>
              </div>
              <div className="col-4 col-sm-3 col-md-2 text-center">
                <span className="text-muted d-block small">AI Health</span>
                <strong className="text-success font-mono">{vibStats.aiHealth}/100</strong>
              </div>
            </div>

            <div className="chart-header d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                <Zap color="#F59E0B" size={16} /> Vibration Vector (g)
              </span>
              <span className="badge badge-status-info small">Warn &gt;0.8g | Crit &gt;1.0g</span>
            </div>
            <div style={{ height: '220px' }}>
              <canvas ref={vibCanvasRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
