import logging

from flask import Flask
from flask_cors import CORS

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.forecast import forecast_bp
from routes.inventory import inventory_bp
from routes.insights import insights_bp
from routes.onboarding import onboarding_bp
from routes.predict import predict_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"])

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(forecast_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(insights_bp)
    app.register_blueprint(onboarding_bp)
    app.register_blueprint(predict_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok"}

    # Pre-load ML models at startup
    with app.app_context():
        try:
            from model_loader import ensure_loaded
            model_status = ensure_loaded()
            logger.info("ML Models loaded: %s", model_status)
        except Exception as e:
            logger.error("Failed to pre-load models: %s", e)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5001, host="0.0.0.0")
