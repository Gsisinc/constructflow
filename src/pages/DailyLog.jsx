import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import constructflowClient from '@/api/constructflowClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function DailyLog() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    work_performed: '',
    weather: { conditions: '', temperature: 0 },
    safety_issues: '',
    delays: '',
    notes: ''
  });

  // Get current user to access organization_id
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => constructflowClient.getCurrentUser()
  });

  // SECURITY FIX: Filter projects by organization_id
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: () => {
      if (!user?.organization_id) return [];
      return constructflowClient.getProjects({ 
        organization_id: user.organization_id 
      }, '-created_date');
    },
    enabled: !!user?.organization_id
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['dailyLogs', selectedProject],
    queryFn: () => selectedProject ? constructflowClient.getDailyLogs({ project_id: selectedProject }) : Promise.resolve([]),
    enabled: !!selectedProject
  });

  const createMutation = useMutation({
    mutationFn: (data) => constructflowClient.createDailyLog({
      ...data,
      project_id: selectedProject,
      organization_id: user?.organization_id,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      submitted_by: user?.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
      setFormData({ work_performed: '', weather: { conditions: '', temperature: 0 }, safety_issues: '', delays: '', notes: '' });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => constructflowClient.deleteDailyLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const handleSubmit = () => {
    if (!selectedProject) {
      alert('Please select a project');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">Daily Logs</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" /> New Log
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Daily Log</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Project *</label>
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full sm:w-auto p-2 border rounded-lg mt-1"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <Textarea
                placeholder="Work Performed"
                value={formData.work_performed}
                onChange={(e) => setFormData({ ...formData, work_performed: e.target.value })}
              />
              <Input
                placeholder="Weather Conditions"
                value={formData.weather.conditions}
                onChange={(e) => setFormData({ ...formData, weather: { ...formData.weather, conditions: e.target.value } })}
              />
              <Input
                type="number"
                placeholder="Temperature"
                value={formData.weather.temperature}
                onChange={(e) => setFormData({ ...formData, weather: { ...formData.weather, temperature: parseFloat(e.target.value) } })}
              />
              <Textarea
                placeholder="Safety Issues (if any)"
                value={formData.safety_issues}
                onChange={(e) => setFormData({ ...formData, safety_issues: e.target.value })}
              />
              <Textarea
                placeholder="Delays"
                value={formData.delays}
                onChange={(e) => setFormData({ ...formData, delays: e.target.value })}
              />
              <Textarea
                placeholder="Additional Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <Button onClick={handleSubmit} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Log'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No daily logs yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 break-words">{log.work_performed?.substring(0, 50)}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(log.log_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    {log.weather?.conditions && <p><strong>Weather:</strong> {log.weather.conditions} ({log.weather.temperature}°)</p>}
                    {log.safety_issues && <p><strong>Safety Issues:</strong> {log.safety_issues}</p>}
                    {log.delays && <p><strong>Delays:</strong> {log.delays}</p>}
                    {log.notes && <p><strong>Notes:</strong> {log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
