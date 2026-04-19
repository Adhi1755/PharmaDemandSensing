import os
import io
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request
from sklearn.preprocessing import LabelEncoder

from data.auth_db import get_user, mark_user_uploaded, update_user_details
from data.store import datasets_db, model_state_db, store_lock
from pipeline.sales_pipeline import run_training_pipeline

onboarding_bp = Blueprint("onboarding", __name__)

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

# The exact feature columns used during model training
MODEL_FEATURES = [
    "time_idx", "day_of_week", "month", "month_sin", "month_cos",
    "sales_lag_1", "sales_lag_7", "rolling_mean_7",
    "day_of_year", "week_of_year", "is_weekend", "category_encoded",
]


def _get_email_from_request():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email") or request.args.get("email") or request.form.get("email")
    if not email:
        return None
    return str(email).strip().lower()


def _require_user(email):
    if not email:
        return None, (jsonify({"error": "Email is required"}), 400)
    user = get_user(email)
    if not user:
        return None, (jsonify({"error": "User not found"}), 404)
    return user, None


def _allowed_file(filename):
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS


def _read_uploaded_file(file_storage):
    filename = file_storage.filename or ""
    extension = filename.rsplit(".", 1)[1].lower()
    if extension == "csv":
        return pd.read_csv(file_storage)
    content = file_storage.read()
    file_storage.stream.seek(0)
    return pd.read_excel(io.BytesIO(content))


def _artifact_root_path() -> str:
    return os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "models", "user_artifacts")
    )


def _preprocess_dataframe(df, columns):
    """
    Full preprocessing pipeline that matches the model training feature set exactly.
    Steps:
      1. Convert date to datetime and sort
      2. Generate time features
      3. Create lag features
      4. Create rolling features
      5. Add growth_rate
      6. Encode category with LabelEncoder
      7. Cyclical encoding for month
      8. Drop NaN rows
      9. Ensure final columns match MODEL_FEATURES
    """
    date_col = columns["dateColumn"]
    sales_col = columns["salesColumn"]
    drug_col = columns["drugColumn"]

    work = df.copy()

    # Validate required columns exist
    for col in [date_col, sales_col, drug_col]:
        if col not in work.columns:
            raise ValueError(f"Column '{col}' was not found in uploaded dataset")

    # Step 1: Convert date and sort
    work[date_col] = pd.to_datetime(work[date_col], errors="coerce")
    work[sales_col] = pd.to_numeric(work[sales_col], errors="coerce")
    work = work.dropna(subset=[date_col, sales_col])
    work = work.sort_values(date_col).reset_index(drop=True)

    # Rename to standard names for consistency
    work = work.rename(columns={date_col: "date", sales_col: "quantity", drug_col: "category"})
    work["category"] = work["category"].astype(str).str.strip()

    # Step 2: Time features
    work["day_of_week"] = work["date"].dt.dayofweek
    work["month"] = work["date"].dt.month
    work["week_of_year"] = work["date"].dt.isocalendar().week.astype(int)
    work["day_of_year"] = work["date"].dt.dayofyear
    work["is_weekend"] = (work["day_of_week"] >= 5).astype(int)
    work["time_idx"] = np.arange(len(work))

    # Step 3: Lag features
    work["sales_lag_1"] = work["quantity"].shift(1)
    work["sales_lag_7"] = work["quantity"].shift(7)
    work["sales_lag_14"] = work["quantity"].shift(14)

    # Step 4: Rolling features
    work["rolling_mean_7"] = work["quantity"].rolling(window=7).mean()
    work["rolling_mean_14"] = work["quantity"].rolling(window=14).mean()
    work["rolling_std_7"] = work["quantity"].rolling(window=7).std()

    # Step 5: Growth rate
    work["growth_rate"] = work["quantity"].pct_change().replace([np.inf, -np.inf], 0)

    # Step 6: Encode category with LabelEncoder
    le = LabelEncoder()
    work["category_encoded"] = le.fit_transform(work["category"])

    # Step 7: Cyclical encoding for month
    work["month_sin"] = np.sin(2 * np.pi * work["month"] / 12)
    work["month_cos"] = np.cos(2 * np.pi * work["month"] / 12)

    # Step 8: Drop NaN rows (from lags and rolling)
    work = work.dropna().reset_index(drop=True)

    # Re-index time_idx after dropping rows
    work["time_idx"] = np.arange(len(work))

    return work, le


# ─────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────

@onboarding_bp.route("/api/user-details", methods=["POST"])
def save_user_details():
    payload = request.get_json() or {}
    email = str(payload.get("email", "")).strip().lower()

    _, error = _require_user(email)
    if error:
        return error

    full_name = str(payload.get("fullName", "")).strip()
    company_name = str(payload.get("companyName", "")).strip()
    city = str(payload.get("city", "")).strip()
    state = str(payload.get("state", "")).strip()
    pharmacy_type = str(payload.get("pharmacyType", "")).strip()

    if not full_name or not company_name or not city or not state:
        return jsonify({"error": "Full name, company, city, and state are required"}), 400

    update_user_details(
        email,
        full_name=full_name,
        company_name=company_name,
        city=city,
        state=state,
        pharmacy_type=pharmacy_type,
    )

    return jsonify({"message": "User details saved"}), 200


