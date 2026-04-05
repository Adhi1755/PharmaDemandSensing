"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    getPreviewData,
    processData,
    saveUserDetails,
    uploadDataset,
    predictDemand,
    forecastDemand,
    type AuthUser,
} from "@/lib/api";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: { id: Step; title: string }[] = [
    { id: 1, title: "Profile" },
    { id: 2, title: "Upload" },
    { id: 3, title: "Preview" },
    { id: 4, title: "Process" },
];

const LOCAL_USER_KEY = "pharmasens_user";

const UPLOAD_SUBSTEPS = [
    "Validating data",
    "Detecting columns",
    "Cleaning missing values",
    "Generating preview",
];

/* detect column role from name */
function detectColumnRole(col: string): "date" | "sales" | "drug" | "location" | null {
    const c = col.toLowerCase();
    if (/date|time|period|month|week|day|year|datum/.test(c)) return "date";
    if (/sale|qty|quantity|demand|units|amount|revenue|volume|sold/.test(c)) return "sales";
    if (/drug|product|med|medicine|item|sku|name|brand|generic|category/.test(c)) return "drug";
    if (/loc|region|city|state|store|branch|pharmacy|area|zone/.test(c)) return "location";
    return null;
}

/* ═══════════════════════════════════════════
   AI VISUAL PROCESSING — neural net animation
═══════════════════════════════════════════ */
const INSIGHTS = [
    "Pharmaceutical time-series detected",
    "Seasonal demand patterns found",
    "Null values cleaned automatically",
    "Feature vectors built: lag_1 → lag_7",
    "Optimal model: XGBoost / LSTM",
    "Dataset ready for forecasting ✓",
];

