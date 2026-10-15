import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useOrgProjects, useOrgInvoices } from '@/hooks/useProjectData';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const safe = (n) => (Number.isFinite(n) ? Number(n) : 0);
const money = (n) => '$' + safe(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
const signedMoney = (n) => {
  const v = safe(n);
  return v < 0 ? '($' + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ')' : money(v);
};

export default function WIPReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects = [], isLoading: lp } = useOrgProjects(user?.organization_id);
  const { data: invoices = [], isLoading: li } = useOrgInvoices(user?.organization_id);

  const { data: sovs = [] } = useQuery({
    queryKey: ['org-sovs', user?.organization_id],
    queryFn: async () => {
      const res = await base44.entities.ScheduleOfValues.filter({ organization_id: user?.organization_id }, { limit: 500 });
      return res?.items || res || [];
    },
    enabled: !!user?.organization_id,
  });

  const sovByProject = React.useMemo(() => {
    const m = {};
    sovs.forEach((s) => { m[s.project_id] = s.line_items || []; });
    return m;
  }, [sovs]);

  const billedByProject = React.useMemo(() => {
    const m = {};
    invoices.forEach((inv) => {
      if (!inv.project_id || inv.status === 'draft') return;
      m[inv.project_id] = safe(m[inv.project_id]) + safe(inv.total_amount);
    });
    return m;
  }, [invoices]);

  const rows = projects.map((p) => {
    const contract = safe(p.budget);
    const costToDate = safe(p.spent);
    const sovLines = sovByProject[p.id] || [];
    const sovScheduled = sovLines.reduce((s, l) => s + safe(l.scheduled_value), 0);
    const pctComplete = sovLines.length
      ? (sovLines.reduce((s, l) => s + safe(l.scheduled_value) * (safe(l.percent_complete) / 100), 0) / Math.max(1, sovScheduled)) * 100
      : safe(p.progress);
    const earned = contract * (pctComplete / 100);
    const billed = safe(billedByProject[p.id]);
    const overUnder = billed - earned;
    const eac = costToDate + safe(p.committed_costs) + safe(p.cost_to_complete);
    return { id: p.id, name: p.name, client: p.client_name, contract, costToDate, pctComplete, earned, billed, overUnder, eac };
  });

  const totals = {
    contract: rows.reduce((s, r) => s + r.contract, 0),
    costToDate: rows.reduce((s, r) => s + r.costToDate, 0),
    earned: rows.reduce((s, r) => s + r.earned, 0),
    billed: rows.reduce((s, r) => s + r.billed, 0),
    overUnder: rows.reduce((s, r) => s + r.overUnder, 0),
  };

  const isLoading = lp || li;
  const openProj = (id) => navigate(createPageUrl('ProjectDetail') + '?id=' + id);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">WIP Report</h1>
        <p className="text-sm text-slate-500 mt-1">Work-in-progress: contract, cost, earned revenue, billed, over/under billing</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPI label="Total Contract" value={money(totals.contract)} />
        <KPI label="Cost to Date" value={money(totals.costToDate)} />
        <KPI label="Earned Revenue" value={money(totals.earned)} />
        <KPI label="Billed" value={money(totals.billed)} />
        <KPI label="Over/(Under) Billing" value={signedMoney(totals.overUnder)} tone={totals.overUnder < 0 ? 'red' : totals.overUnder > 0 ? 'amber' : 'green'} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Per Project ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No projects.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2 font-semibold">Project</th>
                    <th className="pb-2 font-semibold text-right">Contract</th>
                    <th className="pb-2 font-semibold text-right">Cost to Date</th>
                    <th className="pb-2 font-semibold text-right">% Complete</th>
                    <th className="pb-2 font-semibold text-right">Earned</th>
                    <th className="pb-2 font-semibold text-right">Billed</th>
                    <th className="pb-2 font-semibold text-right">Over/(Under)</th>
                    <th className="pb-2 font-semibold text-right">EAC</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => openProj(r.id)}>
                      <td className="py-3 font-medium text-slate-900">
                        {r.name}
                        <div className="text-xs text-slate-500 font-normal">{r.client}</div>
                      </td>
                      <td className="py-3 text-right">{money(r.contract)}</td>
                      <td className="py-3 text-right">{money(r.costToDate)}</td>
                      <td className="py-3 text-right">{r.pctComplete.toFixed(0)}%</td>
                      <td className="py-3 text-right">{money(r.earned)}</td>
                      <td className="py-3 text-right">{money(r.billed)}</td>
                      <td className={'py-3 text-right font-medium ' + (r.overUnder < 0 ? 'text-red-600' : r.overUnder > 0 ? 'text-amber-600' : 'text-slate-600')}>{signedMoney(r.overUnder)}</td>
                      <td className="py-3 text-right text-slate-600">{money(r.eac)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className={'text-lg font-bold ' + color}>{value}</p>
      </CardContent>
    </Card>
  );
}