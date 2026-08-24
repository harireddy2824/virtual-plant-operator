import React, { useState } from 'react';
import { DashboardStatePayload } from '../../types/telemetry';
import { getReportPdfUrl } from '../../services/api';

interface AlertsPaneProps {
  data: DashboardStatePayload | null;
  onAcknowledge?: (alertType: string) => void;
}

interface AlarmRecord {
  id: string;
  timestamp: string;
  equipment: string;
  location: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Resolved';
  rootCause: string;
  aiConfidence: number;
  status: 'Unacknowledged' | 'Acknowledged' | 'Assigned' | 'Resolved';
  assignedEngineer?: string;
  reportId?: string;
}

export const AlertsPane: React.FC<AlertsPaneProps> = ({ data, onAcknowledge }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'confidence'>('timestamp');
  const [assignModalAlarm, setAssignModalAlarm] = useState<AlarmRecord | null>(null);

  const onDutyEngineers = ['Sarah Connor', 'Alex Rivera', 'Marcus Vance', 'Elena Rostova'];

  const defaultAlarms: AlarmRecord[] = [
    {
      id: 'ALM-101',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Thermal Heater H-401',
      location: 'Zone 3 - Thermal Loop',
      severity: 'Critical',
      rootCause: 'Thermal overload: Temp 95.4 °C exceeds critical limit of 95 °C',
      aiConfidence: 98,
      status: 'Unacknowledged',
      reportId: 'RPT-20260725101',
    },
    {
      id: 'ALM-102',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Process Tank T-101',
      location: 'Zone 1 - Primary Vessel',
      severity: 'High',
      rootCause: 'Pressure excursion: Pressure 72.1 bar exceeds warning threshold 70 bar',
      aiConfidence: 96,
      status: 'Acknowledged',
      assignedEngineer: 'Sarah Connor',
      reportId: 'RPT-20260725102',
    },
    {
      id: 'ALM-103',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Feed Pump P-202',
      location: 'Zone 2 - Pumping Bay',
      severity: 'High',
      rootCause: 'Vibration anomaly: Vibration 0.85g exceeds warning threshold 0.8g',
      aiConfidence: 94,
      status: 'Unacknowledged',
      reportId: 'RPT-20260725103',
    },
    {
      id: 'ALM-104',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Control Valve V-301',
      location: 'Zone 1 - Feed Line',
      severity: 'Medium',
      rootCause: 'Flow rate restriction: Flow 42 L/min dropped below 50 L/min threshold',
      aiConfidence: 92,
      status: 'Assigned',
      assignedEngineer: 'Alex Rivera',
      reportId: 'RPT-20260725104',
    },
    {
      id: 'ALM-105',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Drive Motor M-105',
      location: 'Zone 2 - Drive Station',
      severity: 'Low',
      rootCause: 'Minor thermal drift: Motor winding temperature +3 °C above nominal',
      aiConfidence: 89,
      status: 'Resolved',
      assignedEngineer: 'Marcus Vance',
      reportId: 'RPT-20260725105',
    },
  ];

  const [alarms, setAlarms] = useState<AlarmRecord[]>(defaultAlarms);

  const handleAcknowledge = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Acknowledged' } : a))
    );
    if (onAcknowledge) onAcknowledge(id);
  };

  const handleAssignEngineer = (id: string, engineer: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Assigned', assignedEngineer: engineer } : a))
    );
    setAssignModalAlarm(null);
  };

  const handleResolve = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, severity: 'Resolved', status: 'Resolved' } : a))
    );
  };

  const filteredAlarms = alarms.filter((a) => {
    const matchCat = activeCategory === 'All' || a.severity === activeCategory;
    const matchSev = selectedSeverity === 'All' || a.severity === selectedSeverity;
    const matchSearch =
      !searchQuery ||
      `${a.equipment} ${a.location} ${a.rootCause} ${a.id}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchCat && matchSev && matchSearch;
  });

  const sortedAlarms = [...filteredAlarms].sort((a, b) => {
    if (sortBy === 'confidence') return b.aiConfidence - a.aiConfidence;
    if (sortBy === 'severity') {
      const sevOrder = { Critical: 4, High: 3, Medium: 2, Low: 1, Resolved: 0 };
      return sevOrder[b.severity] - sevOrder[a.severity];
    }
    return b.timestamp.localeCompare(a.timestamp);
  });

  return (
    <div className="tab-pane fade show active cockpit-bg p-3 rounded-4">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-secondary flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="fa-solid fa-bell text-warning fs-4"></i> ISA-18.2 Enterprise Alarm Management System
          </h4>
          <span className="text-muted small">
            Real-time plant fault event management, engineer dispatching, and automated PDF report downloads
          </span>
        </div>
        <div className="d-flex gap-2">
          <span className="badge badge-status-crit fs-6 px-3 py-2">
            Critical: {alarms.filter((a) => a.severity === 'Critical').length}
          </span>
          <span className="badge badge-status-warn fs-6 px-3 py-2">
            Active: {alarms.filter((a) => a.severity !== 'Resolved').length}
          </span>
        </div>
      </div>

      {/* Category Tabs Bar */}
      <div className="d-flex align-items-center gap-2 mb-3 p-2 bg-white rounded-3 border border-secondary flex-wrap">
        {['All', 'Critical', 'High', 'Medium', 'Low', 'Resolved'].map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm px-3 fw-bold rounded-2 ${activeCategory === cat ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search, Filter & Sort Controls Bar */}
      <div className="row g-2 mb-3 align-items-center">
        <div className="col-12 col-md-5">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white border-secondary text-muted">
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input
              type="text"
              className="form-control bg-white border-secondary text-dark"
              placeholder="Search by equipment, location, root cause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm bg-white border-secondary text-dark"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
            <option value="Resolved">Resolved Only</option>
          </select>
        </div>

        <div className="col-6 col-md-4">
          <select
            className="form-select form-select-sm bg-white border-secondary text-dark"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
          >
            <option value="timestamp">Sort by: Latest Timestamp</option>
            <option value="severity">Sort by: Severity Level</option>
            <option value="confidence">Sort by: AI Confidence</option>
          </select>
        </div>
      </div>

      {/* Alarm Table */}
      <div className="table-responsive bg-white rounded-3 border border-secondary">
        <table className="table align-middle mb-0 small">
          <thead>
            <tr className="border-secondary text-muted">
              <th>TIMESTAMP</th>
              <th>EQUIPMENT</th>
              <th>LOCATION</th>
              <th>SEVERITY</th>
              <th>ROOT CAUSE</th>
              <th>AI CONF</th>
              <th>STATUS</th>
              <th className="text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sortedAlarms.map((a) => {
              const isCrit = a.severity === 'Critical';
              const isHigh = a.severity === 'High';
              const isMed = a.severity === 'Medium';
              const isResolved = a.severity === 'Resolved';

              const badgeCls = isCrit
                ? 'bg-danger'
                : isHigh
                ? 'bg-warning text-dark'
                : isMed
                ? 'bg-info text-dark'
                : isResolved
                ? 'bg-success'
                : 'bg-secondary';

              return (
                <tr key={a.id} className="border-secondary">
                  <td className="font-mono text-muted">{a.timestamp}</td>
                  <td className="fw-bold text-dark">{a.equipment}</td>
                  <td className="text-muted">{a.location}</td>
                  <td>
                    <span className={`badge ${badgeCls} px-2 py-1 fw-bold`}>{a.severity}</span>
                  </td>
                  <td className="text-dark" style={{ maxWidth: '300px' }}>{a.rootCause}</td>
                  <td className="font-mono text-primary fw-bold">{a.aiConfidence}%</td>
                  <td>
                    <span className="badge bg-light border border-secondary text-dark">
                      {a.status} {a.assignedEngineer ? `(${a.assignedEngineer})` : ''}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary py-0 me-1"
                      onClick={() => handleAcknowledge(a.id)}
                    >
                      Ack
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary py-0"
                      onClick={() => setAssignModalAlarm(a)}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ASSIGN ENGINEER MODAL */}
      {assignModalAlarm && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-white border border-secondary text-dark rounded-4 shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold text-dark">Assign Field Engineer</h5>
                <button type="button" className="btn-close" onClick={() => setAssignModalAlarm(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Assign on-duty field engineer to investigate <strong>{assignModalAlarm.equipment}</strong> ({assignModalAlarm.id}).
                </p>
                <div className="d-flex flex-column gap-2">
                  {onDutyEngineers.map((eng, idx) => (
                    <button
                      key={idx}
                      className="btn btn-outline-primary text-start p-3 rounded-3 d-flex justify-content-between align-items-center"
                      onClick={() => handleAssignEngineer(assignModalAlarm.id, eng)}
                    >
                      <span className="fw-bold text-dark"><i className="fa-solid fa-user-gear me-2"></i>{eng}</span>
                      <span className="badge bg-success">Available</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModalAlarm(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
