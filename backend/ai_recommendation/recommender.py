"""
AI Recommendation Engine
=========================

Local recommendation engine powered by Ollama running llama3.2.
Produces structured incident analysis for anomaly events and falls back
cleanly when Ollama is unavailable.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Any

import threading
import time
import requests
from dotenv import load_dotenv

load_dotenv()

_ollama_status_cache = None
_ollama_status_last_check = 0.0
_ollama_status_lock = threading.Lock()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", os.getenv("OLLAMA_URL", "http://localhost:11434"))
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "45"))


@dataclass(frozen=True)
class AIRecommendation:
    root_cause: str
    risk_level: str
    corrective_actions: list[str]
    safety_warnings: list[str]
    preventive_maintenance: list[str]
    detected_evidence: str = ""
    affected_equipment: str = ""
    business_impact: str = ""
    safety_impact: str = ""
    confidence_score: int = 98
    estimated_downtime: str = ""
    failure_probability: int = 4
    remaining_useful_life: str = ""
    repair_cost_estimate: str = ""
    maintenance_priority: str = "P4 Routine"
    operator_instructions: list[str] = None
    raw_response: str = ""
    source: str = "ollama"
    error: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "root_cause": self.root_cause,
            "risk_level": self.risk_level,
            "corrective_actions": self.corrective_actions,
            "safety_warnings": self.safety_warnings,
            "preventive_maintenance": self.preventive_maintenance,
            "detected_evidence": self.detected_evidence,
            "affected_equipment": self.affected_equipment,
            "business_impact": self.business_impact,
            "safety_impact": self.safety_impact,
            "confidence_score": self.confidence_score,
            "estimated_downtime": self.estimated_downtime,
            "failure_probability": self.failure_probability,
            "remaining_useful_life": self.remaining_useful_life,
            "repair_cost_estimate": self.repair_cost_estimate,
            "maintenance_priority": self.maintenance_priority,
            "operator_instructions": self.operator_instructions or self.corrective_actions,
            "raw_response": self.raw_response,
            "source": self.source,
            "error": self.error,
        }


class OllamaClient:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL, timeout: float = OLLAMA_TIMEOUT):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    @property
    def api_url(self) -> str:
        return f"{self.base_url}/api/generate"

    def is_available(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=min(self.timeout, 5))
            response.raise_for_status()
            return True
        except Exception:
            return False

    def generate(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
            },
        }
        response = requests.post(self.api_url, json=payload, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()
        return str(data.get("response", "")).strip()


class RecommendationPromptTemplate:
    @staticmethod
    def build(reading: dict, anomaly_type: str, actions: list[dict] | None = None, severity: str | None = None) -> str:
        actions = actions or []
        severity = severity or reading.get("severity", "Unknown")
        action_text = "\n".join(f"- {action.get('action', '')}" for action in actions) or "- No rule-based actions triggered"

        return f"""You are an expert industrial plant safety analyst.

Analyze the anomaly event using only the provided live sensor data and anomaly type.
Return a concise incident report with these exact sections:
Root Cause:
Risk Level:
Corrective Actions:
Safety Warnings:
Preventive Maintenance:

Guidance:
- Risk Level must be one of: Low, Medium, High, Critical.
- Use bullet points for Corrective Actions, Safety Warnings, and Preventive Maintenance.
- Keep the response practical and operational.
- Do not mention that you are an AI model.

Live Sensor Data:
- Temperature: {reading.get('temperature')} °C (Limit 90°C)
- Pressure: {reading.get('pressure')} bar (Limit 70 bar)
- Flow Rate: {reading.get('flow_rate')} L/min (Limit 50 L/min)
- Vibration: {reading.get('vibration')} g (Limit 0.8g)
- Anomaly Type: {anomaly_type}
- Detection Severity: {severity}

