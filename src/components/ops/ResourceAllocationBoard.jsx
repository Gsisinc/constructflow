import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Wrench, User, Lightbulb, UserCheck, CalendarClock, CalendarRange, AlertOctagon, Wand2 } from "lucide-react";
import ResourceAssignmentDialog from "./ResourceAssignmentDialog";
import {
  buildConflictMap, isConflicted, startOfWeek, addWeeks, fmtWeekLabel, allocationInWeek, rangesOverlap,
} from "@/lib/resourceConflicts";

const WEEKS = 6;

/**
 * Ops resource allocation board — grid by resource (rows) × week (columns).
 * Overlapping assignments for the same resource show a red conflict flag on both.
 * props: organizationId, projectId (scope to one project; still loads org allocations for conflict detection)
 */
export default function ResourceAllocationBoard({ organizationId, projectId, phasesForProject: phasesProp = [] }) {
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [showAdd, setShowAdd] = useState(false);

  const weeks = useMemo(
    () => Array.from({ length: WEEKS }, (_, i) => addWeeks(anchor, i)),
    [anchor]
  );

  const { data: allocations = [] } = useQuery({
    queryKey: ["resourceAllocations", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await base44.entities.ResourceAllocation.filter(
        { organization_id: organizationId },
        { sort: "start_date", limit: 500 }
      );
      return res?.items || res || [];
    },
    enabled: !!organizationId,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["boardWorkers", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await base44.entities.Worker.filter({ organization_id: organizationId }, { limit: 200 });
      return res?.items || res || [];
    },
    enabled: !!organizationId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["boardProjects", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await base44.entities.Project.filter({ organization_id: organizationId }, { limit: 200 });
      return res?.items || res || [];
    },
    enabled: !!organizationId,
  });

  const visibleAllocations = useMemo(
    () => projectId ? allocations.filter((a) => a.project_id === projectId) : allocations,
    [allocations, projectId]
  );

  const conflictMap = useMemo(() => buildConflictMap(allocations), [allocations]);

  // Rows: every resource that has an allocation in view, plus all org workers (so techs with no assignments still show).
  const rows = useMemo(() => {
    const map = new Map(); // key -> { key, type, name, email }
    allocations.forEach((a) => {
      const key = `${a.resource_type}::${a.resource_id}`;
      if (!map.has(key)) map.set(key, { key, type: a.resource_type, name: a.resource_name, email: a.resource_email, id: a.resource_id });
    });
    workers.forEach((w) => {
      const key = `tech::${w.id}`;
      if (!map.has(key)) map.set(key, { key, type: "tech", name: w.name, email: w.email, id: w.id });
    });
    return Array.from(map.values()).filter((r) => r.type === "tech" || !!r.id);
  }, [allocations, workers]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["resourceAllocations", organizationId] });
  }, [queryClient, organizationId]);

  const phasesForProject = phasesProp;

  const conflictedCount = allocations.filter((a) => isConflicted(conflictMap, a.id)).length;
  const suggestions = useMemo(() => buildConflictSuggestions(allocations, conflictMap, workers), [allocations, conflictMap, workers]);

  // ---- Presentation-only derivations (no new queries, no writes) ----
  const [view, setView] = useState("week"); // mockup .seg: Day | Week | Month (Month hidden < 640px, like .hide-m)
  const [flashFixes, setFlashFixes] = useState(false);
  useEffect(() => {
    if (!flashFixes) return undefined;
    const t = setTimeout(() => setFlashFixes(false), 1800);
    return () => clearTimeout(t);
  }, [flashFixes]);

  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayYmd = ymd(new Date());

  // Columns: Week = Mon–Fri of the anchor week (mockup), Day = today (or Monday of the anchor week), Month = the 6 loaded weeks.
  const columns = useMemo(() => {
    const dayCol = (d) => ({
      key: ymd(d), top: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(), big: String(d.getDate()),
      today: ymd(d) === todayYmd, hit: (a) => rangesOverlap(a, { start_date: ymd(d), end_date: ymd(d) }),
    });
    if (view === "month") {
      return weeks.map((w) => ({
        key: w.toISOString(), top: "WEEK", big: w.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        today: startOfWeek(new Date()).getTime() === w.getTime(), hit: (a) => allocationInWeek(a, w),
      }));
    }
    if (view === "day") {
      const inWeek = startOfWeek(new Date()).getTime() === anchor.getTime();
      return [dayCol(inWeek ? new Date() : new Date(anchor))];
    }
    return Array.from({ length: 5 }, (_, i) => { const d = new Date(anchor); d.setDate(d.getDate() + i); return dayCol(d); });
  }, [view, weeks, anchor, todayYmd]);
  const N = columns.length;

  const projectColor = useMemo(() => {
    const ids = Array.from(new Set(allocations.map((a) => a.project_id || "none")));
    const m = new Map();
    ids.forEach((id, i) => m.set(id, PALETTE[i % PALETTE.length]));
    return m;
  }, [allocations]);

  const rowView = useMemo(() => rows.map((row) => {
    const rowAllocs = allocations.filter((a) => `${a.resource_type}::${a.resource_id}` === row.key);
    const jobs = (projectId ? rowAllocs.filter((a) => a.project_id === projectId) : rowAllocs)
      .map((a) => {
        const idx = columns.map((c, i) => (c.hit(a) ? i : -1)).filter((i) => i >= 0);
        return idx.length ? { a, s: idx[0], e: idx[idx.length - 1] } : null;
      })
      .filter(Boolean)
      .sort((x, y) => x.s - y.s || y.e - x.e);
    const laneEnds = [];
    jobs.forEach((j) => {
      let lane = laneEnds.findIndex((end) => end < j.s);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(j.e); } else laneEnds[lane] = j.e;
      j.lane = lane;
    });
    // Utilization = bookings per column / columns (overbooking > 100%, as in the mockup)
    const load = columns.reduce((s, c) => s + rowAllocs.filter((a) => c.hit(a)).length, 0);
    const util = N ? Math.round((load / N) * 100) : 0;
    const conflictCols = columns.map((c) => rowAllocs.some((a) => c.hit(a) && isConflicted(conflictMap, a.id)));
    return { row, jobs, lanes: Math.max(1, laneEnds.length), util, conflictCols };
  }), [rows, allocations, projectId, columns, conflictMap, N]);

  const techRows = rowView.filter((r) => r.row.type === "tech");
  const techCount = techRows.length;
  const avgUtil = rowView.length ? Math.round(rowView.reduce((s, r) => s + r.util, 0) / rowView.length) : 0;
  const utilColor = (u) => (u > 100 ? DANGER : u < 70 ? AMBER : GREEN);

  const legend = useMemo(() => {
    const seen = new Map();
    rowView.forEach((r) => r.jobs.forEach(({ a }) => { const id = a.project_id || "none"; if (!seen.has(id)) seen.set(id, a.project_name || "Unassigned"); }));
    return Array.from(seen.entries());
  }, [rowView]);

  const first = suggestions[0];
  const overlapDate = first ? (first.a.end_date < first.b.end_date ? first.b.start_date : first.b.start_date) : null;
  // Invisible week navigation (header only — never the grid, so the grid's sideways scroll is untouched)
  const swipeRef = useRef(null);
  const swipedRef = useRef(false);
  const dateInputRef = useRef(null);
  const onHeadTouchStart = (e) => {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY };
    swipedRef.current = false;
  };
  const onHeadTouchEnd = (e) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swipedRef.current = true; // swallow the click that follows the swipe
      setAnchor((a) => addWeeks(a, dx < 0 ? 1 : -1));
    }
  };
  const openWeekPicker = () => {
    if (swipedRef.current) { swipedRef.current = false; return; }
    const el = dateInputRef.current;
    if (!el) return;
    el.value = ymd(anchor);
    try {
      if (typeof el.showPicker === "function") { el.showPicker(); return; }
    } catch (_) { /* fall through to click */ }
    el.focus();
    el.click();
  };
  const onEyebrowKey = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); openWeekPicker(); }
  };
  const onPickDate = (e) => {
    const v = e.target.value;
    if (v) setAnchor(startOfWeek(new Date(v + "T00:00:00")));
  };

  const onAutoResolve = () => {
    const el = typeof document !== "undefined" ? document.getElementById("rb-suggested-fixes") : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlashFixes(true);
  };

  const ROW_MIN = 68;

  return (
    <div className="text-foreground text-sm">
      {/* .ph */}
      <div className="flex flex-wrap items-end justify-between gap-5 mb-[22px]">
        <div className="min-w-0 relative" style={{ touchAction: "pan-y" }} onTouchStart={onHeadTouchStart} onTouchEnd={onHeadTouchEnd}
          onTouchCancel={() => { swipeRef.current = null; }}>
          <div role="button" tabIndex={0} aria-label="Change week" aria-haspopup="dialog" onClick={openWeekPicker} onKeyDown={onEyebrowKey}
            className="inline-flex items-center gap-[7px] text-[11px] font-semibold uppercase tracking-[0.14em] mb-2 cursor-pointer select-none rounded outline-none focus-visible:ring-2 focus-visible:ring-ring [-webkit-tap-highlight-color:transparent]" style={{ color: GOLD2 }}>
            <CalendarRange className="h-[15px] w-[15px]" /> Field · Week of {anchor.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
          <input ref={dateInputRef} type="date" tabIndex={-1} aria-hidden="true" onChange={onPickDate}
            className="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none overflow-hidden" style={{ clip: "rect(0 0 0 0)", clipPath: "inset(50%)" }} />
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.025em] leading-[1.15]">
            Resource <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${GOLD3}, ${GOLD} 60%)` }}>Board</span>
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            {techCount} technician{techCount === 1 ? "" : "s"} · {avgUtil}% utilized · color = project
          </p>
        </div>
        {/* .ph-actions — on < 640px non-gold buttons hide, as in premium.css */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-[3px] rounded-[10px] border border-border" style={{ background: mix(FG, 4) }} role="tablist" aria-label="View">
            {[["day", "Day", ""], ["week", "Week", ""], ["month", "Month", "hidden sm:inline-flex"]].map(([k, label, cls]) => (
              <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)}
                className={`${cls} relative items-center after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] px-[11px] py-[5px] rounded-[7px] text-xs font-semibold transition-colors`}
                style={view === k ? { background: mix(FG, 9), color: FG, boxShadow: `0 1px 0 ${mix(FG, 6)} inset` } : { color: MUTED }}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Previous" onClick={() => setAnchor(addWeeks(anchor, -1))}
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-[10px] border border-border transition hover:-translate-y-px" style={{ background: mix(FG, 4) }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Next" onClick={() => setAnchor(addWeeks(anchor, 1))}
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-[10px] border border-border transition hover:-translate-y-px" style={{ background: mix(FG, 4) }}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setShowAdd(true)}
            className="relative inline-flex items-center gap-2 h-9 px-[14px] after:absolute after:-inset-1 after:content-[''] rounded-[10px] text-[13px] font-semibold transition hover:-translate-y-px"
            style={{ background: `linear-gradient(180deg, ${GOLD2}, ${GOLD})`, color: NAVY, boxShadow: `0 0 0 1px ${mix(GOLD3, 35)} inset, 0 8px 24px -8px ${mix(GOLD, 65)}` }}>
            <Plus className="h-4 w-4" /> Assign
          </button>
        </div>
      </div>

      {/* .warn */}
      {first && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-[14px] px-4 py-[14px] rounded-[14px] border"
          style={{ borderColor: mix(DANGER, 45), background: `linear-gradient(90deg, ${mix(DANGER, 16)}, ${mix(DANGER, 4)})`, boxShadow: `0 0 40px -14px ${mix(DANGER, 70)}` }}>
          <span className="grid place-items-center h-[38px] w-[38px] shrink-0 rounded-[11px] animate-pulse" style={{ background: mix(DANGER, 20), color: DANGER }}>
            <AlertOctagon className="h-[18px] w-[18px]" />
          </span>
          <div className="flex-1 min-w-0">
            <b className="text-[13.5px]" style={{ color: DANGER }}>Double-booking detected</b>
            <small className="block mt-0.5 text-[14px] sm:text-[12.5px] text-muted-foreground">
              <b className="text-foreground">{first.a.resource_name}</b> is scheduled on <b className="text-foreground">{first.a.project_name || "Unassigned"}</b> and{" "}
              <b className="text-foreground">{first.b.project_name || "Unassigned"}</b>{" "}
              {overlapDate ? new Date(overlapDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}.
              {suggestions.length > 1 ? ` +${suggestions.length - 1} more.` : ""}
            </small>
          </div>
          <button type="button" onClick={onAutoResolve}
            className="relative inline-flex w-full sm:w-auto items-center justify-center gap-2 h-9 sm:h-[30px] after:absolute after:inset-x-0 after:-inset-y-1 sm:after:-inset-y-[7px] after:content-[''] px-[10px] rounded-lg border border-border text-xs font-semibold transition hover:-translate-y-px"
            style={{ background: mix(FG, 4) }} title="Shows the suggested fixes — nothing changes until you assign">
            <Wand2 className="h-4 w-4" /> Auto-resolve
          </button>
        </div>
      )}

      {/* legend */}
      <div className="flex items-center justify-between mt-4 mb-3">
        <div className="flex gap-3 flex-wrap text-[12px] text-muted-foreground">
          {legend.map(([id, name]) => (
            <span key={id} className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: projectColor.get(id) }} />
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* .card.rb — the timeline grid is the view at every width (sideways touch scroll on mobile) */}
      <div className="relative rounded-2xl border border-border overflow-hidden" style={{ background: mix(NAVY, 40), boxShadow: SHADOW }}>
        <div className="overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]" style={{ touchAction: "pan-x pan-y" }}>
          <div className="grid [--rb-tech:150px] [--rb-col:120px] sm:[--rb-tech:210px] sm:[--rb-col:130px]"
            style={{ gridTemplateColumns: `var(--rb-tech) repeat(${N}, minmax(var(--rb-col), 1fr))`, minWidth: N === 1 ? undefined : `calc(var(--rb-tech) + ${N} * var(--rb-col) + ${N === 5 ? 0 : 0}px)` }}>
            <div className="sticky left-0 top-0 z-20 p-3 text-xs font-semibold text-left text-muted-foreground border-b border-border" style={{ background: HEAD_BG }}>
              Technician
            </div>
            {columns.map((c) => (
              <div key={c.key} className="sticky top-0 p-3 text-center text-xs font-semibold border-b border-border"
                style={c.today ? { color: GOLD2, background: `linear-gradient(180deg, ${mix(GOLD, 14)}, ${HEAD_BG})` } : { color: MUTED, background: HEAD_BG }}>
                {c.top}<b className="block text-base mt-0.5" style={{ color: c.today ? GOLD3 : FG }}>{c.big}</b>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="col-span-full px-4 py-10 text-center text-sm text-muted-foreground">
                No resources yet. Tap <span className="font-medium text-foreground">Assign</span> to add a tech or piece of equipment.
              </div>
            )}

            {rowView.map(({ row, jobs, lanes, util, conflictCols }) => {
              const rowH = lanes <= 2 ? ROW_MIN : 20 + lanes * 26;
              return (
                <React.Fragment key={row.key}>
                  {/* .rb-tech (sticky) */}
                  <div className="sticky left-0 z-10 flex items-center gap-2.5 p-3 border-b border-r border-border" style={{ background: TECH_BG }}>
                    <Avatar name={row.name} type={row.type} away={util < 70} />
                    <div className="min-w-0">
                      <b className="block text-[13px] leading-tight whitespace-normal [overflow-wrap:normal] sm:truncate">{row.name}</b>
                      <small className="hidden sm:block text-[11px] text-muted-foreground truncate">{row.type === "tech" ? row.email || "Tech" : "Equipment"}</small>
                    </div>
                    <span className="ml-auto text-[11px] font-bold tabular-nums" style={{ color: utilColor(util) }}>{util}%</span>
                  </div>
                  {/* .rb-row */}
                  <div className="relative grid border-b border-border" style={{ gridColumn: "2 / -1", gridTemplateColumns: `repeat(${N}, minmax(0,1fr))`, minHeight: rowH }}>
                    {columns.map((c) => (
                      <div key={c.key} className="border-r border-border" style={c.today ? { background: mix(GOLD, 4.5) } : undefined} />
                    ))}
                    {jobs.map(({ a, s, e, lane }) => {
                      const conflicted = isConflicted(conflictMap, a.id);
                      const color = projectColor.get(a.project_id || "none");
                      const half = jobs.some((o) => o.a.id !== a.id && o.s <= e && s <= o.e);
                      return (
                        <div key={a.id}
                          className={`absolute overflow-hidden cursor-pointer rounded-[10px] border backdrop-blur-[6px] transition-transform duration-200 hover:-translate-y-0.5 hover:z-[3] ${half ? "px-2 py-[3px]" : "px-2.5 py-1.5"} ${conflicted ? "animate-pulse" : ""}`}
                          style={{
                            left: `calc(${(s / N) * 100}% + 5px)`, width: `calc(${((e - s + 1) / N) * 100}% - 10px)`,
                            top: half ? 10 + lane * 26 : 10, height: half ? 22 : 46,
                            background: `linear-gradient(135deg, ${mix(color, 35)}, ${mix(color, 22)})`,
                            boxShadow: `inset 3px 0 0 ${color}${conflicted ? `, 0 0 16px -2px ${mix(DANGER, 80)}` : ""}`,
                            borderColor: conflicted ? mix(DANGER, 90) : mix(FG, 12),
                          }}
                          title={conflicted ? "Double-booked — overlaps another assignment" : a.project_name}>
                          <b className={`block font-bold truncate ${half ? "text-[11px]" : "text-[12px]"}`}>{a.project_name || "Unassigned"}</b>
                          {!half && (
                            <span className="block text-[11.5px] whitespace-nowrap truncate" style={{ color: mix(FG, 75) }}>
                              {a.phase_name || `${a.start_date?.slice(5)} – ${a.end_date?.slice(5)}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {conflictCols.map((bad, i) => bad && (
                      <span key={i} className="absolute z-[4] grid place-items-center h-[22px] w-[22px] rounded-full animate-pulse"
                        style={{ left: `calc(${((i + 1) / N) * 100}% - 11px)`, top: -8, background: DANGER, color: "hsl(var(--destructive-foreground))", boxShadow: `0 0 0 3px ${HEAD_BG}, 0 0 18px ${DANGER}` }}>
                        <AlertTriangle className="h-[13px] w-[13px]" />
                      </span>
                    ))}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* .card.mt16 — sits where the mockup's Unassigned tray is */}
      <div id="rb-suggested-fixes" className="mt-4 scroll-mt-4 rounded-2xl transition-shadow duration-500"
        style={flashFixes ? { boxShadow: `0 0 0 2px ${GOLD}, 0 0 40px -10px ${GOLD}` } : undefined}>
        <ConflictSuggestions suggestions={suggestions} />
      </div>

      <ResourceAssignmentDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        organizationId={organizationId}
        onSaved={refresh}
        projects={projects}
        workers={workers}
        projectId={projectId}
        phasesForProject={phasesForProject}
      />
    </div>
  );
}

