import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ProjectForm from '../components/projects/ProjectForm';
import PhaseNavigator from '../components/phases/PhaseNavigator';
import PhaseGateChecklist from '../components/phases/PhaseGateChecklist';
import PhaseManager from '../components/phases/PhaseManager';
import CustomPhaseManager from '../components/phases/CustomPhaseManager';
import OutlookCalendar from '../components/calendar/OutlookCalendar';
import PermitDashboard from '../components/permits/PermitDashboard';
import PermitUploader from '../components/permits/PermitUploader';
import AdminClientManager from '../components/client/AdminClientManager';
import ProjectDeadlines from '../components/calendar/ProjectDeadlines';
import ChangeOrderManager from '../components/changeorders/ChangeOrderManager';
import SafetyManager from '../components/safety/SafetyManager';
import DecisionManager from '../components/decisions/DecisionManager';
import TeamRoleManager from '../components/team/TeamRoleManager';
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
  CheckCircle2,
  Clock,
  Trash2,
  Eye
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
          <div className="h-48 bg-slate-100">
            <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
                <Badge className={cn("border", statusColors[project.status])}>
                  {project.status?.replace('_', ' ')}
                </Badge>
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  healthColors[project.health_status || 'green']
                )} title={`Health: ${project.health_status || 'green'}`} />
              </div>
              <p className="text-slate-500">{project.client_name}</p>
              {project.address && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>{project.address}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditForm(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setShowDeleteDialog(true)}>
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
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Tabs for detailed views */}
      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="changeorders">Change Orders</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="team">Team & Roles</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
          <TabsTrigger value="client">Client Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="mt-6">
          <div className="space-y-6">
            <PhaseNavigator
              currentPhase={project.current_phase || 'preconstruction'}
              phaseGates={phaseGates}
              customPhases={customPhases}
              onInitiateGate={handleInitiateGate}
              onViewGate={(gate) => {
                setSelectedGate(gate);
                setShowGateChecklist(true);
              }}
            />
            <PhaseManager
              projectId={projectId}
              currentPhase={project.current_phase || 'preconstruction'}
            />
            <CustomPhaseManager
              projectId={projectId}
              onSelectPhase={(phaseName) => {
                // Could navigate to phase detail or open edit dialog
              }}
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