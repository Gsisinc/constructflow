import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Kbd } from '@/components/ui/kbd';

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
  MapPin,
  Building2,
  Wrench,
  Shield,
  Truck,
  ClipboardList,
} from 'lucide-react';

import { format, formatDistanceToNow, isToday, isTomorrow, isPast, addDays } from 'date-fns';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.08, 
      delayChildren: 0.1 
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    },
  },
};

const cardHoverVariants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  },
  hover: { 
    scale: 1.02, 
    y: -6,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
};

const glowVariants = {
  rest: { 
    boxShadow: '0 0 0 0 rgba(37, 99, 235, 0)'
  },
  hover: { 
    boxShadow: '0 0 20px 5px rgba(37, 99, 235, 0.3)',
    transition: { duration: 0.3 }
  }
};

// ========================================
// KPI Card Component - Premium Version
// ========================================

function KPICard({ title, value, change, changeType, icon: Icon, color, subtitle, onClick, trend, chart }) {
  const isPositive = changeType === 'positive';
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };
  
  const gradientClass = colorMap[color] || colorMap.blue;
  
  return (
    <motion.div 
      variants={itemVariants} 
      whileHover="hover" 
      initial="rest" 
      animate="rest"
      className="h-full"
    >
      <motion.div variants={cardHoverVariants}>
        <Card 
          className="relative overflow-hidden cursor-pointer group border-0 shadow-lg bg-white dark:bg-slate-800 h-full"
          onClick={onClick}
        >
          {/* Animated Gradient Background */}
          <div className={`absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 bg-gradient-to-br ${gradientClass} blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
          
          {/* Top Accent Line */}
          <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`} />
          
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                  {change && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div 
                            className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span className="font-semibold">{change}</span>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isPositive ? 'Increased' : 'Decreased'} by {change} vs last month</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <motion.h3 
                  className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {value}
                </motion.h3>
                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
                )}
              </div>
              <motion.div 
                className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg`}
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>
            </div>
            
            {/* Progress Bar */}
            {trend && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400 dark:text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{trend}%</span>
                </div>
                <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    className={`absolute left-0 top-0 h-full bg-gradient-to-r ${gradientClass} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${trend}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
            
            {/* Mini Chart (optional) */}
            {chart && (
              <div className="mt-4 h-12 flex items-end gap-1">
                {chart.map((value, i) => (
                  <motion.div
                    key={i}
                    className={`flex-1 bg-gradient-to-t ${gradientClass} rounded-t-sm opacity-60`}
                    initial={{ height: 0 }}
                    animate={{ height: `${value}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ========================================
// Quick Action Button - Premium Version
// ========================================

function QuickAction({ icon: Icon, label, description, color, onClick, badge, shortcut }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/30',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/30',
  };
  
  const gradientClass = colorMap[color] || colorMap.blue;
  
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700 group text-left w-full relative overflow-hidden"
    >
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="flex items-center justify-between w-full relative z-10">
        <motion.div 
          className={`p-2.5 rounded-lg bg-gradient-to-br ${gradientClass} shadow-lg`}
          whileHover={{ rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <Icon className="h-5 w-5 text-white" />
        </motion.div>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant="secondary" className="text-xs font-medium">
              {badge}
            </Badge>
          )}
          {shortcut && (
            <Kbd className="text-xs hidden group-hover:inline-flex">{shortcut}</Kbd>
          )}
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-sm font-semibold text-slate-900 dark:text-white block">{label}</span>
        {description && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">{description}</span>
        )}
      </div>
    </motion.button>
  );
}

// ========================================
// Project Card Component - Premium Version
// ========================================

function ProjectCard({ project, onClick }) {
  const progress = project.progress || 0;
  const isOverdue = project.end_date && isPast(new Date(project.end_date)) && project.status !== 'completed';
  const daysLeft = project.end_date ? Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  const statusConfig = {
    in_progress: { 
      label: 'In Progress', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: Timer,
      gradient: 'from-blue-500 to-blue-600'
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-600'
    },
    on_hold: { 
      label: 'On Hold', 
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: AlertCircle,
      gradient: 'from-amber-500 to-amber-600'
    },
    planning: { 
      label: 'Planning', 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      icon: Target,
      gradient: 'from-purple-500 to-purple-600'
    },
  };
  
  const status = statusConfig[project.status] || statusConfig.planning;
  const StatusIcon = status.icon;

  return (
    <motion.div 
      variants={itemVariants} 
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      layout
    >
      <Card 
        className="group cursor-pointer border-0 shadow-md hover:shadow-2xl transition-all duration-300 bg-white dark:bg-slate-800 overflow-hidden relative"
        onClick={onClick}
      >
        {/* Status Gradient Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${status.gradient}`}>
          <motion.div 
            className="h-full bg-white/30"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
        </div>
        
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <motion.h4 
                className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                whileHover={{ x: 2 }}
              >
                {project.name}
              </motion.h4>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-3 w-3 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{project.client_name || 'No client assigned'}</p>
              </div>
            </div>
            <Badge 
              className={`${status.color} text-xs font-medium border`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          
          <div className="space-y-4">
            {/* Progress Section */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                <span className="font-bold text-slate-900 dark:text-white">{progress}%</span>
              </div>
              <div className="relative h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className={`absolute left-0 top-0 h-full bg-gradient-to-r ${status.gradient} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                {progress === 100 && (
                  <motion.div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  />
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                    {project.manager?.[0] || 'P'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500 dark:text-slate-400">{project.manager || 'Unassigned'}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                <Calendar className="h-3 w-3" />
                {isOverdue ? (
                  `${Math.abs(daysLeft)}d overdue`
                ) : daysLeft !== null ? (
                  daysLeft === 0 ? 'Due today' : `${daysLeft}d left`
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
// Activity Item Component - Premium Version
// ========================================

function ActivityItem({ activity, index }) {
  const iconConfig = {
    bid: { icon: FileText, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-blue-600' },
    project: { icon: Briefcase, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-emerald-600' },
    task: { icon: CheckCircle2, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-500 to-amber-600' },
    ai: { icon: Sparkles, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', gradient: 'from-purple-500 to-purple-600' },
    message: { icon: MessageSquare, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', gradient: 'from-cyan-500 to-cyan-600' },
    alert: { icon: AlertCircle, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', gradient: 'from-rose-500 to-rose-600' },
  };

  const config = iconConfig[activity.type] || iconConfig.alert;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(248, 250, 252, 1)' }}
      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer group transition-colors dark:hover:bg-slate-700/50"
    >
      <motion.div 
        className={`p-2 rounded-lg ${config.color} flex-shrink-0`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Icon className="h-4 w-4" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
          {activity.title}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{activity.description}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 flex-shrink-0" />
    </motion.div>
  );
}

// ========================================
// AI Agent Status Card
// ========================================

function AIAgentStatusCard({ agent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{agent.name}</p>
        <p className="text-xs text-white/70">{agent.status}</p>
      </div>
    </motion.div>
  );
}

// ========================================
// Main Dashboard Component v2 - 10/10 Version
// ========================================

export default function DashboardV2() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAIBanner, setShowAIBanner] = useState(true);

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
    queryFn: async () => ({
      id: '1',
      full_name: 'John Smith',
      email: 'john@constructflow.com',
      role: 'admin',
      organization_id: 'org-1',
      avatar: null,
    }),
  });

  // Fetch projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: async () => [
      { id: '1', name: 'Downtown Plaza Renovation', client_name: 'City of Springfield', status: 'in_progress', progress: 65, manager: 'Mike Johnson', end_date: addDays(new Date(), 45).toISOString() },
      { id: '2', name: 'Highway 101 Expansion', client_name: 'State DOT', status: 'in_progress', progress: 42, manager: 'Sarah Chen', end_date: addDays(new Date(), 120).toISOString() },
      { id: '3', name: 'Metro Office Complex', client_name: 'Metro Development', status: 'planning', progress: 15, manager: 'Tom Wilson', end_date: addDays(new Date(), 180).toISOString() },
      { id: '4', name: 'Harbor Bridge Repair', client_name: 'Port Authority', status: 'completed', progress: 100, manager: 'Lisa Park', end_date: addDays(new Date(), -30).toISOString() },
    ],
    enabled: !!user?.organization_id,
  });

  // Fetch bids
  const { data: bids = [], isLoading: loadingBids } = useQuery({
    queryKey: ['bids', user?.organization_id],
    queryFn: async () => [
      { id: '1', title: 'School District HVAC Upgrade', value: 2500000, status: 'new', deadline: addDays(new Date(), 14).toISOString() },
      { id: '2', title: 'Community Center Construction', value: 4500000, status: 'analyzing', deadline: addDays(new Date(), 21).toISOString() },
      { id: '3', title: 'Water Treatment Facility', value: 8200000, status: 'estimating', deadline: addDays(new Date(), 35).toISOString() },
    ],
    enabled: !!user?.organization_id,
  });

  // Mock activity data
  const activities = useMemo(() => [
    { id: '1', type: 'bid', title: 'New bid opportunity found', description: 'City Hall Renovation - $2.5M project in your area', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: '2', type: 'project', title: 'Project milestone completed', description: 'Foundation work completed for Downtown Plaza', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '3', type: 'ai', title: 'AI Agent completed analysis', description: 'Market Intelligence found 3 new opportunities', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
    { id: '4', type: 'task', title: 'Task assigned to you', description: 'Review Q1 budget projections', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) },
    { id: '5', type: 'message', title: 'New message from Sarah Chen', description: 'Updated timeline for Metro Office Complex', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8) },
    { id: '6', type: 'alert', title: 'Budget alert', description: 'Downtown Plaza project approaching budget limit', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12) },
  ], []);

  // AI Agents data
  const aiAgents = [
    { name: 'Market Intelligence', status: 'Scanning SAM.GOV' },
    { name: 'Bid Analyzer', status: 'Analyzing 3 bids' },
    { name: 'Schedule Optimizer', status: 'Optimizing timeline' },
    { name: 'Safety Monitor', status: 'Monitoring compliance' },
  ];

  const isLoading = loadingUser || loadingProjects || loadingBids;

  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const newBids = bids.filter((b) => b.status === 'new');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  // KPI Data with mini charts
  const kpiData = useMemo(() => [
    {
      title: 'Active Projects',
      value: activeProjects.length,
      change: '+2',
      changeType: 'positive',
      icon: Briefcase,
      color: 'blue',
      subtitle: `${completedProjects.length} completed this year`,
      trend: Math.round((activeProjects.length / (projects.length || 1)) * 100),
      chart: [30, 45, 35, 55, 48, 62, 75, 68, 82, 90],
      onClick: () => navigate(createPageUrl('Projects')),
    },
    {
      title: 'New Bids',
      value: newBids.length,
      change: '+5',
      changeType: 'positive',
      icon: FileText,
      color: 'emerald',
      subtitle: `$${(bids.reduce((acc, b) => acc + (b.value || 0), 0) / 1000000).toFixed(1)}M total value`,
      trend: 78,
      chart: [20, 35, 45, 40, 55, 60, 58, 72, 80, 85],
      onClick: () => navigate(createPageUrl('Bids')),
    },
    {
      title: 'Team Members',
      value: '24',
      change: '+3',
      changeType: 'positive',
      icon: Users,
      color: 'purple',
      subtitle: '8 on field, 16 in office',
      trend: 92,
      chart: [60, 65, 70, 68, 75, 80, 82, 85, 88, 92],
      onClick: () => navigate(createPageUrl('TeamManagement')),
    },
    {
      title: 'Monthly Revenue',
      value: '$1.2M',
      change: '+12%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'amber',
      subtitle: 'On track for $14.4M annual',
      trend: 85,
      chart: [40, 50, 55, 60, 65, 70, 75, 78, 82, 85],
      onClick: () => navigate(createPageUrl('Estimates')),
    },
  ], [activeProjects.length, completedProjects.length, newBids.length, bids, projects.length, navigate]);

  // Quick actions
  const quickActions = [
    {
      icon: Plus,
      label: 'New Bid',
      description: 'Create opportunity',
      color: 'blue',
      badge: null,
      shortcut: 'B',
      onClick: () => toast.info('Create bid dialog coming soon!', { description: 'This feature is under development' }),
    },
    {
      icon: Briefcase,
      label: 'New Project',
      description: 'Start construction',
      color: 'emerald',
      badge: null,
      shortcut: 'P',
      onClick: () => toast.info('Create project dialog coming soon!', { description: 'This feature is under development' }),
    },
    {
      icon: Sparkles,
      label: 'Ask AI',
      description: 'Get AI assistance',
      color: 'purple',
      badge: '10 agents',
      shortcut: 'A',
      onClick: () => navigate(createPageUrl('AIAgents')),
    },
    {
      icon: Search,
      label: 'Find Bids',
      description: 'Discover opportunities',
      color: 'amber',
      badge: null,
      shortcut: 'F',
      onClick: () => navigate(createPageUrl('BidDiscovery')),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
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
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 backdrop-blur-xl bg-opacity-80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <motion.h1 
                className="text-2xl font-bold text-slate-900 dark:text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {greeting}, {user?.full_name?.split(' ')[0] || 'User'}! 👋
              </motion.h1>
              <motion.p 
                className="text-sm text-slate-500 dark:text-slate-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Here's what's happening with your projects today.
              </motion.p>
            </div>
            <div className="flex items-center gap-3">
              <motion.div 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {format(currentTime, 'EEEE, MMMM d')}
                </span>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="sm" 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
                  onClick={() => toast.info('Create project coming soon!', { description: 'This feature is under development' })}
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </motion.div>
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
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Zap className="h-5 w-5 text-amber-500" />
                </motion.div>
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
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
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
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
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
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {activeProjects.slice(0, 4).map((project, index) => (
                        <ProjectCard 
                          key={project.id} 
                          project={project} 
                          onClick={() => navigate(createPageUrl(`ProjectDetail?id=${project.id}`))}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 h-full">
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
                    {activities.map((activity, index) => (
                      <ActivityItem key={activity.id} activity={activity} index={index} />
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
        <AnimatePresence>
          {showAIBanner && (
            <motion.div 
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white overflow-hidden relative">
                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                
                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/20 rounded-full"
                      style={{
                        left: `${10 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                      >
                        <Bot className="h-8 w-8 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          AI Agents are working for you
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                          10 specialized agents monitoring bids, optimizing schedules, and analyzing projects.
                        </p>
                      </div>
                    </div>
                    
                    {/* AI Agent Status Cards */}
                    <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
                      {aiAgents.map((agent, index) => (
                        <AIAgentStatusCard key={index} agent={agent} index={index} />
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">All agents active</span>
                      </motion.div>
                      <Link to={createPageUrl('AIAgents')}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="secondary" 
                            className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg"
                          >
                            <Sparkles className="h-4 w-4" />
                            View Agents
                          </Button>
                        </motion.div>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
