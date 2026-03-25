/**
 * Rwanda-style address: district + sector disambiguate cells/villages that repeat
 * across the country. We match farmers at **cell** level (same akarere + umurenge + akagari).
 */

export function normalizePart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Stable key for DB queries: same cell = same key. */
export function computeLocationKey(
  district: string,
  sector: string,
  cell: string
): string {
  const d = normalizePart(district);
  const s = normalizePart(sector);
  const c = normalizePart(cell);
  if (!d || !s || !c) return "";
  return `${d}|${s}|${c}`;
}

/** Human-readable line for profile / legacy `location` field. */
export function formatFullLocation(parts: {
  district: string;
  sector: string;
  cell: string;
  village: string;
}): string {
  return [parts.district, parts.sector, parts.cell, parts.village]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(" · ");
}
