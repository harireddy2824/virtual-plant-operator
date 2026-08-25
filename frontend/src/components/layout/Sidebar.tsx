import React from 'react';
import { DashboardStatePayload } from '../../types/telemetry';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  data: DashboardStatePayload | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  data,
  theme,
  toggleTheme,
  mobileOpen,
}) => {
  const healthScore = data?.health?.score ?? '--';
  const tickCount = data?.status?.ticks ?? 0;
  const plantMode = data?.status?.plant_mode ?? 'Operational';
  const alertCount = data?.alerts?.active_count ?? 0;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', kbd: 'G D' },
    { id: 'twin', label: 'Digital Twin', icon: 'fa-diagram-project', kbd: 'G T' },
    { id: 'ai', label: 'AI Command Center', icon: 'fa-wand-magic-sparkles', badge: 'LLM' },
    { id: 'analytics', label: 'Telemetry Trends', icon: 'fa-chart-line' },
    { id: 'alerts', label: 'Alert Management', icon: 'fa-triangle-exclamation', counter: alertCount },
    { id: 'reports', label: 'Incident Reports', icon: 'fa-file-contract' },
    { id: 'timeline', label: 'Audit Timeline', icon: 'fa-clock-rotate-left' },
    { id: 'settings', label: 'System Settings', icon: 'fa-sliders' },
  ];

  return (
    <aside className={`app-sidebar ${mobileOpen ? 'show-mobile' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <i className="fa-solid fa-atom"></i>
        </div>
        <div className="brand-details">
          <span className="brand-title">VIRTUAL PLANT</span>
          <span className="brand-subtitle">AI Operator v2.4</span>
        </div>
      </div>

      <div className="sidebar-status-box">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <span className="status-box-label">PLANT STATUS</span>
          <span className={`pill ${plantMode === 'Critical' ? 'pill-crit' : plantMode === 'Warning' ? 'pill-warn' : 'pill-ok'}`}>
            <i className="fa-solid fa-circle-check"></i> {plantMode}
          </span>
        </div>
        <div className="status-box-meta">
          <span>Health: <strong>{healthScore}</strong></span>
          <span>Ticks: <strong>{tickCount}</strong></span>
        </div>
      </div>

      <div className="sidebar-nav-section">
        <div className="nav-section-title">COMMAND NAVIGATION</div>
        <ul className="nav flex-column sidebar-nav">
          {navItems.map((item) => (
            <li className="nav-item" key={item.id}>
              <button
                className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <i className={`fa-solid ${item.icon}`}></i>
                <span>{item.label}</span>
                {item.kbd && <kbd className="sidebar-kbd">{item.kbd}</kbd>}
                {item.badge && <span className="nav-badge-ai">{item.badge}</span>}
                {item.counter !== undefined && item.counter > 0 && (
                  <span className="nav-alert-counter">{item.counter}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer mt-auto">
        <div className="d-flex align-items-center justify-content-between px-2 mb-2">
          <span className="dim-sm">THEME</span>
          <button className="theme-switch-btn" onClick={toggleTheme}>
            <i className={`fa-solid fa-${theme === 'dark' ? 'sun' : 'moon'} me-1`}></i>
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
        <div className="sidebar-meta-info">
          <div><i className="fa-solid fa-server me-1"></i> Mode: <span className="fw-semibold">Autonomous</span></div>
          <div><i className="fa-solid fa-database me-1"></i> Engine: <span className="fw-semibold">Grok</span></div>
        </div>
      </div>
    </aside>
  );
};
