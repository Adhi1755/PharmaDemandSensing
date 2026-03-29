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
                <div className="flex gap-3 flex-wrap scroll-section">
                    {data.map((d, i) => (
                        <button
                            key={d.drug}
                            onClick={() => setSelectedDrug(i)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all gsap-btn ${selectedDrug === i
                                    ? "bg-[var(--color-deep-red)] text-[var(--color-light-gray)] shadow-md"
                                    : "bg-[rgba(75,78,83,0.72)] text-[rgba(224,226,228,0.78)] border border-[rgba(224,226,228,0.14)] hover:bg-[rgba(255,0,0,0.16)]"
                                }`}
                        >
                            {d.drug}
                        </button>
                    ))}
                </div>

                {current && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 scroll-section">
                            <div className="glass-card p-5 text-center dashboard-card">
                                <p className="text-sm text-[rgba(224,226,228,0.72)]">Intermittency Rate</p>
                                <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">{current.intermittencyRate}%</p>
                                <p className="text-xs text-[rgba(224,226,228,0.62)]">of days with zero demand</p>
                            </div>
                            <div className="glass-card p-5 text-center dashboard-card">
                                <p className="text-sm text-[rgba(224,226,228,0.72)]">Zero-Demand Days</p>
                                <p className="text-2xl font-bold text-[var(--color-light-gray)] mt-1">{current.zeroDays} / {current.totalDays}</p>
                                <p className="text-xs text-[rgba(224,226,228,0.62)]">days observed</p>
                            </div>
                            <div className="glass-card p-5 text-center dashboard-card">
                                <p className="text-sm text-[rgba(224,226,228,0.72)]">Demand Spikes</p>
                                <p className="text-2xl font-bold text-[var(--color-deep-red)] mt-1">{current.spikeCount}</p>
                                <p className="text-xs text-[rgba(224,226,228,0.62)]">above threshold</p>
                            </div>
                            <div className="glass-card p-5 text-center dashboard-card">
                                <p className="text-sm text-[rgba(224,226,228,0.72)]">Avg Non-Zero Demand</p>
                                <p className="text-2xl font-bold text-[var(--color-light-gray)] mt-1">{avgDemand}</p>
                                <p className="text-xs text-[rgba(224,226,228,0.62)]">units/day</p>
                            </div>
                        </div>

                        {/* Demand Pattern Chart */}
                        <div className="glass-card p-6 dashboard-card chart-section">
                            <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">
                                {current.drug} - Demand Pattern
                            </h2>
                            <p className="text-sm text-[rgba(224,226,228,0.72)] mb-6">
                                60-day historical demand showing intermittent patterns, zero-demand gaps, and spikes
                            </p>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={current.history}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(224,226,228,0.16)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: "#E0E2E4" }}
                                            tickFormatter={(v) => v.slice(8)}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={2}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "#E0E2E4" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: "1px solid rgba(224,226,228,0.18)", fontSize: 13, backgroundColor: "#4B4E53", color: "#E0E2E4" }}
                                            labelFormatter={(label) => `Date: ${label}`}
                                        />
                                        <ReferenceLine
                                            y={spikeThreshold}
                                            stroke="#FF0000"
                                            strokeDasharray="6 3"
                                            strokeWidth={1.5}
                                            label={{ value: "Spike Threshold", position: "right", fill: "#FF0000", fontSize: 11 }}
                                        />
                                        <ReferenceLine
                                            y={avgDemand}
                                            stroke="#E0E2E4"
                                            strokeDasharray="3 3"
                                            label={{ value: "Avg", position: "right", fill: "#E0E2E4", fontSize: 11 }}
                                        />
                                        <Bar dataKey="demand" name="Demand" radius={[3, 3, 0, 0]}>
                                            {current.history.map((h, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={
                                                        h.demand === 0
                                                            ? "#4B4E53"
                                                            : h.demand > spikeThreshold
                                                                ? "#FF0000"
                                                                : "#C00018"
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-[var(--color-deep-red)]"></div>
                                    <span className="text-xs text-[rgba(224,226,228,0.8)]">Normal demand</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-[var(--color-primary)]"></div>
                                    <span className="text-xs text-[rgba(224,226,228,0.8)]">Demand spike</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-[var(--color-dark-gray)]"></div>
                                    <span className="text-xs text-[rgba(224,226,228,0.8)]">Zero demand</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
