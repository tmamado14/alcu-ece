// Minimal RFC-4180-ish CSV parser/serializer (quoted fields, embedded
// commas/quotes/newlines). Small enough to keep dependency-free.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

/**
 * The `numerical_tolerance` column holds a bare number for an absolute
 * tolerance and a percent-suffixed one for a relative tolerance ("1%" = ±1%).
 * A row may carry both, separated by ";", since grading accepts a value that
 * falls inside either bound. Shared by the seed, the importer and the exporter
 * so a question survives an export/import round trip unchanged.
 */
export function parseTolerance(raw: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of (raw ?? "").split(";")) {
    const s = part.trim();
    if (s === "") continue;
    const rel = s.endsWith("%");
    const n = parseFloat(rel ? s.slice(0, -1) : s);
    if (isNaN(n)) continue;
    if (rel) out.toleranceRel = n / 100;
    else out.toleranceAbs = n;
  }
  // A blank or unparsable column keeps the historical default of ±1%.
  return Object.keys(out).length > 0 ? out : { toleranceRel: 0.01 };
}

export function formatTolerance(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof data.toleranceAbs === "number") parts.push(String(data.toleranceAbs));
  if (typeof data.toleranceRel === "number") {
    // 0.02 * 100 lands on 2.0000000000000004 in binary floating point.
    parts.push(`${parseFloat((data.toleranceRel * 100).toPrecision(12))}%`);
  }
  return parts.join(";");
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = v === null || v === undefined ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\r\n");
}
