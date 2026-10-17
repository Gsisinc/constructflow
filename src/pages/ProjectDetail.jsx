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
import ProjectMaterials from '../components/project/ProjectMaterials';
import PermitFormDialog from '../components/projects/PermitFormDialog';
import DualTrackTracker from '../components/projects/DualTrackTracker';
import SubmittalsTab from '../components/projects/SubmittalsTab';
import RFITab from '../components/projects/RFITab';
import PunchListTab from '../components/projects/PunchListTab';
import DocumentsTab from '../components/projects/DocumentsTab';
import AppendixFormsTab from '../components/projects/AppendixFormsTab';
import ScheduleOfValuesTab from '../components/projects/ScheduleOfValuesTab';
import OpsDocsTab from '../components/projects/OpsDocsTab';
import OpsDocsOverview from '../components/projects/OpsDocsOverview';
import FieldLogsTab from '../components/projects/FieldLogsTab';
import ProjectResourcesTab from '../components/projects/ProjectResourcesTab';
import CompanyStandardsFloors from '@/components/companyStandards/CompanyStandardsFloors';
import ProjectDashboard from '@/components/projects/ProjectDashboard';
import CostCodeBudgetBoard from '@/components/projects/CostCodeBudgetBoard';
import RecordAuditInfo from '@/components/ui/RecordAuditInfo';
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
  Trash2
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
  const [showPermitForm, setShowPermitForm] = useState(false);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            <img src={project.image_url} alt={project.name} className="w-full sm:w-auto h-full object-cover" />
          </div>
        )}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 break-words">{project.name}</h1>
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
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              {project.linked_bid_id && (
                <Link to={createPageUrl('BidDetail') + `?id=${project.linked_bid_id}`}>
                  <Button variant="outline" className="flex-1 sm:flex-none text-sm">
                    <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                    Source Bid
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl('Directory') + '?projectId=' + encodeURIComponent(projectId)}>
                <Button variant="outline" className="flex-1 sm:flex-none text-sm">
                  <Users className="h-4 w-4 mr-1 sm:mr-2" />
                  Directory
                </Button>
              </Link>
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 sm:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {project.start_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">Start</p>
                  <p className="font-medium">{format(new Date(String(project.start_date).slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-slate-500">End</p>
                  <p className="font-medium">{format(new Date(String(project.end_date).slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}</p>
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

            {/* Entered by + timestamps (auto-stamped by the platform) */}
            <div className="mt-4 pt-4 border-t border-slate-100">
            <RecordAuditInfo record={project} />
            </div>
            </div>
            </div>

      {/* Project Dashboard: forecast, countdown, phases view, tracking panels */}
      <ProjectDashboard
        project={project}
        projectId={projectId}
        customPhases={customPhases}
        phaseGates={phaseGates}
        expenses={expenses}
      />

      {/* Company Standards (read-only floors) */}
      <CompanyStandardsFloors />

      {/* Latest Ops / Field Docs */}
      <OpsDocsOverview projectId={projectId} customPhases={customPhases} />

      {/* Tabs for detailed views */}
      <Tabs defaultValue="phases" className="w-full sm:w-auto">
        <TabsList className="w-full sm:w-auto justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1 bg-slate-100 rounded-lg">
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="submittals">Submittals</TabsTrigger>
          <TabsTrigger value="rfis">RFIs</TabsTrigger>
          <TabsTrigger value="punchlist">Punch List</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="changeorders">Change Orders</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="team">Team & Roles</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="opsdocs">Ops / Field Docs</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="fieldlogs">Field Logs</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="sov">SOV & Pay Apps</TabsTrigger>
          <TabsTrigger value="client">Client Portal</TabsTrigger>
          {project.linked_bid_id && (
            <Link to={createPageUrl('BidDetail') + `?id=${project.linked_bid_id}&tab=estimate`} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 underline decoration-dotted">Estimate ↗</Link>
          )}
          {project.linked_bid_id && (
            <Link to={createPageUrl('BidDetail') + `?id=${project.linked_bid_id}&tab=procurement`} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 underline decoration-dotted">Procurement ↗</Link>
          )}
        </TabsList>

        <TabsContent value="tracker" className="mt-6">
          <DualTrackTracker projectId={projectId} project={project} />
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

        <TabsContent value="submittals" className="mt-6">
          <SubmittalsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="rfis" className="mt-6">
          <RFITab projectId={projectId} />
        </TabsContent>

        <TabsContent value="punchlist" className="mt-6">
          <PunchListTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="forms" className="mt-6">
          <AppendixFormsTab projectId={projectId} />
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
            <PermitDashboard permits={permits} onAddPermit={() => setShowPermitForm(true)} />
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <ProjectMaterials projectId={projectId} organizationId={project.organization_id} />
        </TabsContent>

        <TabsContent value="financials" className="mt-6">
          <div className="space-y-6">
            <CostCodeBudgetBoard projectId={projectId} />
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Financials</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Budget</p>
                  <p className="text-2xl font-bold text-slate-900">${project.budget?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Spent</p>
                  <p className="text-2xl font-bold text-slate-900">${totalExpenses?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-slate-900">${((project.budget || 0) - totalExpenses)?.toLocaleString() || '0'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Link to={createPageUrl('FinancialDashboard') + '?projectId=' + encodeURIComponent(projectId)}>
                  <Button className="w-full" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Financial Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl('SalesInvoices') + '?projectId=' + encodeURIComponent(projectId)}>
                  <Button className="w-full" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Sales Invoices
                  </Button>
                </Link>
                <Link to={createPageUrl('Transactions') + '?projectId=' + encodeURIComponent(projectId)}>
                  <Button className="w-full" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Transactions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="opsdocs" className="mt-6">
          <OpsDocsTab projectId={projectId} project={project} customPhases={customPhases} />
        </TabsContent>
        <TabsContent value="logistics" className="mt-6">
          <LogisticsTab project={project} calendarEvents={calendarEvents} customPhases={customPhases} />
        </TabsContent>

        <TabsContent value="fieldlogs" className="mt-6">
          <FieldLogsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <ProjectResourcesTab projectId={projectId} project={project} />
        </TabsContent>

        <TabsContent value="sov" className="mt-6">
          <ScheduleOfValuesTab projectId={projectId} project={project} />
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

      {/* Add Permit */}
      <PermitFormDialog
        open={showPermitForm}
        onOpenChange={setShowPermitForm}
        projectId={projectId}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['permits', projectId] })}
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

// ===================== LOGISTICS tab (v5, inlined: no new imports; uses React, base44, useQuery/useQueryClient, format and AlertDialog already imported) =====================
const lgParse = (v) => { if (!v) return null; const s = String(v); if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); } const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d; };
const fmtDate = (v, p = 'MMM d, yyyy') => { const d = lgParse(v); return d ? format(d, p) : ''; }; // same rule as src/lib/dates.js (date-only = local)
const toast = { success: () => {}, error: (m) => window.alert(m) };
const LG_ENTERED_BY = 'Entered by: Project Manager';
const LG_SOON = 'Coming soon';
const LG_MEETING_RE = /\b(meeting|oac|coordination|huddle)\b/i;

function LG_datePT(v) {
  if (!v) return '';
  let s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(s)) s += 'Z'; // platform timestamps without zone are UTC
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' }).format(d) + ' PT';
}
function LG_time12(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ''));
  if (!m) return t || '';
  const h = Number(m[1]); return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}
