import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Camera,
  FileText,
  Plus,
  MapPin,
  Calendar,
  User,
  Zap,
  BarChart3
} from 'lucide-react';

export default function QualityAssurance() {
  const [inspections] = useState([
    {
      id: 'INSP-001',
      type: 'Foundation Inspection',
      date: new Date('2024-04-10'),
      inspector: 'John Smith',
      location: 'East Wing',
      status: 'passed',
      defects: 0,
      photos: 12,
      notes: 'All measurements within tolerance. Concrete strength verified.'
    },
    {
      id: 'INSP-002',
      type: 'Framing Inspection',
      date: new Date('2024-04-15'),
      inspector: 'Sarah Johnson',
      location: 'Main Area',
      status: 'passed_with_notes',
      defects: 2,
      photos: 18,
      notes: 'Minor spacing issues on 3rd floor. Corrected during inspection.'
    },
    {
      id: 'INSP-003',
      type: 'Electrical Rough-in',
      date: new Date('2024-04-20'),
      inspector: 'Mike Davis',
      location: 'All Areas',
      status: 'failed',
      defects: 5,
      photos: 24,
      notes: 'Wire gauge issues in panel room. Requires rework.'
    }
  ]);

  const [defects] = useState([
    {
      id: 'DEF-001',
      title: 'Concrete Spalling',
      severity: 'medium',
      location: 'Foundation - North Wall',
      discoveredDate: new Date('2024-04-10'),
      status: 'open',
      photos: 3,
      description: 'Surface spalling on concrete foundation'
    },
    {
      id: 'DEF-002',
      title: 'Framing Misalignment',
      severity: 'low',
      location: 'Frame - 3rd Floor',
      discoveredDate: new Date('2024-04-15'),
      status: 'resolved',
      photos: 2,
      description: 'Minor spacing deviation corrected'
    },
    {
      id: 'DEF-003',
      title: 'Electrical Wire Gauge',
      severity: 'high',
      location: 'Electrical - Panel Room',
      discoveredDate: new Date('2024-04-20'),
      status: 'in_progress',
      photos: 5,
      description: 'Incorrect wire gauge in main panel'
    }
  ]);

  const [punchList] = useState([
    { id: 'PUNCH-001', item: 'Paint touch-ups', area: 'All Rooms', status: 'pending', priority: 'low' },
    { id: 'PUNCH-002', item: 'Door hardware installation', area: 'Doors', status: 'in_progress', priority: 'medium' },
    { id: 'PUNCH-003', item: 'Final HVAC balancing', area: 'HVAC System', status: 'pending', priority: 'high' },
    { id: 'PUNCH-004', item: 'Landscaping', area: 'Exterior', status: 'pending', priority: 'low' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'passed_with_notes':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

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
    totalInspections: inspections.length,
    passed: inspections.filter(i => i.status === 'passed').length,
    defects: defects.filter(d => d.status === 'open' || d.status === 'in_progress').length,
    punchListItems: punchList.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
            Quality Assurance
          </h1>
          <p className="text-slate-600 mt-1">Inspections, defect tracking, and punch lists</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Inspection
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Inspections</p>
            <p className="text-2xl font-bold mt-2">{stats.totalInspections}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Passed</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.passed}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Open Defects</p>
            <p className="text-2xl font-bold mt-2 text-red-600">{stats.defects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Punch List Items</p>
            <p className="text-2xl font-bold mt-2">{stats.punchListItems}</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inspections.map((insp) => (
            <div key={insp.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{insp.type}</h3>
                    <Badge className={getStatusColor(insp.status)}>
                      {insp.status === 'passed' && 'PASSED'}
                      {insp.status === 'passed_with_notes' && 'PASSED WITH NOTES'}
                      {insp.status === 'failed' && 'FAILED'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{insp.notes}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm border-t pt-3">
                <div>
                  <p className="text-xs text-slate-600">Inspector</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {insp.inspector}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {insp.date.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {insp.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Photos</p>
                  <p className="font-medium flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {insp.photos}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Defects */}
      <Card>
        <CardHeader>
          <CardTitle>Defect Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {defects.map((defect) => (
            <div key={defect.id} className={`p-4 border rounded-lg ${getSeverityColor(defect.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{defect.title}</h3>
                  <p className="text-sm mt-1">{defect.description}</p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {defect.status === 'open' && 'OPEN'}
                  {defect.status === 'in_progress' && 'IN PROGRESS'}
                  {defect.status === 'resolved' && 'RESOLVED'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm border-t border-current border-opacity-20 pt-2 mt-2">
                <div>
                  <p className="opacity-75">Location</p>
                  <p className="font-medium">{defect.location}</p>
                </div>
                <div>
                  <p className="opacity-75">Discovered</p>
                  <p className="font-medium">{defect.discoveredDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="opacity-75">Photos</p>
                  <p className="font-medium flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {defect.photos}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Punch List */}
      <Card>
        <CardHeader>
          <CardTitle>Punch List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {punchList.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.item}</p>
                <p className="text-xs text-slate-600">{item.area}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={item.priority === 'high' ? 'default' : 'outline'}
                  className={item.priority === 'high' ? 'bg-red-600' : ''}
                >
                  {item.priority.toUpperCase()}
                </Badge>
                <Badge
                  variant={item.status === 'in_progress' ? 'default' : 'outline'}
                  className={item.status === 'in_progress' ? 'bg-blue-600' : ''}
                >
                  {item.status === 'pending' && 'PENDING'}
                  {item.status === 'in_progress' && 'IN PROGRESS'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
