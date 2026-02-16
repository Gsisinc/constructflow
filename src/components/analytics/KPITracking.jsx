import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function KPITracking() {
  const [timeRange, setTimeRange] = useState('ytd');

  const kpis = [
    {
      category: 'Schedule',
      items: [
        { name: 'On-Time Completion %', current: 85, target: 90, trend: 'down', change: -3, unit: '%' },
        { name: 'Schedule Variance', current: 2.1, target: 0, trend: 'down', change: -0.5, unit: '%' },
        { name: 'Critical Path Duration', current: 52, target: 48, trend: 'up', change: 2, unit: 'days' },
      ],
    },
    {
      category: 'Budget',
      items: [
        { name: 'Budget Variance', current: 2.8, target: 2, trend: 'down', change: -0.3, unit: '%' },
        { name: 'Cost Performance Index', current: 0.97, target: 1.0, trend: 'down', change: -0.02, unit: 'ratio' },
        { name: 'Project Margin %', current: 4.2, target: 6, trend: 'down', change: -0.8, unit: '%' },
      ],
    },
    {
      category: 'Safety',
      items: [
        { name: 'Days Without Incident', current: 45, target: 90, trend: 'down', change: -5, unit: 'days' },
        { name: 'OSHA Reportable Rate', current: 2, target: 0, trend: 'down', change: 0, unit: 'incidents' },
        { name: 'Near-Miss Reports', current: 12, target: 8, trend: 'up', change: 3, unit: 'count' },
      ],
    },
    {
      category: 'Quality',
      items: [
        { name: 'Punch List Items', current: 8, target: 0, trend: 'up', change: -2, unit: 'count' },
        { name: 'RFI Response Time', current: 3.2, target: 2, trend: 'up', change: -0.5, unit: 'days' },
        { name: 'Defect Rate', current: 0.8, target: 0.5, trend: 'down', change: -0.1, unit: '%' },
      ],
    },
    {
      category: 'Resources',
      items: [
        { name: 'Labor Utilization %', current: 82, target: 85, trend: 'up', change: 3, unit: '%' },
        { name: 'Equipment Utilization %', current: 76, target: 80, trend: 'down', change: -2, unit: '%' },
        { name: 'Team Productivity', current: 94, target: 100, trend: 'up', change: 4, unit: '%' },
      ],
    },
  ];

  const monthlyData = [
    { month: 'Jan', schedule: 88, budget: 3.2, safety: 25, quality: 95, resources: 78 },
    { month: 'Feb', schedule: 87, budget: 2.9, safety: 15, quality: 93, resources: 80 },
    { month: 'Mar', schedule: 86, budget: 3.1, safety: 35, quality: 94, resources: 79 },
    { month: 'Apr', schedule: 85, budget: 2.8, safety: 40, quality: 96, resources: 81 },
    { month: 'May', schedule: 85, budget: 2.7, safety: 45, quality: 95, resources: 82 },
    { month: 'Jun', schedule: 85, budget: 2.8, safety: 45, quality: 94, resources: 82 },
  ];

  const getStatusColor = (current, target, type = 'higher') => {
    const diff = type === 'higher' ? current >= target : current <= target;
    if (diff) return 'text-green-600';
    if (Math.abs(current - target) <= (target * 0.1)) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? (
      <TrendingUp className="text-green-600" size={16} />
    ) : (
      <TrendingDown className="text-red-600" size={16} />
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KPI Tracking Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor key performance indicators across projects and operations.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'On-Time %', value: '85%', target: '90%', status: 'warn' },
          { label: 'Budget Variance', value: '2.8%', target: '2%', status: 'warn' },
          { label: 'Safety (Days)', value: '45', target: '90', status: 'warn' },
          { label: 'Quality Score', value: '94%', target: '98%', status: 'good' },
          { label: 'Labor Util.', value: '82%', target: '85%', status: 'warn' },
        ].map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-600 font-medium">{metric.label}</p>
              <p className={`text-2xl font-bold mt-2 ${
                metric.status === 'good' ? 'text-green-600' : metric.status === 'warn' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metric.value}
              </p>
              <p className="text-xs text-gray-600 mt-1">Target: {metric.target}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="detail">Details</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {kpis.map((category, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target size={20} />
                  {category.category} KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.items.map((item, itemIdx) => {
                    const statusColor = getStatusColor(item.current, item.target);
                    return (
                      <div key={itemIdx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{item.name}</span>
                            {getTrendIcon(item.trend)}
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${statusColor}`}>
                              {item.current} {item.unit}
                            </span>
                            <span className="text-xs text-gray-600 ml-2">Target: {item.target}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.current >= item.target ? 'bg-green-500' : 
                              item.current >= (item.target * 0.9) ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min((item.current / item.target) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KPI Trends Over Time</CardTitle>
              <CardDescription>6-month historical performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="schedule" stroke="#3b82f6" name="Schedule %" />
                  <Line type="monotone" dataKey="quality" stroke="#10b981" name="Quality %" />
                  <Line type="monotone" dataKey="resources" stroke="#f59e0b" name="Resources %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget Variance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="budget" fill="#ef4444" name="Budget Variance %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {kpis.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">
                          Change: {item.change > 0 ? '+' : ''}{item.change} {item.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            item.current >= item.target
                              ? 'bg-green-100 text-green-800'
                              : item.current >= (item.target * 0.9)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {item.current} {item.unit}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-yellow-600" size={20} />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  category: 'Schedule',
                  issue: 'On-Time Completion below target',
                  current: '85%',
                  target: '90%',
                  severity: 'medium',
                },
                {
                  category: 'Safety',
                  issue: 'Days Without Incident declining',
                  current: '45 days',
                  target: '90 days',
                  severity: 'high',
                },
                {
                  category: 'Budget',
                  issue: 'Project margins compressed',
                  current: '4.2%',
                  target: '6%',
                  severity: 'medium',
                },
                {
                  category: 'Resources',
                  issue: 'Equipment utilization trending down',
                  current: '76%',
                  target: '80%',
                  severity: 'low',
                },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 border rounded-lg ${
                    alert.severity === 'high'
                      ? 'bg-red-50 border-red-300'
                      : alert.severity === 'medium'
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-blue-50 border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{alert.category}</p>
                      <p className="text-sm mt-1">{alert.issue}</p>
                    </div>
                    <Badge
                      className={
                        alert.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-2">
                    <span>Current: <span className="font-medium">{alert.current}</span></span>
                    <span>Target: <span className="font-medium">{alert.target}</span></span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="font-semibold mb-1">Safety Priority</p>
                <p className="text-gray-700">Implement enhanced safety protocols on Project B to improve incident prevention</p>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="font-semibold mb-1">Schedule Management</p>
                <p className="text-gray-700">Reallocate resources to critical path tasks to improve on-time completion rate</p>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="font-semibold mb-1">Cost Control</p>
                <p className="text-gray-700">Review material pricing and labor productivity to restore project margins</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
