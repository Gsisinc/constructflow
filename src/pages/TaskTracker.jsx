import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle2, Circle, AlertCircle, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUSES = ['pending', 'in_progress', 'completed', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function TaskTracker() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['operationalTasks', selectedProject],
    queryFn: () => base44.entities.OperationalTask.filter(
      selectedProject ? { project_id: selectedProject } : {}
    ),
    enabled: true
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OperationalTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operationalTasks'] });
      setShowNewDialog(false);
      toast.success('Task created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OperationalTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operationalTasks'] });
      toast.success('Task updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OperationalTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operationalTasks'] });
      toast.success('Task deleted');
    }
  });

  const filteredTasks = tasks.filter(t => t.status === selectedStatus);
  const tasksByProject = selectedProject ? filteredTasks : [];
  const allStatusTasks = selectedProject ? filteredTasks : tasks.filter(t => t.status === selectedStatus);

  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  };

  const handleToggleStatus = (task) => {
    const statuses = ['pending', 'in_progress', 'completed', 'blocked'];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updateMutation.mutate({ 
      id: task.id, 
      data: { 
        status: nextStatus,
        completion_date: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : null
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operational Task Tracker</h1>
          <p className="text-slate-500">Daily and weekly tasks for active projects</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <TaskForm projects={projects} onSubmit={(data) => createMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Circle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.blocked}</p>
              <p className="text-xs text-slate-500">Blocked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Filter */}
      <div className="flex gap-2 overflow-x-auto">
        <Button
          variant={selectedProject === null ? 'default' : 'outline'}
          onClick={() => setSelectedProject(null)}
        >
          All Projects
        </Button>
        {projects.map(p => (
          <Button
            key={p.id}
            variant={selectedProject === p.id ? 'default' : 'outline'}
            onClick={() => setSelectedProject(p.id)}
            className="whitespace-nowrap"
          >
            {p.name}
          </Button>
        ))}
      </div>

      {/* Tasks by Status */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>

        {STATUSES.map(status => (
          <TabsContent key={status} value={status} className="space-y-4 mt-6">
            {allStatusTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  No {status} tasks
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allStatusTasks.map(task => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className="mt-1 hover:opacity-70 transition"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : task.status === 'blocked' ? (
                            <AlertCircle className="h-6 w-6 text-red-500" />
                          ) : task.status === 'in_progress' ? (
                            <AlertCircle className="h-6 w-6 text-blue-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-slate-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">{task.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {task.category}
                            </Badge>
                            <Badge 
                              className="text-xs"
                              variant={task.priority === 'critical' ? 'destructive' : 'secondary'}
                            >
                              {task.priority}
                            </Badge>
                            {task.due_date && (
                              <Badge variant="outline" className="text-xs">
                                Due: {format(new Date(task.due_date), 'MMM d')}
                              </Badge>
                            )}
                          </div>
                          {task.assigned_to && (
                            <p className="text-xs text-slate-500 mt-2">Assigned to: {task.assigned_to}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-red-600"
                            onClick={() => {
                              if (confirm('Delete task?')) {
                                deleteMutation.mutate(task.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-w-xl">
            <TaskForm 
              task={editingTask}
              projects={projects}
              onSubmit={(data) => updateMutation.mutate({ id: editingTask.id, data })} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TaskForm({ task, projects, onSubmit }) {
  const [formData, setFormData] = useState(task || {
    project_id: '',
    title: '',
    description: '',
    category: 'follow_up',
    status: 'pending',
    priority: 'medium',
    assigned_to: '',
    due_date: ''
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
      </DialogHeader>
      <div>
        <label className="text-sm font-semibold">Project *</label>
        <select
          value={formData.project_id}
          onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
          className="w-full border rounded p-2"
        >
          <option value="">Select project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold">Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Task title"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Task details..."
          className="w-full border rounded p-2 h-20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="bid_analysis">Bid Analysis</option>
            <option value="documentation">Documentation</option>
            <option value="procurement">Procurement</option>
            <option value="scheduling">Scheduling</option>
            <option value="safety">Safety</option>
            <option value="quality">Quality</option>
            <option value="compliance">Compliance</option>
            <option value="communication">Communication</option>
            <option value="follow_up">Follow-up</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Assigned To</label>
          <Input
            type="email"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Due Date</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
      </div>
      <Button onClick={() => onSubmit(formData)} className="w-full">
        {task ? 'Update Task' : 'Create Task'}
      </Button>
    </div>
  );
}