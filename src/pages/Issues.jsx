import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '@/components/skeleton/SkeletonComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const TYPES = [
  { value: 'quality', label: 'Quality' },
  { value: 'safety', label: 'Safety' },
  { value: 'delay', label: 'Delay' },
  { value: 'budget', label: 'Budget' },
  { value: 'design', label: 'Design' },
  { value: 'material', label: 'Material' },
  { value: 'other', label: 'Other' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

const STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'closed', label: 'Closed', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export default function Issues() {
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Issue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Issue.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setShowForm(false);
      setEditingIssue(null);
    },
  });

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const openIssues = issues.filter(i => i.status === 'open').length;
  const criticalIssues = issues.filter(i => i.severity === 'critical' && i.status !== 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Issues</h1>
          <p className="text-slate-500 mt-1">Track and resolve project issues</p>
        </div>
        <Button onClick={() => { setEditingIssue(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Issues</p>
          <p className="text-2xl font-semibold mt-1">{issues.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Open</p>
          <p className="text-2xl font-semibold mt-1 text-red-600">{openIssues}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Critical</p>
          <p className={cn(
            "text-2xl font-semibold mt-1",
            criticalIssues > 0 ? "text-red-600" : "text-slate-900"
          )}>
            {criticalIssues}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="text-2xl font-semibold mt-1 text-green-600">
            {issues.filter(i => ['resolved', 'closed'].includes(i.status)).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
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
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {SEVERITIES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      <>{
isLoading ? <TableSkeleton />:
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={search || statusFilter !== 'all' || severityFilter !== 'all' ? 'No issues found' : 'No issues yet'}
          description="All clear! No issues have been reported."
          actionLabel={!search && statusFilter === 'all' && severityFilter === 'all' ? 'Report Issue' : null}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => { setEditingIssue(issue); setShowForm(true); }}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-medium text-slate-900">{issue.title}</h3>
                    <Badge className={cn("border", STATUSES.find(s => s.value === issue.status)?.color)}>
                      {issue.status?.replace('_', ' ')}
                    </Badge>
                    <Badge className={SEVERITIES.find(s => s.value === issue.severity)?.color}>
                      {issue.severity}
                    </Badge>
                    <Badge variant="outline">{issue.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{issue.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 flex-wrap">
                    <span>{getProjectName(issue.project_id)}</span>
                    {issue.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {issue.location}
                      </span>
                    )}
                    {issue.assigned_to && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {issue.assigned_to}
                      </span>
                    )}
                    {issue.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(issue.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                {issue.photo_url && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={issue.photo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Form Dialog */}
      <IssueFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingIssue(null); }}
        issue={editingIssue}
        projects={projects}
        onSubmit={(data) => {
          if (editingIssue) {
            updateMutation.mutate({ id: editingIssue.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function IssueFormDialog({ open, onOpenChange, issue, projects, onSubmit, loading }) {
  const [formData, setFormData] = useState(issue || {
    title: '',
    project_id: '',
    type: 'other',
    severity: 'medium',
    status: 'open',
    description: '',
    location: '',
    assigned_to: '',
    due_date: '',
    resolution: '',
  });

  React.useEffect(() => {
    if (issue) {
      setFormData(issue);
    } else {
      setFormData({
        title: '',
        project_id: '',
        type: 'other',
        severity: 'medium',
        status: 'open',
        description: '',
        location: '',
        assigned_to: '',
        due_date: '',
        resolution: '',
      });
    }
  }, [issue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{issue ? 'Edit Issue' : 'Report Issue'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Floor 3, Room 302"
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Input
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                placeholder="Assignee name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the issue..."
              rows={3}
            />
          </div>
          {issue && (
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Textarea
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                placeholder="How was this issue resolved?"
                rows={2}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {issue ? 'Update' : 'Report'} Issue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}