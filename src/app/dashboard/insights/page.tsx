"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getLocationInsights } from "@/lib/api";

interface LocationData {
    region: string;
    district: string;
    totalDemand: number;
    drugs: { drug: string; demand: number }[];
}

const REGION_COLORS = [
    "#FF0000", "#C00018", "#E0E2E4", "#000000", "#FF0000", "#C00018",
];

const REGIONS = [
    "All Regions", "North Zone", "South Zone", "East Zone",
    "West Zone", "Central Zone", "Northeast Zone",
];

export default function InsightsPage() {
    const [data, setData] = useState<LocationData[]>([]);
    const [selectedRegion, setSelectedRegion] = useState("All Regions");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const region = selectedRegion === "All Regions" ? undefined : selectedRegion;
        getLocationInsights(region).then(setData).finally(() => setLoading(false));
    }, [selectedRegion]);

    const regionSummary = data.reduce<Record<string, number>>((acc, d) => {
        acc[d.region] = (acc[d.region] || 0) + d.totalDemand;
        return acc;
    }, {});

    const regionChartData = Object.entries(regionSummary).map(([region, demand]) => ({
        region,
        demand,
    }));

    return (
        <>
            <Navbar title="Location Insights" subtitle="Regional demand variation analysis" />
            <div className="p-0">
                <div className="border border-[rgba(255,255,255,0.08)] bg-[#1D1E27]">
                {/* Region Filter */}
                <section className="p-6 border-b border-[rgba(255,255,255,0.08)] dashboard-card scroll-section">
                    <label className="block text-sm font-medium text-[rgba(224,226,228,0.86)] mb-2">Filter by Region</label>
                    <div className="flex gap-0 flex-wrap border border-[rgba(255,255,255,0.08)]">
                        {REGIONS.map((r) => (
                            <button
                                key={r}
                                onClick={() => {
                                    setLoading(true);
                                    setSelectedRegion(r);
                                }}
                                className={`px-4 py-2 border-r border-b border-[rgba(255,255,255,0.08)] text-sm font-semibold transition-colors gsap-btn ${selectedRegion === r
                                        ? "bg-[var(--color-deep-red)] text-[var(--color-light-gray)]"
                                        : "bg-[rgba(29,30,39,0.6)] text-[rgba(224,226,228,0.78)] hover:bg-[rgba(255,0,0,0.16)]"
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </section>

                {loading ? (
                    <LoadingSpinner text="Loading location data..." />
                ) : (
                    <>
                        {/* Regional Demand Bar Chart */}
                        <section className="p-6 border-b border-[rgba(255,255,255,0.08)] dashboard-card chart-section">
                            <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">
                                {selectedRegion === "All Regions" ? "Demand by Region" : `${selectedRegion} - District Demand`}
                            </h2>
                            <p className="text-sm text-[rgba(224,226,228,0.72)] mb-6">
                                {selectedRegion === "All Regions"
                                    ? "Total pharmaceutical demand across all regions"
                                    : `Demand distribution across districts in ${selectedRegion}`}
                            </p>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    {selectedRegion === "All Regions" ? (
                                        <BarChart data={regionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(224,226,228,0.16)" />
                                            <XAxis
                                                dataKey="region"
                                                tick={{ fontSize: 11, fill: "#E0E2E4" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: "#E0E2E4" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: "1px solid rgba(224,226,228,0.18)", fontSize: 13, backgroundColor: "#000000", color: "#E0E2E4" }}
                                            />
                                            <Bar dataKey="demand" radius={[0, 0, 0, 0]} name="Total Demand">
                                                {regionChartData.map((_, i) => (
                                                    <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <BarChart data={data.map((d) => ({ district: d.district, demand: d.totalDemand }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(224,226,228,0.16)" />
                                            <XAxis
                                                dataKey="district"
                                                tick={{ fontSize: 11, fill: "#E0E2E4" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: "#E0E2E4" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: "1px solid rgba(224,226,228,0.18)", fontSize: 13, backgroundColor: "#000000", color: "#E0E2E4" }}
                                            />
                                            <Bar dataKey="demand" fill="#C00018" radius={[0, 0, 0, 0]} name="Demand" />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* District-level detail cards */}
                        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 scroll-section">
                            {data.map((d) => (
                                <div key={`${d.region}-${d.district}`} className="p-5 border-r border-b border-[rgba(255,255,255,0.08)] dashboard-card">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--color-light-gray)]">{d.district}</p>
                                            <p className="text-xs text-[rgba(224,226,228,0.72)]">{d.region}</p>
                                        </div>
                                        <span className="text-lg font-bold text-[var(--color-primary)]">{d.totalDemand.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {d.drugs.slice(0, 4).map((drug) => (
                                            <div key={drug.drug} className="flex items-center justify-between">
                                                <span className="text-xs text-[rgba(224,226,228,0.8)]">{drug.drug}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-[rgba(224,226,228,0.16)] overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--color-primary)]"
                                                            style={{ width: `${(drug.demand / d.totalDemand) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-[var(--color-light-gray)] w-8 text-right">{drug.demand}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </section>
                    </>
                )}
                </div>
            </div>
        </>
    );
}
