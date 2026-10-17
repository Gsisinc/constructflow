import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, Lock, Unlock, FileText, Image as ImageIcon, CheckCircle, MoreVertical, Trash2, Edit, GripVertical, Folder } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PhaseBudgetManager from '../budget/PhaseBudgetManager';

// phases-v2 (2026-10-17): VISUAL-ONLY restyle to phases-cost-progress_v5. Every query/mutation/handler is byte-identical to the base;
// new reads are pure additions (marked). `project` is a new optional display-only prop (Contract value card).
export default function PhaseManager({ projectId, currentPhase, project }) {
  const queryClient = useQueryClient();

  const { data: customPhases = [] } = useQuery({
    queryKey: ['customPhases', projectId],
    queryFn: () => base44.entities.CustomPhase.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId
  });

  const allPhases = customPhases
    .filter(cp => !cp.is_hidden)
    .map(cp => ({ value: cp.phase_name, label: cp.display_name, customPhaseId: cp.id }));

  const [selectedPhase, setSelectedPhase] = useState(() => {
    if (currentPhase) return currentPhase;
    return allPhases.length > 0 ? allPhases[0].value : null;
  });

  // A freshly converted project keeps current_phase = 'preconstruction', which is
  // not one of its carried custom phases. Fall back to the first carried phase so
  // the Phases/Requirements tabs read the same carried records the overview shows.
  useEffect(() => {
    if (customPhases.length > 0 && !customPhases.some(p => p.phase_name === selectedPhase && !p.is_hidden)) {
      const first = customPhases.find(p => !p.is_hidden);
      if (first) setSelectedPhase(first.phase_name);
    }
  }, [customPhases, selectedPhase]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);

  const { data: phaseData } = useQuery({
    queryKey: ['customPhase', projectId, selectedPhase],
    queryFn: async () => {
      if (!selectedPhase) return null;
      const phases = await base44.entities.CustomPhase.filter({ project_id: projectId, phase_name: selectedPhase });
      return phases[0];
    },
    enabled: !!projectId && !!selectedPhase
  });

  const createPhaseMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomPhase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
      setShowCreateDialog(false);
      setEditingPhase(null);
      toast.success('Phase created');
    }
  });

  const deletePhaseMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomPhase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
      toast.success('Phase deleted');
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomPhase.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhase'] });
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
    }
  });

  const togglePhaseLock = () => {
    if (phaseData) {
      updatePhaseMutation.mutate({
        id: phaseData.id,
        data: {
          is_locked: !phaseData.is_locked,
          locked_date: !phaseData.is_locked ? new Date().toISOString().split('T')[0] : null
        }
      });
      toast.success(phaseData.is_locked ? 'Phase unlocked' : 'Phase locked');
    }
  };

  const closePhase = () => {
    if (phaseData) {
      updatePhaseMutation.mutate({
        id: phaseData.id,
        data: {
          status: 'completed',
          progress_percent: 100,
          completed_date: new Date().toISOString().split('T')[0],
          is_locked: true
        }
      });
      toast.success('Phase completed and locked');
      
      // Auto-select next phase
      const currentIndex = allPhases.findIndex(p => p.value === selectedPhase);
      if (currentIndex !== -1 && currentIndex < allPhases.length - 1) {
        setSelectedPhase(allPhases[currentIndex + 1].value);
      }
    }
  };

  const [createForm, setCreateForm] = useState({ phase_name: '', display_name: '', order: customPhases.length, status: 'not_started', start_date: '', end_date: '' });

  const handleEditPhase = (phase) => {
    setEditingPhase(phase);
    setCreateForm({
      phase_name: phase.phase_name,
      display_name: phase.display_name,
      order: phase.order,
      status: phase.status || 'not_started',
      start_date: phase.start_date ? String(phase.start_date).slice(0, 10) : '',
      end_date: phase.end_date ? String(phase.end_date).slice(0, 10) : ''
    });
    setShowCreateDialog(true);
  };

  // CustomPhase fields status / start_date / end_date / completed_date already exist (no entity change).
  const datesInvalid = !!(createForm.start_date && createForm.end_date && createForm.end_date < createForm.start_date);
  const handleSavePhase = () => {
    if (datesInvalid) return;
    const { start_date, end_date, ...rest } = createForm;
    const data = {
      ...rest,
      ...(start_date ? { start_date } : {}),
      ...(end_date ? { end_date } : {}),
      ...(createForm.status === 'completed' && !editingPhase?.completed_date ? { completed_date: end_date || new Date().toISOString().slice(0, 10) } : {}),
    };
    if (editingPhase) {
      updatePhaseMutation.mutate({
        id: editingPhase.id,
        data
      });
    } else {
      createPhaseMutation.mutate({ project_id: projectId, ...data });
    }
  };

  const handleDeletePhase = (phase) => {
    if (confirm(`Delete phase "${phase.display_name}"? This will also delete all associated requirements, files, notes, and budget data.`)) {
      deletePhaseMutation.mutate(phase.id);
      if (selectedPhase === phase.phase_name && allPhases.length > 1) {
        setSelectedPhase(allPhases[0]?.value);
      }
    }
  };

  const { data: requirements = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId, selectedPhase],
    queryFn: () => base44.entities.PhaseRequirement.filter({ project_id: projectId, phase_name: selectedPhase }),
    enabled: !!projectId
  });

  const { data: files = [] } = useQuery({
    queryKey: ['phaseFiles', projectId, selectedPhase],
    queryFn: () => base44.entities.PhaseFile.filter({ project_id: projectId, phase_name: selectedPhase }),
    enabled: !!projectId
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['phaseNotes', projectId, selectedPhase],
    queryFn: () => base44.entities.PhaseNote.filter({ project_id: projectId }).then(all => all.filter(n => n.phase_key === selectedPhase || (!n.phase_key && n.phase_name === selectedPhase))),
    enabled: !!projectId
  });

  const { data: budget } = useQuery({
    queryKey: ['phaseBudget', projectId, selectedPhase],
    queryFn: async () => {
      const budgets = await base44.entities.PhaseBudget.filter({ project_id: projectId, phase_name: selectedPhase });
      return budgets[0];
    },
    enabled: !!projectId
  });

  const toggleRequirement = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.PhaseRequirement.update(id, {
      status: completed ? 'completed' : 'pending',
      completed_date: completed ? new Date().toISOString().split('T')[0] : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
    }
  });

  const toggleBudgetLock = useMutation({
    mutationFn: (isLocked) => {
      if (budget) {
        return base44.entities.PhaseBudget.update(budget.id, {
          is_locked: isLocked,
          locked_date: isLocked ? new Date().toISOString().split('T')[0] : null
        });
      } else {
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseBudget'] });
      toast.success(budget?.is_locked ? 'Budget unlocked' : 'Budget locked');
    }
  });

  const completedReqs = requirements.filter(r => r.status === 'completed').length;
  const progressPercent = requirements.length > 0 ? (completedReqs / requirements.length) * 100 : 0;
  const currentPhaseLabel = allPhases.find(p => p.value === selectedPhase)?.label;
  const isLocked = phaseData?.is_locked || false;


  // ===== v5 visual layer: PURE ADDITIONS below (every per-phase query/mutation above is unchanged) =====
  // Same key + queryFn as PhaseNavigator's requirements query (shared cache): progress bars on collapsed phase cards.
  const { data: v5AllReqs = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId],
    queryFn: () => base44.entities.PhaseRequirement.filter({ project_id: projectId }),
    enabled: !!projectId
  });
  // NEW read (addition): all PhaseBudget rows once, for the cost bar on every card. Key sits under ['phaseBudget'] so existing invalidations refresh it.
  const { data: v5Budgets = [] } = useQuery({
    queryKey: ['phaseBudget', projectId, '__all'],
    queryFn: () => base44.entities.PhaseBudget.filter({ project_id: projectId }),
    enabled: !!projectId
  });
  // NEW read (addition): all PhaseChangeOrder rows once (approved cost_impact = the "CO" part of the cost bar). Under ['phaseChangeOrders'] for the same reason.
  const { data: v5COs = [] } = useQuery({
    queryKey: ['phaseChangeOrders', projectId, '__all'],
    queryFn: () => base44.entities.PhaseChangeOrder.filter({ project_id: projectId }),
    enabled: !!projectId
  });
  // NEW read (addition): the SAME Expense query PhaseBudgetManager (the phase Budget tab) runs for every phase: Expense.filter({ project_id }).
  // Fetched once (not per phase). Key sits under ['phaseExpenses'] so PhaseBudgetManager's existing invalidations refresh it.
  const { data: v5Expenses = [] } = useQuery({
    queryKey: ['phaseExpenses', projectId, '__all'],
    queryFn: () => base44.entities.Expense.filter({ project_id: projectId }),
    enabled: !!projectId
  });
  // Budget-tab formula (PhaseBudgetManager lines 175-185), copied so the bar shows the SAME numbers as the Budget tab:
  //   spent = paid expenses, committed = approved expenses, COs = approved PhaseChangeOrder.cost_impact for the phase,
  //   used = spent + committed + COs, % used = used / PhaseBudget.budgeted_amount.
  const v5Spent = v5Expenses.reduce((sum, e) => sum + (e.status === 'paid' ? e.amount : 0), 0);
  const v5Committed = v5Expenses.reduce((sum, e) => sum + (e.status === 'approved' ? e.amount : 0), 0);
  const [ptab, setPtab] = useState('requirements');
  const v5Num = (v) => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
  const v5Money = (v) => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const v5Date = (v) => { if (!v) return ''; const [y, m, d] = String(v).slice(0, 10).split('-').map(Number); return format(new Date(y, m - 1, d), 'MMM d, yyyy'); };
  const V5Miss = () => <span className="g-miss">—<b>No data yet</b></span>;
  const phaseBudgetTotal = v5Budgets.reduce((s, b) => s + (v5Num(b.budgeted_amount) || 0), 0);

  return (
    <div className="gs5p">
      <style>{GS5_CSS}</style>
      <div className="g-note"><b>Unchanged:</b> Tracker and Financials (Budget by Cost Code) stay as they are. The cost/progress bars on each phase come from that phase’s Budget tab and don’t replace it.</div>

      {project && (
        <div className="g-card">
          <div className="g-st">Contract value</div>
          <p className="g-p">{v5Num(project.budget) ? <><b>{v5Money(project.budget)}</b> <span className="g-muted">(project budget)</span></> : <V5Miss />}
            {' '}· Phase budgets entered: {v5Budgets.length ? <b>{v5Money(phaseBudgetTotal)}</b> : <V5Miss />} <span className="g-muted">({v5Budgets.length} of {allPhases.length} phases)</span></p>
          <p className="g-p g-muted">Total budget hours: {v5Num(project.labor_hours) ? `${v5Num(project.labor_hours).toFixed(2)} (from the bid estimate)` : 'No data yet'}.</p>
        </div>
      )}

      <div className="g-toolbar">
        <span className="g-muted">Click a phase to open its Task, Files, Notes and Budget.</span>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingPhase(null);
            setCreateForm({ phase_name: '', display_name: '', order: customPhases.length, status: 'not_started', start_date: '', end_date: '' });
          }
        }}>
          <DialogTrigger asChild>
            <button className="g-btn">+ New Phase</button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPhase ? 'Edit Phase' : 'Create Custom Phase'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Phase ID (lowercase, no spaces)</Label>
                <Input
                  value={createForm.phase_name}
                  onChange={(e) => setCreateForm({ ...createForm, phase_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., electrical_rough_in"
                  disabled={!!editingPhase}
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={createForm.display_name}
                  onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                  placeholder="e.g., Electrical Rough-In"
                />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={createForm.order}
                  onChange={(e) => setCreateForm({ ...createForm, order: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select value={createForm.status || 'not_started'} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background">
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  {createForm.status === 'locked' && <option value="locked">Locked</option>}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start date</Label>
                  <Input type="date" value={createForm.start_date || ''} onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input type="date" value={createForm.end_date || ''} min={createForm.start_date || undefined} onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })} />
                </div>
              </div>
              {datesInvalid && <p className="text-xs text-red-600">End date can't be before the start date.</p>}
              <Button onClick={handleSavePhase} disabled={datesInvalid} className="w-full">
                {editingPhase ? 'Update Phase' : 'Create Phase'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {allPhases.map((phase, i) => {
        const cp = customPhases.find(p => p.phase_name === phase.value);
        const open = selectedPhase === phase.value;
        const reqs = open ? requirements : v5AllReqs.filter(r => r.phase_name === phase.value);
        const done = reqs.filter(r => r.status === 'completed').length;
        const pp = v5Num(cp?.progress_percent);
        const progress = pp ? pp : reqs.length ? Math.round((done / reqs.length) * 100) : null;
        const b = open && budget ? budget : v5Budgets.find(x => x.phase_name === phase.value);
        const co = v5COs.filter(c => c.phase_name === phase.value && c.status === 'approved').reduce((s, c) => s + c.cost_impact, 0);
        const budgeted = b && v5Num(b.budgeted_amount) ? v5Num(b.budgeted_amount) : null; // no PhaseBudget row / 0 => '—'
        const used = v5Spent + v5Committed + co;
        const costPct = budgeted ? used / budgeted * 100 : null;
        const mainCount = reqs.filter(r => !r.parent_requirement_id).length;
        const dates = cp?.start_date || cp?.end_date ? `${v5Date(cp.start_date) || '—'} – ${v5Date(cp.end_date) || '—'}` : null;
        // Same 4 tab values as today. Grouped: Work (Tasks, Files, Notes) | Money (Budget); each has its own color accent.
        const tabs = [['requirements', `Tasks${open ? ` (${mainCount})` : ''}`, 't-task'], ['files', 'Files', 't-file'], ['notes', 'Notes', 't-note'], ['budget', 'Budget', 't-bud']];
        return (
          <div key={phase.value} className={cn('g-card g-ph', open && 'open', phase.value === currentPhase && 'cur')} onClick={!open ? () => setSelectedPhase(phase.value) : undefined}>
            <div className="g-st">
              <span>{i + 1}. {phase.label}{cp?.is_locked ? ' 🔐' : ''}</span>
              <span className="g-hdr-r" onClick={(e) => e.stopPropagation()}>
                {open && phaseData?.status && <span className="g-badge">{phaseData.status.replace('_', ' ')}</span>}
                <span className={cn('g-badge', open && 'gold')} onClick={() => !open && setSelectedPhase(phase.value)}>{open ? 'Expanded' : 'Click to expand'}</span>
                {phase.customPhaseId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="g-dots" aria-label={`Phase actions: ${phase.label}`}>⋯</button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="gs5-menu">
                      <DropdownMenuItem onClick={() => handleEditPhase(customPhases.find(c => c.id === phase.customPhaseId))}>✎ Edit</DropdownMenuItem>
                      {open && phaseData && !isLocked && phaseData.status !== 'completed' && (
                        <DropdownMenuItem onClick={closePhase}>✓ Close Phase</DropdownMenuItem>
                      )}
                      {open && phaseData && (
                        <DropdownMenuItem onClick={togglePhaseLock}>{isLocked ? '🔓 Unlock Phase' : '🔒 Lock Phase'}</DropdownMenuItem>
                      )}
                      <div className="hr" />
                      <DropdownMenuItem className="red" onClick={() => handleDeletePhase(customPhases.find(c => c.id === phase.customPhaseId))}>🗑 Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </span>
            </div>
            <div className="g-muted">{dates || <>Dates: <V5Miss /></>} · SOV <V5Miss /> · Crew: <V5Miss /></div>
            <div className="g-bars">
              <div>
                <div className="g-muted">Cost (same numbers as this phase’s Budget tab): spent {v5Money(v5Spent)} + committed {v5Money(v5Committed)} + CO {v5Money(co)} = <b>{v5Money(used)}</b> of budgeted {budgeted !== null ? <b>{v5Money(budgeted)}</b> : <b>—</b>}{budgeted !== null && <> · remaining <b className={budgeted - used < 0 ? 'neg' : ''}>{v5Money(budgeted - used)}</b> ({costPct.toFixed(1)}% used)</>}</div>
                <div className={cn('g-bar', costPct === null && 'empty', costPct > 100 && 'over')}>{costPct !== null && <i style={{ width: `${Math.min(100, Math.max(0, costPct))}%` }} />}</div>
              </div>
              <div>
                <div className="g-muted">Progress {progress !== null ? <b>{progress}%</b> : <V5Miss />}{reqs.length ? ` (${done}/${reqs.length} tasks)` : ''} · Budget hrs: <V5Miss /></div>
                <div className={cn('g-bar', progress === null && 'empty')}>{progress !== null && <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />}</div>
              </div>
            </div>

            {!open && (
              <div className="g-ptabs" onClick={(e) => e.stopPropagation()}>
                <span className="g-grp">Work</span>
                {tabs.slice(0, 3).map(([k, l, c]) => <button key={k} className={c} onClick={() => { setSelectedPhase(phase.value); setPtab(k); }}>{l}</button>)}
                <span className="g-grp sep">Money</span>
                {tabs.slice(3).map(([k, l, c]) => <button key={k} className={c} onClick={() => { setSelectedPhase(phase.value); setPtab(k); }}>{l}</button>)}
              </div>
            )}

            {open && (
              <div onClick={(e) => e.stopPropagation()}>
                {isLocked ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Lock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">This phase is locked. Unlock it to make changes.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs value={ptab} onValueChange={setPtab} className="w-full">
                    <TabsList className="g-tablist">
                      <span className="g-grp">Work</span>
                      {tabs.slice(0, 3).map(([k, l, c]) => <TabsTrigger key={k} value={k} className={c}>{l}</TabsTrigger>)}
                      <span className="g-grp sep">Money</span>
                      {tabs.slice(3).map(([k, l, c]) => <TabsTrigger key={k} value={k} className={c}>{l}</TabsTrigger>)}
                    </TabsList>

                    <TabsContent value="requirements" className="mt-3 g-pane t-task">
                      <RequirementsTab projectId={projectId} phaseName={selectedPhase} requirements={requirements} onToggle={toggleRequirement} files={files} onOpenFiles={() => setPtab('files')} />
                    </TabsContent>

                    <TabsContent value="files" className="mt-3 g-pane t-file">
                      <FilesTab projectId={projectId} phaseName={selectedPhase} files={files} />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-3 g-pane t-note">
                      <NotesTab projectId={projectId} phaseName={selectedPhase} notes={notes} />
                    </TabsContent>

                    <TabsContent value="budget" className="mt-3 g-pane t-bud">
                      <PhaseBudgetManager projectId={projectId} phaseName={selectedPhase} />
                    </TabsContent>
                  </Tabs>
                )}
                {cp && <V5EditPhase cp={cp} updatePhaseMutation={updatePhaseMutation} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// v5 inline "Edit phase" form. Saves through the SAME updatePhaseMutation (CustomPhase.update) and the same field rules as handleSavePhase.
function V5EditPhase({ cp, updatePhaseMutation }) {
  const init = () => ({ display_name: cp.display_name || '', icon: cp.icon || '📌', order: cp.order ?? '', is_hidden: !!cp.is_hidden, start_date: cp.start_date ? String(cp.start_date).slice(0, 10) : '', end_date: cp.end_date ? String(cp.end_date).slice(0, 10) : '', status: cp.status || 'not_started', progress_percent: cp.progress_percent ?? '' });
  const [f, setF] = useState(init);
  useEffect(() => { setF(init()); }, [cp.id, cp.updated_date]);
  const bad = !!(f.start_date && f.end_date && f.end_date < f.start_date);
  const save = () => {
    if (bad) return;
    if (!f.display_name.trim()) return;
    const pct = f.progress_percent === '' ? null : Math.max(0, Math.min(100, Number(f.progress_percent)));
    updatePhaseMutation.mutate({ id: cp.id, data: {
      display_name: f.display_name.trim(),
      icon: f.icon,
      ...(f.order !== '' && Number.isFinite(Number(f.order)) ? { order: Number(f.order) } : {}),
      is_hidden: f.is_hidden,
      status: f.status,
      ...(f.start_date ? { start_date: f.start_date } : {}),
      ...(f.end_date ? { end_date: f.end_date } : {}),
      ...(pct !== null && Number.isFinite(pct) ? { progress_percent: pct } : {}),
      ...(f.status === 'completed' && !cp.completed_date ? { completed_date: f.end_date || new Date().toISOString().slice(0, 10) } : {}),
    } });
    toast.success('Phase updated');
  };
  const upd = cp.updated_date || cp.created_date;
  const updPT = upd ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(/Z|[+-]\d\d:?\d\d$/.test(String(upd)) ? upd : String(upd) + 'Z')) + ' PT' : '';
  return (
    <>
      <div className="g-st" style={{ marginTop: 12 }}>Edit phase</div>
      <div className="g-form">
        <label className="g-muted">Phase name<input className="g-in" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></label>
        <label className="g-muted">Icon (emoji)<input className="g-in" maxLength={8} value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} /></label>
        <label className="g-muted">Order<input className="g-in" type="number" min="0" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></label>
        <label className="g-muted">Start<input className="g-in" type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></label>
        <label className="g-muted">End<input className="g-in" type="date" min={f.start_date || undefined} value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></label>
        <label className="g-muted">Status<select className="g-in" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option>{f.status === 'locked' && <option value="locked">Locked</option>}
        </select></label>
        <label className="g-muted" title="Coming soon: CustomPhase has no budget-hours field">Budget hrs<input className="g-in" disabled placeholder="— No data yet" /></label>
        <label className="g-muted" title="Coming soon: CustomPhase has no actual-hours field">Actual hrs<input className="g-in" disabled placeholder="— No data yet" /></label>
        <label className="g-muted">% complete<input className="g-in" type="number" min="0" max="100" placeholder="— No data yet" value={f.progress_percent} onChange={(e) => setF({ ...f, progress_percent: e.target.value })} /></label>
      </div>
      <div className="g-muted" style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={f.is_hidden} onChange={(e) => setF({ ...f, is_hidden: e.target.checked })} /> Hidden from tracker</label>
        <span>Phase key: <code>{cp.phase_name}</code> (fixed: tasks, files, notes and budget are linked by it)</span>
        <span>Locked: <b>{cp.is_locked ? 'Yes' : 'No'}</b> (use ⋯ Lock/Unlock)</span>
        <span>Delays logged: <b>{Array.isArray(cp.delays) ? cp.delays.length : 0}</b></span>
      </div>
      {!f.display_name.trim() && <p className="g-muted" style={{ color: '#B42318', marginTop: 6 }}>Phase name is required.</p>}
      {bad && <p className="g-muted" style={{ color: '#B42318', marginTop: 6 }}>End date can’t be before the start date.</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="g-btn" onClick={save} disabled={bad || !f.display_name.trim()}>Save</button>
        <button className="g-btn o" onClick={() => setF(init())}>Cancel</button>
      </div>
      <div className="g-muted g-foot">{upd ? `Updated ${updPT}` : 'No data yet'}</div>
    </>
  );
}


function RequirementsTab({ projectId, phaseName, requirements, onToggle, files = [], onOpenFiles }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedParentReq, setSelectedParentReq] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const req = await base44.entities.PhaseRequirement.create(data);
      // Create a folder only for main requirements (not sub-requirements)
      if (!data.parent_requirement_id) {
        await base44.entities.PhaseFile.create({
          project_id: data.project_id,
          phase_name: data.phase_name,
          file_name: `[Folder] ${data.requirement_text}`,
          file_url: `folder://${req.id}`,
          file_type: 'other',
          description: `Folder for requirement: ${data.requirement_text}`
        });
      }
      return req;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      setShowForm(false);
      setSelectedParentReq(null);
      toast.success('Requirement added');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PhaseRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
      toast.success('Requirement deleted');
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, order, parent_requirement_id }) => {
      const updateData = { order };
      if (parent_requirement_id !== undefined) {
        updateData.parent_requirement_id = parent_requirement_id;
      }
      return base44.entities.PhaseRequirement.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
    }
  });

  const updateRequirementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PhaseRequirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Check if dragging from main list to sub list (converting to sub-requirement)
    if (source.droppableId === 'requirements' && destination.droppableId.startsWith('sub-')) {
      const newParentId = destination.droppableId.replace('sub-', '');
      const draggedReq = requirements.find(r => r.id === draggableId);
      
      // Don't allow making a requirement its own child or creating circular dependencies
      if (draggedReq?.id === newParentId) return;
      
      // Update the parent_requirement_id
      updateRequirementMutation.mutate({ 
        id: draggableId, 
        data: {
          parent_requirement_id: newParentId,
          order: destination.index
        }
      });
      return;
    }

    // Check if dragging from sub list to main list (converting to main requirement)
    if (source.droppableId.startsWith('sub-') && destination.droppableId === 'requirements') {
      updateRequirementMutation.mutate({ 
        id: draggableId, 
        data: {
          parent_requirement_id: null,
          order: destination.index
        }
      });
      return;
    }

    // Same droppable reordering
    if (source.droppableId !== destination.droppableId) return;
    if (source.index === destination.index) return;

    const isSubList = source.droppableId.startsWith('sub-');
    const parentId = isSubList ? source.droppableId.replace('sub-', '') : null;
    
    const items = parentId 
      ? requirements.filter(r => r.parent_requirement_id === parentId).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      : requirements.filter(r => !r.parent_requirement_id).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    const reordered = Array.from(items);
    const [removed] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, removed);

    // Update orders
    reordered.forEach((item, index) => {
      if (item.order !== index) {
        updateOrderMutation.mutate({ id: item.id, order: index });
      }
    });
  };

  const [formData, setFormData] = useState({ requirement_text: '', is_mandatory: true });


  // ===== v5 render (visual only). Same mutations, same DnD droppable ids/types, same sort, same confirms. =====
  const [v5NewText, setV5NewText] = useState('');
  const [v5OpenFiles, setV5OpenFiles] = useState(null);
  const v5FilesFor = (req) => { const folder = files.find(f => f.file_url === `folder://${req.id}`); return folder ? files.filter(f => f.parent_folder_id === folder.id) : []; };
  const v5FilesOpen = (req) => (v5OpenFiles === null ? v5FilesFor(req).length > 0 : !!v5OpenFiles[req.id]);
  const v5ToggleFiles = (req) => setV5OpenFiles({ ...(v5OpenFiles || Object.fromEntries(requirements.map(r => [r.id, v5FilesFor(r).length > 0]))), [req.id]: !v5FilesOpen(req) });
  const v5AddMain = () => {
    const t = v5NewText.trim(); if (!t) return;
    createMutation.mutate({ project_id: projectId, phase_name: phaseName, parent_requirement_id: null, ...formData, requirement_text: t });
    setV5NewText('');
  };
  const [v5EditReq, setV5EditReq] = useState(null); // { id, requirement_text, is_mandatory, done }
  const v5Edit = (req) => setV5EditReq({ id: req.id, requirement_text: req.requirement_text || '', is_mandatory: !!req.is_mandatory, done: req.status === 'completed' });
  const v5SaveEdit = (req) => {
    const t = v5EditReq.requirement_text.trim(); if (!t) return;
    if (t !== req.requirement_text || v5EditReq.is_mandatory !== !!req.is_mandatory) {
      updateRequirementMutation.mutate({ id: req.id, data: { requirement_text: t, is_mandatory: v5EditReq.is_mandatory } });
    }
    if (v5EditReq.done !== (req.status === 'completed')) onToggle.mutate({ id: req.id, completed: v5EditReq.done }); // same toggle as the checkbox (sets completed_date)
    setV5EditReq(null);
  };
  const v5Row = (req, provided, isSub) => {
    const fl = v5FilesFor(req); const fOpen = v5FilesOpen(req);
    return (
      <div ref={provided.innerRef} {...provided.draggableProps} className={cn('g-req', isSub && 'child')}>
        <div className="g-tk">
          <span className="g-hd" title="Drag to reorder" {...provided.dragHandleProps}>⋮⋮</span>
          <input type="checkbox" aria-label="Done" checked={req.status === 'completed'} onChange={(e) => onToggle.mutate({ id: req.id, completed: e.target.checked })} />
          <span className={cn('tx', req.status === 'completed' && 'done')}>
            {req.requirement_text}
            {req.is_mandatory && <span className="g-badge" style={{ marginLeft: 6 }}>Mandatory</span>}
            {req.completed_date && <span className="g-muted" style={{ display: 'block' }}>Completed {format(new Date(req.completed_date), 'MMM d, yyyy')}</span>}
          </span>
          <button className={cn('g-clip', fl.length > 0 && 'has')} onClick={() => v5ToggleFiles(req)} aria-expanded={fOpen}>📎 {fl.length} {fOpen ? '▾' : '▸'}</button>
          {!isSub && <button className="g-sub" onClick={() => { setSelectedParentReq(req); setShowForm(true); }}>＋ <span>Add </span>sub-task</button>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="g-dots" aria-label="Task actions">⋯</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="gs5-menu" style={{ minWidth: 150 }}>
              <DropdownMenuItem onClick={() => v5Edit(req)}>✎ Edit</DropdownMenuItem>
              <DropdownMenuItem className="red" onClick={() => {
                if (confirm(isSub ? 'Delete this sub-requirement?' : 'Delete this requirement and all its sub-requirements?')) {
                  deleteMutation.mutate(req.id);
                }
              }}><span>🗑 Delete<small>Asks to confirm</small></span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {v5EditReq?.id === req.id && (
          <div className="g-files g-tedit">
            <input className="g-in" aria-label="Task text" value={v5EditReq.requirement_text} onChange={(e) => setV5EditReq({ ...v5EditReq, requirement_text: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && v5SaveEdit(req)} />
            <label className="g-muted"><input type="checkbox" checked={v5EditReq.is_mandatory} onChange={(e) => setV5EditReq({ ...v5EditReq, is_mandatory: e.target.checked })} /> Mandatory</label>
            <select className="g-in" aria-label="Status" value={v5EditReq.done ? 'completed' : 'pending'} onChange={(e) => setV5EditReq({ ...v5EditReq, done: e.target.value === 'completed' })}>
              <option value="pending">Pending</option><option value="completed">Completed</option>
            </select>
            <button className="g-btn" disabled={!v5EditReq.requirement_text.trim()} onClick={() => v5SaveEdit(req)}>Save</button>
            <button className="g-btn o" onClick={() => setV5EditReq(null)}>Cancel</button>
          </div>
        )}
        {fOpen && (
          <div className="g-files">
            <span className="lbl">Files</span>
            {fl.length === 0 && <span className="g-muted">No files yet</span>}
            {fl.map(f => (
              <React.Fragment key={f.id}>
                <span className="g-badge">📄 {f.file_name}</span>
                <button className="g-btn o" onClick={() => window.open(f.file_url, '_blank', 'noopener')}>View</button>
                <a href={f.file_url} download={f.file_name} target="_blank" rel="noreferrer"><button className="g-btn o" tabIndex={-1}>Download</button></a>
              </React.Fragment>
            ))}
            <button className="g-btn" onClick={() => onOpenFiles?.()} title="Opens the Files tab (same upload as today)">+ Attach file</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Requirement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedParentReq && (
              <div className="text-sm text-slate-600 mb-2">
                Adding sub-requirement to: <span className="font-medium">{selectedParentReq.requirement_text}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                  onClick={() => setSelectedParentReq(null)}
                >
                  ← Back
                </Button>
              </div>
            )}
            <Input
              value={formData.requirement_text}
              onChange={(e) => setFormData({ ...formData, requirement_text: e.target.value })}
              placeholder={selectedParentReq ? "Sub-requirement text" : "Requirement text"}
            />
            <Button 
              onClick={() => createMutation.mutate({ 
                project_id: projectId, 
                phase_name: phaseName, 
                parent_requirement_id: selectedParentReq?.id || null,
                ...formData 
              })} 
              className="w-full"
            >
              Add {selectedParentReq ? 'Sub-Requirement' : 'Requirement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="g-st" style={{ flexWrap: 'wrap' }}>Task <span className="g-muted">drag ⋮⋮ to reorder · <b>Drag onto a task’s sub-list to make it a sub-task</b> (drag back out to un-nest) · creating a main task auto-creates its file folder</span></div>

      {requirements.length === 0 ? (
        <p className="g-muted" style={{ margin: '8px 0 12px' }}>No tasks yet</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="requirements" type="main">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {requirements
                  .filter(r => !r.parent_requirement_id)
                  .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                  .map((req, index) => {
                    const subReqs = requirements
                      .filter(sr => sr.parent_requirement_id === req.id)
                      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
                    return (
                      <Draggable key={req.id} draggableId={req.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            {v5Row(req, { innerRef: undefined, draggableProps: {}, dragHandleProps: provided.dragHandleProps }, false)}
                            <Droppable droppableId={`sub-${req.id}`} type="main">
                              {(provided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={cn('g-sublist', snapshot.isDraggingOver && 'over')}
                                >
                                  {subReqs.map((subReq, subIndex) => (
                                    <Draggable key={subReq.id} draggableId={subReq.id} index={subIndex}>
                                      {(provided) => v5Row(subReq, provided, true)}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <div className="g-addrow">
        <input className="g-in" placeholder="New task…" value={v5NewText} onChange={(e) => setV5NewText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && v5AddMain()} />
        <button className="g-btn" onClick={v5AddMain}>+ Add task</button>
      </div>
    </div>
  );
}


function FilesTab({ projectId, phaseName, files }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const queryClient = useQueryClient();

  // Query requirements to create missing folders
  const { data: requirements = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId, phaseName],
    queryFn: () => base44.entities.PhaseRequirement.filter({ project_id: projectId, phase_name: phaseName }),
    enabled: !!projectId && !!phaseName
  });

  // Sync folders: only keep folders for main requirements, delete all others
  useEffect(() => {
    const syncFolders = async () => {
      const mainRequirements = requirements.filter(r => !r.parent_requirement_id);
      const mainReqIds = mainRequirements.map(r => r.id);
      const existingFolders = files.filter(f => f.file_url?.startsWith('folder://'));
      
      let needsRefresh = false;
      
      // Delete folders that are NOT for main requirements
      for (const folder of existingFolders) {
        const reqId = folder.file_url.replace('folder://', '').replace('custom_', '');
        // Delete if it's not a main requirement and not a custom folder
        if (!mainReqIds.includes(reqId) && !folder.file_url.includes('custom_')) {
          await base44.entities.PhaseFile.delete(folder.id);
          needsRefresh = true;
        }
      }
      
      // Create folders for main requirements that don't have them
      const existingFolderUrls = existingFolders.map(f => f.file_url);
      for (const req of mainRequirements) {
        const folderUrl = `folder://${req.id}`;
        if (!existingFolderUrls.includes(folderUrl)) {
          await base44.entities.PhaseFile.create({
            project_id: projectId,
            phase_name: phaseName,
            file_name: `[Folder] ${req.requirement_text}`,
            file_url: folderUrl,
            file_type: 'other',
            description: `Folder for requirement: ${req.requirement_text}`,
            order: req.order || 0
          });
          needsRefresh = true;
        }
      }
      
      if (needsRefresh) {
        queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      }
    };

    if (requirements.length > 0 && files) {
      syncFolders();
    }
  }, [requirements, files, projectId, phaseName]);

  const createFolderMutation = useMutation({
    mutationFn: async (name) => {
      const maxOrder = Math.max(...folders.map(f => f.order || 0), 0);
      return base44.entities.PhaseFile.create({
        project_id: projectId,
        phase_name: phaseName,
        file_name: `[Folder] ${name}`,
        file_url: `folder://custom_${Date.now()}`,
        file_type: 'other',
        description: 'Custom folder',
        order: maxOrder + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      setShowCreateFolder(false);
      setFolderName('');
      toast.success('Folder created');
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      // Delete all files in the folder first
      const folderFiles = files.filter(f => f.parent_folder_id === folderId);
      for (const file of folderFiles) {
        await base44.entities.PhaseFile.delete(file.id);
      }
      // Delete the folder
      await base44.entities.PhaseFile.delete(folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      setSelectedFolder(null);
      toast.success('Folder deleted');
    }
  });

  const updateFolderOrderMutation = useMutation({
      mutationFn: ({ id, order }) => base44.entities.PhaseFile.update(id, { order }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
        queryClient.invalidateQueries({ queryKey: ['phaseRequirements'] });
      }
    });

  const handleFolderDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reordered = Array.from(folders);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    reordered.forEach((folder, index) => {
      updateFolderOrderMutation.mutate({ id: folder.id, order: index });
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.PhaseFile.create({
        project_id: projectId,
        phase_name: phaseName,
        file_name: file.name,
        file_url: file_url,
        file_type: file.type.includes('image') ? 'photo' : 'document',
        parent_folder_id: selectedFolder?.id || null
      });

      queryClient.invalidateQueries({ queryKey: ['phaseFiles'] });
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Get folders and sort them by order
  const folders = files
    .filter(f => f.file_url?.startsWith('folder://'))
    .map(folder => {
      const reqId = folder.file_url.replace('folder://', '').replace('custom_', '');
      const req = requirements.find(r => r.id === reqId);
      return { ...folder, requirement: req };
    })
    .sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });

  const currentFiles = selectedFolder 
    ? files.filter(f => f.parent_folder_id === selectedFolder.id && !f.file_url?.startsWith('folder://')).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {selectedFolder && (
          <Button size="sm" variant="outline" onClick={() => setSelectedFolder(null)}>
            ← Back to Folders
          </Button>
        )}
        <div className={cn("flex gap-2", !selectedFolder && "ml-auto")}>
          {selectedFolder && (
            <>
              <Badge variant="secondary" className="text-sm">
                {selectedFolder.file_name.replace('[Folder] ', '')}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Delete this folder and all its files?')) {
                    deleteFolderMutation.mutate(selectedFolder.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {!selectedFolder && (
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder name"
                  />
                  <Button onClick={() => createFolderMutation.mutate(folderName)} className="w-full">
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <label>
            <Button size="sm" disabled={uploading || !selectedFolder} asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload File'}
              </span>
            </Button>
            <input type="file" className="hidden" onChange={handleUpload} disabled={!selectedFolder} />
          </label>
        </div>
      </div>

      {!selectedFolder && (
        <DragDropContext onDragEnd={handleFolderDragEnd}>
          <Droppable droppableId="folders">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {folders.length === 0 ? (
                  <Card className="md:col-span-2">
                    <CardContent className="py-12 text-center text-slate-500">
                      No folders yet. Create one to get started.
                    </CardContent>
                  </Card>
                ) : (
                  folders.map((folder, index) => (
                    <Draggable key={folder.id} draggableId={folder.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-5 w-5 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0" onClick={() => setSelectedFolder(folder)}>
                                <div className="flex items-center gap-2">
                                  <Folder className="h-5 w-5 text-amber-500" />
                                  <p className="text-sm font-medium truncate">
                                    {folder.file_name.replace('[Folder] ', '')}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-500 ml-7">
                                  {files.filter(f => f.parent_folder_id === folder.id).length} files
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this folder and all its files?')) {
                                    deleteFolderMutation.mutate(folder.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {currentFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            {selectedFolder ? 'No files in this folder' : 'No files uploaded'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {currentFiles.map(file => (
            <Card key={file.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {file.file_type === 'photo' ? <ImageIcon className="h-5 w-5 text-slate-400" /> : <FileText className="h-5 w-5 text-slate-400" />}
                  <div className="flex-1 min-w-0">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-blue-600 truncate block">
                      {file.file_name}
                    </a>
                    <p className="text-xs text-slate-500">Uploaded {format(new Date(file.created_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTab({ projectId, phaseName, notes }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me()});

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseNotes'] });
      setShowForm(false);
      setFormData({ title: '', content: '' });
      toast.success('Note added');
    },
    onError: (err) => toast.error('Could not save note: ' + (err?.message || 'unknown error'))
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title (optional)"
              />
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Note content"
                className="h-32"
              />
              <Button disabled={!formData.content?.trim()} onClick={() => createMutation.mutate({ project_id: projectId, phase_key: phaseName, author: me?.full_name || me?.email, ...(['preconstruction', 'foundation', 'superstructure', 'enclosure', 'mep_rough', 'interior_finishes', 'commissioning', 'closeout'].includes(phaseName) ? { phase_name: phaseName } : {}), ...formData })} className="w-full">
                Add Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No notes yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <Card key={note.id}>
              <CardHeader>
                {note.title && <CardTitle className="text-base">{note.title}</CardTitle>}
                <p className="text-xs text-slate-500">
                  {format(new Date(note.created_date), 'MMM d, yyyy h:mm a')} • {note.author}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetTab({ projectId, phaseName, budget, onToggleLock }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ budgeted_amount: budget?.budgeted_amount || 0 });
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (budget) {
        return base44.entities.PhaseBudget.update(budget.id, data);
      } else {
        return base44.entities.PhaseBudget.create({ project_id: projectId, phase_name: phaseName, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseBudget'] });
      setEditing(false);
      toast.success('Budget saved');
    }
  });

  const remaining = (budget?.budgeted_amount || 0) - (budget?.spent_amount || 0) - (budget?.committed_amount || 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Phase Budget</CardTitle>
            <div className="flex gap-2">
              {budget?.is_locked ? (
                <Button size="sm" variant="outline" onClick={() => onToggleLock.mutate(false)}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onToggleLock.mutate(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock
                </Button>
              )}
              {!budget?.is_locked && (
                <Button size="sm" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label>Budgeted Amount</Label>
                <Input
                  type="number"
                  value={formData.budgeted_amount}
                  onChange={(e) => setFormData({ budgeted_amount: parseFloat(e.target.value) })}
                />
              </div>
              <Button onClick={() => saveMutation.mutate(formData)}>
                Save Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Budgeted:</span>
                <span className="font-semibold">${(budget?.budgeted_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Spent:</span>
                <span className="text-red-600">${(budget?.spent_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Committed:</span>
                <span className="text-yellow-600">${(budget?.committed_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-slate-600 font-medium">Remaining:</span>
                <span className={`font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${remaining.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== v5 scoped styles (explicit hex; no --primary). Visual only. =====
const GS5_CSS = `
.gs5p{color:#0B1F3A;font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.15}
.gs5p *{box-sizing:border-box}
.gs5p .g-title{font-size:22px;line-height:1.3;font-weight:700;margin:0 0 16px;color:inherit}
.gs5p .g-card{background:#fff;border:1px solid #DDE3EA;border-radius:12px;box-shadow:0 1px 3px rgba(11,31,58,.08);padding:16px;margin-bottom:16px}
.gs5p .g-st{font-size:15px;font-weight:700;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3}
.gs5p .g-muted{color:#5B6B7F;font-size:12px;font-weight:400;line-height:1.35}
.gs5p .g-foot{border-top:1px solid #DDE3EA;margin-top:10px;padding-top:6px}
.gs5p .g-p{margin:16px 0;line-height:1.35}
.gs5p .g-miss{color:#9A6700;font-weight:600;white-space:nowrap}.gs5p .g-miss b{background:#FFF4D6;border:1px solid #C9A227;border-radius:4px;padding:0 4px;font-size:11px;margin-left:4px}
.gs5p .g-badge{display:inline-block;border-radius:999px;padding:2px 8px;font-size:12px;background:#E8EDF3;color:#16335C;white-space:nowrap}
.gs5p .g-badge.gold{background:#C9A227;color:#0B1F3A}
.gs5p button.g-btn{min-height:44px;min-width:44px;border:1px solid #1E3A5F;background:#0B1F3A;color:#fff;border-radius:8px;padding:0 14px;font:inherit;font-size:16px;cursor:pointer;line-height:1}
.gs5p button.g-btn.o{background:#fff;color:#0B1F3A}
.gs5p button.g-btn.goldb{background:#C9A227;color:#0B1F3A;border-color:#C9A227}
.gs5p button:disabled{opacity:.55;cursor:not-allowed}
.gs5p .g-bar{height:10px;background:#E8EDF3;border-radius:5px;overflow:hidden;margin-top:4px}.gs5p .g-bar i{display:block;height:100%;background:#C9A227;border-radius:5px}
.gs5p .g-bar.over i{background:#B42318}
.gs5p .g-bar.empty{background:repeating-linear-gradient(45deg,#E8EDF3 0 6px,#fff 6px 12px)}
.gs5p .g-ph{cursor:pointer}.gs5p .g-ph.open{border:2px solid #C9A227;cursor:default}
.gs5p .g-ph.cur{box-shadow:0 0 0 4px rgba(201,162,39,.14),0 6px 22px -6px rgba(201,162,39,.45)}
.gs5p .g-phhd{cursor:pointer}
.gs5p input.g-in,.gs5p select.g-in,.gs5p textarea.g-in{min-height:44px;border:1px solid #DDE3EA;border-radius:8px;padding:0 10px;font:inherit;font-size:16px;width:100%;background:#fff;color:#0B1F3A}
.gs5p textarea.g-in{padding:10px;min-height:110px}
.gs5p input.g-in:disabled{background:#F5F7FA}
.gs5p .g-form{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}
.gs5p .g-form label{display:block}
@media(min-width:768px){.gs5p .g-form input.g-in,.gs5p .g-form select.g-in{font-size:12px}}
.gs5p .g-dots{border:1px solid #DDE3EA;background:#fff;border-radius:8px;min-width:36px;min-height:36px;height:36px;font-size:16px;line-height:1;cursor:pointer;color:#0B1F3A;padding:0}
.gs5p .g-dots.sm{min-width:28px;min-height:28px;height:28px;margin-top:4px}
.gs5p .g-dots.on{border-color:#C9A227;background:#FFF4D6}
.gs5p .g-sub{border:1px solid #DDE3EA;background:#fff;color:#16335C;border-radius:8px;min-height:36px;height:36px;padding:0 10px;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer}
.gs5p .g-menu{position:fixed;z-index:60;background:#fff;border:1px solid #DDE3EA;border-radius:10px;box-shadow:0 10px 24px rgba(11,31,58,.2);min-width:220px;padding:6px;text-align:left;font-size:13px;color:#0B1F3A;font-weight:400}
.gs5p .g-menu .mi{display:block;width:100%;text-align:left;background:none;border:0;font:inherit;font-size:13px;color:inherit;padding:9px 10px;border-radius:6px;min-height:36px;cursor:pointer;line-height:1.2}
.gs5p .g-menu .mi:hover:not(:disabled){background:#F5F7FA}
.gs5p .g-menu .mi:disabled{color:#A0AAB8;opacity:1}
.gs5p .g-menu .mh{font-weight:700;color:#5B6B7F;font-size:11px;padding:9px 10px}
.gs5p .g-menu .red{color:#B42318;font-weight:600}.gs5p .g-menu hr{border:0;border-top:1px solid #DDE3EA;margin:4px 0}
.gs5p .g-menu small{display:block;color:#5B6B7F;font-size:11px;font-weight:400}
.gs5p .g-pn{display:flex;align-items:flex-start;overflow-x:auto;padding:8px 4px 4px}
.gs5p .g-pn .n{flex:1;min-width:76px;text-align:center;position:relative;font-size:11px;color:#5B6B7F;line-height:1.25}
.gs5p .g-pn .n:before{content:"";position:absolute;top:20px;left:-50%;width:100%;height:3px;background:#DDE3EA;z-index:0}.gs5p .g-pn .n:first-child:before{display:none}
.gs5p .g-pn .c{position:relative;z-index:1;width:40px;height:40px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;background:#E8EDF3;border:2px solid #DDE3EA;font-size:16px}
.gs5p .g-pn .cur .c{background:#0B1F3A;border-color:#0B1F3A;box-shadow:0 0 0 4px #fff,0 0 0 7px #C9A227}.gs5p .g-pn .cur{color:#0B1F3A;font-weight:700}
.gs5p .g-pn .done .c{background:#C9A227;color:#0B1F3A}
.gs5p .g-pn .gate .c{border-color:#C9A227}
.gs5p .g-cpbar{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#0B1F3A;color:#fff;border-radius:10px;padding:10px 14px;margin-top:10px;font-size:16px}.gs5p .g-cpbar b{color:#C9A227}
.gs5p .g-note{background:#FFF8E1;border-left:4px solid #C9A227;padding:8px 12px;font-size:13px;border-radius:6px;margin-bottom:12px;line-height:1.35}
.gs5p .g-bars{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:10px 0}
.gs5p .g-bud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0}.gs5p .g-bud>div{background:#F5F7FA;border:1px solid #DDE3EA;border-radius:8px;padding:8px}
.gs5p .g-bud dt{font-size:11px;color:#5B6B7F}.gs5p .g-bud dd{margin:0 0 8px}
.gs5p .g-req{border:1px solid #DDE3EA;border-radius:10px;margin-bottom:10px;overflow:visible;background:#fff}
.gs5p .g-req.child{margin-left:44px;border-left:3px solid #C9A227}
.gs5p .g-req.drag{box-shadow:0 8px 20px rgba(11,31,58,.25);transform:rotate(-1deg);border:2px solid #C9A227;opacity:.95}
.gs5p .g-req.combine{outline:2px dashed #C9A227;outline-offset:2px}
.gs5p .g-tk{display:flex;align-items:center;gap:12px;padding:10px 12px;min-height:52px;background:transparent;border-radius:10px}
.gs5p .g-tk input[type=checkbox]{width:20px;height:20px;min-height:20px;flex:0 0 20px;accent-color:#0B1F3A;margin:0}
.gs5p .g-tk .tx{flex:1;line-height:1.3}
.gs5p .g-tk .tx.done{text-decoration:line-through;color:#5B6B7F}
.gs5p .g-hd{color:#8A99AB;cursor:grab;font-size:18px;letter-spacing:-3px;min-width:24px;user-select:none}
.gs5p .g-clip{border:1px solid #DDE3EA;background:#fff;border-radius:999px;padding:6px 12px;font-size:13px;min-height:36px;height:36px;white-space:nowrap;cursor:pointer;color:#0B1F3A}
.gs5p .g-clip.has{background:#0B1F3A;color:#C9A227;font-weight:700}
.gs5p .g-files{background:#F9F6EA;border-top:1px solid #E9DDB0;padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-radius:0 0 10px 10px}
.gs5p .g-files .lbl{font-weight:700;font-size:13px;margin-right:4px}.gs5p .g-files button.g-btn{min-height:40px;font-size:13px}
.gs5p .g-ptabs{display:flex;flex-wrap:nowrap;gap:2px;border-bottom:1px solid #DDE3EA;margin:12px 0;overflow-x:auto}
.gs5p .g-ptabs button{background:none;border:0;border-bottom:3px solid transparent;border-radius:0;padding:10px 18px;font:inherit;font-size:14px;color:#5B6B7F;white-space:nowrap;min-height:44px;cursor:pointer}
.gs5p .g-ptabs button.on{color:#0B1F3A;font-weight:700;border-bottom-color:#C9A227}
.gs5p .g-frames{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.gs5p .g-frame{border:2px dashed #C9A227;border-radius:12px;padding:12px;background:#fff;min-width:0}.gs5p .g-frame h4{margin:0 0 6px;font-size:13px;line-height:1.3;color:#9A6700;font-weight:700}
.gs5p .g-frame .g-bud{grid-template-columns:1fr 1fr}
.gs5p .g-nt{border-bottom:1px solid #DDE3EA;padding:8px 0;font-size:13px;line-height:1.35;word-break:break-word}
.gs5p .g-rb{display:block;background:none;border:0;color:#16335C;font:inherit;font-weight:600;font-size:13px;min-height:36px;padding:0;cursor:pointer}
.gs5p .g-addrow{display:flex;gap:8px;margin:10px 0}
.gs5p .g-addrow button.g-btn{white-space:nowrap}
.gs5p .g-edit{display:flex;gap:6px;flex:1}
@media(max-width:767px){
 .gs5p .g-bars,.gs5p .g-bud{grid-template-columns:1fr 1fr}
 .gs5p .g-form,.gs5p .g-frames{grid-template-columns:1fr}
 .gs5p .g-tk{flex-wrap:wrap;gap:8px 10px}
 .gs5p .g-tk .tx{flex:1 1 calc(100% - 80px)}
 .gs5p .g-tk .g-clip{margin-left:70px}
 .gs5p .g-req.child .g-tk .g-clip{margin-left:auto}
 .gs5p .g-req.child{margin-left:22px}
 .gs5p .g-sub span{display:none}
 .gs5p .g-tk input[type=checkbox]{width:24px;height:24px;min-height:24px;flex-basis:24px}
 .gs5p .g-ptabs button{padding:10px 12px}
}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p{color:#E9EFF9}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-card{background:#0F2340;border-color:rgba(148,178,226,.16);box-shadow:0 10px 30px -12px rgba(0,0,0,.55)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-muted,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bud dt,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu small,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .mh{color:#8193B0}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-foot,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-nt,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ptabs{border-color:rgba(148,178,226,.16)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-miss{color:#F5B544}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-miss b{background:rgba(245,181,68,.14);border-color:rgba(212,165,55,.55)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-badge{background:rgba(148,178,226,.14);color:#B7C4DA}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-badge.gold{background:#D4A537;color:#1A1203}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p button.g-btn{background:#16335C;border-color:rgba(148,178,226,.28);color:#fff}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p button.g-btn.o{background:transparent;color:#E9EFF9;border-color:rgba(148,178,226,.28)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p button.g-btn.goldb{background:#D4A537;color:#1A1203;border-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bar{background:rgba(148,178,226,.14)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bar i{background:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bar.empty{background:repeating-linear-gradient(45deg,rgba(148,178,226,.16) 0 6px,transparent 6px 12px)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ph.open{border-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ph.cur{box-shadow:0 0 0 4px rgba(212,165,55,.12),0 0 40px -14px rgba(212,165,55,.6)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p input.g-in,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p select.g-in,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p textarea.g-in{background:rgba(255,255,255,.04);border-color:rgba(148,178,226,.22);color:#E9EFF9}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p input.g-in:disabled{background:rgba(255,255,255,.02)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p select.g-in option{background:#0F2340}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-dots,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-sub,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-clip{background:rgba(255,255,255,.04);border-color:rgba(148,178,226,.22);color:#E9EFF9}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-dots.on{background:rgba(212,165,55,.16);border-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-clip.has{background:#0B1F3A;color:#D4A537;border-color:rgba(212,165,55,.45)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu{background:#102442;border-color:rgba(148,178,226,.2);color:#E9EFF9;box-shadow:0 10px 30px rgba(0,0,0,.5)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .mi:hover:not(:disabled){background:rgba(255,255,255,.06)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .mi:disabled{color:#56698A}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu .red{color:#FF6B6B}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-menu hr{border-color:rgba(148,178,226,.16)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .n{color:#8193B0}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .n:before{background:rgba(148,178,226,.2)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .c{background:rgba(148,178,226,.12);border-color:rgba(148,178,226,.22)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .cur{color:#E9EFF9}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .cur .c{background:#0B1F3A;border-color:#0B1F3A;box-shadow:0 0 0 4px #0F2340,0 0 0 7px #D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-pn .done .c{background:#D4A537;color:#1A1203}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-cpbar{background:#0B1F3A;border:1px solid rgba(212,165,55,.3)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-cpbar b{color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-note{background:rgba(212,165,55,.10);border-left-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-bud>div{background:rgba(255,255,255,.03);border-color:rgba(148,178,226,.16)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-req{background:rgba(255,255,255,.02);border-color:rgba(148,178,226,.18)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-req.child{border-left-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-files{background:rgba(212,165,55,.08);border-top-color:rgba(212,165,55,.25)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-tk input[type=checkbox]{accent-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ptabs button{color:#8193B0}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-ptabs button.on{color:#E9EFF9;border-bottom-color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-frame{background:transparent;border-color:rgba(212,165,55,.55)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-frame h4{color:#D4A537}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-rb{color:#B7C4DA}

.gs5-menu{background:#fff;border:1px solid #DDE3EA;border-radius:10px;box-shadow:0 10px 24px rgba(11,31,58,.2);min-width:220px;padding:6px;font-size:13px;color:#0B1F3A;z-index:60}
.gs5-menu [role=menuitem]{display:block;padding:9px 10px;border-radius:6px;min-height:36px;font-size:13px;line-height:1.2;cursor:pointer}
.gs5-menu [role=menuitem]:hover,.gs5-menu [role=menuitem][data-highlighted]{background:#F5F7FA}
.gs5-menu [role=menuitem][data-disabled]{color:#A0AAB8;opacity:1;pointer-events:none}
.gs5-menu small{display:block;color:#5B6B7F;font-size:11px}
.gs5-menu .mh{font-weight:700;color:#5B6B7F;font-size:11px;padding:9px 10px}
.gs5-menu .red{color:#B42318;font-weight:600}.gs5-menu .hr{border-top:1px solid #DDE3EA;margin:4px 0}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu{background:#102442;border-color:rgba(148,178,226,.2);color:#E9EFF9;box-shadow:0 10px 30px rgba(0,0,0,.5)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu [role=menuitem]:hover,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu [role=menuitem][data-highlighted]{background:rgba(255,255,255,.06)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu [role=menuitem][data-disabled]{color:#56698A}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu small,:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu .mh{color:#8193B0}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu .red{color:#FF6B6B}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5-menu .hr{border-color:rgba(148,178,226,.16)}

.gs5p .g-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 10px;flex-wrap:wrap}
.gs5p .g-hdr-r{display:inline-flex;gap:6px;align-items:center;flex-shrink:0}
.gs5p .g-ph:not(.open){cursor:pointer}
.gs5p .g-tablist{display:flex!important;background:none!important;border-bottom:1px solid #DDE3EA;border-radius:0!important;padding:0!important;height:auto!important;gap:2px;justify-content:flex-start!important;overflow-x:auto;width:100%;margin-top:12px}
.gs5p .g-tablist [role=tab]{background:none!important;box-shadow:none!important;border-radius:0!important;border-bottom:3px solid transparent;padding:10px 18px!important;font-size:14px!important;color:#5B6B7F;min-height:44px!important;font-weight:500}
.gs5p .g-tablist [role=tab][data-state=active]{color:#0B1F3A;font-weight:700;border-bottom-color:#C9A227}
.gs5p .g-sublist{min-height:8px}.gs5p .g-sublist.over{background:#FFF8E1;border-radius:8px}
.gs5p .g-foot{margin-top:8px}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-tablist{border-color:rgba(148,178,226,.16)}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-tablist [role=tab]{color:#8193B0}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-tablist [role=tab][data-state=active]{color:#E9EFF9}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-sublist.over{background:rgba(201,162,39,.12)}

.gs5p .g-grp{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5B6B7F;align-self:center;padding:0 6px 0 2px;white-space:nowrap}
.gs5p .g-grp.sep{margin-left:10px;padding-left:12px;border-left:1px solid #DDE3EA}
.gs5p .t-task{--ac:#2F6FDE}.gs5p .t-file{--ac:#0E9384}.gs5p .t-note{--ac:#7A5AF8}.gs5p .t-bud{--ac:#B7791F}
.gs5p .g-ptabs{align-items:center}.gs5p .g-ptabs button::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--ac,#5B6B7F);margin-right:7px}
.gs5p .g-tablist [role=tab]::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--ac);margin-right:7px}
.gs5p .g-tablist [role=tab][data-state=active]{border-bottom-color:var(--ac)!important;color:var(--ac)!important}
.gs5p .g-pane{border-left:3px solid var(--ac);padding-left:10px}
.gs5p .g-tedit{gap:8px;align-items:center;flex-wrap:wrap}.gs5p .g-tedit label{display:inline-flex;gap:6px;align-items:center;white-space:nowrap}.gs5p .g-tedit input.g-in{flex:1 1 220px;width:auto}.gs5p .g-tedit select.g-in{width:140px}
.gs5p .g-emo{display:flex;align-items:center}
.gs5p .neg{color:#B42318}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .t-task{--ac:#6EA0FF}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .t-file{--ac:#3CCBB4}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .t-note{--ac:#A992FF}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .t-bud{--ac:#E2B93B}
:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-grp{color:#8193B0}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .g-grp.sep{border-color:rgba(148,178,226,.16)}:is(html.dark,html.theme-dark,html[data-theme=dark]):not(.theme-light):not(.light) .gs5p .neg{color:#FF6B6B}
`;
