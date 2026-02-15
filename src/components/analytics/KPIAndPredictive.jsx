import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

// KPI Tracking Dashboard
export function KPIDashboard({ projects = [] }) {
  const [kpis, setKpis] = useState([
    { id: 1, name: 'On-Time Completion %', target: 95, current: 87, unit: '%', trend: -3 },
    { id: 2, name: 'Budget Variance %', target: 95, current: 92, unit: '%', trend: 2 },
    { id: 3, name: 'Safety Incidents', target: 0, current: 2, unit: 'incidents', trend: 1 },
    { id: 4, name: 'Avg Project Margin', target: 20, current: 18.5, unit: '%', trend: -1.5 },
    { id: 5, name: 'Client Satisfaction', target: 95, current: 88, unit: '%', trend: 5 },
    { id: 6, name: 'Employee Retention', target: 90, current: 85, unit: '%', trend: 2 }
  ]);

  const [showAddKPI, setShowAddKPI] = useState(false);
  const [newKPI, setNewKPI] = useState({
    name: '',
    target: 0,
    unit: '%'
  });

  const addKPI = () => {
    if (!newKPI.name) {
      toast.error('Please enter KPI name');
      return;
    }

    setKpis([...kpis, {
      ...newKPI,
      id: Date.now(),
      current: 0,
      trend: 0
    }]);

    setNewKPI({
      name: '',
      target: 0,
      unit: '%'
    });
    setShowAddKPI(false);
    toast.success('KPI added');
  };

  const getStatus = (current, target) => {
    if (current >= target) return { color: 'text-green-600', label: 'On Target' };
    if (current >= target * 0.9) return { color: 'text-yellow-600', label: 'At Risk' };
    return { color: 'text-red-600', label: 'Off Target' };
  };

  const historicalData = [
    { month: 'Jan', 'On-Time %': 85, Budget: 93, Safety: 2, Margin: 17 },
    { month: 'Feb', 'On-Time %': 84, Budget: 94, Safety: 1, Margin: 18 },
    { month: 'Mar', 'On-Time %': 86, Budget: 91, Safety: 2, Margin: 19 },
    { month: 'Apr', 'On-Time %': 88, Budget: 92, Safety: 1, Margin: 19 },
    { month: 'May', 'On-Time %': 87, Budget: 92, Safety: 2, Margin: 18.5 },
    { month: 'Jun', 'On-Time %': 87, Budget: 92, Safety: 0, Margin: 18.5 }
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => {
          const status = getStatus(kpi.current, kpi.target);
          const performancePercent = (kpi.current / kpi.target) * 100;

          return (
            <Card key={kpi.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{kpi.name}</CardTitle>
                  <Target className="h-4 w-4 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className={`text-2xl font-bold ${status.color}`}>
                    {kpi.current}{kpi.unit}
                  </p>
                  <p className={`text-xs mt-1 ${status.color}`}>{status.label}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Target: {kpi.target}{kpi.unit}</span>
                    <span className={`flex items-center gap-1 text-xs ${
                      kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {kpi.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(kpi.trend)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition ${
                        performancePercent >= 100 ? 'bg-green-500' :
                        performancePercent >= 90 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(performancePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Trends (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="On-Time %" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Budget" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Margin" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Add KPI */}
      <Dialog open={showAddKPI} onOpenChange={setShowAddKPI}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom KPI
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom KPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="KPI name"
              value={newKPI.name}
              onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Target value"
              value={newKPI.target}
              onChange={(e) => setNewKPI({ ...newKPI, target: parseFloat(e.target.value) || 0 })}
            />
            <Input
              placeholder="Unit (%,  #, etc)"
              value={newKPI.unit}
              onChange={(e) => setNewKPI({ ...newKPI, unit: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddKPI(false)}>Cancel</Button>
              <Button onClick={addKPI}>Add KPI</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Predictive Analytics
export function PredictiveAnalytics({ historicalData = [] }) {
  const [predictions, setPredictions] = useState([
    {
      id: 1,
      name: 'Project Completion Risk',
      probability: 15,
      impact: 'High',
      recommendation: 'Accelerate framing phase by 2 days',
      factors: ['Weather delay likely', 'Material shortage risk', 'Crew availability']
    },
    {
      id: 2,
      name: 'Cost Overrun Risk',
      probability: 25,
      impact: 'Medium',
      recommendation: 'Review labor productivity on-site',
      factors: ['Labor costs 8% above budget', 'Overtime increasing', 'Material waste']
    },
    {
      id: 3,
      name: 'Schedule Delay',
      probability: 20,
      impact: 'High',
      recommendation: 'Add additional crew for electrical phase',
      factors: ['Permit delays', 'Equipment delivery', 'Labor shortage']
    }
  ]);

  const projectionData = [
    { week: 1, forecast: 100000, actual: 98000, confidence: 95 },
    { week: 2, forecast: 105000, actual: 103000, confidence: 94 },
    { week: 3, forecast: 110000, actual: 108000, confidence: 92 },
    { week: 4, forecast: 115000, actual: null, confidence: 88 },
    { week: 5, forecast: 120000, actual: null, confidence: 85 },
    { week: 6, forecast: 125000, actual: null, confidence: 82 }
  ];

  const getRiskColor = (probability) => {
    if (probability >= 30) return 'bg-red-100 text-red-800';
    if (probability >= 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-4">
      {/* Risk Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Predicted Risks & Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {predictions.map(pred => (
            <div key={pred.id} className={`border rounded-lg p-4 ${getRiskColor(pred.probability).split(' ')[0]}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm">{pred.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{pred.recommendation}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(pred.probability)}`}>
                  {pred.probability}% risk
                </span>
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium mb-1">Contributing Factors:</p>
                <div className="flex flex-wrap gap-1">
                  {pred.factors.map((factor, idx) => (
                    <span key={idx} className="text-xs bg-white bg-opacity-50 rounded px-2 py-0.5">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs">Impact: <span className="font-medium">{pred.impact}</span></p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cost Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Projection with Confidence Intervals</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Forecast" dataKey="forecast" fill="#3b82f6" />
              <Scatter name="Actual" dataKey="actual" fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Confidence Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Model Confidence by Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="confidence" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Schedule Optimization</p>
            <p className="text-sm text-blue-800">
              Based on historical data, parallelizing electrical and HVAC rough-ins could save 5 days and reduce costs by $12,000.
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <p className="text-sm font-medium text-amber-900 mb-1">Resource Allocation</p>
            <p className="text-sm text-amber-800">
              Current crew size is adequate for framing but will need +2 laborers for finish phase to maintain schedule.
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-medium text-green-900 mb-1">Cost Savings Opportunity</p>
            <p className="text-sm text-green-800">
              Bulk ordering structural steel 4 weeks ahead could yield 3-5% savings and reduce expedite fees.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
