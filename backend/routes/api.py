from __future__ import annotations

from flask import Blueprint, jsonify, request, send_file
from backend.services.plant_service import plant_service
from backend.services.pdf_service import generate_pdf_response

api_bp = Blueprint("api", __name__)


@api_bp.get("/sensor-data")
def get_sensor_data():
    inject = request.args.get("inject", "false").lower() == "true"
    snapshot = plant_service.advance(inject_anomaly=inject)
    return jsonify({
        "status": "success",
        "data": {
            "reading": {
                "timestamp": snapshot["timestamp"],
                "temperature": snapshot["temperature"],
                "pressure": snapshot["pressure"],
                "flow_rate": snapshot["flow_rate"],
                "vibration": snapshot["vibration"],
            },
            "anomaly": {
                "is_anomaly": snapshot.get("is_anomaly", False),
                "severity": snapshot.get("severity", "Normal"),
                "anomaly_type": snapshot.get("anomaly_type", "None"),
            },
            "actions": snapshot.get("actions", []),
            "health": snapshot.get("health", {}),
        }
    })


@api_bp.get("/health-score")
def get_health_score():
    return jsonify({
        "status": "success",
        "data": plant_service.get_health_score()
    })


@api_bp.get("/alerts")
def get_alerts():
    alerts_data = plant_service.get_alerts()
    grouped = alerts_data.get("grouped", []) if isinstance(alerts_data, dict) else []
    return jsonify({
        "status": "success",
        "data": {
            "grouped": grouped,
            "active_count": len(grouped),
            "critical_count": plant_service.critical_count,
        }
    })


@api_bp.get("/ai-analysis")
def get_ai_analysis():
    return jsonify({
        "status": "success",
        "data": plant_service.get_ai_analysis()
    })


@api_bp.get("/reports")
def get_reports():
    reports = plant_service.get_reports()
    return jsonify({
        "status": "success",
        "count": len(reports),
        "data": reports
    })


@api_bp.post("/generate-report")
def generate_report():
    report = plant_service.generate_report()
    return jsonify({
        "status": "success",
        "message": "Report generated",
        "data": report
    })


@api_bp.get("/reports/<report_id>/pdf")
def download_pdf(report_id: str):
    report = plant_service.find_report(report_id)
    if not report:
        return jsonify({"status": "error", "message": f"Report '{report_id}' not found"}), 404
    pdf_buf = generate_pdf_response(report)
    return send_file(
        pdf_buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{report_id}.pdf"
    )


@api_bp.get("/dashboard-state")
def get_dashboard_state():
    return jsonify({
        "status": "success",
        "success": True,
        "data": plant_service.get_dashboard_state()
    })
