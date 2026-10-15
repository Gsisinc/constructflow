import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useOrgProjects } from '@/hooks/useProjectData';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, Building2, ClipboardList, Route, Layers, Target, ArrowUpRight } from 'lucide-react';
import { fmtDate } from '@/lib/dates';

const NAVY = '#0B1F3A';
const GOLD = '#C9A227';
const safe = (n) => (Number.isFinite(n) ? n : 0);

function monthKey(d) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; }
function monthLabel(k) { const [y, m] = k.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' }); }

export default function OpsDashboard() {
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

  const completed = (projects || []).filter(p => p.status === 'completed').length;
  const active = (projects || []).filter(p => ['awarded', 'in_progress', 'planning', 'bidding'].includes(p.status)).length;
  const completionsThisMonth = (dailyLogs || []).filter(l => monthKey(l.log_date) === curMonth).length;
  const totalMileage = (vehicleLogs || []).reduce((s, m) => s + safe(m.total_miles), 0);

  // Progress per project
  const progressData = useMemo(() => (projects || []).slice(0, 12).map(p => ({
    name: (p.name || '').length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    progress: safe(p.progress),
  })), [projects]);

  // Completions per month (last 6 months)
  const completionsData = useMemo(() => {
    const map = {};
    const last6 = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); last6.push(monthKey(d.toISOString())); }
    last6.forEach(k => { map[k] = 0; });
    (dailyLogs || []).forEach(l => { const k = monthKey(l.log_date); if (k in map) map[k]++; });
    return last6.map(k => ({ month: monthLabel(k), logs: map[k] }));
  }, [dailyLogs]);

  // Targets vs actual (phases: target = total, actual = completed) per project
  const targetsData = useMemo(() => (projects || []).slice(0, 12).map(p => {
    const phs = (phases || []).filter(ph => ph.project_id === p.id);
    return {
      name: (p.name || '').length > 12 ? p.name.slice(0, 12) + '…' : p.name,
      target: phs.length,
      actual: phs.filter(ph => ph.status === 'completed').length,
    };
  }), [projects, phases]);

  // Upcoming phases (what's next): not_started / in_progress, sorted by project + order
  const upcoming = useMemo(() => {
    return (phases || [])
      .filter(ph => ph.status === 'not_started' || ph.status === 'in_progress')
      .map(ph => ({ ...ph, projectName: (projects || []).find(p => p.id === ph.project_id)?.name || '—' }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, 8);
  }, [phases, projects]);

  const kpis = [
    { label: 'Projects Completed', value: String(completed), icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Active Projects', value: String(active), icon: Building2, tone: 'bg-slate-100 text-slate-700' },
    { label: 'Completions This Month', value: String(completionsThisMonth), icon: ClipboardList, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Total Mileage', value: totalMileage.toLocaleString() + ' mi', icon: Route, tone: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div className="space-y-6 p-2 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ops Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Project delivery, field completions, phase pipeline and targets vs actual.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${k.tone}`}><Icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{k.value}</p>
                    <p className="text-xs text-slate-500">{k.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress per project */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Progress per Project</CardTitle></CardHeader>
          <CardContent>
            {progressData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={progressData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="progress" name="Progress %" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Completions this month (last 6 months) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Completions (Daily Logs) by Month</CardTitle></CardHeader>
          <CardContent>
            {completionsData.every(d => d.logs === 0) ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={completionsData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="logs" name="Daily Logs" fill={NAVY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Targets vs Actual */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" style={{ color: GOLD }} /> Targets vs Actual (Phases)</CardTitle></CardHeader>
          <CardContent>
            {targetsData.every(d => d.target === 0) ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={targetsData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Completed" fill={NAVY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Upcoming phases */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" style={{ color: GOLD }} /> Upcoming Phases — What's Next</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[260px] overflow-y-auto">
            {upcoming.length === 0 ? <Empty text="No upcoming phases." /> : upcoming.map(ph => (
              <div key={ph.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{ph.display_name || ph.phase_name}</p>
                  <p className="text-xs text-slate-500">{ph.projectName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={ph.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                    {ph.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                  </Badge>
                  {ph.end_date && <span className="text-xs text-slate-400">{fmtDate(ph.end_date)}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty({ text = 'No data yet.' }) {
  return <div className="flex flex-col items-center justify-center h-[260px] text-slate-400 text-sm"><ArrowUpRight className="h-8 w-8 mb-2 opacity-40" />{text}</div>;
}