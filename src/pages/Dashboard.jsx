import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, FileText, Users, DollarSign, TrendingUp, Clock, Plus } from 'lucide-react';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: () => base44.entities.Project.filter({ organization_id: user?.organization_id }, '-created_date', 10),
    enabled: !!user?.organization_id
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids', user?.organization_id],
    queryFn: () => base44.entities.BidOpportunity.filter({ organization_id: user?.organization_id }, '-created_date', 10),
    enabled: !!user?.organization_id
  });

  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const biddingProjects = projects.filter(p => p.status === 'bidding').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Projects', value: activeProjects, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Bidding', value: biddingProjects, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Budget', value: `$${(totalBudget / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back{user?.full_name ? `, ${user.full_name}` : ''}</p>
        </div>
        <Button asChild>
          <Link to={createPageUrl('Projects')}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Projects</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={createPageUrl('Projects')}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderKanban className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No projects yet. Create your first project!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-sm text-slate-500">{project.client_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                    project.status === 'bidding' ? 'bg-amber-100 text-amber-700' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {project.status?.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}