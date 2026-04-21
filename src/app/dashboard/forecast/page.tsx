"use client";


import ChartCard from "@/components/dashboard/ChartCard";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceArea,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface TimeSeriesPoint {
    day: string;
    actual: number | null;
    predicted: number;
}

const TOTAL_POINTS = 37;
const PAST_POINTS = 30;

const LSTM_SERIES: TimeSeriesPoint[] = Array.from({ length: TOTAL_POINTS }, (_, index) => {
    const dayNumber = index + 1;
    const baseline = 106 + index * 1.35;
    const wave = Math.sin(index / 2.3) * 7.2;
    const jitterPattern = [2.1, -1.9, 1.4, -2.7, 2.5, -1.3, 1.8, -0.8];
    const jitter = jitterPattern[index % jitterPattern.length];
    const actualValue = Number((baseline + wave + jitter).toFixed(1));

    const predictedWave = Math.sin((index + 0.8) / 2.1) * 5.9;
    const predictedJitterPattern = [1.9, -1.2, 1.6, -2.1, 2.2, -1.4, 1.2, -0.6];
    const predictedJitter = predictedJitterPattern[index % predictedJitterPattern.length];
    const predictedValue = Number((baseline + predictedWave + predictedJitter + 0.8).toFixed(1));

    return {
        day: `D${dayNumber}`,
        actual: index < PAST_POINTS ? actualValue : null,
        predicted: predictedValue,
    };
});

const TFT_SERIES: TimeSeriesPoint[] = Array.from({ length: TOTAL_POINTS }, (_, index) => {
    const dayNumber = index + 1;
    const baseline = 108 + index * 1.2;
    const smoothWave = Math.sin(index / 4.2) * 3.2;
    const gentleVariation = [0.7, 0.3, -0.2, -0.4, -0.1, 0.2, 0.5, 0.1][index % 8];
    const observedValue = Number((baseline + smoothWave + gentleVariation).toFixed(1));

    const predictedValue = Number((baseline + Math.sin((index + 1.1) / 4.4) * 2.8 + 0.4).toFixed(1));

    return {
        day: `D${dayNumber}`,
        actual: index < PAST_POINTS ? observedValue : null,
        predicted: predictedValue,
    };
});

export default function ForecastPage() {
    return (
        <>
            <main data-page-main="true" className="space-y-6 p-4 pb-24 md:p-6 lg:p-8 lg:pb-8">
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <article className="glass-card rounded-2xl p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-(--color-light-gray)">LSTM Model</h2>
                            <span className="rounded-full border border-[rgba(218,54,51,0.35)] bg-[rgba(218,54,51,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#F87171]">
                                Classification
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                                <p className="text-xs text-[rgba(191,191,191,1)]">Accuracy</p>
                                <p className="mt-1 text-2xl font-semibold text-[#F85149]">62.7%</p>
                            </div>
                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                                <p className="text-xs text-[rgba(191,191,191,1)]">Precision</p>
                                <p className="mt-1 text-2xl font-semibold text-(--color-light-gray)">0.64</p>
                            </div>
                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                                <p className="text-xs text-[rgba(191,191,191,1)]">Recall</p>
                                <p className="mt-1 text-2xl font-semibold text-(--color-light-gray)">0.63</p>
                            </div>
                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                                <p className="text-xs text-[rgba(191,191,191,1)]">F1 Score</p>
                                <p className="mt-1 text-2xl font-semibold text-(--color-light-gray)">0.63</p>
                            </div>
                        </div>
                    </article>

                    <article className="glass-card rounded-2xl p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-(--color-light-gray)">TFT Model</h2>
                            <span className="rounded-full border border-[rgba(218,54,51,0.35)] bg-[rgba(218,54,51,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#F87171]">
                                Forecasting
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                                <p className="text-xs text-[rgba(191,191,191,1)]">sMAPE</p>
                                <p className="mt-1 text-2xl font-semibold text-[#F85149]">75.27%</p>
                            </div>
                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                                <p className="text-xs text-[rgba(191,191,191,1)]">MAE</p>
                                <p className="mt-1 text-2xl font-semibold text-(--color-light-gray)">2.97</p>
                            </div>
                            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3">
                                <p className="text-xs text-[rgba(191,191,191,1)]">Loss</p>
                                <p className="mt-1 text-2xl font-semibold text-(--color-light-gray)">1.33</p>
                            </div>
                        </div>
                    </article>
                </section>

                <ChartCard
                    title="LSTM Forecast Chart"
                    subtitle="Historical values with noisier predicted trend (30 past + 7 forecast points)"
                >
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={LSTM_SERIES} margin={{ top: 6, right: 14, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fill: "#8B949E", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={3}
                                />
                                <YAxis
                                    tick={{ fill: "#8B949E", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={44}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(13,17,23,0.97)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: 12,
                                        color: "#C9D1D9",
                                        fontSize: 13,
                                    }}
                                />
                                <Legend wrapperStyle={{ color: "#8B949E", fontSize: 12, paddingTop: 12 }} />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#58A6FF"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Historical Values"
                                    connectNulls={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#DA3633"
                                    strokeWidth={2.2}
                                    strokeDasharray="6 4"
                                    dot={false}
                                    name="Predicted Trend"
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard
                    title="TFT Forecast Chart"
                    subtitle="Observed vs predicted with a smoother trajectory and highlighted forecast region"
                >
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={TFT_SERIES} margin={{ top: 6, right: 14, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fill: "#8B949E", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={3}
                                />
                                <YAxis
                                    tick={{ fill: "#8B949E", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={44}
                                />
                                <ReferenceArea
                                    x1="D31"
                                    x2="D37"
                                    fill="rgba(218,54,51,0.12)"
                                    stroke="rgba(218,54,51,0.35)"
                                    strokeDasharray="4 4"
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(13,17,23,0.97)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: 12,
                                        color: "#C9D1D9",
                                        fontSize: 13,
                                    }}
                                />
                                <Legend wrapperStyle={{ color: "#8B949E", fontSize: 12, paddingTop: 12 }} />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#7DD3FC"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Observed"
                                    connectNulls={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#F85149"
                                    strokeWidth={2.2}
                                    dot={false}
                                    name="Predicted"
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </main>
        </>
    );
}
