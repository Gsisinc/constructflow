import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard, Briefcase, FileText, Users, DollarSign,
  Plus, ArrowUpRight, Sparkles, Bot, Clock, Calendar,
  CheckCircle2, AlertCircle, Timer, Target, Search, Zap
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['dashboardProjects', user?.organization_id],
    queryFn: () => base44.entities.Project.filter({ organization_id: user.organization_id }),
    enabled: !!user?.organization_id,
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['dashboardBids'],
    queryFn: () => base44.entities.BidOpportunity.list('-created_date', 20),
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['dashboardTasks'],
    queryFn: () => base44.entities.Task.filter({ status: 'in_progress' }),
    enabled: !!user,
  });

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const newBids = bids.filter(b => ['new', 'active'].includes(b.status));
  const overdueTasks = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)));

  const statusConfig = {
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Timer },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    planning: { label: 'Planning', color: 'bg-purple-100 text-purple-700', icon: Target },
    bidding: { label: 'Bidding', color: 'bg-cyan-100 text-cyan-700', icon: FileText },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(createPageUrl('Projects'))} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active Projects', value: activeProjects.length, icon: Briefcase, color: 'bg-blue-500', onClick: () => navigate(createPageUrl('Projects')) },
          { title: 'New Bids', value: newBids.length, icon: FileText, color: 'bg-emerald-500', onClick: () => navigate(createPageUrl('Bids')) },
          { title: 'Tasks In Progress', value: tasks.length, icon: CheckCircle2, color: 'bg-purple-500', onClick: () => navigate(createPageUrl('TaskTracker')) },
          { title: 'Overdue Tasks', value: overdueTasks.length, icon: AlertCircle, color: overdueTasks.length > 0 ? 'bg-red-500' : 'bg-slate-400', onClick: () => navigate(createPageUrl('TaskTracker')) },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={kpi.onClick}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-500">{kpi.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-xl ${kpi.color}`}>
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Search, label: 'Find Bids', color: 'bg-blue-500', page: 'BidDiscovery' },
              { icon: Briefcase, label: 'Projects', color: 'bg-emerald-500', page: 'Projects' },
              { icon: Bot, label: 'AI Agents', color: 'bg-purple-500', page: 'AIAgents' },
              { icon: Users, label: 'Labor Force', color: 'bg-amber-500', page: 'TeamManagement' },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(createPageUrl(action.page))}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-center"
                >
                  <div className={`p-2.5 rounded-lg ${action.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{action.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" /> Active Projects
              </CardTitle>
              <Link to={createPageUrl('Projects')}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
                </div>
              ) : activeProjects.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Briefcase className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No active projects yet</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate(createPageUrl('Projects'))}>
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjects.slice(0, 5).map(project => {
                    const status = statusConfig[project.status] || statusConfig.planning;
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={project.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => navigate(createPageUrl(`ProjectDetail?id=${project.id}`))}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{project.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{project.client_name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={project.progress || 0} className="h-1.5 flex-1" />
                            <span className="text-xs text-slate-500 flex-shrink-0">{project.progress || 0}%</span>
                          </div>
                        </div>
                        <Badge className={`${status.color} text-xs flex-shrink-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bids */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" /> Recent Bids
            </CardTitle>
            <Link to={createPageUrl('Bids')}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {newBids.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No active bids</p>
              </div>
            ) : (
              <div className="space-y-3">
                {newBids.slice(0, 5).map(bid => (
                  <div
                    key={bid.id}
                    className="p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(createPageUrl(`BidOpportunityDetail?id=${bid.id}`))}
                  >
                    <p className="font-medium text-sm text-slate-900 truncate">{bid.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500">{bid.agency || bid.client_name || 'Unknown'}</p>
                      {bid.estimated_value && (
                        <p className="text-xs font-medium text-emerald-600">
                          ${(bid.estimated_value / 1000).toFixed(0)}K
                        </p>
                      )}
                    </div>
                    {bid.due_date && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {format(new Date(bid.due_date), 'MMM d')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Agents Banner */}
      <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">AI Agents are working for you</h3>
                <p className="text-white/80 text-sm mt-0.5">Monitoring bids, optimizing schedules, and analyzing projects.</p>
              </div>
            </div>
            <Link to={createPageUrl('AIAgents')}>
              <Button variant="secondary" className="gap-2 bg-white text-purple-600 hover:bg-white/90">
                <Sparkles className="h-4 w-4" />
                View Agents
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}