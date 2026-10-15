import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, Calculator, Edit, Download, Mail, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyStandards, computeFloorCheck } from '@/lib/companyStandards';

export default function EstimateEditor({ bidId, organizationId, bidTitle }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['bidEstimates', bidId],
    queryFn: () => base44.entities.BidEstimate.filter({ bid_opportunity_id: bidId }),
    enabled: !!bidId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const created = await base44.entities.BidEstimate.create({
        ...data,
        bid_opportunity_id: bidId,
        organization_id: organizationId
      });
      // Sync the estimate total back to the bid's Estimated Value
      if (Number.isFinite(data.total_bid_amount)) {
        await base44.entities.BidOpportunity.update(bidId, { estimated_value: data.total_bid_amount });
        // And keep the linked project's contract in sync
        const bids = await base44.entities.BidOpportunity.filter({ id: bidId }, { fields: ['linked_project_id'] });
        const pid = bids?.[0]?.linked_project_id;
        if (pid) await base44.entities.Project.update(pid, { budget: data.total_bid_amount });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      queryClient.invalidateQueries({ queryKey: ['dash-bids-list'] });
      queryClient.invalidateQueries({ queryKey: ['org-projects'] });
      toast.success('Estimate created');
      setIsEditing(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.BidEstimate.update(id, data);
      // Sync the estimate total back to the bid's Estimated Value
      if (Number.isFinite(data.total_bid_amount)) {
        await base44.entities.BidOpportunity.update(bidId, { estimated_value: data.total_bid_amount });
        const bids = await base44.entities.BidOpportunity.filter({ id: bidId }, { fields: ['linked_project_id'] });
        const pid = bids?.[0]?.linked_project_id;
        if (pid) await base44.entities.Project.update(pid, { budget: data.total_bid_amount });
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      queryClient.invalidateQueries({ queryKey: ['dash-bids-list'] });
      queryClient.invalidateQueries({ queryKey: ['org-projects'] });
      toast.success('Estimate saved');
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BidEstimate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
      toast.success('Estimate deleted');
    }
  });

  if (isLoading) {
    return <div className="text-center py-8 text-slate-500">Loading...</div>;
  }

  const activeEstimate = estimates[0];

  if (!activeEstimate && !isEditing) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No estimate created yet</p>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Estimate
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <EstimateForm
      estimate={activeEstimate}
      bidTitle={bidTitle}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => setIsEditing(false)}
      onSave={(data) => {
        if (data.id) {
          updateMutation.mutate({ id: data.id, data });
        } else {
          createMutation.mutate(data);
        }
      }}
      onDelete={() => {
        if (confirm('Delete this estimate?')) {
          deleteMutation.mutate(activeEstimate.id);
          setIsEditing(false);
        }
      }}
      isSaving={createMutation.isPending || updateMutation.isPending}
    />
  );
}

