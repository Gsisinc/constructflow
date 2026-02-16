import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Wrench,
  MapPin,
  Clock,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';

export default function EquipmentTracking() {
  const [equipment, setEquipment] = useState([
    {
      id: 'EQ-001',
      name: 'Excavator CAT 320',
      type: 'Heavy Equipment',
      serialNumber: 'SN-2024-001',
      location: 'Project A - Site 1',
      status: 'active',
      lastLocation: { lat: 40.7128, lng: -74.0060, timestamp: new Date() },
      hoursUsed: 1240,
      maintenanceDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      costPerHour: 85,
      totalCost: 105400,
      operator: 'John Smith',
      condition: 'good',
      fuelLevel: 75
    },
    {
      id: 'EQ-002',
      name: 'Concrete Mixer',
      type: 'Mixing Equipment',
      serialNumber: 'SN-2024-002',
      location: 'Project B - Warehouse',
      status: 'idle',
      lastLocation: { lat: 40.7580, lng: -73.9855, timestamp: new Date() },
      hoursUsed: 420,
      maintenanceDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      lastMaintenance: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      costPerHour: 25,
      totalCost: 10500,
      operator: 'Idle',
      condition: 'good',
      fuelLevel: 30
    },
    {
      id: 'EQ-003',
      name: 'Scaffolding Set',
      type: 'Safety Equipment',
      serialNumber: 'SN-2024-003',
      location: 'Project C - Building 5',
      status: 'active',
      lastLocation: { lat: 40.7489, lng: -73.9680, timestamp: new Date() },
      hoursUsed: 0,
      maintenanceDue: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      costPerHour: 0,
      totalCost: 3500,
      operator: 'N/A',
      condition: 'excellent',
      fuelLevel: 100
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: '',
    serialNumber: '',
    location: '',
    costPerHour: 0,
    operator: '',
    condition: 'good'
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const equipmentTypes = [
    'Heavy Equipment',
    'Mixing Equipment',
    'Safety Equipment',
    'Power Tools',
    'Scaffolding',
    'Compressors',
    'Generators'
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'idle', label: 'Idle', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
    { value: 'retired', label: 'Retired', color: 'bg-red-100 text-red-800' }
  ];

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', color: 'text-green-600' },
    { value: 'good', label: 'Good', color: 'text-blue-600' },
    { value: 'fair', label: 'Fair', color: 'text-yellow-600' },
    { value: 'poor', label: 'Poor', color: 'text-red-600' }
  ];

  const handleAddEquipment = () => {
    if (newEquipment.name && newEquipment.type) {
      const equipment = {
        id: `EQ-${String(equipment.length + 1).padStart(3, '0')}`,
        ...newEquipment,
        hoursUsed: 0,
        maintenanceDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastMaintenance: new Date(),
        totalCost: 0,
        status: 'active',
        lastLocation: { lat: 0, lng: 0, timestamp: new Date() },
        fuelLevel: 100
      };
      setEquipment([...equipment, equipment]);
      setNewEquipment({
        name: '',
        type: '',
        serialNumber: '',
        location: '',
        costPerHour: 0,
        operator: '',
        condition: 'good'
      });
      setShowAddForm(false);
    }
  };

  const handleUpdateLocation = (equipmentId, location) => {
    setEquipment(equipment.map(eq =>
      eq.id === equipmentId
        ? {
            ...eq,
            lastLocation: {
              ...location,
              timestamp: new Date()
            }
          }
        : eq
    ));
  };

  const handleLogMaintenance = (equipmentId) => {
    setEquipment(equipment.map(eq =>
      eq.id === equipmentId
        ? {
            ...eq,
            lastMaintenance: new Date(),
            maintenanceDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'active'
          }
        : eq
    ));
  };

  const handleDeleteEquipment = (equipmentId) => {
    setEquipment(equipment.filter(eq => eq.id !== equipmentId));
  };

  const filteredEquipment = equipment.filter(eq => {
    const statusMatch = filterStatus === 'all' || eq.status === filterStatus;
    const typeMatch = filterType === 'all' || eq.type === filterType;
    return statusMatch && typeMatch;
  });

  const stats = {
    total: equipment.length,
    active: equipment.filter(eq => eq.status === 'active').length,
    maintenanceDue: equipment.filter(eq => {
      const daysUntil = (eq.maintenanceDue - new Date()) / (1000 * 60 * 60 * 24);
      return daysUntil <= 7 && daysUntil > 0;
    }).length,
    totalValue: equipment.reduce((sum, eq) => sum + eq.totalCost, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="w-8 h-8 text-orange-600" />
            Equipment Tracking
          </h1>
          <p className="text-slate-600 mt-1">Monitor equipment location, usage, and maintenance status</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <div className="text-2xl font-bold mt-2">{stats.total}</div>
            <p className="text-xs text-slate-600 mt-2">All equipment in fleet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Active Units</CardTitle>
            <div className="text-2xl font-bold mt-2 text-green-600">{stats.active}</div>
            <p className="text-xs text-slate-600 mt-2">Currently in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <div className="text-2xl font-bold mt-2 text-orange-600">{stats.maintenanceDue}</div>
            <p className="text-xs text-slate-600 mt-2">Next 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Fleet Value</CardTitle>
            <div className="text-2xl font-bold mt-2">${(stats.totalValue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-slate-600 mt-2">Total asset value</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Equipment Form */}
      {showAddForm && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Add New Equipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Equipment Name</label>
                <Input
                  placeholder="e.g., Excavator CAT 320"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={newEquipment.type} onValueChange={(value) => setNewEquipment({ ...newEquipment, type: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Serial Number</label>
                <Input
                  placeholder="e.g., SN-2024-001"
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g., Project A - Site 1"
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cost Per Hour ($)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newEquipment.costPerHour}
                  onChange={(e) => setNewEquipment({ ...newEquipment, costPerHour: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Operator</label>
                <Input
                  placeholder="e.g., John Smith"
                  value={newEquipment.operator}
                  onChange={(e) => setNewEquipment({ ...newEquipment, operator: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddEquipment}>Add Equipment</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Filter by Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Filter by Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {equipmentTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Equipment List */}
      <div className="space-y-4">
        {filteredEquipment.map(eq => (
          <Card key={eq.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{eq.name}</h3>
                      <p className="text-sm text-slate-600">{eq.serialNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {/* Status */}
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Status</p>
                      <Badge className={statusOptions.find(s => s.value === eq.status)?.color || 'bg-slate-100'}>
                        {statusOptions.find(s => s.value === eq.status)?.label || eq.status}
                      </Badge>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Type</p>
                      <p className="font-medium">{eq.type}</p>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Location</p>
                        <p className="font-medium text-sm">{eq.location}</p>
                      </div>
                    </div>

                    {/* Hours Used */}
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Hours Used</p>
                      <p className="font-medium">{eq.hoursUsed.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    {/* Maintenance Status */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <p className="text-xs text-slate-600">Maintenance Due</p>
                      </div>
                      <p className="font-medium text-sm">
                        {eq.maintenanceDue.toLocaleDateString()}
                      </p>
                      {(eq.maintenanceDue - new Date()) / (1000 * 60 * 60 * 24) <= 7 && (
                        <Badge className="bg-red-100 text-red-800 mt-1">Overdue Soon</Badge>
                      )}
                    </div>

                    {/* Condition */}
                    <div>
                      <p className="text-xs text-slate-600 mb-2">Condition</p>
                      <p className={`font-medium ${conditionOptions.find(c => c.value === eq.condition)?.color}`}>
                        {eq.condition.charAt(0).toUpperCase() + eq.condition.slice(1)}
                      </p>
                    </div>

                    {/* Operator */}
                    <div>
                      <p className="text-xs text-slate-600 mb-2">Operator</p>
                      <p className="font-medium text-sm">{eq.operator}</p>
                    </div>

                    {/* Total Cost */}
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-green-600 mt-1" />
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Total Cost</p>
                        <p className="font-medium">${eq.totalCost.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogMaintenance(eq.id)}
                    className="gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Log Maintenance
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEquipment(eq.id)}
                    className="gap-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No equipment found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
