from threading import Lock


users_db = {}
datasets_db = {}
model_state_db = {}
store_lock = Lock()
