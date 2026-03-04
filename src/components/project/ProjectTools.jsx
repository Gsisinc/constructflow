import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectTools({ projectId, organizationId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 1,
    status: 'available',
    location: '',
    last_maintenance: '',
    next_maintenance: '',
    rental_cost: 0,
    purchase_cost: 0,
    notes: ''
  });

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch project tools
  const { data: tools = [] } = useQuery({
    queryKey: ['projectTools', projectId, organizationId],
    queryFn: () => {
      if (!projectId || !organizationId) return [];
      return base44.entities.ProjectTool.filter({ 
        project_id: projectId,
        organization_id: organizationId 
      }, '-created_at');
    },
    enabled: !!projectId && !!organizationId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTool.create({
      ...data,
      project_id: projectId,
      organization_id: organizationId,
      created_by: user?.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTools'] });
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: 1,
        status: 'available',
        location: '',
        last_maintenance: '',
        next_maintenance: '',
        rental_cost: 0,
        purchase_cost: 0,
        notes: ''
      });
      setShowForm(false);
      toast.success('Tool added successfully');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectTool.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTools'] });
      setEditingTool(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: 1,
        status: 'available',
        location: '',
        last_maintenance: '',
        next_maintenance: '',
        rental_cost: 0,
        purchase_cost: 0,
        notes: ''
      });
      setShowForm(false);
      toast.success('Tool updated successfully');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTool.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTools'] });
      toast.success('Tool deleted successfully');
    }
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Tool name is required');
      return;
    }

    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description || '',
      category: tool.category || '',
      quantity: tool.quantity || 1,
      status: tool.status || 'available',
      location: tool.location || '',
      last_maintenance: tool.last_maintenance || '',
      next_maintenance: tool.next_maintenance || '',
      rental_cost: tool.rental_cost || 0,
      purchase_cost: tool.purchase_cost || 0,
      notes: tool.notes || ''
    });
    setShowForm(true);
  };

  const handleReset = () => {
    setEditingTool(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      quantity: 1,
      status: 'available',
      location: '',
      last_maintenance: '',
      next_maintenance: '',
      rental_cost: 0,
      purchase_cost: 0,
      notes: ''
    });
    setShowForm(false);
  };

  const availableTools = tools.filter(t => t.status === 'available').length;
  const maintenanceNeeded = tools.filter(t => {
    if (!t.next_maintenance) return false;
    return new Date(t.next_maintenance) <= new Date();
  }).length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tools & Equipment</h3>
          <p className="text-sm text-slate-500">Manage tools and equipment for this project</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTool ? 'Edit Tool' : 'Add Tool'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium">Tool Name *</label>
                <Input
                  placeholder="e.g., Excavator, Drill, Scaffolding"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  placeholder="e.g., Heavy Equipment, Power Tools"
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
                    placeholder="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g., Job Site, Warehouse"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Last Maintenance</label>
                  <Input
                    type="date"
                    value={formData.last_maintenance}
                    onChange={(e) => setFormData({ ...formData, last_maintenance: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Next Maintenance</label>
                  <Input
                    type="date"
                    value={formData.next_maintenance}
                    onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Rental Cost ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.rental_cost}
                    onChange={(e) => setFormData({ ...formData, rental_cost: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Purchase Cost ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Tool description"
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
                  {editingTool ? 'Update' : 'Add'} Tool
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

      {tools.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No tools added yet. Click "Add Tool" to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tools.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{availableTools}</p>
              </CardContent>
            </Card>
            {maintenanceNeeded > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    Maintenance Due
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-600">{maintenanceNeeded}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            {tools.map(tool => (
              <Card key={tool.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{tool.name}</h4>
                        <Badge className={getStatusColor(tool.status)}>
                          {tool.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {tool.category && (
                        <p className="text-sm text-slate-500">Category: {tool.category}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-slate-500">Quantity:</span>
                          <p className="font-medium">{tool.quantity}</p>
                        </div>
                        {tool.location && (
                          <div>
                            <span className="text-slate-500">Location:</span>
                            <p className="font-medium">{tool.location}</p>
                          </div>
                        )}
                        {tool.rental_cost > 0 && (
                          <div>
                            <span className="text-slate-500">Rental Cost:</span>
                            <p className="font-medium">${(tool.rental_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                        {tool.purchase_cost > 0 && (
                          <div>
                            <span className="text-slate-500">Purchase Cost:</span>
                            <p className="font-medium">${(tool.purchase_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                        {tool.next_maintenance && (
                          <div>
                            <span className="text-slate-500">Next Maintenance:</span>
                            <p className={`font-medium ${new Date(tool.next_maintenance) <= new Date() ? 'text-yellow-600' : ''}`}>
                              {new Date(tool.next_maintenance).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {tool.description && (
                        <p className="text-sm text-slate-600 mt-2">{tool.description}</p>
                      )}
                      {tool.notes && (
                        <p className="text-sm text-slate-500 mt-2 italic">Note: {tool.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tool)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(tool.id)}
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
