const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Standardised response envelope ──────────────────────────

export interface ApiResponse<T> {
    status: "success" | "failed" | "fallback";
    data: T;
    message: string;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
    const mergedHeaders = isFormData
        ? { ...(options?.headers || {}) }
        : { "Content-Type": "application/json", ...(options?.headers || {}) };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: mergedHeaders,
        ...options,
    });

    const json = await res.json().catch(() => ({}));

    // Handle both old-style (direct data) and new-style (envelope) responses
    if ("status" in json && "data" in json) {
        // New standardised envelope
        if (!res.ok && json.status === "failed") {
            throw new Error(json.message || `Request failed with status ${res.status}`);
        }
        return json as ApiResponse<T>;
    }

    // Legacy response — wrap it
    if (!res.ok) {
        throw new Error(json.error || `Request failed with status ${res.status}`);
    }
    return { status: "success", data: json as T, message: "" };
}

/** Unwrap an ApiResponse, returning just the data (for simpler call sites). */
async function fetchData<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetchAPI<T>(endpoint, options);
    return res.data;
}

// ─── Auth ─────────────────────────────────────────────────────

export interface AuthUser {
    name: string;
    email: string;
    isNewUser: boolean;
    hasUploadedData: boolean;
}

export const login = (email: string, password: string) =>
    fetchData<{ message: string; user: AuthUser }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

export const signup = (name: string, email: string, password: string) =>
    fetchData<{ message: string; user: AuthUser }>("/api/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

// ─── Onboarding ───────────────────────────────────────────────

export const saveUserDetails = (payload: {
    email: string;
    fullName: string;
    companyName: string;
    city: string;
    state: string;
    pharmacyType?: string;
}) =>
    fetchData<{ message: string }>("/api/user-details", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const uploadDataset = async (email: string, file: File) => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("file", file);

    return fetchData<{
        message: string;
        fileName: string;
        rows: number;
        columns: string[];
        preview: Record<string, string | number | null>[];
    }>("/api/upload-dataset", {
        method: "POST",
        body: formData,
    });
};

export const getPreviewData = (email: string) =>
    fetchData<{ preview: Record<string, string | number | null>[]; columns: string[] }>(
        `/api/preview-data?email=${encodeURIComponent(email)}`
    );

export const processData = (payload: {
    email: string;
    dateColumn: string;
    salesColumn: string;
    drugColumn: string;
    locationColumn?: string;
}) =>
    fetchData<{ message: string; processedRows: number; featureColumns: string[] }>("/api/process-data", {
        method: "POST",
        body: JSON.stringify(payload),
    });

// ─── ML Prediction ────────────────────────────────────────────

export interface PredictionResult {
    xgboost: {
        train_accuracy: number;
        test_accuracy: number;
        accuracy: number;
        precision: number;
        recall: number;
        f1: number;
    };
    randomForest: {
        train_accuracy: number;
        test_accuracy: number;
        accuracy: number;
        precision: number;
        recall: number;
        f1: number;
    } | null;
    demandDistribution: { label: string; count: number }[];
    featureImportance: { feature: string; importance: number }[];
    insights: {
        type: string;
        title: string;
        message: string;
        severity: string;
    }[];
    totalSamples: number;
    demandThresholds: { low: number; high: number };
}

export const predictDemand = (email: string) =>
    fetchAPI<PredictionResult>("/api/predict", {
        method: "POST",
        body: JSON.stringify({ email }),
    });

// ─── LSTM Forecast ────────────────────────────────────────────

export interface ForecastResult {
    historical: { date: string; actual: number }[];
    pastPredictions: { date: string; predicted: number }[];
    futureForecast: { date: string; predicted: number }[];
    horizon: number;
    totalHistorical: number;
    model?: "lstm" | "fallback";
    accuracy?: number | null;
    message?: string;
}

export const forecastDemand = (email: string, horizon: number = 14) =>
    fetchAPI<ForecastResult>("/api/forecast", {
        method: "POST",
        body: JSON.stringify({ email, horizon }),
    });

// ─── Dashboard ────────────────────────────────────────────────

export interface DashboardKpis {
    totalSales: number;
    forecastedSales: number;
    modelAccuracy: number;
}

export interface DashboardFull {
    kpis: DashboardKpis;
    forecast: ForecastResult;
    demandDistribution: { label: string; count: number }[];
    featureImportance: { feature: string; importance: number }[];
    insights: {
        type: string;
        title: string;
        message: string;
        severity: string;
    }[];
    totalSamples: number;
    demandThresholds?: { low: number; high: number };
}

export const getDashboardFull = (email: string) =>
    fetchAPI<DashboardFull>(`/api/dashboard-full?email=${encodeURIComponent(email)}`);

export const getDashboardStats = (email: string) =>
    fetchAPI<DashboardKpis>(`/api/dashboard-stats?email=${encodeURIComponent(email)}`);

export const getTopDrugs = (email: string) =>
    fetchAPI<
        {
            name: string;
            totalDemand: number;
            avgDemand: number;
            trend: string;
            changePercent: number;
        }[]
    >(`/api/top-drugs?email=${encodeURIComponent(email)}`);

export const getAlerts = (email: string) =>
    fetchAPI<{ type: string; title: string; message: string }[]>(
        `/api/alerts?email=${encodeURIComponent(email)}`
    );

export const getTrendData = (email: string) =>
    fetchAPI<{ date: string; totalDemand: number }[]>(
        `/api/trend-data?email=${encodeURIComponent(email)}`
    );

// ─── Model Insights ───────────────────────────────────────────

export const getFeatureImportance = (email: string) =>
    fetchAPI<{ feature: string; importance: number }[]>(
        `/api/feature-importance?email=${encodeURIComponent(email)}`
    );

export const getModelMetrics = (email: string) =>
    fetchAPI<{
        models: {
            name: string;
            shortName: string;
            train_accuracy?: number;
            test_accuracy?: number;
            accuracy: number;
            precision: number;
            recall: number;
            f1: number;
            description: string;
        }[];
    }>(`/api/model-metrics?email=${encodeURIComponent(email)}`);

export const getInsights = (email: string) =>
    fetchAPI<
        {
            type: string;
            title: string;
            message: string;
            severity: string;
        }[]
    >(`/api/insights?email=${encodeURIComponent(email)}`);

// ─── Dataset Comparison ──────────────────────────────────────

export type DatasetKey = "raw" | "processed";

export interface DatasetComparisonRow {
    id: string;
    date: string;
    category: string;
    stock: number;
    demand: number;
    price: number;
    metricA: number;
    metricB: number;
    metricC: number;
}

export interface DatasetComparisonStats {
    rowsCount: number;
    featuresCount: number;
    missingCount: number;
    missingLabel: "None" | "Low" | "Medium" | "High";
    cleanlinessStatus: string;
}

export interface DatasetComparisonPayload {
    raw: {
        columns: string[];
        rows: DatasetComparisonRow[];
        stats: DatasetComparisonStats;
    };
    processed: {
        columns: string[];
        rows: DatasetComparisonRow[];
        stats: DatasetComparisonStats;
    };
}
