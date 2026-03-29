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
        Critical: "bg-[rgba(255,0,0,0.18)] text-[var(--color-primary)]",
        Low: "bg-[rgba(255,77,77,0.2)] text-[var(--color-primary)]",
        Adequate: "bg-[rgba(255,255,255,0.12)] text-[var(--color-light-gray)]",
    };

    const criticalCount = inventory.filter((i) => i.status === "Critical").length;
    const lowCount = inventory.filter((i) => i.status === "Low").length;

    return (
        <>
            <Navbar title="Inventory Optimization" subtitle="Stock levels and reorder suggestions" />
            <div className="min-h-full bg-black p-0">
                <div className="border border-[rgba(255,255,255,0.12)] bg-[#000000]">
                {/* Summary cards */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-0 scroll-section border-b border-[rgba(255,255,255,0.12)]">
                    <div className="p-5 border-r border-b sm:border-b-0 border-[rgba(255,255,255,0.12)] dashboard-card">
                        <p className="text-sm text-[rgba(191,191,191,1)]">Total SKUs</p>
                        <p className="text-3xl font-bold text-[var(--color-light-gray)] mt-1">{inventory.length}</p>
                    </div>
                    <div className="p-5 border-r border-b sm:border-b-0 border-[rgba(255,255,255,0.12)] dashboard-card">
                        <p className="text-sm text-[rgba(191,191,191,1)]">Critical Stock Items</p>
                        <p className="text-3xl font-bold text-[var(--color-primary)] mt-1">{criticalCount}</p>
                    </div>
                    <div className="p-5 dashboard-card">
                        <p className="text-sm text-[rgba(191,191,191,1)]">Low Stock Items</p>
                        <p className="text-3xl font-bold text-[var(--color-deep-red)] mt-1">{lowCount}</p>
                    </div>
                </section>

                {/* Filter */}
                <section className="flex gap-0 flex-wrap scroll-section border-b border-[rgba(255,255,255,0.12)]">
                    {["all", "critical", "low", "adequate"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 border-r border-[rgba(255,255,255,0.12)] text-sm font-semibold transition-colors capitalize gsap-btn ${filter === f
                                    ? "bg-[var(--color-deep-red)] text-[var(--color-light-gray)]"
                                    : "bg-[rgba(0,0,0,0.72)] text-[rgba(191,191,191,1)] hover:bg-[rgba(255,0,0,0.16)]"
                                }`}
                        >
                            {f === "all" ? "All Items" : f}
                        </button>
                    ))}
                </section>

                {/* Table */}
                <section className="overflow-x-auto dashboard-card chart-section">
                    {loading ? (
                        <LoadingSpinner text="Loading inventory..." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[rgba(26,26,26,0.72)] border-b border-[rgba(255,255,255,0.12)]">
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider">Drug Name</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider">Category</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider">Current Stock</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider">Predicted Demand</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider">Safety Stock</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider">Reorder Qty</th>
                                        <th className="text-center px-6 py-4 text-xs font-semibold text-[rgba(191,191,191,1)] uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.12)]">
                                    {filtered.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-[rgba(255,0,0,0.08)] transition-colors ${item.status === "Critical" ? "bg-[rgba(255,0,0,0.08)]" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-[var(--color-light-gray)]">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-[rgba(191,191,191,1)]">{item.category}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-[var(--color-light-gray)]">{item.currentStock}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-[var(--color-light-gray)]">{item.predictedDemand}</td>
                                            <td className="px-6 py-4 text-sm text-right text-[rgba(191,191,191,1)]">{item.safetyStock}</td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-[var(--color-primary)]">
                                                {item.suggestedReorder > 0 ? `+${item.suggestedReorder}` : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold ${statusStyle[item.status] || "bg-[rgba(255,255,255,0.12)] text-[rgba(191,191,191,1)]"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                </div>
            </div>
        </>
    );
}
