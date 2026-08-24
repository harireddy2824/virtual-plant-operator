import React, { useState } from 'react';
import { DashboardStatePayload } from '../../types/telemetry';
import { getReportPdfUrl } from '../../services/api';

interface TimelinePaneProps {
  data: DashboardStatePayload | null;
}

interface EventRecord {
  id: string;
  timestamp: string;
  equipment: string;
  severity: 'Green' | 'Yellow' | 'Orange' | 'Red';
  title: string;
  aiAnalysis: string;
  operatorAction: string;
  resolution: string;
  reportId?: string;
}

export const TimelinePane: React.FC<TimelinePaneProps> = ({ data }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const rawEvents = data?.event_timeline ?? [];

  const defaultEvents: EventRecord[] = [
    {
      id: 'EVT-501',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Thermal Heater H-401',
      severity: 'Red',
      title: 'Thermal Over-temperature Excursion Detected',
      aiAnalysis: 'Thermal heater temperature spiked to 95.4 °C exceeding 90 °C limit due to cooling loop flow restriction.',
      operatorAction: 'Heater power reduced by 30%. Auxiliary coolant valve CV-102 commanded open.',
      resolution: 'Temperature stabilized at 72.1 °C. Process loop restored.',
      reportId: 'RPT-20260725101',
    },
    {
      id: 'EVT-502',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Process Tank T-101',
      severity: 'Orange',
      title: 'Over-pressure Transients Detected',
      aiAnalysis: 'Pressure transient reached 74.2 bar (Threshold 70 bar). Downstream control valve throttle restriction.',
      operatorAction: 'Relief valve V-301 pulsed open. Feed pump P-202 throttled 15%.',
      resolution: 'Pressure normalized to 50.4 bar within 45 seconds.',
      reportId: 'RPT-20260725102',
    },
    {
      id: 'EVT-503',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Feed Pump P-202',
      severity: 'Yellow',
      title: 'Vibration Harmonics Elevation',
      aiAnalysis: 'Vibration amplitude elevated to 0.85g due to rotor unbalance on pump P-202.',
      operatorAction: 'Vibration FFT spectrum recorded. On-duty engineer Sarah Connor dispatched.',
      resolution: 'Bearing lubricated. Laser alignment scheduled for next maintenance window.',
      reportId: 'RPT-20260725103',
    },
    {
      id: 'EVT-504',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      equipment: 'Control Valve V-301',
      severity: 'Green',
      title: 'Routine SCADA Loop Calibration Check',
      aiAnalysis: 'Pneumatic actuator response verified within ±0.5% tolerance bounds.',
      operatorAction: 'No operator intervention required. Autonomous SCADA verification.',
      resolution: 'Calibration verified normal.',
      reportId: 'RPT-20260725104',
    },
  ];

  const eventsList: EventRecord[] = rawEvents.length
    ? rawEvents.map((ev, idx) => {
        const sevLower = (ev.severity || 'Normal').toLowerCase();
        const sevColor: 'Green' | 'Yellow' | 'Orange' | 'Red' =
          sevLower === 'critical' ? 'Red' : sevLower === 'warning' ? 'Orange' : sevLower === 'low' ? 'Yellow' : 'Green';

        return {
          id: `EVT-${100 + idx}`,
          timestamp: ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour12: false }) : '--',
          equipment: ev.title.includes('Tank') ? 'Storage Tank T-101' : ev.title.includes('Pump') ? 'Feed Pump P-202' : ev.title.includes('Valve') ? 'Control Valve V-301' : 'Thermal Heater H-401',
          severity: sevColor,
          title: ev.title,
          aiAnalysis: ev.detail || 'Autonomous SCADA diagnostic analysis completed.',
          operatorAction: 'Rule engine directive executed.',
          resolution: 'Condition monitored and logged in audit log.',
          reportId: `RPT-${idx}`,
        };
      })
    : defaultEvents;

  const filteredEvents = eventsList.filter((ev) => {
    const matchSev = selectedSeverity === 'All' || ev.severity === selectedSeverity;
    const matchEq = selectedEquipment === 'All' || ev.equipment.toLowerCase().includes(selectedEquipment.toLowerCase());
    const matchSearch =
      !searchQuery ||
      `${ev.title} ${ev.equipment} ${ev.aiAnalysis} ${ev.operatorAction}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchSev && matchEq && matchSearch;
  });

  // Export handlers
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_timeline_${Date.now()}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Equipment', 'Severity', 'Title', 'AI Analysis', 'Operator Action', 'Resolution'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.timestamp,
      `"${e.equipment}"`,
      e.severity,
      `"${e.title}"`,
      `"${e.aiAnalysis}"`,
      `"${e.operatorAction}"`,
      `"${e.resolution}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_timeline_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="tab-pane fade show active cockpit-bg p-3 rounded-4">
      {/* Header & Controls Bar */}
      <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-secondary flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-primary fs-4"></i> Professional Industrial Event Timeline
          </h4>
          <span className="text-muted small">
            Chronological audit stream of SCADA telemetry changes, AI analysis, operator directives, and resolutions
          </span>
        </div>

        {/* Export Buttons */}
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-info fw-bold" onClick={handleExportJSON}>
            <i className="fa-solid fa-file-code me-1"></i> Export JSON
          </button>
          <button className="btn btn-sm btn-outline-success fw-bold" onClick={handleExportCSV}>
            <i className="fa-solid fa-file-csv me-1"></i> Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-5">
          <input
            type="text"
            className="form-control form-control-sm bg-white border-secondary text-dark"
            placeholder="Search events, equipment, AI analysis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm bg-white border-secondary text-dark"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="Green">🟢 Green (Normal)</option>
            <option value="Yellow">🟡 Yellow (Notice)</option>
            <option value="Orange">🟠 Orange (Warning)</option>
            <option value="Red">🔴 Red (Critical)</option>
          </select>
        </div>

        <div className="col-6 col-md-4">
          <select
            className="form-select form-select-sm bg-white border-secondary text-dark"
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
          >
            <option value="All">All Equipment</option>
            <option value="Tank">Storage Tank T-101</option>
            <option value="Pump">Feed Pump P-202</option>
            <option value="Valve">Control Valve V-301</option>
            <option value="Heater">Thermal Heater H-401</option>
          </select>
        </div>
      </div>

      {/* Event Timeline Cards Feed */}
      <div className="d-flex flex-column gap-3">
        {!filteredEvents.length ? (
          <div className="p-4 text-center text-muted twin-card-box rounded border border-secondary">
            No events match the selected timeline filters.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isRed = ev.severity === 'Red';
            const isOrange = ev.severity === 'Orange';
            const isYellow = ev.severity === 'Yellow';
            const badgeCls = isRed ? 'badge-status-crit' : isOrange ? 'badge-status-warn' : isYellow ? 'badge-status-info' : 'badge-status-good';
            const borderCls = isRed ? 'border-danger' : isOrange ? 'border-warning' : isYellow ? 'border-info' : 'border-success-subtle';
            const dotIcon = isRed ? '🔴' : isOrange ? '🟠' : isYellow ? '🟡' : '🟢';

            return (
              <div key={ev.id} className={`p-3 rounded-4 twin-card-box border ${borderCls} shadow-sm`}>
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-5">{dotIcon}</span>
                    <strong className="text-dark fs-6">{ev.title}</strong>
                    <span className={`badge ${badgeCls} fw-bold`}>{ev.severity}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge badge-status-info font-mono">{ev.equipment}</span>
                    <span className="badge badge-status-info font-mono">{ev.timestamp}</span>
                  </div>
                </div>

                <div className="row g-2 mt-2 pt-2 border-top border-secondary small">
                  <div className="col-12 col-md-4">
                    <span className="text-muted d-block fw-bold mb-1"><i className="fa-solid fa-brain me-1 text-primary"></i> AI Analysis:</span>
                    <div className="text-dark">{ev.aiAnalysis}</div>
                  </div>

                  <div className="col-12 col-md-4">
                    <span className="text-muted d-block fw-bold mb-1"><i className="fa-solid fa-wrench me-1 text-warning"></i> Operator Action:</span>
                    <div className="text-dark">{ev.operatorAction}</div>
                  </div>

                  <div className="col-12 col-md-4">
                    <span className="text-muted d-block fw-bold mb-1"><i className="fa-solid fa-circle-check me-1 text-success"></i> Resolution:</span>
                    <div className="text-light">{ev.resolution}</div>
                  </div>
                </div>

                {ev.reportId && (
                  <div className="mt-2 pt-2 text-end">
                    <a className="btn btn-sm btn-outline-secondary py-0 px-2" href={getReportPdfUrl(ev.reportId)} target="_blank" rel="noreferrer">
                      <i className="fa-solid fa-file-pdf text-danger me-1"></i> Export Incident PDF
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
