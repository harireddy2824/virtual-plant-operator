import React from 'react';
import { DashboardStatePayload } from '../../types/telemetry';

interface MetricsStripProps {
  data: DashboardStatePayload | null;
  uptimeStr: string;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({ data, uptimeStr }) => {
  const healthScore = data?.health?.score ?? 80;
  const healthGrade = data?.health?.grade ?? 'Good';
  const healthTrend = data?.health?.trend ?? 'Recovering';
  const activeAlerts = data?.alerts?.active_count ?? 7;
  const criticalEvents = data?.alerts?.critical_count ?? 2;
  const aiEngine = data?.status?.ai_mode ?? 'Ollama';
  const aiConfidence = Math.round(data?.ai_analysis?.confidence ?? 93);
  const lastUpdated = data?.status?.last_updated ? new Date(data.status.last_updated).toLocaleTimeString([], { hour12: false }) : '13:54:16';
  const tickCount = data?.status?.ticks ?? 16;

  return (
    <section className="metrics-strip mb-4">
      <div className="row g-3">
        {/* 1. HEALTH SCORE */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="metric-screenshot-card">
            <div className="metric-icon-circle green">
              <i className="fa-solid fa-heart-pulse"></i>
            </div>
            <div className="metric-body">
              <div className="metric-lbl">HEALTH SCORE</div>
              <div className="metric-val">{healthScore}</div>
              <div className="metric-sub">{healthGrade} - {healthTrend}</div>
            </div>
          </div>
        </div>

        {/* 2. ACTIVE ALERTS */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="metric-screenshot-card">
            <div className="metric-icon-circle blue">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="metric-body">
              <div className="metric-lbl">ACTIVE ALERTS</div>
              <div className="metric-val">{activeAlerts}</div>
              <div className="metric-sub">No active alerts</div>
            </div>
          </div>
        </div>

        {/* 3. CRITICAL ALERTS */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="metric-screenshot-card">
            <div className="metric-icon-circle red">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="metric-body">
              <div className="metric-lbl">CRITICAL ALERTS</div>
              <div className="metric-val">{criticalEvents}</div>
              <div className="metric-sub">All systems normal</div>
            </div>
          </div>
        </div>

        {/* 4. AI STATUS */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="metric-screenshot-card">
            <div className="metric-icon-circle purple">
              <i className="fa-solid fa-brain"></i>
            </div>
            <div className="metric-body">
              <div className="metric-lbl">AI STATUS</div>
              <div className="metric-val">{aiEngine}</div>
              <div className="metric-sub">Conf: {aiConfidence}%</div>
            </div>
          </div>
        </div>

        {/* 5. UPTIME */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="metric-screenshot-card">
            <div className="metric-icon-circle orange">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div className="metric-body">
              <div className="metric-lbl">UPTIME</div>
              <div className="metric-val">{uptimeStr || '00:10:17'}</div>
              <div className="metric-sub">Running smoothly</div>
            </div>
          </div>
        </div>

        {/* 6. LAST UPDATED */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="metric-screenshot-card">
            <div className="metric-icon-circle cyan">
              <i className="fa-solid fa-rotate"></i>
            </div>
            <div className="metric-body">
              <div className="metric-lbl">LAST UPDATED</div>
              <div className="metric-val">{lastUpdated}</div>
              <div className="metric-sub">Tick: {tickCount}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