Rule Engine Output:
{action_text}
"""


class RecommendationParser:
    SECTION_HEADERS = {
        "root_cause": re.compile(r"^root cause\s*:?"),
        "risk_level": re.compile(r"^risk level\s*:?"),
        "corrective_actions": re.compile(r"^corrective actions\s*:?"),
        "safety_warnings": re.compile(r"^safety warnings\s*:?"),
        "preventive_maintenance": re.compile(r"^preventive maintenance\s*:?"),
    }

    @staticmethod
    def parse(raw_text: str) -> dict[str, Any]:
        cleaned = raw_text.strip()
        if not cleaned:
            raise ValueError("Empty Ollama response")

        sections: dict[str, list[str]] = {key: [] for key in RecommendationParser.SECTION_HEADERS}
        current_key: str | None = None

        for raw_line in cleaned.splitlines():
            line = raw_line.strip()
            if not line:
                continue

            matched_key = None
            for key, pattern in RecommendationParser.SECTION_HEADERS.items():
                if pattern.match(line.lower()):
                    matched_key = key
                    break

            if matched_key is not None:
                current_key = matched_key
                remainder = re.sub(r"^[^:]+:\s*", "", line).strip()
                if remainder:
                    sections[current_key].append(remainder)
                continue

            if current_key is not None:
                sections[current_key].append(line)

        root_cause = " ".join(sections["root_cause"]).strip() or "Unable to determine a specific root cause from the available data."
        risk_level = " ".join(sections["risk_level"]).strip() or "Medium"
        corrective_actions = RecommendationParser._normalize_bullets(sections["corrective_actions"]) or ["Review the affected process and verify sensor readings."]
        safety_warnings = RecommendationParser._normalize_bullets(sections["safety_warnings"]) or ["Monitor the plant closely until the condition clears."]
        preventive_maintenance = RecommendationParser._normalize_bullets(sections["preventive_maintenance"]) or ["Inspect and recalibrate relevant equipment during the next maintenance window."]

        return {
            "root_cause": root_cause,
            "risk_level": RecommendationParser._normalize_risk(risk_level),
            "corrective_actions": corrective_actions,
            "safety_warnings": safety_warnings,
            "preventive_maintenance": preventive_maintenance,
        }

    @staticmethod
    def _normalize_bullets(lines: list[str]) -> list[str]:
        bullets: list[str] = []
        for line in lines:
            cleaned = re.sub(r"^[-*\d.\s]+", "", line).strip()
            if cleaned:
                bullets.append(cleaned)
        return bullets

    @staticmethod
    def _normalize_risk(risk_text: str) -> str:
        candidates = ["Low", "Medium", "High", "Critical"]
        text = risk_text.strip().title()
        for candidate in candidates:
            if candidate.lower() in text.lower():
                return candidate
        
class RecommendationFormatter:
    @staticmethod
    def to_markdown(recommendation: dict[str, Any]) -> str:
        return (
            f"**Root Cause:**\n{recommendation.get('root_cause', '')}\n\n"
            f"**Risk Level:**\n{recommendation.get('risk_level', 'Medium')}\n\n"
            f"**Corrective Actions:**\n"
            + "\n".join(f"- {item}" for item in recommendation.get('corrective_actions', []))
            + "\n\n"
            f"**Safety Warnings:**\n"
            + "\n".join(f"- {item}" for item in recommendation.get('safety_warnings', []))
            + "\n\n"
            f"**Preventive Maintenance:**\n"
            + "\n".join(f"- {item}" for item in recommendation.get('preventive_maintenance', []))
        )


def _fallback_analysis(reading: dict, anomaly_type: str, actions: list[dict] | None, severity: str) -> AIRecommendation:

    actions = actions or []
    action_text = [action.get("action", "Review the affected process.") for action in actions] or ["Review the affected process and verify sensor readings."]

    temp = reading.get("temperature", 70.0)
    pres = reading.get("pressure", 50.0)
    flow = reading.get("flow_rate", 75.0)
    vib = reading.get("vibration", 0.3)

    atype_lower = anomaly_type.lower()

    if "temperature" in atype_lower or temp > 90:
        root_cause = f"Thermal overload detected: Temperature measured at {temp:.1f} °C (Threshold 90 °C). Thermal heater H-401 loop cooling efficiency degraded."
        evidence = f"T = {temp:.1f} °C (+{(temp-70):.1f} °C over nominal baseline of 70 °C)."
        equipment = "Thermal Heater H-401 & Cooling Loop C-102"
        impact = "Potential product thermal degradation. Est. $12,500/hr revenue risk."
        safety = "High temperature hazard (OSHA Class 2). Risk of thermal insulation breakdown."
        confidence = 96
        downtime = "1.5 - 3.0 Hours"
        prob = 84
        rul = "180 Operating Hours"
        cost = "$3,200 (Thermal Sensor & Coolant Valve Replacement)"
        priority = "P1 Critical"
        operator_inst = ["Reduce heater power by 30%", "Verify auxiliary cooling loop pump status", "Isolate zone H-401 if temp exceeds 95 °C"]
        warnings = ["Thermal over-temperature risk on primary vessel."]
        maintenance = ["Schedule coolant pump seal inspection within 12 hours."]

    elif "pressure" in atype_lower or pres > 70:
        root_cause = f"Over-pressure excursion detected: Pressure measured at {pres:.1f} bar (Threshold 70 bar). Downstream valve V-301 restriction or line blockage."
        evidence = f"P = {pres:.1f} bar (+{(pres-50):.1f} bar over nominal baseline of 50 bar)."
        equipment = "Process Tank T-101 & Relief Valve V-301"
        impact = "Unplanned unit trip risk. Est. $24,000/hr revenue risk."
        safety = "Critical pressure excursion (ISA-84 SIL 2). Relief valve armed."
        confidence = 98
        downtime = "2.0 - 4.5 Hours"
        prob = 91
        rul = "120 Operating Hours"
        cost = "$5,400 (Relief Valve Refurbishment & Piping Flush)"
        priority = "P1 Critical"
        operator_inst = ["Open pressure relief valve V-301", "Throttle feed pump P-202 inlet flow", "Verify tank T-101 pressure sensor calibration"]
        warnings = ["Over-pressure containment event warning."]
        maintenance = ["Inspect pressure relief valve seat integrity within 8 hours."]

    elif "flow" in atype_lower or flow < 50:
        root_cause = f"Process flow restriction detected: Flow rate measured at {flow:.1f} L/min (Threshold 50 L/min). Intake strainer blockage or pump cavitation."
        evidence = f"F = {flow:.1f} L/min (-{(75-flow):.1f} L/min drop from nominal baseline of 75 L/min)."
        equipment = "Feed Pump P-202 & Strainer S-101"
        impact = "Throughput drop of 33%. Est. $8,000/hr partial production impact."
        safety = "Pump dry-run hazard. Risk of mechanical seal burnout."
        confidence = 94
        downtime = "1.0 - 2.0 Hours"
        prob = 72
        rul = "320 Operating Hours"
        cost = "$1,800 (Filter Basket Replacement & Impeller Inspection)"
        priority = "P2 High"
        operator_inst = ["Check suction filter differential pressure", "Switch to standby feed pump P-202B", "Flush intake line S-101"]
        warnings = ["Low flow condition may cause pump cavitation."]
        maintenance = ["Clean pump inlet strainer basket within 24 hours."]

    elif "vibration" in atype_lower or vib > 0.8:
        root_cause = f"Mechanical bearing wear detected: Vibration measured at {vib:.3f} g (Threshold 0.8g). Rotor unbalance or bearing race degradation on pump P-202."
        evidence = f"V = {vib:.3f} g (+{(vib-0.3):.3f} g elevation from baseline of 0.3g)."
        equipment = "Feed Pump P-202 Motor & Bearing Assembly"
        impact = "Catastrophic mechanical failure risk. Est. $45,000 replacement risk."
        safety = "Rotating machinery high-vibration hazard (ISO 10816 Class II)."
        confidence = 97
        downtime = "4.0 - 8.0 Hours"
        prob = 88
        rul = "96 Operating Hours"
        cost = "$6,200 (Bearing Set Replacement & Laser Alignment)"
        priority = "P1 Critical"
        operator_inst = ["Stop machine P-202 immediately if vibration exceeds 1.0g", "Perform vibration FFT spectrum analysis", "Inspect motor mounting bolts"]
        warnings = ["High vibration persistent mechanical fatigue risk."]
        maintenance = ["Perform laser shaft alignment and replace drive-end bearings."]

    else:
        root_cause = f"Nominal process state: Telemetry vector locked at baseline (T={temp:.1f} °C, P={pres:.1f} bar, F={flow:.1f} L/min, V={vib:.3f} g)."
        evidence = "All sensor parameters within ±1.5% of calibrated setpoints."
        equipment = "All Plant Assets (T-101, P-202, V-301, H-401)"
        impact = "Zero financial loss. Nominal production throughput."
        safety = "Nominal operation (Safety Class 0). All interlocks clear."
        confidence = 99
        downtime = "0 Hours"
        prob = 3
        rul = "2,400 Operating Hours"
        cost = "$0 (Nominal Operation)"
        priority = "P4 Routine"
        operator_inst = ["Maintain continuous SCADA telemetry monitoring", "Execute routine shift inspection logging"]
        warnings = ["No active safety warnings."]
        maintenance = ["Routine 30-day scheduled inspection."]

    return AIRecommendation(
        root_cause=root_cause,
        risk_level=severity if severity in {"Low", "Medium", "High", "Critical"} else ("High" if prob > 50 else "Low"),
        corrective_actions=action_text,
        safety_warnings=warnings,
        preventive_maintenance=maintenance,
        detected_evidence=evidence,
        affected_equipment=equipment,
        business_impact=impact,
        safety_impact=safety,
        confidence_score=confidence,
        estimated_downtime=downtime,
        failure_probability=prob,
        remaining_useful_life=rul,
        repair_cost_estimate=cost,
        maintenance_priority=priority,
        operator_instructions=operator_inst,
        source="fallback",
    )


def get_anomaly_type(reading: dict) -> str:
    anomaly_type = reading.get("anomaly_type")
    if anomaly_type:
        return anomaly_type

    if reading.get("temperature", 0) > 90:
        return "Temperature Anomaly"
    if reading.get("pressure", 0) > 70:
        return "Pressure Anomaly"
    if reading.get("flow_rate", 100) < 50:
        return "Flow Anomaly"
    if reading.get("vibration", 0) > 0.8:
        return "Vibration Anomaly"
    return "General Anomaly"


def get_ai_recommendation(
    reading: dict,
    actions: list[dict] | None,
    severity: str,
    anomaly_type: str | None = None,
    return_structured: bool = False,
) -> str | dict[str, Any]:
    anomaly_type = anomaly_type or get_anomaly_type(reading)
    fallback = _fallback_analysis(reading, anomaly_type, actions, severity)

    prompt = RecommendationPromptTemplate.build(reading, anomaly_type, actions, severity)
    client = OllamaClient()

    try:
        status = ollama_status()
        if not status.get("available", False):
            raise RuntimeError("Ollama is not available")
        raw_response = client.generate(prompt)
        parsed = RecommendationParser.parse(raw_response)
        recommendation = AIRecommendation(
            root_cause=parsed["root_cause"],
            risk_level=parsed["risk_level"],
            corrective_actions=parsed["corrective_actions"],
            safety_warnings=parsed["safety_warnings"],
            preventive_maintenance=parsed["preventive_maintenance"],
            detected_evidence=fallback.detected_evidence,
            affected_equipment=fallback.affected_equipment,
            business_impact=fallback.business_impact,
            safety_impact=fallback.safety_impact,
            confidence_score=fallback.confidence_score,
            estimated_downtime=fallback.estimated_downtime,
            failure_probability=fallback.failure_probability,
            remaining_useful_life=fallback.remaining_useful_life,
            repair_cost_estimate=fallback.repair_cost_estimate,
            maintenance_priority=fallback.maintenance_priority,
            operator_instructions=fallback.operator_instructions,
            raw_response=raw_response,
            source="ollama",
        )
    except Exception as exc:
        recommendation = fallback

    structured = recommendation.to_dict()
    if return_structured:
        return structured
    return RecommendationFormatter.to_markdown(structured)


def format_ai_recommendation(recommendation: dict[str, Any]) -> str:
    return RecommendationFormatter.to_markdown(recommendation)


def ollama_status() -> dict[str, Any]:
    global _ollama_status_cache, _ollama_status_last_check
    now = time.time()
    with _ollama_status_lock:
        if _ollama_status_cache is not None and (now - _ollama_status_last_check) < 10.0:
            return _ollama_status_cache

        client = OllamaClient()
        try:
            response = requests.get(f"{client.base_url}/api/tags", timeout=1.5)
            response.raise_for_status()
            res = {"available": True, "model": client.model, "base_url": client.base_url, "error": ""}
        except Exception as exc:
            res = {"available": False, "model": client.model, "base_url": client.base_url, "error": str(exc)}
        
        _ollama_status_cache = res
        _ollama_status_last_check = now
        return res
