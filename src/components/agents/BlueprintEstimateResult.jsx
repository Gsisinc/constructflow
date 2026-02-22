import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Plus, Pencil, Check, X, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

function exportToCSV(data) {
  const { drawing_overview, line_items, summary, assumptions } = data;
  const rows = [
    ['BLUEPRINT ESTIMATE'],
    ['Drawing Type', drawing_overview?.type || ''],
    ['Trade', drawing_overview?.trade || ''],
    ['Scale', drawing_overview?.scale || ''],
    [''],
    ['QUANTITY TAKEOFF'],
    ['Description', 'Category', 'Trade', 'Qty', 'Unit', 'Unit Cost', 'Total Cost', 'Notes'],
    ...(line_items || []).map(i => [
      i.description, i.category, i.trade, i.quantity, i.unit,
      i.unit_cost, i.total_cost, i.notes || ''
    ]),
    [''],
    ['SUMMARY'],
    ['Materials Subtotal', '', '', '', '', '', summary?.subtotal_materials || 0],
    ['Labor Subtotal', '', '', '', '', '', summary?.subtotal_labor || 0],
    ['Equipment Subtotal', '', '', '', '', '', summary?.subtotal_equipment || 0],
    ['Subcontractor Subtotal', '', '', '', '', '', summary?.subtotal_subcontractor || 0],
    [`Overhead (${summary?.overhead_percent || 15}%)`, '', '', '', '', '', summary?.overhead_amount || 0],
    [`Profit (${summary?.profit_percent || 20}%)`, '', '', '', '', '', summary?.profit_amount || 0],
    ['TOTAL ESTIMATE', '', '', '', '', '', summary?.total_estimate || 0],
    [''],
    ['ASSUMPTIONS'],
    ...(assumptions || []).map(a => [a]),
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blueprint-estimate-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToDoc(data) {
  const { drawing_overview, line_items, summary, assumptions, notes } = data;
  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const tableRows = (line_items || []).map(i =>
    `<tr><td>${i.description}</td><td>${i.category}</td><td>${i.trade}</td><td>${i.quantity} ${i.unit}</td><td>${fmt(i.unit_cost)}</td><td>${fmt(i.total_cost)}</td></tr>`
  ).join('');

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
  h1 { color: #1e40af; } h2 { color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #1e40af; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .summary { background: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 20px; }
  .total { font-size: 1.3em; font-weight: bold; color: #1e40af; margin-top: 8px; }
  .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: 20px; font-size: 0.85em; }
</style>
</head><body>
<h1>📐 Blueprint Estimate</h1>
<p><strong>Drawing Type:</strong> ${drawing_overview?.type || 'N/A'} &nbsp;|&nbsp;
<strong>Trade:</strong> <span class="badge">${drawing_overview?.trade || 'N/A'}</span> &nbsp;|&nbsp;
<strong>Scale:</strong> ${drawing_overview?.scale || 'N/A'}</p>

<h2>Quantity Takeoff</h2>
<table>
  <tr><th>Description</th><th>Category</th><th>Trade</th><th>Quantity</th><th>Unit Cost</th><th>Total Cost</th></tr>
  ${tableRows}
</table>

<div class="summary">
  <h2>Cost Summary</h2>
  <p>Materials: ${fmt(summary?.subtotal_materials)}</p>
  <p>Labor: ${fmt(summary?.subtotal_labor)}</p>
  <p>Equipment: ${fmt(summary?.subtotal_equipment)}</p>
  <p>Subcontractor: ${fmt(summary?.subtotal_subcontractor)}</p>
  <p>Overhead (${summary?.overhead_percent || 15}%): ${fmt(summary?.overhead_amount)}</p>
  <p>Profit (${summary?.profit_percent || 20}%): ${fmt(summary?.profit_amount)}</p>
  <div class="total">TOTAL ESTIMATE: ${fmt(summary?.total_estimate)}</div>
</div>

${assumptions?.length ? `<h2>Assumptions</h2><ul>${assumptions.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
${notes ? `<h2>Notes</h2><p>${notes}</p>` : ''}
</body></html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blueprint-estimate-${Date.now()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BlueprintEstimateResult({ result, imageUrl, onClose }) {
  const [items, setItems] = useState(result.line_items || []);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const summary = result.summary || {};
  const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const tradeColors = {
    architectural: 'bg-blue-100 text-blue-700',
    structural: 'bg-orange-100 text-orange-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    plumbing: 'bg-cyan-100 text-cyan-700',
    hvac: 'bg-green-100 text-green-700',
    fire: 'bg-red-100 text-red-700',
    low_voltage: 'bg-violet-100 text-violet-700',
    civil: 'bg-slate-100 text-slate-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditRow({ ...items[idx] });
  };

  const saveEdit = () => {
    const updated = [...items];
    const qty = parseFloat(editRow.quantity) || 0;
    const uc = parseFloat(editRow.unit_cost) || 0;
    updated[editingIdx] = { ...editRow, quantity: qty, unit_cost: uc, total_cost: qty * uc };
    setItems(updated);
    setEditingIdx(null);
  };

  const handleAddToEstimates = async () => {
    setSaving(true);
    try {
      // Compute live totals from edited items
      const matTotal = items.filter(i => i.category === 'material').reduce((s, i) => s + (i.total_cost || 0), 0);
      const labTotal = items.filter(i => i.category === 'labor').reduce((s, i) => s + (i.total_cost || 0), 0);
      const eqTotal = items.filter(i => i.category === 'equipment').reduce((s, i) => s + (i.total_cost || 0), 0);
      const subTotal = items.filter(i => i.category === 'subcontractor').reduce((s, i) => s + (i.total_cost || 0), 0);
      const base = matTotal + labTotal + eqTotal + subTotal;
      const ohPct = summary.overhead_percent || 15;
      const prPct = summary.profit_percent || 20;
      const ohAmt = base * (ohPct / 100);
      const prAmt = (base + ohAmt) * (prPct / 100);
      const total = base + ohAmt + prAmt;

      // Create a BidOpportunity placeholder and a BidEstimate
      const bid = await base44.entities.BidOpportunity.create({
        title: `Blueprint Estimate — ${result.drawing_overview?.type || 'Drawing'} (${result.drawing_overview?.trade || ''})`,
        project_type: result.drawing_overview?.trade === 'low_voltage' ? 'low_voltage' :
          result.drawing_overview?.trade === 'electrical' ? 'electrical' :
          result.drawing_overview?.trade === 'plumbing' ? 'plumbing' :
          result.drawing_overview?.trade === 'hvac' ? 'hvac' : 'other',
        status: 'estimating',
        description: `Auto-generated from blueprint analysis. ${result.notes || ''}`,
        estimated_value: total,
      });

      await base44.entities.BidEstimate.create({
        bid_opportunity_id: bid.id,
        line_items: items,
        material_cost: matTotal,
        labor_cost: labTotal,
        equipment_cost: eqTotal,
        subcontractor_cost: subTotal,
        overhead_percent: ohPct,
        profit_margin_percent: prPct,
        subtotal: base,
        total_bid_amount: total,
        notes: `Blueprint analysis: ${result.drawing_overview?.type || ''} | ${result.assumptions?.join('; ') || ''}`,
        version: 1,
      });

      toast.success('Estimate added! View it on the Estimates page.');
    } catch (err) {
      toast.error('Failed to save estimate: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-white shadow-xl mt-2">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-sm font-bold">📐 Blueprint Analysis</CardTitle>
          <Badge className={tradeColors[result.drawing_overview?.trade] || tradeColors.other}>
            {result.drawing_overview?.trade || 'unknown'}
          </Badge>
          <Badge variant="outline" className="text-xs">{result.drawing_overview?.type || ''}</Badge>
          <Badge variant="outline" className="text-xs capitalize">Confidence: {result.confidence || 'medium'}</Badge>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4 pt-0">
          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-2 font-semibold text-slate-600">Description</th>
                  <th className="text-left p-2 font-semibold text-slate-600">Cat.</th>
                  <th className="text-right p-2 font-semibold text-slate-600">Qty</th>
                  <th className="text-left p-2 font-semibold text-slate-600">Unit</th>
                  <th className="text-right p-2 font-semibold text-slate-600">Unit $</th>
                  <th className="text-right p-2 font-semibold text-slate-600">Total $</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  editingIdx === idx ? (
                    <tr key={idx} className="bg-blue-50">
                      <td className="p-1"><Input value={editRow.description} onChange={e => setEditRow(r => ({ ...r, description: e.target.value }))} className="h-7 text-xs" /></td>
                      <td className="p-1"><Input value={editRow.category} onChange={e => setEditRow(r => ({ ...r, category: e.target.value }))} className="h-7 text-xs w-20" /></td>
                      <td className="p-1"><Input type="number" value={editRow.quantity} onChange={e => setEditRow(r => ({ ...r, quantity: e.target.value }))} className="h-7 text-xs w-16 text-right" /></td>
                      <td className="p-1"><Input value={editRow.unit} onChange={e => setEditRow(r => ({ ...r, unit: e.target.value }))} className="h-7 text-xs w-14" /></td>
                      <td className="p-1"><Input type="number" value={editRow.unit_cost} onChange={e => setEditRow(r => ({ ...r, unit_cost: e.target.value }))} className="h-7 text-xs w-20 text-right" /></td>
                      <td className="p-2 text-right font-medium">${((parseFloat(editRow.quantity) || 0) * (parseFloat(editRow.unit_cost) || 0)).toLocaleString()}</td>
                      <td className="p-1 flex gap-1">
                        <button onClick={saveEdit} className="text-green-600 hover:text-green-800"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingIdx(null)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-2">{item.description}</td>
                      <td className="p-2"><span className="capitalize text-slate-500">{item.category}</span></td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2">{item.unit}</td>
                      <td className="p-2 text-right">{fmt(item.unit_cost)}</td>
                      <td className="p-2 text-right font-medium">{fmt(item.total_cost)}</td>
                      <td className="p-2">
                        <button onClick={() => startEdit(idx)} className="text-slate-400 hover:text-blue-600"><Pencil className="h-3 w-3" /></button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Materials</span><span>{fmt(summary.subtotal_materials)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Labor</span><span>{fmt(summary.subtotal_labor)}</span></div>
            {summary.subtotal_equipment > 0 && <div className="flex justify-between"><span className="text-slate-500">Equipment</span><span>{fmt(summary.subtotal_equipment)}</span></div>}
            {summary.subtotal_subcontractor > 0 && <div className="flex justify-between"><span className="text-slate-500">Subcontractor</span><span>{fmt(summary.subtotal_subcontractor)}</span></div>}
            <div className="flex justify-between"><span className="text-slate-500">Overhead ({summary.overhead_percent || 15}%)</span><span>{fmt(summary.overhead_amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Profit ({summary.profit_percent || 20}%)</span><span>{fmt(summary.profit_amount)}</span></div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-blue-700">
              <span>TOTAL ESTIMATE</span><span>{fmt(summary.total_estimate)}</span>
            </div>
          </div>

          {/* Assumptions */}
          {result.assumptions?.length > 0 && (
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-600 mb-1">Assumptions:</p>
              <ul className="list-disc pl-4 space-y-0.5">{result.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={handleAddToEstimates} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Add to Estimates'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportToCSV({ ...result, line_items: items })} className="gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel/CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportToDoc({ ...result, line_items: items })} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Export Word/Doc
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}