import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  TrendingUp, TrendingDown, Target, Timer, Package, DollarSign,
  ChevronDown, ChevronRight, CheckCircle2, Circle, ListChecks, Layers, AlarmClock, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtDollars as money } from '@/lib/money';
import { toast } from 'sonner';

const NAVY = '#0B1F3A';
const GOLD = '#C9A227';

const addDays = (dateStr, days) => {
  if (!dateStr) return null;
  const d = new Date(String(dateStr).slice(0, 10) + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const fmtDate = (s) => s ? new Date(String(s).slice(0,10)+'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/* ---------- Animated live countdown to end date ---------- */
function LiveCountdown({ endDate }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const end = useMemo(() => {
    if (!endDate) return null;
    const s = String(endDate).slice(0, 10);
    return new Date(s + 'T23:59:59');
  }, [endDate]);

  if (!end) return null;

  const diff = end.getTime() - now.getTime();
  const past = diff <= 0;
  const total = Math.abs(diff);
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);

  const Unit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -4, opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="text-xl sm:text-2xl font-bold tabular-nums"
        style={{ color: '#fff' }}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {past ? (
        <Badge className="bg-red-500/20 text-red-300 border border-red-400/30">Past due</Badge>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Unit value={days} label="Days" />
          <span className="text-lg" style={{ color: GOLD }}>:</span>
          <Unit value={hours} label="Hrs" />
          <span className="text-lg" style={{ color: GOLD }}>:</span>
          <Unit value={minutes} label="Min" />
          <span className="text-lg" style={{ color: GOLD }}>:</span>
          <Unit value={seconds} label="Sec" />
        </div>
      )}
    </div>
  );
}

/* ---------- Forecast badge (EAC vs budget) ---------- */
function ForecastBadge({ eac, budget }) {
  if (!budget) {
    return <Badge className="bg-slate-100 text-slate-600 border border-slate-200">No budget set</Badge>;
  }
  const variance = (eac || 0) - budget;
  const threshold = Math.abs(budget) * 0.02;
  let tone, Icon, label;
  if (variance > threshold) { tone = 'over'; Icon = TrendingUp; label = 'Over Budget'; }
  else if (variance < -threshold) { tone = 'under'; Icon = TrendingDown; label = 'Under Budget'; }
  else { tone = 'on'; Icon = Target; label = 'On Target'; }

  const map = {
    over: 'bg-red-500/15 text-red-300 border-red-400/30',
    under: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    on: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  };
  return (
    <Badge className={cn('border px-3 py-1.5 text-sm font-semibold gap-1.5', map[tone])}>
      <Icon className="h-4 w-4" />
      {label}
      <span className="opacity-80 font-normal hidden sm:inline">· {money(variance)}</span>
    </Badge>
  );
}

/* ---------- Log Delay dialog ---------- */
function PhaseDelayDialog({ phase, project, onClose }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [cause, setCause] = useState('');
  const [days, setDays] = useState(1);

  const oldEnd = phase?.end_date || null;
  const oldStart = phase?.start_date || null;
  const newEnd = addDays(oldEnd, days);
  const newStart = addDays(oldStart, days);
  const newProjectEnd = project?.end_date ? addDays(project.end_date, days) : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const delay = {
        cause: cause || '—',
        days: Number(days),
        logged_date: new Date().toISOString().slice(0, 10),
        logged_by: user?.email || '—',
        old_end: oldEnd, new_end: newEnd,
        old_start: oldStart, new_start: newStart,
      };
      const delays = [...(phase.delays || []), delay];
      const phasePatch = { delays };
      if (newEnd) phasePatch.end_date = newEnd;
      if (newStart) phasePatch.start_date = newStart;
      await base44.entities.CustomPhase.update(phase.id, phasePatch);
      if (newProjectEnd) {
        await base44.entities.Project.update(project.id, { end_date: newProjectEnd });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customPhases', phase.project_id] });
      qc.invalidateQueries({ queryKey: ['project', phase.project_id] });
      qc.invalidateQueries({ queryKey: ['org-projects'] });
      toast.success(`${days}-day delay logged — phase & project dates shifted`);
      onClose();
    },
    onError: (e) => toast.error('Could not log delay: ' + (e.message || '')),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlarmClock className="h-5 w-5" style={{ color: GOLD }} />
            Log Delay — {phase?.display_name || phase?.phase_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cause</Label>
            <Textarea value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Reason for the delay (weather, RFI, material, etc.)" className="h-20" />
          </div>
          <div>
            <Label>Delay (days)</Label>
            <Input type="number" min="1" value={days} onChange={(e) => setDays(parseInt(e.target.value) || 0)} />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
            <Row label="Phase end" from={oldEnd} to={newEnd} />
            {oldStart && <Row label="Phase start" from={oldStart} to={newStart} />}
            {project?.end_date && <Row label="Project completion" from={project.end_date} to={newProjectEnd} />}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || days <= 0} loading={mutation.isPending}>
            Log Delay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, from, to }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">
        {fmtDate(from)} {to && to !== from && <>→ <span className="text-red-600">{fmtDate(to)}</span></>}
      </span>
    </div>
  );
}

