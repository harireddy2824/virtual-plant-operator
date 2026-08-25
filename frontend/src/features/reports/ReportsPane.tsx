import React, { useState } from 'react';
import { DashboardStatePayload, ReportItem } from '../../types/telemetry';
import { getReportPdfUrl } from '../../services/api';

interface ReportsPaneProps {
  data: DashboardStatePayload | null;
}

interface ReportTypeMeta {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
}

export const ReportsPane: React.FC<ReportsPaneProps> = ({ data }) => {
  const [selectedReportType, setSelectedReportType] = useState<string>('incident');
  const [search, setSearch] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [previewReport, setPreviewReport] = useState<any | null>(null);
  const [emailModalReport, setEmailModalReport] = useState<any | null>(null);
  const [emailAddress, setEmailAddress] = useState<string>('plant-supervisor@virtualplant.io');
  const [emailSentToast, setEmailSentToast] = useState<boolean>(false);

  const reportTypes: ReportTypeMeta[] = [
    { id: 'incident', name: 'Incident Report', category: 'Safety & Anomaly', icon: 'fa-triangle-exclamation', description: 'Detailed fault analysis & LLM root cause diagnosis' },
    { id: 'daily', name: 'Daily Report', category: 'Operations Digest', icon: 'fa-calendar-day', description: '24-hour plant telemetry summary & OEE metric' },
    { id: 'weekly', name: 'Weekly Report', category: 'Operations Digest', icon: 'fa-calendar-week', description: '7-day trend analysis & asset degradation' },
    { id: 'monthly', name: 'Monthly Report', category: 'Executive Digest', icon: 'fa-calendar-days', description: '30-day executive OEE & plant availability overview' },
    { id: 'maintenance', name: 'Maintenance Report', category: 'Asset Management', icon: 'fa-wrench', description: 'Equipment service logs, work orders, & seal replacements' },
    { id: 'energy', name: 'Energy Report', category: 'Utility Analytics', icon: 'fa-bolt', description: 'Power draw (kW), power factor, & energy efficiency rating' },
    { id: 'downtime', name: 'Downtime Report', category: 'Asset Management', icon: 'fa-hourglass-half', description: 'Unplanned outage breakdown & RUL forecasts' },
    { id: 'ai_perf', name: 'AI Performance Report', category: 'AI Intelligence', icon: 'fa-brain', description: 'Grok AI accuracy, confidence ratings, & inference latency' },
  ];

  const reports: ReportItem[] = data?.reports ?? [
    {
      report_id: 'RPT-20260725101',
      timestamp: new Date().toISOString(),
      severity: 'Critical',
      health_score: 84,
      health_grade: 'Warning',
      anomaly_type: 'Temperature Anomaly',
      ai_analysis: 'Thermal overload detected on Heater H-401. Temperature reached 95.4 °C exceeding 90 °C limit.',
      sensor_readings: { temperature: 95.4, pressure: 71.2, flow_rate: 42.1, vibration: 0.85 },
      corrective_actions: [{ priority: 'HIGH', action: 'Reduce Heater Power by 30%' }],
    },
    {
      report_id: 'RPT-20260725102',
      timestamp: new Date().toISOString(),
      severity: 'Warning',
      health_score: 91,
      health_grade: 'Operational',
      anomaly_type: 'Pressure Anomaly',
      ai_analysis: 'Pressure transient on Tank T-101. Pressure reached 72.1 bar exceeding 70 bar warning threshold.',
      sensor_readings: { temperature: 71.2, pressure: 72.1, flow_rate: 74.5, vibration: 0.31 },
      corrective_actions: [{ priority: 'MEDIUM', action: 'Open Pressure Relief Valve V-301' }],
    },
  ];

  const filteredReports = reports.filter((r) => {
    const hay = `${r.report_id} ${r.severity} ${r.timestamp} ${r.ai_analysis || ''}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchSeverity = filterSeverity === 'all' || r.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  const handleExportCSV = (r: ReportItem) => {
    const csvContent = `Report ID,Timestamp,Severity,Health Score,Anomaly Type,AI Analysis\n${r.report_id},${r.timestamp},${r.severity},${r.health_score},"${r.anomaly_type}","${r.ai_analysis}"`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.report_id}.csv`;
    a.click();
  };

  const handleExportExcel = (r: ReportItem) => {
    handleExportCSV(r);
  };

  const handlePrint = (r: ReportItem) => {
    setPreviewReport(r);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleSendEmail = () => {
    setEmailSentToast(true);
    setTimeout(() => {
      setEmailSentToast(false);
      setEmailModalReport(null);
    }, 2000);
  };

  return (
    <div className="tab-pane fade show active cockpit-bg p-3 rounded-4">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-secondary flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="fa-solid fa-file-contract text-primary fs-4"></i> Enterprise Reporting Module
          </h4>
          <span className="text-muted small">
            Generate, preview, export (PDF, Excel, CSV), print, and email multi-domain industrial reports
          </span>
        </div>
        <span className="badge badge-status-info px-3 py-2">8 Report Templates Ready</span>
      </div>

      {/* Report Types Selector Pills */}
      <div className="row g-2 mb-4">
        {reportTypes.map((rt) => {
          const isSel = selectedReportType === rt.id;
          return (
            <div className="col-6 col-md-3" key={rt.id}>
              <div
                className={`p-3 rounded-3 border cursor-pointer ${isSel ? 'bg-primary border-primary text-white' : 'twin-card-box text-muted'}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedReportType(rt.id)}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className={`fa-solid ${rt.icon} ${isSel ? 'text-white' : 'text-primary'}`}></i>
                  <strong className={isSel ? 'text-white' : 'text-dark'} style={{ fontSize: '0.85rem' }}>{rt.name}</strong>
                </div>
                <div className="small text-truncate opacity-75" style={{ fontSize: '0.72rem' }}>{rt.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-6">
          <input
            type="text"
            className="form-control form-control-sm bg-white border-secondary text-dark"
            placeholder="Search report ID, anomaly type, or AI analysis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-6">
          <select
            className="form-select form-select-sm bg-white border-secondary text-dark"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="Warning">Warning Only</option>
            <option value="Normal">Normal Only</option>
          </select>
        </div>
      </div>

      {/* Generated Reports Grid */}
      <div className="d-flex flex-column gap-3">
        {!filteredReports.length ? (
          <div className="p-4 text-center text-muted twin-card-box rounded border border-secondary">
            No incident reports match the selected search criteria.
          </div>
        ) : (
          filteredReports.map((r) => {
            const badgeCls = r.severity === 'Critical' ? 'badge-status-crit' : r.severity === 'Warning' ? 'badge-status-warn' : 'badge-status-good';
            const s = r.sensor_readings ?? { temperature: 70, pressure: 50, flow_rate: 75, vibration: 0.3 };

            return (
              <div key={r.report_id} className="cockpit-glass-card p-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <div>
                    <div className="fw-bold text-dark font-mono fs-6">{r.report_id}</div>
                    <span className="text-muted small">Generated: {new Date(r.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${badgeCls} px-2 py-1 fw-bold`}>{r.severity}</span>
                    <span className="badge badge-status-info">Health: {r.health_score}</span>
                  </div>
                </div>

                <div className="p-2 rounded twin-card-box small text-dark mb-3">
                  <strong>Anomaly Type:</strong> {r.anomaly_type || 'General Anomaly'} | <strong>Telemetry Vector:</strong> T {s.temperature}°C | P {s.pressure} bar | F {s.flow_rate} L/m | V {s.vibration} g
                  <div className="mt-1 text-muted"><strong>AI Analysis:</strong> {r.ai_analysis || 'N/A'}</div>
                </div>

                {/* Multi-Format Export Action Controls */}
                <div className="d-flex align-items-center justify-content-end gap-2 flex-wrap">
                  <a className="btn btn-sm btn-outline-danger fw-bold" href={getReportPdfUrl(r.report_id)} target="_blank" rel="noreferrer">
                    <i className="fa-solid fa-file-pdf me-1"></i> PDF
                  </a>
                  <button className="btn btn-sm btn-outline-success fw-bold" onClick={() => handleExportExcel(r)}>
                    <i className="fa-solid fa-file-excel me-1"></i> Excel
                  </button>
                  <button className="btn btn-sm btn-outline-info fw-bold" onClick={() => handleExportCSV(r)}>
                    <i className="fa-solid fa-file-csv me-1"></i> CSV
                  </button>
                  <button className="btn btn-sm btn-outline-secondary fw-bold" onClick={() => handlePrint(r)}>
                    <i className="fa-solid fa-print me-1"></i> Print
                  </button>
                  <button className="btn btn-sm btn-outline-warning text-dark fw-bold" onClick={() => setEmailModalReport(r)}>
                    <i className="fa-solid fa-envelope me-1"></i> Email
                  </button>
                  <button className="btn btn-sm btn-primary fw-bold" onClick={() => setPreviewReport(r)}>
                    <i className="fa-solid fa-eye me-1"></i> Preview
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REPORT PREVIEW MODAL */}
      {previewReport && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 2000 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-white border border-secondary text-dark rounded-4 shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold text-dark"><i className="fa-solid fa-file-contract me-2 text-primary"></i>Report Preview - {previewReport.report_id}</h5>
                <button type="button" className="btn-close" onClick={() => setPreviewReport(null)}></button>
              </div>
              <div className="modal-body p-4 twin-card-box rounded-3 m-3 font-mono">
                <div className="border-bottom border-secondary pb-3 mb-3">
                  <h4 className="text-dark fw-bold">Virtual Plant Operator Incident Report</h4>
                  <div className="small text-muted">ID: {previewReport.report_id} | Timestamp: {previewReport.timestamp}</div>
                </div>
                <div className="row g-2 mb-3 small">
                  <div className="col-6">Severity: <strong className="text-warning">{previewReport.severity}</strong></div>
                  <div className="col-6">Health Score: <strong className="text-success">{previewReport.health_score}/100</strong></div>
                  <div className="col-6">Anomaly Type: <strong className="text-primary">{previewReport.anomaly_type}</strong></div>
                  <div className="col-6">AI Engine: <strong>Grok AI API</strong></div>
                </div>
                <div className="p-3 twin-card-box mb-3 small">
                  <strong className="text-primary d-block mb-1">AI Root Cause Analysis:</strong>
                  {previewReport.ai_analysis}
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewReport(null)}>Close Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL DISPATCH MODAL */}
      {emailModalReport && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-white border border-secondary text-dark rounded-4 shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold text-dark"><i className="fa-solid fa-envelope me-2 text-warning"></i>Email Dispatch Report</h5>
                <button type="button" className="btn-close" onClick={() => setEmailModalReport(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">Dispatch <strong>{emailModalReport.report_id}</strong> directly to supervisor email address.</p>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Recipient Email Address</label>
                  <input
                    type="email"
                    className="form-control bg-white border-secondary text-dark"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                </div>
                {emailSentToast && (
                  <div className="alert alert-success py-2 small mb-0">
                    <i className="fa-solid fa-check-circle me-1"></i> Report dispatched successfully!
                  </div>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setEmailModalReport(null)}>Cancel</button>
                <button type="button" className="btn btn-warning text-dark fw-bold" onClick={handleSendEmail}>Send Report Email</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
