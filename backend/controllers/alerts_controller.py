"""
Alert Management Controller
Handles active fault alerts and ISA-18.2 grouped alert responses.
"""

from __future__ import annotations

from flask import jsonify
from backend.models.schemas import ApiResponse
from backend.services.plant_service import plant_service


class AlertsController:
    @staticmethod
    def get_alerts():
        alerts_data = plant_service.get_alerts()
        return jsonify(ApiResponse(True, "Alerts retrieved", alerts_data).to_dict()), 200
