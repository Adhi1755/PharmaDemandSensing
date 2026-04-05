interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: "up" | "down" | "stable";
    trendValue?: string;
    icon: React.ReactNode;
    color: string;
}

export default function KPICard({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    icon,
    color,
}: KPICardProps) {
    const trendColor =
        trend === "up"
            ? "text-[var(--color-light-gray)] bg-[rgba(255,0,0,0.2)]"
            : trend === "down"
                ? "text-[var(--color-primary)] bg-[rgba(255,77,77,0.26)]"
                : "text-[rgba(191,191,191,1)] bg-[rgba(255,255,255,0.12)]";

    const trendIcon =
        trend === "up" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
        ) : trend === "down" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
        ) : null;

    return (
        <div className="glass-card p-6 dashboard-card">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-[rgba(191,191,191,1)] mb-1">{title}</p>
                    <p className="text-3xl font-bold text-(--color-light-gray)">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-[rgba(128,128,128,1)] mt-1">{subtitle}</p>
                    )}
                    {trend && trendValue && (
                        <div className={`inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-lg text-xs font-semibold ${trendColor}`}>
                            {trendIcon}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}15`, color }}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}
