import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FolderKanban,
  FileText,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  Activity,
} from 'lucide-react';

function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 50),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-updated_date', 100),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list('-updated_date', 50),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids'],
    queryFn: () => base44.entities.Bid.list('-updated_date', 50),
  });

  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning' || p.status === 'awarded');
  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const activeBids = bids.filter(b => b.status === 'draft' || b.status === 'submitted' || b.status === 'under_review');
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const recentProjects = [...projects].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 5);

  const statusColors = {
    in_progress: 'bg-blue-100 text-blue-700',
    planning: 'bg-yellow-100 text-yellow-700',
    awarded: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-600',
    bidding: 'bg-purple-100 text-purple-700',
    on_hold: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Projects" value={activeProjects.length} subtitle={`${projects.length} total`} icon={FolderKanban} color="blue" />
        <StatCard title="Open Issues" value={openIssues.length} subtitle={`${issues.length} total`} icon={AlertTriangle} color="red" />
        <StatCard title="Pending Tasks" value={pendingTasks.length} subtitle={`${tasks.length} total`} icon={CheckCircle2} color="yellow" />
        <StatCard title="Active Bids" value={activeBids.length} subtitle={`${bids.length} total`} icon={FileText} color="purple" />
      </div>

      {/* Budget Overview */}
      {totalBudget > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Portfolio Budget</p>
                <p className="text-2xl font-bold text-slate-900">${totalBudget.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Projects</CardTitle>
              <Link to={createPageUrl('Projects')}>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No projects yet</p>
                <Link to={createPageUrl('Projects')}>
                  <Button size="sm" className="mt-3">Create Project</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map(project => (
                  <Link key={project.id} to={createPageUrl('ProjectDetail') + `?id=${project.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-900 truncate">{project.name}</p>
                        <p className="text-xs text-slate-400 truncate">{project.client_name}</p>
                      </div>
                      <Badge className={`ml-2 text-xs flex-shrink-0 ${statusColors[project.status] || 'bg-slate-100 text-slate-600'}`}>
                        {project.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Projects', icon: FolderKanban, page: 'Projects', color: 'text-blue-600 bg-blue-50' },
                { label: 'Bids', icon: FileText, page: 'Bids', color: 'text-purple-600 bg-purple-50' },
                { label: 'Tasks', icon: CheckCircle2, page: 'TaskTracker', color: 'text-yellow-600 bg-yellow-50' },
                { label: 'Issues', icon: AlertTriangle, page: 'Issues', color: 'text-red-600 bg-red-50' },
                { label: 'Labor Force', icon: Users, page: 'TeamManagement', color: 'text-green-600 bg-green-50' },
                { label: 'Time Cards', icon: Clock, page: 'TimeCards', color: 'text-orange-600 bg-orange-50' },
                { label: 'Bid Discovery', icon: TrendingUp, page: 'BidDiscovery', color: 'text-indigo-600 bg-indigo-50' },
                { label: 'AI Agents', icon: Activity, page: 'AIAgents', color: 'text-pink-600 bg-pink-50' },
              ].map(item => (
                <Link key={item.page} to={createPageUrl(item.page)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}