import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useProjectBilling } from '@/hooks/useProjectData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HardHat,
  FileText,
  Wallet,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  CalendarClock,
  Briefcase,
  Receipt,
  ChevronRight,
  Plus,
  Flag,
  Inbox,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isWithinInterval, addDays, startOfDay } from 'date-fns';
import OwnerActionItemsPanel from '@/components/dashboard/OwnerActionItemsPanel';

const NAVY = '#0F1B2D';
const GOLD = '#E8B547';

const PROJECT_TYPE_LABELS = {
  residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial',
  infrastructure: 'Infrastructure', renovation: 'Renovation',
  fire_alarm_new_construction: 'Fire Alarm — New', fire_alarm_tenant_improvement: 'Fire Alarm — TI',
  fire_alarm_retrofit: 'Fire Alarm — Retrofit', fire_alarm_service_inspection: 'Fire Alarm — Service',
  fire_alarm_special_hazard: 'Fire Alarm — Special Hazard',
  low_voltage_structured_cabling: 'Structured Cabling', low_voltage_access_control: 'Access Control',
  low_voltage_cctv: 'CCTV', low_voltage_av: 'AV Systems', low_voltage_nurse_call: 'Nurse Call',
  isp_fiber_backbone: 'Fiber Backbone', isp_fiber_installation: 'Fiber Installation',
  isp_dark_fiber: 'Dark Fiber', isp_wireless: 'Wireless', isp_underground: 'Underground',
};
const PHASE_LABELS = {
  preconstruction: 'Preconstruction', foundation: 'Foundation', superstructure: 'Superstructure',
  enclosure: 'Enclosure', mep_rough: 'MEP Rough-in', interior_finishes: 'Interior Finishes',
  commissioning: 'Commissioning', closeout: 'Closeout',
};
const PO_STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-600', sent: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-indigo-100 text-indigo-700', partially_received: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};
const PRIORITY_STYLE = {
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600',
};
const ACTIVE_STATUSES = ['awarded', 'in_progress'];
const PIPELINE_STATUSES = ['review', 'intake', 'off_pricing', 'user_analyzing', 'estimated', 'submitted'];
const OPEN_PO_STATUSES = ['draft', 'sent', 'acknowledged', 'partially_received'];