@onboarding_bp.route("/api/upload-dataset", methods=["POST"])
def upload_dataset():
    email = _get_email_from_request()
    _, error = _require_user(email)
    if error:
        return error
    email = str(email)

    if "file" not in request.files:
        return jsonify({"error": "Dataset file is required"}), 400

    file = request.files["file"]
    filename = file.filename or ""

    if not _allowed_file(filename):
        return jsonify({"error": "Only CSV and Excel files are supported"}), 400

    try:
        df = _read_uploaded_file(file)
    except Exception as exc:
        return jsonify({"error": f"Unable to read dataset: {exc}"}), 400

    if df.empty:
        return jsonify({"error": "Uploaded dataset is empty"}), 400

    preview = df.head(5).fillna("").to_dict(orient="records")
    columns = [str(col) for col in df.columns]

    pipeline_payload = {
        "trained": False,
        "metrics": {},
        "featureColumns": [],
        "predictions": [],
        "error": None,
    }

    try:
        processed_df, artifacts, decoded_predictions = run_training_pipeline(
            raw_df=df,
            user_email=email,
            artifact_root=_artifact_root_path(),
        )

        pipeline_processed = processed_df.copy()
        pipeline_processed["quantity"] = pipeline_processed["sales"].astype(float)
        pipeline_processed["category"] = pipeline_processed["medicine_name"].astype(str)

        prediction_records = decoded_predictions.copy()
        prediction_records["date"] = prediction_records["date"].dt.strftime("%Y-%m-%d")

        with store_lock:
            model_state_db[email] = model_state_db.get(email, {})
            model_state_db[email]["sales_pipeline"] = {
                "rf_model": artifacts.rf_model,
                "xgb_model": artifacts.xgb_model,
                "medicine_encoder": artifacts.medicine_encoder,
                "category_encoder": artifacts.category_encoder,
                "scaler": artifacts.scaler,
                "feature_columns": artifacts.feature_columns,
                "metrics": artifacts.metrics,
                "artifact_paths": artifacts.artifact_paths,
            }

            datasets_db[email] = {
                "raw": df,
                "preview": preview,
                "columns": columns,
                "processed": pipeline_processed,
                "label_encoder": artifacts.medicine_encoder,
                "selected_columns": {
                    "dateColumn": "date",
                    "salesColumn": "sales",
                    "drugColumn": "medicine_name",
                    "locationColumn": None,
                },
                "pipeline_ready": True,
                "pipeline_metrics": artifacts.metrics,
            }

        mark_user_uploaded(email)
        pipeline_payload = {
            "trained": True,
            "metrics": artifacts.metrics,
            "featureColumns": artifacts.feature_columns,
            "predictions": prediction_records.head(200).to_dict(orient="records"),
            "error": None,
        }

    except Exception as exc:
        with store_lock:
            datasets_db[email] = {
                "raw": df,
                "preview": preview,
                "columns": columns,
                "processed": None,
                "label_encoder": None,
                "selected_columns": None,
                "pipeline_ready": False,
            }
        pipeline_payload["error"] = str(exc)

    return jsonify({
        "message": "Dataset uploaded",
        "fileName": filename,
        "rows": int(len(df)),
        "columns": columns,
        "preview": preview,
        "pipeline": pipeline_payload,
    }), 200


@onboarding_bp.route("/api/preview-data", methods=["GET"])
def preview_data():
    email = _get_email_from_request()
    _, error = _require_user(email)
    if error:
        return error

    with store_lock:
        dataset = datasets_db.get(email)

    if not dataset:
        return jsonify({"error": "No dataset uploaded for this user"}), 404

    return jsonify({"preview": dataset["preview"], "columns": dataset["columns"]}), 200


@onboarding_bp.route("/api/process-data", methods=["POST"])
def process_data():
    payload = request.get_json() or {}
    email = str(payload.get("email", "")).strip().lower()

    _, error = _require_user(email)
    if error:
        return error

    with store_lock:
        dataset = datasets_db.get(email)

    if not dataset:
        return jsonify({"error": "Upload a dataset before processing"}), 400

    date_col = payload.get("dateColumn")
    sales_col = payload.get("salesColumn")
    drug_col = payload.get("drugColumn")
    location_col = payload.get("locationColumn")

    if not date_col or not sales_col or not drug_col:
        return jsonify({"error": "Date, sales, and drug columns are required"}), 400

    required_columns = [date_col, sales_col, drug_col]
    if len(set(required_columns)) != 3:
        return jsonify({"error": "Date, sales, and drug columns must be different"}), 400

    try:
        processed, label_encoder = _preprocess_dataframe(
            dataset["raw"],
            {
                "dateColumn": date_col,
                "salesColumn": sales_col,
                "drugColumn": drug_col,
            },
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Unable to process dataset: {exc}"}), 400

    if len(processed) < 10:
        return jsonify({"error": "Not enough valid rows after preprocessing. Need at least 10."}), 400

    with store_lock:
        datasets_db[email]["processed"] = processed
        datasets_db[email]["label_encoder"] = label_encoder
        datasets_db[email]["selected_columns"] = {
            "dateColumn": date_col,
            "salesColumn": sales_col,
            "drugColumn": drug_col,
            "locationColumn": location_col,
        }
        # Mark user as onboarded
        mark_user_uploaded(email)

    return jsonify({
        "message": "Data successfully prepared",
        "processedRows": int(len(processed)),
        "featureColumns": MODEL_FEATURES,
    }), 200
