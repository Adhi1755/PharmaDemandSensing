"""
Mock dataset for PharmaSales application.
Contains drug information, historical demand, stock levels, regional data,
and simulated TFT/LSTM/ARIMA model metrics.
"""

import random
import math
from datetime import datetime, timedelta

DRUGS = [
    {"id": 1, "name": "Paracetamol", "category": "Analgesic"},
    {"id": 2, "name": "Amoxicillin", "category": "Antibiotic"},
    {"id": 3, "name": "Metformin", "category": "Antidiabetic"},
    {"id": 4, "name": "Omeprazole", "category": "Antacid"},
    {"id": 5, "name": "Cetirizine", "category": "Antihistamine"},
    {"id": 6, "name": "Azithromycin", "category": "Antibiotic"},
    {"id": 7, "name": "Ibuprofen", "category": "Analgesic"},
    {"id": 8, "name": "Losartan", "category": "Antihypertensive"},
    {"id": 9, "name": "Atorvastatin", "category": "Statin"},
    {"id": 10, "name": "Ciprofloxacin", "category": "Antibiotic"},
    {"id": 11, "name": "Salbutamol", "category": "Bronchodilator"},
    {"id": 12, "name": "Doxycycline", "category": "Antibiotic"},
    {"id": 13, "name": "Ranitidine", "category": "Antacid"},
    {"id": 14, "name": "Prednisolone", "category": "Corticosteroid"},
    {"id": 15, "name": "Metoprolol", "category": "Beta Blocker"},
    {"id": 16, "name": "Amlodipine", "category": "Calcium Channel Blocker"},
    {"id": 17, "name": "Clopidogrel", "category": "Antiplatelet"},
    {"id": 18, "name": "Pantoprazole", "category": "Antacid"},
    {"id": 19, "name": "Levothyroxine", "category": "Thyroid"},
    {"id": 20, "name": "Montelukast", "category": "Leukotriene Inhibitor"},
]

REGIONS = [
    "North Zone", "South Zone", "East Zone", "West Zone",
    "Central Zone", "Northeast Zone"
]

DISTRICTS = {
    "North Zone": ["Delhi", "Chandigarh", "Lucknow", "Jaipur"],
    "South Zone": ["Chennai", "Bangalore", "Hyderabad", "Kochi"],
    "East Zone": ["Kolkata", "Patna", "Bhubaneswar", "Ranchi"],
    "West Zone": ["Mumbai", "Pune", "Ahmedabad", "Surat"],
    "Central Zone": ["Bhopal", "Indore", "Nagpur", "Raipur"],
    "Northeast Zone": ["Guwahati", "Shillong", "Imphal", "Agartala"],
}


def _generate_intermittent_demand(days=90, base_demand=50, zero_probability=0.3):
    """Generate intermittent demand data with random zero-gaps and occasional spikes."""
    demand = []
    for i in range(days):
        if random.random() < zero_probability:
            demand.append(0)
        else:
            seasonal = base_demand * (1 + 0.3 * math.sin(2 * math.pi * i / 30))
            noise = random.gauss(0, base_demand * 0.2)
            spike = base_demand * 2 if random.random() < 0.05 else 0
            value = max(0, int(seasonal + noise + spike))
            demand.append(value)
    return demand


def get_historical_demand(drug_name, days=90):
    """Get historical demand data for a drug."""
    seed = sum(ord(c) for c in drug_name)
    random.seed(seed)
    base = 30 + (seed % 70)
    zero_prob = 0.2 + (seed % 30) / 100
    demand = _generate_intermittent_demand(days, base, zero_prob)
    random.seed()

    end_date = datetime.now()
    dates = [(end_date - timedelta(days=days - i)).strftime("%Y-%m-%d") for i in range(days)]
    return [{"date": d, "demand": v} for d, v in zip(dates, demand)]


def get_forecast(drug_name, horizon=7):
    """Generate simulated TFT predictions."""
    seed = sum(ord(c) for c in drug_name) + horizon
    random.seed(seed)
    base = 30 + (seed % 70)

    forecast = []
    start_date = datetime.now() + timedelta(days=1)
    for i in range(horizon):
        date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        predicted = max(0, int(base + random.gauss(0, base * 0.25)))
        lower = max(0, int(predicted * 0.7))
        upper = int(predicted * 1.3)
        forecast.append({
            "date": date,
            "predicted": predicted,
            "lower_bound": lower,
            "upper_bound": upper,
        })
    random.seed()
    return forecast


