"use client";

import { useEffect, useState } from "react";
import {
    Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, ComposedChart, Legend,
} from "recharts";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getDrugs, getForecast } from "@/lib/api";

interface Drug {
    id: number;
    name: string;
    category: string;
}

interface ForecastData {
    drug: string;
    horizon: number;
    historical: { date: string; demand: number }[];
    forecast: { date: string; predicted: number; lower_bound: number; upper_bound: number }[];
}

export default function ForecastPage() {
    const [drugs, setDrugs] = useState<Drug[]>([]);
    const [selectedDrug, setSelectedDrug] = useState("Paracetamol");
    const [horizon, setHorizon] = useState(7);
    const [data, setData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDrugs().then(setDrugs);
    }, []);

    useEffect(() => {
        getForecast(selectedDrug, horizon)
            .then(setData)
            .finally(() => setLoading(false));
    }, [selectedDrug, horizon]);

    const chartData = data
        ? [
            ...data.historical.map((h) => ({
                date: h.date,
                historical: h.demand,
                predicted: null as number | null,
                lower: null as number | null,
                upper: null as number | null,
            })),
            ...data.forecast.map((f) => ({
                date: f.date,
                historical: null as number | null,
                predicted: f.predicted,
                lower: f.lower_bound,
                upper: f.upper_bound,
            })),
        ]
        : [];

    return (
        <>
            <Navbar title="Demand Forecast" subtitle="Historical and predicted demand analysis" />
            <div className="min-h-full bg-black p-0">
                <div className="scroll-section border border-[rgba(255,255,255,0.12)] bg-[#000000]">
                    {/* Controls */}
                    <section className="p-6 border-b border-[rgba(255,255,255,0.12)]">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-0 border border-[rgba(255,255,255,0.12)]">
                            <div className="sm:col-span-9 p-4 border-b sm:border-b-0 sm:border-r border-[rgba(255,255,255,0.12)]">
                                <label className="block text-sm font-medium text-[rgba(191,191,191,1)] mb-1.5">Select Drug</label>
                                <select
                                    value={selectedDrug}
                                    onChange={(e) => {
                                        setLoading(true);
                                        setSelectedDrug(e.target.value);
                                    }}
                                    className="w-full px-3 py-2.5 bg-[rgba(13,15,18,0.72)] border border-[rgba(255,255,255,0.12)] text-[var(--color-light-gray)] text-sm outline-none"
                                >
                                    {drugs.map((d) => (
                                        <option key={d.id} value={d.name}>{d.name} ({d.category})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-3 p-4">
                                <label className="block text-sm font-medium text-[rgba(191,191,191,1)] mb-1.5">Forecast Horizon</label>
                                <div className="grid grid-cols-2 gap-0 border border-[rgba(255,255,255,0.12)]">
                                    {[7, 30].map((h) => (
                                        <button
                                            key={h}
                                            onClick={() => {
                                                setLoading(true);
                                                setHorizon(h);
                                            }}
                                            className={`py-2.5 text-sm font-semibold border-r last:border-r-0 border-[rgba(255,255,255,0.12)] transition-colors gsap-btn ${horizon === h
                                                    ? "bg-[var(--color-deep-red)] text-[var(--color-light-gray)]"
                                                    : "bg-[rgba(13,15,18,0.72)] text-[rgba(191,191,191,1)] hover:bg-[rgba(255,0,0,0.16)]"
                                                }`}
                                        >
                                            {h} Days
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                {/* Chart */}
                <section className="p-6 border-b border-[rgba(255,255,255,0.12)] dashboard-card chart-section">
                    <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">
                        {selectedDrug} - Demand Forecast
                    </h2>
                    <p className="text-sm text-[rgba(191,191,191,1)] mb-6">
                        Historical demand (90 days) and {horizon}-day forecast with confidence intervals
                    </p>

                    {loading ? (
                        <LoadingSpinner text="Loading forecast..." />
                    ) : (
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <defs>
                                        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#FF0000" stopOpacity={0.04} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: "#FFFFFF" }}
                                        tickFormatter={(v) => v.slice(5)}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#FFFFFF" }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: "Units", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#FFFFFF" } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            backgroundColor: "#000000",
                                            fontSize: 13,
                                            color: "#FFFFFF",
                                        }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Area
                                        type="monotone"
                                        dataKey="upper"
                                        stroke="none"
                                        fill="url(#confGrad)"
                                        name="Upper Bound"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lower"
                                        stroke="none"
                                        fill="#000000"
                                        name="Lower Bound"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="historical"
                                        stroke="#FFFFFF"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Historical"
                                        connectNulls={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        stroke="#FF0000"
                                        strokeWidth={2.5}
                                        strokeDasharray="6 3"
                                        dot={{ r: 3, fill: "#FF0000" }}
                                        name="Predicted"
                                        connectNulls={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>

                {/* Forecast Summary */}
                {data && (
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-0 scroll-section">
                        <div className="p-5 text-center border-r border-b sm:border-b-0 border-[rgba(255,255,255,0.12)] dashboard-card">
                            <p className="text-sm text-[rgba(191,191,191,1)] mb-1">Avg Predicted Demand</p>
                            <p className="text-2xl font-bold text-[var(--color-primary)]">
                                {Math.round(data.forecast.reduce((s, f) => s + f.predicted, 0) / data.forecast.length)}
                            </p>
                            <p className="text-xs text-[rgba(128,128,128,1)] mt-1">units/day</p>
                        </div>
                        <div className="p-5 text-center border-r border-b sm:border-b-0 border-[rgba(255,255,255,0.12)] dashboard-card">
                            <p className="text-sm text-[rgba(191,191,191,1)] mb-1">Total Forecast</p>
                            <p className="text-2xl font-bold text-[var(--color-deep-red)]">
                                {data.forecast.reduce((s, f) => s + f.predicted, 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-[rgba(128,128,128,1)] mt-1">units over {horizon} days</p>
                        </div>
                        <div className="p-5 text-center dashboard-card">
                            <p className="text-sm text-[rgba(191,191,191,1)] mb-1">Forecast Range</p>
                            <p className="text-2xl font-bold text-[var(--color-light-gray)]">
                                {Math.min(...data.forecast.map(f => f.lower_bound))} - {Math.max(...data.forecast.map(f => f.upper_bound))}
                            </p>
                            <p className="text-xs text-[rgba(128,128,128,1)] mt-1">confidence interval</p>
                        </div>
                    </section>
                )}
                </div>
            </div>
        </>
    );
}
