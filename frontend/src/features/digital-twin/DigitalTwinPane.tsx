import React, { useState } from 'react';
import { DashboardStatePayload } from '../../types/telemetry';

interface DigitalTwinPaneProps {
  data: DashboardStatePayload | null;
}

interface EquipmentSpec {
  id: string;
  name: string;
  type: string;
  status: 'Normal' | 'Warning' | 'Critical';
  health: number;
  icon: string;
  sensors: { temp: number; pres: number; flow: number; vib: number };
  aiDiagnosis: string;
  rulHours: number;
  maintenanceHistory: { date: string; action: string; engineer: string }[];
  recentAlerts: { timestamp: string; message: string; severity: string }[];
  energy: { powerKW: number; powerFactor: number; efficiencyPct: number };
  details: { model: string; serial: string; manufacturer: string; location: string; installed: string };
}

export const DigitalTwinPane: React.FC<DigitalTwinPaneProps> = ({ data }) => {
  const [selectedEq, setSelectedEq] = useState<EquipmentSpec | null>(null);

  const readings = data?.sensor_data ?? { temperature: 70.4, pressure: 50.2, flow_rate: 74.8, vibration: 0.32 };
  const aiDiag = data?.ai_analysis?.structured?.root_cause || data?.ai_analysis?.analysis || 'Equipment operating smoothly within calibrated parameters.';

  const equipmentList: EquipmentSpec[] = [
    {
      id: 'tank',
      name: 'Storage Tank T-101',
      type: 'Process Storage Vessel',
      status: readings.pressure > 75 ? 'Critical' : readings.pressure > 70 ? 'Warning' : 'Normal',
      health: readings.pressure > 75 ? 54 : readings.pressure > 70 ? 75 : 98,
      icon: 'fa-database',
      sensors: { temp: readings.temperature, pres: readings.pressure, flow: readings.flow_rate, vib: readings.vibration },
      aiDiagnosis: aiDiag,
      rulHours: 1420,
      maintenanceHistory: [
        { date: '2026-06-15', action: 'Level sensor recalibration & flange torque verification', engineer: 'Sarah Connor' },
        { date: '2026-04-10', action: 'Relief nozzle inspection', engineer: 'Alex Rivera' },
      ],
      recentAlerts: [
        { timestamp: '14:20:10', message: 'Pressure relief valve seal check trigger', severity: readings.pressure > 70 ? 'Warning' : 'Normal' },
      ],
      energy: { powerKW: 12.4, powerFactor: 0.94, efficiencyPct: 96.5 },
      details: { model: 'ST-5000L-SS', serial: 'SN-T101-9982', manufacturer: 'Endress+Hauser', location: 'Zone 1 - Primary Loop', installed: '2023-03-15' },
    },
    {
      id: 'pump',
      name: 'Feed Pump P-202',
      type: 'Variable Speed Centrifugal Pump',
      status: readings.vibration > 1.0 ? 'Critical' : readings.vibration > 0.8 ? 'Warning' : 'Normal',
      health: readings.vibration > 1.0 ? 34 : readings.vibration > 0.8 ? 68 : 84,
      icon: 'fa-fan',
      sensors: { temp: readings.temperature, pres: readings.pressure, flow: readings.flow_rate, vib: readings.vibration },
      aiDiagnosis: aiDiag,
      rulHours: 480,
      maintenanceHistory: [
        { date: '2026-05-22', action: 'Drive end bearing lubrication & seal pack replacement', engineer: 'Marcus Vance' },
        { date: '2026-02-18', action: 'Impeller wear clearance measurement', engineer: 'Sarah Connor' },
      ],
      recentAlerts: [
        { timestamp: '15:10:04', message: 'Vibration anomaly threshold alert', severity: readings.vibration > 0.8 ? 'Warning' : 'Normal' },
      ],
      energy: { powerKW: 45.2, powerFactor: 0.91, efficiencyPct: 92.1 },
      details: { model: 'CP-45KW-HD', serial: 'SN-P202-4410', manufacturer: 'Grundfos Industrial', location: 'Zone 2 - Pumping Bay', installed: '2022-11-01' },
    },
    {
      id: 'valve',
      name: 'Control Valve V-301',
      type: 'Pneumatic Pressure Control Valve',
      status: readings.pressure > 75 ? 'Critical' : 'Normal',
      health: readings.pressure > 75 ? 60 : 100,
      icon: 'fa-sliders',
      sensors: { temp: readings.temperature, pres: readings.pressure, flow: readings.flow_rate, vib: readings.vibration },
      aiDiagnosis: aiDiag,
      rulHours: 2100,
      maintenanceHistory: [
        { date: '2026-07-01', action: 'Actuator diaphragm pressure test', engineer: 'Elena Rostova' },
      ],
      recentAlerts: [],
      energy: { powerKW: 2.1, powerFactor: 0.98, efficiencyPct: 99.0 },
      details: { model: 'PCV-300-PN', serial: 'SN-V301-1102', manufacturer: 'Emerson Fisher', location: 'Zone 1 - Main Feed', installed: '2024-01-10' },
    },
    {
      id: 'motor',
      name: 'Drive Motor M-105',
      type: '3-Phase Heavy Industrial Motor',
      status: readings.vibration > 1.0 ? 'Critical' : readings.vibration > 0.8 ? 'Warning' : 'Normal',
      health: readings.vibration > 1.0 ? 42 : readings.vibration > 0.8 ? 70 : 92,
      icon: 'fa-bolt',
      sensors: { temp: readings.temperature + 5, pres: readings.pressure, flow: readings.flow_rate, vib: readings.vibration },
      aiDiagnosis: aiDiag,
      rulHours: 850,
      maintenanceHistory: [
        { date: '2026-03-30', action: 'Stator winding insulation resistance test', engineer: 'Marcus Vance' },
      ],
      recentAlerts: [
        { timestamp: '14:55:00', message: 'Motor winding thermal warning', severity: 'Normal' },
      ],
      energy: { powerKW: 55.0, powerFactor: 0.92, efficiencyPct: 94.8 },
      details: { model: 'MTR-55KW-3P', serial: 'SN-M105-8831', manufacturer: 'Siemens Energy', location: 'Zone 2 - Drive Station', installed: '2023-06-20' },
    },
    {
      id: 'heater',
      name: 'Heat Exchanger HX-401',
      type: 'Shell & Tube Thermal Exchanger',
      status: readings.temperature > 95 ? 'Critical' : readings.temperature > 90 ? 'Warning' : 'Normal',
      health: readings.temperature > 95 ? 48 : readings.temperature > 90 ? 74 : 88,
      icon: 'fa-fire-flame-curved',
      sensors: { temp: readings.temperature, pres: readings.pressure, flow: readings.flow_rate, vib: readings.vibration },
      aiDiagnosis: aiDiag,
      rulHours: 620,
      maintenanceHistory: [
        { date: '2026-05-10', action: 'Tube bundle chemical descaling & hydrostatic test', engineer: 'Alex Rivera' },
      ],
      recentAlerts: [
        { timestamp: '15:22:18', message: 'High temperature alert', severity: readings.temperature > 90 ? 'Warning' : 'Normal' },
      ],
      energy: { powerKW: 78.5, powerFactor: 0.96, efficiencyPct: 89.4 },
      details: { model: 'HX-800-ST', serial: 'SN-HX401-0094', manufacturer: 'Alfa Laval', location: 'Zone 3 - Thermal Process', installed: '2022-08-14' },
    },
  ];

  return (
    <div className="tab-pane fade show active">
      <div className="digital-twin-screenshot-card p-4 mx-auto" style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom border-secondary">
          <div>
            <h5 className="fw-bold text-dark tracking-wider mb-0 text-uppercase" style={{ fontSize: '0.95rem' }}>
              DIGITAL TWIN PROCESS SCHEMATIC
            </h5>
            <span className="text-muted small">Real-time ISA-95 equipment status &amp; animated liquid conduits</span>
          </div>
          <span className="badge badge-status-info px-3 py-2">6 Connected Equipment</span>
        </div>

        {/* Equipment Process Flow Grid with Animated Liquid SVG Pipeline */}
        <div className="position-relative my-4 p-3 twin-card-box rounded-4 border border-secondary" style={{ overflowX: 'auto' }}>
          {/* Animated Liquid SVG Pipeline Overlay */}
          <svg viewBox="0 0 1000 160" className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none', zIndex: 1 }}>
            <path d="M 120 80 L 280 80 L 440 80 L 600 80 L 760 80 L 900 80" stroke="#E5E7EB" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 120 80 L 280 80 L 440 80 L 600 80 L 760 80 L 900 80" stroke="#9CA3AF" strokeWidth="6" fill="none" strokeDasharray="10 15" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="50" to="0" dur="1.5s" repeatCount="indefinite" />
            </path>
          </svg>

          {/* Connected Equipment Row */}
          <div className="d-flex justify-content-between align-items-center position-relative" style={{ zIndex: 2, minWidth: '900px' }}>
            {equipmentList.map((eq) => {
              const isCrit = eq.status === 'Critical';
              const isWarn = eq.status === 'Warning';
              const borderCls = isCrit ? 'border-danger' : isWarn ? 'border-warning' : 'border-success-subtle';
              const badgeBg = isCrit ? 'badge-status-crit' : isWarn ? 'badge-status-warn' : 'badge-status-good';
              const iconColor = isCrit ? '#dc2626' : isWarn ? '#f59e0b' : '#16a34a';

              return (
                <div
                  key={eq.id}
                  className={`twin-card-box ${borderCls} p-3 rounded-4 position-relative text-center cursor-pointer`}
                  style={{ width: '160px', cursor: 'pointer' }}
                  onClick={() => setSelectedEq(eq)}
                  title="Click for full equipment diagnostics & sensor history"
                >
                  <span className={`badge rounded-pill ${badgeBg} position-absolute top-0 end-0 m-2 px-2 py-1 small fw-bold`}>
                    {eq.health}%
                  </span>

                  <div className="mx-auto my-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: `${iconColor}15`, color: iconColor }}>
                    <i className={`fa-solid ${eq.icon} fs-4`}></i>
                  </div>

                  <div className="fw-bold text-dark small text-truncate">{eq.name}</div>
                  <div className={`small fw-bold mt-1 ${isCrit ? 'text-danger' : isWarn ? 'text-warning' : 'text-success'}`}>
                    {eq.status.toUpperCase()}
                  </div>

                  <div className="mt-2 pt-2 border-top border-secondary small text-muted font-mono">
                    <i className="fa-solid fa-circle-info me-1"></i> Details
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="d-flex justify-content-center align-items-center gap-4 my-4 small">
          <span className="text-success fw-bold"><i className="fa-solid fa-circle me-1"></i> Green = Healthy (&gt;85%)</span>
          <span className="text-warning fw-bold"><i className="fa-solid fa-circle me-1"></i> Yellow = Warning (60-85%)</span>
          <span className="text-danger fw-bold"><i className="fa-solid fa-circle me-1"></i> Red = Critical (&lt;60%)</span>
        </div>

        {/* COMPONENT HEALTH SUMMARY GRID */}
        <div className="pt-3 border-top border-secondary">
          <h6 className="fw-bold text-dark text-uppercase tracking-wider mb-3 small">
            COMPONENT HEALTH &amp; TELEMETRY SUMMARY
          </h6>
          <div className="row g-3">
            {equipmentList.map((eq) => {
              const isCrit = eq.status === 'Critical';
              const isWarn = eq.status === 'Warning';
              const dotIcon = isCrit ? '🔴' : isWarn ? '🟡' : '🟢';

              return (
                <div className="col-12 col-md-4" key={eq.id}>
                  <div className="p-3 rounded-3 twin-card-box cursor-pointer" onClick={() => setSelectedEq(eq)}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-dark small">{dotIcon} {eq.name}</strong>
                      <span className="badge badge-status-info font-mono">{eq.health}%</span>
                    </div>
                    <div className="text-muted small">Type: {eq.type}</div>
                    <div className="text-muted small">Location: {eq.details.location}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* INTERACTIVE EQUIPMENT DETAILS MODAL */}
      {selectedEq && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 2000 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-white border border-secondary text-dark rounded-4 shadow-lg">
              <div className="modal-header border-secondary">
                <div className="d-flex align-items-center gap-2">
                  <i className={`fa-solid ${selectedEq.icon} text-primary fs-4 me-2`}></i>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">{selectedEq.name}</h5>
                    <span className="text-muted small">{selectedEq.type} · {selectedEq.details.location}</span>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedEq(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* 1. CURRENT SENSOR VALUES */}
                <div className="mb-4">
                  <h6 className="fw-bold text-primary border-bottom border-secondary pb-2">
                    <i className="fa-solid fa-microchip me-2"></i>1. Current Telemetry Sensor Readings
                  </h6>
                  <div className="row g-2 font-mono">
                    <div className="col-3 p-2 twin-card-box text-center">
                      <span className="text-muted d-block small">Temp</span>
                      <strong className="text-danger">{selectedEq.sensors.temp.toFixed(1)} °C</strong>
                    </div>
                    <div className="col-3 p-2 twin-card-box text-center">
                      <span className="text-muted d-block small">Pressure</span>
                      <strong className="text-primary">{selectedEq.sensors.pres.toFixed(1)} bar</strong>
                    </div>
                    <div className="col-3 p-2 twin-card-box text-center">
                      <span className="text-muted d-block small">Flow Rate</span>
                      <strong className="text-success">{selectedEq.sensors.flow.toFixed(1)} L/m</strong>
                    </div>
                    <div className="col-3 p-2 twin-card-box text-center">
                      <span className="text-muted d-block small">Vibration</span>
                      <strong className="text-warning">{selectedEq.sensors.vib.toFixed(3)} g</strong>
                    </div>
                  </div>
                </div>

                {/* 2. AI DIAGNOSIS & RUL */}
                <div className="row g-3 mb-4">
                  <div className="col-md-7">
                    <h6 className="fw-bold text-primary border-bottom border-secondary pb-2">
                      <i className="fa-solid fa-brain me-2"></i>2. AI Copilot Diagnosis
                    </h6>
                    <div className="p-3 twin-card-box text-dark small">
                      {selectedEq.aiDiagnosis}
                    </div>
                  </div>
                  <div className="col-md-5">
                    <h6 className="fw-bold text-primary border-bottom border-secondary pb-2">
                      <i className="fa-solid fa-stopwatch me-2"></i>3. Remaining Useful Life (RUL)
                    </h6>
                    <div className="p-3 twin-card-box text-center">
                      <div className="fs-3 fw-bold text-warning font-mono">{selectedEq.rulHours} Hours</div>
                      <span className="text-muted small">Est. RUL Horizon</span>
                    </div>
                  </div>
                </div>

                {/* 4. MAINTENANCE HISTORY & RECENT ALERTS */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary border-bottom border-secondary pb-2">
                      <i className="fa-solid fa-wrench me-2"></i>4. Maintenance History
                    </h6>
                    <div className="d-flex flex-column gap-2 small">
                      {selectedEq.maintenanceHistory.map((m, idx) => (
                        <div key={idx} className="p-2 twin-card-box">
                          <div className="d-flex justify-content-between text-muted small">
                            <span>{m.date}</span>
                            <span className="text-primary">{m.engineer}</span>
                          </div>
                          <div className="text-dark mt-1">{m.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary border-bottom border-secondary pb-2">
                      <i className="fa-solid fa-bell me-2"></i>5. Recent Alerts
                    </h6>
                    <div className="d-flex flex-column gap-2 small">
                      {!selectedEq.recentAlerts.length ? (
                        <div className="p-2 text-muted">No recent alerts recorded.</div>
                      ) : (
                        selectedEq.recentAlerts.map((a, idx) => (
                          <div key={idx} className="p-2 twin-card-box d-flex justify-content-between align-items-center">
                            <div>
                              <span className="text-muted font-mono me-2">{a.timestamp}</span>
                              <span className="text-dark">{a.message}</span>
                            </div>
                            <span className={`badge ${a.severity === 'Critical' ? 'badge-status-crit' : 'badge-status-warn'}`}>{a.severity}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. ENERGY CONSUMPTION & SPECS */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary border-bottom border-secondary pb-2">
                      <i className="fa-solid fa-bolt me-2"></i>6. Energy Consumption
                    </h6>
                    <div className="p-2 twin-card-box small d-flex justify-content-between">
                      <span>Power: <strong className="text-dark">{selectedEq.energy.powerKW} kW</strong></span>
                      <span>Power Factor: <strong className="text-dark">{selectedEq.energy.powerFactor}</strong></span>
                      <span>Efficiency: <strong className="text-success">{selectedEq.energy.efficiencyPct}%</strong></span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary border-bottom border-secondary pb-2">
                      <i className="fa-solid fa-circle-info me-2"></i>7. Technical Specifications
                    </h6>
                    <div className="p-2 twin-card-box small text-muted">
                      <div>Model: <strong className="text-dark">{selectedEq.details.model}</strong></div>
                      <div>Serial: <strong className="text-dark">{selectedEq.details.serial}</strong></div>
                      <div>Manufacturer: <strong className="text-dark">{selectedEq.details.manufacturer}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEq(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
