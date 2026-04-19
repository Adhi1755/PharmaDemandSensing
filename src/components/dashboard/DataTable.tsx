"use client";

import { useMemo, useState } from "react";

export interface DataTableColumn<T> {
    key: keyof T | string;
    label: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    rowKey: (row: T) => string;
    pageSize?: number;
    emptyMessage?: string;
}

export default function DataTable<T>({
    data,
    columns,
    rowKey,
    pageSize = 8,
    emptyMessage = "No records found.",
}: DataTableProps<T>) {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    const safePage = Math.min(page, totalPages);

    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, safePage, pageSize]);

    return (
        <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)]">
            <div className="max-h-115 overflow-auto">
                <table className="w-full min-w-195 border-collapse">
                    <thead className="sticky top-0 z-10 bg-[rgba(0,0,0,0.92)] backdrop-blur-md">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className="border-b border-[rgba(255,255,255,0.12)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(191,191,191,1)]"
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length ? (
                            visibleRows.map((row) => (
                                <tr key={rowKey(row)} className="transition-colors hover:bg-[rgba(255,0,0,0.08)]">
                                    {columns.map((column) => (
                                        <td
                                            key={String(column.key)}
                                            className={`border-b border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm text-(--color-light-gray) ${column.className || ""}`}
                                        >
                                            {column.render
                                                ? column.render(row)
                                                : (row[column.key as keyof T] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[rgba(191,191,191,1)]">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.12)] px-4 py-3">
                <p className="text-xs text-[rgba(191,191,191,1)]">
                    Page {safePage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, Math.min(totalPages, prev - 1)))}
                        disabled={safePage === 1}
                        className="rounded-lg border border-[rgba(255,255,255,0.16)] px-3 py-1.5 text-xs text-(--color-light-gray) disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, Math.min(totalPages, prev + 1)))}
                        disabled={safePage === totalPages}
                        className="rounded-lg border border-[rgba(255,255,255,0.16)] px-3 py-1.5 text-xs text-(--color-light-gray) disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
