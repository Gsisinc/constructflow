import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EstimateEditor({ estimate = null, bidId = null, onSave = null }) {
  const [lineItems, setLineItems] = useState(estimate?.line_items || []);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [notes, setNotes] = useState(estimate?.notes || '');
  const [newItem, setNewItem] = useState({
    description: '',
    category: 'material',
    quantity: 1,
    unit: 'ea',
    unit_price: 0,
    labor_hours: 0,
    labor_rate: 0
  });

  const categories = ['material', 'labor', 'equipment', 'subcontractor', 'permit', 'other'];
  const units = ['ea', 'sq ft', 'lin ft', 'hour', 'lump sum', 'day', 'ton', 'gallon'];

  const addLineItem = () => {
    if (!newItem.description) {
      toast.error('Please enter a description');
      return;
    }
    const item = {
      ...newItem,
      id: Date.now(),
      line_total: (newItem.quantity * newItem.unit_price) + (newItem.labor_hours * newItem.labor_rate)
    };
    setLineItems([...lineItems, item]);
    setNewItem({
      description: '',
      category: 'material',
      quantity: 1,
      unit: 'ea',
      unit_price: 0,
      labor_hours: 0,
      labor_rate: 0
    });
    setShowAddItem(false);
    toast.success('Item added');
  };

  const updateLineItem = (id, updatedItem) => {
    setLineItems(lineItems.map(item =>
      item.id === id
        ? {
          ...updatedItem,
          line_total: (updatedItem.quantity * updatedItem.unit_price) + (updatedItem.labor_hours * updatedItem.labor_rate)
        }
        : item
    ));
    setEditingItem(null);
    toast.success('Item updated');
  };

  const deleteLineItem = (id) => {
    setLineItems(lineItems.filter(item => item.id !== id));
    toast.success('Item deleted');
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
  };

  const calculateTotalLabor = () => {
    return lineItems.reduce((sum, item) => sum + (item.labor_hours || 0), 0);
  };

  const handleSave = async () => {
    const estimateData = {
      line_items: lineItems,
      notes: notes,
      total_bid_amount: calculateTotal(),
      labor_hours: calculateTotalLabor(),
      bid_opportunity_id: bidId,
      version: estimate?.version || 1
    };

    if (onSave) {
      await onSave(estimateData);
    } else {
      toast.success('Estimate saved locally');
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lineItems.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Labor Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{calculateTotalLabor()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setShowAddItem(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Line Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    placeholder="e.g., Electrical conduit installation"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    >
                      {units.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Unit Price</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Labor Hours</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newItem.labor_hours}
                      onChange={(e) => setNewItem({ ...newItem, labor_hours: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Labor Rate ($/hr)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newItem.labor_rate}
                      onChange={(e) => setNewItem({ ...newItem, labor_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
                  <Button onClick={addLineItem}>Add Item</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No line items yet. Click "Add Item" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-left py-2 px-2">Category</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Unit Price</th>
                    <th className="text-right py-2 px-2">Material</th>
                    <th className="text-right py-2 px-2">Labor Hrs</th>
                    <th className="text-right py-2 px-2">Labor Cost</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2">{item.description}</td>
                      <td className="py-2 px-2">{item.category}</td>
                      <td className="text-right py-2 px-2">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="text-right py-2 px-2">
                        ${(item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right py-2 px-2">
                        ${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right py-2 px-2">{item.labor_hours || 0}</td>
                      <td className="text-right py-2 px-2">
                        ${(item.labor_hours * item.labor_rate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right py-2 px-2 font-bold">
                        ${(item.line_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right py-2 px-2">
                        <div className="flex gap-1 justify-end">
                          <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(item)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            {editingItem?.id === item.id && (
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Line Item</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <Input
                                      value={editingItem.description}
                                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Category</label>
                                      <select
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        value={editingItem.category}
                                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                      >
                                        {categories.map(cat => (
                                          <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-1">Unit</label>
                                      <select
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        value={editingItem.unit}
                                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                                      >
                                        {units.map(u => (
                                          <option key={u} value={u}>{u}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Quantity</label>
                                      <Input
                                        type="number"
                                        value={editingItem.quantity}
                                        onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-1">Unit Price</label>
                                      <Input
                                        type="number"
                                        value={editingItem.unit_price}
                                        onChange={(e) => setEditingItem({ ...editingItem, unit_price: parseFloat(e.target.value) || 0 })}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Labor Hours</label>
                                      <Input
                                        type="number"
                                        value={editingItem.labor_hours}
                                        onChange={(e) => setEditingItem({ ...editingItem, labor_hours: parseFloat(e.target.value) || 0 })}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-1">Labor Rate ($/hr)</label>
                                      <Input
                                        type="number"
                                        value={editingItem.labor_rate}
                                        onChange={(e) => setEditingItem({ ...editingItem, labor_rate: parseFloat(e.target.value) || 0 })}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                                    <Button onClick={() => updateLineItem(item.id, editingItem)}>Save Changes</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteLineItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes or assumptions about this estimate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline">Discard</Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Estimate
        </Button>
      </div>
    </div>
  );
}
