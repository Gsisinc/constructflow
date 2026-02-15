import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle, CheckCircle, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';

export function SafetyManagement() {
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      date: '2024-02-14',
      type: 'Near Miss',
      description: 'Worker almost slipped on wet floor',
      severity: 'low',
      resolved: true,
      reporter: 'John Smith'
    },
    {
      id: 2,
      date: '2024-02-10',
      type: 'PPE Non-Compliance',
      description: 'Worker not wearing hard hat in restricted area',
      severity: 'high',
      resolved: true,
      reporter: 'Sarah Johnson'
    }
  ]);

  const [trainings, setTrainings] = useState([
    { id: 1, name: 'OSHA 30-Hour Course', staff: 'John Smith', completedDate: '2024-01-15', expiryDate: '2025-01-15' },
    { id: 2, name: 'First Aid/CPR', staff: 'Sarah Johnson', completedDate: '2023-06-20', expiryDate: '2025-06-20' },
    { id: 3, name: 'Confined Space Training', staff: 'Mike Chen', completedDate: '2024-02-01', expiryDate: '2025-02-01' }
  ]);

  const [showAddIncident, setShowAddIncident] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [newIncident, setNewIncident] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Near Miss',
    description: '',
    severity: 'low',
    reporter: ''
  });

  const [newTraining, setNewTraining] = useState({
    name: '',
    staff: '',
    completedDate: '',
    expiryDate: ''
  });

  const addIncident = () => {
    if (!newIncident.description || !newIncident.reporter) {
      toast.error('Please fill in all fields');
      return;
    }

    setIncidents([...incidents, {
      ...newIncident,
      id: Date.now(),
      resolved: false
    }]);

    setNewIncident({
      date: new Date().toISOString().split('T')[0],
      type: 'Near Miss',
      description: '',
      severity: 'low',
      reporter: ''
    });
    setShowAddIncident(false);
    toast.success('Incident reported');
  };

  const resolveIncident = (id) => {
    setIncidents(incidents.map(i => i.id === id ? { ...i, resolved: true } : i));
    toast.success('Incident marked as resolved');
  };

  const deleteIncident = (id) => {
    setIncidents(incidents.filter(i => i.id !== id));
    toast.success('Incident deleted');
  };

  const addTraining = () => {
    if (!newTraining.name || !newTraining.staff) {
      toast.error('Please fill in all fields');
      return;
    }

    setTrainings([...trainings, {
      ...newTraining,
      id: Date.now()
    }]);

    setNewTraining({ name: '', staff: '', completedDate: '', expiryDate: '' });
    setShowAddTraining(false);
    toast.success('Training record added');
  };

  const incidentStats = {
    total: incidents.length,
    unresolved: incidents.filter(i => !i.resolved).length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    daysSinceIncident: 5
  };

  const getSeverityColor = (severity) => {
    return severity === 'critical' ? 'bg-red-100 text-red-800' :
           severity === 'high' ? 'bg-orange-100 text-orange-800' :
           severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
           'bg-green-100 text-green-800';
  };

  const expiringTrainings = trainings.filter(t => {
    const daysUntilExpiry = Math.ceil((new Date(t.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry < 30 && daysUntilExpiry > 0;
  });

  const expiredTrainings = trainings.filter(t => new Date(t.expiryDate) < new Date());

  return (
    <div className="space-y-4">
      {/* Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Days Without Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{incidentStats.daysSinceIncident}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{incidentStats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${incidentStats.unresolved > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {incidentStats.unresolved}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${incidentStats.critical > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {incidentStats.critical}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Incident Alerts */}
      {expiredTrainings.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-red-900">{expiredTrainings.length} Expired Certifications</p>
              <p className="text-xs text-red-800 mt-1">Update training records immediately</p>
            </div>
          </CardContent>
        </Card>
      )}

      {expiringTrainings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <Activity className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-yellow-900">{expiringTrainings.length} Certifications Expiring Soon</p>
              <p className="text-xs text-yellow-800 mt-1">Schedule renewal training</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident Reporting */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Incident Reports</CardTitle>
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
                <Input
                  type="date"
                  value={newIncident.date}
                  onChange={(e) => setNewIncident({ ...newIncident, date: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                >
                  <option value="Near Miss">Near Miss</option>
                  <option value="Minor Injury">Minor Injury</option>
                  <option value="Serious Injury">Serious Injury</option>
                  <option value="OSHA Recordable">OSHA Recordable</option>
                  <option value="PPE Non-Compliance">PPE Non-Compliance</option>
                  <option value="Equipment Hazard">Equipment Hazard</option>
                </select>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <Textarea
                  placeholder="Describe what happened"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="min-h-[100px]"
                />
                <Input
                  placeholder="Your name"
                  value={newIncident.reporter}
                  onChange={(e) => setNewIncident({ ...newIncident, reporter: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddIncident(false)}>Cancel</Button>
                  <Button onClick={addIncident}>Report</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {incidents.map(incident => (
              <div key={incident.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{incident.type}</p>
                    <p className="text-xs text-slate-600">{incident.date} • Reported by {incident.reporter}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>

                <p className="text-sm text-slate-700 mb-3">{incident.description}</p>

                <div className="flex gap-2">
                  {!incident.resolved && (
                    <Button
                      size="sm"
                      onClick={() => resolveIncident(incident.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Resolved
                    </Button>
                  )}
                  {incident.resolved && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Resolved
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteIncident(incident.id)}
                    className="text-red-600 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training & Certifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Safety Training & Certifications</CardTitle>
          <Dialog open={showAddTraining} onOpenChange={setShowAddTraining}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Training Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Training name"
                  value={newTraining.name}
                  onChange={(e) => setNewTraining({ ...newTraining, name: e.target.value })}
                />
                <Input
                  placeholder="Staff member"
                  value={newTraining.staff}
                  onChange={(e) => setNewTraining({ ...newTraining, staff: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Completion date"
                  value={newTraining.completedDate}
                  onChange={(e) => setNewTraining({ ...newTraining, completedDate: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Expiry date"
                  value={newTraining.expiryDate}
                  onChange={(e) => setNewTraining({ ...newTraining, expiryDate: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddTraining(false)}>Cancel</Button>
                  <Button onClick={addTraining}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {trainings.map(training => {
              const daysUntilExpiry = Math.ceil((new Date(training.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              const isExpired = daysUntilExpiry < 0;
              const expiresoon = daysUntilExpiry < 30 && daysUntilExpiry > 0;

              return (
                <div key={training.id} className={`p-4 border rounded-lg ${
                  isExpired ? 'bg-red-50 border-red-200' :
                  expiresoon ? 'bg-yellow-50 border-yellow-200' :
                  'bg-slate-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">{training.name}</p>
                      <p className="text-xs text-slate-600">{training.staff}</p>
                    </div>
                    {isExpired && (
                      <span className="px-2 py-1 bg-red-200 text-red-900 text-xs rounded font-bold">
                        EXPIRED
                      </span>
                    )}
                    {expiresoon && (
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-900 text-xs rounded font-bold">
                        EXPIRING SOON
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    Completed: {training.completedDate} • Expires: {training.expiryDate}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