// ===== Presentation helpers (premium.css → Tailwind + tokens + --brand vars, no hex) =====
const GOLD = "var(--brand-gold, hsl(var(--ring)))";
const GOLD2 = "var(--brand-gold-2, var(--brand-gold, hsl(var(--ring))))";
const GOLD3 = "color-mix(in srgb, var(--brand-gold-2, var(--brand-gold, hsl(var(--ring)))) 60%, hsl(var(--foreground)))";
const NAVY = "var(--brand-navy, hsl(var(--primary)))";
const DANGER = "hsl(var(--destructive))";
const GREEN = "hsl(var(--success, var(--chart-3)))";
const AMBER = "hsl(var(--warning, var(--chart-5)))";
const MUTED = "hsl(var(--muted-foreground))";
const FG = "hsl(var(--foreground))";
const mix = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const HEAD_BG = "color-mix(in srgb, var(--brand-navy, hsl(var(--primary))) 85%, hsl(var(--card)))";
const TECH_BG = "color-mix(in srgb, var(--brand-navy, hsl(var(--primary))) 45%, hsl(var(--card)))";
const SHADOW = `0 1px 0 ${mix("hsl(var(--foreground))", 4)} inset, 0 10px 30px -12px ${mix("hsl(var(--background))", 55)}, 0 2px 6px -2px ${mix("hsl(var(--background))", 35)}`;
const PALETTE = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "var(--brand-gold, hsl(var(--ring)))"];
const AV_PALETTE = ["hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-3))", "hsl(var(--chart-1))"];

