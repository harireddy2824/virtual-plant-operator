"""
Incident Report Generator
Produces a structured markdown report for any anomaly event.
"""

from datetime import datetime

from ai_recommendation.recommender import get_anomaly_type


def generate_report(
    reading:    dict,
    severity:   str,
    actions:    list[dict],
    ai_analysis: str,
    health:     dict,
) -> dict:
    """Return a report dict (also stored to MongoDB)."""
    return {
        "report_id":    f"RPT-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}",
        "timestamp":    reading.get("timestamp", datetime.utcnow().isoformat()),
        "sensor_readings": {
            "temperature": reading["temperature"],
            "pressure":    reading["pressure"],
            "flow_rate":   reading["flow_rate"],
            "vibration":   reading["vibration"],
        },
        "severity":        severity,
        "anomaly_type":    reading.get("anomaly_type") or get_anomaly_type(reading),
        "anomaly_score":   reading.get("anomaly_score"),
        "corrective_actions": actions,
        "ai_analysis":     ai_analysis,
        "health_score":    health["score"],
        "health_grade":    health["grade"],
    }


def report_to_markdown(report: dict) -> str:
    sr = report["sensor_readings"]
    actions_md = "\n".join(
        f"- **[{a['priority']}]** {a['action']}  _(Rule: {a['rule']})_"
        for a in report["corrective_actions"]
    ) or "- None"

    return f"""# Incident Report — {report['report_id']}

**Timestamp:** {report['timestamp']}
**Severity:** {report['severity']}
**Health Score:** {report['health_score']} ({report['health_grade']})

## Sensor Readings
| Parameter    | Value |
|---|---|
| Temperature  | {sr['temperature']} °C |
| Pressure     | {sr['pressure']} bar |
| Flow Rate    | {sr['flow_rate']} L/min |
| Vibration    | {sr['vibration']} g |

**Anomaly Type:** {report.get('anomaly_type', 'Normal')}

## Corrective Actions
{actions_md}

## AI Analysis
{report['ai_analysis']}
"""
