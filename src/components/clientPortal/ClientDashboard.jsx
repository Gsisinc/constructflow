import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ProgressBar
} from 'recharts';
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Download,
  Share2
} from 'lucide-react';

export default function ClientDashboard() {
  const [project] = useState({
    id: 'PROJ-2024-001',
    name: 'Downtown Office Complex Renovation',
    status: 'In Progress',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    budget: 2500000,
    spent: 1850000,
    progress: 74,
    description: 'Complete renovation of downtown office complex including structural updates, mechanical systems, and interior finishes.',
    location: '123 Main Street, Downtown'
  });

  const [timeline] = useState([
    { month: 'Jan', planned: 100, actual: 95 },
    { month: 'Feb', planned: 200, actual: 210 },
    { month: 'Mar', planned: 300, actual: 290 },
    { month: 'Apr', planned: 400, actual: 420 },
    { month: 'May', planned: 500, actual: 510 },
    { month: 'Jun', planned: 600, actual: 590 }
  ]);

  const [budget] = useState([
    { name: 'Labor', value: 900000, color: '#3b82f6' },
    { name: 'Materials', value: 650000, color: '#10b981' },
    { name: 'Equipment', value: 200000, color: '#f59e0b' },
    { name: 'Other', value: 100000, color: '#8b5cf6' }
  ]);

  const [milestones] = useState([
    {
      id: 1,
      name: 'Foundation & Structural Work',
      status: 'completed',
      date: new Date('2024-03-31'),
      progress: 100
    },
    {
      id: 2,
      name: 'Mechanical & Electrical Systems',
      status: 'in-progress',
      date: new Date('2024-06-30'),
      progress: 65
    },
    {
      id: 3,
      name: 'Interior Finishes',
      status: 'pending',
      date: new Date('2024-09-30'),
      progress: 0
    },
    {
      id: 4,
      name: 'Final Inspections & Handover',
      status: 'pending',
      date: new Date('2024-12-31'),
      progress: 0
    }
  ]);

  const [team] = useState([
    { id: 1, name: 'John Smith', role: 'Project Manager', email: 'john@company.com', phone: '(555) 123-4567' },
    { id: 2, name: 'Sarah Johnson', role: 'Site Supervisor', email: 'sarah@company.com', phone: '(555) 234-5678' },
    { id: 3, name: 'Mike Davis', role: 'Lead Electrician', email: 'mike@company.com', phone: '(555) 345-6789' }
  ]);

  const budgetSpent = project.spent;
  const budgetRemaining = project.budget - project.spent;
  const daysRemaining = Math.ceil((project.endDate - new Date()) / (1000 * 60 * 60 * 24));

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-slate-600 mt-1">{project.location}</p>
          <p className="text-sm text-slate-500 mt-1">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Project Status</p>
                <p className="text-2xl font-bold mt-2">{project.progress}%</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Budget Status</p>
                <p className="text-2xl font-bold mt-2">${(budgetSpent / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-slate-500 mt-1">of ${(project.budget / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Timeline</p>
                <p className="text-2xl font-bold mt-2">{daysRemaining} days</p>
                <p className="text-xs text-slate-500 mt-1">Remaining</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Team Members</p>
                <p className="text-2xl font-bold mt-2">{team.length}</p>
                <p className="text-xs text-slate-500 mt-1">Assigned</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Progress</CardTitle>
            <CardDescription>Planned vs Actual Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="#3b82f6" name="Planned" />
                <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown</CardTitle>
            <CardDescription>Spending by Category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budget}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}K`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budget.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Project Milestones</CardTitle>
          <CardDescription>Track key project phases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{milestone.name}</h4>
                  <Badge className={getStatusColor(milestone.status)}>
                    {milestone.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  Target: {milestone.date.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{milestone.progress}%</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle>Project Team</CardTitle>
          <CardDescription>Key contacts for this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {team.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-slate-600">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{member.email}</p>
                  <p className="text-sm text-slate-600">{member.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
