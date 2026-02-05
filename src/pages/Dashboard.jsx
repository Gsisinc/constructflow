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
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

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
          <p className="text-slate-500 mt-1">Welcome back{user?.full_name ? `, ${user.full_name}` : ''}</p>
        </div>
        <Link to={createPageUrl('Projects')}>
          <Button className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-slate-500 mt-1">{projects.length} total projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">New Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{newBids.length}</div>
            <p className="text-xs text-slate-500 mt-1">{bidOpportunities.length} total bids</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Estimating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {bidOpportunities.filter(b => ['analyzing', 'estimating'].includes(b.status)).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {bidOpportunities.filter(b => b.status === 'submitted').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">awaiting response</p>
          </CardContent>
        </Card>
      </div>

      {/* Bids Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Bid Opportunities</h2>
          <Link to={createPageUrl('BidOpportunities')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loadingBidOpps ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : bidOpportunities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">No bid opportunities yet</p>
              <Link to={createPageUrl('BidOpportunities')}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bid Opportunity
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bidOpportunities.slice(0, 4).map(bid => (
              <Link key={bid.id} to={`${createPageUrl('BidDetail')}?id=${bid.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{bid.title}</CardTitle>
                      <Badge className={
                        bid.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        bid.status === 'estimating' ? 'bg-yellow-100 text-yellow-800' :
                        bid.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }>
                        {bid.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-medium">{bid.client_name}</span>
                      </div>
                      {bid.estimated_value && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <DollarSign className="h-4 w-4" />
                          <span>${bid.estimated_value.toLocaleString()}</span>
                        </div>
                      )}
                      {bid.due_date && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>Due {format(new Date(bid.due_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
          <Link to={createPageUrl('Projects')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">No projects yet</p>
              <Link to={createPageUrl('Projects')}>
                <Button className="bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}