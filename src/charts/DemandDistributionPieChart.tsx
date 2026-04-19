"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { FALLBACK_DEMAND_DISTRIBUTION, type DemandDistributionPoint } from "@/charts/chart-fallbacks";

const COLORS = ["#58A6FF", "#DA3633", "#3FB950", "#D29922", "#A371F7"];

export default function DemandDistributionPieChart({ data }: { data: DemandDistributionPoint[] }) {
    const chartData = data.length > 0 ? data : FALLBACK_DEMAND_DISTRIBUTION;

    return (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={3}
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            background: "rgba(13,17,23,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#C9D1D9",
                        }}
                    />
                    <Legend wrapperStyle={{ color: "#8B949E", fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
