/**
 * API Service Client for Telemetry & AI Communication
 */

import { API_BASE } from './config.js';

export async function fetchJson(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDashboardState() {
  const payload = await fetchJson("/dashboard-state");
  if (!payload.success) throw new Error(payload.message || "API Failure");
  return payload.data;
}

export async function injectAnomalyApi() {
  return fetchJson("/sensor-data?inject=true");
}

export async function refreshAiAnalysisApi() {
  return fetchJson("/sensor-data");
}
