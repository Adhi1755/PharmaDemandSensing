interface BusinessKPICardProps {
    label: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    accentClass?: string;
}

export default function BusinessKPICard({
    label,
    value,
    description,
    icon,
    accentClass = "from-[rgba(255,0,0,0.45)] to-transparent",
}: BusinessKPICardProps) {
    return (
        <article className="glass-card dashboard-card relative overflow-hidden rounded-2xl p-5 hover:scale-[1.01] transition-transform duration-200">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClass}`} />
            <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[rgba(191,191,191,1)]">{label}</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.02)] text-(--color-primary)">
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-semibold text-(--color-light-gray)">{value}</p>
            <p className="mt-1 text-sm text-[rgba(128,128,128,1)]">{description}</p>
        </article>
    );
}
