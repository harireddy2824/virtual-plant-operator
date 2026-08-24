# -*- coding: utf-8 -*-
"""
test_pipeline.py - End-to-end pipeline smoke test.
Run: python test_pipeline.py
"""

import sys, os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from simulation.plant_simulator     import generate_sensor_reading, generate_normal_dataset
from anomaly_detection.detector     import AnomalyDetector
from decision_engine.rules          import evaluate, actions_to_dict
from ai_recommendation.recommender  import get_ai_recommendation
from utils.health_score             import calculate_health_score
from reports.report_generator       import generate_report, report_to_markdown


def separator(title):
    print("\n" + "="*60)
    print("  " + title)
    print("="*60)


def test_simulation():
    separator("1. Plant Simulation")
    reading = generate_sensor_reading()
    print("  Normal reading:", reading)
    anomalous = generate_sensor_reading(inject_anomaly=True)
    print("  Injected anomaly:", anomalous)
    dataset = generate_normal_dataset(10)
    print("  Generated %d training records OK" % len(dataset))


def test_detector():
    separator("2. Anomaly Detection")
    det = AnomalyDetector()
    normal = {"temperature": 70, "pressure": 50, "flow_rate": 75, "vibration": 0.3,
              "timestamp": "2024-01-01T00:00:00"}
    result = det.predict(normal)
    print("  Normal reading  -> severity: %s  anomaly: %s" % (result["severity"], result["is_anomaly"]))

    critical = {"temperature": 98, "pressure": 80, "flow_rate": 20, "vibration": 1.2,
                "timestamp": "2024-01-01T00:00:01"}
    result2 = det.predict(critical)
    print("  Critical reading -> severity: %s  anomaly: %s" % (result2["severity"], result2["is_anomaly"]))
    assert result2["is_anomaly"] and result2["severity"] == "Critical", "Critical detection failed"
    print("  Assertion passed OK")


def test_decision_engine():
    separator("3. Decision Engine")
    reading = {"temperature": 95, "pressure": 72, "flow_rate": 40, "vibration": 0.9}
    actions = evaluate(reading)
    for a in actions:
        print("  [%s] %s  (rule: %s)" % (a.priority, a.action, a.rule))
    assert len(actions) == 4, "Expected 4 actions, got %d" % len(actions)
    print("  Assertion passed OK")


def test_health_score():
    separator("4. Health Score")
    for crit, warn in [(0, 0), (2, 3), (5, 5), (10, 10)]:
        h = calculate_health_score(crit, warn)
        print("  critical=%d warning=%d -> score=%d grade=%s" % (crit, warn, h["score"], h["grade"]))


def test_ai_recommendation():
    separator("5. AI Recommendation (fallback)")
    reading = {"temperature": 95, "pressure": 72, "flow_rate": 40, "vibration": 0.9,
               "timestamp": "2024-01-01T00:00:00"}
    actions = actions_to_dict(evaluate(reading))
    text    = get_ai_recommendation(reading, actions, "Critical")
    print(text[:400])
    assert "Root Cause" in text or "1." in text, "AI output missing expected sections"
    print("  Assertion passed OK")


def test_report():
    separator("6. Report Generator")
    reading = {"temperature": 95, "pressure": 72, "flow_rate": 40, "vibration": 0.9,
               "timestamp": "2024-01-01T00:00:00", "anomaly_score": -0.12}
    actions = actions_to_dict(evaluate(reading))
    health  = calculate_health_score(3, 2)
    ai_text = get_ai_recommendation(reading, actions, "Critical")
    report  = generate_report(reading, "Critical", actions, ai_text, health)
    md      = report_to_markdown(report)
    print(md[:500])
    print("  Report generated OK")


if __name__ == "__main__":
    test_simulation()
    test_detector()
    test_decision_engine()
    test_health_score()
    test_ai_recommendation()
    test_report()
    print("\nAll tests passed.\n")
