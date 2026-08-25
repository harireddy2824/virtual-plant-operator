/**
 * UI View Renderers for Metrics, Health Diagnostics, Alerts Table, Reports, and AI Copilot
 */

import { SENSOR_THRESHOLDS } from './config.js';
import { el, formatTime } from './ui-utils.js';

export function severity(metric, value) {
  const r = SENSOR_THRESHOLDS[metric];
  if (!r) return "Normal";
  if (metric === "flow_rate") {
    if (value < r.critical) return "Critical";
    if (value < r.warning)  return "Warning";
    return "Normal";
  }
  if (value >= r.critical) return "Critical";
  if (value >= r.warning)  return "Warning";
  return "Normal";
}

export function barStyle(metric, value) {
  const r = SENSOR_THRESHOLDS[metric];
  const pct = Math.round(((value - r.min) / (r.max - r.min)) * 100);
  const sev = severity(metric, value);
  const colour = sev === "Critical" ? "var(--crit)" : sev === "Warning" ? "var(--warn)" : "var(--good)";
  return { width: `${Math.max(2, Math.min(100, pct))}%`, background: colour };
}

export function updateGauge(score, grade) {
  const canvas  = el("gauge-canvas");
  const scoreEl = el("health-score-number");
  const gradeEl = el("health-grade-label");
  const statusEl = el("health-status-label");

  const n = Math.max(0, Math.min(100, Number(score) || 0));
  const colour = n >= 90 ? "#10b981" : n >= 70 ? "#f59e0b" : "#ef4444";

  if (canvas) {
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r  = cx - 10;
    const startAngle = -Math.PI / 2;
    const endAngle   = startAngle + (n / 100) * 2 * Math.PI;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 14;
    ctx.lineCap   = "round";
    ctx.shadowColor = colour;
    ctx.shadowBlur  = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (scoreEl)  scoreEl.textContent  = n.toFixed(0);
  if (gradeEl)  gradeEl.textContent  = grade || "Unknown";
  if (statusEl) statusEl.textContent = grade || "Unknown";
  const heroGradeEl = el("hero-health-grade");
  if (heroGradeEl) heroGradeEl.textContent = grade || "Unknown";
}

export function updateKPIs(sensors) {
  const metrics = [
    ["temperature", "temperature-value", "temperature-status", "temperature-bar", "°C",    1],
    ["pressure",    "pressure-value",    "pressure-status",    "pressure-bar",    "bar",   1],
    ["flow_rate",   "flow-value",        "flow-status",        "flow-bar",        "L/min", 1],
    ["vibration",   "vibration-value",   "vibration-status",   "vibration-bar",   "g",     4],
  ];

  metrics.forEach(([metric, valId, stId, barId, unit, dp]) => {
    const raw = sensors[metric];
    const sev = severity(metric, raw);
    const valEl = el(valId);
    const stEl  = el(stId);
    const barEl = el(barId);

    if (valEl) valEl.textContent = `${Number(raw).toFixed(dp)} ${unit}`;
    if (stEl)  {
      stEl.textContent = sev;
      stEl.className = `kpi-badge ${sev === "Critical" ? "badge-crit" : sev === "Warning" ? "badge-warn" : "badge-ok"}`;
    }
    if (barEl) {
      const bs = barStyle(metric, raw);
      barEl.style.width      = bs.width;
      barEl.style.background = bs.background;
    }
    const cardKey = metric === "flow_rate" ? "flow" : metric;
    el(`kpi-${cardKey}`)?.classList.toggle("anomaly", sev === "Critical");
  });
}

function firstItem(arr, fallback) {
  if (!Array.isArray(arr) || !arr.length) return fallback;
  return String(arr[0]).replace(/^[•\-*\d.\s]+/, "").trim() || fallback;
}

export function updateHero(data, stateStore) {
  const snap    = data.sensor_data;
  const health  = data.health;
  const ai      = data.ai_analysis;
  const alerts  = data.alerts;
  const status  = data.status;
  const impacts = health.sensor_impacts || {};

  const activeAlerts   = alerts.active_count ?? ((alerts.warning_alerts?.length || 0) + (alerts.critical_alerts?.length || 0));
  const criticalAlerts = alerts.critical_count ?? (alerts.critical_alerts?.length || 0);

  el("hero-plant-status").textContent   = status.plant_mode;
  el("hero-health-score").textContent   = health.score;
  el("hero-active-alerts").textContent  = activeAlerts;
  el("hero-critical-events").textContent = criticalAlerts;
  el("hero-last-updated").textContent   = formatTime(status.last_updated || snap.timestamp);
  const heroTick = el("hero-tick");
  if (heroTick) heroTick.textContent = status.ticks;

  el("sys-plant-mode").textContent    = status.plant_mode;
  el("sys-ai-engine").textContent     = status.ai_mode;
  el("sys-database").textContent      = status.database;
  el("tick-count").textContent        = status.ticks;
  el("sys-last-update").textContent   = formatTime(snap.timestamp);
  el("sys-active-alerts").textContent = activeAlerts;
  el("sys-ai-confidence").textContent = `${Math.round(ai.confidence || 0)}%`;
  const sca = el("sys-critical-alerts");
  if (sca) sca.textContent = criticalAlerts;
  
  const heroAiEngineEl = el("hero-ai-engine");
  if (heroAiEngineEl) heroAiEngineEl.textContent = status.ai_mode;
  const heroAiConfEl = el("hero-ai-confidence");
  if (heroAiConfEl) heroAiConfEl.textContent = `${Math.round(ai.confidence || 0)}%`;

  updateGauge(health.score, health.grade);
  el("health-trend-label").textContent = health.trend || "Stable";
  const heroTrendEl = el("hero-health-trend");
  if (heroTrendEl) heroTrendEl.textContent = health.trend || "Stable";
  const hlt = el("health-last-time");
  if (hlt) hlt.textContent = formatTime(snap.timestamp);

  const impactEl = (id, v) => {
    const el2 = el(id); if (!el2) return;
    const n = v ?? 0;
    el2.textContent = (n > 0 ? "+" : "") + n;
    el2.className = n > 0 ? "text-good" : n < 0 ? "text-crit" : "dim-sm";
  };
  impactEl("impact-temperature", impacts.temperature);
  impactEl("impact-pressure",    impacts.pressure);
  impactEl("impact-flow",        impacts.flow_rate);
  impactEl("impact-vibration",   impacts.vibration);
  el("critical-count").textContent     = health.critical_count;
  el("warning-count").textContent      = health.warning_count;

  const incidents = (data.event_timeline || []).filter((e) => e.category !== "system");
  el("last-incident-label").textContent   = incidents.length ? incidents[0].title : "None";

  const connEl = el("connection-status");
  const aiConn = data.ai_connection || {};
  const aiLive = aiConn.available || ai.source === "grok" || (ai.source === "idle" && status.ai_mode === "Grok");
  connEl.className = `status-pill ${aiLive ? "status-ok" : "status-warning"}`;
  connEl.innerHTML = `<i class="fa-solid fa-signal"></i> ${aiLive ? "Connected" : "AI Fallback"}`;

  const badgeEl = el("plant-status-badge");
  const badgeCls = status.plant_mode === "Critical" ? "pill-crit" : status.plant_mode === "Warning" ? "pill-warn" : "pill-ok";
  badgeEl.className = `pill ${badgeCls}`;

  const ai_s = ai.structured || {};
  const riskLevel = ai_s.risk_level || ai.risk_level || "--";
  const aiConn2 = data.ai_connection || {};
  const aiConnLabel = aiConn2.available
    ? `Grok / ${aiConn2.model || "grok-2-latest"}`
    : ai.source === "grok" ? "Grok API"
    : ai.source === "fallback" ? "Fallback"
    : (status.ai_mode === "Grok" ? "Grok API" : "Idle");
  el("ai-source-pill").innerHTML = `<i class="fa-solid fa-brain"></i> ${aiConnLabel}`;
  el("ai-source-pill").className = `pill ${
    aiConnLabel.startsWith("Grok") ? "pill-ok" : aiConnLabel === "Fallback" ? "pill-warn" : "pill-dim"
  }`;

  el("ai-confidence-pill").textContent = `Conf: ${Math.round(ai.confidence || 0)}%`;
  el("ai-risk-level").textContent  = riskLevel;
  el("ai-risk-level").className = `ai-risk-val ${riskLevel === "Critical" ? "text-crit" : riskLevel === "High" ? "text-warn" : "text-good"}`;
  el("ai-root-cause").textContent  = ai_s.root_cause || ai.analysis || "No anomaly detected. System operating within normal parameters.";
  el("ai-action-summary").textContent    = firstItem(ai_s.corrective_actions,     "No corrective action required.");
  el("ai-warning-summary").textContent   = firstItem(ai_s.safety_warnings,        "No active safety warning.");
  el("ai-preventive-summary").textContent = firstItem(ai_s.preventive_maintenance, "Continue normal scheduled maintenance.");

  stateStore.update({
    localSensors: {
      temperature: snap.temperature,
      pressure: snap.pressure,
      flow_rate: snap.flow_rate,
      vibration: snap.vibration,
    }
  });

  el("system-offline-banner")?.classList.add("d-none");
}

export function renderAlerts(data) {
  const container = el("alert-list");
  if (!container) return;

  const alerts  = data.alerts || {};
  const grouped = alerts.grouped || [];
  const active  = alerts.active_count  ?? 0;
  const crit    = alerts.critical_count ?? 0;

  const aac = el("alert-active-count");
  const acc = el("alert-critical-count");
  if (aac) aac.textContent = active;
  if (acc) acc.textContent = crit;

  const navBadge = el("nav-alerts-badge");
  const navCount = el("nav-alert-count");
  if (navBadge) navBadge.classList.toggle("d-none", active === 0);
  if (navCount) navCount.textContent = active;

  if (!grouped.length) {
    container.innerHTML = `<tr><td colspan="7" class="text-center py-4 dim-sm">No active plant alerts. All constraints normal.</td></tr>`;
    return;
  }

  container.innerHTML = grouped.map((g) => {
    const sevCls  = g.severity === "Critical" ? "badge-crit" : g.severity === "Warning" ? "badge-warn" : "badge-ok";
    const last    = g.last || {};
    return `
      <tr>
        <td><span class="kpi-badge ${sevCls}">${g.severity}</span></td>
        <td class="fw-bold">${g.type}</td>
        <td class="font-mono">${last.temperature ? `${last.temperature} °C` : last.pressure ? `${last.pressure} bar` : last.flow_rate ? `${last.flow_rate} L/min` : `${last.vibration || 0} g`}</td>
        <td class="dim-sm">${g.type.includes("Temp") ? "90 / 95°C" : g.type.includes("Pressure") ? "70 / 75 bar" : g.type.includes("Vibration") ? "0.8 / 1.0g" : "<50 / <30 L/min"}</td>
        <td><span class="dim-sm font-mono">${g.action || "Monitor closely"}</span></td>
        <td class="dim-sm font-mono">${formatTime(last.timestamp)}</td>
        <td><button class="btn-ui btn-secondary-ui py-1 px-2" onclick="window.showToast('Alert Acknowledged', 'info')">Acknowledge</button></td>
      </tr>`;
  }).join("");
}

export function renderTimeline(data) {
  const container = el("event-timeline");
  if (!container) return;
  const events = data.event_timeline || [];
  if (!events.length) {
    container.innerHTML = `<div class="dim-sm py-3">No recent events logged in timeline.</div>`;
    return;
  }
  container.innerHTML = events.map((ev) => {
    const sev = (ev.severity || "Normal").toLowerCase();
    const dotColor = sev === "critical" ? "var(--crit)" : sev === "warning" ? "var(--warn)" : "var(--good)";
    return `
      <div class="d-flex align-items-start gap-3 py-2 border-bottom border-subtle">
        <i class="fa-solid fa-circle mt-1" style="font-size:0.6rem; color:${dotColor}"></i>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center">
            <strong class="text-main" style="font-size:0.85rem">${ev.title}</strong>
            <span class="dim-sm font-mono">${formatTime(ev.timestamp)}</span>
          </div>
          <p class="dim-sm m-0 mt-1">${ev.detail || ""}</p>
        </div>
      </div>`;
  }).join("");
}

function reportBody(r) {
  const s = r.sensor_readings || {};
  return `
    <div class="dim-sm">
      <div><strong>Severity:</strong> ${r.severity}</div>
      <div><strong>Timestamp:</strong> ${r.timestamp}</div>
      <div class="mt-2"><strong>Telemetry Vector:</strong> T ${s.temperature}°C | P ${s.pressure} bar | F ${s.flow_rate} L/min | V ${s.vibration} g</div>
      <div class="mt-2"><strong>AI Copilot Analysis:</strong> ${r.ai_analysis || "N/A"}</div>
    </div>`;
}

export function renderReports(data, stateStore) {
  const container = el("reports-list");
  const tmpl      = el("report-template");
  if (!container || !tmpl) return;

  const search = (el("report-search")?.value || "").toLowerCase();
  const filter = el("report-filter")?.value || "all";
  const reports = data.reports || [];
  stateStore.update({ reports });

  const filtered = reports.filter((r) => {
    const hay = `${r.report_id} ${r.severity} ${r.timestamp} ${r.ai_analysis || ""}`.toLowerCase();
    return (!search || hay.includes(search)) && (filter === "all" || r.severity === filter);
  });

  if (!filtered.length) {
    container.innerHTML = `<div class="dim-sm py-4">No incident reports match the selected criteria.</div>`;
    return;
  }

  container.innerHTML = "";
  filtered.slice(0, 8).forEach((r) => {
    const node = tmpl.content.cloneNode(true);
    const card = node.querySelector(".report-ui-card");
    const badge = r.severity === "Critical" ? "badge-crit" : r.severity === "Warning" ? "badge-warn" : "badge-ok";
    card.querySelector(".report-id").textContent = r.report_id;
    card.querySelector(".report-meta").innerHTML = `<span class="kpi-badge ${badge}">${r.severity}</span> <span class="ms-2 dim-sm">Health ${r.health_score} (${r.health_grade})</span>`;
    card.querySelector(".report-summary").textContent = `Incident Type: ${r.anomaly_type || "General Anomaly"}`;
    const body = card.querySelector(".report-body");
    body.innerHTML     = reportBody(r);
    body.style.display = "none";
    card.querySelector(".report-pdf").href = `/reports/${encodeURIComponent(r.report_id)}/pdf`;
    card.querySelector(".report-view").addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });
    container.appendChild(node);
  });
}
