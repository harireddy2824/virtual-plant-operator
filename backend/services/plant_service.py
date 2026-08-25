"""
Core plant monitoring facade service orchestrating sub-services.
"""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone
from typing import Any

log = logging.getLogger(__name__)

from ai_recommendation.recommender import format_ai_recommendation, get_ai_recommendation
from anomaly_detection.detector import AnomalyDetector
from services.ai_copilot_service import AiCopilotService
from services.event_service import EventService
from services.telemetry_service import TelemetryService
from database.mongo_client import (
    get_alert_counts,
    get_recent_reports,
    find_report_by_id,
    insert_anomaly,
    insert_report,
    insert_sensor_reading,
)
from decision_engine.rules import actions_to_dict, evaluate
from reports.report_generator import generate_report as build_report
from simulation.plant_simulator import generate_sensor_reading
from utils.health_score import calculate_health_score


class PlantMonitoringService:
    def __init__(self) -> None:
        self.detector = AnomalyDetector()
        self.started_at = datetime.now(timezone.utc)
        self.lock = threading.Lock()

        # Modular Sub-services
        self.event_service = EventService(max_timeline_items=25)
        self.ai_copilot_service = AiCopilotService()
        self.telemetry_service = TelemetryService()

        # State storage
        self.history: list[dict[str, Any]] = []
        self.alert_log: list[dict[str, Any]] = []
        self.reports: list[dict[str, Any]] = []
        self.health_history: list[dict[str, Any]] = []
        self.latest_snapshot: dict[str, Any] | None = None
        self.critical_count = 0
        self.warning_count = 0
        self.tick_count = 0
        self.last_ai_analysis: dict[str, Any] | None = None

        self._record_event("System Started", "Plant monitoring service initialized.", "Normal", "system")

    # Exposed for compatibility
    @property
    def event_timeline(self) -> list[dict[str, Any]]:
        return self.event_service.event_timeline

    def _uptime(self) -> str:
        delta = datetime.now(timezone.utc) - self.started_at
        s = int(delta.total_seconds())
        return f"{s // 3600:02d}:{(s % 3600) // 60:02d}:{s % 60:02d}"

    def _record_event(self, title: str, detail: str, severity: str, category: str) -> None:
        self.event_service.record_event(title, detail, severity, category)

    def _build_health(self, reading: dict[str, Any]) -> dict[str, Any]:
        counts = get_alert_counts()
        base = calculate_health_score(counts["critical"], counts["warning"], sensor_reading=reading)
        scores = [e["score"] for e in self.health_history[-5:]]
        prev = scores[-1] if scores else base["score"]
        recovery_delta = base["score"] - (min(scores) if scores else base["score"])
        diff = base["score"] - prev
        trend = (
            "Recovering" if recovery_delta >= 5
            else "Improving" if diff >= 3
            else "Softening" if diff <= -3
            else "Stable"
        )
        return {
            **base,
            "critical_count": counts["critical"],
            "warning_count": counts["warning"],
            "uptime": self._uptime(),
            "trend": trend,
            "recovery_delta": recovery_delta,
            "history": list(self.health_history[-12:]),
        }

    # Core Advance Workflow
    def advance(self, inject_anomaly: bool = False) -> dict[str, Any]:
        with self.lock:
            raw = generate_sensor_reading(inject_anomaly=inject_anomaly)
            result = self.detector.predict(raw)
            actions_dict = actions_to_dict(evaluate(result))

            insert_sensor_reading(raw)

            ai_payload = None
            ai_text = ""

            if result["is_anomaly"]:
                insert_anomaly(result)
                if result["severity"] == "Critical":
                    self.critical_count += 1
                else:
                    self.warning_count += 1

                atype = result.get("anomaly_type", "Anomaly")
                self._record_event(
                    f"{atype} Detected",
                    f"{result['severity']} event — T:{raw['temperature']}°C P:{raw['pressure']}bar F:{raw['flow_rate']}L/min V:{raw['vibration']}g",
                    result["severity"],
                    "anomaly",
                )

                if self.tick_count % 5 == 0 or inject_anomaly:
                    ai_payload = get_ai_recommendation(
                        result, actions_dict, result["severity"],
                        anomaly_type=atype, return_structured=True,
                    )
                    ai_text = format_ai_recommendation(ai_payload)
                    self.last_ai_analysis = self.ai_copilot_service.persist_ai_recommendation(
                        result, ai_payload, ai_text
                    )
                    self._record_event(
                        "AI Analysis Generated",
                        f"{ai_payload.get('risk_level','Medium')} risk — guidance ready.",
                        result["severity"], "ai",
                    )

                health = self._build_health(result)
                self._record_event(
                    "Health Score Updated",
                    f"Score: {health['score']} ({health['grade']})",
                    result["severity"], "health",
                )
                report = build_report(result, result["severity"], actions_dict, ai_text, health)
                insert_report(report)
                self.reports.insert(0, report)
                self._record_event(
                    "Corrective Action Suggested",
                    f"Report {report['report_id']} — {atype}.",
                    result["severity"], "report",
                )
                self.alert_log.insert(0, {**result, "actions": actions_dict, "ai": ai_text, "ai_payload": ai_payload})
            else:
                health = self._build_health(result)

            self.history.append(result)
            if len(self.history) > 120:
                self.history.pop(0)

            self.health_history.append({
                "timestamp": result["timestamp"],
                "score": health["score"],
                "grade": health["grade"],
                "trend": health["trend"],
            })
            if len(self.health_history) > 60:
                self.health_history.pop(0)

            self.tick_count += 1
            self.latest_snapshot = {
                **result,
                "actions": actions_dict,
                "health": health,
                "ai": ai_text,
                "ai_payload": ai_payload,
                "component_statuses": self.telemetry_service.evaluate_component_statuses(result),
            }
            return self.latest_snapshot

    def get_dashboard_state(self) -> dict[str, Any]:
        snapshot = self.latest_snapshot or self.advance(False)
        return {
            "sensor_data": {
                "timestamp": snapshot["timestamp"],
                "temperature": snapshot["temperature"],
                "pressure": snapshot["pressure"],
                "flow_rate": snapshot["flow_rate"],
                "vibration": snapshot["vibration"],
            },
            "health": snapshot["health"],
            "status": {
                "plant_mode": snapshot["severity"],
                "ai_mode": "Grok",
                "database": "MongoDB",
                "ticks": self.tick_count,
                "last_updated": snapshot["timestamp"],
            },
            "alerts": self.event_service.get_grouped_alerts(self.alert_log),
            "ai_analysis": self.get_ai_analysis(),
            "component_statuses": snapshot.get("component_statuses", []),
            "event_timeline": self.event_service.event_timeline,
            "reports": self.get_reports(),
        }

    # Public Getters
    def get_health_score(self) -> dict[str, Any]:
        snap = self.latest_snapshot or self.advance(False)
        return snap.get("health") or self._build_health(snap)

    def get_alerts(self) -> dict[str, Any]:
        return self.event_service.get_grouped_alerts(self.alert_log)

    def get_ai_analysis(self) -> dict[str, Any]:
        if self.last_ai_analysis:
            return self.last_ai_analysis
        return {
            "timestamp": None, "severity": "Normal", "anomaly_type": "None",
            "source": "idle", "error": "", "analysis": "",
            "confidence": 0,
            "structured": {
                "root_cause": "No anomaly analyzed yet.",
                "risk_level": "Low",
                "corrective_actions": ["Wait for anomaly detection."],
                "safety_warnings": ["Monitor the plant dashboard."],
                "preventive_maintenance": ["Continue normal operation."],
            },
        }

    def get_reports(self) -> list[dict[str, Any]]:
        return self.reports or list(reversed(get_recent_reports(20)))

    def find_report(self, report_id: str) -> dict[str, Any] | None:
        for r in self.reports:
            if r.get("report_id") == report_id:
                return r
        return find_report_by_id(report_id)


    def generate_report(self, manual_data: dict[str, Any] | None = None) -> dict[str, Any]:
        snap = manual_data or self.latest_snapshot or self.advance(False)
        health = snap.get("health") or self._build_health(snap)
        report = build_report(snap, snap.get("severity", "Normal"), snap.get("actions") or [], snap.get("ai", ""), health)
        insert_report(report)
        self.reports.insert(0, report)
        return report


# Global Singleton Instance
plant_service = PlantMonitoringService()
