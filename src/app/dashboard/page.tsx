"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useNavActions } from "@/context/NavActionsContext";
import EDAKPISection from "@/components/dashboard/EDAKPISection";
import NotificationTray from "@/components/dashboard/NotificationTray";
import ReorderPlanner from "@/components/dashboard/ReorderPlanner";
import RecommendationWidget from "@/components/dashboard/RecommendationWidget";
import ExplainabilityPanel from "@/components/dashboard/ExplainabilityPanel";
import { computeAlerts } from "@/lib/alerts-engine";
import type { AlertItem } from "@/lib/alerts-engine";
import { buildInventoryRows } from "@/lib/dashboard-data";
import type { InventoryRow } from "@/lib/dashboard-data";
import { computeAllExplainability } from "@/lib/explainability-engine";
import type { ExplainabilityResult } from "@/lib/explainability-engine";

// ── Lazy-load charts ───────────────────────────────────────────
const SalesTrendChart = dynamic(() => import("@/charts/SalesTrendChart"), {
  ssr: false,
  loading: () => <ChartSkeleton height="h-72" />,
});
const DrugSalesBarChart = dynamic(() => import("@/charts/DrugSalesBarChart"), {
  ssr: false,
  loading: () => <ChartSkeleton height="h-64" />,
});
const MonthlyDistributionChart = dynamic(
  () => import("@/charts/MonthlyDistributionChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton height="h-48" />,
  }
);

// ── Types ────────────────────────────────────────────────────
interface DashboardData {
  status: string;
  kpis: {
    totalSales: number;
    totalDrugs: number;
    avgMonthlySales: number;
    topDrug: string;
  };
  charts: {
    trend: { date: string; sales: number }[];
    topDrugs: { drug: string; sales: number }[];
    monthly: { month: string; avgSales: number }[];
  };
  meta: {
    months: number;
    dateRange: { from: string; to: string };
  };
}

// ── Skeleton ─────────────────────────────────────────────────
function ChartSkeleton({ height }: { height: string }) {
  return <div className={`${height} skeleton rounded-xl`} />;
}

