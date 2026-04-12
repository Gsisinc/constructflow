import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase, CheckCircle2, AlertCircle, Zap, Mail, Search, Plus,
  Clock, DollarSign, Users, FileText, Bot, ChevronRight, Bell, Sparkles,
  TrendingUp, Activity, MoreVertical, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { createPageUrl } from '@/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// KPI Card Component
function KPICard(props) {
  const { title, value, icon: Icon, color, subtitle, trend, onClick } = props;

  return (
    <motion.div variants={itemVariants} onClick={onClick} className="cursor-pointer">
      <Card className="premium-card border-none hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${color} text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                {trend}%
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Quick Action Component
function QuickAction(props) {
  const { icon: Icon, label, description, color, onClick, badge } = props;

  return (
    <motion.div variants={itemVariants}>
      <button
        onClick={onClick}
        className="w-full h-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 group"
      >
        <div className={`p-3 rounded-lg ${color} text-white w-fit mb-3 group-hover:scale-110 transition-transform`}>
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="font-semibold text-slate-900 text-sm">{label}</h4>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
        {badge && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {badge}
          </Badge>
        )}
      </button>
    </motion.div>
  );
}

// Project Card Component
function ProjectCard(props) {
  const { project, onClick } = props;

  return (
    <Card className="premium-card cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 line-clamp-1">{project.name}</h4>
          <p className="text-xs text-slate-600">{project.client_name}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <MoreVertical className="h-3 w-3" />
              {project.progress}% complete
            </div>
            <Badge variant="secondary" className="text-xs capitalize">
              {project.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Item Component
function ActivityItem(props) {
  const { activity } = props;

  const iconConfig = {
    bid: { icon: FileText, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    project: { icon: Briefcase, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    task: { icon: CheckCircle2, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    ai: { icon: Sparkles, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    message: { icon: Mail, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
    alert: { icon: AlertCircle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  };

  const config = iconConfig[activity.type] || iconConfig.alert;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
    >
      <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
          {activity.title}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{activity.description}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const { base44: b44 } = await import('@/api/base44Client');
        if (b44?.auth?.me) return await b44.auth.me();
      } catch (_) {}
      return { id: '1', full_name: 'User', email: '', role: 'user', organization_id: 'org-1', avatar: null };
    },
    retry: false,
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      try {
        const { base44: b44 } = await import('@/api/base44Client');
        if (b44?.entities?.Project?.filter) return await b44.entities.Project.filter({ organization_id: user.organization_id });
      } catch (_) {}
      return [];
    },
    enabled: !!user?.organization_id,
  });

  const { data: bids = [], isLoading: loadingBids } = useQuery({
    queryKey: ['bids', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      try {
        const { base44: b44 } = await import('@/api/base44Client');
        if (b44?.entities?.BidOpportunity?.filter) return await b44.entities.BidOpportunity.filter({ organization_id: user.organization_id });
      } catch (_) {}
      return [];
    },
    enabled: !!user?.organization_id,
  });

  const isLoading = loadingUser || loadingProjects || loadingBids;

  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const newBids = bids.filter((b) => b.status === 'new');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  const kpiData = useMemo(() => [
    {
      title: 'Active Projects',
      value: activeProjects.length,
      icon: Briefcase,
      color: 'bg-blue-500',
      subtitle: `${completedProjects.length} completed`,
      trend: projects.length > 0 ? Math.round((activeProjects.length / projects.length) * 100) : 0,
      onClick: () => navigate(createPageUrl('Projects')),
    },
    {
      title: 'New Bids',
      value: newBids.length,
      icon: FileText,
      color: 'bg-emerald-500',
      subtitle: `${bids.length} total bids`,
      onClick: () => navigate(createPageUrl('Bids')),
    },
    {
      title: 'Team Members',
      value: '0',
      icon: Users,
      color: 'bg-purple-500',
      subtitle: 'Directory',
      onClick: () => navigate(createPageUrl('Directory')),
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: DollarSign,
      color: 'bg-amber-500',
      subtitle: 'Estimates',
      onClick: () => navigate(createPageUrl('Estimates')),
    },
  ], [activeProjects.length, completedProjects.length, newBids.length, bids.length, projects.length, navigate]);

  const quickActions = [
    {
      icon: Plus,
      label: 'New Bid',
      description: 'Create a new bid opportunity',
      color: 'bg-blue-500',
      onClick: () => navigate(createPageUrl('AddBid')),
    },
    {
      icon: Briefcase,
      label: 'New Project',
      description: 'Start a new project',
      color: 'bg-emerald-500',
      onClick: () => navigate(createPageUrl('Projects')),
    },
    {
      icon: Sparkles,
      label: 'Ask AI',
      description: 'Get help from AI agents',
      color: 'bg-purple-500',
      badge: '10 agents',
      onClick: () => navigate(createPageUrl('AIAgents')),
    },
    {
      icon: Search,
      label: 'Find Bids',
      description: 'Discover new opportunities',
      color: 'bg-amber-500',
      onClick: () => navigate(createPageUrl('BidDiscovery')),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  const safeUser = user || { full_name: 'User' };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                {greeting}, {safeUser?.full_name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Here's what's happening with your projects today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {format(currentTime, 'EEEE, MMMM d')}
                </span>
              </div>
              <Button 
                size="sm" 
                className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
                onClick={() => navigate(createPageUrl('Projects'))}
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {quickActions.map((action, index) => (
                  <QuickAction key={index} {...action} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    Active Projects
                  </CardTitle>
                  <CardDescription>
                    {activeProjects.length} projects in progress
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={createPageUrl('Projects')}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View all
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {activeProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Briefcase className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                      No active projects
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Get started by creating your first project
                    </p>
                    <Button onClick={() => navigate(createPageUrl('Projects'))}>Create Project</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeProjects.slice(0, 4).map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onClick={() => navigate(createPageUrl(`ProjectDetail?id=${project.id}`))}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-md bg-white dark:bg-slate-800 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates from your team</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      AI Agents are working for you
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      10 specialized agents monitoring bids, optimizing schedules, and analyzing projects.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={createPageUrl('AIAgents')}>
                    <Button 
                      variant="secondary" 
                      className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg"
                    >
                      <Sparkles className="h-4 w-4" />
                      View Agents
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}