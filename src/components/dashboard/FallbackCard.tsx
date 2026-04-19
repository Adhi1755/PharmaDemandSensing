"use client";

interface FallbackCardProps {
    title?: string;
    message: string;
    type?: "error" | "fallback" | "info";
}

export default function FallbackCard({
    title,
    message,
    type = "info",
}: FallbackCardProps) {
    const iconColor = type === "error"
        ? "text-[#F85149]"
        : type === "fallback"
            ? "text-[#FBBF24]"
            : "text-[var(--color-text-muted)]";

    const bgColor = type === "error"
        ? "bg-[rgba(248,81,73,0.06)]"
        : type === "fallback"
            ? "bg-[rgba(251,191,36,0.06)]"
            : "bg-[rgba(88,166,255,0.06)]";

    const borderColor = type === "error"
        ? "border-[rgba(248,81,73,0.15)]"
        : type === "fallback"
            ? "border-[rgba(251,191,36,0.15)]"
            : "border-[var(--border-subtle)]";

    return (
        <div className={`rounded-2xl border ${borderColor} ${bgColor} p-5 transition-colors duration-300`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${iconColor}`}>
                    {type === "error" ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    ) : type === "fallback" ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    )}
                </div>
                <div>
                    {title && (
                        <p className={`text-sm font-medium mb-1 ${iconColor}`}>
                            {title}
                        </p>
                    )}
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}