const initials = (n = "") => n.replace(/^TEST\s+/, "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
const avColor = (n = "") => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV_PALETTE[h % AV_PALETTE.length]; };

/** premium.css .av (30px initials) + .st status dot. Dot = mockup rule: amber "away" when utilization < 70%, else green. */
function Avatar({ name, type, away }) {
  const c = avColor(name || "");
  return (
    <span className="relative inline-grid place-items-center h-[30px] w-[30px] shrink-0 rounded-full text-[11.4px] font-bold"
      style={{ background: `linear-gradient(135deg, ${c}, ${mix(c, 55)})`, color: FG, textShadow: `0 1px 2px ${mix("hsl(var(--background))", 30)}`, boxShadow: `0 0 0 2px ${HEAD_BG}, 0 0 0 3px ${mix(FG, 7)}` }}
      title={name}>
      {type === "tech" ? initials(name) : <Wrench className="h-3.5 w-3.5" />}
      <span className="absolute -right-px -bottom-px h-2 w-2 rounded-full" style={{ background: away ? AMBER : GREEN, boxShadow: `0 0 0 2px ${HEAD_BG}` }} />
    </span>
  );
}

// ===== Conflict suggestions (Entered by: Ops Manager, 2026-10-15) — read-only =====

const DAY = 86400000;
const toD = (s) => new Date(s + "T00:00:00");
const toS = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => toS(new Date(toD(s).getTime() + n * DAY));
const span = (a) => Math.round((toD(a.end_date) - toD(a.start_date)) / DAY);
const fmt = (s) => (s ? s.slice(5).replace("-", "/") : "");

