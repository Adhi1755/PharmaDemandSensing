"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
} from "recharts";
import Navbar from "@/components/Navbar";
import {
    getAlerts,
    getDashboardStats,
    getModelStatus,
    getResults,
    getTopDrugs,
    getTrendData,
    type AuthUser,
    type ModelOutput,
} from "@/lib/api";

const LOCAL_USER_KEY = "pharmasens_user";

interface Stats {
    totalDrugs: number;
    predictedDemand7d: number;
    highDemandAlerts: number;
    avgForecastAccuracy: number;
}

interface TopDrug {
    id: number;
    name: string;
    category: string;
    predictedDemand: number;
    trend: string;
    changePercent: number;
}

interface Alert {
    type: string;
    title: string;
    message: string;
}

interface TrendPoint {
    date: string;
    totalDemand: number;
}

/* ─── Animated counter ─── */
function AnimatedNumber({ target, duration = 1200, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
    const [current, setCurrent] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current || target === 0) return;
        started.current = true;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);

    return <>{current.toLocaleString()}{suffix}</>;
}

/* ─── KPI Card with stagger animation ─── */
function KPICard({
    label,
    value,
    sublabel,
    delay = 0,
    suffix = "",
    isPercent = false,
}: {
    label: string;
    value: number;
    sublabel: string;
    delay?: number;
    suffix?: string;
    isPercent?: boolean;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            style={{
                padding: "1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            }}
        >
            <p style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(191,191,191,1)",
                marginBottom: 10,
            }}>
                {label}
            </p>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {visible && value > 0 ? (
                    <AnimatedNumber target={value} suffix={isPercent ? "%" : suffix} duration={1000} />
                ) : (
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                )}
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(128,128,128,1)", marginTop: 6 }}>{sublabel}</p>
        </div>
    );
}

/* ─── Section fade-in wrapper ─── */
function FadeSection({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            ...style,
        }}>
            {children}
        </div>
    );
}

