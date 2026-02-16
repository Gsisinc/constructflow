import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calculator,
  Plus,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  DollarSign,
  Layers,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function AdvancedEstimation() {
  const [assemblies] = useState([
    {
      id: 'ASM-001',
      name: 'Concrete Foundation - Per SF',
      category: 'Foundation',
      description: 'Complete concrete foundation including excavation, forms, and finishing',
      baseUnitCost: 85,
      unit: 'SF',
      components: [
        { item: 'Excavation', cost: 15, unit: 'SF' },
        { item: 'Forms & Bracing', cost: 12, unit: 'SF' },
        { item: 'Concrete (4" slab)', cost: 35, unit: 'SF' },
        { item: 'Finishing', cost: 8, unit: 'SF' },
        { item: 'Labor', cost: 15, unit: 'SF' }
      ],
      lastUpdated: new Date('2024-04-01'),
      usageCount: 24
    },
    {
      id: 'ASM-002',
      name: 'Electrical Rough-In - Per Outlet',
      category: 'Electrical',
      description: 'Electrical rough-in including wire, conduit, and outlet boxes',
      baseUnitCost: 125,
      unit: 'Each',
      components: [
        { item: 'Wire & Cable', cost: 35, unit: 'Each' },
        { item: 'Conduit & Fittings', cost: 25, unit: 'Each' },
        { item: 'Outlet Boxes', cost: 15, unit: 'Each' },
        { item: 'Labor', cost: 50, unit: 'Each' }
      ],
      lastUpdated: new Date('2024-03-15'),
      usageCount: 18
    },
    {
      id: 'ASM-003',
      name: 'Drywall Installation - Per SF',
      category: 'Interior',
      description: 'Drywall installation including framing, taping, and finishing',
      baseUnitCost: 4.50,
      unit: 'SF',
      components: [
        { item: 'Drywall Sheet', cost: 1.20, unit: 'SF' },
        { item: 'Framing', cost: 0.80, unit: 'SF' },
        { item: 'Taping & Mudding', cost: 1.50, unit: 'SF' },
        { item: 'Labor', cost: 1.00, unit: 'SF' }
      ],
      lastUpdated: new Date('2024-04-05'),
      usageCount: 42
    }
  ]);

  const [unitCosts] = useState([
    { id: 'UC-001', category: 'Labor', description: 'Skilled Laborer - Hourly', cost: 65, source: 'RS Means 2024' },
    { id: 'UC-002', category: 'Labor', description: 'Foreman - Hourly', cost: 95, source: 'RS Means 2024' },
    { id: 'UC-003', category: 'Materials', description: 'Concrete (per cubic yard)', cost: 185, source: 'Local Supplier' },
    { id: 'UC-004', category: 'Materials', description: 'Steel Rebar (per ton)', cost: 850, source: 'RS Means 2024' },
    { id: 'UC-005', category: 'Equipment', description: 'Excavator Rental (per day)', cost: 450, source: 'Equipment Rental' }
  ]);

  const [scenarios] = useState([
    {
      id: 'SCEN-001',
      name: 'Standard Concrete',
      baseEstimate: 250000,
      variations: [
        { name: 'Premium Concrete', multiplier: 1.15, cost: 287500 },
        { name: 'Lightweight Concrete', multiplier: 0.95, cost: 237500 },
        { name: 'Colored Concrete', multiplier: 1.25, cost: 312500 }
      ]
    }
  ]);

  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            Advanced Estimation
          </h1>
          <p className="text-slate-600 mt-1">Assembly Library, Unit Costs & What-if Analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assemblies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assemblies" className="gap-2">
            <Layers className="w-4 h-4" />
            Assembly Library
          </TabsTrigger>
          <TabsTrigger value="unitcosts" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Unit Costs
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            What-if Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Assembly Library Tab */}
        <TabsContent value="assemblies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cost Assemblies</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Assembly
            </Button>
          </div>

          <div className="space-y-3">
            {assemblies.map((assembly) => (
              <Card 
                key={assembly.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedAssembly(selectedAssembly?.id === assembly.id ? null : assembly)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{assembly.name}</h3>
                      <p className="text-sm text-slate-600">{assembly.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-blue-600">${assembly.baseUnitCost}</p>
                      <p className="text-sm text-slate-600">per {assembly.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <Badge variant="outline">{assembly.category}</Badge>
                    <span>Used {assembly.usageCount} times</span>
                    <span>Updated {assembly.lastUpdated.toLocaleDateString()}</span>
                  </div>

                  {selectedAssembly?.id === assembly.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <h4 className="font-semibold">Components</h4>
                      <div className="space-y-2">
                        {assembly.components.map((comp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm">{comp.item}</span>
                            <span className="font-semibold">${comp.cost} / {comp.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Unit Costs Tab */}
        <TabsContent value="unitcosts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Unit Cost Database</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Unit Cost
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600 mb-4">Integrated with RS Means and local supplier data</p>
              <div className="space-y-2">
                {unitCosts.map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div>
                      <p className="font-medium">{cost.description}</p>
                      <p className="text-xs text-slate-600">{cost.category} • Source: {cost.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">${cost.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* What-if Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">What-if Scenarios</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Scenario
            </Button>
          </div>

          <div className="space-y-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-slate-600">Base Estimate</p>
                    <p className="text-2xl font-bold text-blue-600">${scenario.baseEstimate.toLocaleString()}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Variations</h4>
                    {scenario.variations.map((variation, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{variation.name}</p>
                          <p className="text-sm text-slate-600">{(variation.multiplier * 100).toFixed(0)}% of base</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">${variation.cost.toLocaleString()}</p>
                          <p className="text-sm text-slate-600">
                            {variation.cost > scenario.baseEstimate ? '+' : ''} 
                            ${Math.abs(variation.cost - scenario.baseEstimate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analyze Scenario
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
