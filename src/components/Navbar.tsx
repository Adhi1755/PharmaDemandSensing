"use client";

interface NavbarProps {
    title: string;
    subtitle?: string;
    alertCount?: number;
    onBellClick?: () => void;
    onCalendarClick?: () => void;
}

export default function Navbar({ title, subtitle, alertCount = 0, onBellClick, onCalendarClick }: NavbarProps) {
    return (
        <header className="sticky top-0 z-30"
            style={{
                background: "linear-gradient(180deg, rgba(8,11,16,0.98) 0%, rgba(8,11,16,0.94) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 1px 0 rgba(218,54,51,0.1), 0 4px 24px rgba(0,0,0,0.4)",
            }}
        >
            <div className="h-16 flex items-center justify-between px-5 md:px-6">
                <div className="flex items-center gap-3">
                    {/* Red accent bar */}
                    <div
                        className="hidden sm:block h-7 w-[3px] rounded-full"
                        style={{ background: "linear-gradient(180deg, #DA3633, #F85149)" }}
                    />
                    <div>
                        <h1 className="text-[17px] font-semibold leading-tight tracking-tight"
                            style={{ color: "#E6EDF3" }}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-[11px] font-normal mt-0.5 tracking-wide"
                                style={{ color: "#6E7681" }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Live indicator */}
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase"
                        style={{
                            background: "rgba(63, 185, 80, 0.08)",
                            border: "1px solid rgba(63, 185, 80, 0.2)",
                            color: "#3FB950",
                        }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3FB950] pulse-red" />
                        Live
                    </span>

                    {/* Calendar (Reorder Planner) button */}
                    <button
                        id="navbar-reorder-btn"
                        onClick={onCalendarClick}
                        className="relative p-2.5 rounded-xl transition-all duration-200"
                        title="Reorder Planner"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.1)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.25)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </button>

                    {/* Bell (Notification Tray) button */}
                    <button
                        id="navbar-notifications-btn"
                        onClick={onBellClick}
                        className="relative p-2.5 rounded-xl transition-all duration-200"
                        title="Alert Center"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(218,54,51,0.1)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(218,54,51,0.25)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                    >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B949E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {/* Live alert count badge */}
                        {alertCount > 0 ? (
                            <span
                                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{ background: "#DA3633", color: "#fff" }}
                            >
                                {alertCount > 9 ? "9+" : alertCount}
                            </span>
                        ) : (
                            <span
                                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full pulse-red"
                                style={{ background: "#DA3633" }}
                            />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