def get_inventory():
    """Get inventory with stock levels and reorder suggestions."""
    inventory = []
    random.seed(42)
    for drug in DRUGS:
        base_demand = 30 + (sum(ord(c) for c in drug["name"]) % 70)
        current_stock = random.randint(20, 500)
        predicted_7d = int(base_demand * 7 * (0.5 + random.random()))
        safety_stock = int(predicted_7d * 0.3)
        reorder = max(0, predicted_7d + safety_stock - current_stock)
        status = "Critical" if current_stock < predicted_7d * 0.3 else \
                 "Low" if current_stock < predicted_7d * 0.7 else "Adequate"
        inventory.append({
            "id": drug["id"],
            "name": drug["name"],
            "category": drug["category"],
            "currentStock": current_stock,
            "predictedDemand": predicted_7d,
            "safetyStock": safety_stock,
            "suggestedReorder": reorder,
            "status": status,
        })
    random.seed()
    return inventory


def get_top_drugs(n=5):
    """Get top N drugs by predicted demand."""
    random.seed(100)
    scored = []
    for drug in DRUGS:
        predicted = 30 + (sum(ord(c) for c in drug["name"]) % 70)
        predicted = int(predicted * (1 + random.random()))
        scored.append({
            "id": drug["id"],
            "name": drug["name"],
            "category": drug["category"],
            "predictedDemand": predicted,
            "trend": random.choice(["up", "down", "stable"]),
            "changePercent": round(random.uniform(-15, 30), 1),
        })
    random.seed()
    scored.sort(key=lambda x: x["predictedDemand"], reverse=True)
    return scored[:n]


def get_dashboard_stats():
    """Get dashboard KPI stats."""
    inv = get_inventory()
    total_predicted = sum(item["predictedDemand"] for item in inv)
    high_alerts = sum(1 for item in inv if item["status"] in ("Critical", "Low"))
    return {
        "totalDrugs": len(DRUGS),
        "predictedDemand7d": total_predicted,
        "highDemandAlerts": high_alerts,
        "avgForecastAccuracy": 87.3,
    }


def get_alerts():
    """Get alert messages."""
    inv = get_inventory()
    alerts = []
    for item in inv:
        if item["status"] == "Critical":
            alerts.append({
                "type": "critical",
                "title": f"Critical Stock: {item['name']}",
                "message": f"Current stock ({item['currentStock']} units) is critically low. "
                           f"Predicted demand: {item['predictedDemand']} units in 7 days.",
            })
        elif item["status"] == "Low":
            alerts.append({
                "type": "warning",
                "title": f"Low Stock: {item['name']}",
                "message": f"Stock at {item['currentStock']} units. Consider reordering "
                           f"{item['suggestedReorder']} units.",
            })
    top = get_top_drugs(3)
    for drug in top:
        if drug["changePercent"] > 15:
            alerts.append({
                "type": "info",
                "title": f"Demand Surge: {drug['name']}",
                "message": f"Predicted demand increase of {drug['changePercent']}% "
                           f"for {drug['name']}.",
            })
    return alerts[:8]


def get_model_metrics():
    """Get model comparison metrics."""
    return {
        "models": [
            {
                "name": "Temporal Fusion Transformer",
                "shortName": "TFT",
                "mae": 4.2,
                "rmse": 6.1,
                "accuracy": 92.3,
                "mape": 8.7,
                "trainingTime": "45 min",
                "description": "State-of-the-art attention-based architecture designed for "
                               "multi-horizon time series forecasting with interpretable outputs."
            },
            {
                "name": "Long Short-Term Memory",
                "shortName": "LSTM",
                "mae": 6.8,
                "rmse": 9.4,
                "accuracy": 85.7,
                "mape": 13.2,
                "trainingTime": "30 min",
                "description": "Recurrent neural network capable of learning long-term "
                               "dependencies in sequential data."
            },
            {
                "name": "ARIMA",
                "shortName": "ARIMA",
                "mae": 9.1,
                "rmse": 12.7,
                "accuracy": 78.4,
                "mape": 18.5,
                "trainingTime": "5 min",
                "description": "Classical statistical model combining autoregression, "
                               "differencing, and moving average components."
            },
        ]
    }


