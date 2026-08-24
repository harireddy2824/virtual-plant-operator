"""
AI Copilot Service Module
Handles AI recommendation formatting, confidence scoring, and database persistence.
"""

from __future__ import annotations

from typing import Any
from ai_recommendation.recommender import format_ai_recommendation, get_ai_recommendation
from database.mongo_client import insert_ai_recommendation


class AiCopilotService:
    @staticmethod
    def calculate_confidence(ai_payload: dict[str, Any] | None, severity: str) -> int:
        if not ai_payload:
            return 0
        base = 68
        base += 22 if ai_payload.get("source") == "ollama" else 6
        base += {"Normal": 3, "Warning": 8, "Critical": 14}.get(severity, 6)
        base -= 12 if ai_payload.get("error") else 0
        return max(35, min(98, base))

    def persist_ai_recommendation(
        self,
        reading: dict[str, Any],
        ai_payload: dict[str, Any],
        ai_text: str
    ) -> dict[str, Any]:
        conf = self.calculate_confidence(ai_payload, reading["severity"])
        record = {
            "timestamp": reading["timestamp"],
            "severity": reading["severity"],
            "anomaly_type": reading.get("anomaly_type", "General Anomaly"),
            "source": ai_payload.get("source", "fallback"),
            "error": ai_payload.get("error", ""),
            "analysis": ai_text,
            "structured": ai_payload,
            "confidence": conf,
        }
        insert_ai_recommendation({
            "timestamp": reading["timestamp"],
            "severity": reading["severity"],
            "anomaly_type": reading.get("anomaly_type", "General Anomaly"),
            "source": ai_payload.get("source", "fallback"),
            "analysis": ai_text,
            "confidence": conf,
        })
        return record
