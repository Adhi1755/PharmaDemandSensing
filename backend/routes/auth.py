import sqlite3

from flask import Blueprint, jsonify, request

from data.auth_db import authenticate_user, create_user, get_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    try:
        user = create_user(name=name, email=email, password=password)
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered"}), 409
    except Exception as exc:
        return jsonify({"error": f"Unable to create account: {exc}"}), 500

    return jsonify({
        "message": "Account created successfully",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "isNewUser": user["isNewUser"],
            "hasUploadedData": user["hasUploadedData"],
        },
    }), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = authenticate_user(email, password)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "isNewUser": user["isNewUser"],
            "hasUploadedData": user["hasUploadedData"],
        },
    }), 200


@auth_bp.route("/api/me", methods=["GET"])
def me():
    email = request.args.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = get_user(email)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user": {
            "name": user["name"],
            "email": user["email"],
            "isNewUser": user["isNewUser"],
            "hasUploadedData": user["hasUploadedData"],
            "profile": user["profile"],
        },
    }), 200
