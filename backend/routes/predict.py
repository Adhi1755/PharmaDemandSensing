"""
ML Prediction and Forecasting routes.
Provides /api/predict (XGBoost classification) and /api/forecast (LSTM time-series).
"""

import logging
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request

from data.store import datasets_db, prediction_db, store_lock, users_db
from model_loader import (
    CLASSIFIER_FEATURES,
    LSTM_FEATURES,
    LSTM_SEQ_LEN,
    get_lstm_model,
    get_rf_model,
    get_xgb_model,
)

logger = logging.getLogger(__name__)

predict_bp = Blueprint("predict", __name__)


def _get_email():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email") or request.args.get("email") or request.form.get("email")
    if not email:
        return None
    return str(email).strip().lower()


def _require_processed_data(email):
    """Return (processed_df, error_response)."""
    if not email:
        return None, (jsonify({"error": "Email is required"}), 400)
    with store_lock:
        user = users_db.get(email)
    if not user:
        return None, (jsonify({"error": "User not found"}), 404)
    with store_lock:
        dataset = datasets_db.get(email)
    if not dataset or dataset.get("processed") is None:
        return None, (jsonify({"error": "No processed data. Upload and process a dataset first."}), 400)
    return dataset["processed"].copy(), None


def _classify_demand(quantity_series):
    """Classify demand into Low/Medium/High based on terciles."""
    q33 = quantity_series.quantile(0.33)
    q66 = quantity_series.quantile(0.66)

    def _classify(val):
        if val <= q33:
            return 0  # Low
        elif val <= q66:
            return 1  # Medium
        else:
            return 2  # High

    return quantity_series.apply(_classify), q33, q66


# ─────────────────────────────────────────────────────────────────
# POST /api/predict — XGBoost + RF classification
# ─────────────────────────────────────────────────────────────────

@predict_bp.route("/api/predict", methods=["POST"])
def predict():
    email = _get_email()
    processed, err = _require_processed_data(email)
    if err:
        return err

    xgb_model = get_xgb_model()
    rf_model = get_rf_model()

    if not xgb_model:
        return jsonify({"error": "XGBoost model not loaded"}), 500

    try:
        # Prepare features
        available = [f for f in CLASSIFIER_FEATURES if f in processed.columns]
        if len(available) < len(CLASSIFIER_FEATURES):
            missing = set(CLASSIFIER_FEATURES) - set(available)
            logger.warning("Missing features for classifier: %s", missing)

        X = processed[available].values

        # Generate demand class labels from actual quantities
        y_true, q33, q66 = _classify_demand(processed["quantity"])
        y_true = y_true.values

        # ── XGBoost predictions ──
        xgb_pred = xgb_model.predict(X)
        xgb_proba = None
        if hasattr(xgb_model, "predict_proba"):
            try:
                xgb_proba = xgb_model.predict_proba(X)
            except Exception:
                pass

        # Classification metrics
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

        xgb_accuracy = round(float(accuracy_score(y_true, xgb_pred)) * 100, 2)
        xgb_precision = round(float(precision_score(y_true, xgb_pred, average="weighted", zero_division=0)) * 100, 2)
        xgb_recall = round(float(recall_score(y_true, xgb_pred, average="weighted", zero_division=0)) * 100, 2)
        xgb_f1 = round(float(f1_score(y_true, xgb_pred, average="weighted", zero_division=0)) * 100, 2)

        # Demand distribution
        label_map = {0: "Low", 1: "Medium", 2: "High"}
        pred_counts = pd.Series(xgb_pred).value_counts().to_dict()
        demand_distribution = [
            {"label": label_map.get(k, str(k)), "count": int(v)}
            for k, v in sorted(pred_counts.items())
        ]

        # Feature importance from XGBoost
        importance = []
        if hasattr(xgb_model, "feature_importances_"):
            imp = xgb_model.feature_importances_
            for feat, val in sorted(zip(available, imp), key=lambda x: -x[1]):
                importance.append({"feature": feat, "importance": round(float(val), 4)})

        # ── Random Forest predictions ──
        rf_result = None
        if rf_model:
            try:
                rf_pred = rf_model.predict(X)
                rf_accuracy = round(float(accuracy_score(y_true, rf_pred)) * 100, 2)
                rf_precision = round(float(precision_score(y_true, rf_pred, average="weighted", zero_division=0)) * 100, 2)
                rf_recall = round(float(recall_score(y_true, rf_pred, average="weighted", zero_division=0)) * 100, 2)
                rf_f1 = round(float(f1_score(y_true, rf_pred, average="weighted", zero_division=0)) * 100, 2)
                rf_result = {
                    "accuracy": rf_accuracy,
                    "precision": rf_precision,
                    "recall": rf_recall,
                    "f1": rf_f1,
                }
            except Exception as e:
                logger.error("Random Forest prediction failed: %s", e)

        # Pharma insights from predictions
        insights = _generate_pharma_insights(processed, xgb_pred, label_map)

        result = {
            "xgboost": {
                "accuracy": xgb_accuracy,
                "precision": xgb_precision,
                "recall": xgb_recall,
                "f1": xgb_f1,
            },
            "randomForest": rf_result,
            "demandDistribution": demand_distribution,
            "featureImportance": importance,
            "insights": insights,
            "totalSamples": int(len(processed)),
            "demandThresholds": {
                "low": round(float(q33), 2),
                "high": round(float(q66), 2),
            },
        }

        # Cache results for dashboard
        with store_lock:
            prediction_db[email] = result

        return jsonify(result), 200

    except Exception as exc:
        logger.exception("Prediction failed")
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