const LG_Miss = () => <span className="g-miss">—<b>No data yet</b></span>;

const LG_D = ':is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light)';
const LG_CSS = `
.gs5l{color:#0B1F3A;font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.15}
.gs5l *{box-sizing:border-box}
.gs5l .g-title{font-size:22px;line-height:1.3;font-weight:700;margin:0 0 16px;color:inherit}
.gs5l .g-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.gs5l .g-card{background:#fff;border:1px solid #DDE3EA;border-radius:12px;box-shadow:0 1px 3px rgba(11,31,58,.08);padding:16px;margin-bottom:16px;min-width:0}
.gs5l .g-st{font-size:15px;font-weight:700;margin:0 0 10px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;line-height:1.3}
.gs5l .g-muted{color:#5B6B7F;font-size:12px;font-weight:400;line-height:1.35}
.gs5l .g-foot{border-top:1px solid #DDE3EA;margin-top:10px;padding-top:6px}
.gs5l dl{margin:0}.gs5l dt{font-size:12px;color:#5B6B7F;line-height:1.35}.gs5l dd{margin:0 0 8px;line-height:1.3;word-break:break-word}
.gs5l .g-p{margin:16px 0;line-height:1.35}
.gs5l .g-miss{color:#9A6700;font-weight:600}.gs5l .g-miss b{background:#FFF4D6;border:1px solid #C9A227;border-radius:4px;padding:0 4px;font-size:11px;margin-left:4px}
.gs5l .g-badge{display:inline-block;border-radius:999px;padding:2px 8px;font-size:12px;background:#E8EDF3;color:#16335C;white-space:nowrap}
.gs5l .g-badge.red{background:#FEE4E2;color:#B42318}
.gs5l button.g-btn{min-height:44px;min-width:44px;height:44px;border:1px solid #1E3A5F;background:#0B1F3A;color:#fff;border-radius:8px;padding:0 14px;font:inherit;font-size:16px;cursor:pointer;line-height:1;flex:0 0 auto}
.gs5l button.g-btn.o{background:#fff;color:#0B1F3A}
.gs5l button:disabled{opacity:.55;cursor:not-allowed}
.gs5l table{width:100%;border-collapse:collapse;font-size:14px}
.gs5l th,.gs5l td{text-align:left;padding:8px;border-bottom:1px solid #DDE3EA;font-size:14px;line-height:1.3}
.gs5l th{background:#0B1F3A;color:#fff;font-weight:600}
.gs5l .pre{white-space:pre-wrap}
@media(max-width:767px){
 .gs5l .g-grid{grid-template-columns:1fr}
 .gs5l .rt thead{display:none}
 .gs5l .rt,.gs5l .rt tbody{display:block;width:100%}
 .gs5l .rt tr{display:block;width:100%;border:1px solid #DDE3EA;border-radius:8px;margin-bottom:8px;padding:6px}
 .gs5l .rt td{display:flex;justify-content:space-between;border:0;padding:4px 6px}
 .gs5l .rt td:before{content:attr(data-l);color:#5B6B7F;font-size:12px;margin-right:8px}
 .gs5l .rt td.empty{justify-content:center;width:100%}.gs5l .rt td.empty:before{content:none}
}
${LG_D} .gs5l{color:#E9EFF9}
${LG_D} .gs5l .g-card{background:#0F2340;border-color:rgba(148,178,226,.16);box-shadow:0 10px 30px -12px rgba(0,0,0,.55)}
${LG_D} .gs5l .g-muted,${LG_D} .gs5l dt,${LG_D} .gs5l .rt td:before{color:#8193B0}
${LG_D} .gs5l .g-foot,${LG_D} .gs5l td{border-color:rgba(148,178,226,.16)}
${LG_D} .gs5l th{background:#0B1F3A;color:#E9EFF9}
${LG_D} .gs5l .rt tr{border-color:rgba(148,178,226,.16)}
${LG_D} .gs5l .g-miss{color:#F5B544}${LG_D} .gs5l .g-miss b{background:rgba(245,181,68,.14);border-color:rgba(212,165,55,.55)}
${LG_D} .gs5l .g-badge{background:rgba(148,178,226,.14);color:#B7C4DA}
${LG_D} .gs5l button.g-btn{background:#16335C;border-color:rgba(148,178,226,.28);color:#fff}
${LG_D} .gs5l button.g-btn.o{background:transparent;color:#E9EFF9;border-color:rgba(148,178,226,.28)}
`;