/* ─── Page enter overlay ─── */
function PageEnterOverlay() {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 800);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;
    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "#000",
            pointerEvents: "none",
            animation: "dashboardEnter 0.8s ease-out forwards",
        }} />
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [topDrugs, setTopDrugs] = useState<TopDrug[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [email, setEmail] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState<"linear" | "rf" | "tft">("linear");
    const [modelStatus, setModelStatus] = useState<{ linear: string; rf: string; tft: string }>({
        linear: "not_started",
        rf: "not_started",
        tft: "not_started",
    });
    const [activeResult, setActiveResult] = useState<ModelOutput | null>(null);
    const [resultsError, setResultsError] = useState("");
    const [loading, setLoading] = useState(true);
    const [chartAnimating, setChartAnimating] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (!raw) { router.replace("/login"); return; }
        let user: AuthUser;
        try {
            user = JSON.parse(raw) as AuthUser;
        } catch {
            localStorage.removeItem(LOCAL_USER_KEY);
            router.replace("/login");
            return;
        }
        if (user.isNewUser || !user.hasUploadedData) {
            router.replace("/onboarding");
            return;
        }

        Promise.all([getDashboardStats(), getTopDrugs(), getAlerts(), getTrendData()])
            .then(([s, d, a, t]) => {
                setEmail(user.email);
                setStats(s);
                setTopDrugs(d);
                setAlerts(a);
                setTrend(t);
            })
            .finally(() => {
                setLoading(false);
                setTimeout(() => setChartAnimating(true), 300);
            });
    }, [router]);

    useEffect(() => {
        if (!email) return;
        getModelStatus(email)
            .then((res) => setModelStatus(res.status))
            .catch(() => {});
    }, [email]);

    useEffect(() => {
        if (!email) return;
        getResults(email, selectedModel)
            .then((res) => {
                setResultsError("");
                setActiveResult(res.active);
                setModelStatus(res.status);
            })
            .catch((err) => {
                setActiveResult(null);
                setResultsError(err instanceof Error ? err.message : "Results unavailable");
            });
    }, [email, selectedModel]);

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 20,
            }}>
                <div style={{ position: "relative", width: 56, height: 56 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: "spin 1s linear infinite" }}>
                        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,0,0,0.15)" strokeWidth="3" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="#FF0000" strokeWidth="3"
                            strokeDasharray="150.8" strokeDashoffset="113.1" strokeLinecap="round" />
                    </svg>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Loading dashboard...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const alertTypeStyles: Record<string, React.CSSProperties> = {
        critical: { borderLeft: "3px solid #FF0000", background: "rgba(255,0,0,0.08)" },
        warning: { borderLeft: "3px solid #FF4D4D", background: "rgba(255,77,77,0.08)" },
        info: { borderLeft: "3px solid rgba(128,128,128,0.6)", background: "rgba(255,255,255,0.04)" },
    };

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes dashboardEnter { from { opacity: 1; } to { opacity: 0; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drawLine { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
                .model-tab:hover { background: rgba(255,0,0,0.08) !important; color: #fff !important; }
                .drug-row:hover { background: rgba(255,0,0,0.06) !important; }
            `}</style>

            <PageEnterOverlay />
            <Navbar title="Dashboard" subtitle="Overview of pharmaceutical demand analytics" />

            <div style={{ minHeight: "100%", background: "#000" }}>
                <div style={{ border: "1px solid rgba(255,255,255,0.1)", background: "#000" }}>

                    {/* ── Row 1: KPI Cards ── */}
                    <section style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                            <KPICard
                                label="Total Drugs"
                                value={stats?.totalDrugs ?? 0}
                                sublabel="Active pharmaceutical products"
                                delay={100}
                            />
                            <KPICard
                                label="Predicted Demand (7d)"
                                value={stats?.predictedDemand7d ?? 0}
                                sublabel="Units forecasted for next week"
                                delay={220}
                            />
                            <KPICard
                                label="High Demand Alerts"
                                value={stats?.highDemandAlerts ?? 0}
                                sublabel="Drugs needing attention"
                                delay={340}
                            />
                            <KPICard
                                label="Forecast Accuracy"
                                value={stats?.avgForecastAccuracy ?? 0}
                                sublabel="TFT model performance"
                                delay={460}
                                isPercent
                            />
                        </div>
                    </section>

                    {/* ── Row 2: Chart + Top Drugs ── */}
                    <FadeSection delay={500} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr" }}>
                            {/* Chart */}
                            <div style={{ padding: "1.5rem 2rem", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                                    Demand Trend
                                </h2>
                                <p style={{ fontSize: "0.82rem", color: "rgba(191,191,191,1)", marginBottom: "1rem" }}>
                                    Total demand over the last 30 days
                                </p>
                                <div style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartAnimating ? trend : []}>
                                            <defs>
                                                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#FF0000" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 11, fill: "#FFFFFF" }}
                                                tickFormatter={(v) => v.slice(5)}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis tick={{ fontSize: 11, fill: "#FFFFFF" }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 6,
                                                    border: "1px solid rgba(255,0,0,0.3)",
                                                    backgroundColor: "#0D1117",
                                                    fontSize: 12,
                                                    color: "#FFFFFF",
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="totalDemand"
                                                stroke="#FF0000"
                                                strokeWidth={2.5}
                                                fill="url(#colorDemand)"
                                                name="Total Demand"
                                                isAnimationActive={chartAnimating}
                                                animationDuration={1800}
                                                animationEasing="ease-out"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Drugs */}
                            <div style={{ padding: "1.5rem" }}>
                                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                                    Top Recommended Drugs
                                </h2>
                                <p style={{ fontSize: "0.82rem", color: "rgba(191,191,191,1)", marginBottom: "1rem" }}>
                                    Highest predicted demand
                                </p>
                                <div style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                                    {topDrugs.map((drug, i) => (
                                        <div
                                            key={drug.id}
                                            className="drug-row"
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                padding: "10px 12px",
                                                borderBottom: i < topDrugs.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                                background: "transparent",
                                                transition: "background 0.2s ease",
                                                opacity: 0,
                                                animation: `slideUp 0.4s ease-out ${0.6 + i * 0.1}s forwards`,
                                                cursor: "default",
                                            }}
                                        >
                                            <span style={{
                                                width: 28, height: 28, flexShrink: 0,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "0.72rem", fontWeight: 700,
                                                border: "1px solid rgba(255,0,0,0.3)",
                                                background: "rgba(255,0,0,0.12)",
                                                color: "#fff",
                                            }}>{i + 1}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {drug.name}
                                                </p>
                                                <p style={{ fontSize: "0.72rem", color: "rgba(191,191,191,1)" }}>{drug.category}</p>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{drug.predictedDemand}</p>
                                                <p style={{
                                                    fontSize: "0.72rem", fontWeight: 600,
                                                    color: drug.changePercent > 0 ? "#34D399" : drug.changePercent < 0 ? "#F85149" : "rgba(191,191,191,1)",
                                                }}>
                                                    {drug.changePercent > 0 ? "+" : ""}{drug.changePercent}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeSection>

                    {/* ── Row 3: Alerts ── */}
                    <FadeSection delay={700} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem 2rem" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Active Alerts</h2>
                        <p style={{ fontSize: "0.82rem", color: "rgba(191,191,191,1)", marginBottom: "1rem" }}>Stock and demand notifications</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid rgba(255,255,255,0.1)" }}>
                            {alerts.map((alert, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: 16,
                                        borderBottom: i < alerts.length - 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                        borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                        ...(alertTypeStyles[alert.type] ?? alertTypeStyles.info),
                                        opacity: 0,
                                        animation: `slideUp 0.4s ease-out ${0.8 + i * 0.1}s forwards`,
                                    }}
                                >
                                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>{alert.title}</p>
                                    <p style={{ fontSize: "0.78rem", color: "rgba(191,191,191,1)", lineHeight: 1.5 }}>{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </FadeSection>

                    {/* ── Row 4: AI Model Results ── */}
                    <FadeSection delay={900} style={{ padding: "1.5rem 2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>AI Model Results</h2>
                                <p style={{ fontSize: "0.82rem", color: "rgba(191,191,191,1)" }}>Forecast graph, metrics, demand patterns, and recommendations</p>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                {([ ["linear", "Linear"], ["rf", "RF"], ["tft", "TFT"]] as const).map(([key, label]) => {
                                    const ready = modelStatus[key] === "ready" || key === "linear";
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            disabled={!ready}
                                            onClick={() => setSelectedModel(key)}
                                            className="model-tab"
                                            style={{
                                                padding: "8px 18px",
                                                fontSize: "0.72rem",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em",
                                                borderRight: key !== "tft" ? "1px solid rgba(255,255,255,0.1)" : "none",
                                                background: selectedModel === key ? "rgba(255,0,0,0.2)" : "#0D1117",
                                                color: selectedModel === key ? "#fff" : "rgba(191,191,191,1)",
                                                border: "none",
                                                cursor: ready ? "pointer" : "not-allowed",
                                                opacity: ready ? 1 : 0.45,
                                                transition: "background 0.2s ease, color 0.2s ease",
                                            }}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Model Status */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            marginBottom: "1.25rem",
                        }}>
                            {([ ["linear", "Linear Regression"], ["rf", "Random Forest"], ["tft", "TFT"]] as const).map(([key, label]) => (
                                <div key={key} style={{ padding: 16, borderRight: key !== "tft" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                                    <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(191,191,191,1)" }}>{label}</p>
                                    <p style={{
                                        marginTop: 6, fontSize: "0.85rem",
                                        color: modelStatus[key] === "ready" ? "#34D399" : modelStatus[key] === "training" ? "#F59E0B" : "rgba(139,148,158,1)",
                                        fontWeight: 500,
                                    }}>
                                        {modelStatus[key] === "ready" ? "✓ Ready" : modelStatus[key] === "training" ? "⟳ Training" : modelStatus[key]}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {activeResult ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                {/* Metric row */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    {[
                                        { label: "Model", val: activeResult.model },
                                        { label: "Accuracy", val: `${activeResult.accuracy}%` },
                                        { label: "MAE", val: String(activeResult.mae) },
                                        { label: "Volatility", val: activeResult.demandPattern.volatility },
                                    ].map((m, i) => (
                                        <div key={m.label} style={{
                                            padding: 16,
                                            borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                            opacity: 0,
                                            animation: `slideUp 0.4s ease-out ${1.0 + i * 0.07}s forwards`,
                                        }}>
                                            <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(191,191,191,1)" }}>{m.label}</p>
                                            <p style={{ marginTop: 6, fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>{m.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Forecast chart + recommendations */}
                                <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ padding: "1.5rem", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                                        <h3 style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(191,191,191,1)", marginBottom: 12 }}>
                                            Forecast Graph
                                        </h3>
                                        <div style={{ height: 280 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={activeResult.graphData}>
                                                    <defs>
                                                        <linearGradient id="modelPred" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#FFFFFF" }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: "#FFFFFF" }} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            borderRadius: 6,
                                                            border: "1px solid rgba(255,0,0,0.3)",
                                                            backgroundColor: "#0D1117",
                                                            color: "#FFFFFF",
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="actual"
                                                        stroke="#9CA3AF"
                                                        strokeWidth={2}
                                                        fill="transparent"
                                                        name="Actual"
                                                        isAnimationActive={true}
                                                        animationDuration={1600}
                                                        animationEasing="ease-out"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="predicted"
                                                        stroke="#FF0000"
                                                        strokeWidth={2.5}
                                                        fill="url(#modelPred)"
                                                        name="Predicted"
                                                        isAnimationActive={true}
                                                        animationDuration={2000}
                                                        animationEasing="ease-out"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div style={{ padding: "1.5rem" }}>
                                        <h3 style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(191,191,191,1)", marginBottom: 12 }}>
                                            Recommendations
                                        </h3>
                                        <div style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                                            {activeResult.recommendations.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        padding: "10px 12px",
                                                        borderBottom: idx < activeResult.recommendations.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                                        fontSize: "0.78rem",
                                                        color: "rgba(191,191,191,1)",
                                                        lineHeight: 1.5,
                                                        display: "flex",
                                                        gap: 8,
                                                        opacity: 0,
                                                        animation: `slideUp 0.4s ease-out ${1.2 + idx * 0.1}s forwards`,
                                                    }}
                                                >
                                                    <span style={{ color: "#FF4D4D", flexShrink: 0 }}>→</span>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.03)",
                                padding: 16,
                                fontSize: "0.85rem",
                                color: "rgba(191,191,191,1)",
                            }}>
                                {resultsError || "No training results available yet. Complete onboarding and run model training."}
                            </div>
                        )}
                    </FadeSection>
                </div>
            </div>
        </>
    );
}
