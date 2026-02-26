import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ProjectForm from '../components/projects/ProjectForm';
import PhaseNavigator from '../components/phases/PhaseNavigator';
import PhaseManager from '../components/phases/PhaseManager';
import PhaseGateChecklist from '../components/phases/PhaseGateChecklist';
import OutlookCalendar from '../components/calendar/OutlookCalendar';
import PermitDashboard from '../components/permits/PermitDashboard';
import PermitUploader from '../components/permits/PermitUploader';
import AdminClientManager from '../components/client/AdminClientManager';
import ProjectDeadlines from '../components/calendar/ProjectDeadlines';
import ChangeOrderManager from '../components/changeorders/ChangeOrderManager';
import SafetyManager from '../components/safety/SafetyManager';
import DecisionManager from '../components/decisions/DecisionManager';
import TeamRoleManager from '../components/team/TeamRoleManager';
import GanttChart from '../components/project/GanttChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  Clock,
  Trash2,
  FileStack,
  Phone,
  Cloud,
  ExternalLink,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const statusColors = {
  bidding: 'bg-purple-50 text-purple-700 border-purple-200',
  awarded: 'bg-blue-50 text-blue-700 border-blue-200',
  planning: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_hold: 'bg-slate-50 text-slate-700 border-slate-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const healthColors = {
  green: 'bg-green-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGateChecklist, setShowGateChecklist] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => base44.entities.Issue.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => base44.entities.Expense.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: phaseGates = [] } = useQuery({
    queryKey: ['phaseGates', projectId],
    queryFn: () => base44.entities.PhaseGate.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: permits = [] } = useQuery({
    queryKey: ['permits', projectId],
    queryFn: () => base44.entities.Permit.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['calendarEvents', projectId],
    queryFn: () => base44.entities.CalendarEvent.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['dailyLogs', projectId],
    queryFn: () => (projectId ? base44.entities.DailyLog.filter({ project_id: projectId }) : Promise.resolve([])),
    enabled: !!projectId,
  });

  const { data: clientUpdates = [] } = useQuery({
    queryKey: ['clientUpdates', projectId],
    queryFn: () => base44.entities.ClientUpdate.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['changeOrders', projectId],
    queryFn: () => base44.entities.ChangeOrder.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: safetyIncidents = [] } = useQuery({
    queryKey: ['safetyIncidents', projectId],
    queryFn: () => base44.entities.SafetyIncident.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions', projectId],
    queryFn: () => base44.entities.ProjectDecision.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: customPhases = [] } = useQuery({
    queryKey: ['customPhases', projectId],
    queryFn: () => base44.entities.CustomPhase.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setShowEditForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Project.delete(projectId),
    onSuccess: () => {
      window.location.href = createPageUrl('Projects');
    },
  });

  const taskCreateMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({
      project_id: projectId,
      organization_id: project?.organization_id,
      title: data.name,
      due_date: data.endDate || null,
      status: data.status || 'todo',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
  const taskUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, {
      title: data.name,
      due_date: data.endDate || null,
      status: data.status,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
  const taskDeleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const ganttTasks = (tasks || []).map((t) => ({
    id: t.id,
    name: t.title || t.name || 'Task',
    startDate: t.start_date || project?.start_date || new Date().toISOString().split('T')[0],
    endDate: t.end_date || t.due_date || project?.end_date || new Date().toISOString().split('T')[0],
    progress: t.progress ?? 0,
    assignee: t.assignee_id || '',
    status: (t.status === 'completed' ? 'completed' : t.status === 'in_progress' ? 'in-progress' : t.status === 'blocked' ? 'blocked' : 'todo'),
    dependencies: t.dependencies || [],
  }));

  const createGateMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseGate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseGates', projectId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Project not found</p>
        <Link to={createPageUrl('Projects')}>
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const budgetUsed = project.budget ? ((project.spent || 0) / project.budget * 100) : 0;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const openIssues = issues.filter(i => i.status === 'open').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleInitiateGate = (fromPhase, toPhase) => {
    const newGate = {
      project_id: projectId,
      from_phase: fromPhase,
      to_phase: toPhase,
      status: 'in_review',
      checklist_items: [
        { item: 'All required inspections passed', required: true, completed: false },
        { item: 'Documentation complete and approved', required: true, completed: false },
        { item: 'Budget reconciliation complete', required: true, completed: false },
        { item: 'Safety audit passed', required: true, completed: false },
        { item: 'Quality control sign-off', required: false, completed: false },
      ],
      required_signoffs: [
        { role: 'Superintendent', name: '', signed: false },
        { role: 'Project Manager', name: project.project_manager || '', signed: false },
        { role: 'Owner Representative', name: '', signed: false },
      ],
      initiated_date: new Date().toISOString().split('T')[0],
    };
    createGateMutation.mutate(newGate, {
      onSuccess: () => {
        // Update project's current phase and progress
        const totalPhases = 8; // Default phases count
        const PHASES = [
          'preconstruction', 'foundation', 'superstructure', 'enclosure',
          'mep_rough', 'interior_finishes', 'commissioning', 'closeout'
        ];
        const nextPhaseIndex = PHASES.indexOf(toPhase);
        const progress = nextPhaseIndex >= 0 ? ((nextPhaseIndex + 1) / totalPhases) * 100 : project.progress;
        
        updateMutation.mutate({
          current_phase: toPhase,
          progress: progress
        });
      }
    });
  };

  const locations = [...new Set(calendarEvents.map(e => e.location).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={createPageUrl('Projects')} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {project.image_url && (
          <div className="h-32 sm:h-48 bg-slate-100">
            <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-semibold text-slate-900 break-words">{project.name}</h1>
                <Badge className={cn("border text-xs", statusColors[project.status])}>
                  {project.status?.replace('_', ' ')}
                </Badge>
                <div className={cn(
                  "w-3 h-3 rounded-full flex-shrink-0",
                  healthColors[project.health_status || 'green']
                )} title={`Health: ${project.health_status || 'green'}`} />
              </div>
              <p className="text-sm text-slate-500">{project.client_name}</p>
              {project.address && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{project.address}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setShowEditForm(true)} className="flex-1 sm:flex-none text-sm">
                <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700 flex-1 sm:flex-none text-sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Overall Progress</span>
              <span className="font-medium">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-2" />
          </div>

          {/* Meta Info */}
          <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {project.start_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Start</p>
                  <p className="font-medium">{format(new Date(project.start_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">End</p>
                  <p className="font-medium">{format(new Date(project.end_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {project.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Budget</p>
                  <p className="font-medium">${project.budget.toLocaleString()}</p>
                </div>
              </div>
            )}
            {project.project_manager && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Manager</p>
                  <p className="font-medium">{project.project_manager}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tasks</p>
              <p className="text-xl font-semibold">{completedTasks}/{tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Open Issues</p>
              <p className="text-xl font-semibold">{openIssues}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Expenses</p>
              <p className="text-xl font-semibold">${totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-lg",
              budgetUsed > 90 ? "bg-red-100" : budgetUsed > 75 ? "bg-amber-100" : "bg-emerald-100"
            )}>
              <Clock className={cn(
                "h-5 w-5",
                budgetUsed > 90 ? "text-red-600" : budgetUsed > 75 ? "text-amber-600" : "text-emerald-600"
              )} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Budget Used</p>
              <p className="text-xl font-semibold">{budgetUsed.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Timers */}
      {project.end_date && (
        <ProjectDeadlines projectId={projectId} />
      )}

      {/* Tabs for detailed views (Home first, like SCM) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 bg-slate-100 rounded-lg">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="goals">Goals / Timeline</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="changeorders">Change Orders</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="team">Team & Roles</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="client">Client Portal</TabsTrigger>
        </TabsList>

        {/* Home tab: overview widgets (SCM-style) */}
        <TabsContent value="home" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Live site / Today's activity */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Live Site Status
                </h3>
                <p className="text-slate-600 text-sm mb-3">No employees currently clocked in.</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-lg font-semibold text-slate-900">{expenses.filter(e => {
                      const d = e.date || e.created_date;
                      return d && new Date(d).toDateString() === new Date().toDateString();
                    }).length}</p>
                    <p className="text-xs text-slate-500">Expenses</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-lg font-semibold text-slate-900">{clientUpdates.filter(u => {
                      const d = u.created_date;
                      return d && new Date(d).toDateString() === new Date().toDateString();
                    }).length}</p>
                    <p className="text-xs text-slate-500">Photos</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-lg font-semibold text-slate-900">{dailyLogs.filter(l => {
                      const d = l.log_date || l.created_date;
                      return d && new Date(d).toDateString() === new Date().toDateString();
                    }).length}</p>
                    <p className="text-xs text-slate-500">Logs</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-lg font-semibold text-slate-900">0</p>
                    <p className="text-xs text-slate-500">Files</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Today&apos;s Activity</p>
              </div>
              {/* Earlier activity */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Earlier Activity</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Weekly Hours:</span>{' '}
                    <span className="font-medium">0 hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Est. Cost:</span>{' '}
                    <span className="font-medium">${totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
                <Button variant="link" className="px-0 mt-2 text-xs" onClick={() => setActiveTab('logs')}>
                  View All
                </Button>
              </div>
              {/* Recent logs */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Recent Logs</h3>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={createPageUrl('DailyLog') + `?project=${projectId}`}>View All</Link>
                  </Button>
                </div>
                {dailyLogs.length === 0 ? (
                  <p className="text-slate-500 text-sm">No logs yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {dailyLogs
                      .sort((a, b) => new Date(b.log_date || 0) - new Date(a.log_date || 0))
                      .slice(0, 3)
                      .map((log) => (
                        <li key={log.id} className="text-sm text-slate-600 truncate">
                          {log.work_performed || log.notes || 'Log entry'} — {log.log_date ? format(new Date(log.log_date), 'MMM d') : ''}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-6">
              {/* Primary / Secondary contact */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Contacts</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Primary Contact</p>
                      <p className="font-medium text-slate-900">{project.project_manager || project.client_name || '—'} (PM)</p>
                    </div>
                    {project.primary_contact_phone && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={`tel:${project.primary_contact_phone}`}><Phone className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Secondary Contact</p>
                      <p className="font-medium text-slate-900">{project.secondary_contact_name || '—'} {project.secondary_contact_role ? `(${project.secondary_contact_role})` : ''}</p>
                    </div>
                    {project.secondary_contact_phone && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={`tel:${project.secondary_contact_phone}`}><Phone className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Weather */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Weather
                </h3>
                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                  <a href={`https://www.google.com/search?q=weather+${encodeURIComponent(project.address || project.name || '')}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    View forecast for site
                  </a>
                </Button>
              </div>
              {/* Project location / View Site Map */}
              {project.address && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Project Location</h3>
                  <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`} target="_blank" rel="noopener noreferrer">
                      <MapPin className="h-4 w-4" />
                      Open in Google Maps
                    </a>
                  </Button>
                </div>
              )}
              {/* Finish Project */}
              {project.status !== 'completed' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <Button
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      if (window.confirm('Mark this project as finished?')) {
                        updateMutation.mutate({ status: 'completed' });
                      }
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finish Project?
                  </Button>
                </div>
              )}
              {/* Schedule of Values (from change orders) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Schedule of Values</h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('changeorders')}>
                    Add Value
                  </Button>
                </div>
                {changeOrders.length === 0 ? (
                  <p className="text-slate-500 text-sm">No line items. Use Change Orders to add.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {changeOrders.slice(0, 5).map((co) => (
                      <div key={co.id} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                        <span className="truncate">{co.description || co.title || 'Change order'}</span>
                        <span className="font-medium shrink-0">${(co.cost_impact || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {changeOrders.length > 5 && (
                      <Button variant="link" className="px-0 text-xs" onClick={() => setActiveTab('changeorders')}>
                        View all ({changeOrders.length})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <GanttChart
              tasks={ganttTasks}
              onTaskAdd={(task) => taskCreateMutation.mutate(task)}
              onTaskUpdate={(task) => taskUpdateMutation.mutate({ id: task.id, data: task })}
              onTaskDelete={(id) => taskDeleteMutation.mutate(id)}
            />
          </div>
        </TabsContent>

        <TabsContent value="phases" className="mt-6">
          <div className="space-y-6">
            <PhaseNavigator
              projectId={projectId}
              currentPhase={project.current_phase || 'preconstruction'}
              phaseGates={phaseGates}
              customPhases={customPhases}
              onInitiateGate={handleInitiateGate}
              onViewGate={(gate) => {
                setSelectedGate(gate);
                setShowGateChecklist(true);
              }}
              onPhaseChange={(newPhase) => {
                updateMutation.mutate({ current_phase: newPhase });
              }}
            />
            <PhaseManager 
              projectId={projectId} 
              currentPhase={project.current_phase || 'preconstruction'} 
            />
          </div>
        </TabsContent>

        <TabsContent value="changeorders" className="mt-6">
          <ChangeOrderManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="safety" className="mt-6">
          <SafetyManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="decisions" className="mt-6">
          <DecisionManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamRoleManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <OutlookCalendar projectId={projectId} />
        </TabsContent>

        <TabsContent value="permits" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-end">
              <PermitUploader projectId={projectId} />
            </div>
            <PermitDashboard permits={permits} />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Daily Logs</h3>
              <Button variant="outline" size="sm" asChild>
                <Link to={createPageUrl('DailyLog') + `?project=${projectId}`}>
                  <FileStack className="h-4 w-4 mr-2" />
                  Add log
                </Link>
              </Button>
            </div>
            {dailyLogs.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-8 text-center text-slate-600">
                <FileStack className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                <p>No daily logs yet. Add a log to track work, weather, and notes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyLogs
                  .sort((a, b) => new Date(b.log_date || 0) - new Date(a.log_date || 0))
                  .map((log) => (
                    <div key={log.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                        <span>{log.log_date ? format(new Date(log.log_date), 'MMM d, yyyy') : '—'}</span>
                        {log.submitted_by && <span>{log.submitted_by}</span>}
                      </div>
                      {log.work_performed && <p className="text-slate-800 whitespace-pre-wrap">{log.work_performed}</p>}
                      {(log.weather?.conditions || log.weather?.temperature) && (
                        <p className="text-slate-600 text-sm mt-1">Weather: {[log.weather?.conditions, log.weather?.temperature && `${log.weather.temperature}°`].filter(Boolean).join(' ')}</p>
                      )}
                      {log.notes && <p className="text-slate-600 text-sm mt-1">{log.notes}</p>}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="client" className="mt-6">
          <AdminClientManager projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Description */}
      {project.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Description</h2>
          <p className="text-slate-600 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Edit Form */}
      <ProjectForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        project={project}
        onSubmit={(data) => updateMutation.mutate(data)}
      />

      {/* Phase Gate Checklist */}
      <PhaseGateChecklist
        gate={selectedGate}
        open={showGateChecklist}
        onOpenChange={setShowGateChecklist}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}