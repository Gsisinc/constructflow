import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function CashFlowForecasting() {
  const [cashFlows, setCashFlows] = useState([
    { month: 'January', inflows: 450000, outflows: 380000, net: 70000 },
    { month: 'February', inflows: 520000, outflows: 410000, net: 110000 },
    { month: 'March', inflows: 480000, outflows: 420000, net: 60000 },
  ]);

  const [projections, setProjections] = useState([
    { month: 'April', inflows: 550000, outflows: 440000, net: 110000 },
    { month: 'May', inflows: 600000, outflows: 460000, net: 140000 },
    { month: 'June', inflows: 580000, outflows: 450000, net: 130000 },
  ]);

  const [showAddFlow, setShowAddFlow] = useState(false);
  const [newFlow, setNewFlow] = useState({
    month: '',
    inflows: 0,
    outflows: 0
  });

  const addCashFlow = () => {
    if (!newFlow.month) {
      toast.error('Please enter month');
      return;
    }

    const flow = {
      ...newFlow,
      inflows: parseFloat(newFlow.inflows) || 0,
      outflows: parseFloat(newFlow.outflows) || 0,
      net: (parseFloat(newFlow.inflows) || 0) - (parseFloat(newFlow.outflows) || 0)
    };

    setCashFlows([...cashFlows, flow]);
    setNewFlow({ month: '', inflows: 0, outflows: 0 });
    setShowAddFlow(false);
    toast.success('Cash flow added');
  };

  const calculateCumulativeCash = () => {
    let cumulative = 0;
    const allFlows = [...cashFlows, ...projections];
    return allFlows.map(flow => {
      cumulative += flow.net;
      return { ...flow, cumulative };
    });
  };

  const cumulativeFlows = calculateCumulativeCash();
  const currentCash = cumulativeFlows[cumulativeFlows.length - 1]?.cumulative || 0;
  const minCash = Math.min(...cumulativeFlows.map(f => f.cumulative));
  const avgMonthlyNet = (cumulativeFlows.reduce((sum, f) => sum + f.net, 0) / cumulativeFlows.length).toFixed(0);

  const getNetColor = (net) => {
    return net >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getWarning = () => {
    if (minCash < 0) {
      return {
        type: 'critical',
        message: `Critical: Cash flow goes negative (${minCash.toLocaleString()}). Consider financing options.`,
        color: 'bg-red-50 border-red-200'
      };
    }
    if (minCash < 100000) {
      return {
        type: 'warning',
        message: `Warning: Minimum cash balance is ${minCash.toLocaleString()}. Low liquidity buffer.`,
        color: 'bg-yellow-50 border-yellow-200'
      };
    }
    return null;
  };

  const warning = getWarning();

  return (
    <div className="space-y-4">
      {/* Warning Alert */}
      {warning && (
        <Card className={`border ${warning.color}`}>
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{warning.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Cash Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${currentCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentCash.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Minimum Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${minCash >= 100000 ? 'text-green-600' : 'text-red-600'}`}>
              ${minCash.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Monthly Net</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold text-green-600`}>
              ${Number(avgMonthlyNet).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projection Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {projections.length} months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Cash Flows */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Cash Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Month</th>
                  <th className="text-right py-2 px-2">Inflows</th>
                  <th className="text-right py-2 px-2">Outflows</th>
                  <th className="text-right py-2 px-2">Net</th>
                  <th className="text-right py-2 px-2">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((flow, idx) => {
                  const cumFlow = cumulativeFlows[idx];
                  return (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{flow.month}</td>
                      <td className="text-right py-2 px-2 text-green-600">
                        ${flow.inflows.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-2 text-red-600">
                        ${flow.outflows.toLocaleString()}
                      </td>
                      <td className={`text-right py-2 px-2 font-medium ${getNetColor(flow.net)}`}>
                        ${flow.net.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-2 font-bold">
                        ${cumFlow.cumulative.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Forecasted Cash Flows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Forecasted Cash Flows (Next 12 Months)</CardTitle>
          <Dialog open={showAddFlow} onOpenChange={setShowAddFlow}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Forecast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cash Flow Forecast</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Month (e.g., July)"
                  value={newFlow.month}
                  onChange={(e) => setNewFlow({ ...newFlow, month: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Projected Inflows ($)"
                  value={newFlow.inflows}
                  onChange={(e) => setNewFlow({ ...newFlow, inflows: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Projected Outflows ($)"
                  value={newFlow.outflows}
                  onChange={(e) => setNewFlow({ ...newFlow, outflows: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddFlow(false)}>Cancel</Button>
                  <Button onClick={addCashFlow}>Add Forecast</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-blue-50">
                  <th className="text-left py-2 px-2">Month</th>
                  <th className="text-right py-2 px-2">Inflows</th>
                  <th className="text-right py-2 px-2">Outflows</th>
                  <th className="text-right py-2 px-2">Net</th>
                  <th className="text-right py-2 px-2">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((flow, idx) => {
                  const cumFlow = cumulativeFlows[cashFlows.length + idx];
                  return (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium text-blue-700">{flow.month}</td>
                      <td className="text-right py-2 px-2 text-green-600">
                        ${flow.inflows.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-2 text-red-600">
                        ${flow.outflows.toLocaleString()}
                      </td>
                      <td className={`text-right py-2 px-2 font-medium ${getNetColor(flow.net)}`}>
                        ${flow.net.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-2 font-bold">
                        ${cumFlow.cumulative.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inflows by Month */}
            <div>
              <p className="font-medium text-sm mb-3">Average Monthly Inflows</p>
              <div className="space-y-2">
                {cumulativeFlows.map((flow, idx) => {
                  const avgInflow = (flow.inflows / (idx + 1)).toFixed(0);
                  const height = (avgInflow / Math.max(...cumulativeFlows.map(f => f.inflows)) * 100);
                  return (
                    <div key={idx} className="flex items-end gap-2">
                      <span className="text-xs text-slate-600 w-16">{flow.month}</span>
                      <div className="flex-1 bg-green-100 h-6 rounded flex items-center justify-end pr-2">
                        <span className="text-xs font-bold text-green-700">
                          ${(flow.inflows / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outflows by Month */}
            <div>
              <p className="font-medium text-sm mb-3">Average Monthly Outflows</p>
              <div className="space-y-2">
                {cumulativeFlows.map((flow, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <span className="text-xs text-slate-600 w-16">{flow.month}</span>
                    <div className="flex-1 bg-red-100 h-6 rounded flex items-center justify-end pr-2">
                      <span className="text-xs font-bold text-red-700">
                        ${(flow.outflows / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="pt-4 border-t space-y-2">
            <p className="font-medium text-sm">Key Insights:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>✓ Total projected inflows: ${cumulativeFlows.reduce((sum, f) => sum + f.inflows, 0).toLocaleString()}</li>
              <li>✓ Total projected outflows: ${cumulativeFlows.reduce((sum, f) => sum + f.outflows, 0).toLocaleString()}</li>
              <li>✓ Net cash position improving: {avgMonthlyNet > 0 ? 'Yes' : 'No'}</li>
              <li>✓ Months with positive cash flow: {cumulativeFlows.filter(f => f.net > 0).length}/{cumulativeFlows.length}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>What-If Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg space-y-2">
              <p className="font-medium text-sm">Optimistic Scenario</p>
              <p className="text-xs text-slate-600">+10% inflows, -5% outflows</p>
              <p className="text-lg font-bold text-green-600">
                ${(currentCash * 1.15).toLocaleString()}
              </p>
              <Button size="sm" variant="outline" className="w-full">View Details</Button>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <p className="font-medium text-sm">Base Case</p>
              <p className="text-xs text-slate-600">Current projections</p>
              <p className="text-lg font-bold text-blue-600">
                ${currentCash.toLocaleString()}
              </p>
              <Button size="sm" variant="outline" className="w-full">View Details</Button>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <p className="font-medium text-sm">Conservative Scenario</p>
              <p className="text-xs text-slate-600">-10% inflows, +5% outflows</p>
              <p className="text-lg font-bold text-orange-600">
                ${(currentCash * 0.85).toLocaleString()}
              </p>
              <Button size="sm" variant="outline" className="w-full">View Details</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