const fmtMoney = (n) => {
  const v = Number.isFinite(n) ? Number(n) : 0;
  const cents = Math.round(v * 100) / 100;
  return '$' + cents.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtCompact = (n) => {
  if (!n) return '$0';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + Math.round(n).toLocaleString('en-US');
};
const safe = (n) => (Number.isFinite(n) ? n : 0);

function KpiCard({ title, value, sub, icon: Icon, accent, loading, progress }) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: NAVY }}>
            <Icon className="h-5 w-5" style={{ color: accent === 'gold' ? GOLD : '#fff' }} />
          </div>
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1.5" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        )}
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        {progress !== undefined && (
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress)}%`, backgroundColor: NAVY }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, icon: Icon, action, children, empty, loading }) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(15,27,45,0.08)' }}>
            <Icon className="h-4 w-4" style={{ color: NAVY }} />
          </div>
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : empty ? (
          <div className="p-8 text-center">
            <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">{empty}</p>
          </div>
        ) : children}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const { projects, totals: billingTotals, isLoading: loadingProjects } = useProjectBilling(orgId);

  const { data: openPOs = [], isLoading: loadingPOs } = useQuery({
    queryKey: ['dash-open-pos', orgId],
    queryFn: async () => {
      const res = await base44.entities.PurchaseOrder.filter({ project_id: { $ne: '' } }, { sort: '-created_date', limit: 50 });
      const items = res?.items || [];
      return items.filter((po) => OPEN_PO_STATUSES.includes(po.status));
    },
    enabled: !!orgId,
  });

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const { data: upcomingTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['dash-upcoming-tasks', orgId],
    queryFn: async () => {
      const res = await base44.entities.Task.filter(
        { due_date: { $gte: format(today, 'yyyy-MM-dd'), $lte: format(weekEnd, 'yyyy-MM-dd') } },
        { sort: 'due_date', limit: 50, fields: ['name', 'project_id', 'due_date', 'priority', 'status'] }
      );
      const items = res?.items || [];
      return items.filter((t) => t.status !== 'completed');
    },
    enabled: !!orgId,
  });

  const { data: bidList = [], isLoading: loadingBids } = useQuery({
    queryKey: ['dash-bids-list', orgId],
    queryFn: async () => {
      const query = orgId
        ? { $or: [{ organization_id: orgId }, { organization_id: { $in: [null, ''] } }, { organization_id: { $exists: false } }] }
        : {};
      const page = await base44.entities.BidOpportunity.filter(query, { sort: '-created_date', limit: 500, fields: ['status', 'estimated_value'] });
      return (page?.items || page || []);
    },
    enabled: !!orgId,
  });

  const { data: dualStages = [], isLoading: loadingDual } = useQuery({
    queryKey: ['dash-dualtrack', orgId],
    queryFn: async () => {
      const res = await base44.entities.DualTrackStage.filter({ organization_id: orgId }, { limit: 500, fields: ['project_id', 'budget', 'actual', 'committed', 'cost_to_complete', 'field_track_status', 'money_track_status'] });
      return res?.items || [];
    },
    enabled: !!orgId,
  });

  // ---- KPI computations (real data only) ----
  const activeJobs = projects.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const sumBudgetActive = activeJobs.reduce((s, p) => s + (p.budget || 0), 0);
  const sumSpentActive = activeJobs.reduce((s, p) => s + (p.spent || 0), 0);
  // Bids in Pipeline — counts the actual bids list (same data as the Bids page)
  const pipelineBids = bidList.filter((b) => PIPELINE_STATUSES.includes(b.status));
  const pipelineCount = pipelineBids.length;
  const pipelineValue = pipelineBids.reduce((s, b) => s + (b.estimated_value || 0), 0);
  // Billing totals (contract / billed / outstanding / retention) come from the same
  // useProjectBilling hook as the Billing page, so the four figures match exactly.
  const costPct = sumBudgetActive ? (sumSpentActive / sumBudgetActive) * 100 : 0;

  // DualTrack red flags — a project is flagged if any of its stages has a fade or a blocked track
  const redFlagProjectIds = React.useMemo(() => {
    const set = new Set();
    dualStages.forEach((s) => {
      const remaining = safe(s.budget) - safe(s.actual) - safe(s.committed);
      const fade = safe(s.cost_to_complete) - remaining;
      if (fade > 0 || s.field_track_status === 'blocked' || s.money_track_status === 'blocked') set.add(s.project_id);
    });
    return set;
  }, [dualStages]);

  const projectMap = React.useMemo(() => {
    const m = {};
    projects.forEach((p) => { m[p.id] = p; });
    return m;
  }, [projects]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fadeFlag = (p) => {
    if (redFlagProjectIds.has(p.id)) return { label: 'Red Flag', tone: 'red' };
    const forecast = p.projected_final_cost || p.spent || 0;
    if (!p.budget) return { label: '—', tone: 'muted' };
    return forecast > p.budget
      ? { label: 'Fade', tone: 'red' }
      : { label: 'On Track', tone: 'green' };
  };
  const flagStyle = { red: 'bg-red-100 text-red-700', green: 'bg-emerald-100 text-emerald-700', muted: 'bg-slate-100 text-slate-500' };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{getGreeting()}, {user?.full_name || 'there'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')} — Operations overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(createPageUrl('AddBid'))} className="gap-1.5" style={{ backgroundColor: NAVY, color: '#fff' }}>
            <Plus className="h-4 w-4" /> New Bid
          </Button>
          <Button variant="outline" onClick={() => navigate(createPageUrl('Projects'))} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard title="All Jobs" value={projects.length} sub={`${activeJobs.length} active`} icon={HardHat} loading={loadingProjects} />
        <KpiCard title="Total Contract Value" value={fmtMoney(billingTotals?.contract)} sub="matches Billing" icon={FileText} loading={loadingProjects} />
        <KpiCard title="Billed to Date" value={fmtMoney(billingTotals?.billed)} sub="invoices issued" icon={TrendingUp} loading={loadingProjects} />
        <KpiCard title="Outstanding" value={fmtMoney(billingTotals?.outstanding)} sub="billed − paid" icon={AlertTriangle} loading={loadingProjects} />
        <KpiCard title="Retention Held" value={fmtMoney(billingTotals?.retention)} sub="from pay apps" icon={Receipt} loading={loadingProjects} />
        <KpiCard title="Cost to Date vs Budget" value={fmtCompact(sumSpentActive)} sub={`of ${fmtCompact(sumBudgetActive)} budget`} icon={Wallet} loading={loadingProjects} progress={costPct} />
        <KpiCard title="DualTrack Red Flags" value={redFlagProjectIds.size} sub="projects off track" icon={Flag} accent="gold" loading={loadingDual} />
        <KpiCard title="Open POs" value={openPOs.length} sub="awaiting fulfillment" icon={ShoppingCart} loading={loadingPOs} />
        <KpiCard title="Upcoming Milestones" value={upcomingTasks.length} sub="next 7 days" icon={CalendarClock} loading={loadingTasks} />
        <KpiCard title="Bids in Pipeline" value={pipelineCount} sub={`${fmtCompact(pipelineValue)} value`} icon={Briefcase} loading={loadingBids} />
      </div>

      {/* Owner Action Items */}
      <OwnerActionItemsPanel />

      {/* All Jobs table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(15,27,45,0.08)' }}>
              <HardHat className="h-4 w-4" style={{ color: NAVY }} />
            </div>
            <CardTitle className="text-base font-semibold text-slate-900">All Jobs</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('Projects'))} className="text-slate-500 hover:text-slate-900">
            View all <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingProjects ? (
            <div className="p-4 space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : projects.length === 0 ? (
            <div className="p-10 text-center">
              <HardHat className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No jobs yet</p>
              <p className="text-xs text-slate-400 mt-1">Create a project or convert a won bid to see your jobs here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                    <th className="px-4 py-3 font-semibold">Job</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Milestone</th>
                    <th className="px-4 py-3 font-semibold w-40">% Complete</th>
                    <th className="px-4 py-3 font-semibold text-right">Budget</th>
                    <th className="px-4 py-3 font-semibold text-right">Cost to Date</th>
                    <th className="px-4 py-3 font-semibold text-center">Forecast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => {
                    const flag = fadeFlag(p);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${p.id}`)}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 truncate max-w-[220px]">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[220px]">{p.client_name || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{PROJECT_TYPE_LABELS[p.project_type] || p.project_type || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{PHASE_LABELS[p.current_phase] || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${p.progress || 0}%`, backgroundColor: NAVY }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-600 w-8 text-right">{p.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">{fmtMoney(p.budget)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">{fmtMoney(p.spent)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${flagStyle[flag.tone]}`}>{flag.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Schedule + Open POs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Upcoming Schedule"
          icon={CalendarClock}
          loading={loadingTasks}
          empty={upcomingTasks.length === 0 ? 'No milestones due in the next 7 days.' : null}
          action={<Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('Calendar'))} className="text-slate-500 hover:text-slate-900">Calendar <ChevronRight className="h-4 w-4" /></Button>}
        >
          <ul className="divide-y divide-slate-100">
            {upcomingTasks.map((t) => {
              const proj = projectMap[t.project_id];
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(232,181,71,0.15)' }}>
                    <Flag className="h-4 w-4" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                    <p className="text-xs text-slate-500 truncate">{proj?.name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {t.due_date && <p className="text-xs font-semibold text-slate-700">{format(new Date(t.due_date), 'EEE, MMM d')}</p>}
                    {t.priority && <span className={`mt-0.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Open Purchase Orders"
          icon={ShoppingCart}
          loading={loadingPOs}
          empty={openPOs.length === 0 ? 'No open purchase orders right now.' : null}
          action={<Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('PurchaseOrders'))} className="text-slate-500 hover:text-slate-900">All POs <ChevronRight className="h-4 w-4" /></Button>}
        >
          <ul className="divide-y divide-slate-100">
            {openPOs.map((po) => {
              const proj = projectMap[po.project_id];
              return (
                <li key={po.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(15,27,45,0.08)' }}>
                    <ShoppingCart className="h-4 w-4" style={{ color: NAVY }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{po.po_number || 'PO'} — {po.vendor}</p>
                    <p className="text-xs text-slate-500 truncate">{proj?.name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{fmtMoney(po.total)}</p>
                    <span className={`mt-0.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${PO_STATUS_STYLE[po.status] || 'bg-slate-100 text-slate-600'}`}>{po.status}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}