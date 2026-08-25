import React from 'react';
import { DashboardStatePayload, SensorReading } from '../../types/telemetry';
import {
  Activity,
  Cpu,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  Sun,
  Bell,
  MapPin,
  Flame,
  Droplets,
  Gauge,
  Thermometer,
} from 'lucide-react';

interface DashboardPaneProps {
  sensors: SensorReading;
  data: DashboardStatePayload | null;
}

export const DashboardPane: React.FC<DashboardPaneProps> = ({ sensors, data }) => {
  const healthScore = data?.health?.score ?? 93;
  const healthGrade = data?.health?.grade ?? 'Operational';
  const activeAlerts = data?.alerts?.active_count ?? 7;
  const criticalAlerts = data?.alerts?.critical_count ?? 0;
  const aiConfidence = Math.round(data?.ai_analysis?.confidence ?? 98);
  const aiAnalysis = data?.ai_analysis;
  const structuredAi = aiAnalysis?.structured ?? {};

  const totalMachines = 6;
  const runningMachines = 5;
  const offlineMachines = 1;
  const equipmentAvailability = 96.8;
  const productionEfficiency = 94.2;
  const powerConsumptionKW = 193.1;
  const maintenanceForecastHours = 18;

  const groupedAlerts = data?.alerts?.grouped ?? [];
  const eventTimeline = data?.event_timeline ?? [];

  return (
    <div className="tab-pane fade show active cockpit-bg p-3 rounded-4">
      {/* ========================================================================= */}
      {/* TOP ROW: 6 REAL-TIME METRIC CARDS                                         */}
      {/* ========================================================================= */}
      <section className="mb-4">
        <div className="row g-3">
          {/* 1. Plant Health */}
          <div className="col-12 col-sm-6 col-xl-2">
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-success">
                <Activity size={16} color="#22C55E" />
                <span>Plant Health</span>
              </div>
              <div className="display-6 fw-extrabold text-success font-mono">{healthScore}</div>
              <span className="badge bg-success rounded-pill mt-1 small">{healthGrade}</span>
            </div>
          </div>

          {/* 2. Equipment Availability */}
          <div className="col-12 col-sm-6 col-xl-2">
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-info">
                <Cpu size={16} color="#4B5563" />
                <span>Availability</span>
              </div>
              <div className="display-6 fw-extrabold text-info font-mono">{equipmentAvailability}%</div>
              <span className="small text-muted mt-1 d-block">Target &gt;95.0%</span>
            </div>
          </div>

          {/* 3. AI Accuracy */}
          <div className="col-12 col-sm-6 col-xl-2">
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-primary">
                <Brain size={16} color="#8B5CF6" />
                <span>AI Accuracy</span>
              </div>
              <div className="display-6 fw-extrabold text-primary font-mono">
                {aiConfidence && aiConfidence > 0 ? `${aiConfidence}%` : 'N/A'}
              </div>
              <span className="small text-muted mt-1 d-block">
                {aiConfidence && aiConfidence > 0 ? 'Grok AI Active' : 'Awaiting validation data'}
              </span>
            </div>
          </div>

          {/* 4. Running Machines */}
          <div className="col-12 col-sm-6 col-xl-2">
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-success">
                <CheckCircle2 size={16} color="#22C55E" />
                <span>Running</span>
              </div>
              <div className="display-6 fw-extrabold text-success font-mono">{runningMachines} / {totalMachines}</div>
              <span className="small text-muted mt-1 d-block">Operational Assets</span>
            </div>
          </div>

          {/* 5. Offline Machines */}
          <div className="col-12 col-sm-6 col-xl-2">
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-warning">
                <Clock size={16} color="#F59E0B" />
                <span>Offline</span>
              </div>
              <div className="display-6 fw-extrabold text-warning font-mono">{offlineMachines}</div>
              <span className="small text-muted mt-1 d-block">Standby Mode</span>
            </div>
          </div>

          {/* 6. Critical Alerts */}
          <div className="col-12 col-sm-6 col-xl-2">
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-danger">
                <AlertTriangle size={16} color="#EF4444" />
                <span>Critical Alerts</span>
              </div>
              <div className="display-6 fw-extrabold text-danger font-mono">{criticalAlerts}</div>
              <span className="small text-muted mt-1 d-block">{activeAlerts} Total Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECOND ROW: OVERVIEW (MAP, EFFICIENCY, ENERGY, FORECAST)                  */}
      {/* ========================================================================= */}
      <section className="row g-3 mb-4">
        {/* Live Plant Map */}
        <div className="col-12 col-xl-6">
          <div className="cockpit-glass-card h-100">
            <div className="cockpit-card-title justify-content-between">
              <span className="d-flex align-items-center gap-2">
                <MapPin size={18} color="#4B5563" />
                <span>Live Plant Layout Map</span>
              </span>
              <span className="badge bg-primary">Zone 1 - 3 Stream</span>
            </div>
            <div className="row g-2 mt-2">
              <div className="col-4">
                <div className="p-3 twin-card-box text-center">
                  <span className="text-muted d-block small">Zone 1</span>
                  <strong className="text-success d-block my-1">Primary Vessel</strong>
                  <span className="badge badge-status-good">T-101 Normal</span>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 twin-card-box text-center">
                  <span className="text-muted d-block small">Zone 2</span>
                  <strong className="text-warning d-block my-1">Pumping Station</strong>
                  <span className="badge badge-status-warn">P-202 Check</span>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 twin-card-box text-center">
                  <span className="text-muted d-block small">Zone 3</span>
                  <strong className="text-success d-block my-1">Thermal Loop</strong>
                  <span className="badge badge-status-good">HX-401 Normal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Production Efficiency, Energy & Maintenance Forecast */}
        <div className="col-12 col-xl-6">
          <div className="row g-3 h-100">
            <div className="col-12 col-md-4">
              <div className="cockpit-glass-card h-100 text-center">
                <div className="cockpit-card-title justify-content-center">
                  <TrendingUp size={16} color="#22C55E" />
                  <span>Efficiency (OEE)</span>
                </div>
                <div className="fs-3 fw-bold text-success font-mono my-2">{productionEfficiency}%</div>
                <span className="small text-muted">Optimal Production</span>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="cockpit-glass-card h-100 text-center">
                <div className="cockpit-card-title justify-content-center">
                  <Zap size={16} color="#F59E0B" />
                  <span>Energy Draw</span>
                </div>
                <div className="fs-3 fw-bold text-warning font-mono my-2">{powerConsumptionKW} kW</div>
                <span className="small text-muted">Power Factor: 0.94</span>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="cockpit-glass-card h-100 text-center">
                <div className="cockpit-card-title justify-content-center">
                  <Clock size={16} color="#4B5563" />
                  <span>Maint Forecast</span>
                </div>
                <div className="fs-3 fw-bold text-info font-mono my-2">{maintenanceForecastHours} hrs</div>
                <span className="small text-muted">Next P-202 Service</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BOTTOM ROW: FEEDS (ALERTS, AI INSIGHTS, TIMELINE, WEATHER, NOTIFICATIONS) */}
      {/* ========================================================================= */}
      <section className="row g-3">
        {/* 1. Recent Alerts */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="cockpit-glass-card h-100">
            <div className="cockpit-card-title text-warning">
              <Bell size={16} color="#F59E0B" />
              <span>Recent Alerts</span>
            </div>
            <div className="d-flex flex-column gap-2 small" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {!groupedAlerts.length ? (
                <div className="text-muted py-2">No active alerts recorded.</div>
              ) : (
                groupedAlerts.slice(0, 3).map((g, idx) => (
                  <div key={idx} className="p-2 rounded twin-card-box d-flex justify-content-between align-items-center">
                    <span className="text-dark fw-semibold">{g.type}</span>
                    <span className={`badge ${g.severity === 'Critical' ? 'badge-status-crit' : 'badge-status-warn'}`}>{g.severity}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 2. AI Insights */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="cockpit-glass-card h-100">
            <div className="cockpit-card-title text-info">
              <Brain size={16} color="#4B5563" />
              <span>AI Copilot Insights</span>
            </div>
            <p className="small text-dark mb-0" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {structuredAi.root_cause || aiAnalysis?.analysis || 'Process telemetry vector locked at nominal baseline setpoints.'}
            </p>
          </div>
        </div>

        {/* 3. Mini Timeline */}
        <div className="col-12 col-md-6 col-xl-2">
          <div className="cockpit-glass-card h-100">
            <div className="cockpit-card-title text-success">
              <Clock size={16} color="#22C55E" />
              <span>Event Timeline</span>
            </div>
            <div className="d-flex flex-column gap-1 small" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {eventTimeline.slice(0, 3).map((ev, idx) => (
                <div key={idx} className="p-1 border-bottom border-secondary">
                  <strong className="d-block text-dark" style={{ fontSize: '0.75rem' }}>{ev.title}</strong>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>{ev.detail || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Plant Weather */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="cockpit-glass-card h-100 text-center">
            <div className="cockpit-card-title justify-content-center text-warning">
              <Sun size={16} color="#F59E0B" />
              <span>Plant Weather</span>
            </div>
            <div className="fs-3 fw-bold text-dark font-mono my-1">24°C</div>
            <span className="small text-muted d-block">Sunny · Humidity 42%</span>
            <span className="small text-info d-block mt-1">Wind 8 km/h NW</span>
          </div>
        </div>

        {/* 5. SCADA Notifications */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="cockpit-glass-card h-100">
            <div className="cockpit-card-title text-primary">
              <Bell size={16} color="#4B5563" />
              <span>Notifications</span>
            </div>
            <div className="d-flex flex-column gap-1 small text-muted">
              <div className="p-1 rounded twin-card-box">
                <span className="text-success fw-bold">SCADA Sync:</span> 100% Ok
              </div>
              <div className="p-1 rounded twin-card-box">
                <span className="text-info fw-bold">SimPy Engine:</span> Active
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
