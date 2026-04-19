interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export default function ChartCard({ title, subtitle, children, action, className = "" }: ChartCardProps) {
    return (
        <section className={`glass-card chart-section rounded-2xl p-5 ${className}`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-(--color-light-gray)">{title}</h3>
                    {subtitle ? <p className="mt-1 text-xs text-[rgba(191,191,191,1)]">{subtitle}</p> : null}
                </div>
                {action ? <div>{action}</div> : null}
            </div>
            {children}
        </section>
    );
}
