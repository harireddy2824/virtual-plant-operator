"""
Telemetry Service Module
Evaluates component health and physical plant statuses (ISA-95 Alignment).
"""

from __future__ import annotations
from typing import Any


class TelemetryService:
    @staticmethod
    def evaluate_component_statuses(reading: dict[str, Any]) -> list[dict[str, Any]]:
        temp = float(reading.get("temperature", 70))
        pressure = float(reading.get("pressure", 50))
        flow = float(reading.get("flow_rate", 75))
        vibration = float(reading.get("vibration", 0.3))

        def get_status(val: float, warn: float, crit: float, inverse: bool = False) -> str:
            if inverse:
                return "Critical" if val < crit else "Warning" if val < warn else "Normal"
            return "Critical" if val >= crit else "Warning" if val >= warn else "Normal"

        return [
            {
                "id": "tank",
                "label": "Process Tank",
                "status": get_status(pressure, 70, 75),
                "health": max(0, round(100 - max(0, pressure - 58) * 2.2 - max(0, 68 - flow) * 1.2)),
            },
            {
                "id": "pump",
                "label": "Feed Pump",
                "status": "Critical" if vibration >= 1.0 else get_status(vibration, 0.8, 1.0),
                "health": max(0, round(100 - max(0, 62 - flow) * 1.6 - max(0, vibration - 0.3) * 65)),
            },
            {
                "id": "valve",
                "label": "Relief Valve",
                "status": get_status(pressure, 68, 74),
                "health": max(0, round(100 - max(0, pressure - 58) * 2.6)),
            },
            {
                "id": "heater",
                "label": "Thermal Heater",
                "status": get_status(temp, 90, 95),
                "health": max(0, round(100 - max(0, temp - 78) * 2.1)),
            },
        ]
