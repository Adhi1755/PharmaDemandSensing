export interface DemandDistributionPoint {
    name: string;
    value: number;
}

export interface DemandTrendPoint {
    date: string;
    demand: number;
}

export interface ForecastPoint {
    date: string;
    actual?: number;
    predicted?: number;
}

export interface SalesTrendPoint {
    month: string;
    sales: number;
}

export interface MedicineDemandPoint {
    medicine: string;
    demand: number;
}

export interface FeaturePoint {
    feature: string;
    importance: number;
}

export const FALLBACK_DEMAND_DISTRIBUTION: DemandDistributionPoint[] = [
    { name: "Low", value: 32 },
    { name: "Medium", value: 28 },
    { name: "High", value: 40 },
];

export const FALLBACK_DEMAND_TREND: DemandTrendPoint[] = [
    { date: "04/01", demand: 118 },
    { date: "04/02", demand: 124 },
    { date: "04/03", demand: 121 },
    { date: "04/04", demand: 129 },
    { date: "04/05", demand: 136 },
    { date: "04/06", demand: 132 },
];

export const FALLBACK_FORECAST_COMPARISON: ForecastPoint[] = [
    { date: "2026-03-29", actual: 108 },
    { date: "2026-03-30", actual: 112, predicted: 111 },
    { date: "2026-03-31", actual: 115, predicted: 116 },
    { date: "2026-04-01", actual: 119, predicted: 120 },
    { date: "2026-04-02", actual: 123, predicted: 124 },
    { date: "2026-04-03", predicted: 127 },
    { date: "2026-04-04", predicted: 129 },
    { date: "2026-04-05", predicted: 131 },
];

export const FALLBACK_MONTHLY_SALES: SalesTrendPoint[] = [
    { month: "11", sales: 2450 },
    { month: "12", sales: 2780 },
    { month: "01", sales: 3010 },
    { month: "02", sales: 2895 },
    { month: "03", sales: 3240 },
    { month: "04", sales: 3375 },
];

export const FALLBACK_TOP_MEDICINES: MedicineDemandPoint[] = [
    { medicine: "Paracetamol", demand: 460 },
    { medicine: "Amoxicillin", demand: 398 },
    { medicine: "Vitamin C", demand: 355 },
    { medicine: "Ibuprofen", demand: 331 },
    { medicine: "Cough Syrup", demand: 288 },
    { medicine: "Cetirizine", demand: 244 },
];

export const FALLBACK_FEATURE_IMPORTANCE: FeaturePoint[] = [
    { feature: "time_idx", importance: 0.31 },
    { feature: "sales_lag_1", importance: 0.21 },
    { feature: "rolling_mean_7", importance: 0.17 },
    { feature: "day_of_week", importance: 0.11 },
    { feature: "month_sin", importance: 0.09 },
    { feature: "category_encoded", importance: 0.08 },
];

export function hasPositiveMetric<T extends Record<string, unknown>>(data: T[], key: keyof T): boolean {
    return data.some((row) => Number(row[key]) > 0);
}

export function hasAnyForecastValue(data: ForecastPoint[]): boolean {
    return data.some((point) => Number(point.actual ?? 0) > 0 || Number(point.predicted ?? 0) > 0);
}
