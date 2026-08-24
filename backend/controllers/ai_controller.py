"""
AI Copilot & Incident Analysis Controller
Handles LLM recommendation status and natural language diagnostic retrieval.
"""

from __future__ import annotations

from flask import jsonify
from backend.models.schemas import ApiResponse
from backend.services.plant_service import plant_service


class AiController:
    @staticmethod
    def get_ai_analysis():
        analysis_data = plant_service.get_ai_analysis()
        return jsonify(ApiResponse(True, "AI analysis retrieved", analysis_data).to_dict()), 200