function isFree(allocations, resourceType, resourceId, range, ignoreId) {
  return !allocations.some(
    (x) => x.id !== ignoreId && x.resource_type === resourceType && x.resource_id === resourceId && rangesOverlap(x, range)
  );
}

/** One entry per conflicting pair: { a, b, options: [{kind, title, detail}] } */
function buildConflictSuggestions(allocations = [], conflictMap, workers = []) {
  const byId = new Map(allocations.map((a) => [a.id, a]));
  const seen = new Set();
  const out = [];
  conflictMap.forEach((others, id) => {
    others.forEach((otherId) => {
      const key = [id, otherId].sort().join("|");
      if (seen.has(key)) return;
      seen.add(key);
      let a = byId.get(id), b = byId.get(otherId);
      if (!a || !b) return;
      if (a.start_date > b.start_date) [a, b] = [b, a]; // b = the later booking, the one we move
      const options = [];

      // 1) Reassign / swap in a free tech for the later booking
      if (b.resource_type === "tech") {
        workers
          .filter((w) => w.id !== b.resource_id && isFree(allocations, "tech", w.id, b))
          .slice(0, 2)
          .forEach((w) =>
            options.push({ kind: "reassign", title: `Swap in ${w.name}`, detail: `Free ${fmt(b.start_date)}–${fmt(b.end_date)} for ${b.project_name || "this job"}` })
          );
      }

      // 2) Shift the later booking to start after the earlier one ends (same length)
      let start = addDays(a.end_date, 1);
      for (let i = 0; i < 30; i++) {
        const range = { start_date: start, end_date: addDays(start, span(b)) };
        if (isFree(allocations, b.resource_type, b.resource_id, range, b.id)) {
          options.push({ kind: "shift", title: `Shift ${b.project_name || "booking"}`, detail: `Move to ${fmt(range.start_date)}–${fmt(range.end_date)} (${span(b) + 1} days, same tech)` });
          break;
        }
        start = addDays(start, 1);
      }

      // 3) Shift the earlier booking to finish before the later one starts, if it fits
      const earlyEnd = addDays(b.start_date, -1);
      const earlyRange = { start_date: addDays(earlyEnd, -span(a)), end_date: earlyEnd };
      if (earlyRange.start_date >= toS(new Date()) && isFree(allocations, a.resource_type, a.resource_id, earlyRange, a.id)) {
        options.push({ kind: "shift", title: `Pull ${a.project_name || "booking"} earlier`, detail: `Move to ${fmt(earlyRange.start_date)}–${fmt(earlyRange.end_date)}` });
      }

      if (options.length === 0) options.push({ kind: "none", title: "No clean fix found", detail: "No free tech or open dates in the next 30 days. Review crew capacity." });
      out.push({ a, b, options });
    });
  });
  return out;
}

