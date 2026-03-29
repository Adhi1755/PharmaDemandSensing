from flask import Blueprint, request, jsonify

from data.sample_data import (
    get_model_metrics,
    get_feature_importance,
    get_ai_insights,
    get_location_insights,
    get_intermittent_demand_data,
)

insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/api/model-metrics", methods=["GET"])
def model_metrics():
    return jsonify(get_model_metrics())


@insights_bp.route("/api/feature-importance", methods=["GET"])
def feature_importance():
    return jsonify(get_feature_importance())


@insights_bp.route("/api/insights", methods=["GET"])
def ai_insights():
    return jsonify(get_ai_insights())


@insights_bp.route("/api/location-insights", methods=["GET"])
def location_insights():
    region = request.args.get("region")
    return jsonify(get_location_insights(region))


@insights_bp.route("/api/intermittent-demand", methods=["GET"])
def intermittent_demand():
    return jsonify(get_intermittent_demand_data())
