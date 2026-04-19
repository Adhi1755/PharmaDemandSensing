import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ── Drug column definitions ───────────────────────────────────
const DRUG_COLUMNS = ["M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06"];

const DRUG_LABELS: Record<string, string> = {
  M01AB: "M01AB",
  M01AE: "M01AE",
  N02BA: "N02BA",
  N02BE: "N02BE",
  N05B:  "N05B",
  N05C:  "N05C",
  R03:   "R03",
  R06:   "R06",
};

// ── CSV parser ────────────────────────────────────────────────
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "0").trim();
    });
    return row;
  });
}

// ── Month label formatter ─────────────────────────────────────
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(isoDate: string): string {
  // isoDate is like "2014-01-31" — show "Jan 2014"
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Main handler ──────────────────────────────────────────────
export async function GET() {
  try {
    const csvPath = path.join(
      process.cwd(),
      "backend",
      "data",
      "Dataset",
      "salesmonthly.csv"
    );

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { status: "error", message: `CSV not found at: ${csvPath}` },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(csvPath, "utf-8");
    const rawRows = parseCSV(content);

    // Parse and filter rows with any actual sales
    interface ParsedRow {
      date: string;
      label: string;
      drugs: Record<string, number>;
      total: number;
    }

    const data: ParsedRow[] = rawRows
      .map((row) => {
        const drugs: Record<string, number> = {};
        let total = 0;
        DRUG_COLUMNS.forEach((col) => {
          const val = parseFloat(row[col] ?? "0") || 0;
          drugs[col] = Math.round(val * 100) / 100;
          total += val;
        });
        return {
          date: row["datum"] ?? "",
          label: fmtDate(row["datum"] ?? ""),
          drugs,
          total: Math.round(total * 100) / 100,
        };
      })
      .filter((r) => r.total > 10); // remove anomaly rows (e.g. 2017-01 all zeros)

    if (data.length === 0) {
      return NextResponse.json(
        { status: "error", message: "No valid data rows found in CSV" },
        { status: 500 }
      );
    }

    // ── KPI 1: Total Sales ─────────────────────────────────────
    const totalSales = Math.round(data.reduce((s, r) => s + r.total, 0) * 100) / 100;

    // ── KPI 2: Total Drugs ────────────────────────────────────
    const totalDrugs = DRUG_COLUMNS.length;

    // ── KPI 3: Avg Monthly Sales ───────────────────────────────
    const avgMonthlySales = Math.round((totalSales / data.length) * 100) / 100;

    // ── KPI 4: Top Drug ────────────────────────────────────────
    const drugTotals: Record<string, number> = {};
    DRUG_COLUMNS.forEach((col) => {
      drugTotals[col] = Math.round(
        data.reduce((s, r) => s + r.drugs[col], 0) * 100
      ) / 100;
    });
    const topDrugKey = Object.entries(drugTotals).sort((a, b) => b[1] - a[1])[0][0];
    const topDrug = DRUG_LABELS[topDrugKey] ?? topDrugKey;

    // ── Chart 1: Demand Trend ──────────────────────────────────
    // Monthly total sales over time
    const trend = data.map((r) => ({
      date: r.label,
      sales: r.total,
    }));

    // ── Chart 2: Top 5 Drugs (bar) ────────────────────────────
    const topDrugs = Object.entries(drugTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, val]) => ({
        drug: DRUG_LABELS[key] ?? key,
        sales: val,
      }));

    // ── Chart 3: Monthly Distribution ────────────────────────
    // Average sales per calendar month (Jan–Dec) across all years
    const monthlyAgg: Record<number, number[]> = {};
    data.forEach((r) => {
      const month = new Date(r.date).getMonth(); // 0-indexed
      if (!monthlyAgg[month]) monthlyAgg[month] = [];
      monthlyAgg[month].push(r.total);
    });
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const vals = monthlyAgg[i] ?? [];
      const avg = vals.length
        ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100
        : 0;
      return { month: MONTH_NAMES[i], avgSales: avg };
    });

    // ── Chart 4 (bonus): Per-drug yearly totals ───────────────
    // Group by year for stacked view
    const yearlyMap: Record<string, Record<string, number>> = {};
    data.forEach((r) => {
      const year = new Date(r.date).getFullYear().toString();
      if (!yearlyMap[year]) {
        yearlyMap[year] = {};
        DRUG_COLUMNS.forEach((col) => (yearlyMap[year][col] = 0));
      }
      DRUG_COLUMNS.forEach((col) => {
        yearlyMap[year][col] = Math.round((yearlyMap[year][col] + r.drugs[col]) * 100) / 100;
      });
    });
    const yearly = Object.entries(yearlyMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, drugs]) => ({ year, ...drugs }));

    return NextResponse.json({
      status: "success",
      kpis: {
        totalSales,
        totalDrugs,
        avgMonthlySales,
        topDrug,
      },
      charts: {
        trend,
        topDrugs,
        monthly,
        yearly,
      },
      meta: {
        months: data.length,
        dateRange: {
          from: data[0].label,
          to: data[data.length - 1].label,
        },
      },
    });
  } catch (err) {
    console.error("[dashboard API]", err);
    return NextResponse.json(
      { status: "error", message: String(err) },
      { status: 500 }
    );
  }
}
