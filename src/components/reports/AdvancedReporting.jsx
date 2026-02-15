import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download, BarChart3, TrendingUp, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function CustomReportBuilder() {
  const [reports, setReports] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

  const [newReport, setNewReport] = useState({
    name: '',
    type: 'project-summary',
    dateRange: 'monthly',
    metrics: [],
    format: 'pdf'
  });

  const reportTypes = [
    { id: 'project-summary', label: 'Project Summary' },
    { id: 'financial', label: 'Financial Summary' },
    { id: 'budget-vs-actual', label: 'Budget vs Actual' },
    { id: 'safety', label: 'Safety Report' },
    { id: 'resource', label: 'Resource Utilization' },
    { id: 'schedule', label: 'Schedule Performance' }
  ];

  const availableMetrics = {
    'project-summary': ['Progress %', 'Budget Status', 'Schedule Status', 'Team Size', 'Milestones Completed'],
    'financial': ['Revenue', 'Expenses', 'Profit', 'Contingency Used', 'Change Orders'],
    'budget-vs-actual': ['Budgeted Amount', 'Actual Spent', 'Variance $', 'Variance %', 'Forecast'],
    'safety': ['Incidents', 'Near Misses', 'Days Without Incident', 'OSHA Recordable', 'Safety Score'],
    'resource': ['Labor Hours', 'Equipment Utilization', 'Material Costs', 'Subcontractor Spend', 'Overtime Hours'],
    'schedule': ['On Time %', 'Days Ahead/Behind', 'Critical Path', 'Task Completion', 'Milestone Status']
  };

  const dateRanges = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  const formats = ['pdf', 'excel', 'csv', 'html'];

  const createReport = () => {
    if (!newReport.name || newReport.metrics.length === 0) {
      toast.error('Please enter name and select at least one metric');
      return;
    }

    setReports([...reports, {
      ...newReport,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      lastGenerated: null
    }]);

    setNewReport({
      name: '',
      type: 'project-summary',
      dateRange: 'monthly',
      metrics: [],
      format: 'pdf'
    });
    setShowBuilder(false);
    toast.success('Report template created');
  };

  const toggleMetric = (metric) => {
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
  };

  const generateReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    setReports(reports.map(r =>
      r.id === reportId
        ? { ...r, lastGenerated: new Date().toISOString() }
        : r
    ));
    toast.success(`Report generated in ${report.format.toUpperCase()}`);
  };

  const deleteReport = (reportId) => {
    setReports(reports.filter(r => r.id !== reportId));
    toast.success('Report template deleted');
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Report Name</label>
                <Input
                  placeholder="e.g., Monthly Project Health"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={newReport.type}
                    onChange={(e) => setNewReport({
                      ...newReport,
                      type: e.target.value,
                      metrics: []
                    })}
                  >
                    {reportTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={newReport.dateRange}
                    onChange={(e) => setNewReport({ ...newReport, dateRange: e.target.value })}
                  >
                    {dateRanges.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Select Metrics</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableMetrics[newReport.type]?.map(metric => (
                    <label key={metric} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newReport.metrics.includes(metric)}
                        onChange={() => toggleMetric(metric)}
                        className="rounded"
                      />
                      <span className="text-sm">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Export Format</label>
                <div className="flex gap-2">
                  {formats.map(f => (
                    <Button
                      key={f}
                      variant={newReport.format === f ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewReport({ ...newReport, format: f })}
                    >
                      {f.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
                <Button onClick={createReport}>Create Report</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No reports yet. Create a custom report template to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map(report => {
              const reportType = reportTypes.find(t => t.id === report.type);
              return (
                <Card key={report.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{report.name}</CardTitle>
                        <p className="text-xs text-slate-500 mt-1">{reportType?.label}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        {report.dateRange}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Metrics:</p>
                      <div className="flex flex-wrap gap-1">
                        {report.metrics.map(m => (
                          <span key={m} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {report.lastGenerated && (
                      <p className="text-xs text-slate-600">
                        Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => generateReport(report.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteReport(report.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Executive Dashboard Component
export function ExecutiveDashboard() {
  const [kpis] = useState({
    projectHealth: 78,
    budgetUtilization: 65,
    schedulePerformance: 82,
    safetyScore: 95,
    teamUtilization: 88,
    clientSatisfaction: 91
  });

  const [trends] = useState({
    budgetTrend: 3,
    scheduleTrend: -2,
    safetyTrend: 5,
    profitabilityTrend: 8
  });

  const getMetricColor = (value) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Executive Dashboard - Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Project Health */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Project Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className={`text-3xl font-bold ${getMetricColor(kpis.projectHealth)}`}>
                    {kpis.projectHealth}%
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-200 h-2 rounded overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${kpis.projectHealth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Utilization */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className={`text-3xl font-bold ${getMetricColor(kpis.budgetUtilization)}`}>
                    {kpis.budgetUtilization}%
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(trends.budgetTrend)}
                    <span className="text-xs text-slate-600">{Math.abs(trends.budgetTrend)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Performance */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Schedule Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className={`text-3xl font-bold ${getMetricColor(kpis.schedulePerformance)}`}>
                    {kpis.schedulePerformance}%
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(trends.scheduleTrend)}
                    <span className="text-xs text-slate-600">{Math.abs(trends.scheduleTrend)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Score */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Safety Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className={`text-3xl font-bold ${getMetricColor(kpis.safetyScore)}`}>
                    {kpis.safetyScore}%
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(trends.safetyTrend)}
                    <span className="text-xs text-slate-600">{Math.abs(trends.safetyTrend)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Utilization */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Team Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className={`text-3xl font-bold ${getMetricColor(kpis.teamUtilization)}`}>
                    {kpis.teamUtilization}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Satisfaction */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Client Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className={`text-3xl font-bold ${getMetricColor(kpis.clientSatisfaction)}`}>
                    {kpis.clientSatisfaction}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-slate-600">Total Project Revenue</p>
              <p className="text-2xl font-bold mt-2">$2,850,000</p>
              <p className="text-xs text-slate-600 mt-1">+12% from last month</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-slate-600">Total Profit</p>
              <p className="text-2xl font-bold mt-2">$428,750</p>
              <p className="text-xs text-slate-600 mt-1">15% margin</p>
            </div>
            <div className="p-4 bg-orange-50 rounded">
              <p className="text-sm text-slate-600">Budget vs Actual</p>
              <p className="text-2xl font-bold mt-2">-$85,000</p>
              <p className="text-xs text-slate-600 mt-1">3% over budget</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <p className="text-sm text-slate-600">Profitability Trend</p>
              <p className="text-2xl font-bold mt-2">+8%</p>
              <p className="text-xs text-slate-600 mt-1">Increasing trend</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Project Profitability Analysis
export function ProfitabilityAnalysis() {
  const [projects] = useState([
    { id: 1, name: 'Downtown Office Tower', revenue: 2500000, costs: 1950000, margin: 22 },
    { id: 2, name: 'Suburban Mall Renovation', revenue: 1200000, costs: 1020000, margin: 15 },
    { id: 3, name: 'Industrial Warehouse', revenue: 850000, costs: 680000, margin: 20 },
    { id: 4, name: 'Retail Store Build-out', revenue: 450000, costs: 405000, margin: 10 }
  ]);

  const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
  const totalCosts = projects.reduce((sum, p) => sum + p.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const avgMargin = (totalProfit / totalRevenue * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Profitability Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-xs text-slate-600">Total Revenue</p>
            <p className="text-xl font-bold">${(totalRevenue / 1000000).toFixed(1)}M</p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-xs text-slate-600">Total Costs</p>
            <p className="text-xl font-bold">${(totalCosts / 1000000).toFixed(1)}M</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-xs text-slate-600">Total Profit</p>
            <p className="text-xl font-bold text-green-700">${(totalProfit / 1000000).toFixed(1)}M</p>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-slate-600">Avg Margin</p>
            <p className="text-xl font-bold text-blue-700">{avgMargin}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Project</th>
                <th className="text-right py-2 px-2">Revenue</th>
                <th className="text-right py-2 px-2">Costs</th>
                <th className="text-right py-2 px-2">Profit</th>
                <th className="text-right py-2 px-2">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id} className="border-b hover:bg-slate-50">
                  <td className="py-2 px-2">{project.name}</td>
                  <td className="text-right py-2 px-2">${(project.revenue / 1000).toFixed(0)}k</td>
                  <td className="text-right py-2 px-2">${(project.costs / 1000).toFixed(0)}k</td>
                  <td className="text-right py-2 px-2 font-bold text-green-600">
                    ${((project.revenue - project.costs) / 1000).toFixed(0)}k
                  </td>
                  <td className="text-right py-2 px-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {project.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
