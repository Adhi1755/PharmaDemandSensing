"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Data ────────────────────────────────────────────────────────────────────

const whyCards = [
  {
    title: "Dynamic Dataset Upload",
    description: "Bring your own CSV or Excel files from any pharmacy workflow.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    color: "bg-[#1E3A5F] text-[#60A5FA]",
  },
  {
    title: "No Vendor Lock-in",
    description: "Works with any user-provided structure and adapts to local operations.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
    color: "bg-[#3B1F6B] text-[#C084FC]",
  },
  {
    title: "Production-ready Pipeline",
    description: "From ingestion to forecast output with robust preprocessing defaults.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    color: "bg-[#1A3A1A] text-[#4ADE80]",
  },
  {
    title: "Full Prediction Visibility",
    description: "Inspect trends, confidence behavior, and forecast changes clearly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    color: "bg-[#1F3A2A] text-[#34D399]",
  },
  {
    title: "Multi-model Comparison",
    description: "Switch models instantly to evaluate speed and predictive quality.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    color: "bg-[#3B2A12] text-[#FBBF24]",
  },
  {
    title: "Workflow Integration",
    description: "Designed to fit into practical pharmacy planning and replenishment.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "bg-[#3B1A1A] text-[#F87171]",
  },
];

const models = [
  {
    name: "Linear Regression",
    detail: "Fast baseline predictions for immediate demand signals.",
    note: "Best for quick operational checks",
    badge: "Fast",
    badgeColor: "bg-[#1A3A1A] text-[#4ADE80]",
  },
  {
    name: "Random Forest",
    detail: "Robust ensemble performance for irregular demand patterns.",
    note: "Balanced speed and reliability",
    badge: "Balanced",
    badgeColor: "bg-[#1E3A5F] text-[#60A5FA]",
  },
  {
    name: "Temporal Fusion Transformer",
    detail: "Advanced time-series forecasting for deeper pattern understanding.",
    note: "High-accuracy strategic forecasting",
    badge: "Advanced",
    badgeColor: "bg-[#3B1F6B] text-[#C084FC]",
  },
];

const steps = [
  {
    num: "1",
    title: "Upload Dataset",
    description: "Upload pharmacy sales data in CSV or Excel format.",
    time: "~30 seconds",
    code: null,
  },
  {
    num: "2",
    title: "Auto Processing",
    description: "Cleaning, validation, and lag feature engineering.",
    time: "~1 minute",
    code: "import pharmasense\n\npharmasense.load_data(\n  \"./sales_data.csv\"\n)\npharmasense.preprocess()",
  },
  {
    num: "3",
    title: "Model Training & Insights",
    description: "Linear, Random Forest, and TFT model execution.",
    time: "~2 minutes",
    code: "from pharmasense import Forecast\n\nmodel = Forecast(model=\"tft\")\nresults = model.run()\nresults.dashboard()",
  },
];

const stats = [
  { value: "3", label: "AI Models" },
  { value: "92%+", label: "Forecast Accuracy" },
  { value: "4", label: "Step Pipeline" },
];

const communityLinks = [
  { icon: "📄", label: "Documentation", sub: "Read Docs" },
  { icon: "⭐", label: "GitHub", sub: "Open Source" },
  { icon: "💼", label: "LinkedIn", sub: "Follow Updates" },
  { icon: "▶", label: "YouTube", sub: "View tutorials" },
  { icon: "🐦", label: "X / Twitter", sub: "Follow us" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function WhyCard({ title, description, icon, color }) {
  return (
    <article className="reveal-card border-b border-r border-[rgba(255,255,255,0.07)] p-8 hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-200">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-light text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-[#8B949E]">{description}</p>
    </article>
  );
}

function ModelCard({ name, detail, note, badge, badgeColor }) {
  return (
    <article className="reveal-card rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161B22] p-7 hover:border-[rgba(255,255,255,0.2)] transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-light text-white leading-tight">{name}</h3>
        <span className={`ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-light ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-sm leading-relaxed text-[#8B949E]">{detail}</p>
      <p className="mt-5 text-xs font-light uppercase tracking-[0.12em] text-[#6E7681]">{note}</p>
    </article>
  );
}

function StepCard({ num, title, description, time, code }) {
  return (
    <article className="reveal-card rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161B22] overflow-hidden">
      <div className="p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DA3633] mb-5">
          <span className="text-lg font-light text-white">{num}</span>
        </div>
        <h3 className="text-xl font-light text-white mb-3">{title}</h3>
        <p className="text-sm leading-relaxed text-[#8B949E]">{description}</p>
      </div>
      {code && (
        <div className="border-t border-[rgba(255,255,255,0.08)] bg-[#0D1117] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#6E7681]">python</span>
            <button className="text-[#6E7681] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
          <pre className="text-xs leading-relaxed text-[#C9D1D9] font-mono overflow-x-auto whitespace-pre-wrap">{code}</pre>
        </div>
      )}
      <div className="border-t border-[rgba(255,255,255,0.06)] px-6 py-3 flex items-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 text-[#6E7681]">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-xs text-[#6E7681]">{time}</span>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-item]", {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.12,
      });

      gsap.utils.toArray("[data-reveal-section]").forEach((section) => {
        const cards = section.querySelectorAll(".reveal-card, .reveal-item");
        if (!cards.length) {
          gsap.from(section, { opacity: 0, y: 20, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: section, start: "top 86%" } });
          return;
        }
        gsap.from(cards, { opacity: 0, y: 16, duration: 0.55, ease: "power2.out", stagger: 0.07, scrollTrigger: { trigger: section, start: "top 84%" } });
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-[#0D1117] text-[#C9D1D9]">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(13,17,23,0.9)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="text-sm font-light text-white no-underline tracking-tight">
            PharmaSense <span className="text-[#DA3633]">AI</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[#8B949E] md:flex">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#models" className="hover:text-white transition-colors">Models</a>
            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
          </nav>
          <Link href="/signup" className="rounded-lg border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm font-light text-white no-underline hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            Get started
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.08)]"
          style={{ background: "linear-gradient(180deg, #1A0A0A 0%, #1F0E0E 30%, #0D1117 100%)" }}>
          {/* Red vertical-stripe texture like MLflow */}
          <div className="pointer-events-none absolute inset-0 opacity-30"
            style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(218,54,51,0.15) 0px, rgba(218,54,51,0.15) 1px, transparent 1px, transparent 40px)" }} />
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(218,54,51,0.25) 0%, transparent 70%)" }} />

          <div className="relative mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center px-6 py-24 text-center lg:px-10">
            <p data-hero-item className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(218,54,51,0.4)] bg-[rgba(218,54,51,0.1)] px-4 py-1.5 text-xs font-light uppercase tracking-[0.1em] text-[#F85149]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F85149]" />
              Multi-model AI system · Supports real-world datasets
            </p>
            <h1 data-hero-item className="text-5xl font-light leading-[1.1] text-white sm:text-6xl lg:text-7xl">
              AI-Powered Pharma<br />
              <span className="text-white">Demand Intelligence</span>
            </h1>
            <p data-hero-item className="mt-7 max-w-2xl text-base leading-relaxed text-[#8B949E] sm:text-lg">
              Upload your pharmacy sales data, analyze intermittent demand patterns, and generate accurate forecasts using advanced machine learning models.
            </p>
            <div data-hero-item className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link href="/signup" className="rounded-xl bg-white px-7 py-3 text-sm font-light text-[#0D1117] no-underline hover:bg-[#E6EDF3] transition-colors">
                Get Started
              </Link>
              <Link href="/login" className="rounded-xl border border-[rgba(255,255,255,0.2)] px-7 py-3 text-sm font-light text-white no-underline hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                View Demo
              </Link>
            </div>

            {/* Social proof row */}
            <div data-hero-item className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-4 py-2">
                  <span className="text-sm font-light text-white">{s.value}</span>
                  <span className="text-sm text-[#6E7681]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trusted by banner ──────────────────────────────────────────── */}
        <section data-reveal-section className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D1117] py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 lg:px-10">
            <p className="reveal-item mb-6 text-xs font-light uppercase tracking-[0.12em] text-[#6E7681]">
              Built for real-world AI workflows inspired by modern ML systems
            </p>
          </div>
        </section>

        {/* ── Most Adopted section ────────────────────────────────────────── */}
        <section data-reveal-section className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D1117] py-24">
          <div className="mx-auto w-full max-w-3xl px-6 text-center lg:px-10">
            <h2 className="reveal-item text-4xl font-light text-white sm:text-5xl">Most Adopted Pharma AI Platform</h2>
            <p className="reveal-item mt-5 text-base leading-relaxed text-[#8B949E]">
              Built from the ground up for pharmacy teams. Trusted to power real-world demand forecasting workflows with multi-model precision and production-ready pipelines.
            </p>
            <div className="reveal-item mt-12 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#161B22] px-6 py-4">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                <div className="text-left">
                  <p className="text-xs text-[#6E7681]">pharmasense/ai</p>
                  <p className="flex items-center gap-1 text-sm font-light text-white">⭐ Open Source</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-3xl font-extralight text-white">92.3%</p>
                <p className="text-sm text-[#6E7681]">Forecast Accuracy</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why This Platform (grid like MLflow) ───────────────────────── */}
        <section id="features" data-reveal-section className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D1117] py-24">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <div className="mb-14 text-center">
              <h2 className="reveal-item text-4xl font-light text-white sm:text-5xl">Why Teams Choose This Platform</h2>
              <p className="reveal-item mt-5 max-w-2xl mx-auto text-base text-[#8B949E]">
                Focus on forecasting, not managing infrastructure. The platform handles complexity so you can ship faster.
              </p>
            </div>
            <div className="grid grid-cols-1 border-l border-t border-[rgba(255,255,255,0.07)] md:grid-cols-2 lg:grid-cols-3">
              {whyCards.map((item) => (
                <WhyCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works (numbered steps like MLflow) ───────────────────── */}
        <section data-reveal-section className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D1117] py-24">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <div className="mb-4 text-center">
              <h2 className="reveal-item text-4xl font-light text-white sm:text-5xl">Get Started in Simple Steps</h2>
              <p className="reveal-item mt-5 text-base text-[#8B949E]">From zero to production-ready forecasts in minutes. No complex setup required.</p>
              <a href="#" className="reveal-item mt-3 inline-block text-sm text-[#58A6FF] hover:underline">Get Started →</a>
            </div>

            {/* Step numbers row */}
            <div className="mt-12 mb-0 flex items-center justify-center gap-0 lg:gap-0">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DA3633]">
                    <span className="text-lg font-light text-white">{step.num}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mx-4 h-px w-20 bg-[rgba(255,255,255,0.15)] lg:w-32" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <StepCard key={step.num} {...step} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Models ──────────────────────────────────────────────────────── */}
        <section id="models" data-reveal-section className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D1117] py-24">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <h2 className="reveal-item text-4xl font-light text-white sm:text-5xl">Powered by Multiple AI Models</h2>
            <p className="reveal-item mt-5 max-w-2xl text-base text-[#8B949E]">Switch between models to compare performance and accuracy for your specific demand patterns.</p>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {models.map((m) => (
                <ModelCard key={m.name} {...m} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard preview ───────────────────────────────────────────── */}
        <section data-reveal-section className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D1117] py-24">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <h2 className="reveal-item text-4xl font-light text-white sm:text-5xl">Forecast vs Actual Demand</h2>
            <p className="reveal-item mt-4 text-base text-[#8B949E]">Live dashboard preview of what you&apos;ll see after running the pipeline.</p>
            <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="reveal-card lg:col-span-2 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161B22] p-7">
                <p className="text-xs uppercase tracking-[0.1em] text-[#6E7681] mb-1">Dashboard Preview</p>
                <p className="text-xl font-light text-white mb-6">Demand Forecast Chart</p>
                <div className="h-44 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0D1117] p-4 flex items-end gap-1.5">
                  {[28, 42, 35, 55, 48, 64, 40, 58, 72, 65, 78, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i % 3 === 0 ? "#DA3633" : "rgba(218,54,51,0.35)" }} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="reveal-card flex-1 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161B22] p-6">
                  <p className="text-xs uppercase tracking-[0.1em] text-[#6E7681]">Accuracy</p>
                  <p className="mt-2 text-4xl font-extralight text-white">92.3%</p>
                </div>
                <div className="reveal-card flex-1 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161B22] p-6">
                  <p className="text-xs uppercase tracking-[0.1em] text-[#6E7681]">Demand Risk</p>
                  <p className="mt-2 text-4xl font-extralight text-[#4ADE80]">Low</p>
                </div>
              </div>
            </div>
            <div className="reveal-card mt-4 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#161B22] p-6">
              <p className="text-xs uppercase tracking-[0.1em] text-[#6E7681] mb-4">AI Recommendations</p>
              <ul className="flex flex-col gap-3 text-sm text-[#8B949E]">
                {["Increase reorder quantity for high-volatility SKUs.", "Reduce buffer stock for low-turnover antibiotics.", "Schedule weekly demand review for seasonal spikes."].map((rec) => (
                  <li key={rec} className="flex items-start gap-3">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DA3633]" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Community / Connect ─────────────────────────────────────────── */}
        <section data-reveal-section className="border-b border-[rgba(255,255,255,0.06)] bg-[#0D1117] py-24">
          <div className="mx-auto w-full max-w-5xl px-6 text-center lg:px-10">
            <p className="reveal-item mb-4 inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.12em] text-[#DA3633]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DA3633]" /> GET INVOLVED
            </p>
            <h2 className="reveal-item text-4xl font-light text-white sm:text-5xl">Connect with the community</h2>
            <p className="reveal-item mt-5 text-base text-[#8B949E]">Join pharmacists and ML practitioners using this platform</p>
            <div className="reveal-item mt-12 grid grid-cols-2 divide-x divide-y divide-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden md:grid-cols-5">
              {communityLinks.map((l) => (
                <a key={l.label} href="#" className="flex flex-col items-center gap-2 px-6 py-7 hover:bg-[rgba(255,255,255,0.04)] transition-colors no-underline">
                  <span className="text-2xl">{l.icon}</span>
                  <span className="text-sm font-light text-white">{l.label}</span>
                  <span className="text-xs text-[#6E7681]">{l.sub}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section data-reveal-section className="relative overflow-hidden py-24"
          style={{ background: "linear-gradient(180deg, #0D1117 0%, #1A0808 50%, #0D1117 100%)" }}>
          <div className="pointer-events-none absolute inset-0 opacity-25"
            style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(218,54,51,0.2) 0px, rgba(218,54,51,0.2) 1px, transparent 1px, transparent 40px)" }} />
          <div className="relative mx-auto w-full max-w-3xl px-6 text-center lg:px-10">
            <h2 className="reveal-item text-4xl font-light text-white sm:text-5xl">
              Start analyzing your pharmacy data today
            </h2>
            <p className="reveal-item mt-5 text-base text-[#8B949E]">Production-ready forecasts with zero infrastructure headaches.</p>
            <Link href="/signup" className="reveal-item mt-10 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-light text-[#0D1117] no-underline hover:bg-[#E6EDF3] transition-colors">
              Create Account
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer id="docs" className="border-t border-[rgba(255,255,255,0.08)] bg-[#0D1117] py-12">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 text-sm text-[#6E7681] md:grid-cols-3 lg:px-10">
          <div>
            <p className="text-base font-light text-white mb-1">PharmaSense <span className="text-[#DA3633]">AI</span></p>
            <p className="mt-2 text-sm">AI platform for pharmacy demand intelligence and inventory optimization.</p>
          </div>
          <div>
            <p className="font-light text-white mb-3">Links</p>
            <div className="flex flex-col gap-2">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#models" className="hover:text-white transition-colors">Models</a>
              <Link href="/login" className="hover:text-white transition-colors no-underline">Sign In</Link>
            </div>
          </div>
          <div>
            <p className="font-light text-white mb-3">Tech Stack</p>
            <p>Next.js App Router · Tailwind CSS · GSAP · Machine Learning Models</p>
          </div>
        </div>
        <div className="mx-auto mt-10 w-full max-w-7xl border-t border-[rgba(255,255,255,0.06)] px-6 pt-6 lg:px-10">
          <p className="text-xs text-[#6E7681]">© 2025 PharmaSense AI Platform</p>
        </div>
      </footer>
    </div>
  );
}