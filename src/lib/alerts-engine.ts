import type { InventoryRow } from "@/lib/dashboard-data";

// ── Alert Types ──────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "medium";

export interface AlertItem {
    id: string;
    severity: AlertSeverity;
    productName: string;
    message: string;
    timestamp: string;  // ISO string at time of computation
    dismissed?: boolean;
}

// ── Alert Engine ─────────────────────────────────────────────────────────────

/**
 * Pure function — takes enriched inventory rows, returns alert items.
 * Run this inside a useEffect whenever inventory data changes.
 *
 * Rules:
 *  🔴 CRITICAL → currentStock <= reorderPoint  OR  daysUntilStockout <= 2
 *  🟡 MEDIUM   → daysUntilStockout between 3–7
 *  ✅ HEALTHY  → no alert emitted
 */
export function computeAlerts(rows: InventoryRow[]): AlertItem[] {
    const now = new Date().toISOString();
    const alerts: AlertItem[] = [];

    for (const row of rows) {
        const { medicine, stock, reorderPoint, daysUntilStockout } = row;

        if (stock <= reorderPoint || daysUntilStockout <= 2) {
            alerts.push({
                id: `${row.id}-critical`,
                severity: "critical",
                productName: medicine,
                message: `🔴 ${medicine}: RESTOCK IMMEDIATELY — only ${daysUntilStockout} days of stock remaining`,
                timestamp: now,
            });
        } else if (daysUntilStockout >= 3 && daysUntilStockout <= 7) {
            alerts.push({
                id: `${row.id}-medium`,
                severity: "medium",
                productName: medicine,
                message: `🟡 ${medicine}: Monitor demand — stock lasts ~${daysUntilStockout} days`,
                timestamp: now,
            });
        }
        // else HEALTHY — no alert
    }

    // Sort: critical first, then medium
    return alerts.sort((a, b) =>
        a.severity === b.severity ? 0
        : a.severity === "critical" ? -1
        : 1
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatAlertTimestamp(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function severityLabel(severity: AlertSeverity): string {
    return severity === "critical" ? "CRITICAL" : "MEDIUM";
}
