import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  ChevronRight,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Sparkles,
  Zap,
  Bot,
  Bell,
  CheckCircle2,
  AlertCircle,
  Timer,
  Target,
  BarChart3,
  MessageSquare,
  Star,
  Filter,
  Search,
} from 'lucide-react';

import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
};

// ========================================
// KPI Card Component
// ========================================

function KPICard({ title, value, change, changeType, icon: Icon, color, subtitle, onClick, trend }) {
  const isPositive = changeType === 'positive';
  
  return (
    <motion.div variants={itemVariants} whileHover="hover" initial="rest" animate="rest">
      <motion.div variants={cardHoverVariants}>
        <Card 
          className="relative overflow-hidden cursor-pointer group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
          onClick={onClick}
        >
          {/* Background Gradient */}
          <div className={`absolute top-0 right-0 w-40 h-40 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 ${color}`} />
          
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                  {trend && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className={`flex items-center gap-0.5 text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span>{change}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isPositive ? 'Increased' : 'Decreased'} by {change} vs last month</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${color} bg-opacity-10 transition-transform group-hover:scale-110`}>
                <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            
            {/* Progress Bar (if provided) */}
            {trend && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{trend}%</span>
                </div>
                <Progress value={trend} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ========================================
// Quick Action Button
// ========================================

function QuickAction({ icon: Icon, label, description, color, onClick, badge }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700 group text-left w-full"
    >
      <div className="flex items-center justify-between w-full">
        <div className={`p-2.5 rounded-lg ${color} transition-transform group-hover:scale-110 shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      <div>
        <span className="text-sm font-semibold text-slate-900 dark:text-white block">{label}</span>
        {description && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">{description}</span>
        )}
      </div>
    </motion.button>
  );
}

// ========================================
// Project Card Component
// ========================================

function ProjectCard({ project, onClick }) {
  const progress = project.progress || Math.round(Math.random() * 100);
  const isOverdue = project.end_date && isPast(new Date(project.end_date)) && project.status !== 'completed';
  
  const statusConfig = {
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Timer },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
    on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: AlertCircle },
    planning: { label: 'Planning', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Target },
  };
  
  const status = statusConfig[project.status] || statusConfig.planning;
  const StatusIcon = status.icon;

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }}>
      <Card 
        className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 overflow-hidden"
        onClick={onClick}
      >
        {/* Status Bar */}
        <div className={`h-1 w-full ${progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} />
        
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{project.client_name || 'No client assigned'}</p>
            </div>
            <Badge className={`${status.color} text-xs font-medium`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                <span className="font-semibold text-slate-900 dark:text-white">{progress}%</span>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-2" />
                {progress === 100 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                    {project.manager?.[0] || 'P'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500 dark:text-slate-400">{project.manager || 'Unassigned'}</span>
              </div>
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                <Calendar className="h-3 w-3" />
                {project.end_date ? (
                  isOverdue ? (
                    `Overdue by ${formatDistanceToNow(new Date(project.end_date))}`
                  ) : isToday(new Date(project.end_date)) ? (
                    'Due today'
                  ) : isTomorrow(new Date(project.end_date)) ? (
                    'Due tomorrow'
                  ) : (
                    format(new Date(project.end_date), 'MMM d, yyyy')
                  )
                ) : (
                  'No deadline'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ========================================
// Activity Item Component
// ========================================

function ActivityItem({ activity }) {
  const iconConfig = {
    bid: { icon: FileText, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    project: { icon: Briefcase, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    task: { icon: CheckCircle2, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    ai: { icon: Sparkles, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    message: { icon: MessageSquare, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
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

// ========================================
// Main Dashboard Component
// ========================================

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Time and greeting
  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user data
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // Replace with actual API call
      return {
        id: '1',
        full_name: 'John Smith',
        email: 'john@constructflow.com',
        role: 'admin',
        organization_id: 'org-1',
        avatar: null,
      };
    },
  });

  // Fetch projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: async () => {
      // Replace with actual API call
      return [
        { id: '1', name: 'Downtown Plaza Renovation', client_name: 'City of Springfield', status: 'in_progress', progress: 65, manager: 'Mike Johnson', end_date: '2024-06-15' },
        { id: '2', name: 'Highway 101 Expansion', client_name: 'State DOT', status: 'in_progress', progress: 42, manager: 'Sarah Chen', end_date: '2024-08-30' },
        { id: '3', name: 'Metro Office Complex', client_name: 'Metro Development', status: 'planning', progress: 15, manager: 'Tom Wilson', end_date: '2024-12-01' },
        { id: '4', name: 'Harbor Bridge Repair', client_name: 'Port Authority', status: 'completed', progress: 100, manager: 'Lisa Park', end_date: '2024-01-20' },
      ];
    },
    enabled: !!user?.organization_id,
  });

  // Fetch bids
  const { data: bids = [], isLoading: loadingBids } = useQuery({
    queryKey: ['bids', user?.organization_id],
    queryFn: async () => {
      // Replace with actual API call
      return [
        { id: '1', title: 'School District HVAC Upgrade', value: 2500000, status: 'new', deadline: '2024-03-15' },
        { id: '2', title: 'Community Center Construction', value: 4500000, status: 'analyzing', deadline: '2024-03-20' },
        { id: '3', title: 'Water Treatment Facility', value: 8200000, status: 'estimating', deadline: '2024-04-01' },
      ];
    },
    enabled: !!user?.organization_id,
  });

  // Mock activity data
  const activities = useMemo(() => [
    { id: '1', type: 'bid', title: 'New bid opportunity found', description: 'City Hall Renovation - $2.5M project in your area', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: '2', type: 'project', title: 'Project milestone completed', description: 'Foundation work completed for Downtown Plaza', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '3', type: 'ai', title: 'AI Agent completed analysis', description: 'Market Intelligence found 3 new opportunities matching your criteria', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
    { id: '4', type: 'task', title: 'Task assigned to you', description: 'Review Q1 budget projections for Highway 101', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) },
    { id: '5', type: 'message', title: 'New message from Sarah Chen', description: 'Updated timeline for Metro Office Complex project', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8) },
    { id: '6', type: 'alert', title: 'Budget alert', description: 'Downtown Plaza project approaching budget limit', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12) },
  ], []);

  const isLoading = loadingUser || loadingProjects || loadingBids;

  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const newBids = bids.filter((b) => b.status === 'new');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  // KPI Data
  const kpiData = useMemo(() => [
    {
      title: 'Active Projects',
      value: activeProjects.length,
      change: '+2',
      changeType: 'positive',
      icon: Briefcase,
      color: 'bg-blue-500',
      subtitle: `${completedProjects.length} completed this year`,
      trend: Math.round((activeProjects.length / (projects.length || 1)) * 100),
      onClick: () => navigate(createPageUrl('Projects')),
    },
    {
      title: 'New Bids',
      value: newBids.length,
      change: '+5',
      changeType: 'positive',
      icon: FileText,
      color: 'bg-emerald-500',
      subtitle: `$${(bids.reduce((acc, b) => acc + (b.value || 0), 0) / 1000000).toFixed(1)}M total value`,
      trend: 78,
      onClick: () => navigate(createPageUrl('Bids')),
    },
    {
      title: 'Team Members',
      value: '24',
      change: '+3',
      changeType: 'positive',
      icon: Users,
      color: 'bg-purple-500',
      subtitle: '8 on field, 16 in office',
      trend: 92,
      onClick: () => navigate(createPageUrl('TeamManagement')),
    },
    {
      title: 'Monthly Revenue',
      value: '$1.2M',
      change: '+12%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-amber-500',
      subtitle: 'On track for $14.4M annual',
      trend: 85,
      onClick: () => navigate(createPageUrl('Estimates')),
    },
  ], [activeProjects.length, completedProjects.length, newBids.length, bids, projects.length, navigate]);

  // Quick actions
  const quickActions = [
    {
      icon: Plus,
      label: 'New Bid',
      description: 'Create a new bid opportunity',
      color: 'bg-blue-500',
      badge: null,
      onClick: () => {
        toast.info('Create bid dialog coming soon!', {
          description: 'This feature is under development',
        });
      },
    },
    {
      icon: Briefcase,
      label: 'New Project',
      description: 'Start a new project',
      color: 'bg-emerald-500',
      badge: null,
      onClick: () => {
        toast.info('Create project dialog coming soon!', {
          description: 'This feature is under development',
        });
      },
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
      badge: null,
      onClick: () => navigate(createPageUrl('BidDiscovery')),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {greeting}, {user?.full_name?.split(' ')[0] || 'User'}! 👋
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
                onClick={() => {
                  toast.info('Create project coming soon!', {
                    description: 'This feature is under development',
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action, index) => (
                  <QuickAction key={index} {...action} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Section */}
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
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
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
                    <Button>Create Project</Button>
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

          {/* Activity Feed */}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info('Mark all as read')}>Mark all as read</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('Notification settings')}>Notification settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-1">
                    {activities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </ScrollArea>
                <Button variant="ghost" className="w-full mt-4" size="sm">
                  View all activity
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Agents Banner */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white overflow-hidden relative">
            {/* Decorative elements */}
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
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">All agents active</span>
                  </div>
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
