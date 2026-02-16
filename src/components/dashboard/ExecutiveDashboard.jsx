import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ExecutiveDashboard() {
  const [timeRange, setTimeRange] = useState('ytd');

  const portfolioData = [
    { month: 'Jan', revenue: 2400000, target: 2200000, profit: 480000 },
    { month: 'Feb', revenue: 3200000, target: 2800000, profit: 640000 },
    { month: 'Mar', revenue: 2800000, target: 2600000, profit: 560000 },
    { month: 'Apr', revenue: 3600000, target: 3000000, profit: 720000 },
    { month: 'May', revenue: 3100000, target: 2900000, profit: 620000 },
    { month: 'Jun', revenue: 3900000, target: 3200000, profit: 780000 },
  ];

  const projectStatusData = [
    { name: 'On Track', value: 12, color: '#10b981' },
    { name: 'At Risk', value: 4, color: '#f59e0b' },
    { name: 'Behind Schedule', value: 2, color: '#ef4444' },
    { name: 'Completed', value: 8, color: '#6366f1' },
  ];

  const profitabilityData = [
    { project: 'Project A', budgeted: 500000, actual: 480000, margin: 3.8 },
    { project: 'Project B', budgeted: 350000, actual: 365000, margin: -4.3 },
    { project: 'Project C', budgeted: 600000, actual: 580000, margin: 3.3 },
    { project: 'Project D', budgeted: 450000, actual: 445000, margin: 1.1 },
    { project: 'Project E', budgeted: 380000, actual: 395000, margin: -3.9 },
  ];

  const kpis = [
    { label: 'Total Portfolio Value', value: '$18.6M', change: '+12%', trend: 'up' },
    { label: 'YTD Revenue', value: '$18.6M', change: '+8%', trend: 'up' },
    { label: 'Avg Project Margin', value: '2.8%', change: '+0.5%', trend: 'up' },
    { label: 'On-Time Completion', value: '85%', change: '-3%', trend: 'down' },
    { label: 'Budget Variance', value: '+2.1%', change: 'Over', trend: 'down' },
    { label: 'Safety Incidents (YTD)', value: '2', change: 'Last: 45 days', trend: 'up' },
  ];

  const staffUtilization = [
    { role: 'Project Managers', available: 8, assigned: 7, utilization: 87.5 },
    { role: 'Foremen', available: 12, assigned: 10, utilization: 83.3 },
    { role: 'Crew Leaders', available: 24, assigned: 18, utilization: 75 },
    { role: 'Equipment Operators', available: 15, assigned: 13, utilization: 86.7 },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-gray-600 mt-2">
            High-level overview of company performance, projects, and KPIs
          </p>
        </div>
        <div className="flex gap-2">
          {['mtd', 'qtd', 'ytd'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="col-span-1 md:col-span-1 lg:col-span-1">
            <CardContent className="pt-6">
              <p className="text-xs text-gray-600 font-medium truncate">{kpi.label}</p>
              <p className="text-xl font-bold mt-2">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.trend === 'up' ? (
                  <TrendingUp size={14} className="text-green-600" />
                ) : (
                  <TrendingDown size={14} className="text-red-600" />
                )}
                <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Financial Performance</TabsTrigger>
          <TabsTrigger value="projects">Project Status</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="risks">Risk Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Target</CardTitle>
              <CardDescription>Monthly performance against targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    name="Actual Revenue"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#10b981"
                    name="Target Revenue"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={portfolioData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Bar dataKey="profit" fill="#10b981" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Profitability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profitabilityData.map((proj, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{proj.project}</span>
                      <span className={`font-bold ${proj.margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {proj.margin > 0 ? '+' : ''}{proj.margin}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${proj.margin > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{
                          width: `${Math.min(Math.abs(proj.margin) * 20, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { status: 'On Track', count: 12, color: 'bg-green-100 text-green-800' },
                  { status: 'At Risk', count: 4, color: 'bg-yellow-100 text-yellow-800' },
                  { status: 'Behind Schedule', count: 2, color: 'bg-red-100 text-red-800' },
                  { status: 'Completed', count: 8, color: 'bg-blue-100 text-blue-800' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color.split(' ')[0]}`} />
                      <span className="font-medium">{item.status}</span>
                    </div>
                    <Badge className={item.color}>{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {staffUtilization.map((staff, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{staff.role}</p>
                      <p className="text-xs text-gray-600">
                        {staff.assigned} of {staff.available} assigned
                      </p>
                    </div>
                    <span className="text-lg font-bold">{staff.utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        staff.utilization > 85
                          ? 'bg-green-500'
                          : staff.utilization > 70
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${staff.utilization}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Risk Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { project: 'Project B', risk: 'Material price escalation', impact: 'High', probability: 'Medium' },
                { project: 'Project D', risk: 'Labor availability', impact: 'High', probability: 'High' },
                { project: 'Project A', risk: 'Weather delays', impact: 'Medium', probability: 'Low' },
                { project: 'Project C', risk: 'Design changes', impact: 'Medium', probability: 'Medium' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{item.project} - {item.risk}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.risk}</p>
                    </div>
                    <AlertCircle className="text-orange-600" size={20} />
                  </div>
                  <div className="flex gap-2">
                    <Badge className={item.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                      Impact: {item.impact}
                    </Badge>
                    <Badge className={item.probability === 'High' ? 'bg-red-100 text-red-800' : item.probability === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                      {item.probability} Prob.
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
