import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  MapPin,
  Thermometer,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Wifi,
  TrendingUp,
  Eye,
  Settings
} from 'lucide-react';

export default function IoTMonitoring() {
  const [equipmentStatus] = useState([
    {
      id: 'IOT-001',
      name: 'Excavator CAT 320',
      type: 'Heavy Equipment',
      status: 'active',
      location: { lat: 37.7749, lng: -122.4194, address: 'Main Site - East Wing' },
      temperature: 68,
      humidity: 45,
      dustLevel: 12,
      fuelLevel: 85,
      engineHours: 4250,
      lastUpdate: new Date(),
      signalStrength: 95,
      predictedFailure: null
    },
    {
      id: 'IOT-002',
      name: 'Concrete Pump Truck',
      type: 'Concrete Equipment',
      status: 'active',
      location: { lat: 37.7750, lng: -122.4195, address: 'Main Site - All Areas' },
      temperature: 72,
      humidity: 52,
      dustLevel: 8,
      fuelLevel: 60,
      engineHours: 2100,
      lastUpdate: new Date(),
      signalStrength: 88,
      predictedFailure: null
    },
    {
      id: 'IOT-003',
      name: 'Crane - 50 Ton',
      type: 'Mobile Crane',
      status: 'maintenance',
      location: { lat: 37.7751, lng: -122.4196, address: 'Equipment Yard' },
      temperature: 45,
      humidity: 38,
      dustLevel: 5,
      fuelLevel: 0,
      engineHours: 5800,
      lastUpdate: new Date(Date.now() - 3600000),
      signalStrength: 0,
      predictedFailure: 'Hydraulic pump - 7 days'
    }
  ]);

  const [environmentalData] = useState({
    temperature: 68,
    humidity: 48,
    dustLevel: 15,
    noiseLevel: 82,
    windSpeed: 12,
    safetyAlerts: 2
  });

  const [workers] = useState([
    { id: 'W-001', name: 'John Smith', status: 'on-site', location: 'East Wing', clockedIn: '7:00 AM' },
    { id: 'W-002', name: 'Sarah Johnson', status: 'on-site', location: 'Main Area', clockedIn: '7:15 AM' },
    { id: 'W-003', name: 'Mike Davis', status: 'off-site', location: 'Office', clockedIn: '8:00 AM' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'off-site':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            IoT Monitoring & Real-time Tracking
          </h1>
          <p className="text-slate-600 mt-1">Equipment health, environmental conditions, and worker tracking</p>
        </div>
      </div>

      {/* Environmental Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Site Environmental Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Thermometer className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-sm text-slate-600">Temperature</p>
              <p className="text-2xl font-bold">{environmentalData.temperature}°F</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <Wind className="w-5 h-5 text-cyan-600 mb-2" />
              <p className="text-sm text-slate-600">Humidity</p>
              <p className="text-2xl font-bold">{environmentalData.humidity}%</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
              <p className="text-sm text-slate-600">Dust Level</p>
              <p className="text-2xl font-bold">{environmentalData.dustLevel} µg/m³</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Activity className="w-5 h-5 text-orange-600 mb-2" />
              <p className="text-sm text-slate-600">Noise Level</p>
              <p className="text-2xl font-bold">{environmentalData.noiseLevel} dB</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Wind className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-sm text-slate-600">Wind Speed</p>
              <p className="text-2xl font-bold">{environmentalData.windSpeed} mph</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
              <p className="text-sm text-slate-600">Safety Alerts</p>
              <p className="text-2xl font-bold">{environmentalData.safetyAlerts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Real-time Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipment Real-time Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipmentStatus.map((equipment) => (
            <div key={equipment.id} className="p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{equipment.name}</h3>
                    <Badge className={getStatusColor(equipment.status)}>
                      {equipment.status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {equipment.status === 'maintenance' && <Clock className="w-3 h-3 mr-1" />}
                      {equipment.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {equipment.location.address}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Wifi className="w-4 h-4" />
                    <span className={equipment.signalStrength > 0 ? 'text-green-600' : 'text-red-600'}>
                      {equipment.signalStrength}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Updated {Math.round((Date.now() - equipment.lastUpdate) / 60000)} min ago
                  </p>
                </div>
              </div>

              {equipment.predictedFailure && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Predicted failure: {equipment.predictedFailure}
                </div>
              )}

              <div className="grid grid-cols-5 gap-2">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Temperature</p>
                  <p className="font-semibold">{equipment.temperature}°F</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Humidity</p>
                  <p className="font-semibold">{equipment.humidity}%</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Dust</p>
                  <p className="font-semibold">{equipment.dustLevel} µg/m³</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Fuel</p>
                  <p className="font-semibold">{equipment.fuelLevel}%</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600">Engine Hours</p>
                  <p className="font-semibold">{equipment.engineHours}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Worker Geo-fencing & Time Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worker Geo-fencing & Time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workers.map((worker) => (
            <div key={worker.id} className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{worker.name}</h4>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {worker.location}
                </p>
              </div>
              <div className="text-right">
                <Badge className={worker.status === 'on-site' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                  {worker.status === 'on-site' ? 'ON SITE' : 'OFF SITE'}
                </Badge>
                <p className="text-sm text-slate-600 mt-1">Clocked in: {worker.clockedIn}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Predictive Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Predictive Maintenance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {equipmentStatus
              .filter(eq => eq.predictedFailure)
              .map((eq) => (
                <div key={eq.id} className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-sm">{eq.name}</p>
                      <p className="text-xs text-slate-600">{eq.predictedFailure}</p>
                    </div>
                  </div>
                  <Button size="sm" className="gap-1">
                    <Settings className="w-4 h-4" />
                    Schedule
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
