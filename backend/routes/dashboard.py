"""
Dashboard routes — returns ML-backed data for the authenticated user.
All responses use the standardised envelope: { status, data, message }.
"""

import logging

from flask import Blueprint, jsonify, request

from data.store import datasets_db, prediction_db, store_lock
from routes.fallback import compute_dataset_averages, is_valid_result, wrap_response

logger = logging.getLogger(__name__)

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
        averages = compute_dataset_averages(
            dataset.get("processed") if dataset else None
        )
        return jsonify(wrap_response(
            {
                "totalSales": averages["totalSales"],
                "forecastedSales": averages["forecastedSales"],
                "modelAccuracy": averages["modelAccuracy"],
            },
            status="fallback",
            message="No predictions available yet. Showing estimated values.",
        ))

    xgb = preds.get("xgboost", {})

    # Compute total sales from historical data
    processed = dataset.get("processed") if dataset else None
    if processed is not None and not processed.empty and "quantity" in processed.columns:
        total_sales = round(float(processed["quantity"].sum()), 2)
    else:
        total_sales = compute_dataset_averages(processed)["totalSales"]

    # Forecasted sales from forecast data
    forecast = preds.get("forecast", {})
    future = forecast.get("futureForecast", [])
    if future:
        forecasted_sales = round(sum(f["predicted"] for f in future), 2)
    else:
        forecasted_sales = compute_dataset_averages(processed)["forecastedSales"]

    # Best model accuracy
    model_accuracy = xgb.get("accuracy", 0)
    rf = preds.get("randomForest")
    if rf and rf.get("accuracy", 0) > model_accuracy:
        model_accuracy = rf["accuracy"]

    return jsonify(wrap_response({
        "totalSales": total_sales,
        "forecastedSales": forecasted_sales,
        "modelAccuracy": model_accuracy,
    }))


@dashboard_bp.route("/api/dashboard-full", methods=["GET"])
def dashboard_full():
    """Single endpoint returning all dashboard data for the user."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)
        dataset = datasets_db.get(email)

    processed = dataset.get("processed") if dataset else None
    averages = compute_dataset_averages(processed)

    # ── No predictions at all → full fallback ──
    if not preds:
        from routes.fallback import build_fallback_forecast_data

        fallback_forecast = build_fallback_forecast_data(processed)
        return jsonify(wrap_response(
            {
                "kpis": {
                    "totalSales": averages["totalSales"],
                    "forecastedSales": averages["forecastedSales"],
                    "modelAccuracy": averages["modelAccuracy"],
                },
                "forecast": {
                    "historical": [],
                    "pastPredictions": [],
                    "futureForecast": fallback_forecast,
                    "horizon": 14,
                    "totalHistorical": 0,
                    "model": "fallback",
                    "accuracy": None,
                },
                "demandDistribution": [],
                "featureImportance": [],
                "insights": [],
                "totalSamples": 0,
            },
            status="fallback",
            message="No predictions available. Showing estimated values.",
        ))

    # ── Compute KPIs ──
    xgb = preds.get("xgboost", {})
    rf = preds.get("randomForest")
    forecast = preds.get("forecast", {})

    # Total Sales
    if processed is not None and not processed.empty and "quantity" in processed.columns:
        total_sales = round(float(processed["quantity"].sum()), 2)
    else:
        total_sales = averages["totalSales"]

    # Forecasted Sales
    future = forecast.get("futureForecast", [])
    if future and is_valid_result(future):
        forecasted_sales = round(sum(f["predicted"] for f in future), 2)
    else:
        forecasted_sales = averages["forecastedSales"]

    # Best Model Accuracy
    model_accuracy = xgb.get("accuracy", 0) or 0
    if rf and (rf.get("accuracy", 0) or 0) > model_accuracy:
        model_accuracy = rf["accuracy"]
    lstm_metrics = preds.get("lstmMetrics")
    if lstm_metrics and (lstm_metrics.get("accuracy", 0) or 0) > model_accuracy:
        model_accuracy = lstm_metrics["accuracy"]
    if model_accuracy == 0:
        model_accuracy = averages["modelAccuracy"]

    # ── Determine response status ──
    status = "success"
    message = ""
    if forecast.get("model") == "fallback":
        status = "fallback"
        message = forecast.get("message", "Using estimated forecast values.")

    result = {
        "kpis": {
            "totalSales": total_sales,
            "forecastedSales": forecasted_sales,
            "modelAccuracy": round(model_accuracy, 2),
        },
        "forecast": forecast,
        "demandDistribution": preds.get("demandDistribution", []),
        "featureImportance": preds.get("featureImportance", []),
        "insights": preds.get("insights", []),
        "totalSamples": preds.get("totalSamples", 0),
        "demandThresholds": preds.get("demandThresholds", {}),
    }

    return jsonify(wrap_response(result, status=status, message=message)), 200


@dashboard_bp.route("/api/top-drugs", methods=["GET"])
def top_drugs():
    """Return top-demand items from the user's actual data."""
    email = _get_email()

    with store_lock:
        dataset = datasets_db.get(email)

    if not dataset or dataset.get("processed") is None:
        return jsonify(wrap_response([], status="fallback", message="No data available"))

    df = dataset["processed"]
    if "category" not in df.columns:
        return jsonify(wrap_response([], status="fallback", message="No category data available"))

    grouped = df.groupby("category").agg(
        totalDemand=("quantity", "sum"),
        avgDemand=("quantity", "mean"),
        records=("quantity", "count"),
    ).sort_values("totalDemand", ascending=False).head(5).reset_index()

    result = []
    for i, row in grouped.iterrows():
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

    return jsonify(wrap_response(result))


@dashboard_bp.route("/api/trend-data", methods=["GET"])
def trend_data():
    """Return actual time-series demand from user's dataset."""
    email = _get_email()

    with store_lock:
        dataset = datasets_db.get(email)

    if not dataset or dataset.get("processed") is None:
        return jsonify(wrap_response([], status="fallback", message="No trend data available"))

    df = dataset["processed"].sort_values("date")
    daily = df.groupby(df["date"].dt.strftime("%Y-%m-%d"))["quantity"].sum().reset_index()
    daily.columns = ["date", "totalDemand"]

    data = daily.tail(30).to_dict(orient="records")
    for d in data:
        d["totalDemand"] = round(float(d["totalDemand"]), 2)

    return jsonify(wrap_response(data))


@dashboard_bp.route("/api/alerts", methods=["GET"])
def alerts():
    """Generate alerts from prediction results."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)

    if not preds:
        return jsonify(wrap_response([], status="fallback", message="No alerts available"))

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

    return jsonify(wrap_response(alerts_list[:8]))
