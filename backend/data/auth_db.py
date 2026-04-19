"""SQLite-backed user authentication and profile store."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from threading import Lock
from typing import Any

DB_PATH = os.environ.get(
    "PHARMASENS_SQLITE_PATH",
    os.path.join(os.path.dirname(__file__), "pharmasens.sqlite3"),
)

db_lock = Lock()
_initialized = False
_PBKDF2_ITERATIONS = 210000


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        _PBKDF2_ITERATIONS,
    )
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def _verify_password(stored_hash: str, password: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(derived.hex(), digest_hex)
    except Exception:
        return False


def _ensure_directory() -> None:
    directory = os.path.dirname(DB_PATH)
    if directory:
        os.makedirs(directory, exist_ok=True)


def _has_users_table(connection: sqlite3.Connection) -> bool:
    row = connection.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).fetchone()
    return row is not None


def init_auth_db() -> None:
    global _initialized
    _ensure_directory()
    with db_lock:
        with _connect() as connection:
            if _initialized and _has_users_table(connection):
                return
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    is_new_user INTEGER NOT NULL DEFAULT 1,
                    has_uploaded_data INTEGER NOT NULL DEFAULT 0,
                    profile_json TEXT,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            connection.commit()

    _initialized = True


def _row_to_user(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None

    profile = None
    if row["profile_json"]:
        try:
            profile = json.loads(row["profile_json"])
        except json.JSONDecodeError:
            profile = None

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "isNewUser": bool(row["is_new_user"]),
        "hasUploadedData": bool(row["has_uploaded_data"]),
        "profile": profile,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def get_user(email: str) -> dict[str, Any] | None:
    init_auth_db()
    normalized_email = str(email).strip().lower()
    if not normalized_email:
        return None

    with db_lock:
        with _connect() as connection:
            row = connection.execute(
                "SELECT * FROM users WHERE email = ?",
                (normalized_email,),
            ).fetchone()

    return _row_to_user(row)


def create_user(name: str, email: str, password: str) -> dict[str, Any]:
    init_auth_db()
    normalized_name = str(name).strip()
    normalized_email = str(email).strip().lower()
    password_hash = _hash_password(password)

    with db_lock:
        with _connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (name, email, password_hash, is_new_user, has_uploaded_data)
                VALUES (?, ?, ?, 1, 0)
                """,
                (normalized_name, normalized_email, password_hash),
            )
            connection.commit()
            row = connection.execute(
                "SELECT * FROM users WHERE id = ?",
                (cursor.lastrowid,),
            ).fetchone()

    user = _row_to_user(row)
    assert user is not None
    return user


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    init_auth_db()
    user = get_user(email)
    if not user:
        return None

    normalized_email = str(email).strip().lower()
    with db_lock:
        with _connect() as connection:
            row = connection.execute(
                "SELECT password_hash FROM users WHERE email = ?",
                (normalized_email,),
            ).fetchone()

    if row is None or not _verify_password(row["password_hash"], password):
        return None

    return user


def update_user_details(
    email: str,
    *,
    full_name: str,
    company_name: str,
    city: str,
    state: str,
    pharmacy_type: str = "",
) -> dict[str, Any] | None:
    init_auth_db()
    normalized_email = str(email).strip().lower()
    profile = {
        "fullName": full_name,
        "companyName": company_name,
        "city": city,
        "state": state,
        "pharmacyType": pharmacy_type,
    }

    with db_lock:
        with _connect() as connection:
            connection.execute(
                """
                UPDATE users
                SET name = ?, profile_json = ?, updated_at = CURRENT_TIMESTAMP
                WHERE email = ?
                """,
                (full_name, json.dumps(profile), normalized_email),
            )
            connection.commit()

    return get_user(normalized_email)


def mark_user_uploaded(email: str) -> dict[str, Any] | None:
    init_auth_db()
    normalized_email = str(email).strip().lower()

    with db_lock:
        with _connect() as connection:
            connection.execute(
                """
                UPDATE users
                SET has_uploaded_data = 1,
                    is_new_user = 0,
                    updated_at = CURRENT_TIMESTAMP
                WHERE email = ?
                """,
                (normalized_email,),
            )
            connection.commit()

    return get_user(normalized_email)


def set_user_status(
    email: str,
    *,
    is_new_user: bool | None = None,
    has_uploaded_data: bool | None = None,
) -> dict[str, Any] | None:
    init_auth_db()
    normalized_email = str(email).strip().lower()
    fields = []
    values: list[Any] = []

    if is_new_user is not None:
        fields.append("is_new_user = ?")
        values.append(1 if is_new_user else 0)
    if has_uploaded_data is not None:
        fields.append("has_uploaded_data = ?")
        values.append(1 if has_uploaded_data else 0)

    if not fields:
        return get_user(normalized_email)

    fields.append("updated_at = CURRENT_TIMESTAMP")
    values.append(normalized_email)

    with db_lock:
        with _connect() as connection:
            connection.execute(
                f"UPDATE users SET {', '.join(fields)} WHERE email = ?",
                values,
            )
            connection.commit()

    return get_user(normalized_email)
