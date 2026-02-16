import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  TrendingDown,
  Zap,
  Droplets,
  Wind,
  BarChart3,
  Award,
  Calendar
} from 'lucide-react';

export default function SustainabilityOptimization() {
  const [carbonFootprint] = useState({
    total: 450,
    materials: 280,
    transportation: 120,
    energy: 50,
    unit: 'metric tons CO2e',
    target: 400
  });

  const [materials] = useState([
    {
      id: 'MAT-001',
      name: 'Recycled Steel Beams',
      epd: 'EPD-2024-001',
      carbonFootprint: 2.1,
      recycledContent: 85,
      certified: true
    },
    {
      id: 'MAT-002',
      name: 'Low-VOC Paint',
      epd: 'EPD-2024-002',
      carbonFootprint: 0.8,
      recycledContent: 0,
      certified: true
    },
    {
      id: 'MAT-003',
      name: 'Concrete (40% Fly Ash)',
      epd: 'EPD-2024-003',
      carbonFootprint: 0.35,
      recycledContent: 40,
      certified: true
    }
  ]);

  const [certifications] = useState([
    {
      id: 'CERT-001',
      type: 'LEED v4.1',
      target: 'Gold',
      progress: 78,
      status: 'in_progress',
      points: 78,
      maxPoints: 100
    },
    {
      id: 'CERT-002',
      type: 'WELL Building',
      target: 'Silver',
      progress: 65,
      status: 'in_progress',
      points: 65,
      maxPoints: 100
    },
    {
      id: 'CERT-003',
      type: 'Carbon Trust',
      target: 'Standard',
      progress: 85,
      status: 'in_progress',
      points: 85,
      maxPoints: 100
    }
  ]);

  const [energyModeling] = useState([
    { month: 'Jan', predicted: 450, actual: 480 },
    { month: 'Feb', predicted: 420, actual: 460 },
    { month: 'Mar', predicted: 380, actual: 390 },
    { month: 'Apr', predicted: 350, actual: 360 }
  ]);

  const [lifecycleCosts] = useState([
    { phase: 'Material Production', cost: 1200000, carbon: 280 },
    { phase: 'Transportation', cost: 300000, carbon: 120 },
    { phase: 'Construction', cost: 1800000, carbon: 50 },
    { phase: 'Operations (20 years)', cost: 2500000, carbon: 1200 },
    { phase: 'Demolition/Recycling', cost: 400000, carbon: 80 }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Leaf className="w-8 h-8 text-green-600" />
          Sustainability Optimization
        </h1>
        <p className="text-slate-600 mt-1">Carbon footprint, LEED tracking, and ESG reporting</p>
      </div>

      {/* Carbon Footprint */}
      <Card>
        <CardHeader>
          <CardTitle>Carbon Footprint Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 mb-2">Total Carbon Footprint</p>
              <p className="text-3xl font-bold text-green-600">{carbonFootprint.total}</p>
              <p className="text-xs text-slate-600 mt-1">{carbonFootprint.unit}</p>
              <div className="mt-3 p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Target: {carbonFootprint.target} MT CO2e</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(carbonFootprint.total / carbonFootprint.target) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Materials', value: carbonFootprint.materials, icon: Zap },
                { label: 'Transportation', value: carbonFootprint.transportation, icon: Wind },
                { label: 'Energy', value: carbonFootprint.energy, icon: Droplets }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <p className="text-sm font-medium">{item.label}</p>
                    </div>
                    <p className="font-bold text-slate-700">{item.value} MT</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sustainable Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Sustainable Materials Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {materials.map((material) => (
            <div key={material.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{material.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">EPD: {material.epd}</p>
                </div>
                {material.certified && (
                  <Badge className="bg-green-100 text-green-800">
                    <Award className="w-3 h-3 mr-1" />
                    Certified
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm border-t pt-3">
                <div>
                  <p className="text-xs text-slate-600">Carbon Footprint</p>
                  <p className="font-bold text-green-600">{material.carbonFootprint} kg CO2e/unit</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Recycled Content</p>
                  <p className="font-bold">{material.recycledContent}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Status</p>
                  <Badge variant="outline" className="mt-1">IN USE</Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Green Building Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {certifications.map((cert) => (
            <div key={cert.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{cert.type}</h3>
                  <p className="text-sm text-slate-600">Target: {cert.target}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {cert.points}/{cert.maxPoints} Points
                </Badge>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${cert.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">{cert.progress}% Complete</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Energy Modeling */}
      <Card>
        <CardHeader>
          <CardTitle>Energy Modeling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {energyModeling.map((data, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-sm">{data.month}</p>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Predicted</p>
                    <p className="font-bold text-blue-600">{data.predicted} kWh</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Actual</p>
                    <p className="font-bold text-green-600">{data.actual} kWh</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lifecycleCosts.map((phase, idx) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{phase.phase}</p>
                  <p className="font-bold text-blue-600">${(phase.cost / 1000000).toFixed(1)}M</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Carbon: {phase.carbon} MT CO2e</span>
                  <div className="w-32 h-2 bg-slate-200 rounded-full">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(phase.carbon / 1200) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
