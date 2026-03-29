import Link from "next/link";

const features = [
  {
    title: "Demand Forecasting",
    description: "Leverage Temporal Fusion Transformer for accurate multi-horizon demand predictions, even with intermittent sales patterns.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    ),
  },
  {
    title: "AI Recommendations",
    description: "Receive intelligent alerts and actionable recommendations powered by predictive analytics to optimize your supply chain.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><line x1="9" y1="21" x2="15" y2="21" /></svg>
    ),
  },
  {
    title: "Inventory Optimization",
    description: "Dynamic reorder quantity suggestions based on predicted demand, safety stock calculations, and current inventory levels.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
    ),
  },
  {
    title: "Location Insights",
    description: "Visualize demand variation across regions and districts to make informed distribution and allocation decisions.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" /><path d="M3 21h18" /><path d="M9 7h1" /><path d="M9 11h1" /><path d="M9 15h1" /><path d="M14 7h1" /><path d="M14 11h1" /><path d="M14 15h1" /></svg>
            </div>
            <span className="text-slate-900 font-bold text-lg">PharmaSense AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2 no-underline">
              Login
            </Link>
            <Link href="/signup" className="btn-primary text-sm !py-2.5 !px-5 no-underline">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-white pointer-events-none"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-medium text-indigo-700 mb-6 animate-fade-in">
            Powered by Temporal Fusion Transformer
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 animate-slide-up">
            Intermittent Demand{" "}
            <span className="gradient-text">Sensing</span>{" "}
            for Pharma Sales
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
            Accurately forecast sporadic pharmaceutical demand using state-of-the-art
            deep learning. Optimize inventory, reduce waste, and never miss a critical
            restocking window.
          </p>
          <div className="flex items-center justify-center gap-4 animate-slide-up">
            <Link href="/signup" className="btn-primary text-base no-underline">
              Get Started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
            <Link href="/login" className="btn-secondary text-base no-underline">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              The Challenge of Intermittent Demand
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Pharmaceutical products often exhibit irregular demand patterns with frequent
              zero-demand periods followed by sudden spikes. Traditional forecasting methods
              fail to capture these dynamics.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-extrabold text-indigo-600 mb-2">72%</div>
              <p className="text-sm text-slate-600">of pharma SKUs show intermittent demand patterns</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-extrabold text-cyan-600 mb-2">92.3%</div>
              <p className="text-sm text-slate-600">forecast accuracy achieved by TFT model</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-extrabold text-emerald-600 mb-2">35%</div>
              <p className="text-sm text-slate-600">reduction in stock-out incidents</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A comprehensive suite of tools for pharmaceutical demand sensing and inventory management.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="glass-card p-8 group hover:translate-y-[-2px] transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-105 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-indigo-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Demand Planning?
          </h2>
          <p className="text-lg text-indigo-200 mb-8">
            Start making data-driven inventory decisions with AI-powered forecasting.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="bg-white text-indigo-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors no-underline">
              Create Account
            </Link>
            <Link href="/login" className="border-2 border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors no-underline">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" /><path d="M3 21h18" /></svg>
              </div>
              <span className="text-white font-semibold">PharmaSense AI</span>
            </div>
            <p className="text-sm text-center">
              Intermittent Demand Sensing for Pharma Sales using Temporal Fusion Transformer
            </p>
            <p className="text-sm">2026 PharmaSense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
