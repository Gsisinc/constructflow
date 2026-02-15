import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download, BarChart3, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AdvancedReporting({ projects = [] }) {
  const [selectedMetrics, setSelectedMetrics] = useState(['profitability', 'schedule', 'budget']);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportName, setReportName] = useState('');
  const [showSaveReport, setShowSaveReport] = useState(false);

  const metrics = [
    { id: 'profitability', label: 'Project Profitability', icon: DollarSign },
    { id: 'schedule', label: 'Schedule Performance', icon: AlertCircle },
    { id: 'budget', label: 'Budget Variance', icon: TrendingUp },
    { id: 'kpi', label: 'KPI Tracking', icon: BarChart3 }
  ];

  const toggleMetric = (metricId) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const calculateProfitability = useMemo(() => {
    return projects.map(p => ({
      name: p.name,
      revenue: p.estimatedValue || 0,
      actualCost: p.actualCost || 0,
      profit: (p.estimatedValue || 0) - (p.actualCost || 0),
      margin: ((p.estimatedValue || 0) - (p.actualCost || 0)) / (p.estimatedValue || 1) * 100
    }));
  }, [projects]);

  const calculateSchedulePerformance = useMemo(() => {
    return projects.map(p => ({
      name: p.name,
      plannedDays: p.plannedDuration || 0,
      actualDays: p.actualDuration || 0,
      variance: (p.actualDuration || 0) - (p.plannedDuration || 0),
      percentComplete: p.progress || 0
    }));
  }, [projects]);

  const calculateBudgetVariance = useMemo(() => {
    return projects.map(p => ({
      name: p.name,
      budget: p.budget || 0,
      spent: p.actualCost || 0,
      variance: (p.actualCost || 0) - (p.budget || 0),
      percentSpent: ((p.actualCost || 0) / (p.budget || 1)) * 100
    }));
  }, [projects]);

  const calculateKPIs = useMemo(() => {
    const onTimeProjects = projects.filter(p => (p.actualDuration || 0) <= (p.plannedDuration || 0)).length;
    const withinBudget = projects.filter(p => (p.actualCost || 0) <= (p.budget || Infinity)).length;
    const totalRevenue = projects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
    const totalCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);

    return {
      onTimePercentage: ((onTimeProjects / projects.length) * 100).toFixed(1),
      withinBudgetPercentage: ((withinBudget / projects.length) * 100).toFixed(1),
      totalProfit: totalRevenue - totalCost,
      avgProfitMargin: (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1),
      totalProjectCount: projects.length
    };
  }, [projects]);

  const exportReport = (format) => {
    const reportData = {
      name: reportName || 'Project Report',
      generatedDate: new Date().toISOString(),
      dateRange,
      metrics: selectedMetrics,
      data: {
        profitability: calculateProfitability,
        schedule: calculateSchedulePerformance,
        budget: calculateBudgetVariance,
        kpi: calculateKPIs
      }
    };

    if (format === 'excel') {
      const csv = generateCSV(reportData);
      downloadFile(csv, `${reportName || 'report'}.csv`, 'text/csv');
    } else if (format === 'pdf') {
      toast.success('PDF export coming soon');
    }
  };

  const generateCSV = (data) => {
    let csv = `Project Report\nGenerated: ${new Date().toLocaleDateString()}\n\n`;

    if (selectedMetrics.includes('kpi')) {
      csv += 'KEY PERFORMANCE INDICATORS\n';
      csv += `On-Time Completion: ${data.data.kpi.onTimePercentage}%\n`;
      csv += `Within Budget: ${data.data.kpi.withinBudgetPercentage}%\n`;
      csv += `Total Profit: $${data.data.kpi.totalProfit.toLocaleString()}\n`;
      csv += `Average Profit Margin: ${data.data.kpi.avgProfitMargin}%\n\n`;
    }

    if (selectedMetrics.includes('profitability')) {
      csv += 'PROJECT PROFITABILITY\n';
      csv += 'Project,Revenue,Cost,Profit,Margin %\n';
      data.data.profitability.forEach(p => {
        csv += `${p.name},$${p.revenue},$${p.actualCost},$${p.profit},${p.margin.toFixed(1)}%\n`;
      });
      csv += '\n';
    }

    if (selectedMetrics.includes('budget')) {
      csv += 'BUDGET VARIANCE\n';
      csv += 'Project,Budget,Spent,Variance,% Spent\n';
      data.data.budget.forEach(b => {
        csv += `${b.name},$${b.budget},$${b.spent},$${b.variance},${b.percentSpent.toFixed(1)}%\n`;
      });
      csv += '\n';
    }

    if (selectedMetrics.includes('schedule')) {
      csv += 'SCHEDULE PERFORMANCE\n';
      csv += 'Project,Planned Days,Actual Days,Variance,% Complete\n';
      data.data.schedule.forEach(s => {
        csv += `${s.name},${s.plannedDays},${s.actualDays},${s.variance},${s.percentComplete}%\n`;
      });
    }

    return csv;
  };

  const downloadFile = (content, filename, mimeType) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`${filename} downloaded`);
  };

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">On-Time %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {calculateKPIs.onTimePercentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Within Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {calculateKPIs.withinBudgetPercentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              ${calculateKPIs.totalProfit.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {calculateKPIs.avgProfitMargin}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Metrics</label>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map(metric => (
                <button
                  key={metric.id}
                  onClick={() => toggleMetric(metric.id)}
                  className={`p-3 rounded border-2 text-left transition ${
                    selectedMetrics.includes(metric.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-sm">{metric.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Dialog open={showSaveReport} onOpenChange={setShowSaveReport}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Save Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (reportName) {
                        toast.success(`Report "${reportName}" saved`);
                        setShowSaveReport(false);
                      }
                    }}
                    className="w-full"
                  >
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" onClick={() => exportReport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportReport('pdf')}>
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profitability Report */}
      {selectedMetrics.includes('profitability') && (
        <Card>
          <CardHeader>
            <CardTitle>Project Profitability Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Project</th>
                    <th className="text-right py-2 px-2">Revenue</th>
                    <th className="text-right py-2 px-2">Cost</th>
                    <th className="text-right py-2 px-2">Profit</th>
                    <th className="text-right py-2 px-2">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateProfitability.map((p, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{p.name}</td>
                      <td className="text-right py-2 px-2">${p.revenue.toLocaleString()}</td>
                      <td className="text-right py-2 px-2">${p.actualCost.toLocaleString()}</td>
                      <td className={`text-right py-2 px-2 font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${p.profit.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-2">{p.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Variance Report */}
      {selectedMetrics.includes('budget') && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Variance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Project</th>
                    <th className="text-right py-2 px-2">Budget</th>
                    <th className="text-right py-2 px-2">Spent</th>
                    <th className="text-right py-2 px-2">Variance</th>
                    <th className="text-right py-2 px-2">% Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateBudgetVariance.map((b, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{b.name}</td>
                      <td className="text-right py-2 px-2">${b.budget.toLocaleString()}</td>
                      <td className="text-right py-2 px-2">${b.spent.toLocaleString()}</td>
                      <td className={`text-right py-2 px-2 font-bold ${b.variance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${b.variance.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-2">{b.percentSpent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Performance */}
      {selectedMetrics.includes('schedule') && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Project</th>
                    <th className="text-right py-2 px-2">Planned Days</th>
                    <th className="text-right py-2 px-2">Actual Days</th>
                    <th className="text-right py-2 px-2">Variance</th>
                    <th className="text-right py-2 px-2">% Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateSchedulePerformance.map((s, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{s.name}</td>
                      <td className="text-right py-2 px-2">{s.plannedDays}</td>
                      <td className="text-right py-2 px-2">{s.actualDays}</td>
                      <td className={`text-right py-2 px-2 font-bold ${s.variance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {s.variance > 0 ? '+' : ''}{s.variance} days
                      </td>
                      <td className="text-right py-2 px-2">{s.percentComplete}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdvancedReporting;
