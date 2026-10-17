import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useOrgProjects } from '@/hooks/useProjectData';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, LabelList } from 'recharts';
import { CheckCircle2, Building2, ClipboardList, Route, Layers, Target, ArrowUpRight, TrendingUp, Activity } from 'lucide-react';
import { fmtDate } from '@/lib/dates';

// Premium system (mockups/Chief/Premium/premium.css) — brand vars + theme tokens only, no hex.
const GOLD = 'var(--brand-gold, hsl(var(--ring)))';
const GOLD2 = 'var(--brand-gold-2, var(--brand-gold, hsl(var(--ring))))';
const NAVY = 'var(--brand-navy, hsl(var(--primary)))';
const mix = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const GRID = 'hsl(var(--border))';
const MUTED = 'hsl(var(--muted-foreground))';
const FG = 'hsl(var(--foreground))';
const CARD_STYLE = { boxShadow: `0 1px 0 ${mix('hsl(var(--foreground))', 4)} inset, 0 18px 40px -24px ${mix(NAVY, 60)}` };
const TOOLTIP = {
  contentStyle: { background: 'hsl(var(--popover))', border: `1px solid ${mix(GOLD, 35)}`, borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 13 },
  labelStyle: { color: FG, fontWeight: 600 },
  cursor: { fill: mix(GOLD, 8) },
};

const safe = (n) => (Number.isFinite(n) ? n : 0);
const trunc = (v, n = 14) => { const t = String(v ?? ''); return t.length > n ? t.slice(0, n) + '…' : t; };

function useIsMobile(bp = 640) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < bp : false));
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setIsMobile(window.innerWidth < bp);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp]);
  return isMobile;
}

