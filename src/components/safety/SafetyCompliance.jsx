import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Shield,
  Plus,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3
} from 'lucide-react';

export default function SafetyCompliance() {
  const [incidents] = useState([
    {
      id: 'INC-001',
      type: 'Near Miss',
      date: new Date('2024-04-15'),
      location: 'Scaffolding Area',
      reporter: 'John Smith',
      severity: 'low',
      description: 'Worker nearly slipped on wet surface',
      action: 'Added warning signs and increased cleaning frequency',
      status: 'closed'
    },
    {
      id: 'INC-002',
      type: 'Injury',
      date: new Date('2024-04-18'),
      location: 'Concrete Pouring',
      reporter: 'Sarah Johnson',
      severity: 'medium',
      description: 'Minor cut on hand during concrete work',
      action: 'First aid provided, investigation in progress',
      status: 'open'
    },
    {
      id: 'INC-003',
      type: 'Safety Violation',
      date: new Date('2024-04-20'),
      location: 'Electrical Work',
      reporter: 'Mike Davis',
      severity: 'high',
      description: 'Worker not wearing required PPE',
      action: 'Immediate corrective action taken, retraining scheduled',
      status: 'open'
    }
  ]);

  const [trainings] = useState([
    { id: 'TRAIN-001', name: 'OSHA 10-Hour', status: 'completed', date: new Date('2024-01-15'), expiry: new Date('2027-01-15') },
    { id: 'TRAIN-002', name: 'Fall Protection', status: 'completed', date: new Date('2024-02-01'), expiry: new Date('2025-02-01') },
    { id: 'TRAIN-003', name: 'Confined Space', status: 'pending', date: null, expiry: null },
    { id: 'TRAIN-004', name: 'Hazmat Handling', status: 'completed', date: new Date('2024-03-10'), expiry: new Date('2026-03-10') }
  ]);

  const [ppeInventory] = useState([
    { id: 'PPE-001', item: 'Hard Hats', quantity: 45, threshold: 30, status: 'adequate' },
    { id: 'PPE-002', item: 'Safety Vests', quantity: 38, threshold: 35, status: 'adequate' },
    { id: 'PPE-003', item: 'Safety Glasses', quantity: 22, threshold: 25, status: 'low' },
    { id: 'PPE-004', item: 'Work Gloves', quantity: 15, threshold: 20, status: 'low' },
    { id: 'PPE-005', item: 'Steel-Toe Boots', quantity: 28, threshold: 30, status: 'low' }
  ]);

  const [safetyMeetings] = useState([
    {
      id: 'MEET-001',
      date: new Date('2024-04-22'),
      topic: 'Spring Safety Review',
      attendees: 24,
      duration: 45,
      nextDate: new Date('2024-05-06')
    },
    {
      id: 'MEET-002',
      date: new Date('2024-04-15'),
      topic: 'Electrical Safety',
      attendees: 18,
      duration: 30,
      nextDate: new Date('2024-04-29')
    }
  ]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const stats = {
    incidents: incidents.length,
    openIncidents: incidents.filter(i => i.status === 'open').length,
    trainingsCompleted: trainings.filter(t => t.status === 'completed').length,
    ppeStatus: ppeInventory.filter(p => p.status === 'low').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Safety Compliance
          </h1>
          <p className="text-slate-600 mt-1">Incidents, training, and OSHA compliance</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Report Incident
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Incidents</p>
            <p className="text-2xl font-bold mt-2">{stats.incidents}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Open Incidents</p>
            <p className="text-2xl font-bold mt-2 text-red-600">{stats.openIncidents}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Trainings Completed</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.trainingsCompleted}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">PPE Low Stock</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.ppeStatus}</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className={`p-4 border rounded-lg ${getSeverityColor(incident.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{incident.type}</h3>
                  <p className="text-sm mt-1">{incident.description}</p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {incident.status === 'open' ? 'OPEN' : 'CLOSED'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm border-t border-current border-opacity-20 pt-2 mt-2">
                <div>
                  <p className="opacity-75">Date</p>
                  <p className="font-medium">{incident.date.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="opacity-75">Location</p>
                  <p className="font-medium">{incident.location}</p>
                </div>
                <div>
                  <p className="opacity-75">Reporter</p>
                  <p className="font-medium">{incident.reporter}</p>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-current border-opacity-20 text-sm">
                <p className="opacity-75">Action Taken:</p>
                <p className="font-medium">{incident.action}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Safety Training */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Training Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {trainings.map((training) => (
            <div key={training.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{training.name}</p>
                {training.status === 'completed' && (
                  <p className="text-xs text-slate-600">
                    Expires: {training.expiry?.toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge
                variant={training.status === 'completed' ? 'default' : 'outline'}
                className={training.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}
              >
                {training.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {training.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                {training.status === 'completed' ? 'COMPLETED' : 'PENDING'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PPE Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>PPE Inventory Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ppeInventory.map((ppe) => (
            <div key={ppe.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{ppe.item}</p>
                <Badge
                  variant={ppe.status === 'adequate' ? 'default' : 'outline'}
                  className={ppe.status === 'adequate' ? 'bg-green-600' : 'bg-yellow-600'}
                >
                  {ppe.status === 'adequate' ? 'ADEQUATE' : 'LOW STOCK'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-600">
                  In Stock: {ppe.quantity} | Threshold: {ppe.threshold}
                </p>
                <div className="w-24 h-2 bg-slate-200 rounded-full">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      ppe.quantity >= ppe.threshold ? 'bg-green-600' : 'bg-yellow-600'
                    }`}
                    style={{ width: `${Math.min((ppe.quantity / ppe.threshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Safety Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Meetings Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {safetyMeetings.map((meeting) => (
            <div key={meeting.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{meeting.topic}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {meeting.attendees} attendees • {meeting.duration} minutes
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                <div>
                  <p className="text-xs text-slate-600">Last Meeting</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {meeting.date.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Next Meeting</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {meeting.nextDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
