"use client";

interface NavbarProps {
    title: string;
    subtitle?: string;
}

export default function Navbar({ title, subtitle }: NavbarProps) {
    return (
        <header className="sticky top-0 z-30 bg-[rgba(29,30,39,0.86)] backdrop-blur-md border-b border-[rgba(224,226,228,0.14)]">
            <div className="flex items-center justify-between px-6 py-4 lg:px-8">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-light-gray)] leading-tight">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-[rgba(224,226,228,0.72)] mt-0.5">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(75,78,83,0.72)] border border-[rgba(224,226,228,0.16)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0E2E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-[var(--color-light-gray)] w-40 placeholder:text-[rgba(224,226,228,0.62)]"
                        />
                    </div>
                    <button className="relative p-2 rounded-xl hover:bg-[rgba(255,0,0,0.14)] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0E2E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-primary)] rounded-full"></span>
                    </button>
                    <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-[var(--color-light-gray)] text-sm font-semibold">
                        A
                    </div>
                </div>
            </div>
        </header>
    );
}
