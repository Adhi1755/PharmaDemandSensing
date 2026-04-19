"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { FALLBACK_MONTHLY_SALES, type SalesTrendPoint } from "@/charts/chart-fallbacks";

export default function MonthlySalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
    const chartData = data.length > 0 ? data : FALLBACK_MONTHLY_SALES;

    return (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{
                            background: "rgba(13,17,23,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#C9D1D9",
                        }}
                    />
                    <Bar dataKey="sales" fill="#58A6FF" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
