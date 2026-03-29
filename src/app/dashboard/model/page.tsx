"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Cell,
} from "recharts";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getModelMetrics, getFeatureImportance } from "@/lib/api";

interface Model {
    name: string;
    shortName: string;
    mae: number;
    rmse: number;
    accuracy: number;
    mape: number;
    trainingTime: string;
    description: string;
}

interface Feature {
    feature: string;
    importance: number;
}

const MODEL_COLORS: Record<string, string> = {
    TFT: "#FF0000",
    LSTM: "#FF4D4D",
    ARIMA: "#FFFFFF",
};

export default function ModelPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getModelMetrics(), getFeatureImportance()])
            .then(([m, f]) => {
                setModels(m.models);
                setFeatures(f);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner text="Loading model insights..." />;

    const comparisonData = [
        { metric: "Accuracy", TFT: models[0]?.accuracy, LSTM: models[1]?.accuracy, ARIMA: models[2]?.accuracy },
        { metric: "MAE (inv)", TFT: 100 - models[0]?.mae * 5, LSTM: 100 - models[1]?.mae * 5, ARIMA: 100 - models[2]?.mae * 5 },
        { metric: "RMSE (inv)", TFT: 100 - models[0]?.rmse * 4, LSTM: 100 - models[1]?.rmse * 4, ARIMA: 100 - models[2]?.rmse * 4 },
        { metric: "MAPE (inv)", TFT: 100 - models[0]?.mape, LSTM: 100 - models[1]?.mape, ARIMA: 100 - models[2]?.mape },
    ];

    return (
        <>
            <Navbar title="Model Insights" subtitle="TFT vs LSTM vs ARIMA performance comparison" />
            <div className="min-h-full bg-black p-0">
                <div className="border border-[rgba(255,255,255,0.12)] bg-[#000000]">
                {/* Model Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-0 scroll-section border-b border-[rgba(255,255,255,0.12)]">
                    {models.map((model) => (
                        <div
                            key={model.shortName}
                            className={`p-6 border-r border-b md:border-b-0 border-[rgba(255,255,255,0.12)] border-t-4 dashboard-card`}
                            style={{ borderTopColor: MODEL_COLORS[model.shortName] }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[var(--color-light-gray)]">{model.shortName}</h3>
                                {model.shortName === "TFT" && (
                                    <span className="px-3 py-1 bg-[rgba(255,0,0,0.2)] text-[var(--color-primary)] text-xs font-semibold">Best</span>
                                )}
                            </div>
                            <p className="text-xs text-[rgba(191,191,191,1)] mb-4 leading-relaxed">{model.description}</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[rgba(191,191,191,1)]">Accuracy</span>
                                    <span className="text-sm font-bold text-[var(--color-light-gray)]">{model.accuracy}%</span>
                                </div>
                                <div className="w-full h-2 bg-[rgba(255,255,255,0.12)] overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-500"
                                        style={{ width: `${model.accuracy}%`, backgroundColor: MODEL_COLORS[model.shortName] }}
                                    ></div>
                                </div>
                                <div className="grid grid-cols-2 gap-0 mt-3 border border-[rgba(255,255,255,0.12)]">
                                    <div className="bg-[rgba(26,26,26,0.72)] p-3 text-center border-r border-b border-[rgba(255,255,255,0.12)]">
                                        <p className="text-xs text-[rgba(191,191,191,1)]">MAE</p>
                                        <p className="text-base font-bold text-[var(--color-light-gray)]">{model.mae}</p>
                                    </div>
                                    <div className="bg-[rgba(26,26,26,0.72)] p-3 text-center border-b border-[rgba(255,255,255,0.12)]">
                                        <p className="text-xs text-[rgba(191,191,191,1)]">RMSE</p>
                                        <p className="text-base font-bold text-[var(--color-light-gray)]">{model.rmse}</p>
                                    </div>
                                    <div className="bg-[rgba(26,26,26,0.72)] p-3 text-center border-r border-[rgba(255,255,255,0.12)]">
                                        <p className="text-xs text-[rgba(191,191,191,1)]">MAPE</p>
                                        <p className="text-base font-bold text-[var(--color-light-gray)]">{model.mape}%</p>
                                    </div>
                                    <div className="bg-[rgba(26,26,26,0.72)] p-3 text-center">
                                        <p className="text-xs text-[rgba(191,191,191,1)]">Train Time</p>
                                        <p className="text-base font-bold text-[var(--color-light-gray)]">{model.trainingTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Radar Chart */}
                <section className="p-6 border-b border-[rgba(255,255,255,0.12)] dashboard-card chart-section">
                    <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Model Comparison</h2>
                    <p className="text-sm text-[rgba(191,191,191,1)] mb-6">Normalized performance across key metrics (higher is better)</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={comparisonData} cx="50%" cy="50%" outerRadius="70%">
                                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#FFFFFF" }} />
                                <PolarRadiusAxis tick={{ fontSize: 10, fill: "#FFFFFF" }} />
                                <Radar name="TFT" dataKey="TFT" stroke="#FF0000" fill="#FF0000" fillOpacity={0.15} strokeWidth={2} />
                                <Radar name="LSTM" dataKey="LSTM" stroke="#FF4D4D" fill="#FF4D4D" fillOpacity={0.12} strokeWidth={2} />
                                <Radar name="ARIMA" dataKey="ARIMA" stroke="#FFFFFF" fill="#FFFFFF" fillOpacity={0.08} strokeWidth={2} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, backgroundColor: "#000000", color: "#FFFFFF" }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Feature Importance */}
                <section className="p-6 dashboard-card chart-section">
                    <h2 className="text-lg font-bold text-[var(--color-light-gray)] mb-1">Feature Importance</h2>
                    <p className="text-sm text-[rgba(191,191,191,1)] mb-6">Which features influence demand predictions the most (TFT model)</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={features} layout="vertical" margin={{ left: 150 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: "#FFFFFF" }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 0.3]}
                                />
                                <YAxis
                                    dataKey="feature"
                                    type="category"
                                    tick={{ fontSize: 12, fill: "#FFFFFF" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={140}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, backgroundColor: "#000000", color: "#FFFFFF" }}
                                    formatter={(v: number) => [(v * 100).toFixed(1) + "%", "Importance"]}
                                />
                                <Bar dataKey="importance" radius={[0, 0, 0, 0]} name="Importance">
                                    {features.map((_, i) => (
                                        <Cell key={i} fill={i < 3 ? "#FF0000" : i < 6 ? "#FF4D4D" : "#FFFFFF"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
                </div>
            </div>
        </>
    );
}
