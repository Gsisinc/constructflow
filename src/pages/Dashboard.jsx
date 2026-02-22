import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FolderKanban, FileText, AlertTriangle, DollarSign,
  TrendingUp, Users, CheckCircle2, Clock, Plus, ArrowRight,
  BarChart3, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusColors = {
  bidding: 'bg-purple-100 text-purple-700',
  awarded: 'bg-blue-100 text-blue-700',
  planning: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-slate-100 text-slate-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 20),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => base44.entities.Task.list('-created_date', 50),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues-all'],
    queryFn: () => base44.entities.Issue.list('-created_date', 50),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-all'],
    queryFn: () => base44.entities.Expense.list('-created_date', 50),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids-all'],
    queryFn: () => base44.entities.BidOpportunity.list('-created_date', 20),
  });

  // KPIs
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const openIssues = issues.filter(i => i.status === 'open').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const activeBids = bids.filter(b => b.status === 'active' || b.status === 'new' || b.status === 'analyzing').length;

  // Chart data
  const chartData = projects.slice(0, 6).map(p => ({
    name: p.name?.substring(0, 12) || 'Project',
    budget: p.budget || 0,
    spent: expenses.filter(e => e.project_id === p.id).reduce((s, e) => s + (e.amount || 0), 0),
  }));

  const recentProjects = projects.slice(0, 5);
  const recentIssues = issues.filter(i => i.status === 'open').slice(0, 4);
  const pendingTasksList = tasks.filter(t => t.status === 'pending').slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-500 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('Projects')}>
            <Button variant="outline" size="sm" className="gap-1">
              <FolderKanban className="h-4 w-4" /> Projects
            </Button>
          </Link>
          <Link to={createPageUrl('AddBid')}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add Bid
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active Projects', value: activeProjects, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50', link: 'Projects' },
          { label: 'Total Budget', value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', link: 'Budget' },
          { label: 'Total Spent', value: `$${(totalSpent / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', link: 'Budget' },
          { label: 'Open Issues', value: openIssues, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', link: 'Issues' },
          { label: 'Pending Tasks', value: pendingTasks, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50', link: 'TaskTracker' },
          { label: 'Active Bids', value: activeBids, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', link: 'Bids' },
        ].map(k => (
          <Link key={k.label} to={createPageUrl(k.link)}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 pb-3 px-4">
                <div className={`inline-flex p-1.5 rounded-lg ${k.bg} mb-2`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <p className="text-xl font-bold text-slate-900">{k.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" /> Budget vs. Spent by Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No project data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                  <Bar dataKey="budget" name="Budget" fill="#CBD5E1" radius={[4,4,0,0]} />
                  <Bar dataKey="spent" name="Spent" fill="#3B82F6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Open Issues */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Open Issues
            </CardTitle>
            <Link to={createPageUrl('Issues')}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentIssues.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No open issues 🎉</p>
            ) : (
              recentIssues.map(issue => (
                <div key={issue.id} className="flex items-start gap-2 py-2 border-b last:border-0">
                  <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{issue.title}</p>
                    <p className="text-xs text-slate-500">{issue.type} • {issue.severity}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-blue-500" /> Active Projects
            </CardTitle>
            <Link to={createPageUrl('Projects')}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No projects yet</p>
            ) : (
              recentProjects.map(p => (
                <Link key={p.id} to={`${createPageUrl('ProjectDetail')}?id=${p.id}`}>
                  <div className="py-2 border-b last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <Badge className={`text-xs flex-shrink-0 ${statusColors[p.status] || 'bg-slate-100 text-slate-700'}`}>
                        {p.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress || 0} className="h-1.5 flex-1" />
                      <span className="text-xs text-slate-500 flex-shrink-0">{p.progress || 0}%</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" /> Pending Tasks
            </CardTitle>
            <Link to={createPageUrl('TaskTracker')}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTasksList.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No pending tasks</p>
            ) : (
              pendingTasksList.map(task => (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${task.priority === 'critical' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-400' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.name}</p>
                    {task.due_date && (
                      <p className="text-xs text-slate-500">Due {format(new Date(task.due_date), 'MMM d')}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">{task.priority}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}