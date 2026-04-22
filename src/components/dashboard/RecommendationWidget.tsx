"use client";

import { useState, useMemo } from "react";
import type { InventoryRow } from "@/lib/dashboard-data";

// ── Urgency styling (mirrors ReorderPlanner) ─────────────────────────────────

const URGENCY_CARD = {
    urgent: {
        bg: "linear-gradient(135deg,rgba(248,81,73,0.14) 0%,rgba(218,54,51,0.08) 100%)",
        border: "rgba(248,81,73,0.35)",
        accentLine: "#F85149",
        textColor: "#F85149",
        badgeBg: "rgba(248,81,73,0.12)",
        badgeBorder: "rgba(248,81,73,0.3)",
        badgeText: "#F85149",
        label: "⚠️ Urgent",
    },
    soon: {
        bg: "linear-gradient(135deg,rgba(251,191,36,0.1) 0%,rgba(251,191,36,0.04) 100%)",
        border: "rgba(251,191,36,0.3)",
        accentLine: "#FBBF24",
        textColor: "#FBBF24",
        badgeBg: "rgba(251,191,36,0.1)",
        badgeBorder: "rgba(251,191,36,0.25)",
        badgeText: "#FBBF24",
        label: "📅 Within 3 days",
    },
    ok: {
        bg: "linear-gradient(135deg,rgba(63,185,80,0.08) 0%,rgba(63,185,80,0.02) 100%)",
        border: "rgba(63,185,80,0.25)",
        accentLine: "#3FB950",
        textColor: "#3FB950",
        badgeBg: "rgba(63,185,80,0.08)",
        badgeBorder: "rgba(63,185,80,0.2)",
        badgeText: "#3FB950",
        label: "✅ This week",
    },
} as const;

// ── Unique categories from inventory rows ─────────────────────────────────────

function getCategories(rows: InventoryRow[]): string[] {
    const seen = new Set<string>();
    const cats: string[] = ["All Categories"];
    for (const r of rows) {
        if (!seen.has(r.category)) {
            seen.add(r.category);
            cats.push(r.category);
        }
    }
    return cats;
}

// ── Date formatter ────────────────────────────────────────────────────────────

function formatOrderByDate(isoDate: string): string {
    const d = new Date(isoDate);
    const today = new Date();
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff <= 0) return "today";
    if (diff === 1) return "tomorrow";

    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (diff < 7) return DAYS[d.getDay()];

    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Aggregate recommendation for a category ───────────────────────────────────

interface CategoryRec {
    totalUnits: number;
    orderBy: string;       // ISO date of the earliest must-order date
    urgency: "urgent" | "soon" | "ok";
    productCount: number;
}

function buildCategoryRec(rows: InventoryRow[]): CategoryRec {
    if (rows.length === 0) {
        return { totalUnits: 0, orderBy: new Date().toISOString(), urgency: "ok", productCount: 0 };
    }

    let urgency: "urgent" | "soon" | "ok" = "ok";
    let earliestOrderBy = rows[0].reorderRecommendation.orderBy;
    let totalUnits = 0;

    for (const r of rows) {
        totalUnits += r.reorderRecommendation.suggestedQty;
        const u = r.reorderRecommendation.urgency;
        if (u === "urgent") urgency = "urgent";
        else if (u === "soon" && urgency !== "urgent") urgency = "soon";

        if (r.reorderRecommendation.orderBy < earliestOrderBy) {
            earliestOrderBy = r.reorderRecommendation.orderBy;
        }
    }

    return {
        totalUnits,
        orderBy: earliestOrderBy,
        urgency,
        productCount: rows.length,
    };
}

// ── Widget ────────────────────────────────────────────────────────────────────

interface RecommendationWidgetProps {
    inventoryRows: InventoryRow[];
}

export default function RecommendationWidget({ inventoryRows }: RecommendationWidgetProps) {
    const categories = useMemo(() => getCategories(inventoryRows), [inventoryRows]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");

    const filteredRows = useMemo(() => {
        if (selectedCategory === "All Categories") return inventoryRows;
        return inventoryRows.filter((r) => r.category === selectedCategory);
    }, [inventoryRows, selectedCategory]);

    const rec = useMemo(() => buildCategoryRec(filteredRows), [filteredRows]);
    const style = URGENCY_CARD[rec.urgency];
    const dateLabel = formatOrderByDate(rec.orderBy);

    return (
        <div
            className="relative overflow-hidden rounded-2xl"
            style={{
                background: "linear-gradient(145deg,rgba(18,22,30,0.95),rgba(10,14,20,0.92))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            }}
        >
            {/* Top accent line */}
            <div
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: `linear-gradient(90deg,${style.accentLine},transparent 70%)` }}
            />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-4">
                    <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${style.badgeBg}`, color: style.accentLine }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5 h-5 w-5">
                            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "#6E7681" }}>
                            Practical Recommendation
                        </p>
                        <p className="text-[13px] font-semibold" style={{ color: "#E6EDF3" }}>
                            Smart Order Engine
                        </p>
                    </div>
                </div>

                {/* Dropdown */}
                <div className="mb-4">
                    <label
                        htmlFor="rec-category-select"
                        className="block text-[10px] uppercase tracking-wider mb-1.5"
                        style={{ color: "#6E7681" }}
                    >
                        Drug Category
                    </label>
                    <select
                        id="rec-category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#E6EDF3",
                            fontFamily: "inherit",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = style.accentLine; e.currentTarget.style.boxShadow = `0 0 0 3px ${style.badgeBg}`; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                        {categories.map((c) => (
                            <option
                                key={c}
                                value={c}
                                style={{ background: "#0F1318", color: "#E6EDF3" }}
                            >
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Card */}
                {rec.productCount > 0 ? (
                    <div
                        className="relative overflow-hidden rounded-xl p-4"
                        style={{
                            background: style.bg,
                            border: `1px solid ${style.border}`,
                        }}
                    >
                        {/* Left accent bar */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                            style={{ background: style.accentLine }}
                        />
                        <div className="pl-3">
                            {/* Urgency badge */}
                            <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2"
                                style={{
                                    background: style.badgeBg,
                                    border: `1px solid ${style.badgeBorder}`,
                                    color: style.badgeText,
                                }}
                            >
                                {style.label}
                            </span>

                            {/* Main action text */}
                            <p
                                className="text-lg font-bold leading-tight"
                                style={{ color: style.textColor }}
                            >
                                Order {rec.totalUnits.toLocaleString()} units
                            </p>
                            <p
                                className="text-sm font-semibold mt-0.5"
                                style={{ color: "#E6EDF3" }}
                            >
                                by{" "}
                                <span style={{ color: style.textColor }}>
                                    {dateLabel}
                                </span>
                            </p>

                            {/* Meta line */}
                            <p className="mt-2 text-[10px]" style={{ color: "#8B949E" }}>
                                {rec.productCount} product{rec.productCount !== 1 ? "s" : ""} ·{" "}
                                based on supplier lead time &amp; safety buffer
                            </p>
                        </div>
                    </div>
                ) : (
                    <div
                        className="rounded-xl p-4 text-center"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <p className="text-xs" style={{ color: "#6E7681" }}>
                            No products found in this category.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
