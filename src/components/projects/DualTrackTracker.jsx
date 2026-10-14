import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Flag, CheckCircle2, AlertTriangle, Eye, Plus, X, Lock } from 'lucide-react';
import { toast } from 'sonner';

// ─── D1 (OPEN DECISION — FLAG TO OWNER) ───────────────────────────────────
// 12 stages / 3 phases (GSIS Field Manual) vs 13 stages / 4 phases (DualTrack spec).
// Currently configured as Phase A = stages 1-2, Phase B = 3-6, Phase C = 7-12.
// Edit DUALTRACK_PHASES below to change grouping (no entity/schema change needed).
const STAGE_DEFS = [
  { n: 1, name: 'Bid Intake & Qualification', gate: 'Bid reviewed and go/no-go decided' },
  { n: 2, name: 'Estimate & Pricing', gate: 'Estimate built and margin approved' },
  { n: 3, name: 'Proposal & Contract', gate: 'Proposal submitted and contract signed' },
  { n: 4, name: 'Handoff to Project', gate: 'Estimating handed off to PM; kickoff scheduled' },
  { n: 5, name: 'Design & Shop Drawings', gate: 'Drawings approved for fabrication' },
  { n: 6, name: 'Submittals', gate: 'All submittals approved' },
  { n: 7, name: 'RFI Resolution', gate: 'Open RFIs resolved or closed' },
  { n: 8, name: 'Pre-Construction & Mobilization', gate: 'Site ready; materials & crew mobilized' },
  { n: 9, name: 'Installation & Field Work', gate: 'Installation complete per approved drawings' },
  { n: 10, name: 'Testing & Commissioning', gate: 'System tested and commissioned' },
  { n: 11, name: 'Closeout', gate: 'As-builts, test reports, photos, warranty, training sign-off complete' },
  { n: 12, name: 'Handoff to Billing', gate: 'Closeout package handed to Billing' },
];

const DUALTRACK_PHASES = [
  { key: 'phase_a', label: 'Phase A (Stages 1-2)', stages: [1, 2] },
  { key: 'phase_b', label: 'Phase B (Stages 3-6)', stages: [3, 4, 5, 6] },
  { key: 'phase_c', label: 'Phase C (Stages 7-12)', stages: [7, 8, 9, 10, 11, 12] },
];

const phaseKeyForStage = (n) => DUALTRACK_PHASES.find((p) => p.stages.includes(n))?.key || 'phase_c';

const safe = (n) => (Number.isFinite(n) ? n : 0);
const trackPass = (items) => Array.isArray(items) && items.length > 0 && items.every((i) => i.completed);
const trackStatus = (items, blocked) => {
  if (blocked) return 'blocked';
  if (!items || items.length === 0) return 'not_started';
  if (items.every((i) => i.completed)) return 'passed';
  return 'in_progress';
};

