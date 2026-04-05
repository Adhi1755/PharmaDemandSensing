"""
Legacy forecast blueprint — kept for backward compatibility.
The main LSTM forecast is served by predict_bp at POST /api/forecast.
"""

from flask import Blueprint, jsonify

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/api/drugs", methods=["GET"])
def drug_list():
    """Placeholder for backward compat. Products come from user's uploaded data."""
    return jsonify([])
