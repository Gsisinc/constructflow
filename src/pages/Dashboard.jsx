import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import StatCard from '../components/dashboard/StatCard';
import ProjectCard from '../components/dashboard/ProjectCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
  });

  const { data: bids = [], isLoading: loadingBids } = useQuery({
    queryKey: ['bids'],
    queryFn: () => base44.entities.Bid.list('-created_date', 50),
  });

  const { data: workers = [], isLoading: loadingWorkers } = useQuery({
    queryKey: ['workers'],
    queryFn: () => base44.entities.Worker.list('-created_date', 50),
  });

  const { data: issues = [], isLoading: loadingIssues } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list('-created_date', 50),
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions'],
    queryFn: () => base44.entities.ProjectDecision.list('-created_date', 50),
  });

  const { data: safetyIncidents = [] } = useQuery({
    queryKey: ['safetyIncidents'],
    queryFn: () => base44.entities.SafetyIncident.list('-created_date', 50),
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['changeOrders'],
    queryFn: () => base44.entities.ChangeOrder.list('-created_date', 50),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.ProjectTeam.list('-created_date', 50),
  });

  const activeProjects = 2; // Fixed as requested
  const openBids = bids.filter(b => ['draft', 'submitted', 'under_review'].includes(b.status));
  const availableWorkers = workers.filter(w => w.status === 'available');
  const openIssues = issues.filter(i => i.status === 'open');
  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const openSafetyIncidents = safetyIncidents.filter(s => ['reported', 'investigating', 'action_required'].includes(s.status));
  const pendingChangeOrders = changeOrders.filter(c => ['draft', 'pending_review', 'client_review'].includes(c.status));
  const activeTeam = teamMembers.filter(t => t.status === 'active');

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);

  // Generate recent activity from all data
  const recentActivity = [
    ...projects.slice(0, 3).map(p => ({
      type: 'project',
      title: `Project "${p.name}" created`,
      description: `${p.project_type} project for ${p.client_name}`,
      date: p.created_date
    })),
    ...issues.slice(0, 2).map(i => ({
      type: 'issue',
      title: `Issue reported: ${i.title}`,
      description: `${i.severity} severity - ${i.type}`,
      date: i.created_date
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const budgetVariance = totalBudget - totalSpent;

  const isLoading = loadingProjects || loadingBids || loadingWorkers || loadingIssues;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your construction projects</p>
        </div>
        <Link to={createPageUrl('Projects')}>
          <Button className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Active Projects"
              value={activeProjects}
              subtitle={`${projects.length} total`}
              icon={FolderKanban}
              color="blue"
            />
            <StatCard
              title="Total Budget"
              value={`$${(totalBudget / 1000000).toFixed(1)}M`}
              subtitle={totalBudget > 0 ? 'all projects' : 'no budget set'}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Budget Variance"
              value={`$${Math.abs(budgetVariance).toLocaleString()}`}
              subtitle={budgetVariance >= 0 ? 'under budget' : 'over budget'}
              icon={TrendingUp}
              color={budgetVariance >= 0 ? 'green' : 'amber'}
            />
            <StatCard
              title="Pending Decisions"
              value={pendingDecisions.length}
              subtitle={`${decisions.length} total`}
              icon={FileText}
              color="purple"
            />
            <StatCard
              title="Safety Incidents"
              value={openSafetyIncidents.length}
              subtitle={`${safetyIncidents.filter(s => s.severity === 'critical').length} critical`}
              icon={AlertTriangle}
              color="amber"
            />
            <StatCard
              title="Change Orders"
              value={pendingChangeOrders.length}
              subtitle={`${changeOrders.filter(c => c.status === 'approved').length} approved`}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Team Members"
              value={activeTeam.length}
              subtitle={`${teamMembers.length} total`}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Open Issues"
              value={openIssues.length}
              subtitle={`${issues.filter(i => i.severity === 'critical').length} critical`}
              icon={AlertTriangle}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Budget Overview */}
      {!isLoading && totalBudget > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Budget Overview</h2>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm">Total Budget</p>
              <p className="text-2xl font-semibold mt-1">${totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Spent</p>
              <p className="text-2xl font-semibold mt-1">${totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Remaining</p>
              <p className="text-2xl font-semibold mt-1 text-emerald-400">
                ${(totalBudget - totalSpent).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Projects & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
            <Link to={createPageUrl('Projects')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingProjects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No projects yet</p>
              <Link to={createPageUrl('Projects')}>
                <Button className="mt-4 bg-slate-900 hover:bg-slate-800">
                  Create your first project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 4).map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ActivityFeed activities={recentActivity} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}