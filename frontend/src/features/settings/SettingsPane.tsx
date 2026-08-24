import React, { useState } from 'react';

export const SettingsPane: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('general');

  const settingsSections = [
    { id: 'general', label: '1. General', icon: 'fa-sliders' },
    { id: 'ai_models', label: '2. AI Models', icon: 'fa-brain' },
    { id: 'sensors', label: '3. Sensor Config', icon: 'fa-microchip' },
    { id: 'thresholds', label: '4. Thresholds', icon: 'fa-gauge' },
    { id: 'alert_rules', label: '5. Alert Rules', icon: 'fa-bell' },
    { id: 'notifications', label: '6. Notifications', icon: 'fa-envelope' },
    { id: 'theme', label: '7. Theme', icon: 'fa-palette' },
    { id: 'api_keys', label: '8. API Keys', icon: 'fa-key' },
    { id: 'database', label: '9. Database', icon: 'fa-database' },
    { id: 'users', label: '10. Users', icon: 'fa-users' },
    { id: 'roles', label: '11. Roles', icon: 'fa-user-gear' },
    { id: 'permissions', label: '12. Permissions', icon: 'fa-lock' },
    { id: 'logs', label: '13. Logs', icon: 'fa-list-check' },
    { id: 'backups', label: '14. Backups', icon: 'fa-floppy-disk' },
    { id: 'support', label: '15. Support', icon: 'fa-circle-question' },
  ];

  return (
    <div className="tab-pane fade show active cockpit-bg p-3 rounded-4">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-secondary flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="fa-solid fa-gear text-info fs-4"></i> Enterprise System Configuration Manager
          </h4>
          <span className="text-muted small">
            Configure infrastructure drivers, AI model weights, sensor thresholds, RBAC permissions, and system backups
          </span>
        </div>
        <span className="badge badge-status-info px-3 py-2">15 Configuration Modules Active</span>
      </div>

      <div className="row g-3">
        {/* Navigation Sidebar List (15 Sections) */}
        <div className="col-12 col-md-3">
          <div className="d-flex flex-column gap-1 bg-white p-2 rounded-3 border border-secondary" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {settingsSections.map((sec) => {
              const isSel = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  className={`btn btn-sm text-start py-2 px-3 fw-semibold rounded-2 d-flex align-items-center gap-2 ${isSel ? 'btn-primary text-white' : 'btn-light text-dark border-0'}`}
                  onClick={() => setActiveSection(sec.id)}
                >
                  <i className={`fa-solid ${sec.icon} ${isSel ? 'text-white' : 'text-primary'}`}></i>
                  <span className="small">{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Body Content View */}
        <div className="col-12 col-md-9">
          <div className="cockpit-glass-card p-4 h-100">
            {activeSection === 'general' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">1. General System Settings</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">Plant Name &amp; ID</label>
                    <input type="text" className="form-control bg-white border-secondary text-dark" value="Virtual Plant Operator #01" readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">SCADA Timezone</label>
                    <input type="text" className="form-control bg-white border-secondary text-dark" value="UTC (Coordinated Universal Time)" readOnly />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'ai_models' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">2. AI Models &amp; Inference Engine</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">Ollama Base URL</label>
                    <input type="text" className="form-control bg-white border-secondary text-dark" value="http://localhost:11434" readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-bold">LLM Model Target</label>
                    <input type="text" className="form-control bg-white border-secondary text-dark" value="llama3.2 (3B Parameters)" readOnly />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sensors' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">3. Sensor Configuration</h5>
                <p className="small text-muted mb-0">Sampling Frequency: <strong>1.0s</strong> | Noise Filter: <strong>Kalman Filter Active</strong></p>
              </div>
            )}

            {activeSection === 'thresholds' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">4. Alarm Threshold Boundaries</h5>
                <div className="row g-2 small">
                  <div className="col-6 p-2 twin-card-box">Temp Warn: <strong>90 °C</strong> | Crit: <strong>95 °C</strong></div>
                  <div className="col-6 p-2 twin-card-box">Pres Warn: <strong>70 bar</strong> | Crit: <strong>75 bar</strong></div>
                </div>
              </div>
            )}

            {activeSection === 'alert_rules' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">5. ISA-18.2 Alert Escalation Rules</h5>
                <p className="small text-muted mb-0">Escalation Timeout: <strong>15 minutes</strong> to Field Supervisor</p>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">6. Notification Endpoints</h5>
                <p className="small text-muted mb-0">SMTP Server: <strong>smtp.virtualplant.io</strong> | Slack Webhook: <strong>Enabled</strong></p>
              </div>
            )}

            {activeSection === 'theme' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">7. Theme &amp; UI Styling</h5>
                <p className="small text-muted mb-0">Active Palette: <strong>Pure White (#FFFFFF)</strong></p>
              </div>
            )}

            {activeSection === 'api_keys' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">8. API Keys &amp; Tokens</h5>
                <input type="password" className="form-control bg-white border-secondary text-muted" value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." readOnly />
              </div>
            )}

            {activeSection === 'database' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">9. Database Driver</h5>
                <p className="small text-muted mb-0">Driver: <strong>PyMongo (MongoDB Atlas)</strong> | Fallback: <strong>In-Memory Thread-Safe Dict</strong></p>
              </div>
            )}

            {activeSection === 'users' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">10. User Directory</h5>
                <p className="small text-muted mb-0">Active Users: <strong>4 Field Engineers Registered</strong></p>
              </div>
            )}

            {activeSection === 'roles' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">11. Role Management</h5>
                <p className="small text-muted mb-0">Roles: <strong>Admin, Operator, Engineer, Viewer</strong></p>
              </div>
            )}

            {activeSection === 'permissions' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">12. RBAC Permissions Matrix</h5>
                <p className="small text-muted mb-0">Matrix: <strong>Granular Read/Write/Execute/Admin Permissions Active</strong></p>
              </div>
            )}

            {activeSection === 'logs' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">13. Real-Time System Audit Logs</h5>
                <pre className="p-3 twin-card-box text-success small font-mono mb-0" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  [INFO] SCADA Engine polling active.
                  [INFO] SimPy simulation thread locked.
                  [INFO] Ollama Llama-3.2 model ready.
                </pre>
              </div>
            )}

            {activeSection === 'backups' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">14. Database Backups</h5>
                <p className="small text-muted mb-0">Schedule: <strong>Daily Automated Snapshot at 00:00 UTC</strong></p>
              </div>
            )}

            {activeSection === 'support' && (
              <div>
                <h5 className="fw-bold text-dark mb-3 border-bottom border-secondary pb-2">15. Technical Support</h5>
                <p className="small text-muted mb-0">Helpdesk Email: <strong>support@virtualplant.io</strong> | Documentation: <strong>ISA-95 Standard v2.4</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
