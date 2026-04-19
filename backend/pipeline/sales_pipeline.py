"""End-to-end sales training pipeline with decoded medicine outputs."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBRegressor


REQUIRED_COLUMNS = ["medicine_name", "date", "sales"]
OPTIONAL_COLUMNS = ["category"]


@dataclass
class PipelineArtifacts:
    rf_model: RandomForestRegressor
    xgb_model: XGBRegressor
    medicine_encoder: LabelEncoder
    category_encoder: LabelEncoder
    scaler: StandardScaler
    feature_columns: list[str]
    metrics: dict[str, dict[str, float]]
    artifact_paths: dict[str, str]


def load_data(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    work = _normalize_columns(df)
    work = work.dropna(subset=REQUIRED_COLUMNS).copy()
    work["medicine_name"] = work["medicine_name"].astype(str).str.strip()
    work["category"] = work["category"].fillna("Unknown").astype(str).str.strip()
    work["date"] = pd.to_datetime(work["date"], errors="coerce")
    work["sales"] = pd.to_numeric(work["sales"], errors="coerce")
    work = work.dropna(subset=["medicine_name", "date", "sales"])
    work = work.sort_values(by=["medicine_name", "date"]).reset_index(drop=True)
    return work


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    work = df.copy()
    work["month"] = work["date"].dt.month
    work["year"] = work["date"].dt.year
    work["day_of_week"] = work["date"].dt.dayofweek
    work["week_of_year"] = work["date"].dt.isocalendar().week.astype(int)
    work["day_of_year"] = work["date"].dt.dayofyear
    work["is_weekend"] = (work["day_of_week"] >= 5).astype(int)
    work["time_idx"] = work.groupby("medicine_name").cumcount()

    grouped = work.groupby("medicine_name", group_keys=False)
    work["lag_1"] = grouped["sales"].shift(1)
    work["lag_2"] = grouped["sales"].shift(2)
    work["sales_lag_1"] = work["lag_1"]
    work["sales_lag_7"] = grouped["sales"].shift(7)

    work["rolling_mean_3"] = grouped["sales"].transform(
        lambda series: series.shift(1).rolling(window=3, min_periods=1).mean()
    )
    work["rolling_mean_7"] = grouped["sales"].transform(
        lambda series: series.shift(1).rolling(window=7, min_periods=1).mean()
    )

    work["month_sin"] = np.sin(2 * np.pi * work["month"] / 12)
    work["month_cos"] = np.cos(2 * np.pi * work["month"] / 12)

    work = work.dropna(subset=["lag_1", "lag_2", "rolling_mean_3"]).reset_index(drop=True)
    return work


def encode_features(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, LabelEncoder]]:
    work = df.copy()

    medicine_le = LabelEncoder()
    work["medicine_encoded"] = np.asarray(
        medicine_le.fit_transform(work["medicine_name"])
    ).astype(int)

    category_le = LabelEncoder()
    work["category_encoded"] = np.asarray(
        category_le.fit_transform(work["category"])
    ).astype(int)

    return work, {"medicine": medicine_le, "category": category_le}


def scale_features(df: pd.DataFrame, feature_cols: list[str]) -> tuple[pd.DataFrame, StandardScaler]:
    work = df.copy()
    scaler = StandardScaler()
    work[feature_cols] = scaler.fit_transform(work[feature_cols])
    return work, scaler


def train_models(df: pd.DataFrame, feature_columns: list[str]) -> tuple[RandomForestRegressor, XGBRegressor, dict[str, dict[str, float]]]:
    X = df[feature_columns]
    y = df["sales"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    rf_model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
        min_samples_leaf=2,
    )
    rf_model.fit(X_train, y_train)

    xgb_model = XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        objective="reg:squarederror",
        n_jobs=4,
    )
    xgb_model.fit(X_train, y_train)

    metrics = {
        "random_forest": _regression_metrics(y_test, rf_model.predict(X_test)),
        "xgboost": _regression_metrics(y_test, xgb_model.predict(X_test)),
    }

    return rf_model, xgb_model, metrics


def predict_and_decode(
    model: RandomForestRegressor | XGBRegressor,
    df: pd.DataFrame,
    feature_columns: list[str],
    encoders: dict[str, LabelEncoder],
) -> pd.DataFrame:
    work = df.copy()
    predictions = model.predict(work[feature_columns])
    work["predicted_sales"] = np.maximum(0, predictions).round(2)

    work["medicine_name"] = encoders["medicine"].inverse_transform(
        work["medicine_encoded"].astype(int)
    )

    return work[["medicine_name", "date", "category", "sales", "predicted_sales"]]


def run_training_pipeline(
    raw_df: pd.DataFrame,
    user_email: str,
    artifact_root: str,
) -> tuple[pd.DataFrame, PipelineArtifacts, pd.DataFrame]:
    cleaned = clean_data(raw_df)
    engineered = feature_engineering(cleaned)

    encoded, encoders = encode_features(engineered)

    numeric_to_scale = ["lag_1", "lag_2", "rolling_mean_3", "sales_lag_1", "sales_lag_7", "rolling_mean_7"]
    scaled, scaler = scale_features(encoded, numeric_to_scale)

    feature_columns = [
        "medicine_encoded",
        "category_encoded",
        "month",
        "year",
        "day_of_week",
        "week_of_year",
        "day_of_year",
        "is_weekend",
        "time_idx",
        "month_sin",
        "month_cos",
        "lag_1",
        "lag_2",
        "rolling_mean_3",
        "sales_lag_1",
        "sales_lag_7",
        "rolling_mean_7",
    ]

    rf_model, xgb_model, metrics = train_models(scaled, feature_columns)

    artifact_paths = _persist_artifacts(
        user_email=user_email,
        artifact_root=artifact_root,
        rf_model=rf_model,
        xgb_model=xgb_model,
        scaler=scaler,
        medicine_encoder=encoders["medicine"],
        category_encoder=encoders["category"],
        feature_columns=feature_columns,
    )

    artifacts = PipelineArtifacts(
        rf_model=rf_model,
        xgb_model=xgb_model,
        medicine_encoder=encoders["medicine"],
        category_encoder=encoders["category"],
        scaler=scaler,
        feature_columns=feature_columns,
        metrics=metrics,
        artifact_paths=artifact_paths,
    )

    decoded_predictions = predict_and_decode(
        model=rf_model,
        df=scaled,
        feature_columns=feature_columns,
        encoders=encoders,
    )

    return scaled, artifacts, decoded_predictions


def _persist_artifacts(
    user_email: str,
    artifact_root: str,
    rf_model: RandomForestRegressor,
    xgb_model: XGBRegressor,
    scaler: StandardScaler,
    medicine_encoder: LabelEncoder,
    category_encoder: LabelEncoder,
    feature_columns: list[str],
) -> dict[str, str]:
    safe_email = re.sub(r"[^a-zA-Z0-9_-]", "_", user_email)
    user_dir = os.path.join(artifact_root, safe_email)
    os.makedirs(user_dir, exist_ok=True)

    paths = {
        "rf_model": os.path.join(user_dir, "rf_model.joblib"),
        "xgb_model": os.path.join(user_dir, "xgb_model.joblib"),
        "scaler": os.path.join(user_dir, "feature_scaler.joblib"),
        "medicine_encoder": os.path.join(user_dir, "medicine_encoder.joblib"),
        "category_encoder": os.path.join(user_dir, "category_encoder.joblib"),
        "meta": os.path.join(user_dir, "meta.joblib"),
    }

    joblib.dump(rf_model, paths["rf_model"])
    joblib.dump(xgb_model, paths["xgb_model"])
    joblib.dump(scaler, paths["scaler"])
    joblib.dump(medicine_encoder, paths["medicine_encoder"])
    joblib.dump(category_encoder, paths["category_encoder"])
    joblib.dump({"feature_columns": feature_columns}, paths["meta"])

    return paths


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    work = df.copy()
    lowered = {column.lower().strip(): column for column in work.columns}

    medicine_col = lowered.get("medicine_name") or lowered.get("medicine")
    date_col = lowered.get("date")
    sales_col = lowered.get("sales") or lowered.get("quantity")
    category_col = lowered.get("category")

    missing = []
    if medicine_col is None:
        missing.append("medicine_name")
    if date_col is None:
        missing.append("date")
    if sales_col is None:
        missing.append("sales")

    if missing:
        raise ValueError(f"Dataset is missing required columns: {', '.join(missing)}")

    rename_map = {
        medicine_col: "medicine_name",
        date_col: "date",
        sales_col: "sales",
    }
    if category_col:
        rename_map[category_col] = "category"

    work = work.rename(columns=rename_map)
    if "category" not in work.columns:
        work["category"] = "General"

    return work


def _regression_metrics(y_true: Any, y_pred: Any) -> dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "r2": round(r2, 4),
    }
