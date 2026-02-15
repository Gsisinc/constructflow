import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download, TrendingUp, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

// Custom Report Builder
export function CustomReportBuilder({ projects = [] }) {
  const [reports, setReports] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'financial',
    metrics: ['budget', 'actual', 'variance'],
    groupBy: 'project',
    dateRange: 'month',
    includeCharts: true
  });

  const reportTypes = [
    { id: 'financial', name: 'Financial Report', metrics: ['budget', 'actual', 'variance', 'margin'] },
    { id: 'progress', name: 'Progress Report', metrics: ['completed', 'in-progress', 'pending', 'blocked'] },
    { id: 'resource', name: 'Resource Report', metrics: ['allocated', 'available', 'utilization'] },
    { id: 'safety', name: 'Safety Report', metrics: ['incidents', 'near-miss', 'compliance'] },
    { id: 'schedule', name: 'Schedule Report', metrics: ['on-time', 'delayed', 'ahead'] }
  ];

  const groupByOptions = ['project', 'phase', 'team', 'week', 'month'];
  const dateRanges = ['week', 'month', 'quarter', 'year', 'custom'];

  const createReport = () => {
    if (!newReport.name) {
      toast.error('Please enter report name');
      return;
    }

    setReports([...reports, {
      ...newReport,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      generatedCount: 0
    }]);

    setNewReport({
      name: '',
      type: 'financial',
      metrics: ['budget', 'actual', 'variance'],
      groupBy: 'project',
      dateRange: 'month',
      includeCharts: true
    });
    setShowBuilder(false);
    toast.success('Report template created');
  };

  const generateReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    setReports(reports.map(r =>
      r.id === reportId ? { ...r, generatedCount: (r.generatedCount || 0) + 1, lastGenerated: new Date().toISOString().split('T')[0] } : r
    ));
    toast.success(`Report generated: ${report.name}`);
  };

  const deleteReport = (id) => {
    setReports(reports.filter(r => r.id !== id));
    toast.success('Report deleted');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Custom Report Builder</CardTitle>
        <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Report Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Report name"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium mb-2">Report Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {reportTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setNewReport({ ...newReport, type: type.id, metrics: type.metrics })}
                      className={`p-2 border rounded text-left text-sm transition ${
                        newReport.type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium">{type.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Metrics to Include</label>
                <div className="flex flex-wrap gap-2">
                  {reportTypes.find(t => t.id === newReport.type)?.metrics.map(metric => (
                    <button
                      key={metric}
                      onClick={() => {
                        if (newReport.metrics.includes(metric)) {
                          setNewReport({
                            ...newReport,
                            metrics: newReport.metrics.filter(m => m !== metric)
                          });
                        } else {
                          setNewReport({
                            ...newReport,
                            metrics: [...newReport.metrics, metric]
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        newReport.metrics.includes(metric)
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Group By</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newReport.groupBy}
                    onChange={(e) => setNewReport({ ...newReport, groupBy: e.target.value })}
                  >
                    {groupByOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newReport.dateRange}
                    onChange={(e) => setNewReport({ ...newReport, dateRange: e.target.value })}
                  >
                    {dateRanges.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newReport.includeCharts}
                  onChange={(e) => setNewReport({ ...newReport, includeCharts: e.target.checked })}
                />
                <span className="text-sm">Include charts and visualizations</span>
              </label>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
                <Button onClick={createReport}>Create Template</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Create custom report templates for your projects
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm">{report.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Type: {report.type} • Group by: {report.groupBy} • Range: {report.dateRange}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {report.metrics.map(metric => (
                    <span key={metric} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                      {metric}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  {report.generatedCount} generated
                  {report.lastGenerated && ` • Last: ${report.lastGenerated}`}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => generateReport(report.id)}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Generate Report
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteReport(report.id)}
                    className="text-red-600"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Executive Dashboard
export function ExecutiveDashboard({ projects = [], invoices = [] }) {
  // Sample data - replace with real data from your backend
  const dashboardData = useMemo(() => {
    const totalProjects = projects.length;
    const onTimeProjects = Math.floor(totalProjects * 0.85);
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const avgMargin = 22.5; // Sample

    return {
      totalProjects,
      onTimeProjects,
      completionRate: Math.floor((onTimeProjects / totalProjects) * 100) || 0,
      totalRevenue,
      avgMargin,
      monthlySales: [
        { month: 'Jan', revenue: 45000, target: 50000 },
        { month: 'Feb', revenue: 52000, target: 50000 },
        { month: 'Mar', revenue: 48000, target: 50000 },
        { month: 'Apr', revenue: 61000, target: 50000 },
        { month: 'May', revenue: 55000, target: 50000 },
        { month: 'Jun', revenue: 67000, target: 50000 }
      ],
      projectStatus: [
        { status: 'Completed', count: 8 },
        { status: 'In Progress', count: 12 },
        { status: 'Pending', count: 5 },
        { status: 'On Hold', count: 2 }
      ],
      topMetrics: [
        { label: 'Revenue This Month', value: '$67,000', change: '+12%', icon: DollarSign },
        { label: 'Projects On Time', value: `${onTimeProjects}/${totalProjects}`, change: '+5%', icon: CheckCircle },
        { label: 'Avg Project Margin', value: `${avgMargin}%`, change: '-2%', icon: TrendingUp },
        { label: 'Safety Incidents', value: '0', change: 'All clear', icon: AlertCircle }
      ]
    };
  }, [projects, invoices]);

  return (
    <div className="space-y-4">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardData.topMetrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {metric.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className={`text-xs mt-1 ${
                  metric.change.includes('+') ? 'text-green-600' :
                  metric.change.includes('-') ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" />
                <Bar dataKey="target" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.projectStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="status" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* KPI Trends */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Project Profitability Analysis
export function ProfitabilityAnalysis({ projects = [] }) {
  const [selectedProject, setSelectedProject] = useState(null);

  const projectProfitability = useMemo(() => {
    return projects.map(project => ({
      id: project.id,
      name: project.name,
      budget: project.budget || 0,
      actual: project.actualCost || 0,
      revenue: project.revenue || 0,
      variance: (project.budget || 0) - (project.actualCost || 0),
      margin: ((project.revenue || 0) - (project.actualCost || 0)) / (project.revenue || 1) * 100,
      status: project.status || 'in-progress'
    })).slice(0, 10);
  }, [projects]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Profitability Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {projectProfitability.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No projects with profitability data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Project</th>
                  <th className="text-right py-2 px-2">Budget</th>
                  <th className="text-right py-2 px-2">Actual Cost</th>
                  <th className="text-right py-2 px-2">Variance</th>
                  <th className="text-right py-2 px-2">Revenue</th>
                  <th className="text-right py-2 px-2">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {projectProfitability.map(project => (
                  <tr key={project.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium">{project.name}</td>
                    <td className="text-right py-2 px-2">${project.budget.toLocaleString()}</td>
                    <td className="text-right py-2 px-2">${project.actual.toLocaleString()}</td>
                    <td className={`text-right py-2 px-2 font-medium ${
                      project.variance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${project.variance.toLocaleString()}
                    </td>
                    <td className="text-right py-2 px-2">${project.revenue.toLocaleString()}</td>
                    <td className={`text-right py-2 px-2 font-medium ${
                      project.margin >= 20 ? 'text-green-600' : project.margin >= 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {project.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
