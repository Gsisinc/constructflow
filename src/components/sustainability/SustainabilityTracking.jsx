import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Leaf, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export function SustainabilityTracking() {
  const [carbonFootprint, setCarbonFootprint] = useState({
    materials: 245,
    transportation: 120,
    labor: 85,
    equipment: 60,
    waste: 40,
    total: 550
  });

  const [leedCredits, setLeedCredits] = useState([
    { id: 1, category: 'Energy & Atmosphere', credits: 'EA C1: Optimize Energy Performance', points: 19, achieved: true },
    { id: 2, category: 'Water Efficiency', credits: 'WE C1: Water Efficient Landscaping', points: 5, achieved: true },
    { id: 3, category: 'Materials & Resources', credits: 'MR C5: Regional Materials', points: 2, achieved: false },
    { id: 4, category: 'Indoor Environmental Quality', credits: 'IEQ C8.1: Daylight/Views', points: 3, achieved: true }
  ]);

  const [greenMaterials, setGreenMaterials] = useState([
    { id: 1, name: 'Recycled Steel', percentage: 35, quantity: '150 tons', supplier: 'Steel Recycling Inc' },
    { id: 2, name: 'Reclaimed Wood', percentage: 20, quantity: '80 sf', supplier: 'Green Lumber Co' },
    { id: 3, name: 'Low-VOC Paint', percentage: 100, quantity: '500 gal', supplier: 'Eco Paint LLC' },
    { id: 4, name: 'Sustainable Concrete', percentage: 40, quantity: '300 cy', supplier: 'Green Concrete' }
  ]);

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    percentage: 0,
    quantity: '',
    supplier: ''
  });

  const addMaterial = () => {
    if (!newMaterial.name) {
      toast.error('Please enter material name');
      return;
    }

    setGreenMaterials([...greenMaterials, {
      ...newMaterial,
      id: Date.now(),
      percentage: parseFloat(newMaterial.percentage) || 0
    }]);

    setNewMaterial({ name: '', percentage: 0, quantity: '', supplier: '' });
    setShowAddMaterial(false);
    toast.success('Material added');
  };

  const totalLeedPoints = leedCredits.reduce((sum, c) => sum + c.points, 0);
  const achievedPoints = leedCredits.filter(c => c.achieved).reduce((sum, c) => sum + c.points, 0);
  const carbonReduction = ((carbonFootprint.total / 650) * 100).toFixed(1);
  const wasteReduction = 35; // percentage

  return (
    <div className="space-y-4">
      {/* Sustainability Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Carbon Footprint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{carbonFootprint.total}</p>
            <p className="text-xs text-slate-600">Metric tons CO2e</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reduction vs Baseline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{carbonReduction}%</p>
            <p className="text-xs text-slate-600">Carbon reduction achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Waste Diversion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{wasteReduction}%</p>
            <p className="text-xs text-slate-600">Diverted from landfill</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">LEED Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{achievedPoints}/{totalLeedPoints}</p>
            <p className="text-xs text-slate-600">Points achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Carbon Footprint Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Carbon Footprint Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(carbonFootprint).map(([key, value]) => {
              if (key === 'total') return null;
              const percentage = ((value / carbonFootprint.total) * 100).toFixed(1);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="capitalize text-sm font-medium">{key}</span>
                    <span className="text-sm font-bold">{value} MT CO2e ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded overflow-hidden">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Green Materials Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Green & Sustainable Materials</CardTitle>
          <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sustainable Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Material name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Percentage of use"
                  value={newMaterial.percentage}
                  onChange={(e) => setNewMaterial({ ...newMaterial, percentage: e.target.value })}
                />
                <Input
                  placeholder="Quantity (e.g., 100 tons)"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                />
                <Input
                  placeholder="Supplier"
                  value={newMaterial.supplier}
                  onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddMaterial(false)}>Cancel</Button>
                  <Button onClick={addMaterial}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {greenMaterials.map(material => (
              <div key={material.id} className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{material.name}</p>
                    <p className="text-xs text-slate-600">{material.supplier}</p>
                  </div>
                  <Leaf className="h-5 w-5 text-green-600" />
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Percentage Used</span>
                    <span className="text-sm font-bold">{material.percentage}%</span>
                  </div>
                  <div className="w-full bg-white h-2 rounded overflow-hidden">
                    <div
                      className="bg-green-600 h-full"
                      style={{ width: `${material.percentage}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-600">Quantity: {material.quantity}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LEED Certification Progress */}
      <Card>
        <CardHeader>
          <CardTitle>LEED Certification Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold">{achievedPoints} Points Achieved</p>
              <p className="text-sm text-slate-600">Out of {totalLeedPoints} possible points</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {((achievedPoints / totalLeedPoints) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="w-full bg-slate-200 h-4 rounded overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{ width: `${(achievedPoints / totalLeedPoints) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            {leedCredits.map(credit => (
              <div key={credit.id} className={`p-3 border rounded flex items-start justify-between ${
                credit.achieved ? 'bg-green-50 border-green-200' : 'bg-slate-50'
              }`}>
                <div>
                  <p className="font-medium text-sm">{credit.credits}</p>
                  <p className="text-xs text-slate-600">{credit.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{credit.points} pts</span>
                  {credit.achieved && (
                    <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded font-bold">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full">View LEED Documentation</Button>
        </CardContent>
      </Card>

      {/* Environmental Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Impact Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-slate-600">Water Saved</p>
              <p className="text-2xl font-bold text-blue-600">2.5M gal</p>
              <p className="text-xs text-slate-600 mt-1">vs. baseline</p>
            </div>

            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-slate-600">Energy Reduction</p>
              <p className="text-2xl font-bold text-green-600">35%</p>
              <p className="text-xs text-slate-600 mt-1">vs. baseline</p>
            </div>

            <div className="p-4 bg-orange-50 rounded">
              <p className="text-sm text-slate-600">Recycled Materials</p>
              <p className="text-2xl font-bold text-orange-600">850 tons</p>
              <p className="text-xs text-slate-600 mt-1">Diverted from landfill</p>
            </div>

            <div className="p-4 bg-purple-50 rounded">
              <p className="text-sm text-slate-600">Trees Equivalent</p>
              <p className="text-2xl font-bold text-purple-600">1,200</p>
              <p className="text-xs text-slate-600 mt-1">Carbon sequestration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ESG Reporting */}
      <Card>
        <CardHeader>
          <CardTitle>ESG (Environmental, Social, Governance) Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              Generate ESG Report
            </Button>
            <Button variant="outline" className="w-full">
              View Sustainability Report
            </Button>
            <Button variant="outline" className="w-full">
              Export Carbon Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
