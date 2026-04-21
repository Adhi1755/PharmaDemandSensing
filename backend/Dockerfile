# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Use Python 3.11 slim — required because TensorFlow 2.16.x does not support 3.12+
FROM python:3.11-slim AS builder

WORKDIR /app

# System deps needed to build wheels (numpy, scipy, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        g++ \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install into a prefix so we can copy it cleanly into the runtime image
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system libraries only (libgomp is needed by XGBoost / sklearn at runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Pull installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# ── Seed DB setup ──────────────────────────────────────────────────────────────
# Copy the baked-in SQLite DB to /app/data_seed/ — a directory that is NEVER
# shadowed by a docker-compose volume mount.  entrypoint.sh copies it to
# /app/data/pharmasens.sqlite3 on first boot when the volume is still empty.
RUN mkdir -p /app/data_seed && \
    if [ -f /app/data/pharmasens.sqlite3 ]; then \
        cp /app/data/pharmasens.sqlite3 /app/data_seed/pharmasens.sqlite3; \
    fi && \
    mkdir -p /app/data

# Silence TensorFlow C++ logging
ENV TF_CPP_MIN_LOG_LEVEL=3

# Flask will listen on this port
ENV PORT=5001

# Default to 1 worker — MUST stay at 1 when using in-memory datastores
# (datasets_db, prediction_db, model_state_db are plain Python dicts).
# Override in docker-compose via GUNICORN_WORKERS env var.
ENV GUNICORN_WORKERS=1

# Ensure the entrypoint is executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 5001

# entrypoint.sh seeds the DB if needed, then exec's gunicorn
ENTRYPOINT ["/app/entrypoint.sh"]
