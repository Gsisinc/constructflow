import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Briefcase, FileText, Users, DollarSign, TrendingUp, TrendingDown,
  Clock, Calendar, Plus, ArrowUpRight,
  Sparkles, Zap, Bot, Bell, CheckCircle2, AlertCircle, Timer, Target,
  Search, Building2,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

function KPICard({ title, value, change, changeType, icon: Icon, color, subtitle, onClick, trend }) {
  const isPositive = changeType === 'positive';
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  };
  const gradientClass = colorMap[color] || colorMap.blue;

  return (
    <motion.div whileHover={{ y: -4 }} className="h-full">
      <Card className="relative overflow-hidden cursor-pointer border-0 shadow-lg bg-white h-full" onClick={onClick}>
        <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                {change && (
                  <div className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="font-semibold">{change}</span>
                  </div>
                )}
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          {trend !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Progress</span>
                <span className="font-semibold text-slate-700">{trend}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${gradientClass} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${trend}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectCard({ project, onClick }) {
  const progress = project.progress || 0;
  const isOverdue = project.end_date && isPast(new Date(project.end_date)) && project.status !== 'completed';
  const daysLeft = project.end_date ? Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const statusConfig = {
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600', icon: Timer },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-emerald-600', icon: CheckCircle2 },
    on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-amber-600', icon: AlertCircle },
    planning: { label: 'Planning', color: 'bg-purple-100 text-purple-700', gradient: 'from-purple-500 to-purple-600', icon: Target },
    bidding: { label: 'Bidding', color: 'bg-cyan-100 text-cyan-700', gradient: 'from-cyan-500 to-cyan-600', icon: FileText },
  };

  const status = statusConfig[project.status] || statusConfig.planning;
  const StatusIcon = status.icon;

  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden" onClick={onClick}>
        <div className={`h-1.5 w-full bg-gradient-to-r ${status.gradient}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{project.name}</h4>
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3 text-slate-400" />
                <p className="text-sm text-slate-500 truncate">{project.client_name || 'No client'}</p>
              </div>
            </div>
            <Badge className={`${status.color} text-xs border-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />{status.label}
            </Badge>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Progress</span>
              <span className="font-bold text-slate-900">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${status.gradient} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{project.project_manager || 'Unassigned'}</span>
            <div className={`text-xs px-2 py-1 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              <Calendar className="h-3 w-3 inline mr-1" />
              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft !== null ? (daysLeft === 0 ? 'Due today' : `${daysLeft}d left`) : 'No deadline'}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects-dashboard', user?.organization_id],
    queryFn: () => base44.entities.Project.filter({ organization_id: user.organization_id }),
    enabled: !!user?.organization_id,
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids-dashboard', user?.organization_id],
    queryFn: () => base44.entities.BidOpportunity.filter({ organization_id: user.organization_id }),
    enabled: !!user?.organization_id,
  });

  const activities = useMemo(() => [
    { id: '1', type: 'bid', title: 'New bid opportunity found', description: 'Check your latest bid opportunities', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: '2', type: 'project', title: 'Project milestone updated', description: 'Review project progress', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '3', type: 'ai', title: 'AI Agent completed analysis', description: 'Market Intelligence found new opportunities', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
    { id: '4', type: 'task', title: 'Task requires attention', description: 'Review pending tasks', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8) },
    { id: '5', type: 'alert', title: 'Budget alert', description: 'A project is approaching budget limit', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12) },
  ], []);

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const activeBids = bids.filter(b => ['new', 'analyzing', 'estimating'].includes(b.status));
  const totalPipeline = bids.reduce((sum, b) => sum + (b.estimated_value || 0), 0);

  const actionColors = { blue: 'from-blue-500 to-blue-600', emerald: 'from-emerald-500 to-emerald-600', purple: 'from-purple-500 to-purple-600', amber: 'from-amber-500 to-amber-600' };

  const iconConfig = {
    bid: { icon: FileText, color: 'bg-blue-100 text-blue-600' },
    project: { icon: Briefcase, color: 'bg-emerald-100 text-emerald-600' },
    task: { icon: CheckCircle2, color: 'bg-amber-100 text-amber-600' },
    ai: { icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
    alert: { icon: AlertCircle, color: 'bg-rose-100 text-rose-600' },
  };

  const kpiData = [
    { title: 'Active Projects', value: activeProjects.length, change: '+2', changeType: 'positive', icon: Briefcase, color: 'blue', subtitle: `${completedProjects.length} completed`, trend: projects.length ? Math.round((activeProjects.length / projects.length) * 100) : 0, onClick: () => navigate(createPageUrl('Projects')) },
    { title: 'Active Bids', value: activeBids.length, change: '+3', changeType: 'positive', icon: FileText, color: 'emerald', subtitle: `$${(totalPipeline / 1000000).toFixed(1)}M pipeline`, trend: 78, onClick: () => navigate(createPageUrl('Bids')) },
    { title: 'Team Members', value: '—', icon: Users, color: 'purple', subtitle: 'View labor force', onClick: () => navigate(createPageUrl('TeamManagement')) },
    { title: 'Total Pipeline', value: `$${(totalPipeline / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'amber', subtitle: 'Estimated value', trend: 85, onClick: () => navigate(createPageUrl('Estimates')) },
  ];

  const quickActions = [
    { icon: Plus, label: 'New Bid', description: 'Create opportunity', color: 'blue', onClick: () => navigate(createPageUrl('Bids')) },
    { icon: Briefcase, label: 'New Project', description: 'Start project', color: 'emerald', onClick: () => navigate(createPageUrl('Projects')) },
    { icon: Sparkles, label: 'AI Agents', description: 'Get AI assistance', color: 'purple', onClick: () => navigate(createPageUrl('AIAgents')) },
    { icon: Search, label: 'Find Bids', description: 'Discover opportunities', color: 'amber', onClick: () => navigate(createPageUrl('BidDiscovery')) },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {greeting}, {user?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {format(currentTime, 'EEEE, MMMM d, yyyy')} · Here's your overview
            </p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            onClick={() => navigate(createPageUrl('Projects'))}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </motion.div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 text-left w-full"
                >
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${actionColors[action.color]} shadow-lg`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">{action.label}</span>
                    <span className="text-xs text-slate-500">{action.description}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    Active Projects
                  </CardTitle>
                  <CardDescription>{activeProjects.length} projects in progress</CardDescription>
                </div>
                <Link to={createPageUrl('Projects')}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loadingProjects ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : activeProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-600 mb-1">No active projects</h3>
                    <p className="text-sm text-slate-400 mb-4">Get started by creating a project</p>
                    <Button onClick={() => navigate(createPageUrl('Projects'))}>Create Project</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeProjects.slice(0, 4).map(project => (
                      <ProjectCard key={project.id} project={project} onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${project.id}`)} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow-lg bg-white h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[380px]">
                  <div className="space-y-1">
                    {activities.map((activity) => {
                      const config = iconConfig[activity.type] || iconConfig.alert;
                      const Icon = config.icon;
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 line-clamp-1">{activity.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{activity.description}</p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Agents are working for you</h3>
                  <p className="text-white/80 text-sm mt-1">10 specialized agents monitoring bids, projects, and compliance.</p>
                </div>
              </div>
              <Link to={createPageUrl('AIAgents')}>
                <Button variant="secondary" className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  View Agents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}