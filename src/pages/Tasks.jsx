import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import EmptyState from '../components/ui/EmptyState';
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
  FileStack,
  Calendar,
  User,
  Loader2,
  GripVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColumns = [
  { id: 'pending', label: 'To Do', color: 'bg-slate-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'completed', label: 'Done', color: 'bg-green-100' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-100' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-600' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-600' },
];

const PHASES = [
  { value: 'preconstruction', label: 'Preconstruction' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'framing', label: 'Framing' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'closeout', label: 'Closeout' },
];

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
    },
  });

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name?.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter === 'all' || task.project_id === projectFilter;
    return matchesSearch && matchesProject;
  });

  const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    updateMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'No Project';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-slate-500 mt-1">Manage project tasks and workflow</p>
        </div>
        <Button onClick={() => { setEditingTask(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 && !search && projectFilter === 'all' ? (
        <EmptyState
          icon={FileStack}
          title="No tasks yet"
          description="Create tasks to track your project work"
          actionLabel="Create Task"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColumns.map((column) => (
              <div key={column.id} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-700">{column.label}</h3>
                  <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full">
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-3 min-h-[200px] transition-colors rounded-lg p-1",
                        snapshot.isDraggingOver && "bg-slate-100"
                      )}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => { setEditingTask(task); setShowForm(true); }}
                              className={cn(
                                "bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:shadow-md transition-all",
                                snapshot.isDragging && "shadow-lg rotate-2"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-0.5 text-slate-300 hover:text-slate-500"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-900 text-sm truncate">
                                    {task.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-1 truncate">
                                    {getProjectName(task.project_id)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <Badge className={cn(
                                      "text-xs",
                                      PRIORITIES.find(p => p.value === task.priority)?.color
                                    )}>
                                      {task.priority}
                                    </Badge>
                                    {task.due_date && (
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(task.due_date), 'MMM d')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingTask(null); }}
        task={editingTask}
        projects={projects}
        onSubmit={(data) => {
          if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, data });
            setShowForm(false);
            setEditingTask(null);
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function TaskFormDialog({ open, onOpenChange, task, projects, onSubmit, loading }) {
  const [formData, setFormData] = useState(task || {
    name: '',
    description: '',
    project_id: '',
    status: 'pending',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    phase: '',
  });

  React.useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        name: '',
        description: '',
        project_id: '',
        status: 'pending',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        phase: '',
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Task Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter task name"
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
          <div className="grid grid-cols-2 gap-4">
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
                  {statusColumns.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select
                value={formData.phase}
                onValueChange={(value) => setFormData({ ...formData, phase: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Input
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="Enter assignee name"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task details..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}