def get_feature_importance():
    """Get feature importance for TFT model."""
    return [
        {"feature": "Historical Demand (Lag 7)", "importance": 0.28},
        {"feature": "Day of Week", "importance": 0.18},
        {"feature": "Month", "importance": 0.14},
        {"feature": "Drug Category", "importance": 0.12},
        {"feature": "Region", "importance": 0.09},
        {"feature": "Historical Demand (Lag 30)", "importance": 0.08},
        {"feature": "Holiday Flag", "importance": 0.05},
        {"feature": "Temperature", "importance": 0.03},
        {"feature": "Promotion Active", "importance": 0.02},
        {"feature": "Competitor Price Index", "importance": 0.01},
    ]


def get_location_insights(region=None):
    """Get location-wise demand data."""
    random.seed(77)
    data = []
    for reg in REGIONS:
        if region and reg != region:
            continue
        for district in DISTRICTS[reg]:
            drugs_data = []
            for drug in DRUGS[:8]:
                demand = random.randint(50, 500)
                drugs_data.append({"drug": drug["name"], "demand": demand})
            data.append({
                "region": reg,
                "district": district,
                "totalDemand": sum(d["demand"] for d in drugs_data),
                "drugs": drugs_data,
            })
    random.seed()
    return data


def get_intermittent_demand_data():
    """Get intermittent demand patterns for visualization."""
    result = []
    for drug in DRUGS[:6]:
        history = get_historical_demand(drug["name"], days=60)
        zero_days = sum(1 for d in history if d["demand"] == 0)
        spikes = [d for d in history if d["demand"] > 100]
        result.append({
            "drug": drug["name"],
            "category": drug["category"],
            "history": history,
            "zeroDays": zero_days,
            "totalDays": len(history),
            "intermittencyRate": round(zero_days / len(history) * 100, 1),
            "spikeCount": len(spikes),
        })
    return result


def get_ai_insights():
    """Generate AI recommendation text insights."""
    top = get_top_drugs(5)
    inv = get_inventory()
    critical = [i for i in inv if i["status"] == "Critical"]
    low = [i for i in inv if i["status"] == "Low"]

    insights = []

    for drug in top[:3]:
        if drug["changePercent"] > 0:
            insights.append({
                "type": "demand_increase",
                "severity": "high" if drug["changePercent"] > 15 else "medium",
                "title": f"Rising Demand: {drug['name']}",
                "message": f"Demand for {drug['name']} is expected to rise by "
                           f"{drug['changePercent']}% over the next 7 days. "
                           f"Current predicted demand: {drug['predictedDemand']} units.",
                "action": f"Increase stock allocation for {drug['name']} by at least "
                          f"{int(drug['predictedDemand'] * drug['changePercent'] / 100)} units.",
            })

    for item in critical[:2]:
        insights.append({
            "type": "restock_urgent",
            "severity": "critical",
            "title": f"Urgent Restock: {item['name']}",
            "message": f"Current stock of {item['name']} ({item['currentStock']} units) "
                       f"is critically low against predicted demand of "
                       f"{item['predictedDemand']} units.",
            "action": f"Immediately reorder {item['suggestedReorder']} units of {item['name']}.",
        })

    for item in low[:2]:
        insights.append({
            "type": "restock_suggested",
            "severity": "medium",
            "title": f"Consider Restocking: {item['name']}",
            "message": f"Stock levels for {item['name']} are approaching minimum threshold. "
                       f"Current: {item['currentStock']} units.",
            "action": f"Plan reorder of {item['suggestedReorder']} units within 3 days.",
        })

    insights.append({
        "type": "seasonal_trend",
        "severity": "low",
        "title": "Seasonal Pattern Detected",
        "message": "Antibiotic demand typically increases during monsoon season. "
                   "Historical data shows a 25-35% increase in the upcoming quarter.",
        "action": "Pre-stock antibiotics category with 30% additional buffer.",
    })

    insights.append({
        "type": "model_performance",
        "severity": "info",
        "title": "Model Accuracy Update",
        "message": "TFT model accuracy remains at 92.3% with MAE of 4.2. "
                   "Performance is stable across all drug categories.",
        "action": "No action required. Next model retraining scheduled in 7 days.",
    })

    return insights


def get_trend_data():
    """Get overall trend data for dashboard mini-chart."""
    random.seed(55)
    data = []
    base = 800
    start_date = datetime.now() - timedelta(days=30)
    for i in range(30):
        date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        value = int(base + 200 * math.sin(2 * math.pi * i / 14) + random.gauss(0, 50))
        data.append({"date": date, "totalDemand": max(0, value)})
    random.seed()
    return data
