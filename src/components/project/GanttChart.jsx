import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GanttChart({ tasks = [], onTaskAdd, onTaskUpdate, onTaskDelete }) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    assignee: '',
    dependencies: [],
    status: 'todo'
  });

  const statuses = ['todo', 'in-progress', 'completed', 'blocked'];
  const statusColors = {
    'todo': 'bg-slate-300',
    'in-progress': 'bg-blue-500',
    'completed': 'bg-green-500',
    'blocked': 'bg-red-500'
  };

  // Calculate date range for the chart
  const dates = useMemo(() => {
    if (tasks.length === 0) return [];
    
    const allDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    
    const daysInRange = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const dateArray = [];
    
    for (let i = 0; i < daysInRange; i++) {
      const date = new Date(minDate);
      date.setDate(date.getDate() + i);
      dateArray.push(new Date(date));
    }
    
    return dateArray;
  }, [tasks]);

  const minDate = dates.length > 0 ? dates[0] : new Date();
  const maxDate = dates.length > 0 ? dates[dates.length - 1] : new Date();

  const getTaskPosition = (task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    const startPercent = ((taskStart - minDate) / (maxDate - minDate)) * 100;
    const durationPercent = ((taskEnd - taskStart) / (maxDate - minDate)) * 100;
    
    return {
      left: `${Math.max(0, startPercent)}%`,
      width: `${Math.max(durationPercent, 2)}%`
    };
  };

  const handleAddTask = () => {
    if (!newTask.name) {
      toast.error('Please enter a task name');
      return;
    }

    if (onTaskAdd) {
      onTaskAdd({
        ...newTask,
        id: Date.now(),
        progress: parseInt(newTask.progress) || 0
      });
    }

    setNewTask({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      assignee: '',
      dependencies: [],
      status: 'todo'
    });
    setShowAddTask(false);
    toast.success('Task added');
  };

  const handleUpdateTask = () => {
    if (onTaskUpdate) {
      onTaskUpdate({
        ...editingTask,
        progress: parseInt(editingTask.progress) || 0
      });
    }
    setEditingTask(null);
    toast.success('Task updated');
  };

  const handleDeleteTask = (taskId) => {
    if (onTaskDelete) {
      onTaskDelete(taskId);
      toast.success('Task deleted');
    }
  };

  const criticalPath = useMemo(() => {
    // Simple critical path: tasks with no slack time
    const tasksWithDependencies = tasks.filter(t => t.dependencies?.length > 0);
    return tasksWithDependencies.map(t => t.id);
  }, [tasks]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Timeline - Gantt Chart</CardTitle>
        <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Project Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Name</label>
                <Input
                  placeholder="e.g., Foundation work"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Progress (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newTask.progress}
                    onChange={(e) => setNewTask({ ...newTask, progress: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assigned To</label>
                <Input
                  placeholder="Team member name"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
                <Button onClick={handleAddTask}>Add Task</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No tasks yet. Click "Add Task" to create a project timeline.
          </div>
        ) : (
          <div className="min-w-full">
            {/* Headers */}
            <div className="flex gap-4 mb-4">
              <div className="w-48 flex-shrink-0">
                <div className="font-semibold text-sm">Task</div>
              </div>
              <div className="flex-1 relative">
                <div className="font-semibold text-sm">Timeline</div>
                <div className="flex gap-1 mt-1 text-xs text-slate-500">
                  {dates.map((date, idx) => (
                    <div key={idx} className="flex-1 text-center h-6">
                      {idx % 7 === 0 && date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks */}
            {tasks.map((task) => {
              const position = getTaskPosition(task);
              const isCritical = criticalPath.includes(task.id);

              return (
                <div key={task.id} className="flex gap-4 mb-3 items-center">
                  <div className="w-48 flex-shrink-0">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-sm truncate">{task.name}</div>
                      <div className="text-xs text-slate-500">
                        {task.assignee && `${task.assignee}`}
                      </div>
                      {task.dependencies?.length > 0 && (
                        <div className="text-xs text-blue-600">
                          Depends on: {task.dependencies.length} task(s)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 relative h-10 bg-slate-50 rounded border border-slate-200">
                    {/* Bar */}
                    <div
                      style={position}
                      className={`absolute top-0 h-full rounded flex items-center justify-center text-white text-xs font-bold transition-all ${
                        statusColors[task.status] || 'bg-slate-500'
                      } ${isCritical ? 'ring-2 ring-red-500' : ''}`}
                    >
                      {Math.round(task.progress)}%
                    </div>

                    {/* Progress fill */}
                    <div
                      style={{
                        ...position,
                        width: `${(task.progress / 100) * parseFloat(position.width)}%`
                      }}
                      className={`absolute top-0 h-full rounded opacity-40 ${statusColors[task.status]}`}
                    />
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      {editingTask?.id === task.id && (
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Task Name</label>
                              <Input
                                value={editingTask.name}
                                onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Start Date</label>
                                <Input
                                  type="date"
                                  value={editingTask.startDate}
                                  onChange={(e) => setEditingTask({ ...editingTask, startDate: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">End Date</label>
                                <Input
                                  type="date"
                                  value={editingTask.endDate}
                                  onChange={(e) => setEditingTask({ ...editingTask, endDate: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select
                                  className="w-full border rounded px-3 py-2 text-sm"
                                  value={editingTask.status}
                                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                                >
                                  {statuses.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Progress (%)</label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editingTask.progress}
                                  onChange={(e) => setEditingTask({ ...editingTask, progress: e.target.value })}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Assigned To</label>
                              <Input
                                value={editingTask.assignee}
                                onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                              <Button onClick={handleUpdateTask}>Save Changes</Button>
                            </div>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-300"></div>
                <span>To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 ring-2 ring-red-500 ring-offset-1"></div>
                <span>Critical Path</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
