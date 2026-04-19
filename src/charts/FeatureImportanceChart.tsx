"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { FALLBACK_FEATURE_IMPORTANCE, type FeaturePoint } from "@/charts/chart-fallbacks";

export default function FeatureImportanceChart({ data }: { data: FeaturePoint[] }) {
    const chartData = data.length > 0 ? data : FALLBACK_FEATURE_IMPORTANCE;

    return (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fill: "#8B949E", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "rgba(13,17,23,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#C9D1D9",
                        }}
                    />
                    <Bar dataKey="importance" fill="#A371F7" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
