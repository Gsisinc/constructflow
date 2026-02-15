import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function CashFlowForecast({ projects = [] }) {
  const [forecastMonths, setForecastMonths] = useState(12);
  const [inflows, setInflows] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [showAddInflow, setShowAddInflow] = useState(false);
  const [showAddOutflow, setShowAddOutflow] = useState(false);

  const [newInflow, setNewInflow] = useState({
    source: '',
    amount: 0,
    month: 1,
    probability: 100
  });

  const [newOutflow, setNewOutflow] = useState({
    category: 'Labor',
    amount: 0,
    month: 1,
    description: ''
  });

  const categories = ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Payroll', 'Overhead', 'Other'];
  const sources = ['Client Payment', 'Loan', 'Equity', 'Other'];

  const addInflow = () => {
    if (!newInflow.source || newInflow.amount <= 0) {
      toast.error('Please fill all inflow fields');
      return;
    }
    setInflows([...inflows, { ...newInflow, id: Date.now() }]);
    setNewInflow({ source: '', amount: 0, month: 1, probability: 100 });
    setShowAddInflow(false);
    toast.success('Inflow added');
  };

  const addOutflow = () => {
    if (!newOutflow.category || newOutflow.amount <= 0) {
      toast.error('Please fill all outflow fields');
      return;
    }
    setOutflows([...outflows, { ...newOutflow, id: Date.now() }]);
    setNewOutflow({ category: 'Labor', amount: 0, month: 1, description: '' });
    setShowAddOutflow(false);
    toast.success('Outflow added');
  };

  const forecast = useMemo(() => {
    const months = [];
    for (let i = 1; i <= forecastMonths; i++) {
      const monthInflows = inflows
        .filter(inf => inf.month <= i)
        .reduce((sum, inf) => sum + (inf.amount * inf.probability / 100), 0);

      const monthOutflows = outflows
        .filter(outf => outf.month <= i)
        .reduce((sum, outf) => sum + outf.amount, 0);

      const netCashFlow = monthInflows - monthOutflows;
      const cumulativeCashFlow = i === 1 ? netCashFlow : months[i - 2].cumulative + netCashFlow;

      months.push({
        month: i,
        inflows: monthInflows,
        outflows: monthOutflows,
        netCashFlow,
        cumulative: cumulativeCashFlow
      });
    }
    return months;
  }, [inflows, outflows, forecastMonths]);

  const totalInflows = inflows.reduce((sum, inf) => sum + inf.amount, 0);
  const totalOutflows = outflows.reduce((sum, outf) => sum + outf.amount, 0);
  const netCashPosition = forecast[forecast.length - 1]?.cumulative || 0;
  const minCashPosition = Math.min(...forecast.map(m => m.cumulative));

  const getMonthName = (month) => {
    const date = new Date();
    date.setMonth(date.getMonth() + month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Inflows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${totalInflows.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Outflows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">${totalOutflows.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netCashPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netCashPosition.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Min Cash Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${minCashPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${minCashPosition.toLocaleString()}
            </p>
            {minCashPosition < 0 && (
              <p className="text-xs text-red-600 mt-1">⚠️ Warning: Negative cash flow</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Forecast Period</label>
                <select
                  className="border rounded px-3 py-2"
                  value={forecastMonths}
                  onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={showAddInflow} onOpenChange={setShowAddInflow}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Inflow
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Cash Inflow</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={newInflow.source}
                      onChange={(e) => setNewInflow({ ...newInflow, source: e.target.value })}
                    >
                      <option value="">Select source</option>
                      {sources.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Amount ($)"
                      value={newInflow.amount}
                      onChange={(e) => setNewInflow({ ...newInflow, amount: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      min="1"
                      max={forecastMonths}
                      placeholder="Month"
                      value={newInflow.month}
                      onChange={(e) => setNewInflow({ ...newInflow, month: parseInt(e.target.value) || 1 })}
                    />
                    <div>
                      <label className="block text-sm font-medium mb-1">Probability %</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newInflow.probability}
                        onChange={(e) => setNewInflow({ ...newInflow, probability: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                    <Button onClick={addInflow} className="w-full">Add Inflow</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddOutflow} onOpenChange={setShowAddOutflow}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Outflow
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Cash Outflow</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={newOutflow.category}
                      onChange={(e) => setNewOutflow({ ...newOutflow, category: e.target.value })}
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Amount ($)"
                      value={newOutflow.amount}
                      onChange={(e) => setNewOutflow({ ...newOutflow, amount: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      min="1"
                      max={forecastMonths}
                      placeholder="Month"
                      value={newOutflow.month}
                      onChange={(e) => setNewOutflow({ ...newOutflow, month: parseInt(e.target.value) || 1 })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newOutflow.description}
                      onChange={(e) => setNewOutflow({ ...newOutflow, description: e.target.value })}
                    />
                    <Button onClick={addOutflow} className="w-full">Add Outflow</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Month</th>
                <th className="text-right py-2 px-2">Inflows</th>
                <th className="text-right py-2 px-2">Outflows</th>
                <th className="text-right py-2 px-2">Net Flow</th>
                <th className="text-right py-2 px-2">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((month) => (
                <tr key={month.month} className="border-b hover:bg-slate-50">
                  <td className="py-2 px-2 font-medium">{getMonthName(month.month)}</td>
                  <td className="text-right py-2 px-2 text-green-600">${month.inflows.toLocaleString()}</td>
                  <td className="text-right py-2 px-2 text-red-600">${month.outflows.toLocaleString()}</td>
                  <td className={`text-right py-2 px-2 font-bold ${month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${month.netCashFlow.toLocaleString()}
                  </td>
                  <td className={`text-right py-2 px-2 font-bold ${month.cumulative >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${month.cumulative.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Inflows and Outflows Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Cash Inflows ({inflows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {inflows.length === 0 ? (
              <p className="text-sm text-slate-500">No inflows added yet</p>
            ) : (
              <div className="space-y-2">
                {inflows.map(inf => (
                  <div key={inf.id} className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                    <div>
                      <p className="font-medium">{inf.source}</p>
                      <p className="text-xs text-slate-600">Month {inf.month} • {inf.probability}% probability</p>
                    </div>
                    <p className="font-bold text-green-600">${inf.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base">Cash Outflows ({outflows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {outflows.length === 0 ? (
              <p className="text-sm text-slate-500">No outflows added yet</p>
            ) : (
              <div className="space-y-2">
                {outflows.map(outf => (
                  <div key={outf.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                    <div>
                      <p className="font-medium">{outf.category}</p>
                      <p className="text-xs text-slate-600">Month {outf.month} {outf.description && `• ${outf.description}`}</p>
                    </div>
                    <p className="font-bold text-red-600">${outf.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
