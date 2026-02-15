import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  UserPlus,
  Briefcase,
  Calendar,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TeamManagement() {
  const [user, setUser] = useState(null);
  const [showWorkerDialog, setShowWorkerDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers', user?.organization_id],
    queryFn: () => base44.entities.Worker.filter({ organization_id: user.organization_id }),
    enabled: !!user?.organization_id
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: () => base44.entities.Project.filter({ organization_id: user.organization_id }),
    enabled: !!user?.organization_id
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', user?.organization_id],
    queryFn: () => base44.entities.WorkerAssignment.filter({ 
      organization_id: user.organization_id,
      status: 'active'
    }),
    enabled: !!user?.organization_id
  });

  const createWorkerMutation = useMutation({
    mutationFn: (data) => base44.entities.Worker.create({
      ...data,
      organization_id: user.organization_id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowWorkerDialog(false);
      setEditingWorker(null);
      toast.success('Team member added');
    }
  });

  const updateWorkerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Worker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowWorkerDialog(false);
      setEditingWorker(null);
      toast.success('Team member updated');
    }
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: (id) => base44.entities.Worker.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Team member removed');
    }
  });

  const filteredWorkers = workers.filter(w => 
    w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWorkerAssignments = (workerId) => {
    return assignments.filter(a => a.worker_id === workerId);
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-8 w-8 text-amber-600" />
            Labor Force Management
          </h1>
          <p className="text-slate-600 mt-1">Manage your team, assignments, and workforce</p>
        </div>
        <Button 
          onClick={() => {
            setEditingWorker(null);
            setShowWorkerDialog(true);
          }}
          className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          <Plus className="h-5 w-5" />
          Add Team Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Team</p>
                <p className="text-2xl font-bold mt-1">{workers.length}</p>
              </div>
              <Users className="h-10 w-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Assigned</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {workers.filter(w => w.status === 'assigned').length}
                </p>
              </div>
              <Briefcase className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Available</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {workers.filter(w => w.status === 'available').length}
                </p>
              </div>
              <UserPlus className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">On Leave</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {workers.filter(w => w.status === 'on_leave').length}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredWorkers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No team members found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowWorkerDialog(true)}
              >
                Add Your First Team Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredWorkers.map(worker => {
            const workerAssignments = getWorkerAssignments(worker.id);
            const statusColors = {
              available: 'bg-green-100 text-green-800',
              assigned: 'bg-blue-100 text-blue-800',
              on_leave: 'bg-yellow-100 text-yellow-800',
              inactive: 'bg-slate-100 text-slate-800'
            };

            return (
              <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                          {worker.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">{worker.name}</h3>
                          <p className="text-sm text-slate-600">{worker.role}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm text-slate-900">{worker.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Phone</p>
                          <p className="text-sm text-slate-900">{worker.phone || 'N/A'}</p>
                        </div>
                        {worker.hourly_rate && (
                          <div>
                            <p className="text-xs text-slate-500">Hourly Rate</p>
                            <p className="text-sm text-slate-900">${worker.hourly_rate}/hr</p>
                          </div>
                        )}
                        {worker.current_project_id && (
                          <div>
                            <p className="text-xs text-slate-500">Current Project</p>
                            <p className="text-sm text-slate-900">
                              {projects.find(p => p.id === worker.current_project_id)?.name || 'Unknown'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge className={statusColors[worker.status]}>
                          {worker.status?.replace('_', ' ')}
                        </Badge>
                        {workerAssignments.length > 0 && (
                          <Badge variant="outline">
                            {workerAssignments.length} assignment{workerAssignments.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {worker.skills?.length > 0 && (
                          <Badge variant="outline">
                            {worker.skills.length} skill{worker.skills.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWorker(worker);
                          setShowAssignDialog(true);
                        }}
                      >
                        <Briefcase className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingWorker(worker);
                          setShowWorkerDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => {
                          if (confirm(`Remove ${worker.name} from team?`)) {
                            deleteWorkerMutation.mutate(worker.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Worker Form Dialog */}
      <WorkerFormDialog
        open={showWorkerDialog}
        onOpenChange={setShowWorkerDialog}
        worker={editingWorker}
        onSubmit={(data) => {
          if (editingWorker) {
            updateWorkerMutation.mutate({ id: editingWorker.id, data });
          } else {
            createWorkerMutation.mutate(data);
          }
        }}
      />

      {/* Assignment Dialog */}
      {selectedWorker && (
        <AssignmentDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          worker={selectedWorker}
          projects={projects}
          organizationId={user.organization_id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            setShowAssignDialog(false);
            setSelectedWorker(null);
          }}
        />
      )}
    </div>
  );
}

function WorkerFormDialog({ open, onOpenChange, worker, onSubmit }) {
  const [formData, setFormData] = useState(worker || {
    name: '',
    role: 'laborer',
    email: '',
    phone: '',
    hourly_rate: '',
    status: 'available',
    skills: [],
    equipment_licenses: []
  });

  React.useEffect(() => {
    if (worker) {
      setFormData(worker);
    }
  }, [worker]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{worker ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="laborer">Laborer</option>
                <option value="foreman">Foreman</option>
                <option value="carpenter">Carpenter</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="mason">Mason</option>
                <option value="welder">Welder</option>
                <option value="operator">Operator</option>
                <option value="engineer">Engineer</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Hourly Rate</label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Button onClick={() => onSubmit(formData)} className="w-full bg-amber-600 hover:bg-amber-700">
            {worker ? 'Update' : 'Add'} Team Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentDialog({ open, onOpenChange, worker, projects, organizationId, onSuccess }) {
  const [assignmentData, setAssignmentData] = useState({
    project_id: '',
    task_id: '',
    assignment_type: 'project',
    role_on_assignment: worker.role,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data) => {
      const assignment = await base44.entities.WorkerAssignment.create({
        ...data,
        organization_id: organizationId,
        worker_id: worker.id
      });
      
      // Update worker status
      await base44.entities.Worker.update(worker.id, {
        status: 'assigned',
        current_project_id: data.project_id
      });
      
      return assignment;
    },
    onSuccess: () => {
      toast.success('Assignment created');
      onSuccess();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {worker.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Project *</label>
            <select
              value={assignmentData.project_id}
              onChange={(e) => setAssignmentData({ ...assignmentData, project_id: e.target.value })}
              className="w-full border rounded p-2"
            >
              <option value="">Select project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Role on Assignment</label>
            <Input
              value={assignmentData.role_on_assignment}
              onChange={(e) => setAssignmentData({ ...assignmentData, role_on_assignment: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Start Date</label>
            <Input
              type="date"
              value={assignmentData.start_date}
              onChange={(e) => setAssignmentData({ ...assignmentData, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Notes</label>
            <Input
              value={assignmentData.notes}
              onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
              placeholder="Assignment details..."
            />
          </div>
          <Button 
            onClick={() => createAssignmentMutation.mutate(assignmentData)}
            disabled={!assignmentData.project_id || createAssignmentMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}