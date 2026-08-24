import React from 'react';

interface HeaderProps {
  activeTab: string;
  running: boolean;
  isOffline: boolean;
  navClock: string;
  uptimeStr: string;
  isInjecting: boolean;
  isAiLoading: boolean;
  plantMode: string;
  healthGrade: string;
  alertCount?: number;
  theme?: 'dark' | 'light';
  onStart: () => void;
  onStop: () => void;
  onInject: () => void;
  onRefreshAi: () => void;
  onOpenCmdPalette: () => void;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  running,
  isOffline,
  navClock,
  uptimeStr,
  isInjecting,
  isAiLoading,
  plantMode,
  alertCount = 11,
  theme = 'dark',
  onStart,
  onStop,
  onInject,
  onRefreshAi,
  onToggleTheme,
}) => {
  const isWarn = plantMode === 'Warning';
  const isCrit = plantMode === 'Critical' || isOffline;
  const statusBadgeCls = isCrit ? 'badge-status-crit' : isWarn ? 'badge-status-warn' : 'badge-status-good';
  const statusText = isCrit ? 'Critical' : isWarn ? 'Warning' : 'Good';

  return (
    <header className="brand-top-header py-3 px-4 mb-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        {/* Left Side: Brand Title & Subtitle */}
        <div className="d-flex align-items-center gap-3">
          <div className="brand-icon-box">
            <i className="fa-solid fa-industry"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="brand-main-title mb-0">Virtual Plant Operator</h2>
              <span className={`badge ${statusBadgeCls} rounded-pill px-2 py-1 small`}>
                <i className={`fa-solid fa-${isCrit ? 'triangle-exclamation' : isWarn ? 'exclamation' : 'check'} me-1`}></i>
                {statusText}
              </span>
            </div>
            <p className="brand-sub-title mb-0">
              AI-Powered Industrial Monitoring &amp; Anomaly Detection
            </p>
          </div>
        </div>

        {/* Right Side: Badges & Controls in Single Row */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          <span className={`badge ${isOffline ? 'badge-status-crit' : 'badge-status-info'} rounded-pill px-2 py-1`}>
            <i className="fa-solid fa-signal me-1"></i> {isOffline ? 'Offline' : 'Connected'}
          </span>
          <span className="badge header-time-field px-2 py-1" tabIndex={0}>
            <i className="fa-solid fa-clock me-1"></i> {navClock} UTC
          </span>
          <span className="badge header-time-field px-2 py-1" tabIndex={0}>
            <i className="fa-solid fa-stopwatch me-1"></i> Uptime: {uptimeStr || '00:10:23'}
          </span>
          <span className="badge badge-status-warn rounded-pill px-2 py-1 fw-bold">
            <i className="fa-solid fa-bell me-1"></i> {alertCount}
          </span>

          <div className="btn-group ms-2" role="group">
            <button className="btn btn-sm btn-header-start px-3 fw-bold" onClick={onStart} disabled={running}>
              <i className="fa-solid fa-play me-1"></i> Start
            </button>
            <button className="btn btn-sm btn-header-stop px-3 fw-bold" onClick={onStop} disabled={!running}>
              <i className="fa-solid fa-stop me-1"></i> Stop
            </button>
            <button className="btn btn-sm btn-header-inject px-3 fw-bold" onClick={onInject} disabled={isInjecting}>
              <i className={`fa-solid ${isInjecting ? 'fa-spinner fa-spin' : 'fa-bolt'} me-1`}></i>
              {isInjecting ? 'Injecting...' : 'Inject Anomaly'}
            </button>
            <button className="btn btn-sm btn-header-ai px-3 fw-bold" onClick={onRefreshAi} disabled={isAiLoading}>
              <i className={`fa-solid ${isAiLoading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} me-1`}></i>
              {isAiLoading ? 'Analyzing...' : 'AI Analysis'}
            </button>
            {onToggleTheme && (
              <button className="btn btn-sm btn-outline-secondary px-2" onClick={onToggleTheme} title="Toggle Dark/Light Theme">
                <i className={`fa-solid fa-${theme === 'dark' ? 'sun' : 'moon'} me-1`}></i>
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
