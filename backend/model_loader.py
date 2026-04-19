"""
Singleton model loader for PharmaSense AI.
Loads XGBoost, Random Forest, and LSTM models once at startup and caches them.
"""

import os
import logging
import sys

logger = logging.getLogger(__name__)

_models = {}
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_BASE_DIR, "models")

# Feature columns the models were trained on
CLASSIFIER_FEATURES = [
    "time_idx", "day_of_week", "month", "month_sin", "month_cos",
    "sales_lag_1", "sales_lag_7", "rolling_mean_7",
    "day_of_year", "week_of_year", "is_weekend", "category_encoded",
]

LSTM_FEATURES = [
    "time_idx", "day_of_week", "month", "month_sin", "month_cos",
    "sales_lag_1", "sales_lag_7", "rolling_mean_7",
    "day_of_year", "week_of_year", "is_weekend", "category_encoded",
]

# LSTM sequence length (will be auto-detected from model, fallback = 10)
LSTM_SEQ_LEN = 10


def _load_all():
    """Load all three models from disk."""
    import joblib

    # --- XGBoost ---
    xgb_path = os.path.join(_MODELS_DIR, "xgboost_classifier.joblib")
    if os.path.exists(xgb_path):
        _models["xgboost"] = joblib.load(xgb_path)
        logger.info("XGBoost classifier loaded from %s", xgb_path)
    else:
        logger.warning("XGBoost model not found at %s", xgb_path)

    # --- Random Forest ---
    rf_path = os.path.join(_MODELS_DIR, "random_forest_classifier.joblib")
    if os.path.exists(rf_path):
        _models["random_forest"] = joblib.load(rf_path)
        logger.info("Random Forest classifier loaded from %s", rf_path)
    else:
        logger.warning("Random Forest model not found at %s", rf_path)

    # --- LSTM ---
    lstm_path = os.path.join(_MODELS_DIR, "lstm_classifier.h5")
    if os.path.exists(lstm_path):
        try:
            os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
            import tensorflow as tf
            tf.get_logger().setLevel("ERROR")
            _models["lstm"] = tf.keras.models.load_model(lstm_path, compile=False)
            # Auto-detect sequence length from model input shape
            inp_shape = _models["lstm"].input_shape
            if inp_shape and len(inp_shape) == 3:
                global LSTM_SEQ_LEN
                LSTM_SEQ_LEN = inp_shape[1] if inp_shape[1] is not None else 10
            logger.info("LSTM classifier loaded from %s (seq_len=%d)", lstm_path, LSTM_SEQ_LEN)
        except ModuleNotFoundError:
            logger.error(
                "TensorFlow not installed for Python %s. LSTM disabled; forecast route will use fallback.",
                sys.version.split()[0],
            )
        except Exception as e:
            logger.error("Failed to load LSTM model: %s. Forecast route will use fallback.", e)
    else:
        logger.warning("LSTM model not found at %s", lstm_path)


def get_xgb_model():
    if "xgboost" not in _models:
        _load_all()
    return _models.get("xgboost")


def get_rf_model():
    if "random_forest" not in _models:
        _load_all()
    return _models.get("random_forest")


def get_lstm_model():
    if "lstm" not in _models:
        _load_all()
    return _models.get("lstm")


def get_all_models():
    if not _models:
        _load_all()
    return _models


def ensure_loaded():
    """Pre-load all models. Call at app startup."""
    if not _models:
        _load_all()
    return {name: model is not None for name, model in _models.items()}
