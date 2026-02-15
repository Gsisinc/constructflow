import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResourceAllocation() {
  const [resources, setResources] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddAllocation, setShowAddAllocation] = useState(false);

  const [newResource, setNewResource] = useState({
    name: '',
    type: 'Labor',
    capacity: 40, // hours per week
    rate: 0, // hourly rate
    skills: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [newAllocation, setNewAllocation] = useState({
    resourceId: '',
    project: '',
    task: '',
    allocatedHours: 40,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium'
  });

  const resourceTypes = ['Labor', 'Equipment', 'Material', 'Subcontractor'];
  const priorities = ['low', 'medium', 'high', 'critical'];

  const addResource = () => {
    if (!newResource.name) {
      toast.error('Please enter resource name');
      return;
    }
    setResources([...resources, { ...newResource, id: Date.now() }]);
    setNewResource({
      name: '',
      type: 'Labor',
      capacity: 40,
      rate: 0,
      skills: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowAddResource(false);
    toast.success('Resource added');
  };

  const addAllocation = () => {
    if (!newAllocation.resourceId || !newAllocation.project) {
      toast.error('Please select resource and project');
      return;
    }
    setAllocations([...allocations, { ...newAllocation, id: Date.now() }]);
    setNewAllocation({
      resourceId: '',
      project: '',
      task: '',
      allocatedHours: 40,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium'
    });
    setShowAddAllocation(false);
    toast.success('Allocation added');
  };

  const deleteResource = (id) => {
    setResources(resources.filter(r => r.id !== id));
    setAllocations(allocations.filter(a => a.resourceId !== id));
    toast.success('Resource deleted');
  };

  const deleteAllocation = (id) => {
    setAllocations(allocations.filter(a => a.id !== id));
    toast.success('Allocation deleted');
  };

  // Calculate utilization for each resource
  const utilization = useMemo(() => {
    return resources.map(resource => {
      const allocatedHours = allocations
        .filter(a => a.resourceId === resource.id)
        .reduce((sum, a) => sum + a.allocatedHours, 0);

      const totalCapacity = resource.capacity * 52; // 52 weeks per year
      const utilizationPercent = (allocatedHours / totalCapacity * 100) || 0;
      const isOverallocated = utilizationPercent > 100;

      return {
        resourceId: resource.id,
        allocatedHours,
        totalCapacity,
        utilizationPercent,
        isOverallocated,
        availableHours: totalCapacity - allocatedHours
      };
    });
  }, [resources, allocations]);

  const overallocatedResources = utilization.filter(u => u.isOverallocated);
  const underutilizedResources = utilization.filter(u => u.utilizationPercent < 50);

  const getUtilizationColor = (percent) => {
    if (percent > 100) return 'text-red-600 bg-red-50';
    if (percent > 85) return 'text-orange-600 bg-orange-50';
    if (percent > 50) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-slate-100';
  };

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {overallocatedResources.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-sm">Overallocated Resources</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800">
            {overallocatedResources.length} resource(s) are overallocated. Consider leveling workload.
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resources.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allocations.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(utilization.reduce((sum, u) => sum + u.utilizationPercent, 0) / resources.length).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overallocated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{overallocatedResources.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resources */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resource Pool</CardTitle>
          <Dialog open={showAddResource} onOpenChange={setShowAddResource}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Resource name"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                />

                <select
                  className="w-full border rounded px-3 py-2"
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                >
                  {resourceTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <Input
                  type="number"
                  placeholder="Weekly capacity (hours)"
                  value={newResource.capacity}
                  onChange={(e) => setNewResource({ ...newResource, capacity: parseFloat(e.target.value) || 0 })}
                />

                <Input
                  type="number"
                  placeholder="Hourly rate ($)"
                  value={newResource.rate}
                  onChange={(e) => setNewResource({ ...newResource, rate: parseFloat(e.target.value) || 0 })}
                />

                <Input
                  placeholder="Skills/Specialization"
                  value={newResource.skills}
                  onChange={(e) => setNewResource({ ...newResource, skills: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={newResource.startDate}
                    onChange={(e) => setNewResource({ ...newResource, startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={newResource.endDate}
                    onChange={(e) => setNewResource({ ...newResource, endDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddResource(false)}>Cancel</Button>
                  <Button onClick={addResource}>Add Resource</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No resources yet. Add your team members and equipment.
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map(resource => {
                const util = utilization.find(u => u.resourceId === resource.id);
                return (
                  <div key={resource.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold">{resource.name}</h3>
                        <p className="text-sm text-slate-600">
                          {resource.type} • {resource.skills && `${resource.skills} • `}{resource.capacity}h/week
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteResource(resource.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className={`p-3 rounded ${getUtilizationColor(util.utilizationPercent)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Utilization</span>
                        <span className="text-sm font-bold">{util.utilizationPercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            util.isOverallocated ? 'bg-red-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(100, util.utilizationPercent)}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2">
                        {util.allocatedHours} / {util.totalCapacity} hours
                        {util.isOverallocated && ` (${(util.allocatedHours - util.totalCapacity).toFixed(0)} hrs over)`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Allocations</CardTitle>
          <Dialog open={showAddAllocation} onOpenChange={setShowAddAllocation}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Allocation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Allocate Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newAllocation.resourceId}
                  onChange={(e) => setNewAllocation({ ...newAllocation, resourceId: parseInt(e.target.value) })}
                >
                  <option value="">Select resource</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>

                <Input
                  placeholder="Project name"
                  value={newAllocation.project}
                  onChange={(e) => setNewAllocation({ ...newAllocation, project: e.target.value })}
                />

                <Input
                  placeholder="Task/Phase"
                  value={newAllocation.task}
                  onChange={(e) => setNewAllocation({ ...newAllocation, task: e.target.value })}
                />

                <Input
                  type="number"
                  placeholder="Allocated hours"
                  value={newAllocation.allocatedHours}
                  onChange={(e) => setNewAllocation({ ...newAllocation, allocatedHours: parseFloat(e.target.value) || 0 })}
                />

                <select
                  className="w-full border rounded px-3 py-2"
                  value={newAllocation.priority}
                  onChange={(e) => setNewAllocation({ ...newAllocation, priority: e.target.value })}
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={newAllocation.startDate}
                    onChange={(e) => setNewAllocation({ ...newAllocation, startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={newAllocation.endDate}
                    onChange={(e) => setNewAllocation({ ...newAllocation, endDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddAllocation(false)}>Cancel</Button>
                  <Button onClick={addAllocation}>Allocate</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No allocations yet. Assign resources to projects.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Resource</th>
                    <th className="text-left py-2 px-2">Project</th>
                    <th className="text-left py-2 px-2">Task</th>
                    <th className="text-right py-2 px-2">Hours</th>
                    <th className="text-left py-2 px-2">Priority</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map(allocation => {
                    const resource = resources.find(r => r.id === allocation.resourceId);
                    return (
                      <tr key={allocation.id} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-2 font-medium">{resource?.name}</td>
                        <td className="py-2 px-2">{allocation.project}</td>
                        <td className="py-2 px-2 text-slate-600">{allocation.task}</td>
                        <td className="text-right py-2 px-2">{allocation.allocatedHours}h</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(allocation.priority)}`}>
                            {allocation.priority}
                          </span>
                        </td>
                        <td className="text-right py-2 px-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAllocation(allocation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
