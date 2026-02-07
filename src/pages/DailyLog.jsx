import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, Trash2, Edit2 } from 'lucide-react';
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

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['dailyLogs', selectedProject],
    queryFn: () => selectedProject ? base44.entities.DailyLog.filter({ project_id: selectedProject }) : Promise.resolve([]),
    enabled: !!selectedProject
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyLog.create({
      ...data,
      project_id: selectedProject,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      submitted_by: (base44.auth.me()).email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
      setFormData({ work_performed: '', weather: { conditions: '', temperature: 0 }, safety_issues: '', delays: '', notes: '' });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Daily Logs</h1>
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
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
                placeholder="Delays (if any)"
                value={formData.delays}
                onChange={(e) => setFormData({ ...formData, delays: e.target.value })}
              />
              <Textarea
                placeholder="Additional Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <Button onClick={handleSubmit} className="w-full bg-amber-600 hover:bg-amber-700">
                Save Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">Select a Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="grid gap-4">
        {logs.map(log => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg">{format(new Date(log.log_date), 'MMMM d, yyyy')}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(log.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {log.work_performed && (
                <div>
                  <p className="font-semibold text-slate-700">Work Performed</p>
                  <p className="text-slate-600">{log.work_performed}</p>
                </div>
              )}
              {log.weather && (
                <div>
                  <p className="font-semibold text-slate-700">Weather</p>
                  <p className="text-slate-600">{log.weather.conditions} • {log.weather.temperature}°</p>
                </div>
              )}
              {log.safety_issues && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="font-semibold text-red-900">Safety Issues</p>
                  <p className="text-red-800">{log.safety_issues}</p>
                </div>
              )}
              {log.notes && (
                <div>
                  <p className="font-semibold text-slate-700">Notes</p>
                  <p className="text-slate-600">{log.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}