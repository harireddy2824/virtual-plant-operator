/**
 * Main Application Orchestrator (ES Module Entry Point)
 * Coordinates state, API communications, Chart.js updates, Digital Twin visualizer, and UI views.
 */

/* global bootstrap */

import { plantStore } from './modules/state.js';
import { fetchDashboardState, injectAnomalyApi, refreshAiAnalysisApi } from './modules/api.js';
import { el, formatTime, formatUptime, showToast, drift } from './modules/ui-utils.js';
import { initCharts, pushToChart } from './modules/charts.js';
import { updateDigitalTwin } from './modules/digital-twin.js';
import { setupCommandPalette } from './modules/command-palette.js';
import { updateHero, updateKPIs, renderAlerts, renderTimeline, renderReports } from './modules/views.js';

// Expose showToast globally for inline HTML onclick handlers
window.showToast = showToast;

async function refreshDashboard() {
  try {
    const data = await fetchDashboardState();
    plantStore.setLatestSnapshot(data);

    updateHero(data, plantStore);
    updateKPIs(data.sensor_data);
    updateDigitalTwin(data);
    renderAlerts(data);
    renderTimeline(data);
    renderReports(data, plantStore);

    const ts = formatTime(data.sensor_data.timestamp);
    const charts = plantStore.get().charts;
    pushToChart(charts, "temperature", data.sensor_data.temperature, ts);
    pushToChart(charts, "pressure",    data.sensor_data.pressure,    ts);
    pushToChart(charts, "flow_rate",   data.sensor_data.flow_rate,   ts);
    pushToChart(charts, "vibration",   data.sensor_data.vibration,   ts);

    const cc = el("chart-clock");
    if (cc) cc.textContent = new Date().toLocaleTimeString([], { hour12: false });

  } catch (err) {
    console.error("Dashboard refresh failed:", err);
    el("system-offline-banner")?.classList.remove("d-none");
  }
}

function liveTick() {
  const s = plantStore.get().localSensors;
  s.temperature = drift(s.temperature, 70,  0.35, 20,  120);
  s.pressure    = drift(s.pressure,    50,  0.4,  10,  100);
  s.flow_rate   = drift(s.flow_rate,   75,  0.55,  0,  120);
  s.vibration   = drift(s.vibration,   0.3, 0.015, 0,    2);

  updateKPIs(s);

  const ts = new Date().toLocaleTimeString([], { hour12: false });
  const charts = plantStore.get().charts;
  pushToChart(charts, "temperature", parseFloat(s.temperature.toFixed(2)), ts);
  pushToChart(charts, "pressure",    parseFloat(s.pressure.toFixed(2)),    ts);
  pushToChart(charts, "flow_rate",   parseFloat(s.flow_rate.toFixed(2)),   ts);
  pushToChart(charts, "vibration",   parseFloat(s.vibration.toFixed(4)),   ts);

  const nc = el("nav-clock");
  if (nc) nc.textContent = ts;
  const cc = el("chart-clock");
  if (cc) cc.textContent = ts;

  const uptimeStart = plantStore.get().uptimeStart;
  if (uptimeStart) {
    const uptimeStr = formatUptime(Date.now() - uptimeStart);
    const hu = el("hero-uptime");
    if (hu) hu.textContent = uptimeStr;
    const nu = el("nav-uptime");
    if (nu) nu.textContent = uptimeStr;
  }
}

function startPolling() {
  stopPolling();
  const pollTimer = setInterval(() => {
    if (plantStore.get().running) refreshDashboard();
  }, 3000);
  const liveTimer = setInterval(liveTick, 1000);
  plantStore.update({ pollTimer, liveTimer });
}

function stopPolling() {
  const { pollTimer, liveTimer } = plantStore.get();
  clearInterval(pollTimer);
  clearInterval(liveTimer);
  plantStore.update({ pollTimer: null, liveTimer: null });
}

function bindEvents() {
  el("start-btn")?.addEventListener("click", () => {
    if (plantStore.get().running) return;
    plantStore.setRunning(true);
    if (!plantStore.get().uptimeStart) plantStore.setUptimeStart(Date.now());
    el("start-btn").disabled = true;
    el("stop-btn").disabled  = false;
    startPolling();
    refreshDashboard();
    showToast("Autonomous plant monitoring started", "success");
  });

  el("stop-btn")?.addEventListener("click", () => {
    plantStore.setRunning(false);
    stopPolling();
    el("start-btn").disabled = false;
    el("stop-btn").disabled  = true;
    showToast("Plant monitoring paused", "warning");
  });

  el("inject-btn")?.addEventListener("click", async () => {
    const btn = el("inject-btn");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Injecting...`;
    try {
      await injectAnomalyApi();
      await refreshDashboard();
      showToast("Anomaly injected into telemetry stream", "warning");
    } catch (e) {
      console.error(e);
      showToast("Anomaly injection failed", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-bolt me-1"></i>Inject Anomaly`;
    }
  });

  el("refresh-ai-btn")?.addEventListener("click", async () => {
    const btn = el("refresh-ai-btn");
    const skeleton = el("ai-skeleton-loader");
    const content = el("ai-content-area");

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i>Copilot Running...`;
    skeleton?.classList.remove("d-none");
    content?.classList.add("d-none");

    try {
      await refreshAiAnalysisApi();
      await refreshDashboard();
      showToast("Grok AI diagnostic completed", "success");
    } catch (e) {
      console.error(e);
      showToast("AI diagnostic execution failed", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-sparkles me-1"></i>AI Copilot`;
      skeleton?.classList.add("d-none");
      content?.classList.remove("d-none");
    }
  });

  el("zoom-reset-btn")?.addEventListener("click", () => {
    Object.values(plantStore.get().charts).forEach((c) => c.resetZoom?.());
  });

  el("report-search")?.addEventListener("input", () => {
    const snapshot = plantStore.get().latestSnapshot;
    if (snapshot) renderReports(snapshot, plantStore);
  });

  el("report-filter")?.addEventListener("change", () => {
    const snapshot = plantStore.get().latestSnapshot;
    if (snapshot) renderReports(snapshot, plantStore);
  });

  el("theme-toggle-btn")?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    
    const icon = el("theme-icon");
    const label = el("theme-label");
    if (nextTheme === "dark") {
      if (icon) icon.className = "fa-solid fa-sun me-1";
      if (label) label.textContent = "Light";
    } else {
      if (icon) icon.className = "fa-solid fa-moon me-1";
      if (label) label.textContent = "Dark";
    }
    
    showToast(`Theme switched to ${nextTheme}`, "info");
  });

  el("mobile-sidebar-toggle")?.addEventListener("click", () => {
    el("app-sidebar")?.classList.toggle("show-mobile");
  });

  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', (e) => {
      const txt = e.target.querySelector('span')?.textContent || "Dashboard";
      const activeBc = el("header-active-view");
      if (activeBc) activeBc.textContent = txt;
      window.dispatchEvent(new Event('resize'));
    });
  });
}

async function bootstrap() {
  initCharts(plantStore.get().charts);
  bindEvents();
  setupCommandPalette();

  plantStore.setRunning(true);
  plantStore.setUptimeStart(Date.now());
  if (el("start-btn")) el("start-btn").disabled = true;
  if (el("stop-btn"))  el("stop-btn").disabled  = false;

  await refreshDashboard();
  startPolling();

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const icon = el("theme-icon");
  const label = el("theme-label");
  if (isDark && icon && label) {
    icon.className = "fa-solid fa-sun me-1";
    label.textContent = "Light";
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
