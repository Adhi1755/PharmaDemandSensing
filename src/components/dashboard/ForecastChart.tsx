"use client";

import {
    Line, LineChart, ResponsiveContainer, Tooltip,
    XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import type { ForecastChartPoint } from "@/lib/dashboard-data";
import { FALLBACK_FORECAST_COMPARISON } from "@/charts/chart-fallbacks";

interface ForecastChartProps {
    data: ForecastChartPoint[];
    status: "success" | "failed" | "fallback" | "loading";
    modelName?: string;
    message?: string;
}

function ChartSkeleton() {
    return (
        <div className="glass-card p-6">
            <div className="skeleton h-4 w-40 mb-2" />
            <div className="skeleton h-3 w-56 mb-6" />
            <div className="skeleton h-80 w-full rounded-xl" />
        </div>
    );
}

export default function ForecastChart({ data, status, modelName, message }: ForecastChartProps) {
    if (status === "loading") {
        return <ChartSkeleton />;
    }

    // Always use real data if available — fall back to static demo data, never blank
    const hasData = data.some((p) => (p.actual ?? 0) > 0 || (p.predicted ?? 0) > 0);
    const chartData = hasData ? data : FALLBACK_FORECAST_COMPARISON;
    const isFallback = status === "fallback" || status === "failed" || !hasData;
    const predictedColor = isFallback ? "#FBBF24" : "#DA3633";

    const modelLabel =
        modelName === "lstm"
            ? "LSTM Neural Network"
            : isFallback
                ? "Trend-based estimate"
                : "Predictive Model";

    return (
        <div className="glass-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                        {isFallback ? "Estimated Demand Trend" : "Demand Forecast"}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {modelLabel} — forecast vs actuals
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {isFallback && (
                        <span className="fallback-badge">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24]" />
                            Estimated values
                        </span>
                    )}
                    {message && status === "failed" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[rgba(248,81,73,0.08)] border border-[rgba(248,81,73,0.18)] text-[#F85149]">
                            {message}
                        </span>
                    )}
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: "#8B949E", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fill: "#8B949E", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "rgba(13,17,23,0.97)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: 12,
                                color: "#C9D1D9",
                                fontSize: 13,
                            }}
                        />
                        <Legend wrapperStyle={{ color: "#8B949E", fontSize: 12, paddingTop: 12 }} />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#58A6FF"
                            strokeWidth={2}
                            dot={false}
                            name="Actual"
                            connectNulls={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke={predictedColor}
                            strokeWidth={2.2}
                            strokeDasharray={isFallback ? "6 4" : "5 5"}
                            dot={false}
                            name={isFallback ? "Estimated" : "Predicted"}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
