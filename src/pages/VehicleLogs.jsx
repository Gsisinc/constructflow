import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Fuel, Wrench, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VehicleLogs() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formData, setFormData] = useState({
    vehicle_name: '',
    driver: '',
    technician_id: '',
    job_site_id: '',
    starting_mileage: 0,
    ending_mileage: 0,
    purpose: 'job_site',
    fuel_added: 0,
    fuel_cost: 0,
    maintenance_performed: '',
    maintenance_cost: 0,
    notes: ''
  });

  // Get current user for organization filtering
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch vehicle logs with organization filtering
  const { data: logs = [] } = useQuery({
    queryKey: ['vehicleLogs', user?.organization_id],
    queryFn: () => {
      if (!user?.organization_id) return [];
      return base44.entities.VehicleLog.filter({
        organization_id: user.organization_id
      }, '-log_date');
    },
    enabled: !!user?.organization_id
  });

  // Fetch projects for job site selection
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: () => {
      if (!user?.organization_id) return [];
      return base44.entities.Project.filter({
        organization_id: user.organization_id
      }, '-created_date');
    },
    enabled: !!user?.organization_id
  });

  // Fetch team members for technician selection
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', user?.organization_id],
    queryFn: () => {
      if (!user?.organization_id) return [];
      return base44.entities.Profile.filter({
        organization_id: user.organization_id
      });
    },
    enabled: !!user?.organization_id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VehicleLog.create({
      ...data,
      organization_id: user?.organization_id,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      total_miles: data.ending_mileage - data.starting_mileage,
      created_by: user?.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleLogs'] });
      setFormData({
        vehicle_name: '',
        driver: '',
        technician_id: '',
        job_site_id: '',
        starting_mileage: 0,
        ending_mileage: 0,
        purpose: 'job_site',
        fuel_added: 0,
        fuel_cost: 0,
        maintenance_performed: '',
        maintenance_cost: 0,
        notes: ''
      });
      setShowForm(false);
      toast.success('Vehicle log entry created');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VehicleLog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleLogs'] });
      toast.success('Vehicle log deleted');
    }
  });

  // Create expense from vehicle log
  const createExpenseMutation = useMutation({
    mutationFn: ({ logId, projectId }) => {
      const log = logs.find(l => l.id === logId);
      const totalCost = (log?.fuel_cost || 0) + (log?.maintenance_cost || 0);
      
      return base44.entities.Expense.create({
        project_id: projectId,
        organization_id: user?.organization_id,
        description: `Vehicle Log - ${log?.vehicle_name} (${log?.driver})`,
        amount: totalCost,
        expense_date: log?.log_date,
        category: 'vehicle',
        notes: `Fuel: $${log?.fuel_cost} | Maintenance: $${log?.maintenance_cost}`,
        created_by: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowExpenseDialog(false);
      setSelectedLogId(null);
      setSelectedProjectId('');
      toast.success('Expense created from vehicle log');
    }
  });

  const handleSubmit = () => {
    if (!formData.vehicle_name.trim()) {
      toast.error('Vehicle name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCreateExpense = () => {
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }
    createExpenseMutation.mutate({ logId: selectedLogId, projectId: selectedProjectId });
  };

  const totalMiles = logs.reduce((sum, log) => sum + (log.total_miles || 0), 0);
  const totalFuelCost = logs.reduce((sum, log) => sum + (log.fuel_cost || 0), 0);
  const totalMaintenanceCost = logs.reduce((sum, log) => sum + (log.maintenance_cost || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">Vehicle Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Track vehicle usage and assign to projects</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> New Log Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle>Vehicle Log Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Vehicle Name *</label>
                <Input
                  placeholder="e.g., GMC Terrain"
                  value={formData.vehicle_name}
                  onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Driver Name *</label>
                <Input
                  placeholder="Driver name"
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Technician</label>
                <select
                  value={formData.technician_id}
                  onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                  className="w-full sm:w-auto mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select technician...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Job Site (Project)</label>
                <select
                  value={formData.job_site_id}
                  onChange={(e) => setFormData({ ...formData, job_site_id: e.target.value })}
                  className="w-full sm:w-auto mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select job site...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Starting Mileage *</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.starting_mileage}
                    onChange={(e) => setFormData({ ...formData, starting_mileage: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ending Mileage *</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.ending_mileage}
                    onChange={(e) => setFormData({ ...formData, ending_mileage: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Purpose</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full sm:w-auto mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="job_site">Job Site</option>
                  <option value="material_pickup">Material Pickup</option>
                  <option value="client_meeting">Client Meeting</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Fuel Added (gal)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.fuel_added}
                    onChange={(e) => setFormData({ ...formData, fuel_added: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fuel Cost ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.fuel_cost}
                    onChange={(e) => setFormData({ ...formData, fuel_cost: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Maintenance Performed</label>
                <Textarea
                  placeholder="e.g., New brakes, Oil change"
                  value={formData.maintenance_performed}
                  onChange={(e) => setFormData({ ...formData, maintenance_performed: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Maintenance Cost ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.maintenance_cost}
                  onChange={(e) => setFormData({ ...formData, maintenance_cost: parseFloat(e.target.value) || 0 })}
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
              <Button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats - Mobile responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm text-slate-600">Total Miles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{totalMiles.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm text-slate-600">Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-green-600">${totalFuelCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm text-slate-600">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">${totalMaintenanceCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm text-slate-600">Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-slate-600">{logs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No vehicle logs yet. Click "New Log Entry" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {logs.map(log => (
            <Card key={log.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-col sm:flex-row justify-between items-start sm:items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg break-words">{log.vehicle_name}</CardTitle>
                    <p className="text-xs md:text-sm text-slate-600 mt-1 break-words">
                      {log.driver} • {format(new Date(log.log_date), 'MMM d, yyyy')}
                    </p>
                    {log.technician_id && (
                      <p className="text-xs text-slate-500 mt-1">Technician assigned</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Dialog open={showExpenseDialog && selectedLogId === log.id} onOpenChange={(open) => {
                      if (open) {
                        setSelectedLogId(log.id);
                        setShowExpenseDialog(true);
                      } else {
                        setShowExpenseDialog(false);
                        setSelectedLogId(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" title="Link to project expense">
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Assign to Project Expense</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Select Project</label>
                            <select
                              value={selectedProjectId}
                              onChange={(e) => setSelectedProjectId(e.target.value)}
                              className="w-full sm:w-auto mt-2 px-3 py-2 border rounded-lg text-sm"
                            >
                              <option value="">Choose project...</option>
                              {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="bg-slate-50 p-3 rounded text-sm">
                            <p className="font-medium">Total Cost: ${((log?.fuel_cost || 0) + (log?.maintenance_cost || 0)).toFixed(2)}</p>
                            <p className="text-slate-600 mt-1">Fuel: ${log?.fuel_cost.toFixed(2)}</p>
                            <p className="text-slate-600">Maintenance: ${log?.maintenance_cost.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleCreateExpense}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              disabled={createExpenseMutation.isPending}
                            >
                              Create Expense
                            </Button>
                            <Button
                              onClick={() => {
                                setShowExpenseDialog(false);
                                setSelectedLogId(null);
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mileage - Stack on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs md:text-sm text-slate-600">Mileage</p>
                    <p className="font-semibold text-sm md:text-base break-words">{log.starting_mileage} → {log.ending_mileage}</p>
                    <p className="text-xs text-slate-500">({log.total_miles} mi)</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-600">Purpose</p>
                    <Badge variant="outline" className="text-xs">{log.purpose.replace('_', ' ')}</Badge>
                  </div>
                </div>

                {/* Fuel */}
                {log.fuel_added > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="break-words">{log.fuel_added} gal • ${log.fuel_cost.toFixed(2)}</span>
                  </div>
                )}

                {/* Maintenance */}
                {log.maintenance_performed && (
                  <div className="flex items-start gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="break-words">{log.maintenance_performed}</p>
                      <p className="text-slate-600">${log.maintenance_cost.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {log.notes && <p className="text-xs md:text-sm text-slate-600 break-words">{log.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
