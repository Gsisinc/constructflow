import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Flag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Kemar's DualTrack: 12 stages, 3 phases, Field + Money tracks
const STAGE_TEMPLATE = [
  { phase: 'proposal_handoff', stages: [
    { n: 1, name: 'Bid Intake & Qualification', gate: 'Bid reviewed and go/no-go decided' },
    { n: 2, name: 'Estimate & Pricing', gate: 'Estimate built and margin approved' },
    { n: 3, name: 'Proposal & Contract', gate: 'Proposal submitted and contract signed' },
    { n: 4, name: 'Handoff to Project', gate: 'Estimating handed off to PM; kickoff scheduled' },
  ]},
  { phase: 'engineering', stages: [
    { n: 5, name: 'Design & Shop Drawings', gate: 'Drawings approved for fabrication' },
    { n: 6, name: 'Submittals', gate: 'All submittals approved' },
    { n: 7, name: 'RFI Resolution', gate: 'Open RFIs resolved or closed' },
    { n: 8, name: 'Pre-Construction & Mobilization', gate: 'Site ready; materials & crew mobilized' },
  ]},
  { phase: 'execution', stages: [
    { n: 9, name: 'Installation & Field Work', gate: 'Installation complete per approved drawings' },
    { n: 10, name: 'Testing & Commissioning', gate: 'System tested and commissioned' },
    { n: 11, name: 'Closeout', gate: 'As-builts, test reports, photos, warranty, training sign-off complete' },
    { n: 12, name: 'Handoff to Billing', gate: 'Closeout package handed to Billing' },
  ]},
];
const PHASE_LABEL = { proposal_handoff: 'Proposal & Handoff', engineering: 'Engineering', execution: 'Execution' };
const TRACKS = ['not_started', 'in_progress', 'passed', 'blocked'];
const trackColor = { not_started: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700', passed: 'bg-green-100 text-green-700', blocked: 'bg-red-100 text-red-700' };
const safe = (n) => (Number.isFinite(n) ? n : 0);

export default function DualTrackTracker({ projectId, project }) {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['dualtrack-stages', projectId],
    queryFn: async () => (await base44.entities.DualTrackStage.filter({ project_id: projectId }, { sort: 'stage_number', limit: 50 }))?.items || [],
    enabled: !!projectId,
  });

  // Seed the 12 default stages if none exist
  useEffect(() => {
    if (isLoading || stages.length > 0 || seeding || !projectId) return;
    setSeeding(true);
    (async () => {
      try {
        const records = STAGE_TEMPLATE.flatMap(ph => ph.stages.map(s => ({
          project_id: projectId,
          organization_id: project?.organization_id,
          phase: ph.phase,
          stage_number: s.n,
          stage_name: s.name,
          gate_criteria: s.gate,
          field_track_status: 'not_started',
          money_track_status: 'not_started',
          exit_gate_passed: false,
          budget: 0, committed: 0, actual: 0, cost_to_complete: 0,
        })));
        await base44.entities.DualTrackStage.bulkCreate(records);
        qc.invalidateQueries({ queryKey: ['dualtrack-stages', projectId] });
      } catch (e) { console.error('seed fail', e); }
      setSeeding(false);
    })();
  }, [isLoading, stages.length, projectId, seeding]);

  const updateStage = async (id, patch) => {
    try { await base44.entities.DualTrackStage.update(id, patch); qc.invalidateQueries({ queryKey: ['dualtrack-stages', projectId] }); }
    catch (e) { toast.error('Update failed'); }
  };

  // Project-level rollups
  const redFlags = useMemo(() => stages.filter(s => {
    const remaining = safe(s.budget) - safe(s.actual) - safe(s.committed);
    const fade = safe(s.cost_to_complete) - remaining;
    return fade > 0 || s.field_track_status === 'blocked' || s.money_track_status === 'blocked';
  }), [stages]);
  const clearedStages = stages.filter(s => s.exit_gate_passed).length;

  return (
    <div className="space-y-6">
      {/* Rollup header */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">DualTrack Tracker</h2>
              <p className="text-sm text-slate-500">Field Track + Money Track · a stage clears only when both tracks pass its gate</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center"><p className="text-2xl font-bold text-slate-900">{clearedStages}/12</p><p className="text-xs text-slate-500">Stages Cleared</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-red-600 flex items-center gap-1 justify-center"><Flag className="h-5 w-5" />{redFlags.length}</p><p className="text-xs text-slate-500">Red Flags</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading || seeding ? (
        <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        STAGE_TEMPLATE.map((ph) => (
          <div key={ph.phase}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{PHASE_LABEL[ph.phase]}</h3>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {ph.stages.map((tmpl) => {
                const s = stages.find(x => x.stage_number === tmpl.n);
                if (!s) return null;
                return <StageCard key={tmpl.n} stage={s} onUpdate={updateStage} />;
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StageCard({ stage, onUpdate }) {
  const remaining = safe(stage.budget) - safe(stage.actual) - safe(stage.committed);
  const fade = safe(stage.cost_to_complete) - remaining;
  const blocked = stage.field_track_status === 'blocked' || stage.money_track_status === 'blocked';
  const redFlag = fade > 0 || blocked;
  const gatePassed = stage.field_track_status === 'passed' && stage.money_track_status === 'passed';

  return (
    <Card className={redFlag ? 'border-red-300 bg-red-50/30' : gatePassed ? 'border-green-300' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-bold">{stage.stage_number}</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{stage.stage_name}</p>
              <p className="text-xs text-slate-500">Gate: {stage.gate_criteria}</p>
            </div>
          </div>
          {gatePassed ? <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Cleared</Badge>
            : redFlag ? <Badge className="bg-red-100 text-red-700"><Flag className="h-3 w-3 mr-1" />Red Flag</Badge>
            : <Badge variant="secondary">In Progress</Badge>}
        </div>

        {/* Tracks */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <TrackSelect label="Field Track" value={stage.field_track_status} onChange={(v) => onUpdate(stage.id, { field_track_status: v, exit_gate_passed: v === 'passed' && stage.money_track_status === 'passed' })} />
          <TrackSelect label="Money Track" value={stage.money_track_status} onChange={(v) => onUpdate(stage.id, { money_track_status: v, exit_gate_passed: v === 'passed' && stage.field_track_status === 'passed' })} />
        </div>

        {/* Money inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <MoneyInput label="Budget" value={stage.budget} onChange={(v) => onUpdate(stage.id, { budget: v })} />
          <MoneyInput label="Committed" value={stage.committed} onChange={(v) => onUpdate(stage.id, { committed: v })} />
          <MoneyInput label="Actual" value={stage.actual} onChange={(v) => onUpdate(stage.id, { actual: v })} />
          <MoneyInput label="Cost to Complete" value={stage.cost_to_complete} onChange={(v) => onUpdate(stage.id, { cost_to_complete: v })} />
        </div>

        {/* Computed */}
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div className="bg-slate-50 rounded p-2">
            <p className="text-slate-500">Remaining = Budget − Actual − Committed</p>
            <p className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-slate-900'}`}>${remaining.toLocaleString()}</p>
          </div>
          <div className={`rounded p-2 ${fade > 0 ? 'bg-red-100' : 'bg-slate-50'}`}>
            <p className="text-slate-500">Fade = Cost to Complete − Remaining</p>
            <p className={`font-bold ${fade > 0 ? 'text-red-700' : 'text-slate-900'}`}>{fade > 0 ? <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />${fade.toLocaleString()}</span> : `$${fade.toLocaleString()}`}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrackSelect({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs text-slate-500">{label}</Label>
      <select className={`w-full border rounded p-1.5 text-xs font-medium mt-0.5 ${trackColor[value]}`} value={value} onChange={(e) => onChange(e.target.value)}>
        {TRACKS.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
      </select>
    </div>
  );
}

function MoneyInput({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs text-slate-500">{label}</Label>
      <Input type="number" className="h-8 text-sm mt-0.5" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)} />
    </div>
  );
}