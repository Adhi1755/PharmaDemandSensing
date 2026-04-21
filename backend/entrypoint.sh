#!/bin/sh
# entrypoint.sh — runs before gunicorn starts.
#
# Problem: The SQLite DB is baked into the image at /app/data/pharmasens.sqlite3
# (via COPY . .) but the docker-compose volume mounts an EMPTY directory at
# /app/data on first boot, shadowing the baked-in DB file.
#
# Fix: If the volume-mounted DB file doesn't exist yet, copy the baked-in
# seed DB from /app/data_seed/ (which is never shadowed by a volume mount).

DB_PATH="${PHARMASENS_SQLITE_PATH:-/app/data/pharmasens.sqlite3}"
SEED_PATH="/app/data_seed/pharmasens.sqlite3"

mkdir -p "$(dirname "$DB_PATH")"

if [ ! -f "$DB_PATH" ] && [ -f "$SEED_PATH" ]; then
    echo "[entrypoint] Seeding SQLite DB from image default..."
    cp "$SEED_PATH" "$DB_PATH"
elif [ ! -f "$DB_PATH" ]; then
    echo "[entrypoint] No seed DB found — Flask will create a fresh DB on first request."
fi

echo "[entrypoint] Starting gunicorn (workers=${GUNICORN_WORKERS:-1})..."
exec gunicorn \
    --bind "0.0.0.0:${PORT:-5001}" \
    --workers "${GUNICORN_WORKERS:-1}" \
    --timeout 120 \
    --preload \
    "app:create_app()"
