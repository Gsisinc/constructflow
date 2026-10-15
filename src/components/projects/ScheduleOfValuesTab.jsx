import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, FilePlus2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fmtDate } from '@/lib/dates';
import { fmtMoney as money, signedMoney, roundCents } from '@/lib/money';

const safe = (n) => (Number.isFinite(n) ? Number(n) : 0);

const emptyLine = () => ({ description: '', cost_code: '', scheduled_value: 0, percent_complete: 0, billed_to_date: 0 });

export default function ScheduleOfValuesTab({ projectId, project }) {
  const qc = useQueryClient();
  const [retentionPct, setRetentionPct] = useState(10);
  const [costToComplete, setCostToComplete] = useState(safe(project?.cost_to_complete));
  const [committedCosts, setCommittedCosts] = useState(safe(project?.committed_costs));

  const sovQuery = useQuery({
    queryKey: ['sov', projectId],
    queryFn: async () => {
      const res = await base44.entities.ScheduleOfValues.filter({ project_id: projectId }, { limit: 10 });
      return (res?.items || res || [])[0] || null;
    },
    enabled: !!projectId,
  });

  const [lines, setLines] = useState(null);
  const sov = sovQuery.data;

  // Initialise lines from the saved SOV (or a single blank row)
  React.useEffect(() => {
    if (lines !== null) return;
    if (sovQuery.isSuccess) {
      setLines(sov?.line_items?.length ? sov.line_items : [emptyLine()]);
      if (sov?.retention_percent) setRetentionPct(sov.retention_percent);
    }
  }, [sovQuery.isSuccess, sov, lines]);

  const payAppsQuery = useQuery({
    queryKey: ['payApps', projectId],
    queryFn: async () => {
      const res = await base44.entities.PayApplication.filter({ project_id: projectId }, { sort: '-period', limit: 50 });
      return res?.items || res || [];
    },
    enabled: !!projectId,
  });

  const totals = useMemo(() => {
    const scheduled = lines?.reduce((s, l) => s + safe(l.scheduled_value), 0) || 0;
    const earned = lines?.reduce((s, l) => s + roundCents(safe(l.scheduled_value) * (safe(l.percent_complete) / 100)), 0) || 0;
    const billed = lines?.reduce((s, l) => s + safe(l.billed_to_date), 0) || 0;
    return { scheduled, earned, billed, balance: scheduled - billed };
  }, [lines]);

  const contract = safe(project?.budget);
  const sumMatches = Math.abs(totals.scheduled - contract) < 1;

  // Earned value (item 7b)
  const actual = safe(project?.spent);
  const committed = safe(committedCosts);
  const ctc = safe(costToComplete);
  const eac = actual + committed + ctc;
  const remaining = contract - actual - committed;
  const fade = ctc - remaining;
  // WIP over/under billing — same sign convention as the WIP Report
  const wipOverUnder = roundCents(totals.billed - totals.earned);

  const updateLine = (idx, field, value) => {
    setLines((prev) => {
      const next = [...(prev || [])];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const addLine = () => setLines((prev) => [...(prev || []), emptyLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  // Seed 8 milestone rows that sum exactly to the contract value.
  const seedMilestones = () => {
    const n = 8;
    const each = Math.round((contract / n) * 100) / 100;
    const rows = Array.from({ length: n - 1 }, (_, i) => ({
      description: `Milestone ${i + 1}`,
      cost_code: '',
      scheduled_value: each,
      percent_complete: 0,
      billed_to_date: 0,
    }));
    rows.push({
      description: `Milestone ${n}`,
      cost_code: '',
      scheduled_value: Math.round((contract - each * (n - 1)) * 100) / 100,
      percent_complete: 0,
      billed_to_date: 0,
    });
    setLines(rows);
    toast.success('8 milestone lines seeded to the contract value');
  };

  // Pull the contract value from the linked bid's estimated_value.
  const syncFromBid = useMutation({
    mutationFn: async () => {
      if (!project?.linked_bid_id) throw new Error('This project has no linked bid');
      const bids = await base44.entities.BidOpportunity.filter({ id: project.linked_bid_id });
      const bidVal = bids?.[0]?.estimated_value;
      if (!Number.isFinite(bidVal)) throw new Error('Linked bid has no estimated value');
      await base44.entities.Project.update(projectId, { budget: bidVal });
      return bidVal;
    },
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['org-projects'] });
      toast.success(`Contract synced from bid (${money(v)})`);
    },
    onError: (e) => toast.error('Sync failed: ' + (e.message || '')),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { project_id: projectId, organization_id: project?.organization_id, line_items: lines, retention_percent: retentionPct };
      if (sov?.id) return base44.entities.ScheduleOfValues.update(sov.id, payload);
      return base44.entities.ScheduleOfValues.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sov', projectId] });
      toast.success('Schedule of Values saved');
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || '')),
  });

  const saveCostMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', projectId] }); toast.success('Cost inputs saved'); },
  });

  const generatePayApp = async () => {
    const thisPeriod = totals.earned - totals.billed;
    if (thisPeriod <= 0) { toast.error('Nothing new to bill (earned ≤ billed to date)'); return; }
    const retentionAmount = Math.round(thisPeriod * (retentionPct / 100) * 100) / 100;
    const netDue = Math.round((thisPeriod - retentionAmount) * 100) / 100;
    const today = new Date().toISOString().slice(0, 10);
    try {
      // Resolve the authoritative org id — the project prop can be stale/missing it,
      // and a null org_id would exclude the invoice from the org-scoped Billing query.
      let orgId = project?.organization_id;
      if (!orgId) {
        const fresh = (await base44.entities.Project.filter({ id: projectId }))[0];
        orgId = fresh?.organization_id;
      }
      const inv = await base44.entities.SalesInvoice.create({
        organization_id: orgId,
        invoice_number: `PA-${Date.now().toString().slice(-6)}`,
        invoice_date: today,
        due_date: today,
        customer_name: project?.client_name || '',
        customer_email: project?.client_email || '',
        project_id: projectId,
        line_items: [{ product_name: `Pay Application ${fmtDate(today)}`, quantity: 1, unit_price: netDue, tax_rate: 0, tax_amount: 0, total: netDue }],
        subtotal: netDue,
        tax_amount: 0,
        total_amount: netDue,
        status: 'sent',
        payment_terms: 'Net 30',
      });
      await base44.entities.PayApplication.create({
        organization_id: orgId,
        project_id: projectId,
        application_number: `PA-${Date.now().toString().slice(-6)}`,
        period: today,
        total_completed_value: totals.earned,
        retention_percent: retentionPct,
        retention_amount: retentionAmount,
        net_amount_due: netDue,
        sov_snapshot: { lines, totals },
        linked_invoice_id: inv.id,
        status: 'submitted',
      });
      // Update SOV billed_to_date to cumulative earned
      const updatedLines = lines.map((l) => ({ ...l, billed_to_date: Math.round(safe(l.scheduled_value) * (safe(l.percent_complete) / 100) * 100) / 100 }));
      setLines(updatedLines);
      const payload = { project_id: projectId, organization_id: project?.organization_id, line_items: updatedLines, retention_percent: retentionPct };
      if (sov?.id) await base44.entities.ScheduleOfValues.update(sov.id, payload);
      else await base44.entities.ScheduleOfValues.create(payload);
      qc.invalidateQueries({ queryKey: ['sov', projectId] });
      qc.invalidateQueries({ queryKey: ['payApps', projectId] });
      qc.invalidateQueries({ queryKey: ['org-invoices'] });
      qc.invalidateQueries({ queryKey: ['org-payapps'] });
      qc.invalidateQueries({ queryKey: ['org-projects'] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success(`Pay application generated — ${money(netDue)} net due (retention ${money(retentionAmount)})`);
    } catch (e) {
      toast.error('Pay app failed: ' + (e.message || ''));
    }
  };

  if (sovQuery.isLoading || lines === null) {
    return <div className="py-10 text-center text-slate-400">Loading Schedule of Values…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Earned value / EAC */}
      <Card>
        <CardHeader><CardTitle className="text-base">Earned Value & Forecast (EAC)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Contract (Budget)" value={money(contract)} />
            <Metric label="Actual (Cost to Date)" value={money(actual)} />
            <Metric label="Committed" value={money(committed)} />
            <Metric label="Cost to Complete" value={money(ctc)} />
            <Metric label="EAC = Actual + Committed + CTC" value={money(eac)} tone={eac > contract ? 'red' : 'green'} />
            <Metric label="Remaining = Budget − Actual − Committed" value={money(remaining)} />
            <Metric label="Fade = CTC − Remaining" value={money(fade)} tone={fade > 0 ? 'red' : 'green'} />
            <Metric label="WIP Over/(Under) = Billed − Earned" value={signedMoney(wipOverUnder)} tone={wipOverUnder < 0 ? 'red' : wipOverUnder > 0 ? 'amber' : 'green'} />
            <Metric label="% Complete (project)" value={`${safe(project?.progress)}%`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <Label>Committed Costs (editable)</Label>
              <Input type="number" value={committedCosts} onChange={(e) => setCommittedCosts(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Cost to Complete (editable)</Label>
              <Input type="number" value={costToComplete} onChange={(e) => setCostToComplete(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => saveCostMutation.mutate({ committed_costs: committedCosts, cost_to_complete: costToComplete })}>
            <Save className="h-4 w-4 mr-1" /> Save cost inputs
          </Button>
        </CardContent>
      </Card>

      {/* SOV table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Schedule of Values</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Retention %</Label>
              <Input type="number" value={retentionPct} onChange={(e) => setRetentionPct(parseFloat(e.target.value) || 0)} className="w-20 h-8" />
            </div>
            <Button size="sm" onClick={() => saveMutation.mutate()}><Save className="h-4 w-4 mr-1" /> Save SOV</Button>
            <Button size="sm" onClick={generatePayApp} className="bg-emerald-600 hover:bg-emerald-700 text-white"><FilePlus2 className="h-4 w-4 mr-1" /> Generate Pay App</Button>
          </div>
        </CardHeader>
        <CardContent>
          {!sumMatches && (
            <div className="flex items-center gap-2 mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertTriangle className="h-4 w-4" /> Scheduled value total ({money(totals.scheduled)}) does not equal contract value ({money(contract)}). Adjust line items so they sum to the contract.
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button size="sm" variant="outline" onClick={() => syncFromBid.mutate()} disabled={syncFromBid.isPending || !project?.linked_bid_id}>
              <RefreshCw className="h-4 w-4 mr-1" /> Sync contract from bid
            </Button>
            <Button size="sm" variant="outline" onClick={seedMilestones} disabled={contract <= 0}>
              <Plus className="h-4 w-4 mr-1" /> Seed 8 milestone lines
            </Button>
            <span className="text-xs text-slate-500">Contract: {money(contract)} · Retention at full billing: {money(contract * (retentionPct / 100))}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left">
                <tr className="border-b">
                  <th className="py-2 pr-2 font-semibold">Description</th>
                  <th className="py-2 px-2 font-semibold">Cost Code</th>
                  <th className="py-2 px-2 font-semibold text-right">Scheduled Value</th>
                  <th className="py-2 px-2 font-semibold text-right">% Complete</th>
                  <th className="py-2 px-2 font-semibold text-right">Billed to Date</th>
                  <th className="py-2 px-2 font-semibold text-right">Balance</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1.5 pr-2"><Input value={l.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} className="h-8" /></td>
                    <td className="py-1.5 px-2"><Input value={l.cost_code} onChange={(e) => updateLine(idx, 'cost_code', e.target.value)} className="h-8 w-20" /></td>
                    <td className="py-1.5 px-2"><Input type="number" value={l.scheduled_value} onChange={(e) => updateLine(idx, 'scheduled_value', parseFloat(e.target.value) || 0)} className="h-8 w-28 text-right" /></td>
                    <td className="py-1.5 px-2"><Input type="number" value={l.percent_complete} onChange={(e) => updateLine(idx, 'percent_complete', parseFloat(e.target.value) || 0)} className="h-8 w-20 text-right" /></td>
                    <td className="py-1.5 px-2 text-right">{money(l.billed_to_date)}</td>
                    <td className="py-1.5 px-2 text-right">{money(safe(l.scheduled_value) - safe(l.billed_to_date))}</td>
                    <td className="py-1.5"><Button size="icon" variant="ghost" onClick={() => removeLine(idx)}><Trash2 className="h-4 w-4 text-red-500" /></Button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t-2">
                  <td className="py-2" colSpan={2}>Totals</td>
                  <td className="py-2 px-2 text-right">{money(totals.scheduled)}</td>
                  <td className="py-2 px-2 text-right">{money(totals.earned)} earned</td>
                  <td className="py-2 px-2 text-right">{money(totals.billed)}</td>
                  <td className="py-2 px-2 text-right">{money(totals.balance)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Button size="sm" variant="outline" onClick={addLine} className="mt-3"><Plus className="h-4 w-4 mr-1" /> Add line</Button>
        </CardContent>
      </Card>

      {/* Pay applications */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pay Applications</CardTitle></CardHeader>
        <CardContent>
          {(payAppsQuery.data || []).length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No pay applications generated yet. Click "Generate Pay App" above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left">
                <tr className="border-b"><th className="py-2 font-semibold">App #</th><th className="py-2 font-semibold">Period</th><th className="py-2 font-semibold text-right">Earned</th><th className="py-2 font-semibold text-right">Retention</th><th className="py-2 font-semibold text-right">Net Due</th><th className="py-2 font-semibold">Status</th></tr>
              </thead>
              <tbody>
                {(payAppsQuery.data || []).map((pa) => (
                  <tr key={pa.id} className="border-b">
                    <td className="py-2 font-medium">{pa.application_number}</td>
                    <td className="py-2">{fmtDate(pa.period)}</td>
                    <td className="py-2 text-right">{money(pa.total_completed_value)}</td>
                    <td className="py-2 text-right">{money(pa.retention_amount)}</td>
                    <td className="py-2 text-right font-medium">{money(pa.net_amount_due)}</td>
                    <td className="py-2"><Badge className={pa.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{pa.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}