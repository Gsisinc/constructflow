import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, FileText, Search, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const safeNum = (n) => (Number.isFinite(n) ? n : 0);
const fmt = (n) => `$${safeNum(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Billing() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const { data: projects = [], isLoading: loadingP } = useQuery({
    queryKey: ['billing-projects'],
    queryFn: async () => (await base44.entities.Project.filter({ status: { $in: ['awarded', 'in_progress', 'completed'] } }, { sort: '-created_date', limit: 200, fields: ['name', 'client_name', 'budget', 'spent', 'status'] }))?.items || [],
  });

  const { data: expenses = [], isLoading: loadingE } = useQuery({
    queryKey: ['billing-expenses'],
    queryFn: async () => (await base44.entities.Expense.filter({ category: 'other' }, { limit: 1 }))?.items || [],
  });

  // Milestone billing is tracked as invoices; here we summarize per project.
  // Retention is 10% by default, shown as held until project closeout.
  const RETENTION_PCT = 10;

  const rows = useMemo(() => projects.map(p => {
    const contract = safeNum(p.budget);
    const billed = safeNum(p.spent);
    const retention = Math.round(contract * (RETENTION_PCT / 100));
    const remaining = contract - billed;
    const fullyBilled = billed >= contract;
    return {
      id: p.id,
      name: p.name,
      client: p.client_name || '',
      contract,
      billed,
      retention,
      remaining,
      status: fullyBilled ? 'complete' : billed > 0 ? 'partial' : 'unbilled',
    };
  }), [projects]);

  const filtered = rows.filter(r => {
    const ms = r.name?.toLowerCase().includes(search.toLowerCase()) || r.client?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || r.status === statusFilter;
    return ms && mst;
  });

  const totals = {
    contract: filtered.reduce((s, r) => s + r.contract, 0),
    billed: filtered.reduce((s, r) => s + r.billed, 0),
    outstanding: filtered.reduce((s, r) => s + r.remaining, 0),
    retention: filtered.reduce((s, r) => s + r.retention, 0),
  };

  const isLoading = loadingP || loadingE;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500 mt-1">Milestone invoicing & retention across all projects</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total Contract Value" value={fmt(totals.contract)} icon={DollarSign} tone="slate" />
        <KPI label="Billed to Date" value={fmt(totals.billed)} icon={TrendingUp} tone="green" />
        <KPI label="Outstanding" value={fmt(totals.outstanding)} icon={AlertTriangle} tone="amber" />
        <KPI label="Retention Held" value={fmt(totals.retention)} icon={FileText} tone="blue" />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">Project Billing</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search project or client…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unbilled">Unbilled</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No billable projects. Awarded projects appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2 font-semibold">Project</th>
                    <th className="pb-2 font-semibold text-right">Contract</th>
                    <th className="pb-2 font-semibold text-right">Billed</th>
                    <th className="pb-2 font-semibold text-right">Retention (10%)</th>
                    <th className="pb-2 font-semibold text-right">Outstanding</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${r.id}`)}>
                      <td className="py-3 font-medium text-slate-900">{r.name}<div className="text-xs text-slate-500 font-normal">{r.client}</div></td>
                      <td className="py-3 text-right">{fmt(r.contract)}</td>
                      <td className="py-3 text-right">{fmt(r.billed)}</td>
                      <td className="py-3 text-right text-slate-500">{fmt(r.retention)}</td>
                      <td className="py-3 text-right font-medium text-amber-600">{fmt(r.remaining)}</td>
                      <td className="py-3">
                        <Badge className={r.status === 'complete' ? 'bg-green-100 text-green-700' : r.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>
                          {r.status}
                        </Badge>
                      </td>
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

function KPI({ label, value, icon: Icon, tone }) {
  const tones = { slate: 'bg-slate-100 text-slate-600', blue: 'bg-blue-100 text-blue-600', amber: 'bg-amber-100 text-amber-600', green: 'bg-green-100 text-green-600' };
  return (
    <Card><CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${tones[tone] || tones.slate}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
      </div>
    </CardContent></Card>
  );
}