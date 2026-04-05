"""
Model Insights routes — returns real feature importance and model metrics.
"""

from flask import Blueprint, jsonify, request

from data.store import prediction_db, store_lock

insights_bp = Blueprint("insights", __name__)


def _get_email():
    return (
        request.args.get("email", "").strip().lower()
        or (request.get_json(silent=True) or {}).get("email", "").strip().lower()
    )


@insights_bp.route("/api/model-metrics", methods=["GET"])
def model_metrics():
    """Return metrics for all models from prediction results."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)

    if not preds:
        return jsonify({"models": []})

    xgb = preds.get("xgboost", {})
    rf = preds.get("randomForest", {})

    models = [
        {
            "name": "XGBoost Classifier",
            "shortName": "XGB",
            "accuracy": xgb.get("accuracy", 0),
            "precision": xgb.get("precision", 0),
            "recall": xgb.get("recall", 0),
            "f1": xgb.get("f1", 0),
            "description": "Gradient-boosted decision trees optimized for classification accuracy "
                           "with built-in feature importance analysis.",
        },
    ]

    if rf:
        models.append({
            "name": "Random Forest Classifier",
            "shortName": "RF",
            "accuracy": rf.get("accuracy", 0),
            "precision": rf.get("precision", 0),
            "recall": rf.get("recall", 0),
            "f1": rf.get("f1", 0),
            "description": "Ensemble method using bagging of decision trees for robust "
                           "classification of demand patterns.",
        })

    models.append({
        "name": "LSTM Neural Network",
        "shortName": "LSTM",
        "accuracy": 0,
        "precision": 0,
        "recall": 0,
        "f1": 0,
        "description": "Long Short-Term Memory recurrent network for sequential "
                       "time-series demand forecasting with temporal attention.",
    })

    return jsonify({"models": models})


@insights_bp.route("/api/feature-importance", methods=["GET"])
def feature_importance():
    """Return XGBoost feature importances."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)

    if not preds:
        return jsonify([])

    return jsonify(preds.get("featureImportance", []))


@insights_bp.route("/api/insights", methods=["GET"])
def ai_insights():
    """Return pharma-specific AI insights."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)

    if not preds:
        return jsonify([])

    return jsonify(preds.get("insights", []))
