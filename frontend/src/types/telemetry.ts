export interface SensorReading {
  timestamp: string;
  temperature: number;
  pressure: number;
  flow_rate: number;
  vibration: number;
  power?: number;
}

export interface ComponentStatus {
  id: string;
  label: string;
  status: 'Normal' | 'Warning' | 'Critical';
  health: number;
}

export interface HealthDiagnostics {
  score: number;
  grade: string;
  trend: string;
  critical_count: number;
  warning_count: number;
  uptime: string;
  recovery_delta?: number;
  sensor_impacts?: Record<string, number>;
  history?: Array<{ timestamp: string; score: number; grade: string; trend: string }>;
}

export interface AiStructuredAnalysis {
  root_cause?: string;
  risk_level?: string;
  confidence_score?: number;
  detected_evidence?: string;
  affected_equipment?: string;
  business_impact?: string;
  safety_impact?: string;
  estimated_downtime?: string;
  failure_probability?: number;
  remaining_useful_life?: string;
  repair_cost_estimate?: string;
  maintenance_priority?: string;
  operator_instructions?: string[];
  corrective_actions?: string[];
  safety_warnings?: string[];
  preventive_maintenance?: string[];
}

export interface AiAnalysisPayload {
  timestamp?: string | null;
  severity: string;
  anomaly_type: string;
  source: string;
  error?: string;
  analysis?: string;
  confidence: number;
  risk_level?: string;
  structured?: AiStructuredAnalysis;
}

export interface GroupedAlert {
  type: string;
  count: number;
  severity: 'Normal' | 'Warning' | 'Critical';
  action?: string;
  last?: Partial<SensorReading>;
}

export interface AlertsPayload {
  active_count: number;
  critical_count: number;
  grouped: GroupedAlert[];
  warning_alerts?: any[];
  critical_alerts?: any[];
}

export interface EventTimelineItem {
  timestamp: string;
  title: string;
  detail: string;
  severity: 'Normal' | 'Warning' | 'Critical';
  category: 'system' | 'anomaly' | 'ai' | 'health' | 'report';
}

export interface CorrectiveActionItem {
  priority: string;
  action: string;
  rule_applied?: string;
  rule?: string;
}

export interface ReportItem {
  report_id: string;
  timestamp: string;
  severity: string;
  health_score: number;
  health_grade: string;
  anomaly_type?: string;
  sensor_readings?: Partial<SensorReading>;
  ai_analysis?: string;
  corrective_actions?: CorrectiveActionItem[];
}

export interface DashboardStatePayload {
  sensor_data: SensorReading;
  health: HealthDiagnostics;
  status: {
    plant_mode: string;
    ai_mode: string;
    database: string;
    ticks: number;
    last_updated: string;
  };
  alerts: AlertsPayload;
  ai_analysis: AiAnalysisPayload;
  component_statuses: ComponentStatus[];
  event_timeline: EventTimelineItem[];
  reports: ReportItem[];
  ai_connection?: {
    available: boolean;
    model?: string;
  };
}
