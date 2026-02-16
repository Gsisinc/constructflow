import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye, Download, Copy } from 'lucide-react';

export default function CustomReportBuilder() {
  const [reports, setReports] = useState([
    {
      id: 1,
      name: 'Weekly Project Status',
      description: 'High-level project overview for stakeholders',
      fields: ['Project Name', 'Status', 'Progress %', 'Budget', 'Schedule'],
      frequency: 'weekly',
      recipients: ['project-manager@company.com', 'client@client.com'],
      lastGenerated: '2026-02-15',
      nextScheduled: '2026-02-22',
    },
    {
      id: 2,
      name: 'Daily Safety Report',
      description: 'Daily safety incidents and near-misses',
      fields: ['Date', 'Incidents', 'Near Misses', 'Weather', 'Crew Count'],
      frequency: 'daily',
      recipients: ['safety-officer@company.com'],
      lastGenerated: '2026-02-15',
      nextScheduled: '2026-02-16',
    },
    {
      id: 3,
      name: 'Budget Variance Analysis',
      description: 'Detailed cost tracking and variances',
      fields: ['Task', 'Budgeted', 'Actual', 'Variance %', 'Status'],
      frequency: 'weekly',
      recipients: ['finance@company.com', 'project-manager@company.com'],
      lastGenerated: '2026-02-12',
      nextScheduled: '2026-02-19',
    },
  ]);

  const [selectedReport, setSelectedReport] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    fields: [],
    frequency: 'weekly',
    recipients: [],
  });

  const availableFields = [
    { category: 'Project', fields: ['Project Name', 'Project ID', 'Status', 'Progress %', 'Start Date', 'End Date', 'Location'] },
    { category: 'Financial', fields: ['Budget', 'Actual Costs', 'Variance', 'Variance %', 'Forecast', 'Revenue'] },
    { category: 'Schedule', fields: ['Baseline Duration', 'Actual Duration', 'Completion %', 'Critical Path', 'Slack Time', 'Forecast Completion'] },
    { category: 'Resources', fields: ['Team Size', 'Utilization %', 'Hours Logged', 'Allocation', 'Productivity'] },
    { category: 'Quality', fields: ['Defects Found', 'Defects Fixed', 'Punch List Items', 'Inspections Passed', 'Quality Score'] },
    { category: 'Safety', fields: ['Incidents', 'Near Misses', 'OSHA Violations', 'Training Hours', 'Injury Rate', 'Days Without Incident'] },
  ];

  const handleAddField = (field) => {
    if (!newReport.fields.includes(field)) {
      setNewReport(prev => ({
        ...prev,
        fields: [...prev.fields, field],
      }));
    }
  };

  const handleRemoveField = (field) => {
    setNewReport(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f !== field),
    }));
  };

  const handleSaveReport = () => {
    if (newReport.name.trim() && newReport.fields.length > 0) {
      const report = {
        id: Math.max(...reports.map(r => r.id), 0) + 1,
        ...newReport,
        lastGenerated: null,
        nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };
      setReports([...reports, report]);
      setNewReport({ name: '', description: '', fields: [], frequency: 'weekly', recipients: [] });
      setIsBuilding(false);
    }
  };

  const handleDeleteReport = (id) => {
    setReports(reports.filter(r => r.id !== id));
    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Report Builder</h1>
          <p className="text-gray-600 mt-2">
            Design and schedule custom reports tailored to your organization's needs.
          </p>
        </div>
        <Button
          onClick={() => setIsBuilding(!isBuilding)}
          size="lg"
          className={isBuilding ? 'bg-gray-600' : ''}
        >
          <Plus size={18} className="mr-2" />
          {isBuilding ? 'Cancel' : 'New Report'}
        </Button>
      </div>

      {isBuilding && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Create New Report</CardTitle>
            <CardDescription>
              Select fields and configure delivery for your custom report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Report Name</label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Executive Summary"
                  value={newReport.name}
                  onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Describe the purpose of this report..."
                  value={newReport.description}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg h-20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Select Fields to Include</label>
                <div className="space-y-4">
                  {availableFields.map((category) => (
                    <div key={category.category}>
                      <h4 className="font-semibold text-sm mb-2 text-gray-700">{category.category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {category.fields.map((field) => (
                          <button
                            key={field}
                            onClick={() => handleAddField(field)}
                            disabled={newReport.fields.includes(field)}
                            className={`p-2 rounded border text-sm transition ${
                              newReport.fields.includes(field)
                                ? 'bg-blue-100 border-blue-300 text-blue-900'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {field}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Selected Fields ({newReport.fields.length})</label>
                <div className="flex flex-wrap gap-2">
                  {newReport.fields.map((field) => (
                    <Badge key={field} className="bg-blue-100 text-blue-800 py-1 px-3">
                      {field}
                      <button
                        onClick={() => handleRemoveField(field)}
                        className="ml-2 hover:opacity-70"
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <select
                    value={newReport.frequency}
                    onChange={(e) => setNewReport(prev => ({ ...prev, frequency: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Recipients</label>
                  <input
                    type="text"
                    placeholder="email@example.com (comma separated)"
                    value={newReport.recipients.join(', ')}
                    onChange={(e) =>
                      setNewReport(prev => ({
                        ...prev,
                        recipients: e.target.value.split(',').map(r => r.trim()),
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveReport} className="flex-1">
                Save Report
              </Button>
              <Button
                onClick={() => setIsBuilding(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Reports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition ${
                  selectedReport?.id === report.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <Badge className="capitalize">
                      {report.frequency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Fields ({report.fields.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {report.fields.slice(0, 5).map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                      {report.fields.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{report.fields.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    {report.lastGenerated && (
                      <p>Last generated: {report.lastGenerated}</p>
                    )}
                    <p>Next scheduled: {report.nextScheduled}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye size={14} className="mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReport(report.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Executive Summary',
                description: 'High-level project metrics for leadership',
                fields: 5,
              },
              {
                name: 'Budget Analysis',
                description: 'Detailed cost tracking and variance analysis',
                fields: 8,
              },
              {
                name: 'Safety Report',
                description: 'Daily safety incidents and compliance tracking',
                fields: 6,
              },
              {
                name: 'Team Performance',
                description: 'Resource utilization and productivity metrics',
                fields: 7,
              },
              {
                name: 'Quality Dashboard',
                description: 'Defect tracking and quality metrics',
                fields: 5,
              },
              {
                name: 'Schedule Status',
                description: 'Timeline progress and critical path analysis',
                fields: 6,
              },
            ].map((template, idx) => (
              <Card key={idx} className="hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <p className="text-xs text-gray-500 mb-3">{template.fields} fields</p>
                  <Button size="sm" className="w-full">
                    <Copy size={14} className="mr-1" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Generation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { report: 'Weekly Project Status', generated: '2026-02-15 10:00 AM', recipients: 5, status: 'sent' },
                  { report: 'Daily Safety Report', generated: '2026-02-15 6:00 AM', recipients: 1, status: 'sent' },
                  { report: 'Budget Variance Analysis', generated: '2026-02-12 2:00 PM', recipients: 2, status: 'sent' },
                  { report: 'Weekly Project Status', generated: '2026-02-08 10:00 AM', recipients: 5, status: 'sent' },
                ].map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{entry.report}</p>
                      <p className="text-xs text-gray-600 mt-1">Generated {entry.generated}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">{entry.status}</Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {entry.recipients} recipients
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedReport && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>{selectedReport.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-600">{selectedReport.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Recipients</h3>
              <div className="space-y-1">
                {selectedReport.recipients.map((recipient, idx) => (
                  <p key={idx} className="text-sm text-gray-600">{recipient}</p>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-2">Fields Included</h3>
              <div className="flex flex-wrap gap-2">
                {selectedReport.fields.map((field) => (
                  <Badge key={field} variant="outline">{field}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
