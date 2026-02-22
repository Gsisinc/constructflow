import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FolderKanban, FileText, Users, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-dashboard'],
    queryFn: () => base44.entities.Project.list('-updated_date', 20),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-dashboard'],
    queryFn: () => base44.entities.Task.list('-updated_date', 50),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues-dashboard'],
    queryFn: () => base44.entities.Issue.filter({ status: 'open' }),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids-dashboard'],
    queryFn: () => base44.entities.BidOpportunity.list('-updated_date', 20),
  });

  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const openIssues = issues.length;
  const activeBids = bids.filter(b => b.status === 'active' || b.status === 'new').length;

  const stats = [
    { label: 'Active Projects', value: activeProjects, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50', page: 'Projects' },
    { label: 'Pending Tasks', value: pendingTasks, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', page: 'TaskTracker' },
    { label: 'Open Issues', value: openIssues, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', page: 'Projects' },
    { label: 'Active Bids', value: activeBids, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', page: 'Bids' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your construction operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={createPageUrl(stat.page)}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-blue-600" />
            Recent Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map(p => (
                <Link key={p.id} to={createPageUrl(`ProjectDetail?id=${p.id}`)}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.client_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}