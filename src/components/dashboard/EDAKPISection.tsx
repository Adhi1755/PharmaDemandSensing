"use client";

interface EDAKpis {
  totalSales: number;
  totalDrugs: number;
  avgMonthlySales: number;
  topDrug: string;
}

interface EDAKPISectionProps {
  kpis: EDAKpis | null;
  dateRange?: { from: string; to: string };
  months?: number;
}

// ── Icon helpers ──────────────────────────────────────────────
const IconSales = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="M12 1v22" strokeLinecap="round" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
  </svg>
);

const IconDrugs = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="17" r="3" />
    <path d="M21 21l-1.5-1.5" strokeLinecap="round" />
  </svg>
);

const IconAvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" strokeLinecap="round" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" strokeLinecap="round" />
    <path d="M4 22h16" strokeLinecap="round" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" strokeLinecap="round" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" strokeLinecap="round" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" strokeLinecap="round" />
  </svg>
);

function SkeletonKPICard() {
  return (
    <article className="kpi-card p-6">
      <div className="skeleton h-3 w-24 mb-5" />
      <div className="skeleton h-9 w-32 mb-3" />
      <div className="skeleton h-3 w-20" />
    </article>
  );
}

const KPI_CONFIG = [
  {
    key: "totalSales" as const,
    label: "Total Sales",
    icon: <IconSales />,
    accent: "#DA3633",
    format: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    suffix: "",
  },
  {
    key: "totalDrugs" as const,
    label: "Total Drug Classes",
    icon: <IconDrugs />,
    accent: "#58A6FF",
    format: (v: number) => String(v),
    suffix: "ATC codes",
  },
  {
    key: "avgMonthlySales" as const,
    label: "Avg Monthly Sales",
    icon: <IconAvg />,
    accent: "#3FB950",
    format: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    suffix: "/ month",
  },
  {
    key: "topDrug" as const,
    label: "Top Selling Drug",
    icon: <IconTop />,
    accent: "#F78166",
    format: (v: string | number) => String(v),
    suffix: "highest volume",
    isText: true,
  },
];

export default function EDAKPISection({ kpis, dateRange, months }: EDAKPISectionProps) {
  if (!kpis) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkeletonKPICard key={i} />)}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CONFIG.map((cfg, idx) => {
        const raw = kpis[cfg.key];
        const display = cfg.format(raw as never);

        return (
          <article
            key={cfg.key}
            className="kpi-card dashboard-card p-6"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            {/* Colored top accent line */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, ${cfg.accent} 0%, transparent 65%)` }}
            />

            <div className="flex items-start justify-between mb-4">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em] leading-tight"
                style={{ color: "#6E7681" }}
              >
                {cfg.label}
              </p>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${cfg.accent}16`, color: cfg.accent }}
              >
                {cfg.icon}
              </div>
            </div>

            <p
              className="font-semibold tracking-tight leading-none"
              style={{
                color: "#E6EDF3",
                fontSize: cfg.isText ? "1.55rem" : "2rem",
              }}
            >
              {display}
            </p>

            {cfg.suffix && (
              <p className="mt-2 text-xs" style={{ color: "#6E7681" }}>{cfg.suffix}</p>
            )}

            {idx === 0 && dateRange && (
              <p className="mt-2.5 text-[10px]" style={{ color: "#6E7681" }}>
                {dateRange.from} → {dateRange.to} · {months} months
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
