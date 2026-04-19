interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
    return (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
                <h2 className="text-lg font-semibold text-(--color-light-gray)">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-[rgba(191,191,191,1)]">{subtitle}</p> : null}
            </div>
            {action ? <div>{action}</div> : null}
        </div>
    );
}
