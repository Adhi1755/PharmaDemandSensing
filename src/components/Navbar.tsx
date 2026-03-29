"use client";

interface NavbarProps {
    title: string;
    subtitle?: string;
}

export default function Navbar({ title, subtitle }: NavbarProps) {
    return (
        <header className="sticky top-0 z-30 w-full bg-[#1D1E27] border-b border-gray-700/20">
            <div className="flex items-center justify-between px-4 py-3">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-light-gray)] leading-tight">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-[rgba(224,226,228,0.72)] mt-0.5">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative p-2 border border-gray-700/20 hover:bg-[rgba(255,0,0,0.14)] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0E2E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-primary)] rounded-full"></span>
                    </button>
                    <div className="w-9 h-9 gradient-bg border border-gray-700/20 flex items-center justify-center text-[var(--color-light-gray)] text-sm font-semibold">
                        A
                    </div>
                </div>
            </div>
        </header>
    );
}
