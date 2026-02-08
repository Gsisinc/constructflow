import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ProjectCard from '../components/dashboard/ProjectCard';
import TaskManager from '../components/dashboard/TaskManager';
import ClockIn from '../components/dashboard/ClockIn';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import EmployeeWidget from '../components/dashboard/EmployeeWidget';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  FileText,
  Plus,
  ArrowRight,
  DollarSign,
  Calendar,
  Clock
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
          <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">
          {isProjectManager ? 'Dashboard' : isAdmin ? 'Admin' : 'Team'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Column */}
         <div className="lg:col-span-2 space-y-6">
           {/* Weather & Time */}
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Current Time & Weekly Forecast</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center justify-between pb-4 border-b">
                 <div className="text-center">
                   <div className="text-4xl">{weeklyForecast[0].condition}</div>
                   <p className="text-sm text-slate-600 mt-2">{weeklyForecast[0].temp}°</p>
                   <p className="text-xs text-slate-500">H: {weeklyForecast[0].high}° L: {weeklyForecast[0].low}°</p>
                 </div>
                 <div className="text-right">
                   <div className="text-3xl font-bold text-slate-900">{format(currentTime, 'h:mm')}</div>
                   <div className="text-sm text-slate-600">{format(currentTime, 'a')}</div>
                   <div className="text-sm text-slate-500 mt-1">{format(currentTime, 'EEEE')}</div>
                   <div className="text-sm text-slate-500">{format(currentTime, 'MMMM d, yyyy')}</div>
                 </div>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center text-xs">
                 {weeklyForecast.map((day, i) => (
                   <div key={day.day} className={i === 0 ? 'font-bold' : ''}>
                     <div className="font-medium text-slate-700">{day.day}</div>
                     <div className="text-lg mt-1">{day.condition}</div>
                     <div className="text-slate-700 font-semibold">{day.high}°</div>
                     <div className="text-slate-500 text-xs">{day.low}°</div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>

           {/* Clock In Card */}
           <ClockIn />

           {/* Tasks */}
           <TaskManager />

           {/* Active Projects */}
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Active Projects ({activeProjects.length})</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 {activeProjects.length === 0 ? (
                   <div className="text-center py-6 text-slate-400 text-sm">No active projects</div>
                 ) : (
                   activeProjects.slice(0, 3).map(proj => (
                     <Link key={proj.id} to={createPageUrl('ProjectDetail') + '?id=' + proj.id}>
                       <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
                         <div className="flex-1">
                           <p className="text-sm font-medium">{proj.name}</p>
                           <p className="text-xs text-slate-500">{proj.client_name}</p>
                         </div>
                         <Badge>{proj.status}</Badge>
                       </div>
                     </Link>
                   ))
                 )}
               </div>
             </CardContent>
           </Card>
         </div>

         {/* Right Column */}
         <div className="space-y-6">
           {/* Alerts */}
           <AlertsWidget />

           {/* Team Members */}
           <EmployeeWidget />
         </div>
         </div>


         </div>
         </PullToRefresh>
         );
         }