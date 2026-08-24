"""
Rule-Based Decision Engine
Maps sensor readings to corrective actions based on safety thresholds.
"""

from dataclasses import dataclass, field


@dataclass
class Action:
    rule:        str
    parameter:   str
    value:       float
    action:      str
    priority:    str   # HIGH | MEDIUM | LOW


def evaluate(reading: dict) -> list[Action]:
    """Return a list of corrective actions triggered by the reading."""
    actions: list[Action] = []

    t  = reading.get("temperature", 0)
    p  = reading.get("pressure",    0)
    v  = reading.get("vibration",   0)
    fr = reading.get("flow_rate",  100)

    if t > 90:
        actions.append(Action(
            rule      = "Temperature > 90 °C",
            parameter = "temperature",
            value     = t,
            action    = "Reduce Heater Power by 30%",
            priority  = "HIGH" if t > 95 else "MEDIUM",
        ))

    if p > 70:
        actions.append(Action(
            rule      = "Pressure > 70 bar",
            parameter = "pressure",
            value     = p,
            action    = "Open Pressure Relief Valve",
            priority  = "HIGH" if p > 75 else "MEDIUM",
        ))

    if v > 0.8:
        actions.append(Action(
            rule      = "Vibration > 0.8 g",
            parameter = "vibration",
            value     = v,
            action    = "Stop Machine Immediately",
            priority  = "HIGH",
        ))

    if fr < 50:
        actions.append(Action(
            rule      = "Flow Rate < 50 L/min",
            parameter = "flow_rate",
            value     = fr,
            action    = "Check Pump Operation & Clear Blockage",
            priority  = "HIGH" if fr < 30 else "MEDIUM",
        ))

    return actions


def actions_to_dict(actions: list[Action]) -> list[dict]:
    return [
        {
            "rule":      a.rule,
            "parameter": a.parameter,
            "value":     a.value,
            "action":    a.action,
            "priority":  a.priority,
        }
        for a in actions
    ]
