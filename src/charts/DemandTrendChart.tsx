"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { FALLBACK_DEMAND_TREND, type DemandTrendPoint } from "@/charts/chart-fallbacks";

export default function DemandTrendChart({ data, isFallback = false }: { data: DemandTrendPoint[]; isFallback?: boolean }) {
    // Always render something — never blank
    const chartData = data.length > 0 ? data : FALLBACK_DEMAND_TREND;
    // Blue for real data, amber for estimated
    const lineColor = isFallback ? "#FBBF24" : "#58A6FF";
    const gradientId = isFallback ? "demandGradientFallback" : "demandGradientReal";

    return (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
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
                        tickFormatter={(v) => v.toLocaleString()}
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
                    <Area
                        type="monotone"
                        dataKey="demand"
                        stroke={lineColor}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        dot={false}
                        name="Demand"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
