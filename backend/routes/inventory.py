from flask import Blueprint, jsonify

from data.sample_data import get_inventory

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/api/inventory", methods=["GET"])
def inventory():
    return jsonify(get_inventory())
