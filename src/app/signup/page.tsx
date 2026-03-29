"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/api";

const LOCAL_USER_KEY = "pharmasens_user";

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
            const res = await signup(name, email, password);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(res.user));
            router.push("/onboarding");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed");
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
                            New Workspace
                        </p>
                        <h1 className="text-3xl font-light leading-tight text-white sm:text-4xl">
                            Create Your
                            <br />
                            PharmaSense Account
                        </h1>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#8B949E] sm:text-base">
                            Join the platform to track demand anomalies, optimize stock levels, and act on AI-driven forecasting insights.
                        </p>

                        <div className="mt-8 space-y-3 text-sm text-[#8B949E]">
                            <div className="flex items-center gap-3 border border-[rgba(255,255,255,0.1)] bg-[#161B22] px-4 py-3">
                                <span className="h-2 w-2 rounded-full bg-[#F85149]" />
                                Compare 7-day and 30-day predictions
                            </div>
                            <div className="flex items-center gap-3 border border-[rgba(255,255,255,0.1)] bg-[#161B22] px-4 py-3">
                                <span className="h-2 w-2 rounded-full bg-[#C084FC]" />
                                Detect intermittent demand and spikes
                            </div>
                            <div className="flex items-center gap-3 border border-[rgba(255,255,255,0.1)] bg-[#161B22] px-4 py-3">
                                <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                                Prioritize high-risk inventory decisions
                            </div>
                        </div>
                    </section>

                    <section className="p-8 lg:col-span-7 lg:p-10">
                        <h2 className="text-2xl font-light text-white">Create account</h2>
                        <p className="mt-2 text-sm text-[#8B949E]">Set up your profile to access the dashboard.</p>

                        {error && (
                            <div className="mt-6 border border-[rgba(248,81,73,0.4)] bg-[rgba(248,81,73,0.12)] px-4 py-3 text-sm text-[#FCA5A5]">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs uppercase tracking-widest text-[#8B949E]">Full Name</label>
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
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary gsap-btn w-full justify-center text-base disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>

                        <p className="mt-7 text-sm text-[#8B949E]">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-[#F85149] hover:text-[#FF7B72]">
                                Sign in
                            </Link>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
