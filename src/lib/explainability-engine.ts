/**
 * explainability-engine.ts
 *
 * Derives human-readable demand reasons from the same feature-store fields
 * that feed the TFT model.  Each InventoryRow already carries avgDailySales,
 * daysUntilStockout, changePercent and category — we use those signals here
 * so the Explainability Panel always stays in sync with the inventory data.
 */

import type { InventoryRow } from "@/lib/dashboard-data";

// ── Reason types ─────────────────────────────────────────────────────────────

export type ReasonTag = "weather" | "seasonal" | "sales_trend";

export interface DemandReason {
    tag: ReasonTag;
    label: string;      // Short chip label  e.g. "Weather Drop"
    detail: string;     // Human-readable sentence for the card body
    icon: string;       // Emoji icon
}

export interface ExplainabilityResult {
    /** True when at least one reason fired */
    hasTriggers: boolean;
    reasons: DemandReason[];
}

// ── Season detection ─────────────────────────────────────────────────────────

/** Returns true if today falls in a known high-demand seasonal window. */
function isSeasonalPeak(): boolean {
    const month = new Date().getMonth() + 1; // 1-based
    // Winter cold season (Nov-Feb) and allergy spring season (Mar-Apr)
    return month <= 2 || month >= 11 || month === 3 || month === 4;
}

/** Returns true if today is in the winter cold months specifically. */
function isWinterSeason(): boolean {
    const month = new Date().getMonth() + 1;
    return month <= 2 || month >= 11;
}

// ── Category → trigger mapping ────────────────────────────────────────────────

/** Drug categories that are weather-sensitive (cold & flu season). */
const WEATHER_SENSITIVE_CATEGORIES = new Set([
    "Respiratory",
    "Analgesics",
    "General",
]);

/** Drug categories that show strong seasonal demand patterns. */
const SEASONAL_PEAK_CATEGORIES = new Set([
    "Antibiotics",
    "Respiratory",
    "Supplements",
    "General",
]);

// ── Core engine ───────────────────────────────────────────────────────────────

/**
 * Pure function — derives demand reasons from a single InventoryRow.
 * No external I/O.  Safe to call inside useMemo / useEffect.
 */
export function computeExplainability(row: InventoryRow): ExplainabilityResult {
    const reasons: DemandReason[] = [];

    // ── Weather trigger ────────────────────────────────────────────────────
    // Fire when: drug is weather-sensitive AND we are in the winter season
    // (proxy for "temperature dropped below threshold")
    if (WEATHER_SENSITIVE_CATEGORIES.has(row.category) && isWinterSeason()) {
        reasons.push({
            tag: "weather",
            label: "Weather Drop",
            detail:
                "Cold season detected — temperatures have dropped, driving higher demand for this drug class.",
            icon: "❄️",
        });
    }

    // ── Seasonal peak trigger ──────────────────────────────────────────────
    // Fire when: drug category has known seasonal peaks AND today is in one
    if (SEASONAL_PEAK_CATEGORIES.has(row.category) && isSeasonalPeak()) {
        reasons.push({
            tag: "seasonal",
            label: "Seasonal Spike",
            detail:
                "Historical data shows this is a high-demand period for this drug class. Expect above-average sales.",
            icon: "📈",
        });
    }

    // ── Sales trend trigger ────────────────────────────────────────────────
    // Fire when: changePercent shows a meaningful upward trend (>= 3 %)
    if (row.demand > 0 && row.avgDailySales > 0) {
        // Derive a synthetic "trend strength" from avg-daily-sales vs reorderPoint
        // (higher avgDailySales relative to reorderPoint = strong runner)
        const trendStrength = row.avgDailySales / Math.max(1, row.reorderPoint / 7);
        if (trendStrength > 1.5) {
            reasons.push({
                tag: "sales_trend",
                label: "Sales Surge",
                detail:
                    `Current average daily sales (${row.avgDailySales} units/day) are running above the normal reorder threshold, suggesting a demand surge.`,
                icon: "🔥",
            });
        }
    }

    return {
        hasTriggers: reasons.length > 0,
        reasons,
    };
}

// ── Batch helper ──────────────────────────────────────────────────────────────

/** Compute explainability for every row — returns a Map keyed by row.id */
export function computeAllExplainability(
    rows: InventoryRow[]
): Map<string, ExplainabilityResult> {
    const map = new Map<string, ExplainabilityResult>();
    for (const row of rows) {
        map.set(row.id, computeExplainability(row));
    }
    return map;
}
