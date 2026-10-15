import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { fmtMoney, roundCents } from '@/lib/money';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SUGGESTED_CODES = ['FA-100', 'FA-200', 'FA-300', 'FA-400', 'FA-500', 'FA-600', 'FA-700', 'FA-800', 'FA-900'];

export default function CostCodeBudgetBoard({ projectId }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState({});

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['costCodeBudgetLines', projectId],
    queryFn: async () => (await base44.entities.CostCodeBudgetLine.filter({ project_id: projectId }, { sort: 'cost_code' }))?.items || [],
    enabled: !!projectId,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['ccbb-expenses', projectId],
    queryFn: () => base44.entities.Expense.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: pos = [] } = useQuery({
    queryKey: ['ccbb-pos', projectId],
    queryFn: () => base44.entities.PurchaseOrder.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const actualByCode = useMemo(() => {
    const m = {};
    (expenses || []).forEach((e) => {
      if (!e.cost_code || e.status === 'rejected') return;
      m[e.cost_code] = roundCents((m[e.cost_code] || 0) + (Number(e.amount) || 0));
    });
    return m;
  }, [expenses]);

  const committedByCode = useMemo(() => {
    const m = {};
    (pos || []).forEach((po) => {
      if (!po || po.status === 'cancelled' || po.status === 'received') return;
      (po.line_items || []).forEach((it) => {
        if (!it.cost_code) return;
        m[it.cost_code] = roundCents((m[it.cost_code] || 0) + (Number(it.total) || 0));
      });
    });
    return m;
  }, [pos]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CostCodeBudgetLine.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['costCodeBudgetLines', projectId] }),
    onError: () => toast.error('Unable to add budget line'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CostCodeBudgetLine.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCodeBudgetLines', projectId] });
      toast.success('Budget line saved');
    },
    onError: () => toast.error('Unable to save budget line'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CostCodeBudgetLine.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['costCodeBudgetLines', projectId] }),
    onError: () => toast.error('Unable to delete budget line'),
  });

  const draftFor = (l) => drafts[l.id] || l;
  const setField = (id, field, value) =>
    setDrafts((d) => {
      const base = d[id] || lines.find((x) => x.id === id) || {};
      return { ...d, [id]: { ...base, [field]: value } };
    });

  const handleAdd = () => {
    createMutation.mutate({
      project_id: projectId,
      cost_code: '',
      description: '',
      labor_hours: 0,
      labor_amount: 0,
      material_amount: 0,
      equipment_amount: 0,
    });
  };

  const handleSave = (l) => {
    const d = drafts[l.id] || l;
    updateMutation.mutate({
      id: l.id,
      data: {
        cost_code: (d.cost_code || '').trim(),
        description: d.description || '',
        labor_hours: roundCents(Number(d.labor_hours) || 0),
        labor_amount: roundCents(Number(d.labor_amount) || 0),
        material_amount: roundCents(Number(d.material_amount) || 0),
        equipment_amount: roundCents(Number(d.equipment_amount) || 0),
      },
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[l.id];
      return next;
    });
  };

  const handleDelete = (l) => {
    if (confirm(`Delete cost code ${l.cost_code || ''}?`)) deleteMutation.mutate(l.id);
  };

  const lineTotal = (l) => {
    const d = drafts[l.id] || l;
    return roundCents((Number(d.labor_amount) || 0) + (Number(d.material_amount) || 0) + (Number(d.equipment_amount) || 0));
  };

  const totals = useMemo(() => {
    const t = { hours: 0, labor: 0, material: 0, equipment: 0, budget: 0, committed: 0, actual: 0 };
    (lines || []).forEach((l) => {
      t.hours += Number(l.labor_hours) || 0;
      t.labor += Number(l.labor_amount) || 0;
      t.material += Number(l.material_amount) || 0;
      t.equipment += Number(l.equipment_amount) || 0;
      t.budget += lineTotal(l);
      t.committed += committedByCode[l.cost_code] || 0;
      t.actual += actualByCode[l.cost_code] || 0;
    });
    return {
      hours: roundCents(t.hours),
      labor: roundCents(t.labor),
      material: roundCents(t.material),
      equipment: roundCents(t.equipment),
      budget: roundCents(t.budget),
      committed: roundCents(t.committed),
      actual: roundCents(t.actual),
    };
  }, [lines, drafts, committedByCode, actualByCode]);

  const remaining = (l) => roundCents(lineTotal(l) - (committedByCode[l.cost_code] || 0) - (actualByCode[l.cost_code] || 0));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Budget by Cost Code</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Tag expenses and PO line items to a cost code to roll up actual and committed.
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
          Add Line
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-2 font-semibold whitespace-nowrap">Cost Code</th>
                <th className="text-left p-2 font-semibold min-w-[160px]">Description</th>
                <th className="text-right p-2 font-semibold w-20">Labor Hrs</th>
                <th className="text-right p-2 font-semibold w-24">Labor $</th>
                <th className="text-right p-2 font-semibold w-24">Material $</th>
                <th className="text-right p-2 font-semibold w-24">Equipment $</th>
                <th className="text-right p-2 font-semibold w-24">Budget Total</th>
                <th className="text-right p-2 font-semibold w-24">Committed</th>
                <th className="text-right p-2 font-semibold w-24">Actual</th>
                <th className="text-right p-2 font-semibold w-24">Remaining</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="p-6 text-center text-slate-400"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></td></tr>
              ) : (lines || []).length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-slate-500">
                    No budget lines yet. Click <span className="font-medium">Add Line</span> to enter cost codes (e.g. FA-100 to FA-900).
                  </td>
                </tr>
              ) : (
                (lines || []).map((l) => {
                  const d = draftFor(l);
                  const rem = remaining(l);
                  const over = rem < 0;
                  const dirty = !!drafts[l.id];
                  return (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="p-1.5">
                        <Input
                          list="ccb-codes"
                          value={d.cost_code || ''}
                          onChange={(e) => setField(l.id, 'cost_code', e.target.value)}
                          placeholder="FA-100"
                          className="h-8 text-xs w-32 min-w-[8rem]"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          value={d.description || ''}
                          onChange={(e) => setField(l.id, 'description', e.target.value)}
                          placeholder="Scope description"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input type="number" step="0.25" value={d.labor_hours ?? 0} onChange={(e) => setField(l.id, 'labor_hours', e.target.value)} className="h-8 text-xs text-right tabular-nums" />
                      </td>
                      <td className="p-1.5">
                        <Input type="number" step="0.01" value={d.labor_amount ?? 0} onChange={(e) => setField(l.id, 'labor_amount', e.target.value)} className="h-8 text-xs text-right tabular-nums" />
                      </td>
                      <td className="p-1.5">
                        <Input type="number" step="0.01" value={d.material_amount ?? 0} onChange={(e) => setField(l.id, 'material_amount', e.target.value)} className="h-8 text-xs text-right tabular-nums" />
                      </td>
                      <td className="p-1.5">
                        <Input type="number" step="0.01" value={d.equipment_amount ?? 0} onChange={(e) => setField(l.id, 'equipment_amount', e.target.value)} className="h-8 text-xs text-right tabular-nums" />
                      </td>
                      <td className="p-1.5 text-right font-semibold tabular-nums text-navy-900">{fmtMoney(lineTotal(l))}</td>
                      <td className="p-1.5 text-right tabular-nums text-slate-700">{fmtMoney(committedByCode[l.cost_code] || 0)}</td>
                      <td className="p-1.5 text-right tabular-nums text-slate-700">{fmtMoney(actualByCode[l.cost_code] || 0)}</td>
                      <td className={cn("p-1.5 text-right font-semibold tabular-nums", over ? "text-red-600" : "text-emerald-700")}>{fmtMoney(rem)}</td>
                      <td className="p-1.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSave(l)} disabled={updateMutation.isPending} title="Save line">
                            {updateMutation.isPending && dirty ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className={cn("h-3.5 w-3.5", dirty ? "text-navy-700" : "text-slate-300")} />}
                          </Button>
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => handleDelete(l)} title="Delete line">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {(lines || []).length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <td className="p-2 text-slate-700" colSpan={2}>Total Budget</td>
                  <td className="p-2 text-right tabular-nums">{totals.hours}</td>
                  <td className="p-2 text-right tabular-nums">{fmtMoney(totals.labor)}</td>
                  <td className="p-2 text-right tabular-nums">{fmtMoney(totals.material)}</td>
                  <td className="p-2 text-right tabular-nums">{fmtMoney(totals.equipment)}</td>
                  <td className="p-2 text-right tabular-nums text-navy-900">{fmtMoney(totals.budget)}</td>
                  <td className="p-2 text-right tabular-nums text-slate-700">{fmtMoney(totals.committed)}</td>
                  <td className="p-2 text-right tabular-nums text-slate-700">{fmtMoney(totals.actual)}</td>
                  <td className={cn("p-2 text-right tabular-nums", (totals.budget - totals.committed - totals.actual) < 0 ? "text-red-600" : "text-emerald-700")}>{fmtMoney(roundCents(totals.budget - totals.committed - totals.actual))}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <datalist id="ccb-codes">
          {SUGGESTED_CODES.map((c) => <option key={c} value={c} />)}
        </datalist>
        <div className="px-4 pb-4 pt-2 text-xs text-slate-500 flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="text-[10px]">Actual</Badge>
          <span>= expenses tagged to the code (excludes rejected)</span>
          <Badge variant="outline" className="text-[10px] ml-2">Committed</Badge>
          <span>= open PO line items tagged to the code (excludes received/cancelled)</span>
        </div>
      </CardContent>
    </Card>
  );
}