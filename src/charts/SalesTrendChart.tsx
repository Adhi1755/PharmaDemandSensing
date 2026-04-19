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

interface TrendPoint {
  date: string;
  sales: number;
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
        background: "rgba(8,11,16,0.97)",
        border: "1px solid rgba(218,54,51,0.25)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
        color: "#E6EDF3",
      }}
    >
      <p style={{ color: "#8B949E", marginBottom: 4, fontSize: 11 }}>{label}</p>
      <p>
        <span style={{ color: "#DA3633", fontWeight: 600 }}>
          {payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </span>{" "}
        <span style={{ color: "#6E7681" }}>total sales</span>
      </p>
    </div>
  );
}

export default function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-[#6E7681]">
        Loading trend data…
      </div>
    );
  }

  // Show every 6th label to avoid crowding
  const tickInterval = Math.max(1, Math.floor(data.length / 12));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#DA3633" stopOpacity={0.45} />
              <stop offset="50%" stopColor="#DA3633" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#DA3633" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fill: "#6E7681", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fill: "#6E7681", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
            }
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotoneX"
            dataKey="sales"
            stroke="#DA3633"
            strokeWidth={2.8}
            fill="url(#salesGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#DA3633", stroke: "#0D1117", strokeWidth: 2 }}
            name="Total Sales"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
