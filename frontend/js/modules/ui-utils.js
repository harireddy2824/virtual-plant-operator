/**
 * UI Utilities, Formatters, & Toast Notifications
 */

export const el = (id) => document.getElementById(id);

export function formatTime(ts) {
  if (!ts) return "--";
  try { return new Date(ts).toLocaleTimeString([], { hour12: false }); } catch { return ts; }
}

export function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function showToast(msg, type = "success", ms = 3000) {
  const area = el("toast-area");
  if (!area) return;
  const t = document.createElement("div");
  const pillType = type === "warning" ? "warning" : type === "error" ? "critical" : "ok";
  const iconType = type === "warning" ? "exclamation" : type === "error" ? "xmark" : "check";
  
  t.className = `status-pill status-${pillType} mb-2 shadow-md`;
  t.innerHTML = `<i class="fa-solid fa-${iconType} me-1"></i> ${msg}`;
  area.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function drift(value, center, noise, lo, hi) {
  const v = value + (center - value) * 0.08 + (Math.random() - 0.5) * noise * 2;
  return Math.max(lo, Math.min(hi, v));
}
