"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import {
    FALLBACK_FORECAST_COMPARISON,
    hasAnyForecastValue,
    type ForecastPoint,
} from "@/charts/chart-fallbacks";

interface ForecastComparisonChartProps {
    data: ForecastPoint[];
    isFallback?: boolean;
}

export default function ForecastComparisonChart({ data, isFallback = false }: ForecastComparisonChartProps) {
    // Always render something — fall back to static demo data if empty
    const chartData = hasAnyForecastValue(data) ? data : FALLBACK_FORECAST_COMPARISON;
    // Use amber for estimated/fallback lines, red accent for real LSTM predictions
    const predictedColor = isFallback ? "#FBBF24" : "#DA3633";

    return (
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
    );
}
