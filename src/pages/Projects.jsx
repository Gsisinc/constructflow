import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOrganization } from '@/components/hooks/useOrganization';
import ProjectCard from '../components/dashboard/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import PullToRefresh from '@/components/ui/PullToRefresh';
import EmptyState from '../components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, FolderKanban, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const queryClient = useQueryClient();
  const { organization } = useOrganization();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      return await base44.entities.Project.filter({ organization_id: organization.id }, '-created_date');
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create({ ...data, organization_id: organization?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', organization?.id] });
      setShowForm(false);
    },
  });

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(search.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: projects.length,
    bidding: projects.filter((p) => p.status === 'bidding').length,
    in_progress: projects.filter((p) => p.status === 'in_progress').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects', organization?.id] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Manage your construction work</p>
          </div>
        <Button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700 min-h-[44px] select-none text-sm sm:text-base">
          <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
            <SelectItem value="bidding">Bidding ({statusCounts.bidding})</SelectItem>
            <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
            <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2.5 transition-colors min-h-[44px] select-none",
              viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2.5 transition-colors min-h-[44px] select-none",
              viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {isLoading ? (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first project to get started'
          }
          actionLabel={!search && statusFilter === 'all' ? 'Create Project' : null}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Form */}
      <ProjectForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => createMutation.mutate(data)}
      />
      </div>
    </PullToRefresh>
  );
}