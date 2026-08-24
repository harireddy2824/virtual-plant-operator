/**
 * Industrial Digital Twin & Process Flow Visualizer Module
 */

import { el } from './ui-utils.js';

export function updateDigitalTwin(data) {
  const components = data.component_statuses || [];
  const COMPONENTS = ["tank", "pump", "valve", "heater"];
  const sMap = { Normal: "normal", Warning: "warning", Critical: "critical" };

  COMPONENTS.forEach((id) => {
    const node = el(`${id}-node`);
    if (node) { node.classList.remove("normal", "warning", "critical"); node.classList.add("normal"); }
    const st = el(`${id}-status-text`);
    if (st) st.textContent = "Normal";
    const badge = el(`${id}-health-badge`);
    if (badge) { badge.textContent = "100%"; badge.style.width = "100%"; }
  });

  let worstStatus = "Normal";

  components.forEach((c) => {
    const node = el(`${c.id}-node`);
    if (!node) return;
    const cls = sMap[c.status] || "normal";
    node.classList.remove("normal", "warning", "critical");
    node.classList.add(cls);
    const st = el(`${c.id}-status-text`);
    if (st) { st.textContent = c.status; }
    const badge = el(`${c.id}-health-badge`);
    const h = Math.max(0, Math.round(c.health || 0));
    if (badge) { badge.textContent = `${h}%`; badge.style.width = `${h}%`; }

    if (c.status === "Critical") worstStatus = "Critical";
    else if (c.status === "Warning" && worstStatus !== "Critical") worstStatus = "Warning";
  });

  const pipeColor = worstStatus === "Critical" ? "#ef4444" : worstStatus === "Warning" ? "#f59e0b" : "#10b981";
  ["pipe-flow-1", "pipe-flow-2", "pipe-flow-3"].forEach(pipeId => {
    const pipe = el(pipeId);
    if (pipe) pipe.style.stroke = pipeColor;
  });

  const list = el("component-status-list");
  if (list && components.length) {
    list.innerHTML = components.map((c) => {
      const cls = sMap[c.status] || "normal";
      const dot = cls === "critical" ? "🔴" : cls === "warning" ? "🟡" : "🟢";
      return `
        <div class="col-md-6 col-xl-3">
          <div class="component-card-ui">
            <div>
              <strong class="d-block text-main">${dot} ${c.label}</strong>
              <span class="dim-sm">Status: ${c.status}</span>
            </div>
            <span class="fw-bold font-mono ${cls === "critical" ? "text-crit" : cls === "warning" ? "text-warn" : "text-good"}">${Math.max(0, Math.round(c.health || 0))}%</span>
          </div>
        </div>`;
    }).join("");
  }
}