function LG_Pencil({ label, onClick, disabled }) {
  return <button className="g-btn o" aria-label={`Edit ${label}`} title={disabled ? LG_SOON : `Edit ${label}`} disabled={disabled} onClick={onClick}>✎</button>;
}

function LogisticsTab({ project, calendarEvents = [], customPhases = [] }) {
  const projectId = project?.id;
  const qc = useQueryClient();
  const [showNote, setShowNote] = useState(false);

  // Same key + queryFn as OpsDocsTab, so the two tabs share one cached read.
  const { data: opsDocs = [] } = useQuery({
    queryKey: ['opsdocs', projectId],
    queryFn: async () => (await base44.entities.OpsDoc.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!projectId,
  });
  const siteNotes = React.useMemo(() => opsDocs.filter((d) => d.type === 'site_access_note'), [opsDocs]);
  const latest = siteNotes[0];

  const meeting = React.useMemo(() => {
    const ms = (calendarEvents || []).filter((e) => LG_MEETING_RE.test(`${e.title || ''} ${e.description || ''}`));
    if (!ms.length) return null;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
    const sorted = [...ms].sort((a, b) => String(a.start_date || '').localeCompare(String(b.start_date || '')));
    return sorted.find((e) => String(e.start_date || '').slice(0, 10) >= today) || sorted[sorted.length - 1];
  }, [calendarEvents]);
  const mDay = meeting?.start_date ? fmtDate(meeting.start_date, 'EEEE') : '';
  const phaseLabel = (v) => (customPhases || []).find((p) => p.phase_name === v)?.display_name || v;

  return (
    <div className="gs5l">
      <style>{LG_CSS}</style>
      <h1 className="g-title">Logistics</h1>
      <div className="g-grid">
        {/* Site access */}
        <div className="g-card">
          <div className="g-st">Site access <LG_Pencil label="site access" onClick={() => setShowNote(true)} /></div>
          <dl>
            <dt>Address</dt><dd>{project?.address || <LG_Miss />}</dd>
            <dt>Gate</dt><dd><LG_Miss /></dd>
            <dt>Hours</dt><dd><LG_Miss /></dd>
            <dt>Badge</dt><dd><LG_Miss /></dd>
            <dt>Orientation</dt><dd><LG_Miss /></dd>
            <dt>GC super name/phone</dt><dd><LG_Miss /></dd>
            <dt>Site access notes{siteNotes.length > 1 ? ` (${siteNotes.length})` : ''}</dt>
            <dd>{latest ? <><b>{latest.title}</b>{latest.notes ? <div className="pre g-muted" style={{ fontSize: 13, marginTop: 2 }}>{latest.notes}</div> : null}{latest.linked_phase ? <div className="g-muted">Phase: {phaseLabel(latest.linked_phase)}</div> : null}</> : <LG_Miss />}</dd>
          </dl>
          <div className="g-muted g-foot">{latest ? `Updated by ${latest.entered_by || 'Unknown'}, ${LG_datePT(latest.updated_date || latest.created_date)}` : 'No data yet'}</div>
        </div>

        {/* Storage / parking / unloading: no fields yet */}
        <div className="g-card">
          <div className="g-st">Storage / parking / unloading <LG_Pencil label="storage, parking and unloading" disabled /></div>
          <dl>
            <dt>Storage</dt><dd><LG_Miss /></dd>
            <dt>Parking</dt><dd><LG_Miss /></dd>
            <dt>Unloading</dt><dd><LG_Miss /></dd>
          </dl>
          <div className="g-muted g-foot">No data yet</div>
        </div>

        {/* GC meeting: from this project's Calendar events */}
        <div className="g-card">
          <div className="g-st">GC meeting <LG_Pencil label="GC meeting" disabled /></div>
          <dl>
            <dt>Meeting</dt><dd>{meeting?.title || <LG_Miss />}</dd>
            <dt>Day</dt><dd>{mDay || <LG_Miss />}</dd>
            <dt>Time</dt><dd>{meeting?.all_day ? 'All day' : meeting?.start_time ? `${LG_time12(meeting.start_time)}${meeting.end_time ? `–${LG_time12(meeting.end_time)}` : ''} PT` : <LG_Miss />}</dd>
            <dt>Location</dt><dd>{meeting?.location || <LG_Miss />}</dd>
          </dl>
          <div className="g-muted g-foot">{meeting ? `From Calendar: ${fmtDate(meeting.start_date, 'MMM d, yyyy')}` : 'No data yet'}</div>
        </div>
      </div>

      {/* Trade coordination: no entity yet */}
      <div className="g-card">
        <div className="g-st">Trade coordination <button className="g-btn" disabled title={LG_SOON}>+ Add</button></div>
        <table className="rt">
          <thead><tr><th>Trade</th><th>Item</th><th>Responsible</th><th>Due</th><th>Status</th><th>Phase</th></tr></thead>
          <tbody><tr><td className="empty g-muted" colSpan={6} style={{ textAlign: 'center', padding: 16 }}>No data yet</td></tr></tbody>
        </table>
        <div className="g-muted" style={{ marginTop: 8 }}>Overdue open rows will show a red indicator.</div>
        <div className="g-muted g-foot">No data yet</div>
      </div>

      {/* Risk flags: no fields yet */}
      <div className="g-card">
        <div className="g-st">Risk flags (bid-time) <LG_Pencil label="risk flags" disabled /></div>
        <p className="g-p"><span className="g-badge">No data yet</span></p>
        <p className="g-p g-muted">Live/occupied: <LG_Miss /> · Retrofit: <LG_Miss /></p>
        <p className="g-p g-muted">Delay-pricing factor per flag: <LG_Miss /> · Client portal visibility: <LG_Miss /></p>
        <div className="g-muted g-foot">No data yet</div>
      </div>

      <LG_SiteAccessDialog open={showNote} onOpenChange={setShowNote} project={project}
        onSaved={() => { qc.invalidateQueries({ queryKey: ['opsdocs', projectId] }); qc.invalidateQueries({ queryKey: ['opsdocs-overview', projectId] }); }} />
    </div>
  );
}

// Creates an OpsDoc of type site_access_note: the same create call OpsDocDialog makes (no files).
function LG_SiteAccessDialog({ open, onOpenChange, project, onSaved }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { if (open) { setTitle(''); setNotes(''); } }, [open]);
  const submit = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.OpsDoc.create({
        organization_id: project?.organization_id,
        project_id: project?.id,
        type: 'site_access_note',
        title: title.trim(),
        linked_phase: '',
        notes: `${notes.trim() ? notes.trim() + '\n\n' : ''}${LG_ENTERED_BY}`,
        file_attachments: [],
        entered_by: me?.full_name || me?.email || 'Project Manager',
        hours: 0,
        labor_budget: 0,
      });
      toast.success('Site access note saved');
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed: ' + (e?.message || 'error'));
    }
    setSaving(false);
  };
  const box = { width: '100%', border: '1px solid #DDE3EA', borderRadius: 8, padding: '0 10px', minHeight: 44, fontSize: 16, background: 'transparent', color: 'inherit' };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Site access note</AlertDialogTitle></AlertDialogHeader>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Title *<input style={box} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. GC gate, hours, badge, orientation" /></label>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Notes<textarea style={{ ...box, padding: 10, minHeight: 120 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate, hours, badge process, orientation, GC super…" /></label>
          <div style={{ fontSize: 12, color: '#5B6B7F' }}>Saved to Ops / Field Docs as a Site Access Note. {LG_ENTERED_BY}</div>
        </div>
        <AlertDialogFooter>
          <button style={{ ...box, width: 'auto', padding: '0 14px', background: '#fff', color: '#0B1F3A' }} onClick={() => onOpenChange(false)}>Cancel</button>
          <button style={{ ...box, width: 'auto', padding: '0 14px', background: '#0B1F3A', color: '#fff', borderColor: '#1E3A5F' }} disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Save'}</button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
