import { DashboardStatePayload, SensorReading } from '../types/telemetry';

const API_BASE = "";

async function fetchJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return res.json();
}

export async function fetchDashboardState(): Promise<DashboardStatePayload> {
  const payload = await fetchJson<any>("/dashboard-state");
  if (payload && typeof payload === 'object') {
    if (payload.success === false || payload.status === 'error') {
      throw new Error(payload.message || "Failed to fetch telemetry state");
    }
    if (payload.data && typeof payload.data === 'object' && 'sensor_data' in payload.data) {
      return payload.data as DashboardStatePayload;
    }
    if ('sensor_data' in payload) {
      return payload as DashboardStatePayload;
    }
  }
  throw new Error("Invalid telemetry payload format received from backend");
}

export async function injectAnomaly(): Promise<{ success: boolean; data: SensorReading }> {
  return fetchJson<{ success: boolean; data: SensorReading }>("/sensor-data?inject=true");
}

export async function triggerAiAnalysis(): Promise<{ success: boolean; data: SensorReading }> {
  return fetchJson<{ success: boolean; data: SensorReading }>("/sensor-data");
}

export function getReportPdfUrl(reportId: string): string {
  return `${API_BASE}/reports/${encodeURIComponent(reportId)}/pdf`;
}
