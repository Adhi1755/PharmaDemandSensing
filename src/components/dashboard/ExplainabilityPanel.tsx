"use client";

import type { DemandReason, ExplainabilityResult } from "@/lib/explainability-engine";

// ── Tag chip style map ───────────────────────────────────────────────────────

const TAG_STYLES = {
    weather: {
        bg: "rgba(88,166,255,0.08)",
        border: "rgba(88,166,255,0.22)",
        text: "#58A6FF",
        glow: "rgba(88,166,255,0.12)",
    },
    seasonal: {
        bg: "rgba(167,139,250,0.08)",
        border: "rgba(167,139,250,0.22)",
        text: "#A78BFA",
        glow: "rgba(167,139,250,0.12)",
    },
    sales_trend: {
        bg: "rgba(251,191,36,0.08)",
        border: "rgba(251,191,36,0.22)",
        text: "#FBBF24",
        glow: "rgba(251,191,36,0.12)",
    },
} as const;

// ── Reason Chip ──────────────────────────────────────────────────────────────

function ReasonChip({ reason }: { reason: DemandReason }) {
    const s = TAG_STYLES[reason.tag];
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide"
            style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.text,
            }}
        >
            {reason.icon} {reason.label}
        </span>
    );
}

// ── Reason Row ───────────────────────────────────────────────────────────────

function ReasonRow({ reason }: { reason: DemandReason }) {
    const s = TAG_STYLES[reason.tag];
    return (
        <div
            className="flex items-start gap-3 rounded-xl p-3"
            style={{
                background: s.glow,
                border: `1px solid ${s.border}`,
            }}
        >
            <span className="text-lg leading-none shrink-0 mt-0.5">{reason.icon}</span>
            <div className="min-w-0">
                <ReasonChip reason={reason} />
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#C9D1D9" }}>
                    {reason.detail}
                </p>
            </div>
        </div>
    );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

interface ExplainabilityPanelProps {
    result: ExplainabilityResult;
    medicineName: string;
}

export default function ExplainabilityPanel({
    result,
    medicineName,
}: ExplainabilityPanelProps) {
    if (!result.hasTriggers) {
        // Quiet state — no notable demand signals
        return (
            <div
                className="rounded-xl p-4"
                style={{
                    background: "rgba(63,185,80,0.04)",
                    border: "1px solid rgba(63,185,80,0.14)",
                }}
            >
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "#6E7681" }}>
                    Why demand is high
                </p>
                <p className="text-xs" style={{ color: "#8B949E" }}>
                    ✅ No unusual demand signals detected for <strong style={{ color: "#C9D1D9" }}>{medicineName}</strong>. Demand appears stable.
                </p>
            </div>
        );
    }

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{
                background: "linear-gradient(145deg,rgba(18,22,30,0.95),rgba(10,14,20,0.92))",
                border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            {/* Top accent */}
            <div
                className="h-[2px]"
                style={{ background: "linear-gradient(90deg,#A78BFA,#58A6FF 60%,transparent)" }}
            />

            <div className="p-4">
                {/* Title row */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p
                            className="text-[10px] uppercase tracking-wider mb-0.5"
                            style={{ color: "#6E7681" }}
                        >
                            Why demand is high
                        </p>
                        <p className="text-[13px] font-semibold" style={{ color: "#E6EDF3" }}>
                            {medicineName}
                        </p>
                    </div>
                    {/* Chip summary */}
                    <div className="flex flex-wrap justify-end gap-1.5">
                        {result.reasons.map((r) => (
                            <ReasonChip key={r.tag} reason={r} />
                        ))}
                    </div>
                </div>

                {/* Reason rows */}
                <div className="space-y-2">
                    {result.reasons.map((r) => (
                        <ReasonRow key={r.tag} reason={r} />
                    ))}
                </div>

                {/* Footer */}
                <p
                    className="mt-3 text-[10px] leading-relaxed"
                    style={{
                        color: "#6E7681",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        paddingTop: "10px",
                    }}
                >
                    💡 We provide interpretable insights to build user trust. These signals are derived from seasonal patterns and sales velocity — no data-science knowledge needed.
                </p>
            </div>
        </div>
    );
}
