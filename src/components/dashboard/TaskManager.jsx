import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskManager({ projectId = null }) {
  const [showDialog, setShowDialog] = useState(false);
  const [taskName, setTaskName] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => {
      if (projectId) {
        return base44.entities.Task.filter({ project_id: projectId });
      }
      return base44.entities.Task.list();
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskName('');
      setShowDialog(false);
      toast.success('Task created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Task.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    }
  });

  const handleCreateTask = () => {
    if (!taskName.trim()) return;
    createMutation.mutate({
      name: taskName,
      project_id: projectId,
      status: 'pending'
    });
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">My Tasks {tasks.length > 0 && `(${completedCount}/${tasks.length})`}</CardTitle>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input 
                placeholder="Task name..." 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
              />
              <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400">No tasks yet</div>
          ) : (
            tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50">
                <button
                  onClick={() => updateMutation.mutate({
                    id: task.id,
                    status: task.status === 'completed' ? 'pending' : 'completed'
                  })}
                  className="flex-shrink-0"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                </button>
                <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                  {task.name}
                </span>
                <button
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}