"""
Event & Alert Management Service
Manages chronological event timeline logging and ISA-18.2 alert grouping.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any


class EventService:
    def __init__(self, max_timeline_items: int = 25) -> None:
        self.max_timeline_items = max_timeline_items
        self.event_timeline: list[dict[str, Any]] = []

    def record_event(self, title: str, detail: str, severity: str, category: str) -> None:
        self.event_timeline.insert(0, {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "title": title,
            "detail": detail,
            "severity": severity,
            "category": category,
        })
        self.event_timeline = self.event_timeline[:self.max_timeline_items]

    def get_grouped_alerts(self, alert_log: list[dict[str, Any]]) -> dict[str, Any]:
        recent = list(reversed(alert_log[-20:]))
        groups: dict[str, dict] = defaultdict(lambda: {"count": 0, "severity": "Normal", "last": None})

        for item in recent:
            atype = item.get("anomaly_type", "General Anomaly")
            sev = item.get("severity", "Normal")
            groups[atype]["count"] += 1
            groups[atype]["severity"] = sev
            groups[atype]["last"] = item

        warning_alerts = [item for item in recent if item.get("severity") == "Warning"]
        critical_alerts = [item for item in recent if item.get("severity") == "Critical"]

        return {
            "warning_alerts": warning_alerts[:5],
            "critical_alerts": critical_alerts[:5],
            "grouped": [{"type": k, **v} for k, v in groups.items()],
            "active_count": len(recent),
            "critical_count": len(critical_alerts),
            "ai_recommendations": [item for item in recent if item.get("ai")][:3],
        }
