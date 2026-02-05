import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ProjectCard from '../components/dashboard/ProjectCard';
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
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
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

  const weather = {
    condition: 'Sunny',
    temp: 72,
    high: 78,
    low: 65
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Getting Started</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weather & Time */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">My Hours This Week: 0:00 (0:00 Regular, 0:00 OT)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-4xl">☀️</div>
                    <p className="text-sm text-slate-600 mt-2">{weather.condition}</p>
                    <p className="text-sm text-slate-500">H: {weather.high}° L: {weather.low}°</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">{format(currentTime, 'h:mm')}</div>
                    <div className="text-sm text-slate-600">{format(currentTime, 'a')}</div>
                    <div className="text-sm text-slate-500 mt-1">{format(currentTime, 'EEEE')}</div>
                    <div className="text-sm text-slate-500">{format(currentTime, 'MMMM d, yyyy')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Clock In
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">Request Time Off</Button>
                <p className="text-sm text-blue-100">Similar temperatures continuing with no rain expected</p>
              </CardContent>
            </Card>
          </div>

          {/* My To-Do's */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">My To-Do's</CardTitle>
              <Button variant="ghost" size="sm">Refresh</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">Task | Due Date | Status</div>
                <div className="text-center py-8 text-slate-400">No to-do items</div>
              </div>
            </CardContent>
          </Card>

          {/* To-Do's */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">To-Do's</CardTitle>
              <Button variant="ghost" size="sm">Refresh</Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-400">No records available</div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Next Hour */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Next Hour: Clear
                <span className="text-sm font-normal text-slate-500">☀️</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'].map((day, i) => (
                  <div key={day}>
                    <div className="font-medium">{day}</div>
                    <div className="mt-1">☀️</div>
                    <div className="text-slate-500">75°</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Photos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Photos</CardTitle>
              <Button variant="ghost" size="sm">Refresh</Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-400">No Records Available</div>
            </CardContent>
          </Card>

          {/* Who is Clocked In */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Who is Clocked In</CardTitle>
              <Button variant="ghost" size="sm">Refresh</Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-400">No Records Available</div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}