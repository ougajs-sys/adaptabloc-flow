/**
 * CSV export — pure browser, no library required.
 * Compatible Excel: emits BOM UTF-8 + ; separator (Excel locale FR).
 */

type Row = Record<string, string | number | null | undefined>;

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(filename: string, rows: Row[], columns?: { key: string; label: string }[]) {
  if (rows.length === 0) {
    return;
  }

  const cols = columns ?? Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
  const header = cols.map((c) => escapeCsvCell(c.label)).join(";");
  const body = rows
    .map((row) => cols.map((c) => escapeCsvCell(row[c.key])).join(";"))
    .join("\r\n");

  const csv = "﻿" + header + "\r\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Print the current view as PDF via the browser print dialog. */
export function printAsPDF(title?: string) {
  const originalTitle = document.title;
  if (title) document.title = title;
  window.print();
  if (title) {
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }
}

/** Format date for filename like "2026-04-29". */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
