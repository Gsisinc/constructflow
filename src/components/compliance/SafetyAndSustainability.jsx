import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, AlertTriangle, CheckCircle, Leaf } from 'lucide-react';
import { toast } from 'sonner';

// Safety Compliance Tracker
export function SafetyCompliance() {
  const [incidents, setIncidents] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);

  const [newIncident, setNewIncident] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'near-miss',
    severity: 'low',
    description: '',
    location: '',
    injuryType: '',
    preventiveMeasures: ''
  });

  const [newTraining, setNewTraining] = useState({
    employee: '',
    course: 'OSHA 10',
    date: new Date().toISOString().split('T')[0],
    expiryDate: '',
    provider: ''
  });

  const incidentTypes = ['near-miss', 'minor-injury', 'serious-injury', 'fatality', 'incident'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const courses = ['OSHA 10', 'OSHA 30', 'First Aid', 'CPR', 'Fall Protection', 'Electrical Safety', 'Forklift', 'Custom'];

  const addIncident = () => {
    if (!newIncident.description) {
      toast.error('Please describe the incident');
      return;
    }

    setIncidents([...incidents, {
      ...newIncident,
      id: Date.now(),
      status: 'open',
      reportedBy: 'You',
      reportedDate: new Date().toISOString()
    }]);

    setNewIncident({
      date: new Date().toISOString().split('T')[0],
      type: 'near-miss',
      severity: 'low',
      description: '',
      location: '',
      injuryType: '',
      preventiveMeasures: ''
    });
    setShowAddIncident(false);
    toast.success('Incident reported');
  };

  const addTraining = () => {
    if (!newTraining.employee || !newTraining.course) {
      toast.error('Please fill in required fields');
      return;
    }

    setTrainings([...trainings, {
      ...newTraining,
      id: Date.now(),
      status: 'completed'
    }]);

    setNewTraining({
      employee: '',
      course: 'OSHA 10',
      date: new Date().toISOString().split('T')[0],
      expiryDate: '',
      provider: ''
    });
    setShowAddTraining(false);
    toast.success('Training recorded');
  };

  const closeIncident = (id) => {
    setIncidents(incidents.map(i => i.id === id ? { ...i, status: 'closed' } : i));
    toast.success('Incident closed');
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-slate-100';
  };

  const incidentStats = {
    total: incidents.length,
    thisMonth: incidents.filter(i => {
      const date = new Date(i.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    injuries: incidents.filter(i => i.type.includes('injury')).length,
    nearMiss: incidents.filter(i => i.type === 'near-miss').length
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{incidentStats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{incidentStats.thisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Injuries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{incidentStats.injuries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Near Miss</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{incidentStats.nearMiss}</p>
          </CardContent>
        </Card>
      </div>

      {/* Incident Tracking */}
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
                  {incidentTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                >
                  {severities.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Input
                  placeholder="Location"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                />
                <Textarea
                  placeholder="Incident description"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                />
                <Textarea
                  placeholder="Preventive measures"
                  value={newIncident.preventiveMeasures}
                  onChange={(e) => setNewIncident({ ...newIncident, preventiveMeasures: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddIncident(false)}>Cancel</Button>
                  <Button onClick={addIncident}>Report Incident</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No incidents reported
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map(incident => (
                <div key={incident.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <h3 className="font-bold text-sm capitalize">{incident.type.replace('-', ' ')}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{incident.description}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-2">
                    📍 {incident.location} • {incident.date} • Status: {incident.status}
                  </p>

                  {incident.preventiveMeasures && (
                    <p className="text-xs bg-blue-50 p-2 rounded mb-2">
                      <strong>Preventive Measures:</strong> {incident.preventiveMeasures}
                    </p>
                  )}

                  {incident.status === 'open' && (
                    <Button
                      size="sm"
                      onClick={() => closeIncident(incident.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Close Incident
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Certificates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Safety Training & Certifications</CardTitle>
          <Dialog open={showAddTraining} onOpenChange={setShowAddTraining}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Record Training
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Safety Training</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Employee name"
                  value={newTraining.employee}
                  onChange={(e) => setNewTraining({ ...newTraining, employee: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newTraining.course}
                  onChange={(e) => setNewTraining({ ...newTraining, course: e.target.value })}
                >
                  {courses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={newTraining.date}
                  onChange={(e) => setNewTraining({ ...newTraining, date: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Expiry date"
                  value={newTraining.expiryDate}
                  onChange={(e) => setNewTraining({ ...newTraining, expiryDate: e.target.value })}
                />
                <Input
                  placeholder="Training provider"
                  value={newTraining.provider}
                  onChange={(e) => setNewTraining({ ...newTraining, provider: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddTraining(false)}>Cancel</Button>
                  <Button onClick={addTraining}>Record Training</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {trainings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No training records yet
            </div>
          ) : (
            <div className="space-y-2">
              {trainings.map(training => {
                const expiryDate = new Date(training.expiryDate);
                const today = new Date();
                const isExpired = expiryDate < today;
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                return (
                  <div key={training.id} className={`flex items-center justify-between p-3 rounded border ${
                    isExpired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div>
                      <p className="font-medium text-sm">{training.employee}</p>
                      <p className="text-xs text-slate-600">
                        {training.course} • {training.provider} • Completed: {training.date}
                      </p>
                      <p className={`text-xs mt-1 ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                        {isExpired ? `Expired ${Math.abs(daysUntilExpiry)} days ago` : `Expires in ${daysUntilExpiry} days`}
                      </p>
                    </div>
                    <CheckCircle className={`h-5 w-5 ${isExpired ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sustainability Tracking
export function SustainabilityTracking() {
  const [initiatives, setInitiatives] = useState([]);
  const [showAddInitiative, setShowAddInitiative] = useState(false);

  const [newInitiative, setNewInitiative] = useState({
    name: '',
    type: 'material',
    description: '',
    carbonSavings: 0,
    cost: 0,
    status: 'planned'
  });

  const types = ['material', 'energy', 'waste', 'water', 'leed-credit'];
  const statuses = ['planned', 'in-progress', 'completed'];

  const addInitiative = () => {
    if (!newInitiative.name) {
      toast.error('Please enter initiative name');
      return;
    }

    setInitiatives([...initiatives, {
      ...newInitiative,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0]
    }]);

    setNewInitiative({
      name: '',
      type: 'material',
      description: '',
      carbonSavings: 0,
      cost: 0,
      status: 'planned'
    });
    setShowAddInitiative(false);
    toast.success('Initiative added');
  };

  const totalCarbonSavings = initiatives.reduce((sum, i) => sum + i.carbonSavings, 0);
  const estimatedCost = initiatives.reduce((sum, i) => sum + i.cost, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-600" />
              Carbon Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totalCarbonSavings.toLocaleString()} kg</p>
            <p className="text-xs text-slate-600 mt-1">CO₂ equivalent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Initiatives</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{initiatives.length}</p>
            <p className="text-xs text-slate-600 mt-1">
              {initiatives.filter(i => i.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${estimatedCost.toLocaleString()}</p>
            <p className="text-xs text-slate-600 mt-1">Total cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Initiatives */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sustainability Initiatives</CardTitle>
          <Dialog open={showAddInitiative} onOpenChange={setShowAddInitiative}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Initiative
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Sustainability Initiative</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Initiative name"
                  value={newInitiative.name}
                  onChange={(e) => setNewInitiative({ ...newInitiative, name: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newInitiative.type}
                  onChange={(e) => setNewInitiative({ ...newInitiative, type: e.target.value })}
                >
                  {types.map(t => (
                    <option key={t} value={t}>{t.replace('-', ' ')}</option>
                  ))}
                </select>
                <Textarea
                  placeholder="Description"
                  value={newInitiative.description}
                  onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Carbon savings (kg)"
                  value={newInitiative.carbonSavings}
                  onChange={(e) => setNewInitiative({ ...newInitiative, carbonSavings: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  placeholder="Cost ($)"
                  value={newInitiative.cost}
                  onChange={(e) => setNewInitiative({ ...newInitiative, cost: parseFloat(e.target.value) || 0 })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newInitiative.status}
                  onChange={(e) => setNewInitiative({ ...newInitiative, status: e.target.value })}
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s.replace('-', ' ')}</option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddInitiative(false)}>Cancel</Button>
                  <Button onClick={addInitiative}>Add Initiative</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {initiatives.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No sustainability initiatives yet
            </div>
          ) : (
            <div className="space-y-3">
              {initiatives.map(initiative => (
                <div key={initiative.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{initiative.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 capitalize">{initiative.type.replace('-', ' ')}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      initiative.status === 'completed' ? 'bg-green-100 text-green-800' :
                      initiative.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {initiative.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 mb-2">{initiative.description}</p>

                  <div className="grid grid-cols-2 text-sm mb-2">
                    <div className="text-green-600">
                      <p className="font-bold">{initiative.carbonSavings} kg</p>
                      <p className="text-xs">CO₂ saved</p>
                    </div>
                    <div className="text-slate-600">
                      <p className="font-bold">${initiative.cost.toLocaleString()}</p>
                      <p className="text-xs">Investment</p>
                    </div>
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
