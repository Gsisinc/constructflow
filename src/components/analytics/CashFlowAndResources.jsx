import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

// Cash Flow Forecasting
export function CashFlowForecast({ invoices = [], expenses = [] }) {
  const [forecasts, setForecasts] = useState([]);
  const [showAddForecast, setShowAddForecast] = useState(false);
  const [newForecast, setNewForecast] = useState({
    month: new Date().toISOString().split('T')[0].slice(0, 7),
    projectedIncome: 0,
    projectedExpenses: 0,
    notes: ''
  });

  // Generate 12-month forecast
  const cashFlowData = useMemo(() => {
    const months = [];
    let currentBalance = 0;

    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthStr = date.toISOString().slice(0, 7);

      const forecast = forecasts.find(f => f.month === monthStr);
      const income = forecast?.projectedIncome || 50000;
      const expenses = forecast?.projectedExpenses || 35000;
      const netFlow = income - expenses;
      currentBalance += netFlow;

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        balance: currentBalance,
        netFlow
      });
    }

    return months;
  }, [forecasts]);

  const addForecast = () => {
    if (!newForecast.month || newForecast.projectedIncome <= 0) {
      toast.error('Please fill in month and income');
      return;
    }

    setForecasts([...forecasts, {
      ...newForecast,
      id: Date.now()
    }]);

    setNewForecast({
      month: new Date().toISOString().split('T')[0].slice(0, 7),
      projectedIncome: 0,
      projectedExpenses: 0,
      notes: ''
    });
    setShowAddForecast(false);
    toast.success('Forecast added');
  };

  const deleteForecast = (id) => {
    setForecasts(forecasts.filter(f => f.id !== id));
    toast.success('Forecast deleted');
  };

  const currentBalance = cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1].balance : 0;
  const avgMonthlyFlow = cashFlowData.reduce((sum, m) => sum + m.netFlow, 0) / cashFlowData.length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projected 12M Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentBalance.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Monthly Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold flex items-center gap-1 ${avgMonthlyFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgMonthlyFlow >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              ${Math.abs(avgMonthlyFlow).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{forecasts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Cash Flow Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" />
              <Bar dataKey="expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Balance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Balance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Forecast Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Forecasts</CardTitle>
          <Dialog open={showAddForecast} onOpenChange={setShowAddForecast}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Forecast
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Cash Flow Forecast</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <Input
                    type="month"
                    value={newForecast.month}
                    onChange={(e) => setNewForecast({ ...newForecast, month: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Projected Income</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newForecast.projectedIncome}
                    onChange={(e) => setNewForecast({ ...newForecast, projectedIncome: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Projected Expenses</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newForecast.projectedExpenses}
                    onChange={(e) => setNewForecast({ ...newForecast, projectedExpenses: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <Input
                    placeholder="Any notes about this forecast"
                    value={newForecast.notes}
                    onChange={(e) => setNewForecast({ ...newForecast, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddForecast(false)}>Cancel</Button>
                  <Button onClick={addForecast}>Add Forecast</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {forecasts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No forecasts yet. Add monthly projections to plan cash flow.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Month</th>
                    <th className="text-right py-2 px-2">Income</th>
                    <th className="text-right py-2 px-2">Expenses</th>
                    <th className="text-right py-2 px-2">Net Flow</th>
                    <th className="text-left py-2 px-2">Notes</th>
                    <th className="text-right py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map(forecast => (
                    <tr key={forecast.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{forecast.month}</td>
                      <td className="text-right py-2 px-2">${forecast.projectedIncome.toLocaleString()}</td>
                      <td className="text-right py-2 px-2">${forecast.projectedExpenses.toLocaleString()}</td>
                      <td className={`text-right py-2 px-2 font-medium ${
                        (forecast.projectedIncome - forecast.projectedExpenses) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        ${(forecast.projectedIncome - forecast.projectedExpenses).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-slate-600 text-xs">{forecast.notes}</td>
                      <td className="text-right py-2 px-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteForecast(forecast.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Resource Allocation & Leveling
export function ResourceAllocation({ teams = [] }) {
  const [allocations, setAllocations] = useState([]);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    teamMember: '',
    project: '',
    hoursPerWeek: 40,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    role: 'Developer',
    status: 'active'
  });

  const roles = ['Project Manager', 'Foreman', 'Laborer', 'Electrician', 'Plumber', 'HVAC Tech', 'Safety Officer', 'Inspector'];

  const addAllocation = () => {
    if (!newAllocation.teamMember || !newAllocation.project) {
      toast.error('Please select team member and project');
      return;
    }

    setAllocations([...allocations, {
      ...newAllocation,
      id: Date.now(),
      utilization: 100
    }]);

    setNewAllocation({
      teamMember: '',
      project: '',
      hoursPerWeek: 40,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      role: 'Developer',
      status: 'active'
    });
    setShowAddAllocation(false);
    toast.success('Resource allocated');
  };

  const deleteAllocation = (id) => {
    setAllocations(allocations.filter(a => a.id !== id));
    toast.success('Allocation removed');
  };

  // Calculate team utilization
  const teamUtilization = useMemo(() => {
    const teamMap = {};
    allocations.forEach(alloc => {
      if (!teamMap[alloc.teamMember]) {
        teamMap[alloc.teamMember] = 0;
      }
      teamMap[alloc.teamMember] += alloc.hoursPerWeek;
    });

    return Object.entries(teamMap).map(([name, hours]) => ({
      name,
      allocated: hours,
      capacity: 40,
      utilization: Math.min((hours / 40) * 100, 150),
      overallocated: hours > 40
    }));
  }, [allocations]);

  return (
    <div className="space-y-4">
      {/* Utilization Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allocations.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Team Members Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teamUtilization.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overallocated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {teamUtilization.filter(t => t.overallocated).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Utilization Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Utilization Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamUtilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="allocated" fill="#3b82f6" />
              <Bar dataKey="capacity" fill="#e5e7eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resource Allocation Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resource Allocations</CardTitle>
          <Dialog open={showAddAllocation} onOpenChange={setShowAddAllocation}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Allocate Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Allocate Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Team member name"
                  value={newAllocation.teamMember}
                  onChange={(e) => setNewAllocation({ ...newAllocation, teamMember: e.target.value })}
                />
                <Input
                  placeholder="Project name"
                  value={newAllocation.project}
                  onChange={(e) => setNewAllocation({ ...newAllocation, project: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newAllocation.role}
                  onChange={(e) => setNewAllocation({ ...newAllocation, role: e.target.value })}
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Hours per week"
                  value={newAllocation.hoursPerWeek}
                  onChange={(e) => setNewAllocation({ ...newAllocation, hoursPerWeek: parseFloat(e.target.value) || 0 })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={newAllocation.startDate}
                      onChange={(e) => setNewAllocation({ ...newAllocation, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <Input
                      type="date"
                      value={newAllocation.endDate}
                      onChange={(e) => setNewAllocation({ ...newAllocation, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddAllocation(false)}>Cancel</Button>
                  <Button onClick={addAllocation}>Allocate</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No allocations yet. Assign team members to projects.
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map(alloc => (
                <div key={alloc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{alloc.teamMember}</h3>
                      <p className="text-xs text-slate-600">
                        {alloc.project} • {alloc.role}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      alloc.overallocated
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {alloc.hoursPerWeek}/40 hrs
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition ${
                        alloc.hoursPerWeek <= 40 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((alloc.hoursPerWeek / 40) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {alloc.startDate} to {alloc.endDate}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAllocation(alloc.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
