"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Cell,
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
    "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
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
        setLoading(true);
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
            <div className="p-6 lg:p-8 space-y-6">
                {/* Region Filter */}
                <div className="glass-card p-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Region</label>
                    <div className="flex gap-2 flex-wrap">
                        {REGIONS.map((r) => (
                            <button
                                key={r}
                                onClick={() => setSelectedRegion(r)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${selectedRegion === r
                                        ? "bg-indigo-600 text-white"
                                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner text="Loading location data..." />
                ) : (
                    <>
                        {/* Regional Demand Bar Chart */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-1">
                                {selectedRegion === "All Regions" ? "Demand by Region" : `${selectedRegion} - District Demand`}
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">
                                {selectedRegion === "All Regions"
                                    ? "Total pharmaceutical demand across all regions"
                                    : `Demand distribution across districts in ${selectedRegion}`}
                            </p>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    {selectedRegion === "All Regions" ? (
                                        <BarChart data={regionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="region"
                                                tick={{ fontSize: 11, fill: "#64748b" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                                            />
                                            <Bar dataKey="demand" radius={[8, 8, 0, 0]} name="Total Demand">
                                                {regionChartData.map((_, i) => (
                                                    <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <BarChart data={data.map((d) => ({ district: d.district, demand: d.totalDemand }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="district"
                                                tick={{ fontSize: 11, fill: "#64748b" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                                            />
                                            <Bar dataKey="demand" fill="#4f46e5" radius={[8, 8, 0, 0]} name="Demand" />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* District-level detail cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {data.map((d) => (
                                <div key={`${d.region}-${d.district}`} className="glass-card p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{d.district}</p>
                                            <p className="text-xs text-slate-500">{d.region}</p>
                                        </div>
                                        <span className="text-lg font-bold text-indigo-600">{d.totalDemand.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {d.drugs.slice(0, 4).map((drug) => (
                                            <div key={drug.drug} className="flex items-center justify-between">
                                                <span className="text-xs text-slate-600">{drug.drug}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full"
                                                            style={{ width: `${(drug.demand / d.totalDemand) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-700 w-8 text-right">{drug.demand}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