// ── Section Card ─────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  accentColor = "#DA3633",
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  accentColor?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-card relative overflow-hidden p-6">
      {/* Top accent line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 70%)` }}
      />
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5"
            style={{ color: "#6E7681" }}>
            {subtitle ?? "Analytics"}
          </p>
          <h2 className="text-[15px] font-semibold" style={{ color: "#E6EDF3" }}>{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ── Insight Pill ─────────────────────────────────────────────
function InsightPill({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-200"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${color}14`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: "#6E7681" }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: "#C9D1D9" }}>{value}</p>
      </div>
    </div>
  );
}

// ── Days-Left Cell ────────────────────────────────────────────
function DaysLeftCell({ row }: { row: InventoryRow }) {
  const d = row.daysUntilStockout;
  const cls =
    d <= 2 ? "days-cell-red" :
    d <= 5 ? "days-cell-orange" :
    d <= 10 ? "days-cell-yellow" :
    "days-cell-green";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${cls}`}
      title={`At current sales rate of ${row.avgDailySales} units/day`}
    >
      {d}d
    </span>
  );
}

// ── Smart Reorder Cell ────────────────────────────────────────
function SmartReorderCell({ row, isSimulated }: { row: InventoryRow; isSimulated: boolean }) {
  if (isSimulated) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#3FB950" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        Order Placed
      </span>
    );
  }

  const { orderIn, orderBy } = row.reorderRecommendation;
  const dateStr = new Date(orderBy).toLocaleDateString("en-US", { month: "short", day: "numeric" });


  if (orderIn <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: "#F85149" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        Order NOW
      </span>
    );
  }
  if (orderIn <= 3) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#FBBF24" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        Order in {orderIn}d — by {dateStr}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#3FB950" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
      Order by {dateStr}
    </span>
  );
}

// ── Product Detail Stockout Bar ───────────────────────────────
function StockoutBar({ days, max = 30 }: { days: number; max?: number }) {
  const pct = Math.min(100, Math.round((days / max) * 100));
  const fillColor =
    days <= 2 ? "#F85149" :
    days <= 5 ? "#F97316" :
    days <= 10 ? "#FBBF24" :
    "#3FB950";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "#6E7681" }}>
          Stock Runway
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color: fillColor }}>
          {days} days
        </span>
      </div>
      <div className="stockout-bar-track">
        <div
          className="stockout-bar-fill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}

// ── Inventory Table ───────────────────────────────────────────
function InventoryTable({
  rows,
  simulatedOrders,
  explainabilityMap,
}: {
  rows: InventoryRow[];
  simulatedOrders: Set<string>;
  explainabilityMap: Map<string, ExplainabilityResult>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: "900px" }}>
          <thead className="sticky top-0 z-10" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}>
            <tr>
              {["Medicine", "Category", "Stock", "Demand", "Price", "Days Left", "Smart Reorder"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color: "rgba(191,191,191,1)",
                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,0,0,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#6E7681" }}>
                        {expandedId === row.id ? "▾" : "▸"}
                      </span>
                      <span className="text-sm font-medium" style={{ color: "#E6EDF3" }}>
                        {row.medicine}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#8B949E" }}>
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "#C9D1D9" }}>
                    {row.stock.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "#C9D1D9" }}>
                    {row.demand.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "#C9D1D9" }}>
                    ${row.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <DaysLeftCell row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <SmartReorderCell row={row} isSimulated={simulatedOrders.has(row.id)} />
                  </td>
                </tr>
                {/* Expanded detail row */}
                {expandedId === row.id && (
                  <tr key={`${row.id}-detail`}>
                    <td colSpan={7} className="px-6 py-4"
                      style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Stockout countdown bar */}
                        <div className="rounded-xl p-4"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <StockoutBar days={row.daysUntilStockout} />
                        </div>
                        {/* Reorder details */}
                        <div className="rounded-xl p-4"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-[10px] uppercase tracking-wider mb-2.5" style={{ color: "#6E7681" }}>
                            Reorder Details
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span style={{ color: "#6E7681" }}>Reorder Point</span>
                              <span className="font-medium" style={{ color: "#C9D1D9" }}>{row.reorderPoint} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "#6E7681" }}>Avg Daily Sales</span>
                              <span className="font-medium" style={{ color: "#C9D1D9" }}>{row.avgDailySales} units/day</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "#6E7681" }}>Suggested Order</span>
                              <span className="font-medium" style={{ color: "#C9D1D9" }}>{row.reorderRecommendation.suggestedQty} units</span>
                            </div>
                          </div>
                        </div>
                        {/* Current stock vs reorder point */}
                        <div className="rounded-xl p-4"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-[10px] uppercase tracking-wider mb-2.5" style={{ color: "#6E7681" }}>
                            Stock vs Reorder Point
                          </p>
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs" style={{ color: "#6E7681" }}>Current Stock</span>
                              <span className="text-xs font-bold" style={{
                                color: row.stock <= row.reorderPoint ? "#F85149" : "#3FB950"
                              }}>
                                {row.stock <= row.reorderPoint ? "⚠️ Below threshold" : "✅ Above threshold"}
                              </span>
                            </div>
                            <div className="stockout-bar-track">
                              <div
                                className="stockout-bar-fill"
                                style={{
                                  width: `${Math.min(100, Math.round((row.stock / Math.max(row.stock, row.reorderPoint * 2)) * 100))}%`,
                                  background: row.stock <= row.reorderPoint ? "#F85149" : "#3FB950",
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px]" style={{ color: "#6E7681" }}>0</span>
                              <span className="text-[10px]" style={{ color: "#6E7681" }}>
                                Reorder @ {row.reorderPoint}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Feature 2: Explainability Panel ── */}
                      {explainabilityMap.has(row.id) && (
                        <div className="mt-4">
                          <ExplainabilityPanel
                            result={explainabilityMap.get(row.id)!}
                            medicineName={row.medicine}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs" style={{ color: "rgba(191,191,191,1)" }}>
          Page {safePage} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage === 1}
            className="rounded-lg px-3 py-1.5 text-xs disabled:opacity-40 transition-colors"
            style={{
              border: "1px solid rgba(255,255,255,0.16)",
              color: "rgba(191,191,191,1)",
              background: "transparent",
            }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages}
            className="rounded-lg px-3 py-1.5 text-xs disabled:opacity-40 transition-colors"
            style={{
              border: "1px solid rgba(255,255,255,0.16)",
              color: "rgba(191,191,191,1)",
              background: "transparent",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mock top drugs to seed inventory ─────────────────────────
const MOCK_TOP_DRUGS = [
  // High runners — will have low days-until-stockout → triggers alerts
  { name: "M01AB Ibuprofen",       totalDemand: 8420, avgDemand: 95,  trend: "up" as const,     changePercent: 4.2 },
  { name: "N02BE Paracetamol",     totalDemand: 7810, avgDemand: 88,  trend: "up" as const,     changePercent: 2.1 },
  { name: "J01CA Amoxicillin",     totalDemand: 5940, avgDemand: 72,  trend: "down" as const,   changePercent: -1.5 },
  { name: "R05DB Cough Syrup",     totalDemand: 4230, avgDemand: 60,  trend: "up" as const,     changePercent: 6.8 },
  // Slow movers — ample stock
  { name: "A11CC Vitamin D3",      totalDemand: 3800, avgDemand: 8,   trend: "stable" as const, changePercent: 0 },
  { name: "J01FA Azithromycin",    totalDemand: 3120, avgDemand: 6,   trend: "down" as const,   changePercent: -3.2 },
  { name: "N06AB Fluoxetine",      totalDemand: 2900, avgDemand: 9,   trend: "up" as const,     changePercent: 1.8 },
  { name: "C09AA Lisinopril",      totalDemand: 2640, avgDemand: 7,   trend: "stable" as const, changePercent: 0.5 },
  { name: "A10BA Metformin",       totalDemand: 2410, avgDemand: 10,  trend: "up" as const,     changePercent: 3.1 },
  { name: "B01AC Aspirin Low-Dose",totalDemand: 2100, avgDemand: 5,   trend: "stable" as const, changePercent: -0.3 },
];

// ── Main page ────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Alert Tray state ──
  const [showAlertTray, setShowAlertTray] = useState(false);
  const [showReorderPlanner, setShowReorderPlanner] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [simulatedOrders, setSimulatedOrders] = useState<Set<string>>(new Set());
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);

  // ── Inventory rows (single source of truth) ──
  const inventoryRows: InventoryRow[] = useMemo(
    () => buildInventoryRows(MOCK_TOP_DRUGS),
    []
  );

  // ── Feature 2: Explainability map (recomputed whenever inventory refreshes) ──
  const explainabilityMap = useMemo(
    () => computeAllExplainability(inventoryRows),
    [inventoryRows]
  );

  // ── AlertsEngine side-effect ──────────────────────────────
  useEffect(() => {
    const alerts = computeAlerts(inventoryRows);
    setActiveAlerts(alerts);
  }, [inventoryRows]);

  // ── Dashboard API fetch ──────────────────────────────────
  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json: DashboardData) => {
        if (json.status === "error") throw new Error((json as { message?: string }).message ?? "Unknown error");
        setData(json);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const peakMonth = data?.charts.monthly.reduce(
    (best, m) => (m.avgSales > best.avgSales ? m : best),
    data.charts.monthly[0]
  );
  const lowestMonth = data?.charts.monthly.reduce(
    (lowest, m) => (m.avgSales < lowest.avgSales ? m : lowest),
    data.charts.monthly[0]
  );

  const visibleAlertCount = activeAlerts.filter((a) => !dismissedAlertIds.has(a.id)).length;

  const handleDismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, id]));
  };

  const handleSimulateOrder = (id: string) => {
    setSimulatedOrders((prev) => new Set([...prev, id]));
  };

  // ── Wire alert count + callbacks into the persistent layout TopNav ──
  const { setNavActions } = useNavActions();
  useEffect(() => {
    setNavActions({
      alertCount: visibleAlertCount,
      onBellClick: () => setShowAlertTray((v) => !v),
      onCalendarClick: () => setShowReorderPlanner((v) => !v),
    });
    // Reset callbacks when leaving this page
    return () => setNavActions({ alertCount: 0, onBellClick: undefined, onCalendarClick: undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleAlertCount]);

  return (
    <>

      {/* ── Notification Tray (floating) ── */}
      {showAlertTray && (
        <NotificationTray
          alerts={activeAlerts}
          dismissedIds={dismissedAlertIds}
          onDismiss={handleDismissAlert}
          onClose={() => setShowAlertTray(false)}
        />
      )}

      <main className="space-y-5 p-5 pb-24 md:p-6 lg:p-7 lg:pb-8 max-w-[1400px] mx-auto">

        {/* ── Error state ── */}
        {error && (
          <div className="rounded-xl p-4" style={{
            background: "rgba(218,54,51,0.06)",
            border: "1px solid rgba(218,54,51,0.25)",
          }}>
            <p className="text-sm font-medium" style={{ color: "#F85149" }}>⚠ Failed to load dataset</p>
            <p className="mt-1 text-xs" style={{ color: "#8B949E" }}>{error}</p>
          </div>
        )}

        {/* ── Dataset badge row ── */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium"
            style={{
              background: "rgba(218,54,51,0.07)",
              border: "1px solid rgba(218,54,51,0.25)",
              color: "#F87171",
            }}>
            <span className="h-1.5 w-1.5 rounded-full pulse-red" style={{ background: "#DA3633" }} />
            salesmonthly.csv
          </span>
          {data && (
            <span className="text-[11px]" style={{ color: "#6E7681" }}>
              {data.meta.months} months · {data.meta.dateRange.from} → {data.meta.dateRange.to}
            </span>
          )}
        </div>

        {/* ── KPI Row ── */}
        <EDAKPISection
          kpis={data?.kpis ?? null}
          dateRange={data?.meta.dateRange}
          months={data?.meta.months}
        />

        {/* ── Demand Trend Chart ── */}
        <SectionCard
          title="Monthly Demand Trend"
          subtitle="Time Series · All Drugs Combined"
          accentColor="#DA3633"
          badge={
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium"
              style={{
                background: "rgba(218,54,51,0.08)",
                border: "1px solid rgba(218,54,51,0.2)",
                color: "#F87171",
              }}>
              69 mo
            </span>
          }
        >
          <p className="mb-4 text-xs" style={{ color: "#6E7681" }}>
            Total monthly sales across all 8 ATC drug categories
          </p>
          {data ? (
            <SalesTrendChart data={data.charts.trend} />
          ) : (
            <ChartSkeleton height="h-72" />
          )}
        </SectionCard>

        {/* ── Top Drugs + Monthly Distribution ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Top 5 Drugs bar */}
          <SectionCard
            title="Top 5 Drug Classes by Sales"
            subtitle="Bar Chart · Total Volume"
            accentColor="#F78166"
            badge={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium"
                style={{
                  background: "rgba(247,129,102,0.08)",
                  border: "1px solid rgba(247,129,102,0.2)",
                  color: "#F78166",
                }}>
                Top 5
              </span>
            }
          >
            <p className="mb-4 text-xs" style={{ color: "#6E7681" }}>
              Ranked by aggregate sales across the entire dataset
            </p>
            {data ? (
              <DrugSalesBarChart data={data.charts.topDrugs} />
            ) : (
              <ChartSkeleton height="h-64" />
            )}
          </SectionCard>

          {/* Monthly seasonality */}
          <SectionCard
            title="Seasonal Distribution"
            subtitle="Monthly Avg · Jan–Dec"
            accentColor="#58A6FF"
          >
            <p className="mb-4 text-xs" style={{ color: "#6E7681" }}>
              Average total sales per calendar month (seasonality pattern)
            </p>
            {data ? (
              <MonthlyDistributionChart data={data.charts.monthly} />
            ) : (
              <ChartSkeleton height="h-48" />
            )}

            {/* Peak / Low markers */}
            {data && peakMonth && lowestMonth && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{
                  background: "rgba(218,54,51,0.06)",
                  border: "1px solid rgba(218,54,51,0.18)",
                }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#6E7681" }}>Peak Month</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "#F87171" }}>{peakMonth.month}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6E7681" }}>
                    {peakMonth.avgSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} avg
                  </p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{
                  background: "rgba(88,166,255,0.06)",
                  border: "1px solid rgba(88,166,255,0.18)",
                }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#6E7681" }}>Lowest Month</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "#58A6FF" }}>{lowestMonth.month}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6E7681" }}>
                    {lowestMonth.avgSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} avg
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── EDA Insights Panel ── */}
        {data && (
          <div className="chart-card relative overflow-hidden p-6">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
              style={{ background: "linear-gradient(90deg, #F78166 0%, transparent 70%)" }}
            />
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: "#6E7681" }}>
                  Dataset Insights
                </p>
                <h2 className="text-[15px] font-semibold" style={{ color: "#E6EDF3" }}>EDA Summary</h2>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{
                background: "rgba(63,185,80,0.08)",
                border: "1px solid rgba(63,185,80,0.2)",
                color: "#3FB950",
              }}>
                Live Data
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InsightPill
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                label="Dataset Months" value={`${data.meta.months} months`} color="#DA3633"
              />
              <InsightPill
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" /></svg>}
                label="Date Range" value={`${data.meta.dateRange.from} – ${data.meta.dateRange.to}`} color="#58A6FF"
              />
              <InsightPill
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z" strokeLinecap="round" /></svg>}
                label="Top Drug Class" value={data.kpis.topDrug} color="#F78166"
              />
              <InsightPill
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" strokeLinecap="round" /></svg>}
                label="Drug Categories" value={`${data.kpis.totalDrugs} ATC classes`} color="#A78BFA"
              />
              <InsightPill
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M12 20V10M18 20V4M6 20v-4" strokeLinecap="round" /></svg>}
                label="Peak Season" value={peakMonth ? `${peakMonth.month} (highest avg)` : "—"} color="#3FB950"
              />
              <InsightPill
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>}
                label="Avg Monthly Sales" value={data.kpis.avgMonthlySales.toLocaleString(undefined, { maximumFractionDigits: 0 })} color="#FBBF24"
              />
            </div>

            {/* EDA narrative */}
            <div className="mt-5 rounded-xl p-4" style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6E7681" }}>
                Dataset Overview
              </p>
              <ul className="space-y-2.5 text-sm" style={{ color: "#8B949E" }}>
                <li className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#DA3633" }} />
                  <span>
                    <strong style={{ color: "#E6EDF3" }}>{data.kpis.topDrug}</strong> dominates total
                    volume with the highest aggregate sales across all {data.meta.months} months.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#58A6FF" }} />
                  <span>
                    Sales peak in <strong style={{ color: "#E6EDF3" }}>{peakMonth?.month}</strong> and
                    are lowest in <strong style={{ color: "#E6EDF3" }}>{lowestMonth?.month}</strong>,
                    indicating clear seasonal demand patterns.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#3FB950" }} />
                  <span>
                    Average monthly combined sales across all drug classes:{" "}
                    <strong style={{ color: "#E6EDF3" }}>
                      {data.kpis.avgMonthlySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </strong>{" "}
                    units.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            INVENTORY INTELLIGENCE — Systems 1, 2 & 3
        ════════════════════════════════════════════════════════════════ */}

        {/* ── Alert summary strip ── */}
        {activeAlerts.filter((a) => !dismissedAlertIds.has(a.id)).length > 0 && (
          <div
            className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
            style={{
              background: "rgba(218,54,51,0.05)",
              border: "1px solid rgba(218,54,51,0.2)",
            }}
          >
            <span className="h-2 w-2 rounded-full pulse-red" style={{ background: "#DA3633" }} />
            <span className="text-sm font-medium" style={{ color: "#F87171" }}>
              {activeAlerts.filter((a) => !dismissedAlertIds.has(a.id) && a.severity === "critical").length} critical ·{" "}
              {activeAlerts.filter((a) => !dismissedAlertIds.has(a.id) && a.severity === "medium").length} medium alerts active
            </span>
            <button
              onClick={() => setShowAlertTray(true)}
              className="ml-auto text-xs font-medium px-3 py-1 rounded-lg transition-colors"
              style={{
                background: "rgba(218,54,51,0.1)",
                border: "1px solid rgba(218,54,51,0.25)",
                color: "#F87171",
              }}
            >
              View Alerts →
            </button>
          </div>
        )}

        {/* ── Reorder Planner (inline panel) ── */}
        {showReorderPlanner && (
          <ReorderPlanner
            rows={inventoryRows}
            onClose={() => setShowReorderPlanner(false)}
            simulatedOrders={simulatedOrders}
            onSimulateOrder={handleSimulateOrder}
          />
        )}

        {/* ── Feature 1 + Inventory Intelligence (2-col layout) ── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">

          {/* Left: Inventory Intelligence Table */}
          <SectionCard
            title="Inventory Intelligence"
            subtitle="Real-Time Stock Monitor · 10 Products"
            accentColor="#FBBF24"
            badge={
              <div className="flex items-center gap-2">
                {visibleAlertCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                    style={{
                      background: "rgba(248,81,73,0.1)",
                      border: "1px solid rgba(248,81,73,0.25)",
                      color: "#F85149",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#F85149" }} />
                    {visibleAlertCount} alert{visibleAlertCount !== 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={() => setShowReorderPlanner((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
                  style={{
                    background: showReorderPlanner ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.25)",
                    color: "#FBBF24",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {showReorderPlanner ? "Hide Planner" : "Reorder Planner"}
                </button>
              </div>
            }
          >
            <p className="mb-4 text-xs" style={{ color: "#6E7681" }}>
              Click any row to expand product details &amp; demand insights · Bell = Alerts · Calendar = Reorder Planner
            </p>
            <InventoryTable
              rows={inventoryRows}
              simulatedOrders={simulatedOrders}
              explainabilityMap={explainabilityMap}
            />
          </SectionCard>

          {/* Right: Feature 1 — Recommendation Widget */}
          <div className="flex flex-col gap-4">
            <RecommendationWidget inventoryRows={inventoryRows} />

            {/* Context hint card */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(145deg,rgba(18,22,30,0.92),rgba(10,14,20,0.88))",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wider mb-2"
                style={{ color: "#6E7681" }}
              >
                How it works
              </p>
              <ul className="space-y-1.5 text-xs" style={{ color: "#8B949E" }}>
                <li className="flex items-start gap-2">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#FBBF24" }} />
                  Select a drug category from the dropdown above.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#FBBF24" }} />
                  The engine uses supplier lead time &amp; safety buffer to compute the order deadline.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#FBBF24" }} />
                  Card color signals urgency — red = today, orange = 3 days, green = this week.
                </li>
              </ul>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
