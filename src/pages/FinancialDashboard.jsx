import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, FileText, Banknote, MapPin, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const safeNum = (n) => (Number.isFinite(n) ? n : 0);
// B14-11 A5: PurchaseOrder has no `amount` field; its total lives in `total` (written by PurchaseOrders.jsx POForm).
// An absent/non-numeric total is null (MISSING), never 0.
const poTotalOrNull = (po) => {
  const v = po?.total;
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function FinancialDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [projPage, expPage] = await Promise.all([
        base44.entities.Project.filter({}, { sort: '-created_date', limit: 200, fields: ['name', 'client_name', 'budget', 'committed_costs', 'spent', 'projected_final_cost', 'status'] }),
        base44.entities.Expense.filter({}, { sort: '-date', limit: 200, fields: ['project_id', 'amount', 'category', 'status', 'date', 'vendor'] }),
      ]);
      setProjects(projPage?.items || []);
    } catch (e) { console.error('FinancialDashboard load', e); }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading financial dashboard…</div>;

  const selected = selectedProjectId !== 'all' ? projects.find(p => p.id === selectedProjectId) : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Financial Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Project-level financial overview</p>
        </div>
        <Link to={createPageUrl('Projects')}><Button variant="outline">View All Projects</Button></Link>
      </div>

      <div className="max-w-xs">
        <label className="text-sm font-medium text-slate-600">Project</label>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger><SelectValue placeholder="All projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-slate-400">No projects yet. Financials appear once projects and expenses are added.</CardContent></Card>
      ) : (
        <ProjectFinancials projectId={selected?.id} project={selected} />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to={createPageUrl('Billing')}><Button variant="outline" className="w-full">Billing</Button></Link>
        <Link to={createPageUrl('JobCosting')}><Button variant="outline" className="w-full">Job Costing</Button></Link>
        <Link to={createPageUrl('Budget')}><Button variant="outline" className="w-full">Budget</Button></Link>
        <Link to={createPageUrl('Reports')}><Button variant="outline" className="w-full">Reports</Button></Link>
      </div>
    </div>
  );
}

export function ProjectFinancials({ projectId, project }) {
  const [data, setData] = useState({ expenses: [], changeOrders: [], pos: [], subs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const q = { project_id: projectId };
        const [exp, co, po, sub] = await Promise.all([
          base44.entities.Expense.filter(q, { limit: 500, fields: ['amount', 'category', 'status', 'date'] }),
          base44.entities.ChangeOrder.filter(q, { limit: 200, fields: ['cost_impact', 'status', 'title'] }),
          base44.entities.PurchaseOrder.filter(q, { limit: 200, fields: ['total', 'amount', 'status'] }).catch(() => ({ items: [] })),
          base44.entities.Subcontract.filter(q, { limit: 200, fields: ['amount', 'value', 'status'] }).catch(() => ({ items: [] })),
        ]);
        setData({
          expenses: exp?.items || [],
          changeOrders: co?.items || [],
          pos: (po?.items) || [],
          subs: (sub?.items) || [],
        });
      } catch (e) { console.error('ProjectFinancials', e); }
      setLoading(false);
    })();
  }, [projectId]);

  const originalBudget = safeNum(project?.budget);
  const approvedCO = data.changeOrders
    .filter(c => c.status === 'approved' || c.status === 'executed')
    .reduce((s, c) => s + safeNum(c.cost_impact), 0);
  const pendingCO = data.changeOrders
    .filter(c => c.status === 'pending_review' || c.status === 'client_review' || c.status === 'draft')
    .reduce((s, c) => s + safeNum(c.cost_impact), 0);
  const revisedBudget = originalBudget + approvedCO;
  const poTotals = data.pos.map(poTotalOrNull);
  const poMissingCount = poTotals.filter((v) => v === null).length;
  const committedPOs = poTotals.reduce((s, v) => s + (v === null ? 0 : v), 0);
  const committedSubs = data.subs.reduce((s, r) => s + safeNum(r.total || r.amount || r.value), 0);
  const committed = committedPOs + committedSubs;
  const actual = data.expenses.filter(e => e.status === 'paid' || e.status === 'approved').reduce((s, e) => s + safeNum(e.amount), 0);
  const costToComplete = safeNum(project?.projected_final_cost) - actual;
  const eac = actual + committed + costToComplete;
  const fade = revisedBudget - eac;
  const overRun = fade < 0;

  const rows = [
    { label: 'Original Budget (locked estimate)', value: originalBudget, bold: true },
    { label: 'Approved Change Orders', value: approvedCO },
    { label: 'Revised Budget', value: revisedBudget, bold: true },
    { label: poMissingCount > 0 ? `Committed (POs + Subcontracts) · ${poMissingCount} PO total MISSING` : 'Committed (POs + Subcontracts)', value: committed },
    { label: 'Actual to Date', value: actual },
    { label: 'Cost to Complete (PM entry)', value: costToComplete },
    { label: 'Estimate at Completion', value: eac, bold: true },
  ];

  if (loading) return <Card><CardContent className="py-8 text-slate-400">Loading financials…</CardContent></Card>;
  if (!projectId) return <Card><CardContent className="py-8 text-slate-400">Select a project to view financials.</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Revised Budget" value={fmt(revisedBudget)} icon={DollarSign} tone="slate" />
        <KPI label="Actual + Committed" value={fmt(actual + committed)} icon={TrendingUp} tone="blue" />
        <KPI label="Est. at Completion" value={fmt(eac)} icon={BarChart3} tone="amber" />
        <KPI label="Fade / Variance" value={`${fade < 0 ? '-' : '+'}${fmt(Math.abs(fade))}`} icon={fade < 0 ? TrendingDown : TrendingUp} tone={fade < 0 ? 'red' : 'green'} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Budget Breakdown</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {rows.map(r => (
                <tr key={r.label} className={r.bold ? 'border-t-2 border-slate-200 font-semibold' : 'border-b border-slate-100'}>
                  <td className="py-2.5 text-slate-600">{r.label}</td>
                  <td className="py-2.5 text-right text-slate-900">{fmt(r.value)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200">
                <td className="py-2.5 font-semibold text-slate-700">Fade / Variance</td>
                <td className={`py-2.5 text-right font-bold ${overRun ? 'text-red-600' : 'text-green-600'}`}>
                  {overRun ? 'OVER RUN' : 'ON TRACK'} · {fade < 0 ? '-' : '+'}{fmt(Math.abs(fade))}
                </td>
              </tr>
            </tbody>
          </table>
          {poMissingCount > 0 && (
            <p className="text-xs text-amber-600 mt-3">⚠ {poMissingCount} PO{poMissingCount === 1 ? '' : 's'} on this project have no total: MISSING (excluded from Committed, not counted as $0).</p>
          )}
          {pendingCO > 0 && (
            <p className="text-xs text-amber-600 mt-3">⚠ {fmt(pendingCO)} in pending change orders shown as risk only.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, icon: Icon, tone }) {
  const tones = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-blue-100 text-blue-600', amber: 'bg-amber-100 text-amber-600', red: 'bg-red-100 text-red-600', green: 'bg-green-100 text-green-600' };
  return (
    <Card><CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${tones[tone] || tones.slate}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
      </div>
    </CardContent></Card>
  );
}

function fmt(n) {
  const v = safeNum(n);
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}