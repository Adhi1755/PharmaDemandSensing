from flask import Blueprint, jsonify

dashboard_bp = Blueprint("dashboard", __name__)

from data.sample_data import get_dashboard_stats, get_top_drugs, get_alerts, get_trend_data


@dashboard_bp.route("/api/dashboard-stats", methods=["GET"])
def dashboard_stats():
    return jsonify(get_dashboard_stats())


@dashboard_bp.route("/api/top-drugs", methods=["GET"])
def top_drugs():
    return jsonify(get_top_drugs())


@dashboard_bp.route("/api/alerts", methods=["GET"])
def alerts():
    return jsonify(get_alerts())


@dashboard_bp.route("/api/trend-data", methods=["GET"])
def trend_data():
    return jsonify(get_trend_data())