function monthKey(d) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; }
function monthLabel(k) { const [y, m] = k.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' }); }

export default function OpsDashboard() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const orgId = user?.organization_id;
  const { data: projects = [] } = useOrgProjects(orgId);
  const projectIds = (projects || []).map(p => p.id);

  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['opsDailyLogs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await base44.entities.DailyLog.filter({ organization_id: orgId }, { sort: '-log_date', limit: 1000 });
      return res?.items || res || [];
    },
    enabled: !!orgId,
  });

  const { data: vehicleLogs = [] } = useQuery({
    queryKey: ['opsVehicleLogs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await base44.entities.VehicleLog.filter({ organization_id: orgId }, { sort: '-log_date', limit: 1000 });
      return res?.items || res || [];
    },
    enabled: !!orgId,
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['opsPhases', projectIds.join(',')],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const res = await base44.entities.CustomPhase.filter({ project_id: { $in: projectIds } }, { sort: 'order', limit: 1000 });
      return res?.items || res || [];
    },
    enabled: projectIds.length > 0,
  });

  const now = new Date();
  const curMonth = monthKey(now.toISOString());
  const totalProjects = (projects || []).length;

  const completed = (projects || []).filter(p => p.status === 'completed').length;
  const active = (projects || []).filter(p => ['awarded', 'in_progress', 'planning', 'bidding'].includes(p.status)).length;
  const completionsThisMonth = (dailyLogs || []).filter(l => monthKey(l.log_date) === curMonth).length;
  const totalMileage = (vehicleLogs || []).reduce((s, m) => s + safe(m.total_miles), 0);

  const last6 = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push(monthKey(d.toISOString())); }
    return out;
  }, [curMonth]);

  // Progress per project. FIX: Project.progress is never written by the app (schema default 0),
  // so fall back to real phase completion (CustomPhase completed / total) when it is 0/missing.
  const progressData = useMemo(() => (projects || []).slice(0, 12).map(p => {
    const phs = (phases || []).filter(ph => ph.project_id === p.id);
    const stored = safe(Number(p.progress));
    const derived = phs.length ? Math.round((phs.filter(ph => ph.status === 'completed').length / phs.length) * 100) : 0;
    return { name: p.name || '—', progress: stored > 0 ? stored : derived, source: stored > 0 ? 'project' : (phs.length ? 'phases' : 'none') };
  }), [projects, phases]);

  // Completions per month (last 6 months)
  const completionsData = useMemo(() => {
    const map = {};
    last6.forEach(k => { map[k] = 0; });
    (dailyLogs || []).forEach(l => { const k = monthKey(l.log_date); if (k in map) map[k]++; });
    return last6.map(k => ({ month: monthLabel(k), logs: map[k] }));
  }, [dailyLogs, last6]);

  // Mileage per month (real VehicleLog data) — KPI sparkline
  const mileageData = useMemo(() => {
    const map = {};
    last6.forEach(k => { map[k] = 0; });
    (vehicleLogs || []).forEach(m => { const k = monthKey(m.log_date); if (k in map) map[k] += safe(m.total_miles); });
    return last6.map(k => ({ month: monthLabel(k), v: map[k] }));
  }, [vehicleLogs, last6]);

  // Targets vs actual (phases: target = total, actual = completed) per project
  const targetsData = useMemo(() => (projects || []).slice(0, 12).map(p => {
    const phs = (phases || []).filter(ph => ph.project_id === p.id);
    return { name: p.name || '—', target: phs.length, actual: phs.filter(ph => ph.status === 'completed').length };
  }), [projects, phases]);

  // Upcoming phases (what's next)
  const upcoming = useMemo(() => {
    return (phases || [])
      .filter(ph => ph.status === 'not_started' || ph.status === 'in_progress')
      .map(ph => ({ ...ph, projectName: (projects || []).find(p => p.id === ph.project_id)?.name || '—' }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, 8);
  }, [phases, projects]);

  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const kpis = [
    { label: 'Projects Completed', value: String(completed), icon: CheckCircle2, viz: { type: 'bar', pct: pct(completed, totalProjects), note: `${pct(completed, totalProjects)}% of ${totalProjects}` } },
    { label: 'Active Projects', value: String(active), icon: Building2, viz: { type: 'bar', pct: pct(active, totalProjects), note: `${pct(active, totalProjects)}% of portfolio` } },
    { label: 'Completions This Month', value: String(completionsThisMonth), icon: ClipboardList, viz: { type: 'spark', data: completionsData.map(d => ({ v: d.logs })), note: 'Daily logs · 6 mo' } },
    { label: 'Total Mileage', value: totalMileage.toLocaleString() + ' mi', icon: Route, viz: { type: 'spark', data: mileageData, note: 'Miles · 6 mo' } },
  ];

  const chartH = isMobile ? 220 : 260;
  const progressH = Math.max(chartH, progressData.length * (isMobile ? 30 : 26) + 24);
  const progressEmpty = progressData.length === 0 || progressData.every(d => d.progress === 0);
  const derivedCount = progressData.filter(d => d.source === 'phases').length;

  // Targets vs Actual — horizontal "bullet" rows (target = track, completed = gold fill on top),
  // so long project names read cleanly at 390px; full name stays in the tooltip.
  const tvaBar = isMobile ? 12 : 14;
  const targetsH = Math.max(chartH, targetsData.length * (isMobile ? 34 : 32) + 56);
  const targetsMax = Math.max(1, ...targetsData.map(d => d.target));

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 text-foreground">
      <div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: GOLD2 }}>
          <Activity className="h-3.5 w-3.5" /> Operations
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Ops <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${GOLD2}, ${GOLD} 60%)` }}>Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Project delivery, field completions, phase pipeline and targets vs actual.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="min-w-0 overflow-hidden rounded-2xl border-border bg-card" style={CARD_STYLE}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="grid place-items-center h-7 w-7 shrink-0 rounded-lg border" style={{ background: mix(GOLD, 10), borderColor: mix(GOLD, 20), color: GOLD2 }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs sm:text-[13px] font-medium leading-tight">{k.label}</span>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold tabular-nums tracking-tight truncate">{k.value}</p>
                <KpiViz viz={k.viz} id={k.label.replace(/\W/g, '')} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Progress per project — horizontal bars */}
        <ChartCard icon={TrendingUp} title="Progress per Project" sub={derivedCount > 0 ? `${derivedCount} from phase completion` : null}>
          {progressEmpty ? <Empty /> : (
            <ResponsiveContainer width="100%" height={progressH}>
              <BarChart data={progressData} layout="vertical" margin={{ top: 4, right: isMobile ? 28 : 24, left: 4, bottom: 4 }} barCategoryGap={isMobile ? 6 : 8}>
                <defs>
                  <linearGradient id="opsProgGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={GOLD2} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke={GRID} strokeOpacity={0.6} />
                <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} interval={0} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={isMobile ? 100 : 120} interval={0} tick={<NameTick max={isMobile ? 12 : 14} fontSize={isMobile ? 11 : 12} />} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} labelFormatter={(l) => l} formatter={(v, _n, item) => [`${v}%${item?.payload?.source === 'phases' ? ' (from phases)' : ''}`, 'Progress']} />
                <Bar dataKey="progress" name="Progress %" fill="url(#opsProgGrad)" radius={[0, 6, 6, 0]} background={{ fill: mix(GOLD, 6), radius: 6 }} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Completions by month — premium */}
        <ChartCard icon={ClipboardList} title="Completions (Daily Logs) by Month">
          {completionsData.every(d => d.logs === 0) ? <Empty /> : (
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart data={completionsData} margin={{ top: 8, right: 8, left: -16, bottom: isMobile ? 12 : 8 }}>
                <defs>
                  <linearGradient id="opsCompGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD2} stopOpacity={1} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 6" stroke={GRID} strokeOpacity={0.5} />
                <XAxis dataKey="month" hide={false} interval={0} tick={{ fontSize: isMobile ? 11 : 12, fill: MUTED }} axisLine={false} tickLine={false} height={30} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="logs" name="Daily Logs" fill="url(#opsCompGrad)" radius={[8, 8, 2, 2]} maxBarSize={isMobile ? 28 : 40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Targets vs Actual */}
        <ChartCard icon={Target} title="Targets vs Actual (Phases)">
          {targetsData.every(d => d.target === 0) ? <Empty /> : (
            <ResponsiveContainer width="100%" height={targetsH}>
              <BarChart data={targetsData} layout="vertical" margin={{ top: 0, right: isMobile ? 40 : 44, left: 4, bottom: 4 }} barCategoryGap={isMobile ? 8 : 10} barGap={-tvaBar}>
                <defs>
                  <linearGradient id="opsTvaGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={GOLD2} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke={GRID} strokeOpacity={0.6} />
                <XAxis type="number" domain={[0, targetsMax]} allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={isMobile ? 100 : 120} interval={0} tick={<NameTick max={isMobile ? 12 : 14} fontSize={isMobile ? 11 : 12} />} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} labelFormatter={(l) => l} formatter={(v, n) => [`${v} phase${v === 1 ? '' : 's'}`, n]} />
                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} height={28} wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: MUTED }}>{v}</span>} />
                <Bar dataKey="target" name="Target" fill={mix(MUTED, 26)} radius={[0, 6, 6, 0]} barSize={tvaBar} isAnimationActive={false}>
                  <LabelList dataKey="target" position="right" offset={8} content={(lp) => {
                    const row = targetsData[lp.index];
                    if (!row || lp.x == null) return null;
                    return (
                      <text x={lp.x + lp.width + 8} y={lp.y + lp.height / 2} dominantBaseline="central" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <tspan fill={FG} fontWeight={600}>{row.actual}</tspan>/{row.target}
                      </text>
                    );
                  }} />
                </Bar>
                <Bar dataKey="actual" name="Completed" fill="url(#opsTvaGrad)" radius={[0, 6, 6, 0]} barSize={tvaBar} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Upcoming phases */}
        <ChartCard icon={Layers} title="Upcoming Phases — What's Next" bodyClass="space-y-2 max-h-[260px] sm:max-h-[300px] overflow-y-auto">
          {upcoming.length === 0 ? <Empty text="No upcoming phases." /> : upcoming.map(ph => (
            <div key={ph.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 min-h-[44px]" style={{ background: mix('hsl(var(--foreground))', 3) }}>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{ph.display_name || ph.phase_name}</p>
                <p className="text-xs sm:text-[13px] text-muted-foreground truncate" title={ph.projectName}>{ph.projectName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className="border text-xs" style={ph.status === 'in_progress'
                  ? { background: mix(GOLD, 14), color: GOLD2, borderColor: mix(GOLD, 30) }
                  : { background: mix(MUTED, 12), color: MUTED, borderColor: 'transparent' }}>
                  {ph.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                </Badge>
                {ph.end_date && <span className="hidden sm:inline text-xs text-muted-foreground">{fmtDate(ph.end_date)}</span>}
              </div>
            </div>
          ))}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ icon: Icon, title, sub, bodyClass = '', children }) {
  return (
    <Card className="min-w-0 rounded-2xl border-border bg-card" style={CARD_STYLE}>
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
        {/* Title wraps instead of truncating; on phones the subtitle drops to its own line under the title. */}
        <CardTitle className="text-sm sm:text-base font-semibold flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-snug">
          <span className="grid place-items-center h-7 w-7 shrink-0 rounded-lg border" style={{ background: mix(GOLD, 10), borderColor: mix(GOLD, 20), color: GOLD2 }}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 break-words">{title}</span>
          {sub && <span className="basis-full pl-9 sm:basis-auto sm:pl-0 sm:ml-auto text-xs font-normal text-muted-foreground sm:whitespace-nowrap">{sub}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className={`px-2 pb-3 sm:px-5 sm:pb-5 ${bodyClass}`}>{children}</CardContent>
    </Card>
  );
}

function KpiViz({ viz, id }) {
  if (viz.type === 'bar') {
    return (
      <div className="mt-2">
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: mix(GOLD, 12) }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, viz.pct)}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})` }} />
        </div>
        <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{viz.note}</p>
      </div>
    );
  }
  const hasData = viz.data.some(d => d.v > 0);
  return (
    <div className="mt-1">
      <div className="h-8">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viz.data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={GOLD2} strokeWidth={1.75} fill={`url(#spark-${id})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="h-full flex items-end"><div className="h-px w-full" style={{ background: mix(MUTED, 30) }} /></div>}
      </div>
      <p className="text-[11px] sm:text-xs text-muted-foreground">{viz.note}</p>
    </div>
  );
}

// Single-line category tick (recharts' default <Text> word-wraps long names into a 2-line jumble);
// truncated with an ellipsis, full name on hover and in the tooltip.
function NameTick({ x, y, payload, max = 14, fontSize = 12 }) {
  const full = String(payload?.value ?? '');
  const label = full.length > max ? `${full.slice(0, max).trimEnd()}…` : full;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-6} y={0} dy="0.355em" textAnchor="end" fontSize={fontSize} fill={FG}>
        <title>{full}</title>
        {label}
      </text>
    </g>
  );
}

function Empty({ text = 'No data yet.' }) {
  return <div className="flex flex-col items-center justify-center h-[220px] sm:h-[260px] text-muted-foreground text-sm"><ArrowUpRight className="h-8 w-8 mb-2 opacity-40" />{text}</div>;
}
