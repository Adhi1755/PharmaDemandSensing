from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__)

# In-memory user store
users_db = {}


@auth_bp.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if email in users_db:
        return jsonify({"error": "Email already registered"}), 409

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    users_db[email] = {"name": name, "email": email, "password": password}
    return jsonify({"message": "Account created successfully", "user": {"name": name, "email": email}}), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users_db.get(email)
    if not user or user["password"] != password:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"message": "Login successful", "user": {"name": user["name"], "email": user["email"]}}), 200
