/**
 * Application Centralized State Management Store
 */

class PlantStore {
  constructor() {
    this.state = {
      running: false,
      pollTimer: null,
      liveTimer: null,
      uptimeStart: null,
      reports: [],
      charts: {},
      latestSnapshot: null,
      localSensors: { temperature: 70, pressure: 50, flow_rate: 75, vibration: 0.3 },
      tickCount: 0,
      criticalCount: 0,
      warningCount: 0,
    };
  }

  get() {
    return this.state;
  }

  update(partial) {
    this.state = { ...this.state, ...partial };
    return this.state;
  }

  setRunning(status) {
    this.state.running = status;
  }

  setUptimeStart(timestamp) {
    this.state.uptimeStart = timestamp;
  }

  setLatestSnapshot(snapshot) {
    this.state.latestSnapshot = snapshot;
  }
}

export const plantStore = new PlantStore();
