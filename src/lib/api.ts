const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }
    return res.json();
}

// Auth
export const login = (email: string, password: string) =>
    fetchAPI<{ message: string; user: { name: string; email: string } }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

export const signup = (name: string, email: string, password: string) =>
    fetchAPI<{ message: string; user: { name: string; email: string } }>("/api/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

// Dashboard
export const getDashboardStats = () =>
    fetchAPI<{
        totalDrugs: number;
        predictedDemand7d: number;
        highDemandAlerts: number;
        avgForecastAccuracy: number;
    }>("/api/dashboard-stats");

export const getTopDrugs = () =>
    fetchAPI<
        {
            id: number;
            name: string;
            category: string;
            predictedDemand: number;
            trend: string;
            changePercent: number;
        }[]
    >("/api/top-drugs");

export const getAlerts = () =>
    fetchAPI<{ type: string; title: string; message: string }[]>("/api/alerts");

export const getTrendData = () =>
    fetchAPI<{ date: string; totalDemand: number }[]>("/api/trend-data");

// Forecast
export const getDrugs = () =>
    fetchAPI<{ id: number; name: string; category: string }[]>("/api/drugs");

export const getForecast = (drug: string, horizon: number = 7) =>
    fetchAPI<{
        drug: string;
        horizon: number;
        historical: { date: string; demand: number }[];
        forecast: {
            date: string;
            predicted: number;
            lower_bound: number;
            upper_bound: number;
        }[];
    }>(`/api/forecast?drug=${encodeURIComponent(drug)}&horizon=${horizon}`);

// Inventory
export const getInventory = () =>
    fetchAPI<
        {
            id: number;
            name: string;
            category: string;
            currentStock: number;
            predictedDemand: number;
            safetyStock: number;
            suggestedReorder: number;
            status: string;
        }[]
    >("/api/inventory");

// Model Insights
export const getModelMetrics = () =>
    fetchAPI<{
        models: {
            name: string;
            shortName: string;
            mae: number;
            rmse: number;
            accuracy: number;
            mape: number;
            trainingTime: string;
            description: string;
        }[];
    }>("/api/model-metrics");

export const getFeatureImportance = () =>
    fetchAPI<{ feature: string; importance: number }[]>("/api/feature-importance");

// Insights
export const getAIInsights = () =>
    fetchAPI<
        {
            type: string;
            severity: string;
            title: string;
            message: string;
            action: string;
        }[]
    >("/api/insights");

export const getLocationInsights = (region?: string) =>
    fetchAPI<
        {
            region: string;
            district: string;
            totalDemand: number;
            drugs: { drug: string; demand: number }[];
        }[]
    >(`/api/location-insights${region ? `?region=${encodeURIComponent(region)}` : ""}`);

export const getIntermittentDemand = () =>
    fetchAPI<
        {
            drug: string;
            category: string;
            history: { date: string; demand: number }[];
            zeroDays: number;
            totalDays: number;
            intermittencyRate: number;
            spikeCount: number;
        }[]
    >("/api/intermittent-demand");
