"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getInventory } from "@/lib/api";

interface InventoryItem {
    id: number;
    name: string;
    category: string;
    currentStock: number;
    predictedDemand: number;
    safetyStock: number;
    suggestedReorder: number;
    status: string;
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        getInventory().then(setInventory).finally(() => setLoading(false));
    }, []);

    const filtered =
        filter === "all" ? inventory : inventory.filter((i) => i.status.toLowerCase() === filter);

    const statusStyle: Record<string, string> = {
        Critical: "bg-red-100 text-red-700",
        Low: "bg-amber-100 text-amber-700",
        Adequate: "bg-emerald-100 text-emerald-700",
    };

    const criticalCount = inventory.filter((i) => i.status === "Critical").length;
    const lowCount = inventory.filter((i) => i.status === "Low").length;

    return (
        <>
            <Navbar title="Inventory Optimization" subtitle="Stock levels and reorder suggestions" />
            <div className="p-6 lg:p-8 space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card p-5">
                        <p className="text-sm text-slate-500">Total SKUs</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{inventory.length}</p>
                    </div>
                    <div className="glass-card p-5">
                        <p className="text-sm text-slate-500">Critical Stock Items</p>
                        <p className="text-3xl font-bold text-red-600 mt-1">{criticalCount}</p>
                    </div>
                    <div className="glass-card p-5">
                        <p className="text-sm text-slate-500">Low Stock Items</p>
                        <p className="text-3xl font-bold text-amber-600 mt-1">{lowCount}</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    {["all", "critical", "low", "adequate"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${filter === f
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {f === "all" ? "All Items" : f}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="glass-card overflow-hidden">
                    {loading ? (
                        <LoadingSpinner text="Loading inventory..." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Drug Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Predicted Demand</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Safety Stock</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Qty</th>
                                        <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-slate-50/50 transition-colors ${item.status === "Critical" ? "bg-red-50/30" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">{item.currentStock}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">{item.predictedDemand}</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-600">{item.safetyStock}</td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-indigo-600">
                                                {item.suggestedReorder > 0 ? `+${item.suggestedReorder}` : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${statusStyle[item.status] || "bg-slate-100 text-slate-600"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
