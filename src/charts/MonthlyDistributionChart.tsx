"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyPoint {
  month: string;
  avgSales: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(13,17,23,0.97)",
        border: "1px solid rgba(88,166,255,0.3)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
        color: "#C9D1D9",
      }}
    >
      <p style={{ color: "#8B949E", marginBottom: 4, fontSize: 11 }}>{label}</p>
      <p>
        <span style={{ color: "#58A6FF", fontWeight: 600 }}>
          {payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </span>{" "}
        <span style={{ color: "#6E7681" }}>avg sales</span>
      </p>
    </div>
  );
}

export default function MonthlyDistributionChart({ data }: { data: MonthlyPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#6E7681]">
        No data available
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#58A6FF" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#58A6FF" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="month"
            tick={{ fill: "#6E7681", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6E7681", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="avgSales"
            stroke="#58A6FF"
            strokeWidth={2}
            fill="url(#monthlyGradient)"
            dot={{ r: 3, fill: "#58A6FF", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#58A6FF", stroke: "#0D1117", strokeWidth: 2 }}
            name="Avg Sales"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
