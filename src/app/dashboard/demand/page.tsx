"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getIntermittentDemand } from "@/lib/api";

interface DrugDemand {
    drug: string;
    category: string;
    history: { date: string; demand: number }[];
    zeroDays: number;
    totalDays: number;
    intermittencyRate: number;
    spikeCount: number;
}

export default function DemandPage() {
    const [data, setData] = useState<DrugDemand[]>([]);
    const [selectedDrug, setSelectedDrug] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getIntermittentDemand().then(setData).finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner text="Loading demand patterns..." />;

    const current = data[selectedDrug];
    const avgDemand = current
        ? Math.round(
            current.history.filter((h) => h.demand > 0).reduce((s, h) => s + h.demand, 0) /
            current.history.filter((h) => h.demand > 0).length
        )
        : 0;
    const spikeThreshold = avgDemand * 2;

    return (
        <>
            <Navbar title="Intermittent Demand Patterns" subtitle="Visualizing sparse demand with zero-demand gaps and spikes" />
            <div className="p-6 lg:p-8 space-y-6">
                {/* Drug Selector */}
                <div className="flex gap-3 flex-wrap">
                    {data.map((d, i) => (
                        <button
                            key={d.drug}
                            onClick={() => setSelectedDrug(i)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedDrug === i
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {d.drug}
                        </button>
                    ))}
                </div>

                {current && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="glass-card p-5 text-center">
                                <p className="text-sm text-slate-500">Intermittency Rate</p>
                                <p className="text-2xl font-bold text-indigo-600 mt-1">{current.intermittencyRate}%</p>
                                <p className="text-xs text-slate-400">of days with zero demand</p>
                            </div>
                            <div className="glass-card p-5 text-center">
                                <p className="text-sm text-slate-500">Zero-Demand Days</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{current.zeroDays} / {current.totalDays}</p>
                                <p className="text-xs text-slate-400">days observed</p>
                            </div>
                            <div className="glass-card p-5 text-center">
                                <p className="text-sm text-slate-500">Demand Spikes</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">{current.spikeCount}</p>
                                <p className="text-xs text-slate-400">above threshold</p>
                            </div>
                            <div className="glass-card p-5 text-center">
                                <p className="text-sm text-slate-500">Avg Non-Zero Demand</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{avgDemand}</p>
                                <p className="text-xs text-slate-400">units/day</p>
                            </div>
                        </div>

                        {/* Demand Pattern Chart */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-1">
                                {current.drug} - Demand Pattern
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">
                                60-day historical demand showing intermittent patterns, zero-demand gaps, and spikes
                            </p>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={current.history}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                                            tickFormatter={(v) => v.slice(8)}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={2}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                                            labelFormatter={(label) => `Date: ${label}`}
                                        />
                                        <ReferenceLine
                                            y={spikeThreshold}
                                            stroke="#ef4444"
                                            strokeDasharray="6 3"
                                            strokeWidth={1.5}
                                            label={{ value: "Spike Threshold", position: "right", fill: "#ef4444", fontSize: 11 }}
                                        />
                                        <ReferenceLine
                                            y={avgDemand}
                                            stroke="#94a3b8"
                                            strokeDasharray="3 3"
                                            label={{ value: "Avg", position: "right", fill: "#94a3b8", fontSize: 11 }}
                                        />
                                        <Bar dataKey="demand" name="Demand" radius={[3, 3, 0, 0]}>
                                            {current.history.map((h, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={
                                                        h.demand === 0
                                                            ? "#e2e8f0"
                                                            : h.demand > spikeThreshold
                                                                ? "#ef4444"
                                                                : "#4f46e5"
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
                                    <span className="text-xs text-slate-600">Normal demand</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                                    <span className="text-xs text-slate-600">Demand spike</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
                                    <span className="text-xs text-slate-600">Zero demand</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
