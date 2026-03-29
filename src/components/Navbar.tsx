"use client";

interface NavbarProps {
    title: string;
    subtitle?: string;
}

export default function Navbar({ title, subtitle }: NavbarProps) {
    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
            <div className="flex items-center justify-between px-6 py-4 lg:px-8">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-slate-700 w-40 placeholder:text-slate-400"
                        />
                    </div>
                    <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                        A
                    </div>
                </div>
            </div>
        </header>
    );
}
