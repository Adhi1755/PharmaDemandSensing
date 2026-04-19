"""
ML Prediction and Forecasting routes.
Provides /api/predict (XGBoost + RF classification) and /api/forecast (LSTM time-series).

All endpoints return the standardised envelope:
    { "status": "success"|"failed"|"fallback", "data": {...}, "message": "" }
"""

import logging
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request
from sklearn.preprocessing import MinMaxScaler

from data.auth_db import get_user
from data.store import datasets_db, model_state_db, prediction_db, store_lock
from model_loader import (
    CLASSIFIER_FEATURES,
    LSTM_FEATURES,
    LSTM_SEQ_LEN,
    get_lstm_model,
    get_rf_model,
    get_xgb_model,
)
from pipeline.sales_pipeline import predict_and_decode
from routes.fallback import (
    build_fallback_forecast_data,
    compute_dataset_averages,
    is_valid_result,
    wrap_response,
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
        return None, (jsonify(wrap_response(None, status="failed", message="Email is required")), 400)
    user = get_user(email)
    if not user:
        return None, (jsonify(wrap_response(None, status="failed", message="User not found")), 404)
    with store_lock:
        dataset = datasets_db.get(email)
    if not dataset or dataset.get("processed") is None:
        return None, (jsonify(wrap_response(None, status="failed", message="No processed data. Upload and process a dataset first.")), 400)
    return dataset["processed"].copy(), None


def _get_pipeline_state(email):
    with store_lock:
        state = model_state_db.get(email, {}).get("sales_pipeline")
    return state


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


def _build_fallback_forecast(data, horizon):
    """Forecast using a simple trend + rolling baseline when LSTM is unavailable."""
    if data.empty:
        return {
            "historical": [],
            "pastPredictions": [],
            "futureForecast": [],
            "horizon": horizon,
            "totalHistorical": 0,
            "model": "fallback",
            "accuracy": None,
            "message": "No historical data available for fallback forecast.",
        }

    hist_dates = data["date"].dt.strftime("%Y-%m-%d").tolist()
    qty = data["quantity"].astype(float)
    hist_values = qty.round(2).tolist()

    historical = [
        {"date": d, "actual": float(v)}
        for d, v in zip(hist_dates[-60:], hist_values[-60:])
    ]

    rolling7 = qty.rolling(window=7, min_periods=1).mean()
    day_trend = rolling7.diff().tail(14).mean()
    if pd.isna(day_trend):
        day_trend = 0.0

    baseline = float(rolling7.iloc[-1]) if len(rolling7) else float(qty.mean())
    baseline = max(0.0, baseline)

    past_predictions = []
    backcast_vals = rolling7.tail(60).round(2).tolist()
    backcast_dates = hist_dates[-len(backcast_vals):]
    for d, v in zip(backcast_dates, backcast_vals):
        past_predictions.append({"date": d, "predicted": float(v)})

    future_forecast = []
    last_date = data["date"].max()
    current = baseline
    for step in range(1, horizon + 1):
        damp = max(0.2, 1 - (step / (horizon * 1.2)))
        current = max(0.0, current + float(day_trend) * damp)
        next_date = last_date + pd.Timedelta(days=step)
        future_forecast.append({
            "date": next_date.strftime("%Y-%m-%d"),
            "predicted": round(float(current), 2),
        })

    # Compute RMSE-like metric comparing rolling mean to actual
    overlap = min(len(backcast_vals), len(hist_values[-60:]))
    if overlap > 0:
        actual_arr = np.array(hist_values[-overlap:])
        pred_arr = np.array(backcast_vals[-overlap:])
        rmse = float(np.sqrt(np.mean((actual_arr - pred_arr) ** 2)))
    else:
        rmse = None

    return {
        "historical": historical,
        "pastPredictions": past_predictions,
        "futureForecast": future_forecast,
        "horizon": horizon,
        "totalHistorical": len(hist_values),
        "model": "fallback",
        "accuracy": round(rmse, 2) if rmse is not None else None,
        "message": "LSTM unavailable; served fallback time-series forecast.",
    }


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
        return jsonify(wrap_response(None, status="failed", message="XGBoost model not loaded")), 500

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

        # ── Train/Test Split ──
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y_true[:split_idx], y_true[split_idx:]

        # ── XGBoost predictions ──
        xgb_pred_all = xgb_model.predict(X)
        xgb_pred_train = xgb_model.predict(X_train)
        xgb_pred_test = xgb_model.predict(X_test)

        xgb_train_accuracy = round(float(accuracy_score(y_train, xgb_pred_train)) * 100, 2)
        xgb_test_accuracy = round(float(accuracy_score(y_test, xgb_pred_test)) * 100, 2)
        xgb_precision = round(float(precision_score(y_true, xgb_pred_all, average="weighted", zero_division=0)) * 100, 2)
        xgb_recall = round(float(recall_score(y_true, xgb_pred_all, average="weighted", zero_division=0)) * 100, 2)
        xgb_f1 = round(float(f1_score(y_true, xgb_pred_all, average="weighted", zero_division=0)) * 100, 2)

        # Demand distribution
        label_map = {0: "Low", 1: "Medium", 2: "High"}
        pred_counts = pd.Series(xgb_pred_all).value_counts().to_dict()
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
                rf_pred_all = rf_model.predict(X)
                rf_pred_train = rf_model.predict(X_train)
                rf_pred_test = rf_model.predict(X_test)

                rf_result = {
                    "train_accuracy": round(float(accuracy_score(y_train, rf_pred_train)) * 100, 2),
                    "test_accuracy": round(float(accuracy_score(y_test, rf_pred_test)) * 100, 2),
                    "accuracy": round(float(accuracy_score(y_true, rf_pred_all)) * 100, 2),
                    "precision": round(float(precision_score(y_true, rf_pred_all, average="weighted", zero_division=0)) * 100, 2),
                    "recall": round(float(recall_score(y_true, rf_pred_all, average="weighted", zero_division=0)) * 100, 2),
                    "f1": round(float(f1_score(y_true, rf_pred_all, average="weighted", zero_division=0)) * 100, 2),
                }
            except Exception as e:
                logger.error("Random Forest prediction failed: %s", e)

        # Pharma insights from predictions
        insights = _generate_pharma_insights(processed, xgb_pred_all, label_map)

        result = {
            "xgboost": {
                "train_accuracy": xgb_train_accuracy,
                "test_accuracy": xgb_test_accuracy,
                "accuracy": round(float(accuracy_score(y_true, xgb_pred_all)) * 100, 2),
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

        return jsonify(wrap_response(result, message="Predictions generated successfully")), 200

    except Exception as exc:
        logger.exception("Prediction failed")
        # Attempt fallback
        try:
            averages = compute_dataset_averages(processed)
            return jsonify(wrap_response(averages, status="fallback", message=f"Prediction failed: {exc}")), 200
        except Exception:
            return jsonify(wrap_response(None, status="failed", message=f"Prediction failed: {exc}")), 500


@predict_bp.route("/api/predict-sales", methods=["POST"])
def predict_sales():
    """Return decoded sales predictions from the trained per-user sales pipeline."""
    email = _get_email()
    if not email:
        return jsonify(wrap_response(None, status="failed", message="Email is required")), 400

    user = get_user(email)
    if not user:
        return jsonify(wrap_response(None, status="failed", message="User not found")), 404

    pipeline_state = _get_pipeline_state(email)
    if not pipeline_state:
        return jsonify(wrap_response(None, status="failed", message="No trained sales pipeline found. Upload a raw monthly sales file first.")), 400

    with store_lock:
        dataset = datasets_db.get(email)

    if not dataset or dataset.get("processed") is None:
        return jsonify(wrap_response(None, status="failed", message="No processed data available for sales prediction.")), 400

    payload = request.get_json(silent=True) or {}
    model_name = str(payload.get("model", "xgboost")).strip().lower()
    limit = int(payload.get("limit", 200) or 200)
    limit = max(1, min(limit, 1000))

    if model_name not in {"xgboost", "random_forest"}:
        return jsonify(wrap_response(None, status="failed", message="Model must be one of: xgboost, random_forest")), 400

    model = pipeline_state["xgb_model"] if model_name == "xgboost" else pipeline_state["rf_model"]
    if model is None:
        return jsonify(wrap_response(None, status="failed", message=f"Requested model '{model_name}' is unavailable.")), 400

    try:
        decoded = predict_and_decode(
            model=model,
            processed_df=dataset["processed"],
            feature_columns=pipeline_state["feature_columns"],
            encoders={
                "medicine": pipeline_state["medicine_encoder"],
                "category": pipeline_state["category_encoder"],
            },
        )
        decoded = decoded.copy()
        decoded["date"] = decoded["date"].dt.strftime("%Y-%m-%d")

        records = decoded.head(limit).to_dict(orient="records")
        result = {
            "model": model_name,
            "rows": int(len(decoded)),
            "metrics": pipeline_state.get("metrics", {}).get(model_name, {}),
            "featureColumns": pipeline_state["feature_columns"],
            "predictions": records,
        }

        with store_lock:
            prediction_db[email] = prediction_db.get(email, {})
            prediction_db[email]["salesRegression"] = result

        return jsonify(wrap_response(result, message="Sales predictions generated")), 200

    except Exception as exc:
        logger.exception("Decoded sales prediction failed")
        return jsonify(wrap_response(None, status="failed", message=f"Decoded sales prediction failed: {exc}")), 500


# ─────────────────────────────────────────────────────────────────
# POST /api/forecast — LSTM time-series forecast
# ─────────────────────────────────────────────────────────────────

@predict_bp.route("/api/forecast", methods=["POST"])
def forecast():
    email = _get_email()
    processed, err = _require_processed_data(email)
    if err:
        return err

    try:
        payload = request.get_json(silent=True) or {}
        horizon = int(payload.get("horizon", 14) or 14)
        horizon = min(max(horizon, 7), 30)

        available = [f for f in LSTM_FEATURES if f in processed.columns]
        data = processed.sort_values("date")

        lstm_model = get_lstm_model()
        if not lstm_model:
            result = _build_fallback_forecast(data, horizon)
            with store_lock:
                if email not in prediction_db:
                    prediction_db[email] = {}
                prediction_db[email]["forecast"] = result
            return jsonify(wrap_response(result, status="fallback", message="LSTM model not available, using fallback forecast")), 200

        # Get historical data for the chart
        hist_dates = data["date"].dt.strftime("%Y-%m-%d").tolist()
        hist_values = data["quantity"].round(2).tolist()
        historical = [
            {"date": d, "actual": float(v)}
            for d, v in zip(hist_dates[-60:], hist_values[-60:])
        ]

        # Prepare sequences for LSTM with proper MinMaxScaler
        feature_data = data[available].values.astype(float)
        seq_len = LSTM_SEQ_LEN

        if len(feature_data) < seq_len:
            result = _build_fallback_forecast(data, horizon)
            with store_lock:
                if email not in prediction_db:
                    prediction_db[email] = {}
                prediction_db[email]["forecast"] = result
            return jsonify(wrap_response(result, status="fallback", message=f"Need at least {seq_len} rows for LSTM. Got {len(feature_data)}. Using fallback.")), 200

        # ── MinMaxScaler normalization ──
        scaler = MinMaxScaler()
        scaled_features = scaler.fit_transform(feature_data)

        # Quantity scaler for inverse transform on predictions
        qty_values = data["quantity"].values.astype(float).reshape(-1, 1)
        qty_scaler = MinMaxScaler()
        qty_scaler.fit_transform(qty_values)

        # Run LSTM on historical data for past predictions
        past_predictions = []
        if len(scaled_features) > seq_len:
            sequences = []
            for i in range(seq_len, min(len(scaled_features), seq_len + 60)):
                seq = scaled_features[i - seq_len:i]
                sequences.append(seq)

            if sequences:
                batch = np.array(sequences)
                preds_raw = lstm_model.predict(batch, verbose=0)

                # Handle different output shapes
                if len(preds_raw.shape) == 2 and preds_raw.shape[1] > 1:
                    # Classification output — map to quantity scale
                    pred_classes = np.argmax(preds_raw, axis=1)
                    qty_mean = data["quantity"].mean()
                    qty_std = data["quantity"].std() or 1
                    pred_values = [(float(c) - 1) * qty_std + qty_mean for c in pred_classes]
                elif len(preds_raw.shape) == 2 and preds_raw.shape[1] == 1:
                    # Regression output — inverse scale
                    pred_scaled = preds_raw.flatten().reshape(-1, 1)
                    pred_values = qty_scaler.inverse_transform(pred_scaled).flatten().tolist()
                else:
                    pred_values = preds_raw.flatten().tolist()

                offset = max(0, len(hist_dates) - 60)
                for i, val in enumerate(pred_values[:60]):
                    idx = i + offset
                    if idx < len(hist_dates):
                        past_predictions.append({
                            "date": hist_dates[idx],
                            "predicted": round(max(0, float(val)), 2),
                        })

        # ── Compute accuracy (RMSE) on past predictions ──
        accuracy_rmse = None
        if past_predictions and historical:
            actual_map = {h["date"]: h["actual"] for h in historical}
            matched_actual = []
            matched_pred = []
            for pp in past_predictions:
                if pp["date"] in actual_map:
                    matched_actual.append(actual_map[pp["date"]])
                    matched_pred.append(pp["predicted"])
            if matched_actual:
                accuracy_rmse = round(float(np.sqrt(np.mean(
                    (np.array(matched_actual) - np.array(matched_pred)) ** 2
                ))), 2)

        # Iterative future forecasting
        future_forecast = []
        last_seq = scaled_features[-seq_len:].copy()
        current_seq = last_seq
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
                pred_scaled = pred[0].reshape(-1, 1)
                pred_val = float(qty_scaler.inverse_transform(pred_scaled)[0][0])
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
            if "sales_lag_1" in available:
                lag1_idx = available.index("sales_lag_1")
                raw_val = pred_val
                # Scale to 0-1 range using qty_scaler
                scaled_val = qty_scaler.transform([[raw_val]])[0][0]
                new_row[lag1_idx] = scaled_val
            if "time_idx" in available:
                tidx = available.index("time_idx")
                new_row[tidx] = min(1.0, current_seq[-1][tidx] + 1.0 / max(len(feature_data), 1))

            current_seq = np.vstack([current_seq[1:], new_row.reshape(1, -1)])

        result = {
            "historical": historical,
            "pastPredictions": past_predictions,
            "futureForecast": future_forecast,
            "horizon": horizon,
            "totalHistorical": len(hist_values),
            "model": "lstm",
            "accuracy": accuracy_rmse,
        }

        # Validate result — if forecast is empty or all zeros use fallback
        if not is_valid_result(future_forecast):
            result = _build_fallback_forecast(data, horizon)
            with store_lock:
                if email not in prediction_db:
                    prediction_db[email] = {}
                prediction_db[email]["forecast"] = result
            return jsonify(wrap_response(result, status="fallback", message="LSTM returned empty forecast, using fallback")), 200

        # Cache forecast for dashboard
        with store_lock:
            if email not in prediction_db:
                prediction_db[email] = {}
            prediction_db[email]["forecast"] = result

        return jsonify(wrap_response(result, message="LSTM forecast generated successfully")), 200

    except Exception as exc:
        logger.exception("Forecast failed, serving fallback")
        try:
            safe_data = processed.sort_values("date")
            fallback = _build_fallback_forecast(safe_data, 14)
            with store_lock:
                if email not in prediction_db:
                    prediction_db[email] = {}
                prediction_db[email]["forecast"] = fallback
            return jsonify(wrap_response(fallback, status="fallback", message=f"LSTM failed: {exc}. Serving fallback.")), 200
        except Exception:
            logger.exception("Fallback forecast failed")
            return jsonify(wrap_response(
                {"forecast": None, "accuracy": None},
                status="failed",
                message=f"Forecast failed: {exc}",
            )), 500


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
