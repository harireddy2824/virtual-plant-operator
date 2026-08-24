/**
 * Configuration & Sensor Threshold Constants
 */

export const API_BASE = import.meta.env.VITE_API_URL || "";
export const MAX_CHART_POINTS = 90;

export const SENSOR_THRESHOLDS = {
  temperature: { warning: 90,  critical: 95,  min: 20,  max: 120, label: "°C"   },
  pressure:    { warning: 70,  critical: 75,  min: 10,  max: 100, label: "bar"  },
  flow_rate:   { warning: 50,  critical: 30,  min: 0,   max: 120, label: "L/min" },
  vibration:   { warning: 0.8, critical: 1.0, min: 0,   max: 2,   label: "g"    },
};
