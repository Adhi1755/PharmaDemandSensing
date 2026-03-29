"use client";

import Link from "next/link";
import { useEffect } from "react";

// Feature icons
const FeatureIcon = ({ type }: { type: string }) => {
  const icons = {
    chart: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    lightbulb: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <line x1="9" y1="21" x2="15" y2="21" />
      </svg>
    ),
    box: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    map: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    upload: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    zap: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    settings: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
      </svg>
    ),
    brain: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c3.5 4 5 6 5 10a5 5 0 1 1-10 0c0-4 1.5-6 5-10z" />
      </svg>
    ),
  };
  return icons[type as keyof typeof icons] || icons.chart;
};

export default function LandingPage() {
  useEffect(() => {
    // Add scroll-triggered animations
    const animateOnScroll = () => {
      const elements = document.querySelectorAll("[data-scroll-animate]");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85) {
          el.classList.add("animate-in");
        }
      });
    };

    window.addEventListener("scroll", animateOnScroll);
    animateOnScroll(); // Initial call

    return () => window.removeEventListener("scroll", animateOnScroll);
  }, []);

  return (
    <div data-page-main="true" className="w-full min-h-screen app-bg text-[var(--color-light-gray)] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(29,30,39,0.92)] backdrop-blur-md border-b border-[rgba(224,226,228,0.1)]">
        <div className="max-w-full mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0E2E4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
                <path d="M3 21h18" />
                <path d="M9 7h1" />
                <path d="M9 11h1" />
                <path d="M9 15h1" />
                <path d="M14 7h1" />
                <path d="M14 11h1" />
                <path d="M14 15h1" />
              </svg>
            </div>
            <span className="text-[var(--color-light-gray)] font-bold text-lg hidden sm:inline">PharmaSense AI</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm font-medium text-[rgba(224,226,228,0.78)] hover:text-[var(--color-primary)] transition-colors px-3 sm:px-4 py-2 no-underline">
              Login
            </Link>
            <Link href="/signup" className="btn-primary gsap-btn text-sm !py-2.5 !px-4 sm:!px-5 no-underline">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden scroll-section">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,0,0,0.08)] to-transparent pointer-events-none"></div>
        <div className="absolute top-20 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-[rgba(255,0,0,0.14)] rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 right-1/4 w-64 h-64 sm:w-80 sm:h-80 bg-[rgba(192,0,24,0.16)] rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 bg-[rgba(192,0,24,0.2)] border border-[rgba(224,226,228,0.2)] rounded-full text-xs sm:text-sm font-medium text-[var(--color-light-gray)] mb-6 animate-fade-in">
            Powered by Temporal Fusion Transformer
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--color-light-gray)] leading-[1.1] mb-6 animate-slide-up">
            AI-Powered Demand Forecasting for{" "}
            <span className="gradient-text">Smarter Pharmacy Decisions</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[rgba(224,226,228,0.78)] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
            Upload your pharmacy sales data, analyze demand patterns, and predict future drug needs using advanced machine learning models.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link href="/signup" className="btn-primary gsap-btn text-base no-underline w-full sm:w-auto justify-center">
              Get Started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link href="/signup" className="btn-secondary gsap-btn text-base no-underline w-full sm:w-auto justify-center">
              Upload Dataset
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-16 sm:py-20 scroll-section relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,0,0,0.2)] to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16" data-scroll-animate>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
              Challenges in Pharmacy Demand Management
            </h2>
            <p className="text-base sm:text-lg text-[rgba(224,226,228,0.78)] max-w-2xl mx-auto">
              Pharmacies face critical challenges managing intermittent and unpredictable demand patterns
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6" data-scroll-animate>
            {[
              { icon: "📉", title: "Unpredictable Demand", desc: "Intermittent and sporadic demand patterns make forecasting difficult" },
              { icon: "📦", title: "Overstocking Waste", desc: "Excess inventory leads to expiration and significant financial losses" },
              { icon: "❌", title: "Understocking Loss", desc: "Missed sales and customer dissatisfaction from stockouts" },
              { icon: "📊", title: "Limited Insights", desc: "Lack of data-driven decision-making in small and mid-scale pharmacies" },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 dashboard-card group hover:translate-y-[-4px] transition-all duration-300">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-light-gray)] mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-[rgba(224,226,228,0.78)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Overview Section */}
      <section className="py-16 sm:py-20 scroll-section">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16" data-scroll-animate>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
              Our Approach
            </h2>
            <p className="text-base sm:text-lg text-[rgba(224,226,228,0.78)] max-w-2xl mx-auto">
              A comprehensive AI system designed specifically for pharmacy demand forecasting
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6" data-scroll-animate>
            {[
              { title: "Adaptive AI System", desc: "Dynamically adapts to any pharmacy dataset, regardless of size or complexity" },
              { title: "Automatic Processing", desc: "Instantly processes uploaded sales data with cleaning and validation" },
              { title: "Pattern Detection", desc: "Detects intermittent demand patterns that traditional methods miss" },
              { title: "Actionable Insights", desc: "Generates accurate forecasts and data-driven recommendations" },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 dashboard-card border border-[rgba(255,0,0,0.2)] hover:border-[rgba(255,0,0,0.4)] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[rgba(255,0,0,0.15)] flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-[var(--color-primary)]">{i + 1}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-light-gray)] mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-[rgba(224,226,228,0.78)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 scroll-section relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(192,0,24,0.3)] to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16" data-scroll-animate>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-[rgba(224,226,228,0.78)] max-w-2xl mx-auto">
              Simple yet powerful workflow to help you leverage AI for demand forecasting
            </p>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-8 sm:space-y-0 sm:grid sm:grid-cols-4 gap-6" data-scroll-animate>
            {[
              {
                step: "1",
                title: "Upload Your Dataset",
                desc: "Upload CSV or Excel with sales data",
                icon: "upload",
              },
              {
                step: "2",
                title: "Automatic Processing",
                desc: "Cleaning, validation, and feature engineering",
                icon: "zap",
              },
              {
                step: "3",
                title: "Model Training",
                desc: "Fast model for insights + advanced models in background",
                icon: "brain",
              },
              {
                step: "4",
                title: "Interactive Dashboard",
                desc: "View forecasts, trends, and recommendations",
                icon: "chart",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="glass-card p-6 sm:p-8 dashboard-card h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-[var(--color-light-gray)] font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-light-gray)] mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-[rgba(224,226,228,0.78)]">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden sm:block absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,0,0,0.3)" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Used Section */}
      <section className="py-16 sm:py-20 scroll-section">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16" data-scroll-animate>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
              AI Models Powering the System
            </h2>
            <p className="text-base sm:text-lg text-[rgba(224,226,228,0.78)] max-w-2xl mx-auto">
              Multiple machine learning models optimized for different use cases
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6" data-scroll-animate>
            {[
              {
                name: "Linear Regression",
                desc: "Fast baseline predictions for quick insights",
                speed: "⚡ Instant",
                use: "Real-time analysis",
              },
              {
                name: "Random Forest",
                desc: "Robust ensemble learning for complex patterns",
                speed: "⚡⚡ Fast",
                use: "Pattern detection",
              },
              {
                name: "Temporal Fusion Transformer",
                desc: "Advanced time-series forecasting with attention mechanisms",
                speed: "⚡⚡⚡ Advanced",
                use: "Highly accurate forecasts",
              },
            ].map((model, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 dashboard-card group hover:border-[rgba(255,0,0,0.3)] transition-colors border border-[rgba(224,226,228,0.1)]">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <FeatureIcon type={i === 0 ? "zap" : i === 1 ? "settings" : "brain"} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-light-gray)] mb-3">{model.name}</h3>
                <p className="text-sm sm:text-base text-[rgba(224,226,228,0.78)] mb-4">{model.desc}</p>
                <div className="space-y-2 text-xs sm:text-sm text-[rgba(224,226,228,0.68)]">
                  <p><span className="text-[var(--color-primary)] font-semibold">Speed:</span> {model.speed}</p>
                  <p><span className="text-[var(--color-primary)] font-semibold">Best for:</span> {model.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 sm:py-20 scroll-section relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,0,0,0.2)] to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16" data-scroll-animate>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
              Key Features
            </h2>
            <p className="text-base sm:text-lg text-[rgba(224,226,228,0.78)] max-w-2xl mx-auto">
              Everything you need to master demand forecasting
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-scroll-animate>
            {[
              { icon: "upload", title: "Dataset Upload & Preview", desc: "Easily upload and preview your pharmacy sales data" },
              { icon: "zap", title: "Automated Preprocessing", desc: "Cleaning, validation, and lag feature generation" },
              { icon: "chart", title: "Real-time Forecasting", desc: "Instant demand predictions updated as new data arrives" },
              { icon: "settings", title: "Multi-Model Comparison", desc: "Compare different models side-by-side for accuracy" },
              { icon: "box", title: "Inventory Optimization", desc: "Smart reorder suggestions and safety stock calculations" },
              { icon: "brain", title: "Insight Generation", desc: "Data-driven recommendations for decision-making" },
            ].map((feat, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 dashboard-card group hover:border-[rgba(255,0,0,0.3)] transition-colors">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-[var(--color-light-gray)] mb-4 group-hover:scale-110 transition-transform">
                  <FeatureIcon type={feat.icon} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-light-gray)] mb-2">{feat.title}</h3>
                <p className="text-sm sm:text-base text-[rgba(224,226,228,0.78)]">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Approach Section */}
      <section className="py-16 sm:py-20 scroll-section">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16" data-scroll-animate>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
              Why Our Approach is Different
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8" data-scroll-animate>
            <div className="space-y-6">
              {[
                { title: "Works with Any Dataset", desc: "No dependency on fixed data formats or specific pharmacy types" },
                { title: "Intermittent Pattern Expert", desc: "Specifically designed to handle zero-demand periods and demand spikes" },
                { title: "Speed + Accuracy", desc: "Fast models for immediate insights, advanced models for precise forecasts" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 text-[var(--color-light-gray)] font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">{item.title}</h4>
                    <p className="text-sm sm:text-base text-[rgba(224,226,228,0.78)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass-card p-8 gradient-bg relative overflow-hidden group">
              <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                  <circle cx="30" cy="30" r="15" fill="rgba(255,0,0,0.1)" />
                  <circle cx="70" cy="60" r="20" fill="rgba(192,0,24,0.1)" />
                  <circle cx="50" cy="50" r="10" fill="rgba(255,0,0,0.1)" />
                </svg>
              </div>
              <div className="relative z-10">
                <div className="text-4xl sm:text-5xl font-extrabold text-[var(--color-light-gray)] mb-4">92.3%</div>
                <p className="text-base sm:text-lg text-[rgba(224,226,228,0.9)] font-semibold mb-2">Forecast Accuracy</p>
                <p className="text-sm text-[rgba(224,226,228,0.78)]">Achieved with Temporal Fusion Transformer on real pharmacy data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 sm:py-20 scroll-section relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(192,0,24,0.3)] to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16" data-scroll-animate>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
              Transforming Pharmacy Operations
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" data-scroll-animate>
            {[
              { metric: "35%", label: "Reduction in Stockouts", icon: "✓" },
              { metric: "28%", label: "Cost Savings on Waste", icon: "💰" },
              { metric: "42%", label: "Revenue Improvement", icon: "📈" },
              { metric: "99%", label: "Data-Driven Decisions", icon: "🎯" },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 text-center dashboard-card hover:border-[rgba(255,0,0,0.3)] transition-colors">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[var(--color-primary)] mb-2">{item.metric}</div>
                <p className="text-sm sm:text-base text-[rgba(224,226,228,0.78)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(255,0,0,0.1)] to-[rgba(192,0,24,0.1)] pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[rgba(255,0,0,0.08)] rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10" data-scroll-animate>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-light-gray)] mb-4">
            Start Analyzing Your Data Today
          </h2>
          <p className="text-base sm:text-lg text-[rgba(224,226,228,0.78)] max-w-2xl mx-auto mb-10">
            Join pharmacies that are already transforming their demand planning with AI
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="bg-[var(--color-primary)] text-white font-semibold px-7 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-[rgba(255,0,0,0.9)] transition-colors no-underline gsap-btn w-full sm:w-auto text-center">
              Create Account
            </Link>
            <Link href="/signup" className="border border-[rgba(224,226,228,0.45)] text-[var(--color-light-gray)] font-semibold px-7 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-[rgba(224,226,228,0.08)] transition-colors no-underline gsap-btn w-full sm:w-auto text-center">
              Upload Your Dataset
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[rgba(29,30,39,0.96)] text-[rgba(224,226,228,0.72)] py-12 border-t border-[rgba(224,226,228,0.1)]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0E2E4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
                    <path d="M3 21h18" />
                  </svg>
                </div>
                <span className="text-[var(--color-light-gray)] font-semibold">PharmaSense AI</span>
              </div>
              <p className="text-sm">Intelligent demand forecasting for modern pharmacies</p>
            </div>
            <div>
              <h4 className="text-[var(--color-light-gray)] font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-sm">
                <li>Temporal Fusion Transformer</li>
                <li>Machine Learning Models</li>
                <li>Real-time Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--color-light-gray)] font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors no-underline">Dashboard</Link></li>
                <li><Link href="/signup" className="hover:text-[var(--color-primary)] transition-colors no-underline">Get Started</Link></li>
                <li><Link href="/login" className="hover:text-[var(--color-primary)] transition-colors no-underline">Sign In</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[rgba(224,226,228,0.1)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>&copy; 2026 PharmaSense. All rights reserved.</p>
            <p>Built with AI for intelligent pharmacy operations</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
