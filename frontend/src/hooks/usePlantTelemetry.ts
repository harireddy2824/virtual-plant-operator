import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardStatePayload, SensorReading } from '../types/telemetry';
import { fetchDashboardState, injectAnomaly, triggerAiAnalysis } from '../services/api';

export interface ToastMessage {
  id: string;
  msg: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'danger';
}

export function usePlantTelemetry() {
  const [data, setData] = useState<DashboardStatePayload | null>(null);
  const [running, setRunning] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [uptimeStart] = useState<number>(Date.now());
  const [uptimeStr, setUptimeStr] = useState<string>('00:00:00');
  const [navClock, setNavClock] = useState<string>('--:--:--');

  const [localSensors, setLocalSensors] = useState<SensorReading>({
    timestamp: new Date().toISOString(),
    temperature: 70,
    pressure: 50,
    flow_rate: 75,
    vibration: 0.3,
  });

  const stateRef = useRef({ running, localSensors });
  stateRef.current = { running, localSensors };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((msg: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const refreshData = useCallback(async () => {
    try {
      const payload = await fetchDashboardState();
      setData(payload);
      setIsOffline(false);
      setLocalSensors(payload.sensor_data);
    } catch (err) {
      console.error('[Telemetry Polling Error]:', err);
      setIsOffline(true);
    }
  }, []);

  // Polling Effect (every 3 seconds)
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      if (stateRef.current.running) {
        refreshData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // 1-second drift & live clock effect
  useEffect(() => {
    const interval = setInterval(() => {
      const ts = new Date().toLocaleTimeString([], { hour12: false });
      setNavClock(ts);

      const elapsed = Math.floor((Date.now() - uptimeStart) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setUptimeStr(`${h}:${m}:${s}`);

      if (stateRef.current.running) {
        setLocalSensors((prev) => {
          const drift = (val: number, center: number, noise: number, lo: number, hi: number) => {
            const v = val + (center - val) * 0.08 + (Math.random() - 0.5) * noise * 2;
            return Math.max(lo, Math.min(hi, v));
          };
          return {
            ...prev,
            timestamp: new Date().toISOString(),
            temperature: drift(prev.temperature, 70, 0.35, 20, 120),
            pressure: drift(prev.pressure, 50, 0.4, 10, 100),
            flow_rate: drift(prev.flow_rate, 75, 0.55, 0, 120),
            vibration: drift(prev.vibration, 0.3, 0.015, 0, 2),
          };
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [uptimeStart]);

  // Theme synchronization effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    showToast(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`, 'info');
  }, [theme, showToast]);

  const handleStart = useCallback(() => {
    setRunning(true);
    showToast('Autonomous plant monitoring started', 'success');
  }, [showToast]);

  const handleStop = useCallback(() => {
    setRunning(false);
    showToast('Plant monitoring paused', 'warning');
  }, [showToast]);

  const handleInjectAnomaly = useCallback(async () => {
    setIsInjecting(true);
    try {
      await injectAnomaly();
      await refreshData();
      showToast('Anomaly injected into telemetry stream', 'warning');
    } catch (e) {
      showToast('Anomaly injection failed', 'error');
    } finally {
      setIsInjecting(false);
    }
  }, [refreshData, showToast]);

  const handleRefreshAi = useCallback(async () => {
    setIsAiLoading(true);
    try {
      await triggerAiAnalysis();
      await refreshData();
      showToast('Ollama AI diagnostic completed', 'success');
    } catch (e) {
      showToast('AI diagnostic execution failed', 'error');
    } finally {
      setIsAiLoading(false);
    }
  }, [refreshData, showToast]);

  return {
    data,
    running,
    isOffline,
    isAiLoading,
    isInjecting,
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    toasts,
    showToast,
    removeToast,
    uptimeStr,
    navClock,
    localSensors,
    handleStart,
    handleStop,
    handleInjectAnomaly,
    handleRefreshAi,
    refreshData,
  };
}
