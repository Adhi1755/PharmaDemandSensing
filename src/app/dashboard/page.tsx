"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import EDAKPISection from "@/components/dashboard/EDAKPISection";

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

// ── Main page ────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <Navbar title="EDA Dashboard" subtitle="Sales analytics · salesmonthly dataset" />

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
      </main>
    </>
  );
}
