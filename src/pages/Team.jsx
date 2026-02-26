import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SkillsCloud from '../components/team/SkillsCloud';
import EmptyState from '../components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Mail,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Award,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
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

  // Calculate productivity insights
  const avgProductivity = workers.filter(w => w.productivity_score).reduce((sum, w) => sum + w.productivity_score, 0) / 
    (workers.filter(w => w.productivity_score).length || 1);

  const expiringCerts = workers.flatMap(w => 
    (w.certifications || []).filter(c => {
      if (!c.expiry_date) return false;
      const days = differenceInDays(new Date(c.expiry_date), new Date());
      return days >= 0 && days <= 30;
    }).map(c => ({ ...c, worker: w.name }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-1">Skills matrix, certifications & workforce optimization</p>
        </div>
        <Button onClick={() => { setEditingWorker(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Worker
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
          <p className="text-sm text-slate-500">Avg Productivity</p>
          <p className="text-2xl font-semibold mt-1">{avgProductivity.toFixed(0)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Cert. Expiring</p>
          <p className={cn(
            "text-2xl font-semibold mt-1",
            expiringCerts.length > 0 ? "text-amber-600" : "text-slate-900"
          )}>
            {expiringCerts.length}
          </p>
        </div>
      </div>

      <Tabs defaultValue="directory" className="w-full">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="skills">Skills & Certifications</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {expiringCerts.length > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{expiringCerts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              title="No team members found"
              description="Add your first team member to get started"
              actionLabel="Add Worker"
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
                          onClick={() => {
                            if (confirm(`Delete ${worker.name}? This action cannot be undone.`)) {
                              deleteMutation.mutate(worker.id);
                            }
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-2">
                    {worker.company && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{worker.company}</span>
                      </div>
                    )}
                    {worker.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{worker.email}</span>
                      </div>
                    )}
                    {worker.hourly_rate && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>${worker.hourly_rate}/hr</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {worker.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {worker.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {worker.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs text-slate-400">
                          +{worker.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <Badge className={cn(
                      STATUSES.find(s => s.value === worker.status)?.color
                    )}>
                      {worker.status?.replace('_', ' ')}
                    </Badge>
                    {worker.certifications?.length > 0 && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Award className="h-4 w-4" />
                        <span className="text-xs">{worker.certifications.length} certs</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsCloud 
            workers={workers} 
            onSelectWorker={(worker) => { setEditingWorker(worker); setShowForm(true); }}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <div className="space-y-4">
            {expiringCerts.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <Award className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <h3 className="font-semibold text-green-800">All Certifications Valid</h3>
                <p className="text-sm text-green-600 mt-1">No certifications expiring in the next 30 days</p>
              </div>
            ) : (
              expiringCerts.map((cert, idx) => (
                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">{cert.name}</p>
                      <p className="text-sm text-amber-600">
                        {cert.worker} • Expires {format(new Date(cert.expiry_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">Renew</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

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
  const [formData, setFormData] = React.useState(worker || {
    name: '',
    role: 'laborer',
    email: '',
    phone: '',
    hourly_rate: '',
    status: 'available',
    current_project_id: '',
    company: '',
    skills: [],
  });

  const [newSkill, setNewSkill] = React.useState('');

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
        company: '',
        skills: [],
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

  const addSkill = () => {
    if (newSkill && !formData.skills?.includes(newSkill)) {
      setFormData({ ...formData, skills: [...(formData.skills || []), newSkill] });
      setNewSkill('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
          <div className="space-y-2">
            <Label>Company (Subcontractor)</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Company name if subcontractor"
            />
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

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills?.map(skill => (
                <Badge 
                  key={skill} 
                  variant="outline"
                  className="cursor-pointer hover:bg-red-50 hover:text-red-600"
                  onClick={() => setFormData({ 
                    ...formData, 
                    skills: formData.skills.filter(s => s !== skill) 
                  })}
                >
                  {skill} ×
                </Badge>
              ))}
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