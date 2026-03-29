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
    TFT: "#4f46e5",
    LSTM: "#06b6d4",
    ARIMA: "#f59e0b",
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
            <div className="p-6 lg:p-8 space-y-6">
                {/* Model Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {models.map((model) => (
                        <div
                            key={model.shortName}
                            className={`glass-card p-6 border-t-4`}
                            style={{ borderTopColor: MODEL_COLORS[model.shortName] }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">{model.shortName}</h3>
                                {model.shortName === "TFT" && (
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg">Best</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{model.description}</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Accuracy</span>
                                    <span className="text-sm font-bold text-slate-900">{model.accuracy}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${model.accuracy}%`, backgroundColor: MODEL_COLORS[model.shortName] }}
                                    ></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500">MAE</p>
                                        <p className="text-base font-bold text-slate-900">{model.mae}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500">RMSE</p>
                                        <p className="text-base font-bold text-slate-900">{model.rmse}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500">MAPE</p>
                                        <p className="text-base font-bold text-slate-900">{model.mape}%</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500">Train Time</p>
                                        <p className="text-base font-bold text-slate-900">{model.trainingTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Radar Chart */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Model Comparison</h2>
                    <p className="text-sm text-slate-500 mb-6">Normalized performance across key metrics (higher is better)</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={comparisonData} cx="50%" cy="50%" outerRadius="70%">
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} />
                                <PolarRadiusAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                <Radar name="TFT" dataKey="TFT" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={2} />
                                <Radar name="LSTM" dataKey="LSTM" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
                                <Radar name="ARIMA" dataKey="ARIMA" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={2} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Feature Importance */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Feature Importance</h2>
                    <p className="text-sm text-slate-500 mb-6">Which features influence demand predictions the most (TFT model)</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={features} layout="vertical" margin={{ left: 150 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 0.3]}
                                />
                                <YAxis
                                    dataKey="feature"
                                    type="category"
                                    tick={{ fontSize: 12, fill: "#64748b" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={140}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                                    formatter={(v: number) => [(v * 100).toFixed(1) + "%", "Importance"]}
                                />
                                <Bar dataKey="importance" radius={[0, 8, 8, 0]} name="Importance">
                                    {features.map((_, i) => (
                                        <Cell key={i} fill={i < 3 ? "#4f46e5" : i < 6 ? "#818cf8" : "#c7d2fe"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );
}
