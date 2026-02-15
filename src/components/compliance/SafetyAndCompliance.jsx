import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Safety Compliance Manager
export function SafetyCompliance() {
  const [safetyIncidents, setSafetyIncidents] = useState([
    {
      id: 1,
      type: 'near-miss',
      title: 'Tripping hazard on scaffold',
      location: 'Site A - 3rd Floor',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      severity: 'low',
      reported_by: 'John Smith',
      status: 'resolved',
      actions: 'Cleared debris, added caution tape'
    },
    {
      id: 2,
      type: 'incident',
      title: 'Worker minor injury - cut hand',
      location: 'Site B - Ground Floor',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      severity: 'medium',
      reported_by: 'Sarah Johnson',
      status: 'under-investigation',
      actions: null
    }
  ]);

  const [showAddIncident, setShowAddIncident] = useState(false);
  const [newIncident, setNewIncident] = useState({
    type: 'near-miss',
    title: '',
    location: '',
    severity: 'low',
    description: '',
    witnessed: false
  });

  const [trainingRecords, setTrainingRecords] = useState([
    {
      id: 1,
      employee: 'John Smith',
      training: 'OSHA Safety Certification',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'current'
    },
    {
      id: 2,
      employee: 'Mike Johnson',
      training: 'Fall Protection',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'expired'
    }
  ]);

  const incidentTypes = ['near-miss', 'incident', 'injury', 'property-damage'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'under-investigation', 'resolved', 'closed'];

  const addIncident = () => {
    if (!newIncident.title || !newIncident.location) {
      toast.error('Please fill required fields');
      return;
    }

    setSafetyIncidents([...safetyIncidents, {
      ...newIncident,
      id: Date.now(),
      date: new Date(),
      status: 'open',
      reported_by: 'Current User'
    }]);

    setNewIncident({
      type: 'near-miss',
      title: '',
      location: '',
      severity: 'low',
      description: '',
      witnessed: false
    });

    setShowAddIncident(false);
    toast.success('Incident reported');
  };

  const updateIncidentStatus = (id, status) => {
    setSafetyIncidents(safetyIncidents.map(i =>
      i.id === id ? { ...i, status } : i
    ));
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-slate-100';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'near-miss': '⚠️',
      'incident': '🚨',
      'injury': '🩹',
      'property-damage': '🔨'
    };
    return icons[type] || '📋';
  };

  const expiredTraining = trainingRecords.filter(t => new Date(t.expiryDate) < new Date());

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Safety Compliance</h2>

      {/* Warning for Expired Training */}
      {expiredTraining.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-sm">Training Expirations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800">
            {expiredTraining.length} training certification(s) have expired. Update immediately.
          </CardContent>
        </Card>
      )}

      {/* Safety Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{safetyIncidents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Open Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {safetyIncidents.filter(i => i.status === 'open' || i.status === 'under-investigation').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Days Since Last Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.floor((new Date() - new Date(safetyIncidents[0]?.date)) / (1000 * 60 * 60 * 24))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Training Current</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {trainingRecords.filter(t => new Date(t.expiryDate) > new Date()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Safety Incidents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Safety Incidents</CardTitle>
          <Dialog open={showAddIncident} onOpenChange={setShowAddIncident}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Report Safety Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                >
                  {incidentTypes.map(t => (
                    <option key={t} value={t}>{t.replace('-', ' ')}</option>
                  ))}
                </select>

                <Input
                  placeholder="Incident title"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                />

                <Input
                  placeholder="Location"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                />

                <select
                  className="w-full border rounded px-3 py-2"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                >
                  {severities.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <Textarea
                  placeholder="Detailed description"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="min-h-[100px]"
                />

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newIncident.witnessed}
                    onChange={(e) => setNewIncident({ ...newIncident, witnessed: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Witnessed by other employees</span>
                </label>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddIncident(false)}>Cancel</Button>
                  <Button onClick={addIncident}>Report Incident</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {safetyIncidents.map(incident => (
              <div key={incident.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getTypeIcon(incident.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{incident.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        📍 {incident.location} • Reported by {incident.reported_by}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {incident.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                    <select
                      className="text-xs border rounded px-2 py-1"
                      value={incident.status}
                      onChange={(e) => updateIncidentStatus(incident.id, e.target.value)}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {incident.actions && (
                  <div className="bg-green-50 p-3 rounded mt-3 text-sm">
                    <p className="font-medium text-green-800">Actions Taken:</p>
                    <p className="text-green-700 mt-1">{incident.actions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Records */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Training Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Employee</th>
                  <th className="text-left py-2 px-2">Training</th>
                  <th className="text-left py-2 px-2">Completed</th>
                  <th className="text-left py-2 px-2">Expires</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trainingRecords.map(record => {
                  const isExpired = new Date(record.expiryDate) < new Date();
                  return (
                    <tr key={record.id} className={`border-b ${isExpired ? 'bg-red-50' : ''}`}>
                      <td className="py-2 px-2 font-medium">{record.employee}</td>
                      <td className="py-2 px-2">{record.training}</td>
                      <td className="py-2 px-2 text-slate-600">{record.date.toLocaleDateString()}</td>
                      <td className="py-2 px-2 text-slate-600">{record.expiryDate.toLocaleDateString()}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isExpired ? 'Expired' : 'Current'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Issue Tracking System
export function IssueTracking() {
  const [issues, setIssues] = useState([]);
  const [showAddIssue, setShowAddIssue] = useState(false);

  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'quality',
    project: '',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const categories = ['quality', 'safety', 'schedule', 'budget', 'other'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'in-progress', 'resolved', 'closed'];

  const addIssue = () => {
    if (!newIssue.title) {
      toast.error('Please enter issue title');
      return;
    }
    setIssues([...issues, {
      ...newIssue,
      id: Date.now(),
      status: 'open',
      createdDate: new Date(),
      comments: []
    }]);
    setNewIssue({
      title: '',
      description: '',
      priority: 'medium',
      category: 'quality',
      project: '',
      assignedTo: '',
      dueDate: new Date().toISOString().split('T')[0]
    });
    setShowAddIssue(false);
    toast.success('Issue created');
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-slate-100';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Issue Tracking</CardTitle>
        <Dialog open={showAddIssue} onOpenChange={setShowAddIssue}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Issue title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              />

              <Textarea
                placeholder="Description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border rounded px-3 py-2"
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  className="border rounded px-3 py-2"
                  value={newIssue.category}
                  onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Input
                placeholder="Project"
                value={newIssue.project}
                onChange={(e) => setNewIssue({ ...newIssue, project: e.target.value })}
              />

              <Input
                placeholder="Assign to"
                value={newIssue.assignedTo}
                onChange={(e) => setNewIssue({ ...newIssue, assignedTo: e.target.value })}
              />

              <Input
                type="date"
                value={newIssue.dueDate}
                onChange={(e) => setNewIssue({ ...newIssue, dueDate: e.target.value })}
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddIssue(false)}>Cancel</Button>
                <Button onClick={addIssue}>Create Issue</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No issues yet. Create one to track problems and improvements.
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <div key={issue.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{issue.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{issue.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                </div>

                <div className="flex gap-4 text-xs text-slate-600 mt-2">
                  <div>📁 {issue.category}</div>
                  <div>👤 {issue.assignedTo || 'Unassigned'}</div>
                  <div>📅 {issue.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
