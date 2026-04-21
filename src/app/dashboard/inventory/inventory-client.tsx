"use client";

import { useEffect, useMemo, useState } from "react";

import LoadingSpinner from "@/components/LoadingSpinner";
import DataTable, { type DataTableColumn } from "@/components/dashboard/DataTable";
import type {
    DatasetComparisonPayload,
    DatasetComparisonRow,
    DatasetComparisonStats,
    DatasetKey,
} from "@/lib/api";

const LOCAL_USER_KEY = "pharmasens_user";

export default function InventoryClient({ initialData }: { initialData: DatasetComparisonPayload }) {
    const [authorized, setAuthorized] = useState(false);
    const [activeDataset, setActiveDataset] = useState<DatasetKey>("raw");
    const [rowsByDataset, setRowsByDataset] = useState<Record<DatasetKey, DatasetComparisonRow[]>>({
        raw: initialData.raw.rows,
        processed: initialData.processed.rows,
    });
    const [statsByDataset, setStatsByDataset] = useState<Record<DatasetKey, DatasetComparisonStats>>({
        raw: initialData.raw.stats,
        processed: initialData.processed.stats,
    });

    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [demandFilter, setDemandFilter] = useState("All");
    const [sortBy, setSortBy] = useState<"demand" | "price" | "stock">("demand");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<DatasetComparisonRow | null>(null);

    const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [newCategory, setNewCategory] = useState("General");
    const [newStock, setNewStock] = useState("50");
    const [newDemand, setNewDemand] = useState("30");
    const [newPrice, setNewPrice] = useState("18.50");

    useEffect(() => {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (!raw) {
            window.location.href = "/login";
            return;
        }

        setAuthorized(true);
    }, []);

    const activeRows = rowsByDataset[activeDataset];

    const categories = useMemo(() => {
        const values = new Set(activeRows.map((row) => row.category));
        return ["All", ...Array.from(values).sort((left, right) => left.localeCompare(right))];
    }, [activeRows]);

    const demandThresholds = useMemo(() => {
        if (!activeRows.length) return { low: 0, high: 0 };

        const values = activeRows.map((row) => row.demand).sort((left, right) => left - right);
        const lowIndex = Math.floor(values.length / 3);
        const highIndex = Math.floor((values.length * 2) / 3);

        return {
            low: values[lowIndex] ?? 0,
            high: values[highIndex] ?? 0,
        };
    }, [activeRows]);

    const getDemandLevel = (demand: number) => {
        if (demand >= demandThresholds.high) return "High";
        if (demand <= demandThresholds.low) return "Low";
        return "Medium";
    };

    const filteredRows = useMemo(() => {
        const searched = activeRows.filter((row) => {
            const queryValue = query.trim().toLowerCase();
            const matchQuery =
                queryValue.length === 0 ||
                Object.values(row).some((value) => String(value).toLowerCase().includes(queryValue));
            const matchCategory = categoryFilter === "All" || row.category === categoryFilter;
            const matchDemand = demandFilter === "All" || demandFilter === getDemandLevel(row.demand);

            return matchQuery && matchCategory && matchDemand;
        });

        return searched.sort((left, right) => {
            const factor = sortOrder === "asc" ? 1 : -1;
            return (left[sortBy] - right[sortBy]) * factor;
        });
    }, [activeRows, query, categoryFilter, demandFilter, sortBy, sortOrder, demandThresholds.high, demandThresholds.low]);

    const tableColumns: DataTableColumn<DatasetComparisonRow>[] = useMemo(() => {
        const metricLabels =
            activeDataset === "raw"
                ? { metricA: "M01AB", metricB: "N02BE", metricC: "R03" }
                : { metricA: "Time Index", metricB: "Month", metricC: "Sales Class" };

        return [
            { key: "date", label: "Date" },
            { key: "category", label: activeDataset === "raw" ? "Dominant Category" : "ATC Category" },
            {
                key: "stock",
                label: "Stock",
                render: (row) => {
                    if (editingId === row.id && draft) {
                        return (
                            <input
                                type="number"
                                className="w-24 rounded-lg border border-[rgba(255,255,255,0.2)] bg-black px-2 py-1 text-sm"
                                value={draft.stock}
                                onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })}
                            />
                        );
                    }
                    return row.stock.toLocaleString();
                },
            },
            {
                key: "demand",
                label: "Demand",
                render: (row) => {
                    if (editingId === row.id && draft) {
                        return (
                            <input
                                type="number"
                                className="w-24 rounded-lg border border-[rgba(255,255,255,0.2)] bg-black px-2 py-1 text-sm"
                                value={draft.demand}
                                onChange={(event) => setDraft({ ...draft, demand: Number(event.target.value) })}
                            />
                        );
                    }
                    return row.demand.toLocaleString();
                },
            },
            {
                key: "price",
                label: "Price",
                render: (row) => {
                    if (editingId === row.id && draft) {
                        return (
                            <input
                                type="number"
                                className="w-24 rounded-lg border border-[rgba(255,255,255,0.2)] bg-black px-2 py-1 text-sm"
                                value={draft.price}
                                onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
                            />
                        );
                    }
                    return `Rs ${row.price.toFixed(2)}`;
                },
            },
            {
                key: "metricA",
                label: metricLabels.metricA,
                render: (row) => row.metricA.toFixed(2),
            },
            {
                key: "metricB",
                label: metricLabels.metricB,
                render: (row) => row.metricB.toFixed(2),
            },
            {
                key: "metricC",
                label: metricLabels.metricC,
                render: (row) => row.metricC.toFixed(2),
            },
            {
                key: "actions",
                label: "Actions",
                render: (row) => {
                    if (editingId === row.id) {
                        return (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="rounded-lg border border-[rgba(34,197,94,0.4)] px-2 py-1 text-xs text-[#22C55E]"
                                    onClick={() => {
                                        if (!draft) return;
                                        setRowsByDataset((previous) => ({
                                            ...previous,
                                            [activeDataset]: previous[activeDataset].map((item) => (item.id === row.id ? draft : item)),
                                        }));
                                        setEditingId(null);
                                        setDraft(null);
                                    }}
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg border border-[rgba(255,255,255,0.2)] px-2 py-1 text-xs"
                                    onClick={() => {
                                        setEditingId(null);
                                        setDraft(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-[rgba(255,255,255,0.2)] px-2 py-1 text-xs"
                                onClick={() => {
                                    setEditingId(row.id);
                                    setDraft(row);
                                }}
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                className="rounded-lg border border-[rgba(248,81,73,0.35)] px-2 py-1 text-xs text-[#F87171]"
                                onClick={() => {
                                    setRowsByDataset((previous) => ({
                                        ...previous,
                                        [activeDataset]: previous[activeDataset].filter((item) => item.id !== row.id),
                                    }));
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    );
                },
            },
        ];
    }, [activeDataset, editingId, draft]);

    if (!authorized) {
        return <div className="p-6 lg:p-8"><LoadingSpinner text="Loading dataset comparison records..." /></div>;
    }

    const rawStats = statsByDataset.raw;
    const processedStats = statsByDataset.processed;

    return (
        <>
            <main data-page-main="true" className="space-y-6 p-4 pb-24 md:p-6 lg:p-8 lg:pb-8">
                <section className="glass-card rounded-2xl p-5">
                    <h2 className="text-lg font-semibold text-(--color-light-gray)">Add New Row</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                        <input className="input-field rounded-xl" placeholder="Date (YYYY-MM-DD)" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
                        <input className="input-field rounded-xl" placeholder="Category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
                        <input className="input-field rounded-xl" type="number" placeholder="Stock" value={newStock} onChange={(event) => setNewStock(event.target.value)} />
                        <input className="input-field rounded-xl" type="number" placeholder="Demand" value={newDemand} onChange={(event) => setNewDemand(event.target.value)} />
                        <input className="input-field rounded-xl" type="number" placeholder="Price" value={newPrice} onChange={(event) => setNewPrice(event.target.value)} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                        <button
                            type="button"
                            className="btn-primary rounded-xl justify-center md:col-span-2"
                            onClick={() => {
                                if (!newDate.trim() || !newCategory.trim()) return;

                                const demand = Number(newDemand);
                                const newRow: DatasetComparisonRow = {
                                    id: `${activeDataset}-custom-${Date.now()}`,
                                    date: newDate,
                                    category: newCategory,
                                    stock: Number(newStock),
                                    demand,
                                    price: Number(newPrice),
                                    metricA: Number((demand * 0.6).toFixed(2)),
                                    metricB: Number((demand * 0.8).toFixed(2)),
                                    metricC: Number((demand * 0.3).toFixed(2)),
                                };

                                setRowsByDataset((previous) => ({
                                    ...previous,
                                    [activeDataset]: [newRow, ...previous[activeDataset]],
                                }));

                                setNewDate(new Date().toISOString().slice(0, 10));
                                setNewCategory(activeDataset === "raw" ? "General" : "M01AB");
                                setNewStock("50");
                                setNewDemand("30");
                                setNewPrice("18.50");
                            }}
                        >
                            Add row
                        </button>
                        <div className="md:col-span-3 flex items-center gap-2">
                            <span className="text-sm text-[rgba(191,191,191,1)]">Dataset:</span>
                            <button
                                type="button"
                                className={`rounded-xl px-4 py-2 text-xs font-medium transition ${activeDataset === "raw"
                                        ? "bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.2)] text-(--color-light-gray)"
                                        : "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-[rgba(191,191,191,1)]"
                                    }`}
                                onClick={() => {
                                    setActiveDataset("raw");
                                    setCategoryFilter("All");
                                    setEditingId(null);
                                    setDraft(null);
                                }}
                            >
                                Raw Data
                            </button>
                            <button
                                type="button"
                                className={`rounded-xl px-4 py-2 text-xs font-medium transition ${activeDataset === "processed"
                                        ? "bg-[rgba(218,54,51,0.2)] border border-[rgba(218,54,51,0.35)] text-[#FCA5A5]"
                                        : "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-[rgba(191,191,191,1)]"
                                    }`}
                                onClick={() => {
                                    setActiveDataset("processed");
                                    setCategoryFilter("All");
                                    setEditingId(null);
                                    setDraft(null);
                                }}
                            >
                                Processed Data
                            </button>
                        </div>
                    </div>
                </section>

                <section className="glass-card rounded-2xl p-5">
                    <h3 className="text-base font-semibold text-(--color-light-gray)">Before vs After Comparison</h3>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3">
                            <p className="text-xs text-[rgba(191,191,191,1)]">Rows Count</p>
                            <p className="mt-1 text-sm text-(--color-light-gray)">Raw: {rawStats.rowsCount.toLocaleString()}</p>
                            <p className="text-sm text-(--color-light-gray)">Processed: {processedStats.rowsCount.toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3">
                            <p className="text-xs text-[rgba(191,191,191,1)]">Missing Values</p>
                            <p className="mt-1 text-sm text-(--color-light-gray)">Raw: {rawStats.missingLabel}</p>
                            <p className="text-sm text-(--color-light-gray)">Processed: {processedStats.missingLabel}</p>
                        </div>
                        <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3">
                            <p className="text-xs text-[rgba(191,191,191,1)]">Features Count</p>
                            <p className="mt-1 text-sm text-(--color-light-gray)">Raw: {rawStats.featuresCount}</p>
                            <p className="text-sm text-(--color-light-gray)">Processed: {processedStats.featuresCount}</p>
                        </div>
                        <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-3">
                            <p className="text-xs text-[rgba(191,191,191,1)]">Data Cleanliness</p>
                            <p className="mt-1 text-sm text-(--color-light-gray)">Raw: {rawStats.cleanlinessStatus}</p>
                            <p className="text-sm text-(--color-light-gray)">Processed: {processedStats.cleanlinessStatus}</p>
                        </div>
                    </div>
                </section>

                <section
                    className={`glass-card rounded-2xl p-5 transition-all duration-200 ${activeDataset === "raw"
                            ? "border-[rgba(255,255,255,0.09)] bg-[linear-gradient(145deg,rgba(16,20,25,0.88),rgba(12,15,19,0.84))]"
                            : "border-[rgba(218,54,51,0.2)] shadow-[0_0_0_1px_rgba(218,54,51,0.12),0_8px_36px_rgba(218,54,51,0.08)]"
                        }`}
                >
                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-6">
                        <input
                            className="input-field rounded-xl"
                            placeholder="Search medicine, category, or value"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        <select className="input-field rounded-xl" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                            {categories.map((cat) => (
                                <option key={cat}>{cat}</option>
                            ))}
                        </select>
                        <select className="input-field rounded-xl" value={demandFilter} onChange={(event) => setDemandFilter(event.target.value)}>
                            {['All', 'Low', 'Medium', 'High'].map((level) => (
                                <option key={level}>{level}</option>
                            ))}
                        </select>
                        <select className="input-field rounded-xl" value={sortBy} onChange={(event) => setSortBy(event.target.value as 'demand' | 'price' | 'stock')}>
                            <option value="demand">Sort by Demand</option>
                            <option value="price">Sort by Price</option>
                            <option value="stock">Sort by Stock</option>
                        </select>
                        <select className="input-field rounded-xl" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}>
                            <option value="desc">Highest first</option>
                            <option value="asc">Lowest first</option>
                        </select>
                        <div className="flex items-center rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-3 text-xs text-[rgba(191,191,191,1)]">
                            {activeDataset === 'raw' ? 'Raw Data View' : 'Processed Data View'}
                        </div>
                    </div>

                    <DataTable
                        data={filteredRows}
                        columns={tableColumns}
                        rowKey={(row) => row.id}
                        pageSize={8}
                        emptyMessage="No dataset rows match your filters."
                    />
                </section>
            </main>
        </>
    );
}
