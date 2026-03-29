"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <Link href="/" className="flex items-center gap-3 mb-12 no-underline">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" /><path d="M3 21h18" /></svg>
                        </div>
                        <span className="text-white font-bold text-xl">PharmaSense AI</span>
                    </Link>
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Intelligent Demand<br />Forecasting
                    </h2>
                    <p className="text-indigo-200 text-lg leading-relaxed max-w-md">
                        Access real-time predictions, inventory optimization, and AI-powered
                        insights for your pharmaceutical supply chain.
                    </p>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2 no-underline text-slate-900">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" /><path d="M3 21h18" /></svg>
                            </div>
                            <span className="font-bold">PharmaSense AI</span>
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
                    <p className="text-slate-500 mb-8">Sign in to your account to continue</p>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-8">
                        Don&#39;t have an account?{" "}
                        <Link href="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
