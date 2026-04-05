"""
Dashboard routes — returns ML-backed data for the authenticated user.
"""

from flask import Blueprint, jsonify, request

from data.store import datasets_db, prediction_db, store_lock, users_db

dashboard_bp = Blueprint("dashboard", __name__)


def _get_email():
    return (
        request.args.get("email", "").strip().lower()
        or (request.get_json(silent=True) or {}).get("email", "").strip().lower()
    )


@dashboard_bp.route("/api/dashboard-stats", methods=["GET"])
def dashboard_stats():
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)
        dataset = datasets_db.get(email)

    if not preds:
        return jsonify({
            "accuracy": 0,
            "precision": 0,
            "recall": 0,
            "f1": 0,
            "totalSamples": 0,
        })

    xgb = preds.get("xgboost", {})
    return jsonify({
        "accuracy": xgb.get("accuracy", 0),
        "precision": xgb.get("precision", 0),
        "recall": xgb.get("recall", 0),
        "f1": xgb.get("f1", 0),
        "totalSamples": preds.get("totalSamples", 0),
    })


@dashboard_bp.route("/api/dashboard-full", methods=["GET"])
def dashboard_full():
    """Single endpoint returning all dashboard data for the user."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)
        dataset = datasets_db.get(email)

    if not preds:
        return jsonify({"error": "No predictions available. Run model prediction first."}), 404

    xgb = preds.get("xgboost", {})
    rf = preds.get("randomForest")
    forecast = preds.get("forecast", {})

    result = {
        "kpi": {
            "accuracy": xgb.get("accuracy", 0),
            "precision": xgb.get("precision", 0),
            "recall": xgb.get("recall", 0),
            "f1": xgb.get("f1", 0),
        },
        "rfMetrics": rf,
        "demandDistribution": preds.get("demandDistribution", []),
        "featureImportance": preds.get("featureImportance", []),
        "insights": preds.get("insights", []),
        "forecast": forecast,
        "totalSamples": preds.get("totalSamples", 0),
        "demandThresholds": preds.get("demandThresholds", {}),
    }

    return jsonify(result), 200


@dashboard_bp.route("/api/top-drugs", methods=["GET"])
def top_drugs():
    """Return top-demand items from the user's actual data."""
    email = _get_email()

    with store_lock:
        dataset = datasets_db.get(email)

    if not dataset or dataset.get("processed") is None:
        return jsonify([])

    df = dataset["processed"]
    if "category" not in df.columns:
        return jsonify([])

    grouped = df.groupby("category").agg(
        totalDemand=("quantity", "sum"),
        avgDemand=("quantity", "mean"),
        records=("quantity", "count"),
    ).sort_values("totalDemand", ascending=False).head(5).reset_index()

    result = []
    for i, row in grouped.iterrows():
        # Calculate recent trend
        cat_data = df[df["category"] == row["category"]].sort_values("date")
        if len(cat_data) > 14:
            recent = cat_data["quantity"].tail(7).mean()
            previous = cat_data["quantity"].iloc[-14:-7].mean()
            change_pct = ((recent - previous) / max(previous, 1)) * 100
        else:
            change_pct = 0

        result.append({
            "name": row["category"],
            "totalDemand": int(row["totalDemand"]),
            "avgDemand": round(float(row["avgDemand"]), 1),
            "trend": "up" if change_pct > 5 else "down" if change_pct < -5 else "stable",
            "changePercent": round(float(change_pct), 1),
        })

    return jsonify(result)


@dashboard_bp.route("/api/trend-data", methods=["GET"])
def trend_data():
    """Return actual time-series demand from user's dataset."""
    email = _get_email()

    with store_lock:
        dataset = datasets_db.get(email)

    if not dataset or dataset.get("processed") is None:
        return jsonify([])

    df = dataset["processed"].sort_values("date")
    daily = df.groupby(df["date"].dt.strftime("%Y-%m-%d"))["quantity"].sum().reset_index()
    daily.columns = ["date", "totalDemand"]

    # Return last 30 days
    data = daily.tail(30).to_dict(orient="records")
    for d in data:
        d["totalDemand"] = round(float(d["totalDemand"]), 2)

    return jsonify(data)


@dashboard_bp.route("/api/alerts", methods=["GET"])
def alerts():
    """Generate alerts from prediction results."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)

    if not preds:
        return jsonify([])

    alerts_list = []
    insights = preds.get("insights", [])
    for ins in insights:
        severity = ins.get("severity", "low")
        alert_type = "critical" if severity == "critical" else "warning" if severity in ("high", "medium") else "info"
        alerts_list.append({
            "type": alert_type,
            "title": ins["title"],
            "message": ins["message"],
        })

    return jsonify(alerts_list[:8])