const ICON = { reassign: UserCheck, shift: CalendarClock, none: AlertTriangle };

/** Styled as premium.css .card + .card-h (the mockup's lower card). Content/logic unchanged. */
function ConflictSuggestions({ suggestions = [] }) {
  if (!suggestions.length) return null;
  return (
    <div className="relative rounded-2xl sm:rounded-[18px] border border-border bg-card p-[15px] sm:p-[18px]" style={{ boxShadow: SHADOW }}>
      <div className="flex flex-wrap items-center gap-2.5 mb-[14px]">
        <span className="grid place-items-center h-7 w-7 rounded-lg border" style={{ background: mix(GOLD, 10), borderColor: mix(GOLD, 18), color: GOLD2 }}>
          <Lightbulb className="h-[15px] w-[15px]" />
        </span>
        <h3 className="text-[14px] font-semibold tracking-[-0.01em]">Suggested fixes</h3>
        <span className="hidden sm:inline text-xs text-muted-foreground">· {suggestions.length} conflict{suggestions.length === 1 ? "" : "s"} · suggestions only, nothing changes until you assign</span>
      </div>
      <div className="flex gap-2.5 flex-wrap">
        {suggestions.map(({ a, b, options }) => (
          <div key={`${a.id}-${b.id}`} className="w-full grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] pb-2.5 border-b border-border last:border-b-0 last:pb-0">
            <div className="text-sm sm:text-xs">
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: DANGER }}>
                <AlertTriangle className="h-3.5 w-3.5" /> {a.resource_name} double-booked
              </div>
              <p className="mt-1 text-muted-foreground">{a.project_name || "Unassigned"} · {fmt(a.start_date)}–{fmt(a.end_date)}</p>
              <p className="text-muted-foreground">{b.project_name || "Unassigned"} · {fmt(b.start_date)}–{fmt(b.end_date)}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
              {options.map((o, i) => {
                const Icon = ICON[o.kind] || Lightbulb;
                return (
                  <div key={i} className="flex min-h-[44px] w-full sm:w-auto sm:min-w-[200px] items-start gap-2 rounded-[10px] border px-3 py-[9px]"
                    style={{ background: mix(FG, 3), borderColor: mix(FG, 12), boxShadow: `inset 3px 0 0 ${o.kind === "none" ? DANGER : GOLD}` }}>
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: o.kind === "none" ? DANGER : GOLD2 }} />
                    <div className="text-sm sm:text-xs">
                      <b className="block font-bold">{o.title}</b>
                      <span className="text-muted-foreground">{o.detail}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
