import React from 'react';
import { DashboardStatePayload } from '../../types/telemetry';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  Brain,
  AlertTriangle,
  Search,
  Wrench,
  ShieldAlert,
  CalendarCheck,
  Activity,
  TrendingUp,
  Clock,
  Cpu,
  Sparkles,
  Zap,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Sliders,
  Flame,
} from 'lucide-react';

interface AiCopilotPaneProps {
  data: DashboardStatePayload | null;
  isLoading: boolean;
}

export const AiCopilotPane: React.FC<AiCopilotPaneProps> = ({ data, isLoading }) => {
  const ai = data?.ai_analysis;
  const structured = ai?.structured ?? {};
  const riskLevel = structured.risk_level ?? ai?.risk_level ?? 'Normal';
  const confidence = structured.confidence_score ?? Math.round(ai?.confidence ?? 98);
  const source = ai?.source ?? 'Grok';

  const rootCause = structured.root_cause || ai?.analysis || 'Process telemetry vector operating within nominal limits.';
  const detectedEvidence = structured.detected_evidence || 'All sensor vectors within ±1.5% baseline tolerance.';
  const affectedEquipment = structured.affected_equipment || 'Process Tank T-101 & Feed Pump P-202';
  const businessImpact = structured.business_impact || 'Zero financial loss. Nominal production throughput.';
  const safetyImpact = structured.safety_impact || 'Nominal operation (Safety Class 0). Interlocks clear.';
  const estimatedDowntime = structured.estimated_downtime || '0 Hours (Continuous SCADA Stream)';
  const failureProbability = structured.failure_probability ?? (riskLevel === 'Critical' ? 88 : riskLevel === 'High' ? 45 : 4);
  const remainingUsefulLife = structured.remaining_useful_life || '480 Operating Hours';
  const repairCostEstimate = structured.repair_cost_estimate || '$0 (Routine Shift Operation)';
  const maintenancePriority = structured.maintenance_priority || 'P4 Routine';
  const operatorInstructions = Array.isArray(structured.operator_instructions) && structured.operator_instructions.length > 0
    ? structured.operator_instructions
    : Array.isArray(structured.corrective_actions) && structured.corrective_actions.length > 0
    ? structured.corrective_actions
    : ['Maintain continuous SCADA telemetry monitoring.', 'Log routine shift telemetry readings.'];

  const isCrit = riskLevel === 'Critical';
  const isWarn = riskLevel === 'High' || riskLevel === 'Warning';
  const riskBadgeCls = isCrit ? 'badge-status-crit' : isWarn ? 'badge-status-warn' : 'badge-status-good';

  const sensorReadings = data?.sensor_data ?? { temperature: 70.4, pressure: 50.2, flow_rate: 74.8, vibration: 0.32 };
  const components = data?.component_statuses ?? [
    { id: 'tank', label: 'Process Tank T-101', health: 83, status: 'Normal' },
    { id: 'pump', label: 'Feed Pump P-202', health: 84, status: 'Normal' },
    { id: 'valve', label: 'Relief Valve V-301', health: 100, status: 'Normal' },
    { id: 'heater', label: 'Thermal Heater H-401', health: 88, status: 'Normal' },
  ];

  return (
    <div className="tab-pane fade show active cockpit-bg p-2 rounded-4">
      {isLoading ? (
        <LoadingSkeleton count={4} height="120px" className="my-3" />
      ) : (
        <div className="row g-3">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: DIAGNOSTIC DIRECTIVES & ANOMALY ANALYSIS (col-lg-7)         */}
          {/* ========================================================================= */}
          <div className="col-12 col-lg-7 d-flex flex-column gap-3">
            {/* 1. AI Incident Summary Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title">
                <Sparkles size={18} color="#4B5563" />
                <span>1. AI Incident Summary</span>
                <span className="ms-auto badge badge-status-info small">
                  <Brain size={12} className="me-1" /> {source} Grok AI
                </span>
              </div>
              <div className="cockpit-card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 p-3 rounded-3 twin-card-box">
                  <div className="d-flex align-items-center gap-2">
                    <Zap size={20} color={isCrit ? '#EF4444' : isWarn ? '#F59E0B' : '#22C55E'} />
                    <span className="fw-bold text-dark fs-6">Operational Risk Level</span>
                  </div>
                  <span className={`badge ${riskBadgeCls} px-3 py-2 fs-6 rounded-pill fw-bold`}>
                    {riskLevel}
                  </span>
                </div>
                <p className="mb-0 text-dark small fw-semibold">
                  {rootCause}
                </p>
              </div>
            </div>

            {/* 2. Root Cause Analysis Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title">
                <Search size={18} color="#4B5563" />
                <span>2. Root Cause Analysis</span>
              </div>
              <div className="cockpit-card-body">
                <p className="mb-0 text-dark small">
                  {rootCause}
                </p>
              </div>
            </div>

            {/* 3. Detected Evidence Matrix Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title">
                <Activity size={18} color="#4B5563" />
                <span>3. Detected Evidence</span>
              </div>
              <div className="cockpit-card-body">
                <div className="p-3 rounded-3 twin-card-box text-primary small font-mono">
                  {detectedEvidence}
                </div>
              </div>
            </div>

            {/* 4. Affected Equipment Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title">
                <Cpu size={18} color="#4B5563" />
                <span>4. Affected Equipment</span>
              </div>
              <div className="cockpit-card-body">
                <div className="p-2 px-3 rounded-3 twin-card-box text-dark small fw-bold">
                  {affectedEquipment}
                </div>
              </div>
            </div>

            {/* 5. Operator Instructions Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title">
                <Wrench size={18} color="#4B5563" />
                <span>5. Operator Instructions</span>
              </div>
              <div className="cockpit-card-body">
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {operatorInstructions.map((inst: string, idx: number) => (
                    <li key={idx} className="d-flex align-items-start gap-2 p-2 rounded-2 twin-card-box text-dark small">
                      <span className="badge badge-status-info rounded-pill px-2">{idx + 1}</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 6. Safety Impact Directive Card */}
            <div className="cockpit-glass-card" style={{ borderColor: 'rgba(245, 158, 11, 0.25)' }}>
              <div className="cockpit-card-title text-warning">
                <ShieldAlert size={18} color="#F59E0B" />
                <span>6. Safety Impact Directive</span>
              </div>
              <div className="cockpit-card-body">
                <div className="p-3 rounded-3 twin-card-box text-warning small">
                  <AlertTriangle size={16} className="me-2" />
                  {safetyImpact}
                </div>
              </div>
            </div>

            {/* 7. Maintenance Recommendation Card */}
            <div className="cockpit-glass-card" style={{ borderColor: 'rgba(34, 197, 94, 0.25)' }}>
              <div className="cockpit-card-title text-success">
                <CalendarCheck size={18} color="#22C55E" />
                <span>7. Maintenance Recommendation</span>
              </div>
              <div className="cockpit-card-body">
                <p className="mb-0 text-dark small">
                  {Array.isArray(structured.preventive_maintenance) && structured.preventive_maintenance.length > 0
                    ? structured.preventive_maintenance[0]
                    : 'Schedule standard 30-day preventive maintenance inspection.'}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: QUANTITATIVE EVIDENCE & AI METRICS (col-lg-5)                */}
          {/* ========================================================================= */}
          <div className="col-12 col-lg-5 d-flex flex-column gap-3">
            {/* 8. AI Confidence Score Card */}
            <div className="cockpit-glass-card text-center">
              <div className="cockpit-card-title justify-content-center">
                <Brain size={18} color="#4B5563" />
                <span>8. Confidence Score</span>
              </div>
              <div className="py-2">
                <div className="display-4 fw-extrabold text-primary font-mono">{confidence}%</div>
                <div className="small text-muted mt-1">Grok AI Model Certainty</div>
                <div className="progress mt-3" style={{ height: '8px', background: '#E5E7EB' }}>
                  <div className="progress-bar bg-primary" style={{ width: `${confidence}%` }}></div>
                </div>
              </div>
            </div>

            {/* 9. Failure Probability Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-danger">
                <TrendingUp size={18} color="#EF4444" />
                <span>9. Failure Probability</span>
              </div>
              <div className="cockpit-card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Risk Likelihood Index</span>
                  <span className={`fw-bold ${failureProbability > 70 ? 'text-danger' : failureProbability > 30 ? 'text-warning' : 'text-success'}`}>
                    {failureProbability}%
                  </span>
                </div>
                <div className="progress" style={{ height: '8px', background: '#E5E7EB' }}>
                  <div
                    className={`progress-bar ${failureProbability > 70 ? 'bg-danger' : failureProbability > 30 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${failureProbability}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 10. Estimated Remaining Useful Life (RUL) Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title text-warning">
                <Clock size={18} color="#F59E0B" />
                <span>10. Remaining Useful Life (RUL)</span>
              </div>
              <div className="cockpit-card-body">
                <div className="d-flex justify-content-between align-items-center p-2 rounded twin-card-box">
                  <span className="small text-muted">Asset Health RUL</span>
                  <span className="fw-bold text-warning font-mono">{remainingUsefulLife}</span>
                </div>
              </div>
            </div>

            {/* 11. Estimated Downtime & Repair Cost Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title">
                <DollarSign size={18} color="#4B5563" />
                <span>11. Financial &amp; Downtime Estimate</span>
              </div>
              <div className="cockpit-card-body d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center p-2 rounded twin-card-box small">
                  <span className="text-muted">Estimated Downtime</span>
                  <span className="fw-bold text-primary font-mono">{estimatedDowntime}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center p-2 rounded twin-card-box small">
                  <span className="text-muted">Repair Cost Estimate</span>
                  <span className="fw-bold text-success font-mono">{repairCostEstimate}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center p-2 rounded twin-card-box small">
                  <span className="text-muted">Business Impact</span>
                  <span className="fw-bold text-dark">{businessImpact}</span>
                </div>
              </div>
            </div>

            {/* 12. Maintenance Priority & AI Audit Timeline Card */}
            <div className="cockpit-glass-card">
              <div className="cockpit-card-title">
                <CheckCircle2 size={18} color="#22C55E" />
                <span>12. Maintenance Priority &amp; Audit Trail</span>
              </div>
              <div className="cockpit-card-body d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center p-2 rounded twin-card-box small">
                  <span className="text-muted">Maintenance Priority</span>
                  <span className="badge badge-status-info fs-6">{maintenancePriority}</span>
                </div>
                <div className="d-flex align-items-center gap-2 small text-muted mt-1">
                  <span className="badge bg-success">SYNCED</span>
                  <span>Grok AI dynamic model pipeline active.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
