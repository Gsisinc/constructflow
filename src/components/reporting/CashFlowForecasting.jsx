import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function CashFlowForecasting({ projects = [] }) {
  const [projections, setProjections] = useState([]);
  const [showAddProjection, setShowAddProjection] = useState(false);
  const [newProjection, setNewProjection] = useState({
    projectId: '',
    inflows: 0,
    outflows: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'invoice'
  });

  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    months.push({
      date,
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    });
  }

  const addProjection = () => {
    if (!newProjection.projectId || !newProjection.inflows && !newProjection.outflows) {
      toast.error('Please fill in required fields');
      return;
    }
    setProjections([...projections, { ...newProjection, id: Date.now() }]);
    setNewProjection({
      projectId: '',
      inflows: 0,
      outflows: 0,
      date: new Date().toISOString().split('T')[0],
      type: 'invoice'
    });
    setShowAddProjection(false);
    toast.success('Projection added');
  };

  const calculateCashFlow = useMemo(() => {
    const monthlyData = months.map(m => {
      const monthStr = m.date.getFullYear() + '-' + String(m.date.getMonth() + 1).padStart(2, '0');
      const monthProjections = projections.filter(p => p.date.startsWith(monthStr));
      
      const totalInflows = monthProjections.reduce((sum, p) => sum + (p.inflows || 0), 0);
      const totalOutflows = monthProjections.reduce((sum, p) => sum + (p.outflows || 0), 0);
      const netCashFlow = totalInflows - totalOutflows;

      return {
        month: m.month,
        inflows: totalInflows,
        outflows: totalOutflows,
        netCashFlow,
        monthStr
      };
    });

    // Calculate cumulative cash flow
    let cumulativeCash = 0;
    return monthlyData.map(m => {
      cumulativeCash += m.netCashFlow;
      return { ...m, cumulativeCash };
    });
  }, [projections, months]);

  const summary = useMemo(() => {
    const totalInflows = projections.reduce((sum, p) => sum + (p.inflows || 0), 0);
    const totalOutflows = projections.reduce((sum, p) => sum + (p.outflows || 0), 0);
    const netCashFlow = totalInflows - totalOutflows;
    const minCashFlow = Math.min(...calculateCashFlow.map(m => m.cumulativeCash));
    const maxCashFlow = Math.max(...calculateCashFlow.map(m => m.cumulativeCash));

    return {
      totalInflows,
      totalOutflows,
      netCashFlow,
      minCashFlow: minCashFlow || 0,
      maxCashFlow: maxCashFlow || 0,
      avgMonthlyInflow: (totalInflows / months.length).toFixed(0),
      avgMonthlyOutflow: (totalOutflows / months.length).toFixed(0)
    };
  }, [projections, calculateCashFlow, months]);

  const deleteProjection = (id) => {
    setProjections(projections.filter(p => p.id !== id));
    toast.success('Projection deleted');
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Cash Inflows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${summary.totalInflows.toLocaleString()}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Avg: ${summary.avgMonthlyInflow}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Cash Outflows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ${summary.totalOutflows.toLocaleString()}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Avg: ${summary.avgMonthlyOutflow}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${summary.netCashFlow.toLocaleString()}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Range: ${summary.minCashFlow.toLocaleString()} to ${summary.maxCashFlow.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Projection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cash Flow Projections</CardTitle>
          <Dialog open={showAddProjection} onOpenChange={setShowAddProjection}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Projection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cash Flow Projection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={newProjection.projectId}
                    onChange={(e) => setNewProjection({ ...newProjection, projectId: e.target.value })}
                  >
                    <option value="">Select project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={newProjection.type}
                    onChange={(e) => setNewProjection({ ...newProjection, type: e.target.value })}
                  >
                    <option value="invoice">Invoice (Inflow)</option>
                    <option value="expense">Expense (Outflow)</option>
                    <option value="payment">Payment (Outflow)</option>
                    <option value="deposit">Deposit (Inflow)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Inflows ($)</label>
                    <Input
                      type="number"
                      value={newProjection.inflows}
                      onChange={(e) => setNewProjection({ ...newProjection, inflows: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Outflows ($)</label>
                    <Input
                      type="number"
                      value={newProjection.outflows}
                      onChange={(e) => setNewProjection({ ...newProjection, outflows: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={newProjection.date}
                    onChange={(e) => setNewProjection({ ...newProjection, date: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddProjection(false)}>Cancel</Button>
                  <Button onClick={addProjection}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 12-Month Forecast Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Month</th>
                  <th className="text-right py-2 px-2">Inflows</th>
                  <th className="text-right py-2 px-2">Outflows</th>
                  <th className="text-right py-2 px-2">Net Cash Flow</th>
                  <th className="text-right py-2 px-2">Cumulative</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {calculateCashFlow.map((month, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium">{month.month}</td>
                    <td className="text-right py-2 px-2 text-green-600">
                      ${month.inflows.toLocaleString()}
                    </td>
                    <td className="text-right py-2 px-2 text-red-600">
                      ${month.outflows.toLocaleString()}
                    </td>
                    <td className={`text-right py-2 px-2 font-bold ${month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${month.netCashFlow.toLocaleString()}
                    </td>
                    <td className={`text-right py-2 px-2 font-bold ${month.cumulativeCash >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      ${month.cumulativeCash.toLocaleString()}
                    </td>
                    <td className="text-center py-2 px-2">
                      {month.cumulativeCash < 0 && (
                        <AlertTriangle className="h-4 w-4 text-orange-600 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warning if any negative cash flow */}
          {calculateCashFlow.some(m => m.cumulativeCash < 0) && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <p className="text-sm text-orange-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warning: Negative cash flow projected in some months. Plan accordingly.
              </p>
            </div>
          )}

          {/* Active Projections List */}
          {projections.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">Active Projections</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {projections.map(proj => {
                  const project = projects.find(p => p.id === parseInt(proj.projectId));
                  return (
                    <div key={proj.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                      <div>
                        <p className="font-medium">{project?.name || 'Unknown Project'}</p>
                        <p className="text-xs text-slate-600">
                          {proj.date} • {proj.type}
                        </p>
                      </div>
                      <div className="text-right">
                        {proj.inflows > 0 && (
                          <p className="text-green-600 font-medium">${proj.inflows.toLocaleString()}</p>
                        )}
                        {proj.outflows > 0 && (
                          <p className="text-red-600 font-medium">-${proj.outflows.toLocaleString()}</p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteProjection(proj.id)}
                          className="mt-1 text-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Flow Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cash Flow Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-sm font-medium text-blue-900">Positive Months</p>
            <p className="text-sm text-blue-700">
              {calculateCashFlow.filter(m => m.netCashFlow > 0).length} of {calculateCashFlow.length} months have positive cash flow
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded">
            <p className="text-sm font-medium text-amber-900">Critical Periods</p>
            <p className="text-sm text-amber-700">
              {calculateCashFlow.filter(m => m.cumulativeCash < 0).length} months may require additional financing
            </p>
          </div>

          <div className="p-3 bg-green-50 rounded">
            <p className="text-sm font-medium text-green-900">Average Monthly Surplus</p>
            <p className="text-sm text-green-700">
              ${(summary.totalInflows / months.length - summary.totalOutflows / months.length).toFixed(0)}/month
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
