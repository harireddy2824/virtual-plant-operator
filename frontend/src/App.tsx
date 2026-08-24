import React, { useState, useEffect } from 'react';
import { usePlantTelemetry } from './hooks/usePlantTelemetry';
import { Header } from './components/layout/Header';
import { MetricsStrip } from './components/layout/MetricsStrip';
import { ErrorBoundary } from './components/feedback/ErrorBoundary';

import { DashboardPane } from './features/command-center/DashboardPane';
import { DigitalTwinPane } from './features/digital-twin/DigitalTwinPane';
import { AiCopilotPane } from './features/ai-copilot/AiCopilotPane';
import { AnalyticsPane } from './features/analytics/AnalyticsPane';
import { AlertsPane } from './features/alerts/AlertsPane';
import { ReportsPane } from './features/reports/ReportsPane';
import { TimelinePane } from './features/timeline/TimelinePane';
import { SettingsPane } from './features/settings/SettingsPane';
import { CommandPaletteModal } from './features/command-palette/CommandPaletteModal';

export const App: React.FC = () => {
  const telemetry = usePlantTelemetry();
  const [cmdOpen, setCmdOpen] = useState<boolean>(false);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'twin', label: 'Digital Twin', icon: 'fa-cube' },
    { id: 'ai', label: 'AI Command Center', icon: 'fa-brain' },
    { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
    { id: 'alerts', label: 'Alerts', icon: 'fa-triangle-exclamation', counter: telemetry.data?.alerts?.active_count },
    { id: 'reports', label: 'Reports', icon: 'fa-file-lines' },
    { id: 'timeline', label: 'Timeline', icon: 'fa-clock-rotate-left' },
    { id: 'settings', label: 'Settings', icon: 'fa-gear' },
  ];

  const renderActiveView = () => {
    switch (telemetry.activeTab) {
      case 'dashboard':
        return <DashboardPane sensors={telemetry.localSensors} data={telemetry.data} />;
      case 'twin':
        return <DigitalTwinPane data={telemetry.data} />;
      case 'ai':
        return <AiCopilotPane data={telemetry.data} isLoading={telemetry.isAiLoading} />;
      case 'analytics':
        return <AnalyticsPane sensors={telemetry.localSensors} navClock={telemetry.navClock} />;
      case 'alerts':
        return <AlertsPane data={telemetry.data} onAcknowledge={() => telemetry.showToast('Alert Acknowledged', 'info')} />;
      case 'reports':
        return <ReportsPane data={telemetry.data} />;
      case 'timeline':
        return <TimelinePane data={telemetry.data} />;
      case 'settings':
        return <SettingsPane />;
      default:
        return <DashboardPane sensors={telemetry.localSensors} data={telemetry.data} />;
    }
  };

  return (
    <div className="app-body-layout">
      {/* Offline Alert Banner */}
      {telemetry.isOffline && (
        <div id="system-offline-banner" className="system-banner">
          <div className="d-flex align-items-center justify-content-between px-4 py-2">
            <div className="d-flex align-items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-warning me-1"></i>
              <span className="fw-semibold text-dark">System Connection Stalled</span> — Polling backend API...
            </div>
            <button className="btn btn-sm btn-outline-dark rounded-pill py-0 px-2" onClick={telemetry.refreshData}>
              Reconnect
            </button>
          </div>
        </div>
      )}

      <div className="container-fluid px-4 py-3">
        {/* Top Brand Header */}
        <Header
          activeTab={telemetry.activeTab}
          running={telemetry.running}
          isOffline={telemetry.isOffline}
          navClock={telemetry.navClock}
          uptimeStr={telemetry.uptimeStr}
          isInjecting={telemetry.isInjecting}
          isAiLoading={telemetry.isAiLoading}
          plantMode={telemetry.data?.status?.plant_mode ?? 'Operational'}
          healthGrade={telemetry.data?.health?.grade ?? 'Good'}
          onStart={telemetry.handleStart}
          onStop={telemetry.handleStop}
          onInject={telemetry.handleInjectAnomaly}
          onRefreshAi={telemetry.handleRefreshAi}
          onOpenCmdPalette={() => setCmdOpen(true)}
        />

        {/* 6 Top Metric Cards Strip */}
        <MetricsStrip data={telemetry.data} uptimeStr={telemetry.uptimeStr} />

        {/* Horizontal Pill Navigation Bar */}
        <nav className="horizontal-tabs-nav mb-4">
          <div className="d-flex align-items-center gap-2 p-2 rounded-3 bg-white border border-secondary shadow-sm">
            {navTabs.map((tab) => {
              const isActive = telemetry.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`nav-tab-pill ${isActive ? 'active' : ''}`}
                  onClick={() => telemetry.setActiveTab(tab.id)}
                >
                  <i className={`fa-solid ${tab.icon} me-2`}></i>
                  <span>{tab.label}</span>
                  {tab.counter !== undefined && tab.counter > 0 && (
                    <span className="ms-2 badge badge-status-crit rounded-pill">{tab.counter}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content-view">
          <ErrorBoundary>
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      </div>

      <CommandPaletteModal
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onSelectNav={(tabId) => telemetry.setActiveTab(tabId)}
        onInjectAnomaly={telemetry.handleInjectAnomaly}
        onRefreshAi={telemetry.handleRefreshAi}
        onToggleTheme={telemetry.toggleTheme}
      />

      {/* Floating Real-Time Toast Notification Queue Stack */}
      <div className="toast-container-stack">
        {telemetry.toasts.map((toast) => (
          <div key={toast.id} className="toast-notification-item">
            <i className={`fa-solid ${toast.type === 'danger' ? 'fa-triangle-exclamation text-danger' : toast.type === 'warning' ? 'fa-triangle-exclamation text-warning' : toast.type === 'info' ? 'fa-info-circle text-info' : 'fa-check-circle text-success'} fs-5`}></i>
            <div className="flex-grow-1">
              <strong className="d-block text-dark" style={{ fontSize: '0.82rem' }}>System Event Notification</strong>
              <span className="text-muted">{toast.msg}</span>
            </div>
            <button className="btn-close ms-2" style={{ fontSize: '0.7rem' }} onClick={() => telemetry.removeToast(toast.id)}></button>
          </div>
        ))}
      </div>
    </div>
  );
};