export default function DualTrackTracker({ projectId, project }) {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['dualtrack-stages', projectId],
    queryFn: async () => (await base44.entities.DualTrackStage.filter({ project_id: projectId }, { sort: 'stage_number', limit: 50 }))?.items || [],
    enabled: !!projectId,
  });

  // Seed the 12 default stages if none exist. Each track starts with one
  // action item seeded from the stage's exit-gate criteria.
  useEffect(() => {
    if (isLoading || stages.length > 0 || seeding || !projectId) return;
    setSeeding(true);
    (async () => {
      try {
        const records = STAGE_DEFS.map((s) => ({
          project_id: projectId,
          organization_id: project?.organization_id,
          phase: phaseKeyForStage(s.n),
          stage_number: s.n,
          stage_name: s.name,
          gate_criteria: s.gate,
          field_track_status: 'not_started',
          money_track_status: 'not_started',
          field_track_items: [{ text: s.gate, completed: false }],
          money_track_items: [{ text: s.gate, completed: false }],
          exit_gate_passed: false,
          budget: 0, committed: 0, actual: 0, cost_to_complete: 0,
        }));
        await base44.entities.DualTrackStage.bulkCreate(records);
        qc.invalidateQueries({ queryKey: ['dualtrack-stages', projectId] });
      } catch (e) {
        console.error('seed fail', e);
        toast.error('Failed to seed tracker stages');
      }
      setSeeding(false);
    })();
  }, [isLoading, stages.length, projectId, seeding]);

  const updateStage = async (id, patch) => {
    try {
      await base44.entities.DualTrackStage.update(id, patch);
      qc.invalidateQueries({ queryKey: ['dualtrack-stages', projectId] });
    } catch (e) {
      toast.error('Update failed: ' + (e.message || ''));
    }
  };

  const redFlags = useMemo(() => stages.filter((s) => {
    const remaining = safe(s.budget) - safe(s.actual) - safe(s.committed);
    const fade = safe(s.cost_to_complete) - remaining;
    return fade > 0 || s.field_track_status === 'blocked' || s.money_track_status === 'blocked';
  }), [stages]);
  const clearedStages = stages.filter((s) => s.exit_gate_passed).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">DualTrack Tracker</h2>
              <p className="text-sm text-slate-500">A stage clears only when both its Field Track and Money Track action items are complete.</p>
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
        DUALTRACK_PHASES.map((ph) => (
          <div key={ph.key}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{ph.label}</h3>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {ph.stages.map((n) => {
                const tmpl = STAGE_DEFS.find((s) => s.n === n);
                const s = stages.find((x) => x.stage_number === n);
                if (!s || !tmpl) return null;
                return <StageCard key={n} stage={s} gate={tmpl.gate} onUpdate={updateStage} />;
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StageCard({ stage, gate, onUpdate }) {
  const remaining = safe(stage.budget) - safe(stage.actual) - safe(stage.committed);
  const fade = safe(stage.cost_to_complete) - remaining;
  const blocked = stage.field_track_status === 'blocked' || stage.money_track_status === 'blocked';
  const fieldItems = stage.field_track_items || [];
  const moneyItems = stage.money_track_items || [];
  const fieldPassed = trackPass(fieldItems);
  const moneyPassed = trackPass(moneyItems);
  const gatePassed = fieldPassed && moneyPassed;
  const redFlag = fade > 0 || blocked;
  const watch = !gatePassed && !redFlag && (fieldPassed !== moneyPassed);

  const incomplete = [
    ...fieldItems.filter((i) => !i.completed).map((i) => `Field: ${i.text || gate}`),
    ...moneyItems.filter((i) => !i.completed).map((i) => `Money: ${i.text || gate}`),
  ];

  const toggleItem = (track, idx) => {
    const items = (track === 'field' ? fieldItems : moneyItems).map((it, i) =>
      i === idx ? { ...it, completed: !it.completed } : it
    );
    const passed = trackPass(items);
    const patch =
      track === 'field'
        ? { field_track_items: items, field_track_status: trackStatus(items, false) }
        : { money_track_items: items, money_track_status: trackStatus(items, false) };
    const otherPassed = track === 'field' ? moneyPassed : fieldPassed;
    patch.exit_gate_passed = passed && otherPassed;
    onUpdate(stage.id, patch);
  };

  const addItem = (track, text) => {
    if (!text.trim()) return;
    const items = [...(track === 'field' ? fieldItems : moneyItems), { text: text.trim(), completed: false }];
    const patch = track === 'field'
      ? { field_track_items: items, field_track_status: trackStatus(items, false) }
      : { money_track_items: items, money_track_status: trackStatus(items, false) };
    onUpdate(stage.id, patch);
  };

  const removeItem = (track, idx) => {
    const items = (track === 'field' ? fieldItems : moneyItems).filter((_, i) => i !== idx);
    const passed = trackPass(items);
    const patch =
      track === 'field'
        ? { field_track_items: items, field_track_status: trackStatus(items, false) }
        : { money_track_items: items, money_track_status: trackStatus(items, false) };
    const otherPassed = track === 'field' ? moneyPassed : fieldPassed;
    patch.exit_gate_passed = passed && otherPassed;
    onUpdate(stage.id, patch);
  };

  const cardTone = redFlag ? 'border-red-300 bg-red-50/30' : watch ? 'border-amber-300 bg-amber-50/20' : gatePassed ? 'border-green-300' : '';
  const statusBadge = gatePassed
    ? <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Cleared</Badge>
    : redFlag
    ? <Badge className="bg-red-100 text-red-700"><Flag className="h-3 w-3 mr-1" />Red Flag</Badge>
    : watch
    ? <Badge className="bg-amber-100 text-amber-700"><Eye className="h-3 w-3 mr-1" />Watch</Badge>
    : <Badge variant="secondary">In Progress</Badge>;

  return (
    <Card className={cardTone}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-bold">{stage.stage_number}</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{stage.stage_name}</p>
              <p className="text-xs text-slate-500">Gate: {stage.gate_criteria || gate}</p>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Action items per track */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <TrackItems label="Field Track" items={fieldItems} onToggle={(i) => toggleItem('field', i)} onAdd={(t) => addItem('field', t)} onRemove={(i) => removeItem('field', i)} passed={fieldPassed} />
          <TrackItems label="Money Track" items={moneyItems} onToggle={(i) => toggleItem('money', i)} onAdd={(t) => addItem('money', t)} onRemove={(i) => removeItem('money', i)} passed={moneyPassed} />
        </div>

        {/* Blocking */}
        {!gatePassed && incomplete.length > 0 && (
          <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-2">
            <p className="text-xs font-semibold text-amber-800 flex items-center gap-1"><Lock className="h-3 w-3" />Blocking close:</p>
            <ul className="mt-1 ml-4 list-disc text-xs text-amber-700 space-y-0.5">
              {incomplete.slice(0, 5).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

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

function TrackItems({ label, items, onToggle, onAdd, onRemove, passed }) {
  const [draft, setDraft] = useState('');
  return (
    <div className={`rounded-md border p-2 ${passed ? 'border-green-200 bg-green-50/40' : 'border-slate-200 bg-slate-50/60'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs font-semibold text-slate-600">{label}</Label>
        {passed && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
      </div>
      <div className="space-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <input type="checkbox" checked={!!it.completed} onChange={() => onToggle(i)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gold-500 focus:ring-gold-500" />
            <span className={`text-xs flex-1 ${it.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{it.text}</span>
            <button onClick={() => onRemove(i)} className="text-slate-300 hover:text-red-500"><X className="h-3 w-3" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-[11px] text-slate-400">No items — add one below.</p>}
      </div>
      <div className="flex gap-1 mt-1.5">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add action item…" className="h-7 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(draft); setDraft(''); } }} />
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => { onAdd(draft); setDraft(''); }}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function MoneyInput({ label, value, onChange }) {
  const [local, setLocal] = useState(value == null ? '' : String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setLocal(value == null ? '' : String(value)); }, [value, focused]);
  const commit = () => {
    setFocused(false);
    const n = local === '' ? 0 : Number(local);
    onChange(Number.isFinite(n) ? n : 0);
  };
  return (
    <div>
      <Label className="text-xs text-slate-500">{label}</Label>
      <Input
        type="number"
        className="h-8 text-sm mt-0.5"
        value={local}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onChange={(e) => setLocal(e.target.value)}
      />
    </div>
  );
}