# ─────────────────────────────────────────────────────────────────
# POST /api/forecast — LSTM time-series forecast
# ─────────────────────────────────────────────────────────────────

@predict_bp.route("/api/forecast", methods=["POST"])
def forecast():
    email = _get_email()
    processed, err = _require_processed_data(email)
    if err:
        return err

    lstm_model = get_lstm_model()
    if not lstm_model:
        return jsonify({"error": "LSTM model not loaded"}), 500

    try:
        horizon = int(request.get_json(silent=True).get("horizon", 14) or 14)
        horizon = min(max(horizon, 7), 30)

        available = [f for f in LSTM_FEATURES if f in processed.columns]
        data = processed.sort_values("date")

        # Get historical data for the chart
        hist_dates = data["date"].dt.strftime("%Y-%m-%d").tolist()
        hist_values = data["quantity"].round(2).tolist()
        historical = [
            {"date": d, "actual": float(v)}
            for d, v in zip(hist_dates[-60:], hist_values[-60:])
        ]

        # Prepare sequences for LSTM
        feature_data = data[available].values
        seq_len = LSTM_SEQ_LEN

        if len(feature_data) < seq_len:
            return jsonify({"error": f"Need at least {seq_len} rows for LSTM. Got {len(feature_data)}."}), 400

        # Get the last sequence for iterative forecasting
        last_seq = feature_data[-seq_len:].copy()

        # Scale features (simple min-max for inference)
        fmin = feature_data.min(axis=0)
        fmax = feature_data.max(axis=0)
        frange = fmax - fmin
        frange[frange == 0] = 1  # avoid division by zero

        def scale(arr):
            return (arr - fmin) / frange

        def unscale_qty(val):
            """Approximate unscaling based on quantity statistics."""
            return val

        # Run LSTM on historical data for past predictions
        past_predictions = []
        if len(feature_data) > seq_len:
            sequences = []
            for i in range(seq_len, min(len(feature_data), seq_len + 60)):
                seq = scale(feature_data[i - seq_len:i])
                sequences.append(seq)

            if sequences:
                batch = np.array(sequences)
                preds_raw = lstm_model.predict(batch, verbose=0)
                # Handle different output shapes
                if len(preds_raw.shape) == 2 and preds_raw.shape[1] > 1:
                    # Classification output — take argmax and map to quantity scale
                    pred_classes = np.argmax(preds_raw, axis=1)
                    qty_mean = data["quantity"].mean()
                    qty_std = data["quantity"].std() or 1
                    pred_values = [(float(c) - 1) * qty_std + qty_mean for c in pred_classes]
                elif len(preds_raw.shape) == 2 and preds_raw.shape[1] == 1:
                    pred_values = preds_raw.flatten().tolist()
                else:
                    pred_values = preds_raw.flatten().tolist()

                offset = max(0, len(hist_dates) - 60)
                for i, val in enumerate(pred_values[:60]):
                    idx = i + offset
                    if idx < len(hist_dates):
                        past_predictions.append({
                            "date": hist_dates[idx],
                            "predicted": round(float(val), 2),
                        })

        # Iterative future forecasting
        future_forecast = []
        current_seq = scale(last_seq)
        last_date = data["date"].max()

        for step in range(1, horizon + 1):
            inp = current_seq.reshape(1, seq_len, len(available))
            pred = lstm_model.predict(inp, verbose=0)

            if len(pred.shape) == 2 and pred.shape[1] > 1:
                pred_class = int(np.argmax(pred, axis=1)[0])
                qty_mean = data["quantity"].mean()
                qty_std = data["quantity"].std() or 1
                pred_val = (pred_class - 1) * qty_std + qty_mean
            elif len(pred.shape) == 2 and pred.shape[1] == 1:
                pred_val = float(pred[0][0])
            else:
                pred_val = float(pred.flatten()[0])

            pred_val = max(0, pred_val)
            next_date = last_date + pd.Timedelta(days=step)

            future_forecast.append({
                "date": next_date.strftime("%Y-%m-%d"),
                "predicted": round(pred_val, 2),
            })

            # Shift sequence and append new prediction features
            new_row = current_seq[-1].copy()
            # Update time-varying features
            if "sales_lag_1" in available:
                lag1_idx = available.index("sales_lag_1")
                new_row[lag1_idx] = (pred_val - fmin[lag1_idx]) / frange[lag1_idx]
            if "time_idx" in available:
                tidx = available.index("time_idx")
                new_row[tidx] = min(1.0, current_seq[-1][tidx] + 1.0 / frange[tidx])

            current_seq = np.vstack([current_seq[1:], new_row.reshape(1, -1)])

        result = {
            "historical": historical,
            "pastPredictions": past_predictions,
            "futureForecast": future_forecast,
            "horizon": horizon,
            "totalHistorical": len(hist_values),
        }

        # Cache forecast for dashboard
        with store_lock:
            if email not in prediction_db:
                prediction_db[email] = {}
            prediction_db[email]["forecast"] = result

        return jsonify(result), 200

    except Exception as exc:
        logger.exception("Forecast failed")
        return jsonify({"error": f"Forecast failed: {exc}"}), 500


