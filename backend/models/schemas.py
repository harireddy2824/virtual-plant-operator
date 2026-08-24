"""
API response helpers and lightweight schema definitions for the Flask backend.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(slots=True)
class ApiResponse:
    success: bool
    message: str
    data: Any
    meta: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        d = {"success": self.success, "message": self.message, "data": self.data}
        if self.meta is not None:
            d["meta"] = self.meta
        return d



@dataclass(slots=True)
class PlantSnapshot:
    timestamp: str
    temperature: float
    pressure: float
    flow_rate: float
    vibration: float
    anomaly_score: float
    is_anomaly: bool
    severity: str
    anomaly_type: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class HealthSnapshot:
    score: int
    grade: str
    icon: str
    critical_count: int
    warning_count: int
    uptime: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
