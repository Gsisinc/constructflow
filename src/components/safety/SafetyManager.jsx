import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const severityConfig = {
  minor: { color: 'bg-blue-100 text-blue-800' },
  moderate: { color: 'bg-yellow-100 text-yellow-800' },
  serious: { color: 'bg-orange-100 text-orange-800' },
  critical: { color: 'bg-red-100 text-red-800' }
};

const statusConfig = {
  reported: { color: 'bg-slate-100 text-slate-800', icon: FileText },
  investigating: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  action_required: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { color: 'bg-slate-100 text-slate-800', icon: Shield }
};

export default function SafetyManager({ projectId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: incidents = [] } = useQuery({
    queryKey: ['safetyIncidents', projectId],
    queryFn: () => base44.entities.SafetyIncident.filter({ project_id: projectId }, '-incident_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SafetyIncident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyIncidents', projectId] });
      setShowForm(false);
      setEditingIncident(null);
      toast.success('Safety incident reported');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SafetyIncident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyIncidents', projectId] });
      toast.success('Incident updated');
    }
  });

  const handleSubmit = (formData) => {
    const incidentNumber = editingIncident?.incident_number || `SI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const payload = {
      project_id: projectId,
      incident_number: incidentNumber,
      ...formData
    };

    if (editingIncident) {
      updateMutation.mutate({ id: editingIncident.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredIncidents = filterStatus === 'all' 
    ? incidents 
    : incidents.filter(i => i.status === filterStatus);

  const summary = {
    total: incidents.length,
    open: incidents.filter(i => ['reported', 'investigating', 'action_required'].includes(i.status)).length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    resolved: incidents.filter(i => i.status === 'resolved').length
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="action_required">Action Required</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingIncident(null)} variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingIncident ? 'Update Incident' : 'Report Safety Incident'}</DialogTitle>
            </DialogHeader>
            <SafetyIncidentForm
              incident={editingIncident}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingIncident(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No safety incidents reported</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map((incident) => {
            const StatusIcon = statusConfig[incident.status]?.icon || AlertTriangle;
            return (
              <Card key={incident.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <CardTitle className="text-lg">{incident.type?.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                        <Badge className={severityConfig[incident.severity]?.color}>
                          {incident.severity}
                        </Badge>
                        <Badge className={statusConfig[incident.status]?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {incident.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{incident.incident_number}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingIncident(incident);
                        setShowForm(true);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700">{incident.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Date:</span>{' '}
                        <span className="font-medium">{incident.incident_date ? format(new Date(incident.incident_date), 'MMM d, yyyy') : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Location:</span>{' '}
                        <span className="font-medium">{incident.location || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Reported by:</span>{' '}
                        <span className="font-medium">{incident.reported_by || 'N/A'}</span>
                      </div>
                    </div>
                    {incident.investigation_notes && (
                      <div className="bg-slate-50 rounded p-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">Investigation Notes:</p>
                        <p className="text-sm text-slate-700">{incident.investigation_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function SafetyIncidentForm({ incident, onSubmit, onCancel }) {
  const user = base44.auth.me();
  const [formData, setFormData] = useState({
    type: incident?.type || 'near_miss',
    severity: incident?.severity || 'moderate',
    status: incident?.status || 'reported',
    description: incident?.description || '',
    location: incident?.location || '',
    incident_date: incident?.incident_date || new Date().toISOString().split('T')[0],
    reported_by: incident?.reported_by || user.email,
    investigation_notes: incident?.investigation_notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Incident Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="injury">Injury</SelectItem>
              <SelectItem value="near_miss">Near Miss</SelectItem>
              <SelectItem value="property_damage">Property Damage</SelectItem>
              <SelectItem value="environmental">Environmental</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Severity</Label>
          <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="serious">Serious</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what happened"
          className="h-24"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Where did this occur?"
          />
        </div>

        <div>
          <Label>Incident Date</Label>
          <Input
            type="date"
            value={formData.incident_date}
            onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="action_required">Action Required</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Investigation Notes</Label>
        <Textarea
          value={formData.investigation_notes}
          onChange={(e) => setFormData({ ...formData, investigation_notes: e.target.value })}
          placeholder="Investigation findings and notes"
          className="h-24"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive">
          {incident ? 'Update' : 'Report'} Incident
        </Button>
      </div>
    </form>
  );
}