"""
Plant Health Score — sensor-driven, auto-recovering.

Score is computed only from current sensor values so it rises
automatically once sensors return to normal ranges.

Status thresholds (requirement):
  90-100  Operational
  70-89   Good
  50-69   Warning
  0-49    Critical
"""

GRADE_MAP = [
    (90, "Operational", "🟢"),
    (70, "Good",        "🟡"),
    (50, "Warning",     "🟠"),
    (0,  "Critical",    "🔴"),
]


def _clamp(value: int) -> int:
    return max(0, min(100, value))


def _sensor_impacts(reading: dict | None) -> dict[str, int]:
    if not reading:
        return {"temperature": 0, "pressure": 0, "flow_rate": 0, "vibration": 0}

    temp      = float(reading.get("temperature", 70))
    pressure  = float(reading.get("pressure",    50))
    flow      = float(reading.get("flow_rate",   75))
    vibration = float(reading.get("vibration",  0.3))

    return {
        "temperature": (
            -25 if temp >= 95
            else -12 if temp >= 90
            else -4  if temp >= 85
            else  2  if 65 <= temp <= 78
            else  0
        ),
        "pressure": (
            -25 if pressure >= 75
            else -12 if pressure >= 70
            else -4  if pressure >= 65
            else  2  if 44 <= pressure <= 58
            else  0
        ),
        "flow_rate": (
            -25 if flow < 30
            else -12 if flow < 50
            else -4  if flow < 62
            else  2  if 68 <= flow <= 88
            else  0
        ),
        "vibration": (
            -25 if vibration >= 1.0
            else -12 if vibration >= 0.8
            else -4  if vibration >= 0.55
            else  2  if vibration <= 0.35
            else  0
        ),
    }


def calculate_health_score(
    critical_count: int = 0,
    warning_count: int = 0,
    sensor_reading: dict | None = None,
) -> dict:
    """
    Compute health purely from sensor state so recovery is automatic.
    alert counts are kept for backward compat but have minimal weight.
    """
    impacts = _sensor_impacts(sensor_reading)
    impact_total = sum(impacts.values())

    # Base 100 minus a small persistent penalty from historical alerts
    # (capped so sensors can still bring it back to 100)
    alert_penalty = min(critical_count * 3 + warning_count * 1, 20)
    score = _clamp(100 + impact_total - alert_penalty)

    grade, icon = "Critical", "🔴"
    for threshold, g, i in GRADE_MAP:
        if score >= threshold:
            grade, icon = g, i
            break

    return {
        "score": score,
        "grade": grade,
        "icon": icon,
        "base_score": _clamp(100 - alert_penalty),
        "sensor_impacts": impacts,
        "sensor_impact_total": impact_total,
    }
