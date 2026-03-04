import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import constructflowClient from '@/api/constructflowClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectMaterials({ projectId, organizationId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0,
    unit: 'units',
    unit_cost: 0,
    supplier: '',
    notes: ''
  });

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => constructflowClient.getCurrentUser()
  });

  // Fetch project materials
  const { data: materials = [] } = useQuery({
    queryKey: ['projectMaterials', projectId, organizationId],
    queryFn: () => {
      if (!projectId || !organizationId) return [];
      return constructflowClient.getProjectMaterials({ 
        project_id: projectId,
        organization_id: organizationId 
      }, '-created_at');
    },
    enabled: !!projectId && !!organizationId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => constructflowClient.createProjectMaterial({
      ...data,
      project_id: projectId,
      organization_id: organizationId,
      created_by: user?.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials'] });
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: 0,
        unit: 'units',
        unit_cost: 0,
        supplier: '',
        notes: ''
      });
      setShowForm(false);
      toast.success('Material added successfully');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => constructflowClient.updateProjectMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials'] });
      setEditingMaterial(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: 0,
        unit: 'units',
        unit_cost: 0,
        supplier: '',
        notes: ''
      });
      setShowForm(false);
      toast.success('Material updated successfully');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => constructflowClient.deleteProjectMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMaterials'] });
      toast.success('Material deleted successfully');
    }
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Material name is required');
      return;
    }

    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || '',
      category: material.category || '',
      quantity: material.quantity || 0,
      unit: material.unit || 'units',
      unit_cost: material.unit_cost || 0,
      supplier: material.supplier || '',
      notes: material.notes || ''
    });
    setShowForm(true);
  };

  const handleReset = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      quantity: 0,
      unit: 'units',
      unit_cost: 0,
      supplier: '',
      notes: ''
    });
    setShowForm(false);
  };

  const totalMaterialCost = materials.reduce((sum, m) => sum + ((m.quantity || 0) * (m.unit_cost || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Project Materials</h3>
          <p className="text-sm text-slate-500">Manage materials for this project</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add Material'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Material Name *</label>
                <Input
                  placeholder="e.g., Concrete, Steel Beams"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  placeholder="e.g., Structural, Finishing"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    placeholder="units, tons, m³"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Unit Cost ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <Input
                  placeholder="Supplier name"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Material description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Additional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingMaterial ? 'Update' : 'Add'} Material
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No materials added yet. Click "Add Material" to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Material Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${totalMaterialCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {materials.map(material => (
              <Card key={material.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{material.name}</h4>
                      {material.category && (
                        <p className="text-sm text-slate-500">Category: {material.category}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-slate-500">Quantity:</span>
                          <p className="font-medium">{material.quantity} {material.unit}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Unit Cost:</span>
                          <p className="font-medium">${(material.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Total:</span>
                          <p className="font-medium text-green-600">${((material.quantity || 0) * (material.unit_cost || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        {material.supplier && (
                          <div>
                            <span className="text-slate-500">Supplier:</span>
                            <p className="font-medium">{material.supplier}</p>
                          </div>
                        )}
                      </div>
                      {material.description && (
                        <p className="text-sm text-slate-600 mt-2">{material.description}</p>
                      )}
                      {material.notes && (
                        <p className="text-sm text-slate-500 mt-2 italic">Note: {material.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
