"use client";

import type { InventoryRow } from "@/lib/dashboard-data";

interface ReorderPlannerProps {
    rows: InventoryRow[];
    onClose: () => void;
    simulatedOrders: Set<string>;
    onSimulateOrder: (id: string) => void;
}

// ── Urgency style maps ────────────────────────────────────────────────────────

const URGENCY_STYLES = {
    urgent: {
        rowBg: "rgba(248,81,73,0.04)",
        rowBorder: "rgba(248,81,73,0.12)",
        badgeBg: "rgba(248,81,73,0.12)",
        badgeBorder: "rgba(248,81,73,0.28)",
        badgeText: "#F85149",
        label: "⚠️ Order NOW",
        labelColor: "#F85149",
    },
    soon: {
        rowBg: "rgba(251,191,36,0.03)",
        rowBorder: "rgba(251,191,36,0.1)",
        badgeBg: "rgba(251,191,36,0.1)",
        badgeBorder: "rgba(251,191,36,0.25)",
        badgeText: "#FBBF24",
        label: "📅 Order Soon",
        labelColor: "#FBBF24",
    },
    ok: {
        rowBg: "rgba(63,185,80,0.02)",
        rowBorder: "rgba(63,185,80,0.08)",
        badgeBg: "rgba(63,185,80,0.08)",
        badgeBorder: "rgba(63,185,80,0.2)",
        badgeText: "#3FB950",
        label: "✅ Stocked",
        labelColor: "#3FB950",
    },
} as const;

// ── Format helpers ────────────────────────────────────────────────────────────

function formatOrderBy(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getSmartReorderText(row: InventoryRow, isSimulated: boolean): { text: string; color: string } {
    if (isSimulated) return { text: "✅ Order Placed", color: "#3FB950" };

    const { orderIn, orderBy } = row.reorderRecommendation;
    const dateStr = formatOrderBy(orderBy);

    if (orderIn <= 0) return { text: "⚠️ Order NOW", color: "#F85149" };
    if (orderIn <= 3) return { text: `📅 Order in ${orderIn}d — by ${dateStr}`, color: "#FBBF24" };
    return { text: `✅ Order by ${dateStr}`, color: "#3FB950" };
}

// ── Reorder Planner Panel ─────────────────────────────────────────────────────

export default function ReorderPlanner({
    rows,
    onClose,
    simulatedOrders,
    onSimulateOrder,
}: ReorderPlannerProps) {
    // Sort: urgent → soon → ok, then by daysUntilStockout ascending
    const sorted = [...rows].sort((a, b) => {
        const urgencyOrder = { urgent: 0, soon: 1, ok: 2 };
        const ua = simulatedOrders.has(a.id) ? 2 : urgencyOrder[a.reorderRecommendation.urgency];
        const ub = simulatedOrders.has(b.id) ? 2 : urgencyOrder[b.reorderRecommendation.urgency];
        if (ua !== ub) return ua - ub;
        return a.daysUntilStockout - b.daysUntilStockout;
    });

    const urgentCount = rows.filter(
        r => !simulatedOrders.has(r.id) && r.reorderRecommendation.urgency === "urgent"
    ).length;
    const soonCount = rows.filter(
        r => !simulatedOrders.has(r.id) && r.reorderRecommendation.urgency === "soon"
    ).length;

    return (
        <div
            className="relative overflow-hidden rounded-2xl"
            style={{
                background: "linear-gradient(145deg,rgba(18,22,30,0.95),rgba(10,14,20,0.92))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
        >
            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: "linear-gradient(90deg,#FBBF24,#F78166 40%,transparent)" }} />

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-5 pb-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[15px] font-semibold" style={{ color: "#E6EDF3" }}>
                            🧠 Smart Reorder Planner
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: "#6E7681" }}>
                            Sorted by urgency · {rows.length} products tracked
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {urgentCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.25)", color: "#F85149" }}>
                            <span className="h-1.5 w-1.5 rounded-full pulse-red" style={{ background: "#F85149" }} />
                            {urgentCount} urgent
                        </span>
                    )}
                    {soonCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium"
                            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24" }}>
                            {soonCount} soon
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#8B949E",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                    >
                        ✕ Close
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: "780px" }}>
                    <thead>
                        <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                            {["Product", "Days Left", "Order In", "Order By", "Suggested Qty", "Action"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: "#6E7681", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row) => {
                            const isSimulated = simulatedOrders.has(row.id);
                            const effectiveUrgency = isSimulated ? "ok" : row.reorderRecommendation.urgency;
                            const us = URGENCY_STYLES[effectiveUrgency];
                            const { text: reorderText, color: reorderColor } = getSmartReorderText(row, isSimulated);
                            const { orderIn, orderBy, suggestedQty } = row.reorderRecommendation;
                            const daysLeftDisplay = row.daysUntilStockout;

                            // Cell color for days left
                            const daysColor =
                                daysLeftDisplay <= 2 ? "#F85149" :
                                daysLeftDisplay <= 5 ? "#F97316" :
                                daysLeftDisplay <= 10 ? "#FBBF24" :
                                "#3FB950";

                            return (
                                <tr
                                    key={row.id}
                                    className="transition-colors duration-150"
                                    style={{
                                        background: us.rowBg,
                                        borderBottom: `1px solid ${us.rowBorder}`,
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = us.rowBg; }}
                                >
                                    {/* Product */}
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium truncate max-w-[160px]"
                                                style={{ color: "#E6EDF3" }}>
                                                {row.medicine}
                                            </p>
                                            <p className="text-[10px] mt-0.5" style={{ color: "#6E7681" }}>
                                                {row.category}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Days left */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-bold tabular-nums"
                                            style={{ color: daysColor }}>
                                            {daysLeftDisplay}d
                                        </span>
                                    </td>

                                    {/* Order in */}
                                    <td className="px-4 py-3">
                                        {isSimulated ? (
                                            <span className="text-sm" style={{ color: "#3FB950" }}>—</span>
                                        ) : (
                                            <span
                                                className="text-sm font-semibold"
                                                style={{ color: orderIn <= 0 ? "#F85149" : orderIn <= 3 ? "#FBBF24" : "#3FB950" }}
                                            >
                                                {orderIn <= 0 ? "NOW" : `${orderIn}d`}
                                            </span>
                                        )}
                                    </td>

                                    {/* Order by */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm" style={{ color: "#C9D1D9" }}>
                                            {isSimulated ? "—" : formatOrderBy(orderBy)}
                                        </span>
                                    </td>

                                    {/* Suggested qty */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium tabular-nums"
                                            style={{ color: "#8B949E" }}>
                                            {suggestedQty.toLocaleString()} units
                                        </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-4 py-3">
                                        {isSimulated ? (
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                                                style={{
                                                    background: "rgba(63,185,80,0.08)",
                                                    border: "1px solid rgba(63,185,80,0.2)",
                                                    color: "#3FB950",
                                                }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                                                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Order Placed
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => onSimulateOrder(row.id)}
                                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
                                                style={{
                                                    background: us.badgeBg,
                                                    border: `1px solid ${us.badgeBorder}`,
                                                    color: us.badgeText,
                                                }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                                            >
                                                Simulate Order
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
