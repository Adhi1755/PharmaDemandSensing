"use client";

interface Alert {
    type: string;
    title: string;
    message: string;
    drugName?: string;
    currentStock?: number;
    requiredStock?: number;
}

interface AlertsSectionProps {
    alerts: Alert[];
    status: "success" | "failed" | "fallback" | "loading";
}

const ALERT_COLORS: Record<string, { border: string; bg: string; dot: string; text: string }> = {
    critical: {
        border: "border-[rgba(248,81,73,0.25)]",
        bg: "bg-[rgba(248,81,73,0.06)]",
        dot: "bg-[#F85149]",
        text: "text-[#F85149]",
    },
    warning: {
        border: "border-[rgba(251,191,36,0.25)]",
        bg: "bg-[rgba(251,191,36,0.06)]",
        dot: "bg-[#FBBF24]",
        text: "text-[#FBBF24]",
    },
    info: {
        border: "border-[rgba(88,166,255,0.25)]",
        bg: "bg-[rgba(88,166,255,0.06)]",
        dot: "bg-[#58A6FF]",
        text: "text-[#58A6FF]",
    },
};

function AlertSkeleton() {
    return (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(255,255,255,0.06)]">
            <div className="skeleton h-4 w-4 rounded-full mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-3 w-48" />
            </div>
        </div>
    );
}

export default function AlertsSection({ alerts, status }: AlertsSectionProps) {
    if (status === "loading") {
        return (
            <section className="glass-card p-6">
                <div className="skeleton h-4 w-28 mb-5" />
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => <AlertSkeleton key={i} />)}
                </div>
            </section>
        );
    }

    // Limit to 4 alerts max as specified
    const displayAlerts = alerts.slice(0, 4);

    return (
        <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                        Active Alerts
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        Demand anomalies requiring attention
                    </p>
                </div>
                {displayAlerts.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(248,81,73,0.1)] border border-[rgba(248,81,73,0.2)] text-[#F85149]">
                        {displayAlerts.length} active
                    </span>
                )}
            </div>

            {displayAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        className="h-10 w-10 text-[var(--color-text-muted)] mb-3">
                        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                    <p className="text-sm text-[var(--color-text-muted)]">No active alerts</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">All demand levels are within normal range</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayAlerts.map((alert, idx) => {
                        const colors = ALERT_COLORS[alert.type] ?? ALERT_COLORS.info;
                        return (
                            <div
                                key={`alert-${idx}`}
                                className={`flex items-start gap-3 p-4 rounded-xl border ${colors.border} ${colors.bg} transition-colors duration-200`}
                            >
                                {/* Status dot */}
                                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${colors.dot}`} />

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${colors.text} leading-tight`}>
                                        {alert.title}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed line-clamp-2">
                                        {alert.message}
                                    </p>
                                    {/* Stock details if available */}
                                    {(alert.drugName || alert.currentStock || alert.requiredStock) && (
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-muted)]">
                                            {alert.drugName && (
                                                <span className="font-medium text-[var(--color-text-secondary)]">{alert.drugName}</span>
                                            )}
                                            {alert.currentStock !== undefined && (
                                                <span>Stock: <strong>{alert.currentStock}</strong></span>
                                            )}
                                            {alert.requiredStock !== undefined && (
                                                <span>Required: <strong>{alert.requiredStock}</strong></span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Type badge */}
                                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md shrink-0 ${colors.bg} ${colors.text} border ${colors.border}`}>
                                    {alert.type}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
