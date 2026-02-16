import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  Zap
} from 'lucide-react';

export default function RegulatoryIntelligence() {
  const [permits] = useState([
    {
      id: 'PERMIT-001',
      type: 'Building Permit',
      number: 'BP-2024-001234',
      status: 'approved',
      location: 'Main Site - East Wing',
      issuedDate: new Date('2024-01-15'),
      expiryDate: new Date('2025-01-15'),
      cost: 2500,
      inspections: [
        { name: 'Foundation', status: 'passed', date: new Date('2024-02-10') },
        { name: 'Framing', status: 'passed', date: new Date('2024-03-15') },
        { name: 'Electrical Rough-in', status: 'scheduled', date: new Date('2024-05-01') }
      ],
      documents: 3
    },
    {
      id: 'PERMIT-002',
      type: 'Electrical Permit',
      number: 'EP-2024-005678',
      status: 'pending',
      location: 'Main Site - All Areas',
      issuedDate: new Date('2024-02-01'),
      expiryDate: new Date('2025-02-01'),
      cost: 1200,
      inspections: [
        { name: 'Rough-in', status: 'pending', date: new Date('2024-05-15') }
      ],
      documents: 2
    },
    {
      id: 'PERMIT-003',
      type: 'Mechanical Permit',
      number: 'MP-2024-009012',
      status: 'approved',
      location: 'Main Site - HVAC',
      issuedDate: new Date('2024-02-10'),
      expiryDate: new Date('2025-02-10'),
      cost: 800,
      inspections: [
        { name: 'Ductwork', status: 'passed', date: new Date('2024-04-01') }
      ],
      documents: 2
    }
  ]);

  const [codeLibrary] = useState([
    { id: 'NEC-2023-001', code: 'NEC 2023', section: '110.26', title: 'Spaces About Electrical Equipment', category: 'Electrical' },
    { id: 'IBC-2023-001', code: 'IBC 2023', section: '3401', title: 'General Requirements for Fire-Resistance Rated Construction', category: 'Fire Safety' },
    { id: 'LOCAL-CA-001', code: 'California Title 24', section: '5.4.1', title: 'Mandatory Measures - Lighting', category: 'Energy' }
  ]);

  const [permitCosts] = useState([
    { type: 'Building Permit', baseCost: 2500, percentage: 0.5 },
    { type: 'Electrical Permit', baseCost: 1200, percentage: 0.2 },
    { type: 'Mechanical Permit', baseCost: 800, percentage: 0.15 },
    { type: 'Plumbing Permit', baseCost: 600, percentage: 0.15 }
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'expired':
        return { label: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-800', icon: AlertCircle };
    }
  };

  const stats = {
    total: permits.length,
    approved: permits.filter(p => p.status === 'approved').length,
    pending: permits.filter(p => p.status === 'pending').length,
    totalCost: permits.reduce((sum, p) => sum + p.cost, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Regulatory Intelligence
          </h1>
          <p className="text-slate-600 mt-1">Permits, compliance, and code tracking</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Permit
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Permits</p>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Approved</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Pending</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Cost</p>
            <p className="text-2xl font-bold mt-2">${(stats.totalCost / 1000).toFixed(1)}K</p>
          </CardContent>
        </Card>
      </div>

      {/* Permits List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Permits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {permits.map((permit) => {
            const statusInfo = getStatusBadge(permit.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={permit.id} className="p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{permit.type}</h3>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">Permit #: {permit.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">${permit.cost.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 py-3 border-y text-sm">
                  <div>
                    <p className="text-xs text-slate-600">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {permit.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Issued</p>
                    <p className="font-medium">{permit.issuedDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Expires</p>
                    <p className="font-medium">{permit.expiryDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Inspections</p>
                    <p className="font-medium">{permit.inspections.length}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold">Inspections:</p>
                  {permit.inspections.map((insp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                      <span>{insp.name}</span>
                      <Badge variant={insp.status === 'passed' ? 'default' : 'outline'}>
                        {insp.status === 'passed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {insp.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {insp.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Code Library */}
      <Card>
        <CardHeader>
          <CardTitle>Code Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {codeLibrary.map((code) => (
              <div key={code.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{code.code} - Section {code.section}</p>
                  <p className="text-xs text-slate-600">{code.title}</p>
                </div>
                <Badge variant="outline">{code.category}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permit Cost Estimation */}
      <Card>
        <CardHeader>
          <CardTitle>Permit Cost Estimation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {permitCosts.map((cost, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{cost.type}</p>
                  <p className="text-xs text-slate-600">{(cost.percentage * 100).toFixed(0)}% of total</p>
                </div>
                <p className="font-bold text-blue-600">${cost.baseCost.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
