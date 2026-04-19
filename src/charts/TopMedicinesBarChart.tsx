"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { FALLBACK_TOP_MEDICINES, type MedicineDemandPoint } from "@/charts/chart-fallbacks";

// Gradient colors for top-5 bars — distinct, not all-red
const BAR_COLORS = ["#DA3633", "#58A6FF", "#3FB950", "#F78166", "#D2A8FF"];

export default function TopMedicinesBarChart({ data }: { data: MedicineDemandPoint[] }) {
    // Sort by demand desc, take top 5, always show something
    const sorted = [...(data.length > 0 ? data : FALLBACK_TOP_MEDICINES)]
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 5);

    return (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                        type="number"
                        tick={{ fill: "#8B949E", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => v.toLocaleString()}
                    />
                    <YAxis
                        type="category"
                        dataKey="medicine"
                        tick={{ fill: "#8B949E", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
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
                    <Bar dataKey="demand" radius={[0, 5, 5, 0]} barSize={18}>
                        {sorted.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={BAR_COLORS[index % BAR_COLORS.length]}
                                fillOpacity={0.85}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
