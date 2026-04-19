import fs from "fs/promises";
import path from "path";
import InventoryClient from "./inventory-client";
import type { DatasetComparisonPayload, DatasetComparisonRow, DatasetComparisonStats } from "@/lib/api";

const RAW_DATASET_CANDIDATES = [
    path.join(process.cwd(), "data", "dataset", "sales_monthly.csv"),
    path.join(process.cwd(), "backend", "data", "Dataset", "salesmonthly.csv"),
];

const PROCESSED_DATASET_CANDIDATES = [
    path.join(process.cwd(), "data", "dataset", "final_dataset.csv"),
    path.join(process.cwd(), "backend", "data", "Dataset", "final_pharma_sales_dataset.csv"),
];

type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (character === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += character;
    }

    values.push(current.trim());
    return values;
}

function parseCsv(content: string): { headers: string[]; rows: CsvRow[] } {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row: CsvRow = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });
        return row;
    });

    return { headers, rows };
}

function toNumber(value: string | undefined): number {
    if (!value) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function resolveMissingLabel(missingRate: number): "None" | "Low" | "Medium" | "High" {
    if (missingRate === 0) return "None";
    if (missingRate < 1) return "Low";
    if (missingRate < 5) return "Medium";
    return "High";
}

function buildStats(headers: string[], rows: CsvRow[], label: string): DatasetComparisonStats {
    let missingCount = 0;

    rows.forEach((row) => {
        headers.forEach((header) => {
            const value = row[header];
            if (value === undefined || value === null || value.trim().length === 0) {
                missingCount += 1;
            }
        });
    });

    const cells = Math.max(1, headers.length * Math.max(1, rows.length));
    const missingRate = (missingCount / cells) * 100;

    return {
        rowsCount: rows.length,
        featuresCount: headers.length,
        missingCount,
        missingLabel: resolveMissingLabel(missingRate),
        cleanlinessStatus: label,
    };
}

function buildRawRows(rows: CsvRow[]): DatasetComparisonRow[] {
    const drugColumns = ["M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06"];

    return rows.map((row, index) => {
        const numericEntries = drugColumns.map((column) => ({ column, value: toNumber(row[column]) }));
        const demand = numericEntries.reduce((sum, item) => sum + item.value, 0);
        const stock = Math.round(demand * 1.18);
        const price = Number((demand / 8 + 10).toFixed(2));
        const dominant = [...numericEntries].sort((left, right) => right.value - left.value)[0]?.column ?? "Unknown";

        return {
            id: `raw-${index + 1}`,
            date: row.datum ?? "",
            category: dominant,
            stock,
            demand: Number(demand.toFixed(2)),
            price,
            metricA: toNumber(row.M01AB),
            metricB: toNumber(row.N02BE),
            metricC: toNumber(row.R03),
        };
    });
}

function buildProcessedRows(rows: CsvRow[]): DatasetComparisonRow[] {
    return rows.map((row, index) => {
        const demand = toNumber(row.sales_quantity);
        const stock = Math.round((toNumber(row.sales_lag_1) + toNumber(row.rolling_mean_7)) * 1.25);
        const price = Number((toNumber(row.rolling_mean_7) * 0.9 + 5).toFixed(2));

        return {
            id: `processed-${index + 1}`,
            date: row.datum ?? "",
            category: row.atc_category ?? "Unknown",
            stock,
            demand: Number(demand.toFixed(2)),
            price,
            metricA: toNumber(row.time_idx),
            metricB: toNumber(row.month),
            metricC: toNumber(row.sales_class),
        };
    });
}

async function loadDataset(candidates: string[]) {
    for (const filePath of candidates) {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            return { filePath, content };
        } catch {
            // Try next candidate.
        }
    }

    return null;
}

export default async function InventoryPage() {
    const rawFile = await loadDataset(RAW_DATASET_CANDIDATES);
    const processedFile = await loadDataset(PROCESSED_DATASET_CANDIDATES);

    if (!rawFile || !processedFile) {
        return (
            <main className="p-6 text-(--color-light-gray)">
                <p>Dataset files were not found.</p>
            </main>
        );
    }

    const rawParsed = parseCsv(rawFile.content);
    const processedParsed = parseCsv(processedFile.content);

    const data: DatasetComparisonPayload = {
        raw: {
            columns: ["date", "category", "stock", "demand", "price", "metricA", "metricB", "metricC"],
            rows: buildRawRows(rawParsed.rows),
            stats: buildStats(rawParsed.headers, rawParsed.rows, "Raw data loaded directly from local CSV"),
        },
        processed: {
            columns: ["date", "category", "stock", "demand", "price", "metricA", "metricB", "metricC"],
            rows: buildProcessedRows(processedParsed.rows),
            stats: buildStats(processedParsed.headers, processedParsed.rows, "Processed data loaded directly from local CSV"),
        },
    };

    return <InventoryClient initialData={data} />;
}