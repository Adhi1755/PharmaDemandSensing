const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
    const mergedHeaders = isFormData
        ? { ...(options?.headers || {}) }
        : { "Content-Type": "application/json", ...(options?.headers || {}) };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: mergedHeaders,
        ...options,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }
    return res.json();
}

export interface AuthUser {
    name: string;
    email: string;
    isNewUser: boolean;
    hasUploadedData: boolean;
}

// Auth
export const login = (email: string, password: string) =>
    fetchAPI<{ message: string; user: AuthUser }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

export const signup = (name: string, email: string, password: string) =>
    fetchAPI<{ message: string; user: AuthUser }>("/api/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

// Onboarding and pipeline
export const saveUserDetails = (payload: {
    email: string;
    fullName: string;
    companyName: string;
    city: string;
    state: string;
    pharmacyType?: string;
}) =>
    fetchAPI<{ message: string }>("/api/user-details", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const uploadDataset = async (email: string, file: File) => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("file", file);

    return fetchAPI<{
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
    fetchAPI<{ preview: Record<string, string | number | null>[]; columns: string[] }>(
        `/api/preview-data?email=${encodeURIComponent(email)}`
    );

export const processData = (payload: {
    email: string;
    dateColumn: string;
    salesColumn: string;
    drugColumn: string;
    locationColumn?: string;
}) =>
    fetchAPI<{ message: string; processedRows: number; featureColumns: string[] }>("/api/process-data", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export interface ModelOutput {
    model: string;
    accuracy: number;
    mae: number;
    graphData: { date: string; actual: number; predicted: number }[];
    futureForecast: { date: string; predicted: number }[];
    demandPattern: {
        avgDemand: number;
        maxDemand: number;
        minDemand: number;
        volatility: number;
    };
    recommendations: string[];
    quickSummary: string;
}

export const trainModel = (email: string) =>
    fetchAPI<{ message: string; note: string; linear: ModelOutput }>("/api/train-model", {
        method: "POST",
        body: JSON.stringify({ email }),
    });

export const getModelStatus = (email: string) =>
    fetchAPI<{
        status: { linear: string; rf: string; tft: string };
        readyModels: string[];
    }>(`/api/model-status?email=${encodeURIComponent(email)}`);

export const getResults = (email: string, model: "linear" | "rf" | "tft" = "linear") =>
    fetchAPI<{
        selectedModel: string;
        status: { linear: string; rf: string; tft: string };
        results: Partial<Record<"linear" | "rf" | "tft", ModelOutput>>;
        active: ModelOutput;
        userStatus: { isNewUser: boolean; hasUploadedData: boolean };
    }>(`/api/results?email=${encodeURIComponent(email)}&model=${model}`);

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
