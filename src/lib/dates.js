// Treat date-only strings (yyyy-MM-dd) as LOCAL dates, never UTC, so a value
// of "2026-11-30" never renders as Nov 29 in a west-of-UTC timezone.
import { format } from 'date-fns';

export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value);
  // date-only: build at local midnight
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // fallback: anything else (ISO datetime) — parse as-is
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

const defaultFmt = 'MMM d, yyyy';

export function fmtDate(value, pattern = defaultFmt) {
  const d = parseLocalDate(value);
  if (!d) return '';
  try {
    return format(d, pattern);
  } catch {
    return d.toLocaleDateString();
  }
}