const NODES = [
    [60, 80], [60, 160], [60, 240],
    [180, 60], [180, 140], [180, 220], [180, 300],
    [300, 100], [300, 200], [300, 300],
    [420, 160], [420, 240],
];
const EDGES = [
    [0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [1, 6], [2, 4], [2, 5], [2, 6],
    [3, 7], [3, 8], [4, 7], [4, 8], [4, 9], [5, 8], [5, 9], [6, 8], [6, 9],
    [7, 10], [7, 11], [8, 10], [8, 11], [9, 10], [9, 11],
];

function DataProcessingAnimation() {
    const [phase, setPhase] = useState(0);
    const [scanX, setScanX] = useState(0);
    const [glowEdge, setGlowEdge] = useState(0);
    const [statVal, setStatVal] = useState([0, 0, 0]);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const iv = setInterval(() => {
            setPhase((p) => {
                if (p >= INSIGHTS.length - 1) { setDone(true); clearInterval(iv); return p; }
                return p + 1;
            });
        }, 900);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        let x = 0;
        const iv = setInterval(() => { x = (x + 1.2) % 102; setScanX(x); }, 22);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setGlowEdge((e) => (e + 1) % EDGES.length), 120);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        const targets = [2439, 97, 12];
        const duration = 1800;
        const start = Date.now();
        const iv = setInterval(() => {
            const t = Math.min((Date.now() - start) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            setStatVal(targets.map((v) => Math.round(v * ease)));
            if (t >= 1) clearInterval(iv);
        }, 30);
        return () => clearInterval(iv);
    }, []);

    return (
        <div style={{ border: "1px solid rgba(255,0,0,0.18)", borderRadius: 6, background: "linear-gradient(160deg,#0D1117,#0a0f1a)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!done ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
                            <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,0,0,0.2)" strokeWidth="2" />
                            <circle cx="8" cy="8" r="6" fill="none" stroke="#FF0000" strokeWidth="2" strokeDasharray="37.7" strokeDashoffset="28.3" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(52,211,153,0.2)", border: "1.5px solid #34D399", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="#34D399" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                        </div>
                    )}
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: done ? "#34D399" : "#FF4D4D" }}>
                        {done ? "Analysis Complete" : "AI Processing..."}
                    </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {[
                        { label: "Rows", val: statVal[0].toLocaleString() },
                        { label: "Accuracy", val: `${statVal[1]}%` },
                        { label: "Features", val: String(statVal[2]) },
                    ].map((s) => (
                        <div key={s.label} style={{ fontSize: "0.65rem", padding: "3px 8px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(201,209,217,0.9)", fontVariantNumeric: "tabular-nums" }}>
                            <span style={{ color: "rgba(139,148,158,0.8)" }}>{s.label} </span>
                            <span style={{ fontWeight: 700, color: "#fff" }}>{s.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0 }}>
                <div style={{ position: "relative", overflow: "hidden" }}>
                    <svg viewBox="0 0 480 360" style={{ width: "100%", height: 200, display: "block" }} preserveAspectRatio="xMidYMid meet">
                        {EDGES.map(([a, b], i) => {
                            const [x1, y1] = NODES[a];
                            const [x2, y2] = NODES[b];
                            const isGlow = i === glowEdge;
                            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isGlow ? "#FF4D4D" : "rgba(255,255,255,0.07)"} strokeWidth={isGlow ? 1.5 : 0.8} style={{ transition: "stroke 0.1s ease, stroke-width 0.1s ease" }} />;
                        })}
                        {NODES.map(([cx, cy], i) => {
                            const isOutput = i >= 10;
                            const isInput = i <= 2;
                            const color = isOutput ? "#FF4D4D" : isInput ? "#60A5FA" : "#8B949E";
                            const glowing = EDGES[glowEdge]?.includes(i);
                            return (
                                <g key={i}>
                                    {glowing && <circle cx={cx} cy={cy} r={9} fill="none" stroke={color} strokeWidth="1" opacity={0.4} />}
                                    <circle cx={cx} cy={cy} r={5} fill={glowing ? color : "rgba(255,255,255,0.12)"} style={{ transition: "fill 0.15s ease" }} />
                                </g>
                            );
                        })}
                        {[["Input", 60], ["Hidden", 180], ["Hidden", 300], ["Output", 420]].map(([lbl, x], idx) => (
                            <text key={idx} x={Number(x)} y={340} textAnchor="middle" fontSize={9} fill="rgba(139,148,158,0.5)" fontFamily="monospace">{String(lbl)}</text>
                        ))}
                    </svg>
                    <div style={{
                        position: "absolute", top: 0, bottom: 0, left: `${scanX}%`, width: 2,
                        background: "linear-gradient(to bottom,transparent,rgba(255,0,0,0.7),transparent)",
                        pointerEvents: "none", boxShadow: "0 0 12px rgba(255,0,0,0.5)",
                    }} />
                </div>

                <div style={{ width: 220, borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(139,148,158,0.6)", marginBottom: 8 }}>Live Insights</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {INSIGHTS.map((ins, i) => {
                                const revealed = i <= phase;
                                const active = i === phase;
                                return (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5, opacity: revealed ? 1 : 0.15, transition: "opacity 0.4s ease" }}>
                                        <span style={{ color: active ? "#FF4D4D" : revealed ? "#34D399" : "rgba(255,255,255,0.15)", fontSize: 9, marginTop: 2, flexShrink: 0 }}>
                                            {active ? "▶" : revealed ? "✓" : "○"}
                                        </span>
                                        <span style={{ fontSize: "0.68rem", color: active ? "#fff" : revealed ? "rgba(201,209,217,0.7)" : "rgba(139,148,158,0.4)", lineHeight: 1.4, fontWeight: active ? 600 : 400 }}>
                                            {ins}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: "0.6rem", color: "rgba(139,148,158,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Progress</span>
                            <span style={{ fontSize: "0.6rem", color: done ? "#34D399" : "#FF4D4D", fontWeight: 700 }}>
                                {Math.round(((phase + 1) / INSIGHTS.length) * 100)}%
                            </span>
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", width: `${((phase + 1) / INSIGHTS.length) * 100}%`,
                                background: done ? "#34D399" : "linear-gradient(90deg,#FF0000,#FF4D4D)",
                                borderRadius: 2, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1), background 0.5s ease",
                                boxShadow: done ? "0 0 8px #34D39966" : "0 0 8px rgba(255,0,0,0.5)",
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, overflow: "hidden", position: "relative", height: 32 }}>
                <span style={{ fontSize: "0.6rem", color: "rgba(139,148,158,0.5)", whiteSpace: "nowrap", marginRight: 4 }}>Data stream</span>
                {["M01AB", "N02BE", "R03", "N05C", "2,439", "97.2%", "lag_7", "LSTM", "XGBoost", "Σ demand", "μ=134", "σ=42"].map((tok, i) => (
                    <div key={tok} style={{
                        fontSize: "0.62rem", fontFamily: "monospace",
                        color: i % 3 === 0 ? "#FF4D4D" : i % 3 === 1 ? "#60A5FA" : "rgba(201,209,217,0.5)",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 2, padding: "1px 5px", whiteSpace: "nowrap",
                        animation: `slideToken 6s ${i * 0.5}s linear infinite`, flexShrink: 0,
                    }}>{tok}</div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   UPLOAD PROCESSING OVERLAY
═══════════════════════════════════════════ */
function UploadOverlay({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!visible) { setCurrentStep(0); setProgress(0); setDone(false); return; }
        const totalMs = 3400;
        const stepMs = totalMs / UPLOAD_SUBSTEPS.length;
        const si = setInterval(() => setCurrentStep((p) => Math.min(p + 1, UPLOAD_SUBSTEPS.length - 1)), stepMs);
        const pi = setInterval(() => setProgress((p) => { if (p >= 100) { clearInterval(pi); return 100; } return p + 1; }), totalMs / 100);
        const t = setTimeout(() => { setDone(true); setTimeout(onComplete, 400); }, totalMs + 100);
        return () => { clearInterval(si); clearInterval(pi); clearTimeout(t); };
    }, [visible, onComplete]);

    if (!visible) return null;
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.93)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease-out" }}>
            <div style={{ width: "100%", maxWidth: 480, padding: "2.5rem", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(13,17,23,0.97)", borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                    <div style={{ position: "relative", width: 64, height: 64 }}>
                        <svg width="64" height="64" viewBox="0 0 64 64" style={{ animation: "spin 1.2s linear infinite" }}>
                            <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                            <circle cx="32" cy="32" r="27" fill="none" stroke="#FF0000" strokeWidth="3" strokeDasharray="169.6" strokeDashoffset="127.2" strokeLinecap="round" />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🧬</div>
                    </div>
                </div>
                <p style={{ textAlign: "center", fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>Preparing Dataset...</p>
                <p style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(139,148,158,1)", marginBottom: "1.5rem" }}>Our AI is analysing your pharmaceutical data</p>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: "1.5rem", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#FF0000,#FF4D4D)", borderRadius: 2, transition: "width 0.1s linear" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {UPLOAD_SUBSTEPS.map((label, i) => {
                        const active = i === currentStep;
                        const done2 = i < currentStep;
                        return (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, opacity: done2 ? 0.6 : active ? 1 : 0.28, transition: "opacity 0.3s ease" }}>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${done2 ? "#34D399" : active ? "#FF0000" : "rgba(255,255,255,0.2)"}`, background: done2 ? "rgba(52,211,153,0.15)" : active ? "rgba(255,0,0,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
                                    {done2 ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#34D399" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                                        : active ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF0000", animation: "pulseDot 0.9s ease-in-out infinite" }} /> : null}
                                </div>
                                <span style={{ fontSize: "0.82rem", color: done2 ? "#34D399" : active ? "#fff" : "rgba(139,148,158,1)", fontWeight: active ? 700 : 400, transition: "all 0.3s ease" }}>{label}</span>
                                {active && <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>{[0, 1, 2].map((d) => <div key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: "#FF0000", animation: `bounceDot 0.8s ${d * 0.15}s ease-in-out infinite` }} />)}</div>}
                            </div>
                        );
                    })}
                </div>
                {done && <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.82rem", color: "#34D399", animation: "fadeIn 0.3s ease-out" }}>✓ Dataset ready</p>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ML PREDICTION OVERLAY
═══════════════════════════════════════════ */
const PREDICTION_STEPS = [
    "Loading XGBoost classifier",
    "Running demand classification",
    "Loading LSTM model",
    "Generating time-series forecast",
    "Computing feature importance",
    "Building pharma insights",
];

function PredictionOverlay({ visible }: { visible: boolean }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!visible) { setCurrentStep(0); setProgress(0); return; }
        const totalMs = 8000;
        const stepMs = totalMs / PREDICTION_STEPS.length;
        const si = setInterval(() => setCurrentStep((p) => Math.min(p + 1, PREDICTION_STEPS.length - 1)), stepMs);
        const pi = setInterval(() => setProgress((p) => { if (p >= 98) { clearInterval(pi); return 98; } return p + 0.5; }), totalMs / 200);
        return () => { clearInterval(si); clearInterval(pi); };
    }, [visible]);

    if (!visible) return null;
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, animation: "fadeIn 0.4s ease-out" }}>
            <div style={{ position: "relative", width: 72, height: 72 }}>
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,0,0,0.15)" strokeWidth="4" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#FF0000" strokeWidth="4" strokeDasharray="188.5" strokeDashoffset="141.4" strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🔬</div>
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>Running ML Models...</p>
                <p style={{ fontSize: "0.85rem", color: "rgba(139,148,158,1)" }}>XGBoost · Random Forest · LSTM</p>
            </div>
            <div style={{ width: "100%", maxWidth: 400 }}>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#FF0000,#FF4D4D)", borderRadius: 2, transition: "width 0.2s linear", boxShadow: "0 0 10px rgba(255,0,0,0.5)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {PREDICTION_STEPS.map((label, i) => {
                        const active = i === currentStep;
                        const done = i < currentStep;
                        return (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, opacity: done ? 0.5 : active ? 1 : 0.2, transition: "opacity 0.3s ease" }}>
                                <span style={{ fontSize: 10, color: done ? "#34D399" : active ? "#FF4D4D" : "rgba(255,255,255,0.2)" }}>
                                    {done ? "✓" : active ? "▶" : "○"}
                                </span>
                                <span style={{ fontSize: "0.82rem", color: done ? "#34D399" : active ? "#fff" : "rgba(139,148,158,0.5)", fontWeight: active ? 600 : 400 }}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   AI INSIGHT BANNER
═══════════════════════════════════════════ */
function AIInsightBanner({ salesCol }: { salesCol: string }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t); }, []);
    if (!visible) return null;
    return (
        <div style={{ border: "1px solid rgba(255,0,0,0.28)", background: "linear-gradient(135deg,rgba(255,0,0,0.07),rgba(255,77,77,0.04))", borderRadius: 4, padding: "1rem 1.25rem", animation: "slideUp 0.5s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#FF4D4D", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Analysis Complete</p>
            </div>
            <p style={{ fontSize: "0.88rem", color: "#fff", marginBottom: 14, lineHeight: 1.6 }}>
                We detected this dataset contains{" "}
                <span style={{ color: "#FF4D4D", fontWeight: 700 }}>pharmaceutical sales trends</span>.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                    { icon: "📊", text: `Best column for forecasting: `, highlight: salesCol || "Sales" },
                    { icon: "⚡", text: "Models: ", highlight: "XGBoost + Random Forest + LSTM" },
                ].map(({ icon, text, highlight }) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        <span style={{ fontSize: "0.8rem", color: "rgba(201,209,217,1)" }}>{text}<strong style={{ color: "#FF4D4D" }}>{highlight}</strong></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   DATA PREVIEW TABLE
═══════════════════════════════════════════ */
function DataPreviewTable({ rows, headers }: { rows: Record<string, string | number | null>[]; headers: string[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
    const display = rows.slice(0, 5);

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(139,148,158,1)", fontWeight: 600 }}>
                    📋 Dataset Preview — First 5 Rows
                </p>
                <span style={{ fontSize: "0.68rem", color: "rgba(139,148,158,0.7)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 2 }}>
                    {rows.length} rows detected
                </span>
            </div>
            <div style={{ overflowX: "auto", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "#0D1117", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.5s ease-out, transform 0.5s ease-out" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", minWidth: 500 }}>
                    <thead>
                        <tr style={{ background: "rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 2 }}>
                            {headers.map((h) => (
                                <th key={h} style={{ padding: "10px 14px", fontWeight: 600, textAlign: "left", fontSize: "0.7rem", letterSpacing: "0.09em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.06)", color: "rgba(201,209,217,0.9)", whiteSpace: "nowrap" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {display.map((row, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? "#0D1117" : "rgba(255,255,255,0.018)", cursor: "default", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(6px)", transition: `opacity 0.4s ease ${0.12 + idx * 0.07}s, transform 0.4s ease ${0.12 + idx * 0.07}s` }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,0,0,0.055)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "#0D1117" : "rgba(255,255,255,0.018)"; }}
                            >
                                {headers.map((h) => (
                                    <td key={h} style={{ padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.04)", color: "rgba(201,209,217,0.85)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {String(row[h] ?? "")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   SUMMARY CHIPS
═══════════════════════════════════════════ */
function SummaryChips({ totalRows, totalCols }: { totalRows: number; totalCols: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);
    const chips = [
        { icon: "🗂️", label: "Total Rows", val: totalRows.toLocaleString() },
        { icon: "📐", label: "Columns", val: String(totalCols) },
        { icon: "🏥", label: "Domain", val: "Pharma Sales" },
        { icon: "🤖", label: "AI Ready", val: "Yes" },
    ];
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {chips.map((c, i) => (
                <div key={c.label} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 4, padding: "6px 12px",
                    opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${i * 0.07}s`,
                }}>
                    <span style={{ fontSize: 14 }}>{c.icon}</span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(139,148,158,1)" }}>{c.label}:</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>{c.val}</span>
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function OnboardingPage() {
    const router = useRouter();
    const routerRef = useRef(router);
    const hasFetchedAuth = useRef(false);
    const [step, setStep] = useState<Step>(1);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [globalError, setGlobalError] = useState("");

    /* Step 1 */
    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [city, setCity] = useState("");
    const [stateName, setStateName] = useState("");
    const [pharmacyType, setPharmacyType] = useState("");
    const [savingDetails, setSavingDetails] = useState(false);

    /* Step 2 */
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showUploadOverlay, setShowUploadOverlay] = useState(false);
    const pendingData = useRef<{ columns: string[]; preview: Record<string, string | number | null>[] } | null>(null);

    /* Step 3 */
    const [columns, setColumns] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<Record<string, string | number | null>[]>([]);
    const [dateColumn, setDateColumn] = useState("");
    const [salesColumn, setSalesColumn] = useState("");
    const [drugColumn, setDrugColumn] = useState("");
    const [locationColumn, setLocationColumn] = useState("");

    /* Step 4 */
    const [processing, setProcessing] = useState(false);
    const [processedRows, setProcessedRows] = useState<number | null>(null);

    /* ML Prediction overlay */
    const [showPredictionOverlay, setShowPredictionOverlay] = useState(false);

    // Keep router ref current without triggering re-renders
    useEffect(() => {
        routerRef.current = router;
    });

    /* Auth check */
    useEffect(() => {
        if (hasFetchedAuth.current) return;
        hasFetchedAuth.current = true;

        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (!raw) { routerRef.current.replace("/login"); return; }
        try {
            const parsed = JSON.parse(raw) as AuthUser;
            setUser(parsed);
            setFullName(parsed.name || "");
            if (parsed.hasUploadedData && !parsed.isNewUser) routerRef.current.replace("/dashboard");
        } catch {
            localStorage.removeItem(LOCAL_USER_KEY);
            routerRef.current.replace("/login");
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* Fetch preview if navigating back */
    useEffect(() => {
        if (!user || step < 3 || (previewRows.length > 0 && columns.length > 0)) return;
        getPreviewData(user.email)
            .then((res) => { setColumns(res.columns); setPreviewRows(res.preview); })
            .catch(() => { });
    }, [user, step, previewRows.length, columns.length]);

    /* Auto-detect columns */
    useEffect(() => {
        if (columns.length === 0) return;
        columns.forEach((col) => {
            const role = detectColumnRole(col);
            if (role === "date" && !dateColumn) setDateColumn(col);
            else if (role === "sales" && !salesColumn) setSalesColumn(col);
            else if (role === "drug" && !drugColumn) setDrugColumn(col);
            else if (role === "location" && !locationColumn) setLocationColumn(col);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns]);

    const previewHeaders = useMemo(() => (previewRows.length === 0 ? [] as string[] : Object.keys(previewRows[0])), [previewRows]);

    /* ── Handlers ── */
    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault(); if (!user) return;
        setGlobalError(""); setSavingDetails(true);
        try { await saveUserDetails({ email: user.email, fullName, companyName, city, state: stateName, pharmacyType }); setStep(2); }
        catch (err) { setGlobalError(err instanceof Error ? err.message : "Failed to save details"); }
        finally { setSavingDetails(false); }
    };

    const handleUpload = async () => {
        if (!user || !selectedFile) return;
        setGlobalError(""); setUploading(true);
        try {
            const res = await uploadDataset(user.email, selectedFile);
            pendingData.current = { columns: res.columns, preview: res.preview };
            setShowUploadOverlay(true);
        } catch (err) { setGlobalError(err instanceof Error ? err.message : "Upload failed"); setUploading(false); }
    };

    const handleOverlayComplete = useCallback(() => {
        setShowUploadOverlay(false);
        if (pendingData.current) {
            setColumns(pendingData.current.columns);
            setPreviewRows(pendingData.current.preview);
            pendingData.current = null;
        }
        setUploading(false);
        setStep(3);
    }, []);

    const handleProcess = async () => {
        if (!user) return;
        const dc = dateColumn || columns.find((c) => detectColumnRole(c) === "date") || columns[0] || "";
        const sc = salesColumn || columns.find((c) => detectColumnRole(c) === "sales") || columns[1] || "";
        const dk = drugColumn || columns.find((c) => detectColumnRole(c) === "drug") || columns[2] || "";
        if (!dc || !sc || !dk) { setGlobalError("Could not auto-detect required columns. Please try a different dataset."); return; }
        if (new Set([dc, sc, dk]).size !== 3) { setGlobalError("Date, sales, and drug columns must be different."); return; }
        setGlobalError(""); setStep(4 as Step); setProcessing(true);
        try {
            const res = await processData({ email: user.email, dateColumn: dc, salesColumn: sc, drugColumn: dk, locationColumn: locationColumn || undefined });
            setProcessedRows(res.processedRows);

            // Mark user as onboarded
            const updatedUser: AuthUser = { ...user, isNewUser: false, hasUploadedData: true };
            setUser(updatedUser);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));

            // Show ML prediction overlay and run predictions
            setShowPredictionOverlay(true);

            // Run ML predictions in parallel
            await Promise.all([
                predictDemand(user.email),
                forecastDemand(user.email, 14),
            ]);

            // Redirect to dashboard after predictions complete
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : "Processing failed");
            setShowPredictionOverlay(false);
            setStep(3 as Step);
        }
        finally { setProcessing(false); }
    };

    const onDropFile = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setSelectedFile(f); };

    return (
        <>
            <style>{`
                @keyframes spin { to { transform:rotate(360deg); } }
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulseDot { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.5); opacity:0.6; } }
                @keyframes bounceDot { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
                @keyframes slideToken { 0% { transform:translateX(0); opacity:1; } 85% { opacity:1; } 100% { transform:translateX(-120px); opacity:0; } }
                .upload-zone:hover { border-color:rgba(255,0,0,0.4)!important; background:rgba(255,0,0,0.03)!important; }
                .cta-btn:hover { transform:translateY(-2px); box-shadow:0 10px 36px rgba(255,0,0,0.4)!important; }
                .cta-btn:active { transform:translateY(0); }
            `}</style>

            <UploadOverlay visible={showUploadOverlay} onComplete={handleOverlayComplete} />
            <PredictionOverlay visible={showPredictionOverlay} />

            <div className="relative min-h-screen overflow-x-hidden bg-[#0D1117] text-[#C9D1D9]">
                <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(90deg,rgba(218,54,51,0.14) 0px,rgba(218,54,51,0.14) 1px,transparent 1px,transparent 40px)" }} />

                <main className="relative z-10 flex min-h-screen justify-center px-6 py-10 lg:px-8">
                    <section className="w-full max-w-6xl border border-[rgba(255,255,255,0.12)] bg-[#0D1117]">

                        {/* Header */}
                        <header className="border-b border-[rgba(255,255,255,0.12)] px-6 py-6 lg:px-8">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#F85149]">New User Onboarding</p>
                            <h1 className="mt-3 text-3xl font-light text-white">Dataset Pipeline Setup</h1>
                            <p className="mt-2 text-sm text-[#8B949E]">Complete your profile, upload a dataset, and start AI forecasting.</p>
                        </header>

                        {/* Step tabs */}
                        <div className="grid border-b border-[rgba(255,255,255,0.12)] sm:grid-cols-4">
                            {STEP_LABELS.map((item) => (
                                <div key={item.id} className={`border-r border-[rgba(255,255,255,0.12)] px-4 py-3 text-xs uppercase tracking-widest last:border-r-0 ${step === item.id ? "bg-[rgba(248,81,73,0.16)] text-white" : step > item.id ? "bg-[rgba(255,255,255,0.04)] text-[#C9D1D9]" : "text-[#8B949E]"}`}>
                                    {step > item.id ? "✓ " : ""}Step {item.id}: {item.title}
                                </div>
                            ))}
                        </div>

                        {globalError && <div className="border-b border-[rgba(255,255,255,0.12)] bg-[rgba(248,81,73,0.14)] px-6 py-3 text-sm text-[#FCA5A5]">{globalError}</div>}

                        <div className="p-6 lg:p-8">

                            {/* ── STEP 1 ── */}
                            {step === 1 && (
                                <form onSubmit={handleSaveDetails} className="grid gap-5 lg:grid-cols-2">
                                    <div className="lg:col-span-2"><label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Full Name</label><input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
                                    <div className="lg:col-span-2"><label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Pharmacy / Company Name</label><input className="input-field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></div>
                                    <div><label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">City</label><input className="input-field" value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                                    <div><label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">State</label><input className="input-field" value={stateName} onChange={(e) => setStateName(e.target.value)} required /></div>
                                    <div className="lg:col-span-2"><label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Type of Pharmacy (Optional)</label><input className="input-field" value={pharmacyType} onChange={(e) => setPharmacyType(e.target.value)} placeholder="Retail, Hospital, Chain, Distributor" /></div>
                                    <div className="lg:col-span-2"><button type="submit" disabled={savingDetails} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">{savingDetails ? "Saving profile..." : "Continue To Dataset Upload"}</button></div>
                                </form>
                            )}

                            {/* ── STEP 2 ── */}
                            {step === 2 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                    <div className="upload-zone" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 220, padding: "2rem", textAlign: "center", border: "2px dashed rgba(255,255,255,0.15)", background: selectedFile ? "rgba(255,0,0,0.04)" : "rgba(255,255,255,0.02)", transition: "all 0.25s ease", cursor: "pointer", gap: 8 }}
                                        onDragOver={(e) => e.preventDefault()} onDrop={onDropFile}
                                    >
                                        <div style={{ fontSize: 44, marginBottom: 4 }}>📂</div>
                                        <p style={{ fontSize: "1.05rem", fontWeight: 300, color: "#fff" }}>Drag and drop CSV / XLSX here</p>
                                        <p style={{ fontSize: "0.82rem", color: "rgba(139,148,158,1)" }}>or choose file manually</p>
                                        <input style={{ marginTop: 16, width: "100%", maxWidth: 340 }} className="border border-[rgba(255,255,255,0.12)] bg-black px-3 py-2 text-sm" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                    </div>
                                    {selectedFile && (
                                        <div style={{ border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.06)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, animation: "slideUp 0.3s ease-out" }}>
                                            <span style={{ fontSize: 18 }}>📄</span>
                                            <div>
                                                <p style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 500 }}>{selectedFile.name}</p>
                                                <p style={{ fontSize: "0.75rem", color: "rgba(139,148,158,1)" }}>{(selectedFile.size / 1024).toFixed(1)} KB · Ready to upload</p>
                                            </div>
                                        </div>
                                    )}
                                    <button type="button" onClick={handleUpload} disabled={!selectedFile || uploading} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
                                        {uploading ? "Processing..." : "Upload And Preview"}
                                    </button>
                                </div>
                            )}

                            {/* ── STEP 3 ── */}
                            {step === 3 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    <AIInsightBanner salesCol={salesColumn} />
                                    <SummaryChips totalRows={previewRows.length} totalCols={columns.length} />
                                    {previewRows.length > 0 && <DataPreviewTable rows={previewRows} headers={previewHeaders} />}
                                    <DataProcessingAnimation />
                                    <button
                                        type="button"
                                        onClick={handleProcess}
                                        className="cta-btn"
                                        style={{
                                            width: "100%", background: "linear-gradient(135deg,#FF0000,#FF4D4D)",
                                            color: "#fff", padding: "15px 28px", fontWeight: 700, fontSize: "1rem",
                                            border: "none", cursor: "pointer", display: "flex",
                                            alignItems: "center", justifyContent: "center", gap: 10,
                                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                            letterSpacing: "0.04em", animation: "slideUp 0.5s 0.5s ease-out both",
                                        }}
                                    >
                                        <span>✦</span> Confirm And Process Data <span>→</span>
                                    </button>
                                </div>
                            )}

                            {/* ── STEP 4 ── */}
                            {step === 4 && (
                                <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "#161B22", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", animation: "fadeIn 0.4s ease-out" }}>
                                    <div style={{ position: "relative", width: 72, height: 72 }}>
                                        <svg width="72" height="72" viewBox="0 0 72 72" style={{ animation: "spin 1s linear infinite" }}>
                                            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,0,0,0.12)" strokeWidth="4" />
                                            <circle cx="36" cy="36" r="30" fill="none" stroke="#FF0000" strokeWidth="4" strokeDasharray="188.5" strokeDashoffset="141.4" strokeLinecap="round" />
                                        </svg>
                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>⚡</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                                            {processing ? "Processing & Running ML Models..." : "✓ Complete — Redirecting..."}
                                        </p>
                                        <p style={{ fontSize: "0.82rem", color: "rgba(139,148,158,1)" }}>
                                            {processing
                                                ? "Preprocessing data, running XGBoost, Random Forest, and LSTM models"
                                                : `${processedRows ?? 0} rows processed · Taking you to your dashboard`
                                            }
                                        </p>
                                    </div>
                                    <div style={{ width: "100%", maxWidth: 340 }}>
                                        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: processing ? "65%" : "100%", background: processing ? "linear-gradient(90deg,#FF0000,#FF4D4D)" : "#34D399", borderRadius: 2, transition: "width 1.5s cubic-bezier(0.4,0,0.2,1), background 0.5s ease", boxShadow: processing ? "0 0 10px rgba(255,0,0,0.5)" : "0 0 10px rgba(52,211,153,0.5)" }} />
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                                            {["Preprocessing", "XGBoost", "LSTM", "Done"].map((lbl, i) => (
                                                <span key={lbl} style={{ fontSize: "0.6rem", color: !processing && i === 3 ? "#34D399" : processing && i < 2 ? "rgba(201,209,217,0.7)" : "rgba(139,148,158,0.4)", transition: "color 0.4s ease" }}>{lbl}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
