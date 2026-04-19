import type { DashboardFull, ForecastResult } from "@/lib/api";

export interface TopDrug {
    name: string;
    totalDemand: number;
    avgDemand: number;
    trend: string;
    changePercent: number;
}

export interface BusinessKpis {
    totalDrugs: number;
    predictedDemand: number;
    highDemandAlerts: number;
    forecastAccuracy: number | null;
}

export interface InventoryRow {
    id: string;
    medicine: string;
    stock: number;
    demand: number;
    price: number;
    category: string;
}

export interface ForecastChartPoint {
    date: string;
    actual?: number;
    predicted?: number;
}

// ── Category helper ──

export function categorizeMedicine(medicine: string): string {
    const name = medicine.toLowerCase();
    if (name.includes("cillin") || name.includes("mycin") || name.includes("cef")) return "Antibiotics";
    if (name.includes("para") || name.includes("ibuprofen") || name.includes("pain")) return "Analgesics";
    if (name.includes("vit") || name.includes("zinc") || name.includes("supp")) return "Supplements";
    if (name.includes("cough") || name.includes("cold") || name.includes("resp")) return "Respiratory";
    return "General";
}

// ── KPI builders ──

export function buildBusinessKpis(dashboard: DashboardFull | null, topDrugs: TopDrug[]): BusinessKpis {
    // Total Drugs — real count from dataset
    const totalDrugs = topDrugs.length || 0;

    // Predicted Demand — from model or fallback from dataset average
    const historical = dashboard?.forecast?.historical || [];
    const futureForecast = dashboard?.forecast?.futureForecast || [];
    let predictedDemand = 0;
    if (futureForecast.length > 0) {
        predictedDemand = Math.round(futureForecast.reduce((sum, f) => sum + (f.predicted || 0), 0));
    } else if (historical.length > 0) {
        // Fallback: average of last 7 historical points * horizon
        const recentAvg = historical.slice(-7).reduce((s, h) => s + h.actual, 0) / Math.min(7, historical.length);
        predictedDemand = Math.round(recentAvg * 14);
    } else if (topDrugs.length > 0) {
        predictedDemand = Math.round(topDrugs.reduce((s, d) => s + d.avgDemand, 0));
    }

    // High Demand Alerts
    const highDemandAlerts = dashboard?.demandDistribution?.find(
        (item) => item.label.toLowerCase() === "high"
    )?.count || 0;

    // Forecast Accuracy — real from kpis or null
    const kpis = dashboard?.kpis;
    let forecastAccuracy: number | null = null;
    if (kpis && kpis.modelAccuracy > 0) {
        forecastAccuracy = kpis.modelAccuracy;
    }

    return { totalDrugs, predictedDemand, highDemandAlerts, forecastAccuracy };
}

// ── Chart data builders ──

export function buildDemandTrend(historical: { date: string; actual: number }[]) {
    return historical.slice(-12).map((item) => ({
        date: formatShortDate(item.date),
        demand: Math.round(item.actual),
    }));
}

export function buildMonthlySalesTrend(historical: { date: string; actual: number }[]) {
    const byMonth = new Map<string, number>();

    for (const item of historical) {
        const d = new Date(item.date);
        if (Number.isNaN(d.getTime())) continue;
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + item.actual);
    }

    return Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, sales]) => ({ month: key.slice(5), sales: Math.round(sales) }));
}

export function buildTopDemandBars(topDrugs: TopDrug[]) {
    return [...topDrugs]
        .sort((a, b) => b.totalDemand - a.totalDemand)
        .slice(0, 5)
        .map((item) => ({ medicine: shorten(item.name, 14), demand: Math.round(item.totalDemand) }));
}

export function buildCategoryDistribution(topDrugs: TopDrug[]) {
    const categories = new Map<string, number>();

    for (const item of topDrugs) {
        const category = categorizeMedicine(item.name);
        categories.set(category, (categories.get(category) || 0) + item.totalDemand);
    }

    return Array.from(categories.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
}

// ── Forecast chart data builder ──

export function buildForecastChartData(forecast: ForecastResult | null | undefined): ForecastChartPoint[] {
    if (!forecast) return [];

    const baseMap = new Map<string, ForecastChartPoint>();

    for (const point of (forecast.historical || [])) {
        baseMap.set(point.date, {
            date: formatShortDate(point.date),
            actual: Math.round(point.actual),
        });
    }

    for (const point of (forecast.pastPredictions || [])) {
        const existing = baseMap.get(point.date);
        if (existing) {
            existing.predicted = Math.round(point.predicted);
        } else {
            baseMap.set(point.date, {
                date: formatShortDate(point.date),
                predicted: Math.round(point.predicted),
            });
        }
    }

    const sortedKeys = Array.from(baseMap.keys()).sort((a, b) => a.localeCompare(b));
    const merged = sortedKeys.map((key) => baseMap.get(key)!);

    const future: ForecastChartPoint[] = (forecast.futureForecast || [])
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((point) => ({
            date: formatShortDate(point.date),
            predicted: Math.round(point.predicted),
        }));

    return [...merged.slice(-20), ...future];
}

/** Legacy alias for forecast sub-page compatibility */
export function buildForecastComparison(
    historical: { date: string; actual: number }[],
    pastPredictions: { date: string; predicted: number }[],
    futureForecast: { date: string; predicted: number }[],
    scaleFactor: number
): ForecastChartPoint[] {
    const baseMap = new Map<string, ForecastChartPoint>();

    for (const point of historical) {
        baseMap.set(point.date, { date: formatShortDate(point.date), actual: Math.round(point.actual * scaleFactor) });
    }

    for (const point of pastPredictions) {
        const existing = baseMap.get(point.date);
        if (existing) {
            existing.predicted = Math.round(point.predicted * scaleFactor);
        } else {
            baseMap.set(point.date, {
                date: formatShortDate(point.date),
                predicted: Math.round(point.predicted * scaleFactor),
            });
        }
    }

    const sortedKeys = Array.from(baseMap.keys()).sort((a, b) => a.localeCompare(b));
    const merged = sortedKeys.map((key) => baseMap.get(key)!);

    const future: ForecastChartPoint[] = [...futureForecast]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((point) => ({
            date: formatShortDate(point.date),
            predicted: Math.round(point.predicted * scaleFactor),
        }));

    return [...merged.slice(-16), ...future];
}

export function buildInventoryRows(topDrugs: TopDrug[]): InventoryRow[] {
    return topDrugs.map((item, index) => {
        const baseline = Math.max(12, Math.round(item.avgDemand));
        const stock = baseline * 4 + ((index % 3) * 15);
        const price = Number((28 + (index % 6) * 7.5 + (item.changePercent > 0 ? 3.2 : 0)).toFixed(2));

        return {
            id: `${item.name}-${index}`,
            medicine: item.name,
            stock,
            demand: Math.round(item.totalDemand),
            price,
            category: categorizeMedicine(item.name),
        };
    });
}

// ── Helpers ──

function formatShortDate(date: string): string {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
        return date.slice(5);
    }
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function shorten(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1)}...`;
}
