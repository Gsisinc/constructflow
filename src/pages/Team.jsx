import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmptyState from '../components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  DollarSign,
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLES = [
  { value: 'foreman', label: 'Foreman' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'mason', label: 'Mason' },
  { value: 'welder', label: 'Welder' },
  { value: 'operator', label: 'Operator' },
  { value: 'laborer', label: 'Laborer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'supervisor', label: 'Supervisor' },
];

const STATUSES = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-700' },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-amber-100 text-amber-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-slate-100 text-slate-500' },
];

export default function Team() {
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: () => base44.entities.Worker.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Worker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Worker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowForm(false);
      setEditingWorker(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Worker.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name?.toLowerCase().includes(search.toLowerCase()) ||
      worker.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || worker.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || worker.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Team</h1>
          <p className="text-slate-500 mt-1">Manage your workforce and crew assignments</p>
        </div>
        <Button onClick={() => { setEditingWorker(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Worker
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Team</p>
          <p className="text-2xl font-semibold mt-1">{workers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Available</p>
          <p className="text-2xl font-semibold mt-1 text-green-600">
            {workers.filter(w => w.status === 'available').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Assigned</p>
          <p className="text-2xl font-semibold mt-1 text-blue-600">
            {workers.filter(w => w.status === 'assigned').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">On Leave</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">
            {workers.filter(w => w.status === 'on_leave').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || roleFilter !== 'all' || statusFilter !== 'all' ? 'No team members found' : 'No team members yet'}
          description="Add your first team member to get started"
          actionLabel={!search && roleFilter === 'all' && statusFilter === 'all' ? 'Add Worker' : null}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={worker.avatar_url} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                      {worker.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-slate-900">{worker.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{worker.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingWorker(worker); setShowForm(true); }}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteMutation.mutate(worker.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2">
                {worker.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{worker.email}</span>
                  </div>
                )}
                {worker.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{worker.phone}</span>
                  </div>
                )}
                {worker.hourly_rate && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>${worker.hourly_rate}/hr</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge className={cn(
                  STATUSES.find(s => s.value === worker.status)?.color
                )}>
                  {worker.status?.replace('_', ' ')}
                </Badge>
                {worker.current_project_id && (
                  <span className="text-xs text-slate-500">
                    {getProjectName(worker.current_project_id)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Worker Form Dialog */}
      <WorkerFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingWorker(null); }}
        worker={editingWorker}
        projects={projects}
        onSubmit={(data) => {
          if (editingWorker) {
            updateMutation.mutate({ id: editingWorker.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function WorkerFormDialog({ open, onOpenChange, worker, projects, onSubmit, loading }) {
  const [formData, setFormData] = useState(worker || {
    name: '',
    role: 'laborer',
    email: '',
    phone: '',
    hourly_rate: '',
    status: 'available',
    current_project_id: '',
  });

  React.useEffect(() => {
    if (worker) {
      setFormData(worker);
    } else {
      setFormData({
        name: '',
        role: 'laborer',
        email: '',
        phone: '',
        hourly_rate: '',
        status: 'available',
        current_project_id: '',
      });
    }
  }, [worker]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{worker ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Project</Label>
              <Select
                value={formData.current_project_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, current_project_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {worker ? 'Update' : 'Add'} Worker
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}