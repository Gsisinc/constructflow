import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, MapPin, Wrench, Clock, DollarSign, TrendingUp } from 'lucide-react';

export default function EquipmentTracking() {
  const [equipment, setEquipment] = useState([
    {
      id: 1,
      name: 'Excavator CAT 320',
      type: 'Heavy Equipment',
      serialNumber: 'CAT-320-001',
      location: 'Project A - Foundation Area',
      status: 'in-use',
      currentProject: 'Project A',
      hourMeter: 2450,
      dailyRate: 350,
      lastMaintenance: '2026-02-10',
      nextMaintenance: '2026-03-10',
      utilization: 85,
      maintenance_due: false,
    },
    {
      id: 2,
      name: 'Concrete Pump',
      type: 'Specialized Equipment',
      serialNumber: 'PUMP-001',
      location: 'Project B - Framing',
      status: 'in-use',
      currentProject: 'Project B',
      hourMeter: 180,
      dailyRate: 450,
      lastMaintenance: '2026-01-15',
      nextMaintenance: '2026-04-15',
      utilization: 92,
      maintenance_due: false,
    },
    {
      id: 3,
      name: 'Scaffolding System',
      type: 'Safety Equipment',
      serialNumber: 'SCAF-001-100',
      location: 'Warehouse - Idle',
      status: 'idle',
      currentProject: null,
      hourMeter: 0,
      dailyRate: 150,
      lastMaintenance: '2026-02-05',
      nextMaintenance: '2026-02-20',
      utilization: 0,
      maintenance_due: true,
    },
    {
      id: 4,
      name: 'Generator 100kW',
      type: 'Power Equipment',
      serialNumber: 'GEN-100-005',
      location: 'Project C - Site Office',
      status: 'in-use',
      currentProject: 'Project C',
      hourMeter: 890,
      dailyRate: 200,
      lastMaintenance: '2026-02-01',
      nextMaintenance: '2026-03-01',
      utilization: 65,
      maintenance_due: false,
    },
  ]);

  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [maintenanceLog, setMaintenanceLog] = useState([
    { date: '2026-02-10', equipment: 'Excavator CAT 320', work: 'Oil change and filter replacement', cost: 450 },
    { date: '2026-02-05', equipment: 'Scaffolding System', work: 'Safety inspection', cost: 200 },
    { date: '2026-02-01', equipment: 'Generator 100kW', work: 'Fuel system cleaning', cost: 350 },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in-use':
        return <Badge className="bg-green-100 text-green-800">In Use</Badge>;
      case 'idle':
        return <Badge className="bg-gray-100 text-gray-800">Idle</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">In Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalEquipmentValue = equipment.reduce((sum, item) => sum + (item.dailyRate * 250), 0);
  const totalUtilization = equipment.reduce((sum, item) => sum + item.utilization, 0) / equipment.length;
  const maintenanceDueCount = equipment.filter(e => e.maintenance_due).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Equipment Tracking</h1>
        <p className="text-gray-600 mt-2">
          Monitor equipment location, usage, utilization, and schedule maintenance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
            <p className="text-xs text-gray-600 mt-2">Assets tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {equipment.filter(e => e.status === 'in-use').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Active equipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalUtilization)}%</div>
            <p className="text-xs text-gray-600 mt-2">Fleet capacity usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenanceDueCount}</div>
            <p className="text-xs text-gray-600 mt-2">Items needing service</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="tracking">Location Tracking</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="costs">Costs & Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>Complete list of equipment with current status and location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipment.map(item => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedEquipment(item)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.serialNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {item.maintenance_due && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle size={12} className="mr-1" />
                            Due
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type</span>
                        <p className="font-medium">{item.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Location</span>
                        <p className="font-medium text-xs">{item.location}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Hours</span>
                        <p className="font-medium">{item.hourMeter}h</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Daily Rate</span>
                        <p className="font-medium">${item.dailyRate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Location Map</CardTitle>
              <CardDescription>Real-time tracking of equipment across projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipment.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-blue-600" />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Last Updated</p>
                    <p className="text-sm font-medium">Today, 2:30 PM</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipment
                  .filter(e => !e.maintenance_due)
                  .map(item => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Next service: {item.nextMaintenance}
                      </p>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Maintenance Due Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipment
                  .filter(e => e.maintenance_due)
                  .map(item => (
                    <div key={item.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-red-900">{item.name}</h4>
                        <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                      </div>
                      <p className="text-xs text-red-700">
                        Last service: {item.lastMaintenance}
                      </p>
                      <Button size="sm" className="mt-2 w-full" variant="outline">
                        <Wrench size={14} className="mr-1" />
                        Schedule Service
                      </Button>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceLog.map((log, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 border-b last:border-b-0">
                    <div>
                      <p className="font-semibold text-sm">{log.equipment}</p>
                      <p className="text-xs text-gray-600 mt-1">{log.work}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${log.cost}</p>
                      <p className="text-xs text-gray-600">{log.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalEquipmentValue / 1000).toFixed(0)}K</div>
                <p className="text-xs text-gray-600 mt-2">Estimated annual value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Monthly Rental Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${equipment
                    .filter(e => e.status === 'in-use')
                    .reduce((sum, e) => sum + e.dailyRate * 30, 0)}
                </div>
                <p className="text-xs text-gray-600 mt-2">Active fleet cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Utilization ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totalUtilization)}%</div>
                <p className="text-xs text-gray-600 mt-2">Fleet efficiency rating</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Utilization Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipment.map(item => {
                const utilizationStatus =
                  item.utilization > 80
                    ? 'Excellent'
                    : item.utilization > 60
                    ? 'Good'
                    : item.utilization > 30
                    ? 'Fair'
                    : 'Poor';

                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{item.utilization}%</p>
                        <Badge
                          className={
                            item.utilization > 80
                              ? 'bg-green-100 text-green-800'
                              : item.utilization > 60
                              ? 'bg-blue-100 text-blue-800'
                              : item.utilization > 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {utilizationStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.utilization > 80
                            ? 'bg-green-500'
                            : item.utilization > 60
                            ? 'bg-blue-500'
                            : item.utilization > 30
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${item.utilization}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedEquipment && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>{selectedEquipment.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Serial Number</label>
              <p className="mt-2 font-semibold">{selectedEquipment.serialNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Type</label>
              <p className="mt-2 font-semibold">{selectedEquipment.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="mt-2">{getStatusBadge(selectedEquipment.status)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Daily Rate</label>
              <p className="mt-2 font-semibold">${selectedEquipment.dailyRate}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Hour Meter</label>
              <p className="mt-2 font-semibold">{selectedEquipment.hourMeter} hours</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Current Project</label>
              <p className="mt-2 font-semibold">
                {selectedEquipment.currentProject || 'Not assigned'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Utilization</label>
              <p className="mt-2 font-semibold">{selectedEquipment.utilization}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Last Maintenance</label>
              <p className="mt-2 font-semibold">{selectedEquipment.lastMaintenance}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
