"""
Legacy inventory blueprint — kept for backward compatibility.
Inventory data is now derived from user's uploaded data in the dashboard.
"""

from flask import Blueprint, jsonify

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/api/inventory", methods=["GET"])
def inventory():
    return jsonify([])
