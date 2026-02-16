import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import TaskManager from '../components/dashboard/TaskManager';
import ClockIn from '../components/dashboard/ClockIn';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import EmployeeWidget from '../components/dashboard/EmployeeWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cloud, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  LayoutDashboard, 
  Briefcase, 
  CheckCircle2,
  TrendingUp,
  Users as UsersIcon,
  Bell
} from 'lucide-react';

import { format } from 'date-fns';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });
  
  const isAdmin = user?.role === 'admin';
  const isProjectManager = isAdmin;

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: () => base44.entities.Project.filter({ organization_id: user?.organization_id }, '-created_date', 50),
    enabled: !!user?.organization_id
  });

  const { data: bidOpportunities = [], isLoading: loadingBidOpps } = useQuery({
    queryKey: ['bidOpportunities', user?.organization_id],
    queryFn: () => base44.entities.BidOpportunity.filter({ organization_id: user.organization_id }, '-created_date'),
    enabled: !!user?.organization_id
  });

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const newBids = bidOpportunities.filter(b => b.status === 'new');

  const isLoading = loadingProjects || loadingBidOpps;

  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const weeklyForecast = [
    { day: 'Mon', high: 78, low: 65, condition: '☀️', temp: 72 },
    { day: 'Tue', high: 76, low: 64, condition: '☀️', temp: 70 },
    { day: 'Wed', high: 74, low: 62, condition: '⛅', temp: 68 },
    { day: 'Thu', high: 72, low: 61, condition: '🌧️', temp: 65 },
    { day: 'Fri', high: 75, low: 63, condition: '⛅', temp: 69 },
    { day: 'Sat', high: 79, low: 66, condition: '☀️', temp: 73 },
    { day: 'Sun', high: 80, low: 67, condition: '☀️', temp: 74 }
  ];

  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['bidOpportunities'] }),
      queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 lg:space-y-8 animate-slide-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 border-b border-slate-200 pb-3 sm:pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm mb-1 uppercase tracking-wider">
              <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Overview
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              {isProjectManager ? 'Project Dashboard' : isAdmin ? 'Admin Console' : 'Team Workspace'}
            </h1>
            <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
              Welcome back, <span className="font-bold text-slate-900">{user?.full_name || 'User'}</span>. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs sm:text-sm font-semibold text-slate-900">{format(currentTime, 'EEEE, MMMM do')}</span>
              <span className="text-xs text-slate-500">{format(currentTime, 'h:mm:ss a')}</span>
            </div>
            <Button variant="outline" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10 border-slate-200 shadow-sm flex-shrink-0">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {[
            { label: 'Active Projects', value: activeProjects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'New Bids', value: newBids.length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Team Members', value: '12', icon: UsersIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Pending Tasks', value: '8', icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <Card key={i} className="premium-card border-none">
              <CardContent className="p-2 sm:p-4 lg:p-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${stat.bg} ${stat.color} flex-shrink-0`}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Weather & Time Integration */}
            <Card className="premium-card border-none overflow-hidden">
              <div className="bg-gold-sidebar p-8 text-slate-900">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-6">
                    <div className="text-6xl md:text-7xl animate-pulse-soft">{weeklyForecast[0].condition}</div>
                    <div>
                      <div className="text-4xl md:text-5xl font-black">{weeklyForecast[0].temp}°</div>
                      <p className="text-slate-800 font-bold mt-1">Sunny in San Francisco</p>
                      <div className="flex gap-3 mt-2 text-sm text-slate-700">
                        <span className="flex items-center gap-1 font-bold"><TrendingUp className="h-3 w-3" /> H: {weeklyForecast[0].high}°</span>
                        <span className="flex items-center gap-1 font-bold"><TrendingUp className="h-3 w-3 rotate-180" /> L: {weeklyForecast[0].low}°</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-px md:h-16 w-full md:w-px bg-black/10" />
                  <div className="text-center md:text-right">
                    <div className="text-5xl font-black tracking-tighter">{format(currentTime, 'h:mm')} <span className="text-2xl font-bold text-slate-700">{format(currentTime, 'a')}</span></div>
                    <p className="text-slate-800 font-bold mt-1 uppercase tracking-widest text-xs">{format(currentTime, 'EEEE, MMMM d')}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 bg-gold-sidebar/30">
                <div className="grid grid-cols-7 gap-2">
                  {weeklyForecast.map((day, i) => (
                    <div key={day.day} className={`flex flex-col items-center p-3 rounded-xl transition-colors ${i === 0 ? 'bg-black/5 border border-black/5' : 'hover:bg-black/5'}`}>
                      <span className="text-xs font-black text-slate-600 uppercase mb-2">{day.day}</span>
                      <span className="text-2xl mb-2">{day.condition}</span>
                      <span className="text-sm font-black text-slate-900">{day.high}°</span>
                      <span className="text-xs text-slate-700 font-bold">{day.low}°</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Clock In Section */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <ClockIn />
            </div>

            {/* Tasks Section */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <TaskManager />
            </div>

            {/* Active Projects Section */}
            <Card className="premium-card border-none animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Active Projects</CardTitle>
                  <p className="text-sm text-slate-500">Currently in progress</p>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1">
                  {activeProjects.length} Total
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {activeProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-slate-50 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Briefcase className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-sm">No active projects found</p>
                    </div>
                  ) : (
                    activeProjects.slice(0, 5).map(proj => (
                      <Link key={proj.id} to={createPageUrl('ProjectDetail') + '?id=' + proj.id} className="block group">
                        <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                              <Briefcase className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">{proj.name}</p>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" /> {proj.client_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 mb-1">
                                {proj.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-slate-400">Updated 2h ago</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                {activeProjects.length > 5 && (
                  <div className="p-4 bg-slate-50/50 text-center">
                    <Link to={createPageUrl('Projects')} className="text-sm font-bold text-primary hover:underline">
                      View All Projects
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* Alerts Section */}
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <AlertsWidget />
            </div>

            {/* Team Members Section */}
            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <EmployeeWidget />
            </div>

            {/* Quick Actions / Calendar Mini */}
            <Card className="premium-card border-none bg-primary text-white overflow-hidden animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link to={createPageUrl('AddBid')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors text-center">
                    <p className="text-xs font-medium opacity-80">New Bid</p>
                  </Link>
                  <Link to={createPageUrl('DailyLog')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors text-center">
                    <p className="text-xs font-medium opacity-80">Daily Log</p>
                  </Link>
                  <Link to={createPageUrl('Photos')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors text-center">
                    <p className="text-xs font-medium opacity-80">Upload Photos</p>
                  </Link>
                  <Link to={createPageUrl('TimeCards')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors text-center">
                    <p className="text-xs font-medium opacity-80">Time Cards</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PullToRefresh>
         );
         }