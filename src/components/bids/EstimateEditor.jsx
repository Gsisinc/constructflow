import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, Calculator, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function EstimateEditor({ bidId, organizationId }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['bidEstimates', bidId],
    queryFn: () => base44.entities.BidEstimate.filter({ bid_opportunity_id: bidId }),
    enabled: !!bidId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BidEstimate.create({
      ...data,
      bid_opportunity_id: bidId,
      organization_id: organizationId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
      toast.success('Estimate created');
      setIsEditing(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BidEstimate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates', bidId] });
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

function EstimateForm({ estimate, isEditing, onEdit, onCancel, onSave, onDelete, isSaving }) {
  const [formData, setFormData] = useState(estimate || {
    line_items: [],
    labor_hours: 0,
    labor_rate: 65,
    equipment_cost: 0,
    subcontractor_cost: 0,
    overhead_percent: 15,
    profit_margin_percent: 20,
    notes: ''
  });

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
    onSave({ 
      ...formData, 
      ...totals,
      version: (formData.version || 0) + (formData.id ? 1 : 0)
    });
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle>Estimate Details</CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
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
                <div key={idx} className="grid grid-cols-12 gap-2 items-start p-2 border rounded">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                    disabled={!isEditing}
                    className="col-span-4"
                  />
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
                    className="col-span-1"
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
              <label className="text-xs text-slate-600 block mb-1">Equipment Cost</label>
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

      {/* Margins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Margins & Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Overhead %</label>
              <Input
                type="number"
                value={formData.overhead_percent || 0}
                onChange={(e) => setFormData({ ...formData, overhead_percent: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Profit Margin %</label>
              <Input
                type="number"
                value={formData.profit_margin_percent || 0}
                onChange={(e) => setFormData({ ...formData, profit_margin_percent: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
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
            disabled={!isEditing}
            placeholder="Additional notes..."
          />
        </CardContent>
      </Card>
    </div>
  );
}