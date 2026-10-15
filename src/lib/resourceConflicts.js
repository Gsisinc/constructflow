// Conflict detection for resource allocations.
// Two allocations conflict when they share the same resource_id and their date ranges overlap.

export function rangesOverlap(a, b) {
  if (!a?.start_date || !a?.end_date || !b?.start_date || !b?.end_date) return false;
  return a.start_date <= b.end_date && b.start_date <= a.end_date;
}

export function sameResource(a, b) {
  if (!a?.resource_id || !b?.resource_id) return false;
  return a.resource_id === b.resource_id && a.resource_type === b.resource_type;
}

/**
 * Build a map of allocation.id -> Set of allocation ids it conflicts with.
 * An allocation is "conflicted" if it appears as a key in this map.
 */
export function buildConflictMap(allocations) {
  const arr = Array.isArray(allocations) ? allocations : [];
  const map = new Map();
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i];
      const b = arr[j];
      if (sameResource(a, b) && rangesOverlap(a, b)) {
        if (!map.has(a.id)) map.set(a.id, new Set());
        if (!map.has(b.id)) map.set(b.id, new Set());
        map.get(a.id).add(b.id);
        map.get(b.id).add(a.id);
      }
    }
  }
  return map;
}

export function isConflicted(conflictMap, id) {
  return !!id && conflictMap.has(id);
}

/** Week helpers — weeks start Monday. */
export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export function fmtWeekLabel(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opt = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opt)} – ${sunday.toLocaleDateString("en-US", opt)}`;
}

export function weekKey(date) {
  const d = startOfWeek(date);
  return d.toISOString().slice(0, 10);
}

/** Does an allocation's range overlap a given week (Mon–Sun)? */
export function allocationInWeek(alloc, weekMonday) {
  if (!alloc?.start_date || !alloc?.end_date) return false;
  const monday = new Date(weekMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const s = new Date(alloc.start_date + "T00:00:00");
  const e = new Date(alloc.end_date + "T23:59:59");
  return s <= sunday && e >= monday;
}