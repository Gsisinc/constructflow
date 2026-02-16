import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MapPin,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function EquipmentInventory() {
  const [equipment] = useState([
    {
      id: 'EQ-001',
      name: 'Excavator CAT 320',
      category: 'Heavy Equipment',
      type: 'Excavator',
      serialNumber: 'CAT-320-2019-001',
      status: 'in-use',
      location: 'Main Site - East Wing',
      operator: 'John Davis',
      purchaseDate: new Date('2019-06-15'),
      purchasePrice: 450000,
      currentValue: 320000,
      hoursUsed: 4250,
      lastMaintenance: new Date('2024-03-20'),
      nextMaintenance: new Date('2024-06-20'),
      condition: 'excellent',
      fuelLevel: 85
    },
    {
      id: 'EQ-002',
      name: 'Concrete Pump Truck',
      category: 'Concrete Equipment',
      type: 'Pump Truck',
      serialNumber: 'PUMP-2020-045',
      status: 'in-use',
      location: 'Main Site - All Areas',
      operator: 'Sarah Johnson',
      purchaseDate: new Date('2020-03-10'),
      purchasePrice: 380000,
      currentValue: 290000,
      hoursUsed: 2100,
      lastMaintenance: new Date('2024-04-10'),
      nextMaintenance: new Date('2024-07-10'),
      condition: 'good',
      fuelLevel: 60
    },
    {
      id: 'EQ-003',
      name: 'Crane - 50 Ton',
      category: 'Heavy Equipment',
      type: 'Mobile Crane',
      serialNumber: 'CRANE-50-2018-002',
      status: 'maintenance',
      location: 'Equipment Yard',
      operator: 'Mike Davis',
      purchaseDate: new Date('2018-09-22'),
      purchasePrice: 520000,
      currentValue: 350000,
      hoursUsed: 5800,
      lastMaintenance: new Date('2024-04-01'),
      nextMaintenance: new Date('2024-07-01'),
      condition: 'fair',
      fuelLevel: 0
    },
    {
      id: 'EQ-004',
      name: 'Compressor - 185 CFM',
      category: 'Air Equipment',
      type: 'Air Compressor',
      serialNumber: 'COMP-185-2021-008',
      status: 'available',
      location: 'Equipment Yard',
      operator: null,
      purchaseDate: new Date('2021-01-15'),
      purchasePrice: 45000,
      currentValue: 32000,
      hoursUsed: 1200,
      lastMaintenance: new Date('2024-02-15'),
      nextMaintenance: new Date('2024-08-15'),
      condition: 'excellent',
      fuelLevel: 0
    },
    {
      id: 'EQ-005',
      name: 'Scaffolding Set - 500 Pieces',
      category: 'Safety Equipment',
      type: 'Scaffolding',
      serialNumber: 'SCAF-500-2020-001',
      status: 'in-use',
      location: 'Main Site - East Wing',
      operator: 'Safety Team',
      purchaseDate: new Date('2020-05-20'),
      purchasePrice: 85000,
      currentValue: 60000,
      hoursUsed: 0,
      lastMaintenance: new Date('2024-03-15'),
      nextMaintenance: new Date('2024-09-15'),
      condition: 'good',
      fuelLevel: 0
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['Heavy Equipment', 'Concrete Equipment', 'Air Equipment', 'Safety Equipment', 'Tools', 'Vehicles'];

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || eq.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || eq.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in-use':
        return { label: 'In Use', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 };
      case 'available':
        return { label: 'Available', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      case 'maintenance':
        return { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'retired':
        return { label: 'Retired', color: 'bg-slate-100 text-slate-800', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-800', icon: AlertCircle };
    }
  };

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const stats = {
    total: equipment.length,
    inUse: equipment.filter(eq => eq.status === 'in-use').length,
    available: equipment.filter(eq => eq.status === 'available').length,
    maintenance: equipment.filter(eq => eq.status === 'maintenance').length,
    totalValue: equipment.reduce((sum, eq) => sum + eq.currentValue, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="w-8 h-8 text-blue-600" />
            Equipment Inventory
          </h1>
          <p className="text-slate-600 mt-1">Track all company-owned equipment and assets</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Equipment</p>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">In Use</p>
            <p className="text-2xl font-bold mt-2 text-blue-600">{stats.inUse}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Available</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.available}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Maintenance</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.maintenance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Value</p>
            <p className="text-2xl font-bold mt-2">${(stats.totalValue / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search equipment by name or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <div className="space-y-3">
        {filteredEquipment.map((eq) => {
          const statusInfo = getStatusBadge(eq.status);
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={eq.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{eq.name}</h3>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Badge className={getConditionBadge(eq.condition)}>
                        {eq.condition.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {eq.category} • Serial: {eq.serialNumber}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-slate-600">Current Value</p>
                    <p className="text-2xl font-bold text-blue-600">${(eq.currentValue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-slate-500">Purchase: ${(eq.purchasePrice / 1000).toFixed(0)}K</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 py-4 border-y">
                  <div>
                    <p className="text-xs text-slate-600">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {eq.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Operator</p>
                    <p className="font-medium flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {eq.operator || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Hours Used</p>
                    <p className="font-medium">{eq.hoursUsed.toLocaleString()} hrs</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Fuel Level</p>
                    <p className="font-medium">{eq.fuelLevel}%</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Last Maint: {eq.lastMaintenance.toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Next Maint: {eq.nextMaintenance.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
