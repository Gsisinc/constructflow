import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Calendar,
  Zap,
  Target,
  Award,
  Activity,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  FolderKanban,
  BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

// KPI Card Component
const KPICard = ({ title, value, change, icon: Icon, color, trend }) => (
  <motion.div whileHover={{ y: -4 }} className="h-full">
    <Card className="premium-card border-none">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {change}%
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, description, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    onClick={onClick}
    className="w-full h-full text-left p-6 rounded-xl bg-white border border-slate-200 hover:border-primary hover:shadow-lg transition-all"
  >
    <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-3 bg-blue-50 text-blue-600`}>
      <Icon className="h-6 w-6" />
    </div>
    <p className="font-bold text-slate-900">{label}</p>
    <p className="text-xs text-slate-500 mt-1">{description}</p>
  </motion.button>
);

// Project Card Component
const ProjectCard = ({ project, onClick }) => (
  <motion.div whileHover={{ y: -2 }} onClick={onClick} className="cursor-pointer">
    <Card className="premium-card border-none group">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                {project.name}
              </h3>
              <Badge className={`${project.health_status === 'green' ? 'bg-emerald-100 text-emerald-800' : project.health_status === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} capitalize`}>
                {project.health_status || 'green'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{project.client_name}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Progress</span>
              <span className="font-bold text-slate-900">{project.progress || 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress || 0}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{project.current_phase || 'Planning'}</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Activity Item Component
const ActivityItem = ({ icon: Icon, title, description, time, color }) => (
  <div className="flex gap-4 pb-4 last:pb-0">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-slate-900 truncate">{title}</p>
      <p className="text-sm text-slate-500 truncate">{description}</p>
      <p className="text-xs text-slate-400 mt-1">{time}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: async () => {
      const list = await base44.entities.Project.filter({});
      return list.filter(p => p.organization_id === user?.organization_id).slice(0, 4);
    },
    enabled: !!user?.organization_id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.organization_id],
    queryFn: async () => {
      const list = await base44.entities.Task.filter({});
      return list.filter(t => projects.some(p => p.id === t.project_id)).slice(0, 5);
    },
    enabled: !!user?.organization_id && projects.length > 0,
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids', user?.organization_id],
    queryFn: async () => {
      const list = await base44.entities.BidOpportunity.filter({
        organization_id: user?.organization_id,
      });
      return list.filter(b => !b.title?.includes('Downtown Plaza')).slice(0, 10);
    },
    enabled: !!user?.organization_id,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = {
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    activeBids: bids.filter(b => ['new', 'analyzing', 'estimating', 'submitted'].includes(b.status)).length,
    wonBids: bids.filter(b => b.status === 'won').length,
    totalRevenue: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    pipelineValue: bids.reduce((sum, b) => sum + (b.estimated_value || 0), 0),
    teamMembers: 0,
    overdueTasks: tasks.filter(t => t.status === 'pending').length,
  };

  const chartData = [
    { month: 'Jan', revenue: 65000, target: 80000 },
    { month: 'Feb', revenue: 78000, target: 80000 },
    { month: 'Mar', revenue: 92000, target: 80000 },
    { month: 'Apr', revenue: 81000, target: 80000 },
    { month: 'May', revenue: 95000, target: 80000 },
    { month: 'Jun', revenue: 88000, target: 80000 },
  ];

  const statusData = [
    { name: 'Active', value: stats.activeProjects, fill: '#3b82f6' },
    { name: 'Completed', value: stats.completedProjects, fill: '#10b981' },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-slide-up">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
          {getGreeting()}, {user?.full_name || 'there'}! 👋
        </h1>
        <p className="text-slate-500 text-lg">Here's what's happening with your projects today.</p>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Projects" value={stats.activeProjects} icon={Activity} color="bg-blue-600" />
        <KPICard title="Won Bids" value={stats.wonBids} icon={Award} color="bg-emerald-600" />
        <KPICard title="Pipeline Value" value={`$${(stats.pipelineValue / 1000000).toFixed(1)}M`} icon={TrendingUp} color="bg-purple-600" />
        <KPICard title="Overdue Tasks" value={stats.overdueTasks} icon={AlertCircle} color="bg-orange-600" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="premium-card border-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue vs target</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="premium-card border-none">
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction icon={Target} label="New Bid" description="Create a new bid opportunity" onClick={() => navigate(createPageUrl('AddBid'))} />
          <QuickAction icon={FolderKanban} label="New Project" description="Start a new project" onClick={() => navigate(createPageUrl('Projects'))} />
          <QuickAction icon={Users} label="Team" description="Manage your team members" onClick={() => navigate(createPageUrl('TeamManagement'))} />
          <QuickAction icon={BarChart3} label="Reports" description="View project analytics" onClick={() => navigate(createPageUrl('Reports'))} />
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${project.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="premium-card border-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.slice(0, 5).map((task, i) => (
              <ActivityItem
                key={task.id}
                icon={[CheckCircle, Clock, MessageSquare, AlertCircle, Zap][i % 5]}
                title={task.name}
                description={task.description || 'Task updated'}
                time={task.updated_date ? format(new Date(task.updated_date), 'MMM d, HH:mm') : 'Recently'}
                color={['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600'][i % 5]}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card border-none">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary transition-colors cursor-pointer">
                <p className="text-sm font-semibold text-slate-900 truncate">{task.name}</p>
                {task.due_date && <p className="text-xs text-slate-500 mt-1">{format(new Date(task.due_date), 'MMM d')}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}