function EstimateForm({ estimate, bidTitle, isEditing, onEdit, onCancel, onSave, onDelete, isSaving }) {
  const { standards } = useCompanyStandards();

  const [formData, setFormData] = useState(estimate || {
    line_items: [],
    labor_hours: 0,
    labor_rate: 65,
    equipment_cost: 0,
    subcontractor_cost: 0,
    crews: 1,
    weeks: 1,
    supervision_hr_per_week_per_crew: standards.supervision_min_hr_per_week_per_crew,
    contingency_percent: standards.contingency_target_pct,
    overhead_percent: 15,
    profit_margin_percent: 20,
    notes: ''
  });

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...(formData.line_items || []),
        { cost_code: '', name: '', description: '', quantity: 1, unit: 'ea', unit_cost: 0, total_cost: 0, category: 'material', pricing_type: 'cost' }
      ]
    });
  };

  const updateLineItem = (index, field, value) => {
    const items = [...(formData.line_items || [])];
    items[index] = { ...items[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_cost') {
      const qty = parseFloat(items[index].quantity) || 0;
      const cost = parseFloat(items[index].unit_cost) || 0;
      items[index].total_cost = qty * cost;
    }
    
    setFormData({ ...formData, line_items: items });
  };

  const removeLineItem = (index) => {
    const items = [...(formData.line_items || [])];
    items.splice(index, 1);
    setFormData({ ...formData, line_items: items });
  };

  const hasDollarLines = (formData.line_items || []).some((i) => i.pricing_type === 'dollar');
  const effectiveOverheadPct = hasDollarLines ? 0 : (parseFloat(formData.overhead_percent) || 0);
  const effectiveProfitPct = hasDollarLines ? 0 : (parseFloat(formData.profit_margin_percent) || 0);

  const calculateTotals = () => {
    const laborCost = (parseFloat(formData.labor_hours) || 0) * (parseFloat(formData.labor_rate) || 0);
    const materialCost = (formData.line_items || [])
      .reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
    
    const subtotal = laborCost + materialCost + (parseFloat(formData.equipment_cost) || 0) + (parseFloat(formData.subcontractor_cost) || 0);
    const contingencyAmount = subtotal * ((parseFloat(formData.contingency_percent) || 0) / 100);
    const overhead = subtotal * (effectiveOverheadPct / 100);
    const profit = subtotal * (effectiveProfitPct / 100);
    const total = subtotal + overhead + profit + contingencyAmount;

    return {
      labor_cost: laborCost,
      material_cost: materialCost,
      subtotal,
      contingency_amount: contingencyAmount,
      overhead_percent: effectiveOverheadPct,
      profit_margin_percent: effectiveProfitPct,
      total_bid_amount: total
    };
  };

  const handleSave = () => {
    const totals = calculateTotals();
    onSave({ 
      ...formData, 
      ...totals,
      version: (formData.version || 0) + (formData.id ? 1 : 0)
    });
  };

  const totals = calculateTotals();
  const floor = computeFloorCheck(
    { ...formData, subtotal: totals.subtotal },
    standards
  );

  const totalCost = totals.subtotal + totals.contingency_amount;
  const sellPrice = totals.total_bid_amount;
  const marginPct = sellPrice > 0 ? ((sellPrice - totalCost) / sellPrice) * 100 : 0;

  const downloadPDF = () => {
    const doc = new jsPDF();
    const title = bidTitle || 'Estimate';
    doc.setFontSize(18);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    let y = 26;
    doc.text(`Labor: ${formData.labor_hours || 0} hrs @ $${(formData.labor_rate || 0).toLocaleString()}/hr = $${totals.labor_cost.toLocaleString()}`, 14, y); y += 7;
    doc.text(`Materials & line items:`, 14, y); y += 6;
    (formData.line_items || []).forEach((item, i) => {
      const label = [item.cost_code, item.name, item.description].filter(Boolean).join(' — ');
      doc.text(`  ${i + 1}. ${(label || '').slice(0, 60)} — ${item.quantity} ${item.unit} @ $${(item.unit_cost || 0).toLocaleString()} = $${(item.total_cost || 0).toLocaleString()}${item.pricing_type === 'dollar' ? ' (dollar)' : ''}`, 14, y); y += 6;
    });
    y += 4;
    doc.text(`Equipment: $${(formData.equipment_cost || 0).toLocaleString()} | Subcontractor: $${(formData.subcontractor_cost || 0).toLocaleString()}`, 14, y); y += 7;
    doc.text(`Subtotal: $${totals.subtotal.toLocaleString()} | Overhead: ${effectiveOverheadPct}% | Profit: ${effectiveProfitPct}%`, 14, y); y += 7;
    doc.text(`Margin on sell: ${marginPct.toFixed(1)}% (target 25-30%, floor 20%)`, 14, y); y += 7;
    doc.setFontSize(12);
    doc.text(`Total Bid Amount: $${totals.total_bid_amount.toLocaleString()}`, 14, y);
    if ((formData.notes || '').trim()) {
      y += 10;
      doc.setFontSize(10);
      doc.text('Notes: ' + (formData.notes || '').slice(0, 200), 14, y);
    }
    doc.save(`estimate-${(bidTitle || 'export').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('Estimate downloaded as PDF');
  };

  const sendToClient = () => {
    const subject = encodeURIComponent(`Estimate: ${bidTitle || 'Construction Estimate'}`);
    const body = encodeURIComponent(
      `Please find our estimate summary below.\n\n` +
      `Total Bid Amount: $${totals.total_bid_amount.toLocaleString()}\n` +
      `Subtotal: $${totals.subtotal.toLocaleString()}\n\n` +
      `Download the full PDF from the app (Estimate tab → Download PDF) and attach it to this email if needed.\n\n` +
      `Best regards`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success('Opened email client. Attach the PDF after downloading if needed.');
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle>Estimate Details</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" onClick={sendToClient}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {estimate?.id && (
                  <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Labor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Labor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Hours</label>
              <Input
                type="number"
                value={formData.labor_hours || 0}
                onChange={(e) => setFormData({ ...formData, labor_hours: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Rate ($/hr)</label>
              <Input
                type="number"
                value={formData.labor_rate || 0}
                onChange={(e) => setFormData({ ...formData, labor_rate: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Total</label>
              <Input value={`$${totals.labor_cost.toLocaleString()}`} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Materials & Line Items</CardTitle>
          {isEditing && (
            <Button size="sm" variant="outline" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(formData.line_items || []).length === 0 ? (
            <p className="text-center py-6 text-slate-500 text-sm">
              {isEditing ? 'Click "Add Item" to start adding materials' : 'No items added yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {formData.line_items.map((item, idx) => (
                <div key={idx} className="border rounded p-2 space-y-2 bg-white">
                  <div className="grid grid-cols-12 gap-2">
                    <Input
                      placeholder="Cost Code"
                      value={item.cost_code || ''}
                      onChange={(e) => updateLineItem(idx, 'cost_code', e.target.value)}
                      disabled={!isEditing}
                      className="col-span-3"
                    />
                    <Input
                      placeholder="Name"
                      value={item.name || ''}
                      onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                      disabled={!isEditing}
                      className="col-span-4"
                    />
                    <Input
                      placeholder="Description"
                      value={item.description || ''}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      disabled={!isEditing}
                      className="col-span-5"
                    />
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                      disabled={!isEditing}
                      className="col-span-2"
                    />
                    <Input
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                      disabled={!isEditing}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      placeholder="Unit $"
                      value={item.unit_cost}
                      onChange={(e) => updateLineItem(idx, 'unit_cost', e.target.value)}
                      disabled={!isEditing}
                      className="col-span-2"
                    />
                    <Input
                      value={`$${(item.total_cost || 0).toLocaleString()}`}
                      disabled
                      className="col-span-2"
                    />
                    <select
                      value={item.pricing_type || 'cost'}
                      onChange={(e) => updateLineItem(idx, 'pricing_type', e.target.value)}
                      disabled={!isEditing}
                      className="col-span-3 h-9 rounded-md border border-slate-200 bg-white text-sm px-2 disabled:bg-slate-50"
                      title="Cost = raw cost (overhead/profit applied on top). Dollar = sell price with margin already included (overhead/profit forced to 0)."
                    >
                      <option value="cost">Cost line</option>
                      <option value="dollar">Dollar (sell) line</option>
                    </select>
                    {isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeLineItem(idx)}
                        className="col-span-1 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Other Costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Equipment Cost ($)</label>
              <Input
                type="number"
                value={formData.equipment_cost || 0}
                onChange={(e) => setFormData({ ...formData, equipment_cost: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Subcontractor Cost</label>
              <Input
                type="number"
                value={formData.subcontractor_cost || 0}
                onChange={(e) => setFormData({ ...formData, subcontractor_cost: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contingency & Supervision (company floors) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contingency & Supervision</CardTitle>
          <p className="text-xs text-slate-500">
            Floors: contingency min {standards.contingency_min_pct}% · target {standards.contingency_target_pct}% · supervision {standards.supervision_min_hr_per_week_per_crew} hr/wk/crew
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Contingency %</label>
              <Input
                type="number"
                value={formData.contingency_percent ?? 0}
                onChange={(e) => setFormData({ ...formData, contingency_percent: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Active Crews</label>
              <Input
                type="number"
                value={formData.crews ?? 1}
                onChange={(e) => setFormData({ ...formData, crews: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Weeks</label>
              <Input
                type="number"
                value={formData.weeks ?? 1}
                onChange={(e) => setFormData({ ...formData, weeks: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Supervision hr/wk/crew</label>
              <Input
                type="number"
                value={formData.supervision_hr_per_week_per_crew ?? standards.supervision_min_hr_per_week_per_crew}
                onChange={(e) => setFormData({ ...formData, supervision_hr_per_week_per_crew: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Contingency $</label>
              <Input value={`$${(totals.contingency_amount || 0).toLocaleString()}`} disabled />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Supervision hrs</label>
              <Input value={floor.supervisionHours.toFixed(1)} disabled />
            </div>
          </div>

          {floor.belowFloor && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Below company floor</p>
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  {floor.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Margins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Margins & Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Overhead %{hasDollarLines ? ' (0 — dollar lines)' : ''}</label>
              <Input
                type="number"
                value={effectiveOverheadPct}
                onChange={(e) => setFormData({ ...formData, overhead_percent: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing || hasDollarLines}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Profit Margin %{hasDollarLines ? ' (0 — dollar lines)' : ''}</label>
              <Input
                type="number"
                value={effectiveProfitPct}
                onChange={(e) => setFormData({ ...formData, profit_margin_percent: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing || hasDollarLines}
              />
            </div>
          </div>

          {hasDollarLines && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Overhead and Profit set to 0 — dollar (sell) lines already include margin, so adding overhead/profit would double-count.</p>
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal (direct cost):</span>
              <span className="font-semibold">${totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Contingency:</span>
              <span className="font-semibold">${(totals.contingency_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Overhead ({effectiveOverheadPct}%):</span>
              <span className="font-semibold">${(totals.subtotal * effectiveOverheadPct / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Profit ({effectiveProfitPct}%):</span>
              <span className="font-semibold">${(totals.subtotal * effectiveProfitPct / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Bid Amount (sell):</span>
              <span className="text-green-600">${totals.total_bid_amount.toLocaleString()}</span>
            </div>

            {/* Margin on sell price vs target/floor */}
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Margin on sell price</span>
                <span className={`text-sm font-bold ${
                  marginPct < 20 ? 'text-red-600' : marginPct < 25 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {marginPct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full ${marginPct < 20 ? 'bg-red-500' : marginPct < 25 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(Math.max(marginPct, 0), 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Target <span className="font-semibold">25–30%</span> · Floor <span className="font-semibold">20%</span>
                {marginPct < 20 ? ' · Below floor' : marginPct < 25 ? ' · Above floor, below target' : marginPct <= 30 ? ' · On target' : ' · Above target'}
              </p>
              {hasDollarLines && (
                <p className="text-xs text-blue-700 mt-1">Margin embedded in dollar lines is not reflected in this figure.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={!isEditing}
            placeholder="Additional notes..."
          />
        </CardContent>
      </Card>
    </div>
  );
}