import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function EstimateEditor({ bidId, organizationId }) {
  const queryClient = useQueryClient();

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['bidEstimates', bidId],
    queryFn: () => base44.entities.BidEstimate.filter({ bid_opportunity_id: bidId }),
    enabled: !!bidId
  });

  const [editingEstimate, setEditingEstimate] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BidEstimate.create({
      ...data,
      bid_opportunity_id: bidId,
      organization_id: organizationId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
      toast.success('Estimate created');
      setEditingEstimate(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BidEstimate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
      toast.success('Estimate saved');
      setEditingEstimate(null);
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
    return <div className="text-center py-8 text-slate-500">Loading estimates...</div>;
  }

  const activeEstimate = estimates[0] || editingEstimate;

  if (!activeEstimate && !editingEstimate) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No estimate created yet</p>
          <Button onClick={() => setEditingEstimate(createBlankEstimate())}>
            <Plus className="h-4 w-4 mr-2" />
            Create Estimate
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <EstimateForm
      estimate={editingEstimate || activeEstimate}
      onSave={(data) => {
        if (data.id) {
          updateMutation.mutate({ id: data.id, data });
        } else {
          createMutation.mutate(data);
        }
      }}
      onCancel={() => setEditingEstimate(null)}
      onEdit={() => setEditingEstimate(activeEstimate)}
      onDelete={() => {
        if (confirm('Delete this estimate?')) {
          deleteMutation.mutate(activeEstimate.id);
        }
      }}
      isEditing={!!editingEstimate}
      isSaving={createMutation.isPending || updateMutation.isPending}
    />
  );
}

function createBlankEstimate() {
  return {
    line_items: [{ description: '', quantity: 1, unit: 'ea', unit_cost: 0, total_cost: 0, category: 'material' }],
    labor_hours: 0,
    labor_rate: 65,
    labor_cost: 0,
    material_cost: 0,
    equipment_cost: 0,
    subcontractor_cost: 0,
    overhead_percent: 15,
    profit_margin_percent: 20,
    subtotal: 0,
    total_bid_amount: 0,
    notes: '',
    version: 1
  };
}

function EstimateForm({ estimate, onSave, onCancel, onEdit, onDelete, isEditing, isSaving }) {
  const [formData, setFormData] = useState(estimate);

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...(formData.line_items || []),
        { description: '', quantity: 1, unit: 'ea', unit_cost: 0, total_cost: 0, category: 'material' }
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

  const calculateTotals = () => {
    const laborCost = (parseFloat(formData.labor_hours) || 0) * (parseFloat(formData.labor_rate) || 0);
    const materialCost = (formData.line_items || [])
      .filter(item => item.category === 'material')
      .reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
    
    const subtotal = laborCost + materialCost + (parseFloat(formData.equipment_cost) || 0) + (parseFloat(formData.subcontractor_cost) || 0);
    const overhead = subtotal * ((parseFloat(formData.overhead_percent) || 0) / 100);
    const profit = subtotal * ((parseFloat(formData.profit_margin_percent) || 0) / 100);
    const total = subtotal + overhead + profit;

    return {
      labor_cost: laborCost,
      material_cost: materialCost,
      subtotal,
      total_bid_amount: total
    };
  };

  const handleSave = () => {
    const totals = calculateTotals();
    onSave({ ...formData, ...totals });
  };

  const totals = calculateTotals();
  const readOnly = !isEditing;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estimate Details</CardTitle>
          <div className="flex gap-2">
            {readOnly ? (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
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
              <label className="text-xs text-slate-600">Hours</label>
              <Input
                type="number"
                value={formData.labor_hours || 0}
                onChange={(e) => setFormData({ ...formData, labor_hours: parseFloat(e.target.value) })}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Rate ($/hr)</label>
              <Input
                type="number"
                value={formData.labor_rate || 0}
                onChange={(e) => setFormData({ ...formData, labor_rate: parseFloat(e.target.value) })}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Total</label>
              <Input value={`$${totals.labor_cost.toLocaleString()}`} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Materials & Line Items</CardTitle>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(formData.line_items || []).map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start p-2 border rounded">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                  disabled={readOnly}
                  className="col-span-4"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                  disabled={readOnly}
                  className="col-span-2"
                />
                <Input
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                  disabled={readOnly}
                  className="col-span-1"
                />
                <Input
                  type="number"
                  placeholder="Unit $"
                  value={item.unit_cost}
                  onChange={(e) => updateLineItem(idx, 'unit_cost', e.target.value)}
                  disabled={readOnly}
                  className="col-span-2"
                />
                <Input
                  value={`$${(item.total_cost || 0).toLocaleString()}`}
                  disabled
                  className="col-span-2"
                />
                {!readOnly && (
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
            ))}
          </div>
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
              <label className="text-xs text-slate-600">Equipment Cost</label>
              <Input
                type="number"
                value={formData.equipment_cost || 0}
                onChange={(e) => setFormData({ ...formData, equipment_cost: parseFloat(e.target.value) })}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Subcontractor Cost</label>
              <Input
                type="number"
                value={formData.subcontractor_cost || 0}
                onChange={(e) => setFormData({ ...formData, subcontractor_cost: parseFloat(e.target.value) })}
                disabled={readOnly}
              />
            </div>
          </div>
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
              <label className="text-xs text-slate-600">Overhead %</label>
              <Input
                type="number"
                value={formData.overhead_percent || 0}
                onChange={(e) => setFormData({ ...formData, overhead_percent: parseFloat(e.target.value) })}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600">Profit Margin %</label>
              <Input
                type="number"
                value={formData.profit_margin_percent || 0}
                onChange={(e) => setFormData({ ...formData, profit_margin_percent: parseFloat(e.target.value) })}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-semibold">${totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Bid Amount:</span>
              <span className="text-green-600">${totals.total_bid_amount.toLocaleString()}</span>
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
            disabled={readOnly}
            placeholder="Additional notes..."
          />
        </CardContent>
      </Card>
    </div>
  );
}