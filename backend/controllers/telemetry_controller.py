"""
Telemetry & Dashboard State Controller
Handles requests for sensor data generation, health scores, and dashboard state snapshots.
"""

from __future__ import annotations

from flask import jsonify, request
from models.schemas import ApiResponse
from services.plant_service import plant_service
from middleware.validation import validate_boolean_query_param


class TelemetryController:
    @staticmethod
    def get_sensor_data():
        inject = validate_boolean_query_param(request.args.get("inject"))
        snapshot = plant_service.advance(inject_anomaly=inject)
        return jsonify(ApiResponse(True, "Sensor data generated", snapshot).to_dict()), 200

    @staticmethod
    def get_health_score():
        score_data = plant_service.get_health_score()
        return jsonify(ApiResponse(True, "Health score retrieved", score_data).to_dict()), 200

    @staticmethod
    def get_dashboard_state():
        state_data = plant_service.get_dashboard_state()
        return jsonify(ApiResponse(True, "Dashboard state retrieved", state_data).to_dict()), 200
