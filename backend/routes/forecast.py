from flask import Blueprint, request, jsonify

from data.sample_data import get_historical_demand, get_forecast, DRUGS

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/api/forecast", methods=["GET"])
def forecast():
    drug = request.args.get("drug", "Paracetamol")
    horizon = int(request.args.get("horizon", 7))

    if horizon not in (7, 30):
        horizon = 7

    valid_drugs = [d["name"] for d in DRUGS]
    if drug not in valid_drugs:
        return jsonify({"error": f"Drug '{drug}' not found"}), 404

    historical = get_historical_demand(drug, days=90)
    predicted = get_forecast(drug, horizon)

    return jsonify({
        "drug": drug,
        "horizon": horizon,
        "historical": historical,
        "forecast": predicted,
    })


@forecast_bp.route("/api/drugs", methods=["GET"])
def drug_list():
    return jsonify([{"id": d["id"], "name": d["name"], "category": d["category"]} for d in DRUGS])
