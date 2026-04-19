from threading import Lock


datasets_db = {}
model_state_db = {}
prediction_db = {}       # per-user prediction results from ML models
store_lock = Lock()
