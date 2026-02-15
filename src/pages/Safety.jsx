import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Safety() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    incident_type: 'near_miss',
    severity: 'low',
    description: '',
    location: '',
    injuries: false
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['safetyIncidents', selectedProject],
    queryFn: () => selectedProject ? base44.entities.SafetyIncident.filter({ project_id: selectedProject }, '-created_date') : Promise.resolve([]),
    enabled: !!selectedProject
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SafetyIncident.create({
      ...data,
      project_id: selectedProject,
      type: data.incident_type,
      incident_date: new Date().toISOString().split('T')[0],
      status: 'reported'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyIncidents', selectedProject] });
      setFormData({ incident_type: 'near_miss', severity: 'low', description: '', location: '', injuries: false });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SafetyIncident.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safetyIncidents'] })
  });

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Safety Management</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" /> Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Safety Incident</DialogTitle>
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
              <select
                value={formData.incident_type}
                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="near_miss">Near Miss</option>
                <option value="injury">Injury</option>
                <option value="hazard">Hazard Observation</option>
                <option value="violation">Safety Violation</option>
              </select>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <Input
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Textarea
                placeholder="Incident Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.injuries}
                  onChange={(e) => setFormData({ ...formData, injuries: e.target.checked })}
                />
                <span>Injuries Involved</span>
              </label>
              <Button 
                onClick={() => {
                  if (selectedProject && formData.description && formData.location && formData.incident_type) {
                    createMutation.mutate(formData);
                  }
                }}
                disabled={!selectedProject || !formData.description || !formData.location || !formData.incident_type || createMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Submitting...' : 'Report Incident'}
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
        {incidents.map(incident => (
          <Card key={incident.id} className={incident.severity === 'critical' || incident.severity === 'high' ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {incident.injuries ? 
                      <AlertTriangle className="h-5 w-5 text-red-600" /> : 
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    }
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{incident.incident_type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-slate-600">{incident.location}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(incident.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{incident.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}