/* ---------- Phases + gates + requirements + delays in one toggleable view ---------- */
function PhasesOverview({ projectId, project, customPhases, phaseGates }) {
  const [open, setOpen] = useState(true);
  const [showGates, setShowGates] = useState(true);
  const [showReqs, setShowReqs] = useState(true);
  const [showDelays, setShowDelays] = useState(true);
  const [delayPhase, setDelayPhase] = useState(null);

  const { data: requirements = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId],
    queryFn: async () => {
      const page = await base44.entities.PhaseRequirement.filter({ project_id: projectId }, { sort: 'phase_name', limit: 500 });
      return page.items || page || [];
    },
    enabled: !!projectId,
  });

  const phases = useMemo(() => {
    return (customPhases || []).map((p) => {
      const reqs = requirements.filter(r => r.phase_name === p.phase_name);
      const doneReqs = reqs.filter(r => r.status === 'completed').length;
      const gates = phaseGates.filter(g => g.from_phase === p.phase_name || g.to_phase === p.phase_name);
      const passedGates = gates.filter(g => g.status === 'approved' || g.status === 'passed').length;
      const pct = reqs.length ? Math.round((doneReqs / reqs.length) * 100) : (p.progress_percent || 0);
      const totalDelay = (p.delays || []).reduce((s, d) => s + (d.days || 0), 0);
      return { ...p, reqs, doneReqs, gates, passedGates, pct, totalDelay };
    });
  }, [customPhases, requirements, phaseGates]);

  if (!phases.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-slate-500 text-sm">
          No phases defined for this project yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100" style={{ background: NAVY }}>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-white font-semibold text-sm">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Layers className="h-4 w-4" style={{ color: GOLD }} />
          Phases, Gates & Requirements
          <span className="text-xs font-normal opacity-70">({phases.length})</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGates(v => !v)} className={cn('text-xs px-2.5 py-1 rounded-full border', showGates ? 'text-white border-white/30' : 'text-white/50 border-white/10')}>Gates</button>
          <button onClick={() => setShowReqs(v => !v)} className={cn('text-xs px-2.5 py-1 rounded-full border', showReqs ? 'text-white border-white/30' : 'text-white/50 border-white/10')}>Requirements</button>
          <button onClick={() => setShowDelays(v => !v)} className={cn('text-xs px-2.5 py-1 rounded-full border', showDelays ? 'text-white border-white/30' : 'text-white/50 border-white/10')}>Delays</button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="divide-y divide-slate-100"
          >
            {phases.map((p) => (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm truncate">{p.display_name || p.phase_name}</p>
                      {p.totalDelay > 0 && (
                        <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] gap-1">
                          <AlarmClock className="h-3 w-3" /> +{p.totalDelay}d delay
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.status || 'pending'}
                      {p.end_date && <> · ends {fmtDate(p.end_date)}</>}
                      {showGates && p.gates.length > 0 && <> · {p.passedGates}/{p.gates.length} gates passed</>}
                      {showReqs && p.reqs.length > 0 && <> · {p.doneReqs}/{p.reqs.length} reqs done</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 sm:w-36">
                      <Progress value={p.pct} className="h-2" />
                      <p className="text-[10px] text-right text-slate-400 mt-0.5 tabular-nums">{p.pct}%</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setDelayPhase(p)} className="h-7 text-xs">
                      <AlarmClock className="h-3.5 w-3.5 mr-1" /> Log Delay
                    </Button>
                  </div>
                </div>

                {showDelays && (p.delays || []).length > 0 && (
                  <div className="mt-2 rounded-lg bg-red-50/40 border border-red-100 p-2 space-y-1">
                    {(p.delays || []).map((d, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                        <Badge className="bg-red-100 text-red-700 text-[10px]">+{d.days}d</Badge>
                        <span className="font-medium text-slate-700">{d.cause}</span>
                        <span className="text-slate-400">· {fmtDate(d.logged_date)} · by {d.logged_by}</span>
                        {d.new_end && <span className="text-slate-400">· new end {fmtDate(d.new_end)}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {showGates && p.gates.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.gates.map(g => (
                      <Badge key={g.id} className={cn('text-[10px] border', g.status === 'approved' || g.status === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                        {g.from_phase} → {g.to_phase}: {g.status || 'review'}
                      </Badge>
                    ))}
                  </div>
                )}

                {showReqs && p.reqs.length > 0 && (
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {p.reqs.map(r => (
                      <li key={r.id} className="flex items-start gap-2 text-xs text-slate-600">
                        {r.status === 'completed'
                          ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: GOLD }} />
                          : <Circle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-300" />}
                        <span className={cn(r.status === 'completed' && 'line-through text-slate-400')}>{r.requirement_text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {delayPhase && (
        <PhaseDelayDialog phase={delayPhase} project={project} onClose={() => setDelayPhase(null)} />
      )}
    </div>
  );
}

/* ---------- Tracking panel: phase progress ---------- */
function PhaseProgressPanel({ customPhases }) {
  const phases = customPhases || [];
  const inProgress = phases.filter(p => p.status === 'in_progress' || p.status === 'active').length;
  const done = phases.filter(p => p.status === 'completed' || p.status === 'done').length;
  const pct = phases.length ? Math.round((done / phases.length) * 100) : 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ListChecks className="h-4 w-4" style={{ color: GOLD }} />
          Logistics / Phase Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{done} of {phases.length} phases complete</span>
            <span className="font-semibold tabular-nums">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 py-2">
            <p className="text-lg font-bold text-slate-900 tabular-nums">{phases.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total</p>
          </div>
          <div className="rounded-lg bg-amber-50 py-2">
            <p className="text-lg font-bold text-amber-700 tabular-nums">{inProgress}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Active</p>
          </div>
          <div className="rounded-lg bg-emerald-50 py-2">
            <p className="text-lg font-bold text-emerald-700 tabular-nums">{done}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Done</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Tracking panel: cost ---------- */
function CostPanel({ project, expenses }) {
  const budget = project?.budget || 0;
  const actual = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const committed = project?.committed_costs || 0;
  const spent = project?.spent || 0;
  const eac = project?.projected_final_cost || (spent + (project?.cost_to_complete || 0));
  const variance = budget ? eac - budget : 0;
  const usedPct = budget ? Math.min(100, Math.round((actual / budget) * 100)) : 0;

  const Row = ({ label, value, accent }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', accent)}>{money(value)}</span>
    </div>
  );
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4" style={{ color: GOLD }} />
          Cost — Budget vs Actual vs Committed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Row label="Budget (contract)" value={budget} accent="text-slate-900" />
        <Row label="Actual (expenses)" value={actual} accent="text-emerald-700" />
        <Row label="Committed" value={committed} accent="text-amber-700" />
        <Row label="Recorded spent" value={spent} accent="text-slate-700" />
        <Row label="EAC" value={eac} accent={variance > 0 ? 'text-red-600' : 'text-emerald-700'} />
        <Row label="Variance" value={variance} accent={variance > 0 ? 'text-red-600' : 'text-emerald-700'} />
        <div className="pt-1">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Expenses vs budget</span>
            <span className="font-semibold tabular-nums">{usedPct}%</span>
          </div>
          <Progress value={usedPct} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Tracking panel: materials ---------- */
function MaterialsPanel({ projectId }) {
  const { data: materials = [] } = useQuery({
    queryKey: ['projectMaterials', projectId],
    queryFn: async () => {
      const page = await base44.entities.ProjectMaterial.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 });
      return page.items || page || [];
    },
    enabled: !!projectId,
  });
  const total = (materials || []).reduce((s, m) => s + (m.quantity || 0) * (m.unit_cost || 0), 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4" style={{ color: GOLD }} />
          Materials Used
          <span className="ml-auto text-xs font-normal text-slate-400">{materials.length} items</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No materials added yet.</p>
        ) : (
          <>
            {(materials || []).map(m => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700 truncate">{m.name}</span>
                <span className="text-slate-500 shrink-0 tabular-nums">{m.quantity} {m.unit}</span>
                <span className="font-semibold text-slate-900 shrink-0 tabular-nums">{money((m.quantity || 0) * (m.unit_cost || 0))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 mt-1 border-t-2 border-slate-200">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-lg tabular-nums" style={{ color: NAVY }}>{money(total)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectDashboard({ project, projectId, customPhases, phaseGates, expenses }) {
  if (!project) return null;
  const eac = project.projected_final_cost || (project.spent || 0) + (project.cost_to_complete || 0);

  return (
    <div className="space-y-4">
      {/* Top: Forecast + Countdown */}
      <div className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: NAVY }}>
        <div className="flex items-center gap-3">
          <Timer className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
          <div>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: GOLD }}>Forecast</p>
            <ForecastBadge eac={eac} budget={project.budget} />
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: GOLD }}>Time to completion</p>
          <LiveCountdown endDate={project.end_date} />
        </div>
      </div>

      {/* Phases / Gates / Requirements / Delays toggleable */}
      <PhasesOverview projectId={projectId} project={project} customPhases={customPhases} phaseGates={phaseGates} />

      {/* Three tracking panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PhaseProgressPanel customPhases={customPhases} />
        <CostPanel project={project} expenses={expenses} />
        <MaterialsPanel projectId={projectId} />
      </div>
    </div>
  );
}