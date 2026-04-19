"""
Model Insights routes — returns real feature importance and model metrics.
All responses use the standardised envelope: { status, data, message }.
"""

import logging

import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request

from data.store import datasets_db, prediction_db, store_lock
from model_loader import LSTM_FEATURES, LSTM_SEQ_LEN, get_lstm_model
from routes.fallback import wrap_response

logger = logging.getLogger(__name__)

insights_bp = Blueprint("insights", __name__)


def _get_email():
    return (
        request.args.get("email", "").strip().lower()
        or (request.get_json(silent=True) or {}).get("email", "").strip().lower()
    )


def _classify_demand(quantity_series: pd.Series):
    q33 = quantity_series.quantile(0.33)
    q66 = quantity_series.quantile(0.66)

    def _classify(value: float) -> int:
        if value <= q33:
            return 0
        if value <= q66:
            return 1
        return 2

    return quantity_series.apply(_classify), q33, q66


def _evaluate_lstm_metrics(processed: pd.DataFrame):
    lstm_model = get_lstm_model()
    if lstm_model is None or processed.empty or "quantity" not in processed.columns:
        return None

    data = processed.sort_values("date").copy()
    available = [feature for feature in LSTM_FEATURES if feature in data.columns]
    if len(available) == 0:
        return None

    feature_data = data[available].to_numpy(dtype=float)
    seq_len = LSTM_SEQ_LEN
    if len(feature_data) <= seq_len:
        return None

    quantity_labels, q33, q66 = _classify_demand(data["quantity"].astype(float))

    # Use MinMaxScaler for consistency with predict.py
    from sklearn.preprocessing import MinMaxScaler
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(feature_data)

    sequences = []
    y_true = []
    for idx in range(seq_len, len(feature_data)):
        sequences.append(scaled[idx - seq_len:idx])
        y_true.append(int(quantity_labels.iloc[idx]))

    if not sequences:
        return None

    batch = np.asarray(sequences)
    preds = lstm_model.predict(batch, verbose=0)

    if len(preds.shape) == 1:
        pred_values = preds.reshape(-1)
        y_pred = [0 if value <= q33 else 1 if value <= q66 else 2 for value in pred_values]
    elif len(preds.shape) == 2 and preds.shape[1] > 1:
        y_pred = np.argmax(preds, axis=1).astype(int).tolist()
    else:
        pred_values = preds.reshape(-1)
        y_pred = [0 if value <= q33 else 1 if value <= q66 else 2 for value in pred_values]

    from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)) * 100, 2),
        "precision": round(float(precision_score(y_true, y_pred, average="weighted", zero_division=0)) * 100, 2),
        "recall": round(float(recall_score(y_true, y_pred, average="weighted", zero_division=0)) * 100, 2),
        "f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)) * 100, 2),
    }


@insights_bp.route("/api/model-metrics", methods=["GET"])
def model_metrics():
    """Return metrics for all models from prediction results."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)
        dataset = datasets_db.get(email)

    if not preds:
        return jsonify(wrap_response({"models": []}, status="fallback", message="No model metrics available"))

    xgb = preds.get("xgboost", {})
    rf = preds.get("randomForest", {})

    models = [
        {
            "name": "XGBoost Classifier",
            "shortName": "XGB",
            "train_accuracy": xgb.get("train_accuracy", 0),
            "test_accuracy": xgb.get("test_accuracy", 0),
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
            "train_accuracy": rf.get("train_accuracy", 0),
            "test_accuracy": rf.get("test_accuracy", 0),
            "accuracy": rf.get("accuracy", 0),
            "precision": rf.get("precision", 0),
            "recall": rf.get("recall", 0),
            "f1": rf.get("f1", 0),
            "description": "Ensemble method using bagging of decision trees for robust "
                           "classification of demand patterns.",
        })

    lstm_metrics = preds.get("lstmMetrics")
    if lstm_metrics is None and dataset and dataset.get("processed") is not None:
        try:
            lstm_metrics = _evaluate_lstm_metrics(dataset["processed"])
            if lstm_metrics is not None:
                with store_lock:
                    if email in prediction_db:
                        prediction_db[email]["lstmMetrics"] = lstm_metrics
        except Exception:
            logger.exception("LSTM metric evaluation failed for %s", email)

    models.append({
        "name": "LSTM Neural Network",
        "shortName": "LSTM",
        "accuracy": (lstm_metrics or {}).get("accuracy", 0),
        "precision": (lstm_metrics or {}).get("precision", 0),
        "recall": (lstm_metrics or {}).get("recall", 0),
        "f1": (lstm_metrics or {}).get("f1", 0),
        "description": "Long Short-Term Memory recurrent network for sequential "
                       "time-series demand forecasting with temporal attention.",
    })

    return jsonify(wrap_response({"models": models}))


@insights_bp.route("/api/feature-importance", methods=["GET"])
def feature_importance():
    """Return XGBoost feature importances."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)

    if not preds:
        return jsonify(wrap_response([], status="fallback", message="No feature importance data"))

    return jsonify(wrap_response(preds.get("featureImportance", [])))


@insights_bp.route("/api/insights", methods=["GET"])
def ai_insights():
    """Return pharma-specific AI insights."""
    email = _get_email()

    with store_lock:
        preds = prediction_db.get(email)

    if not preds:
        return jsonify(wrap_response([], status="fallback", message="No insights available"))

    return jsonify(wrap_response(preds.get("insights", [])))
