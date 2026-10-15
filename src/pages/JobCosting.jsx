import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CATEGORIES = ['labor', 'materials', 'equipment', 'subcontractor', 'permits', 'overhead', 'other'];
const safeNum = (n) => (Number.isFinite(n) ? n : 0);

export default function JobCosting() {
  const [selectedProject, setSelectedProject] = useState('all');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-jobcosting'],
    queryFn: async () => (await base44.entities.Project.filter({}, { sort: '-created_date', limit: 200, fields: ['name', 'client_name', 'budget', 'status', 'progress', 'projected_final_cost', 'cost_to_complete'] }))?.items || [],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-jobcosting'],
    queryFn: async () => (await base44.entities.Expense.filter({}, { sort: '-date', limit: 500, fields: ['project_id', 'amount', 'category', 'status'] }))?.items || [],
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['changeorders-jobcosting'],
    queryFn: async () => (await base44.entities.ChangeOrder.filter({}, { limit: 200, fields: ['project_id', 'cost_impact', 'status'] }))?.items || [],
  });

  // WIP Report: invoices (same SalesInvoice data the Billing page's "Billed" column uses)
  const { data: wipInvoices = [] } = useQuery({
    queryKey: ['invoices-jobcosting-wip'],
    queryFn: async () => (await base44.entities.SalesInvoice.filter({}, { sort: '-invoice_date', limit: 1000, fields: ['invoice_number', 'total_amount', 'status', 'project_id', 'invoice_date'] }))?.items || [],
  });

  const filteredProjects = selectedProject === 'all' ? projects : projects.filter(p => p.id === selectedProject);
  const filteredExpenses = selectedProject === 'all' ? expenses : expenses.filter(e => e.project_id === selectedProject);
  const filteredCOs = selectedProject === 'all' ? changeOrders : changeOrders.filter(co => co.project_id === selectedProject);

  const totalBudget = safeNum(filteredProjects.reduce((s, p) => s + safeNum(p.budget), 0));
  const totalSpent = safeNum(filteredExpenses.reduce((s, e) => s + safeNum(e.amount), 0));
  const totalCOImpact = safeNum(filteredCOs.filter(co => co.status === 'approved' || co.status === 'executed').reduce((s, co) => s + safeNum(co.cost_impact), 0));
  const revisedBudget = totalBudget + totalCOImpact;
  const budgetVariance = revisedBudget - totalSpent;
  const wipValue = totalBudget * 0.6 - totalSpent;

  const categoryData = CATEGORIES.map(cat => {
    const actual = safeNum(filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + safeNum(e.amount), 0));
    const budget = totalBudget * (cat === 'labor' ? 0.35 : cat === 'materials' ? 0.3 : cat === 'subcontractor' ? 0.2 : 0.05);
    return { name: cat, actual: Math.round(actual), budget: Math.round(budget), variance: Math.round(budget - actual) };
  }).filter(c => c.actual > 0 || c.budget > 0);

  const projectCostData = filteredProjects.map(p => {
    const spent = safeNum(expenses.filter(e => e.project_id === p.id).reduce((s, e) => s + safeNum(e.amount), 0));
    return { name: (p.name || '').substring(0, 15), budget: safeNum(p.budget), actual: spent, variance: safeNum(p.budget) - spent };
  });

  // ---- WIP Report calculations ----
  // Billed to Date = sum of non-draft SalesInvoice total_amount per project (same logic as Billing's "Billed").
  const wipBilledByProject = {};
  wipInvoices.forEach(inv => {
    if (!inv.project_id || inv.status === 'draft') return;
    wipBilledByProject[inv.project_id] = safeNum(wipBilledByProject[inv.project_id]) + safeNum(inv.total_amount);
  });
  const wipRows = filteredProjects.map(p => {
    const cost = safeNum(expenses.filter(e => e.project_id === p.id).reduce((s, e) => s + safeNum(e.amount), 0));
    // Contract to Date = contract value (Project.budget) + approved/executed change orders (same rule as Revised Budget above)
    const coImpact = safeNum(changeOrders.filter(co => co.project_id === p.id && (co.status === 'approved' || co.status === 'executed')).reduce((s, co) => s + safeNum(co.cost_impact), 0));
    const contract = safeNum(p.budget) + coImpact;
    // EAC = projected_final_cost, else cost to date + PM cost_to_complete; 0 means not set
    const finalCost = safeNum(p.projected_final_cost);
    const toComplete = safeNum(p.cost_to_complete);
    const eac = finalCost > 0 ? finalCost : (toComplete > 0 ? cost + toComplete : 0);
    const pct = eac > 0 ? Math.min(cost / eac, 1) : 0;
    const earned = pct * contract;
    const billed = safeNum(wipBilledByProject[p.id]);
    return { id: p.id, name: p.name, contract, eac, cost, pct, earned, billed, overUnder: billed - earned };
  });
  const wipTotals = {
    contract: wipRows.reduce((s, r) => s + r.contract, 0),
    eac: wipRows.reduce((s, r) => s + r.eac, 0),
    cost: wipRows.reduce((s, r) => s + r.cost, 0),
    earned: wipRows.reduce((s, r) => s + r.earned, 0),
    billed: wipRows.reduce((s, r) => s + r.billed, 0),
    overUnder: wipRows.reduce((s, r) => s + r.overUnder, 0),
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Job Costing</h1>
          <p className="text-sm text-slate-500 mt-1">Estimate vs. Actuals & Work In Progress</p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Original Budget', value: fmt(totalBudget), icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Revised Budget', value: fmt(revisedBudget), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Actual Cost', value: fmt(totalSpent), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Variance', value: `${budgetVariance >= 0 ? '+' : '-'}${fmt(Math.abs(budgetVariance))}`, icon: budgetVariance >= 0 ? CheckCircle2 : AlertTriangle, color: budgetVariance >= 0 ? 'text-green-600' : 'text-red-600', bg: budgetVariance >= 0 ? 'bg-green-100' : 'bg-red-100' },
        ].map(k => (
          <Card key={k.label}><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg}`}><k.icon className={`h-5 w-5 ${k.color}`} /></div>
              <div><p className="text-lg font-bold text-slate-900">{k.value}</p><p className="text-xs text-slate-500">{k.label}</p></div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="estimate_vs_actual">
        <TabsList>
          <TabsTrigger value="estimate_vs_actual">Estimate vs. Actual</TabsTrigger>
          <TabsTrigger value="by_category">By Category</TabsTrigger>
          <TabsTrigger value="wip">WIP Report</TabsTrigger>
        </TabsList>

        <TabsContent value="estimate_vs_actual" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Project Cost Comparison</CardTitle></CardHeader>
            <CardContent>
              {projectCostData.length === 0 ? <p className="text-center text-slate-400 py-8">No project data yet</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectCostData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#94A3B8" radius={[4,4,0,0]} />
                    <Bar dataKey="actual" name="Actual" fill="#3B82F6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredProjects.map(p => {
              const spent = safeNum(expenses.filter(e => e.project_id === p.id).reduce((s, e) => s + safeNum(e.amount), 0));
              const pct = p.budget ? Math.min((spent / p.budget) * 100, 100) : 0;
              const over = spent > (p.budget || 0);
              return (
                <Card key={p.id}><CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div><p className="font-semibold text-slate-900">{p.name}</p><p className="text-sm text-slate-500">{p.client_name}</p></div>
                    <Badge className={over ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>{over ? 'Over Budget' : 'On Track'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Budget: ${(safeNum(p.budget)).toLocaleString()}</span>
                    <span className={over ? 'text-red-600 font-medium' : 'text-slate-600'}>Spent: ${spent.toLocaleString()} ({pct.toFixed(0)}%)</span>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="by_category" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Cost by Category</CardTitle></CardHeader>
            <CardContent>
              {categoryData.length === 0 ? <p className="text-center text-slate-400 py-8">No category data</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="budget" name="Budgeted" fill="#94A3B8" radius={[0,4,4,0]} />
                    <Bar dataKey="actual" name="Actual" fill="#3B82F6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wip" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Work In Progress (WIP) Report</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-semibold text-slate-600">Project</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">Contract to Date</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">EAC</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">Cost to Date</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">% Complete</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">Earned</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">Billed to Date</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">Over/(Under)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wipRows.map(r => {
                      const ou = Math.round(r.overUnder * 100) / 100;
                      return (
                        <tr key={r.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 font-medium">{r.name}</td>
                          <td className="py-3 text-right">{wipMoney(r.contract)}</td>
                          <td className="py-3 text-right">{r.eac > 0 ? wipMoney(r.eac) : <span className="text-slate-400 italic">Set budget</span>}</td>
                          <td className="py-3 text-right">{wipMoney(r.cost)}</td>
                          <td className="py-3 text-right">{(r.pct * 100).toFixed(1)}%</td>
                          <td className="py-3 text-right">{wipMoney(r.earned)}</td>
                          <td className="py-3 text-right">{wipMoney(r.billed)}</td>
                          <td className={`py-3 text-right font-medium ${ou > 0 ? 'text-amber-600' : ou < 0 ? 'text-slate-700' : 'text-slate-500'}`}>
                            {wipOverUnder(ou)}{ou > 0 ? <span className="ml-1 text-xs">Over</span> : ou < 0 ? <span className="ml-1 text-xs">Under</span> : null}
                          </td>
                        </tr>
                      );
                    })}
                    {wipRows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-slate-400">No projects found</td></tr>}
                  </tbody>
                  {wipRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 font-bold text-slate-900">
                        <td className="py-3">Total</td>
                        <td className="py-3 text-right">{wipMoney(wipTotals.contract)}</td>
                        <td className="py-3 text-right">{wipMoney(wipTotals.eac)}</td>
                        <td className="py-3 text-right">{wipMoney(wipTotals.cost)}</td>
                        <td className="py-3 text-right"></td>
                        <td className="py-3 text-right">{wipMoney(wipTotals.earned)}</td>
                        <td className="py-3 text-right">{wipMoney(wipTotals.billed)}</td>
                        <td className={`py-3 text-right ${wipTotals.overUnder > 0.005 ? 'text-amber-600' : ''}`}>{wipOverUnder(Math.round(wipTotals.overUnder * 100) / 100)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function fmt(n) {
  const v = safeNum(n);
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function wipMoney(n) {
  return `$${safeNum(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Over/(Under): positive = Over (billed more than earned), negative shown in parentheses = Under
function wipOverUnder(n) {
  const v = safeNum(n);
  return v < 0 ? `(${wipMoney(Math.abs(v))})` : wipMoney(v);
}