"use client";

import { useState } from "react";
import type { AlertItem } from "@/lib/alerts-engine";
import { formatAlertTimestamp, severityLabel } from "@/lib/alerts-engine";

interface NotificationTrayProps {
    alerts: AlertItem[];
    dismissedIds: Set<string>;
    onDismiss: (id: string) => void;
    onClose: () => void;
}

interface ModalState {
    open: boolean;
    message: string;
}

// ── Severity style maps ───────────────────────────────────────────────────────

const SEVERITY_STYLES = {
    critical: {
        badgeBg: "rgba(248,81,73,0.14)",
        badgeBorder: "rgba(248,81,73,0.3)",
        badgeText: "#F85149",
        dotBg: "#F85149",
        cardBorder: "rgba(248,81,73,0.18)",
        accentLine: "#F85149",
    },
    medium: {
        badgeBg: "rgba(251,191,36,0.12)",
        badgeBorder: "rgba(251,191,36,0.28)",
        badgeText: "#FBBF24",
        dotBg: "#FBBF24",
        cardBorder: "rgba(251,191,36,0.18)",
        accentLine: "#FBBF24",
    },
} as const;

// ── Confirmation Modal ────────────────────────────────────────────────────────

function ConfirmModal({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={onClose}
        >
            <div
                className="relative max-w-sm w-full rounded-2xl p-6"
                style={{
                    background: "linear-gradient(145deg,rgba(20,25,32,0.98),rgba(10,14,20,0.98))",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(63,185,80,0.12)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
                    style={{ background: "linear-gradient(90deg,#3FB950,transparent)" }} />

                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(63,185,80,0.12)", color: "#3FB950" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                            <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3FB950" }}>
                            Sent Successfully
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#6E7681" }}>
                            Notification dispatched
                        </p>
                    </div>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: "#C9D1D9" }}>
                    {message}
                </p>

                <button
                    className="mt-5 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200"
                    style={{
                        background: "rgba(63,185,80,0.1)",
                        border: "1px solid rgba(63,185,80,0.25)",
                        color: "#3FB950",
                    }}
                    onClick={onClose}
                >
                    OK
                </button>
            </div>
        </div>
    );
}

// ── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({
    alert,
    onDismiss,
    onEmailSent,
    onSmsSent,
}: {
    alert: AlertItem;
    onDismiss: () => void;
    onEmailSent: (msg: string) => void;
    onSmsSent: (msg: string) => void;
}) {
    const s = SEVERITY_STYLES[alert.severity];
    const label = severityLabel(alert.severity);

    return (
        <div
            className="relative rounded-xl p-4 transition-all duration-200"
            style={{
                background: "rgba(255,255,255,0.024)",
                border: `1px solid ${s.cardBorder}`,
            }}
        >
            {/* Left accent bar */}
            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                style={{ background: s.accentLine }} />

            {/* Header row */}
            <div className="flex items-start justify-between gap-2 pl-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: s.dotBg }}
                    />
                    <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{
                            background: s.badgeBg,
                            border: `1px solid ${s.badgeBorder}`,
                            color: s.badgeText,
                        }}
                    >
                        {label}
                    </span>
                    <span className="text-[10px] truncate font-medium" style={{ color: "#8B949E" }}>
                        {alert.productName}
                    </span>
                </div>
                <button
                    onClick={onDismiss}
                    className="shrink-0 rounded-md p-0.5 transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                    title="Dismiss"
                    style={{ color: "#6E7681" }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Message */}
            <p className="pl-3 mt-2 text-xs leading-relaxed" style={{ color: "#C9D1D9" }}>
                {alert.message}
            </p>

            {/* Timestamp + actions */}
            <div className="pl-3 mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px]" style={{ color: "#6E7681" }}>
                    {formatAlertTimestamp(alert.timestamp)}
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onEmailSent(`📧 Email sent to manager@company.com: ${alert.message}`)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
                        style={{
                            background: "rgba(88,166,255,0.08)",
                            border: "1px solid rgba(88,166,255,0.2)",
                            color: "#58A6FF",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(88,166,255,0.15)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(88,166,255,0.08)";
                        }}
                    >
                        📧 Email
                    </button>
                    <button
                        onClick={() => onSmsSent(`📱 SMS sent to +1-800-INVENTORY: ${alert.message}`)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
                        style={{
                            background: "rgba(167,139,250,0.08)",
                            border: "1px solid rgba(167,139,250,0.2)",
                            color: "#A78BFA",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.15)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.08)";
                        }}
                    >
                        📱 SMS
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Notification Tray ────────────────────────────────────────────────────

export default function NotificationTray({
    alerts,
    dismissedIds,
    onDismiss,
    onClose,
}: NotificationTrayProps) {
    const [modal, setModal] = useState<ModalState>({ open: false, message: "" });

    const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id));
    const criticalCount = visibleAlerts.filter((a) => a.severity === "critical").length;

    return (
        <>
            {/* Backdrop (click outside to close) */}
            <div
                className="fixed inset-0 z-[49]"
                onClick={onClose}
            />

            {/* Tray panel */}
            <div
                className="fixed top-[68px] right-4 z-50 w-[360px] max-h-[calc(100vh-90px)] flex flex-col rounded-2xl tray-slide-in shadow-2xl"
                style={{
                    background: "linear-gradient(145deg,rgba(15,19,26,0.98),rgba(8,11,16,0.96))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 24px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(218,54,51,0.08)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                }}
            >
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
                    style={{ background: "linear-gradient(90deg,#DA3633,transparent 70%)" }} />

                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#DA3633" strokeWidth="1.8" className="h-4 w-4">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                        </svg>
                        <p className="text-sm font-semibold" style={{ color: "#E6EDF3" }}>
                            Alert Center
                        </p>
                        {criticalCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: "#DA3633", color: "#fff" }}>
                                {criticalCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors"
                        style={{ color: "#6E7681" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Alert list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {visibleAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                                style={{ background: "rgba(63,185,80,0.08)", color: "#3FB950" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: "#E6EDF3" }}>All Clear</p>
                                <p className="text-xs mt-1" style={{ color: "#6E7681" }}>No active inventory alerts</p>
                            </div>
                        </div>
                    ) : (
                        visibleAlerts.map((alert) => (
                            <AlertCard
                                key={alert.id}
                                alert={alert}
                                onDismiss={() => onDismiss(alert.id)}
                                onEmailSent={(msg) => setModal({ open: true, message: msg })}
                                onSmsSent={(msg) => setModal({ open: true, message: msg })}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                {visibleAlerts.length > 0 && (
                    <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] text-center" style={{ color: "#6E7681" }}>
                            {visibleAlerts.length} active alert{visibleAlerts.length !== 1 ? "s" : ""} ·{" "}
                            <button
                                className="underline hover:text-[#8B949E] transition-colors"
                                onClick={() => visibleAlerts.forEach((a) => onDismiss(a.id))}
                            >
                                Dismiss all
                            </button>
                        </p>
                    </div>
                )}
            </div>

            {/* Confirmation modal */}
            {modal.open && (
                <ConfirmModal
                    message={modal.message}
                    onClose={() => setModal({ open: false, message: "" })}
                />
            )}
        </>
    );
}
