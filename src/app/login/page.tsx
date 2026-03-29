"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

const LOCAL_USER_KEY = "pharmasens_user";

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
            const res = await login(email, password);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(res.user));

            if (res.user.isNewUser || !res.user.hasUploadedData) {
                router.push("/onboarding");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div data-page-main="true" className="relative min-h-screen overflow-hidden bg-[#0D1117] text-[#C9D1D9]">
            <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(218,54,51,0.14) 0px, rgba(218,54,51,0.14) 1px, transparent 1px, transparent 40px)",
                }}
            />
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 50% 36% at 50% -10%, rgba(218,54,51,0.3) 0%, transparent 75%)",
                }}
            />

            <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 lg:px-8 lg:py-14">
                <div className="grid w-full max-w-6xl overflow-hidden border border-[rgba(255,255,255,0.12)] bg-[#0D1117] lg:grid-cols-12">
                    <section className="border-b border-[rgba(255,255,255,0.12)] p-8 lg:col-span-5 lg:border-b-0 lg:border-r lg:p-10">
                        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(218,54,51,0.4)] bg-[rgba(218,54,51,0.12)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#F85149]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F85149]" />
                            Secure Access
                        </p>
                        <h1 className="text-3xl font-light leading-tight text-white sm:text-4xl">
                            Welcome Back To
                            <br />
                            PharmaSense
                        </h1>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#8B949E] sm:text-base">
                            Sign in to monitor forecast shifts, stock alerts, and regional demand signals in a single dashboard.
                        </p>

                        <div className="mt-8 space-y-3 text-sm text-[#8B949E]">
                            <div className="flex items-center gap-3 border border-[rgba(255,255,255,0.1)] bg-[#161B22] px-4 py-3">
                                <span className="h-2 w-2 rounded-full bg-[#F85149]" />
                                Real-time demand trend visibility
                            </div>
                            <div className="flex items-center gap-3 border border-[rgba(255,255,255,0.1)] bg-[#161B22] px-4 py-3">
                                <span className="h-2 w-2 rounded-full bg-[#60A5FA]" />
                                Inventory risk and reorder recommendations
                            </div>
                            <div className="flex items-center gap-3 border border-[rgba(255,255,255,0.1)] bg-[#161B22] px-4 py-3">
                                <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                                AI model insights and forecast confidence
                            </div>
                        </div>
                    </section>

                    <section className="p-8 lg:col-span-7 lg:p-10">
                        <h2 className="text-2xl font-light text-white">Sign in</h2>
                        <p className="mt-2 text-sm text-[#8B949E]">Continue to your pharmaceutical demand workspace.</p>

                        {error && (
                            <div className="mt-6 border border-[rgba(248,81,73,0.4)] bg-[rgba(248,81,73,0.12)] px-4 py-3 text-sm text-[#FCA5A5]">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Email</label>
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
                                <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Password</label>
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
                                className="btn-primary gsap-btn w-full justify-center text-base disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <p className="mt-7 text-sm text-[#8B949E]">
                            Don&#39;t have an account?{" "}
                            <Link href="/signup" className="font-semibold text-[#F85149] hover:text-[#FF7B72]">
                                Create one
                            </Link>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