# ─────────────────────────────────────────────────────────────────
# Pharma insight generation
# ─────────────────────────────────────────────────────────────────

def _generate_pharma_insights(df, predictions, label_map):
    """Generate pharma-relevant insights from prediction results."""
    insights = []

    # Top categories by volume
    if "category" in df.columns:
        top_cats = df.groupby("category")["quantity"].sum().sort_values(ascending=False).head(5)
        for cat, total in top_cats.items():
            insights.append({
                "type": "top_product",
                "title": f"High-Volume: {cat}",
                "message": f"Total demand volume of {int(total):,} units. Consider priority stocking.",
                "severity": "high" if total > top_cats.median() * 1.5 else "medium",
            })

    # Demand trend shifts
    if len(df) > 14:
        recent = df["quantity"].tail(7).mean()
        previous = df["quantity"].iloc[-14:-7].mean()
        if previous > 0:
            change_pct = ((recent - previous) / previous) * 100
            trend = "increasing" if change_pct > 5 else "decreasing" if change_pct < -5 else "stable"
            insights.append({
                "type": "trend",
                "title": f"Demand Trend: {trend.title()}",
                "message": f"7-day average demand changed by {change_pct:+.1f}% compared to previous week.",
                "severity": "high" if abs(change_pct) > 20 else "medium",
            })

    # High-demand alerts from predictions
    high_demand_count = int(sum(1 for p in predictions if p == 2))
    total = len(predictions)
    if total > 0:
        high_pct = (high_demand_count / total) * 100
        insights.append({
            "type": "demand_alert",
            "title": f"High Demand Forecast: {high_pct:.0f}% of predictions",
            "message": f"{high_demand_count} out of {total} samples classified as high demand. "
                       f"Ensure adequate stock levels for these periods.",
            "severity": "critical" if high_pct > 40 else "medium",
        })

    # Weekend vs weekday pattern
    if "is_weekend" in df.columns:
        weekend_avg = df[df["is_weekend"] == 1]["quantity"].mean()
        weekday_avg = df[df["is_weekend"] == 0]["quantity"].mean()
        if weekday_avg > 0:
            ratio = weekend_avg / weekday_avg
            if ratio < 0.7:
                insights.append({
                    "type": "pattern",
                    "title": "Lower Weekend Demand",
                    "message": f"Weekend demand is {(1-ratio)*100:.0f}% lower than weekdays. "
                               f"Consider adjusting weekend staffing and inventory.",
                    "severity": "low",
                })
            elif ratio > 1.3:
                insights.append({
                    "type": "pattern",
                    "title": "Higher Weekend Demand",
                    "message": f"Weekend demand is {(ratio-1)*100:.0f}% higher than weekdays. "
                               f"Ensure extra stock availability on weekends.",
                    "severity": "medium",
                })

    return insights
