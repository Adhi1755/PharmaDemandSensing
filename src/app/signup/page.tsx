"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/api";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            await signup(name, email, password);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div data-page-main="true" className="min-h-screen flex app-bg">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg relative overflow-hidden">
                <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-[rgba(255,255,255,0.12)] rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[rgba(29,30,39,0.2)] rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <Link href="/" className="flex items-center gap-3 mb-12 no-underline">
                        <div className="w-10 h-10 rounded-xl bg-[rgba(29,30,39,0.2)] flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" /><path d="M3 21h18" /></svg>
                        </div>
                        <span className="text-[var(--color-light-gray)] font-bold text-xl">PharmaSense AI</span>
                    </Link>
                    <h2 className="text-4xl font-bold text-[var(--color-light-gray)] mb-4 leading-tight">
                        Start Optimizing<br />Your Supply Chain
                    </h2>
                    <p className="text-[rgba(191,191,191,1)] text-lg leading-relaxed max-w-md">
                        Join PharmaSense to unlock AI-powered demand forecasting,
                        smart inventory management, and actionable business insights.
                    </p>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[rgba(29,30,39,0.7)]">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-2 no-underline text-[var(--color-light-gray)]">
                            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" /><path d="M3 21h18" /></svg>
                            </div>
                            <span className="font-bold">PharmaSense AI</span>
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold text-[var(--color-light-gray)] mb-2">Create your account</h1>
                    <p className="text-[rgba(191,191,191,1)] mb-8">Get started with PharmaSense AI</p>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-[rgba(255,0,0,0.16)] border border-[rgba(255,0,0,0.3)] text-[var(--color-primary)] text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[rgba(191,191,191,1)] mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[rgba(191,191,191,1)] mb-1.5">Email</label>
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
                            <label className="block text-sm font-medium text-[rgba(191,191,191,1)] mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="Min. 6 characters"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary gsap-btn w-full justify-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[rgba(191,191,191,1)] mt-8">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-deep-red)]">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
