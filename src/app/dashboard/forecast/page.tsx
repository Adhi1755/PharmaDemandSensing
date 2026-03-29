"use client";

import { useEffect, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart, ComposedChart, Legend,
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
        setLoading(true);
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
            <div className="p-6 lg:p-8 space-y-6">
                {/* Controls */}
                <div className="glass-card p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Drug</label>
                            <select
                                value={selectedDrug}
                                onChange={(e) => setSelectedDrug(e.target.value)}
                                className="input-field"
                            >
                                {drugs.map((d) => (
                                    <option key={d.id} value={d.name}>{d.name} ({d.category})</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-48">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Forecast Horizon</label>
                            <div className="flex rounded-xl overflow-hidden border border-slate-200">
                                {[7, 30].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => setHorizon(h)}
                                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${horizon === h
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {h} Days
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">
                        {selectedDrug} - Demand Forecast
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
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
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                                        tickFormatter={(v) => v.slice(5)}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: "Units", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#94a3b8" } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid #e2e8f0",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                            fontSize: 13,
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
                                        fill="white"
                                        name="Lower Bound"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="historical"
                                        stroke="#4f46e5"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Historical"
                                        connectNulls={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        stroke="#06b6d4"
                                        strokeWidth={2.5}
                                        strokeDasharray="6 3"
                                        dot={{ r: 3, fill: "#06b6d4" }}
                                        name="Predicted"
                                        connectNulls={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Forecast Summary */}
                {data && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-card p-5 text-center">
                            <p className="text-sm text-slate-500 mb-1">Avg Predicted Demand</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {Math.round(data.forecast.reduce((s, f) => s + f.predicted, 0) / data.forecast.length)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">units/day</p>
                        </div>
                        <div className="glass-card p-5 text-center">
                            <p className="text-sm text-slate-500 mb-1">Total Forecast</p>
                            <p className="text-2xl font-bold text-cyan-600">
                                {data.forecast.reduce((s, f) => s + f.predicted, 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">units over {horizon} days</p>
                        </div>
                        <div className="glass-card p-5 text-center">
                            <p className="text-sm text-slate-500 mb-1">Forecast Range</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {Math.min(...data.forecast.map(f => f.lower_bound))} - {Math.max(...data.forecast.map(f => f.upper_bound))}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">confidence interval</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
