// Link bid-stage phases (CustomPhase) and their requirements (PhaseRequirement)
// to the 12 DualTrack stages. A phase maps to a stage by keyword; the phase's
// requirements become that stage's Field Track action items, and the stage
// clears only when ALL its linked requirements are completed — partial
// progress shows as in progress. Stages 1-4 are never blindly auto-cleared:
// they clear only if their own linked bid-stage requirements were all done.
//
// Used by bid->project conversion (bidConversion.js) so carried bid-stage
// progress shows on the project's DualTrack Tracker and agrees with the
// project overview. Also dedupes duplicate stage records (a known double-seed
// artifact) down to exactly one per stage number.

const PHASE_STAGE_KEYWORDS = [
  { stage: 1, keywords: ['intake', 'qualif', 'go/no-go', 'go/no go', 'bid review', 'pre-bid'] },
  { stage: 2, keywords: ['bidding & estimating', 'estimate', 'pricing', 'takeoff', 'take-off', 'quantity', 'bid build'] },
  { stage: 3, keywords: ['proposal', 'contract', 'award', 'negotiat'] },
  { stage: 4, keywords: ['handoff', 'kickoff', 'pre-construction meeting'] },
  { stage: 5, keywords: ['design', 'shop drawing', 'engineering', 'bim'] },
  { stage: 6, keywords: ['submittal', 'cut sheet', 'cut-sheet', 'approval'] },
  { stage: 7, keywords: ['rfi', 'request for information', 'clarification'] },
  { stage: 8, keywords: ['logistics', 'walk-down', 'walkdown', 'walk down', 'mobilization', 'mobilis', 'pre-construction & coord', 'pre-construction & coordination', 'material procurement', 'site access', 'staging', 'pre-con'] },
  { stage: 9, keywords: ['installation', 'rough-in', 'rough in', 'trim-out', 'trim out', 'field work', 'concrete & deck', 'rough-in phase'] },
  { stage: 10, keywords: ['testing', 'commissioning', 'inspection', 'ahj', 'final inspection'] },
  { stage: 11, keywords: ['closeout', 'close out', 'as-built', 'as built', 'training', 'warranty', 'o&m', 'handover'] },
  { stage: 12, keywords: ['billing', 'invoice', 'pay application', 'final invoice', 'lien'] },
];

export function stageForPhase(phaseName) {
  const n = String(phaseName || '').toLowerCase();
  if (!n) return null;
  for (const { stage, keywords } of PHASE_STAGE_KEYWORDS) {
    if (keywords.some((k) => n.includes(k))) return stage;
  }
  return null;
}

const trackStatusFor = (items) => {
  if (!items || items.length === 0) return 'not_started';
  if (items.every((i) => i.completed)) return 'passed';
  return 'in_progress';
};

const doneCount = (s) =>
  ((s.field_track_items || []).filter((i) => i.completed).length) +
  ((s.money_track_items || []).filter((i) => i.completed).length);

// Reconcile a project's DualTrack stages from its carried CustomPhase +
// PhaseRequirement progress:
//   - dedupe duplicate stages to one per stage_number (keep the most progress)
//   - for each phase that maps to a stage, write the phase's requirements into
//     that stage's Field Track; all done -> cleared, partial -> in progress
// Best-effort; never throws (called from conversion + on demand).
export async function reconcileDualTrackFromPhases(base44Client, projectId) {
  if (!projectId) return { reconciled: 0, deduped: 0, reqsDeduped: 0 };

  // Dedupe duplicate PhaseRequirement records first (merge tick state, never
  // delete a completed/ticked record) so the rebuild below sees one per text.
  let reqsDeduped = 0;
  try {
    const r = await dedupePhaseRequirements(base44Client, projectId);
    reqsDeduped = r?.deduped || 0;
  } catch (e) { console.warn('req dedupe failed', e); }

  const phasePage = await base44Client.entities.CustomPhase.filter({ project_id: projectId }, { limit: 200, sort: 'order' });
  const phases = phasePage?.items || phasePage || [];
  const reqPage = await base44Client.entities.PhaseRequirement.filter({ project_id: projectId }, { limit: 1000 });
  const reqs = reqPage?.items || reqPage || [];

  const reqsByPhase = {};
  reqs.forEach((r) => { (reqsByPhase[r.phase_name] = reqsByPhase[r.phase_name] || []).push(r); });

  // Dedupe stages to one per stage_number (keep most progress, tie -> earliest)
  const stagePage = await base44Client.entities.DualTrackStage.filter({ project_id: projectId }, { sort: 'stage_number', limit: 200 });
  const stages = stagePage?.items || stagePage || [];
  const byNum = {};
  stages.forEach((s) => { (byNum[s.stage_number] = byNum[s.stage_number] || []).push(s); });
  let deduped = 0;
  const keepers = {};
  for (const num of Object.keys(byNum)) {
    const arr = byNum[num].slice().sort((a, b) => doneCount(b) - doneCount(a) || (a.created_date || '').localeCompare(b.created_date || ''));
    keepers[num] = arr[0];
    for (let i = 1; i < arr.length; i++) {
      try { await base44Client.entities.DualTrackStage.delete(arr[i].id); deduped++; } catch (e) { console.warn('dedup delete failed', num, e); }
    }
  }

  // Map each phase -> stage. Requirements are deduped by text (a known re-seed
  // artifact creates the same requirement several times); an item is completed
  // if ANY duplicate req is completed OR the stage already had that text ticked
  // (preserves manual ticks made directly in the tracker).
  const stagePatch = {};
  phases.forEach((p) => {
    const stageNum = stageForPhase(p.phase_name);
    if (!stageNum) return;
    const phaseReqs = reqsByPhase[p.phase_name] || [];
    if (!phaseReqs.length) return;
    const acc = stagePatch[stageNum]?.fieldItems
      ? byTextFrom(stagePatch[stageNum].fieldItems)
      : {};
    (keepers[stageNum]?.field_track_items || []).forEach((it) => mergeItem(acc, it.text, !!it.completed));
    phaseReqs.forEach((r) => mergeItem(acc, r.requirement_text, r.status === 'completed'));
    stagePatch[stageNum] = { fieldItems: Object.values(acc) };
  });

  let reconciled = 0;
  for (const num of Object.keys(stagePatch)) {
    const stage = keepers[num];
    if (!stage) continue;
    const { fieldItems } = stagePatch[num];
    const allDone = fieldItems.length > 0 && fieldItems.every((i) => i.completed);
    const fieldStatus = trackStatusFor(fieldItems);
    const patch = {
      field_track_items: fieldItems,
      field_track_status: fieldStatus,
      exit_gate_passed: false,
    };
    if (allDone) {
      // all linked requirements complete -> stage cleared (both tracks pass)
      const moneyItems = (stage.money_track_items && stage.money_track_items.length)
        ? stage.money_track_items.map((i) => ({ ...i, completed: true }))
        : [{ text: stage.gate_criteria || 'Bid-stage gate cleared', completed: true }];
      patch.money_track_items = moneyItems;
      patch.money_track_status = 'passed';
      patch.exit_gate_passed = true;
    }
    try {
      await base44Client.entities.DualTrackStage.update(stage.id, patch);
      reconciled++;
    } catch (e) {
      console.warn('reconcile stage update failed', num, e);
    }
  }

  return { reconciled, deduped, reqsDeduped };
}

// ─── Requirement dedupe + idempotent seeding helpers ────────────────────────
const normText = (t) => (t || '').trim();
const keyFor = (t) => normText(t).toLowerCase();
function mergeItem(acc, text, completed) {
  const key = keyFor(text);
  if (!key) return;
  if (!(key in acc)) acc[key] = { text: normText(text), completed: !!completed };
  else if (completed) acc[key].completed = true;
}
function byTextFrom(items) {
  const acc = {};
  (items || []).forEach((it) => mergeItem(acc, it.text, !!it.completed));
  return acc;
}

// Dedupe duplicate PhaseRequirement records for a project. Per
// (phase_name, requirement_text) group: if any duplicate is completed (ticked),
// keep ALL completed records and delete only the non-completed duplicates; if
// none are completed, keep the earliest and delete the rest. A completed/ticked
// record is never deleted — tick state is preserved.
export async function dedupePhaseRequirements(base44Client, projectId) {
  const page = await base44Client.entities.PhaseRequirement.filter({ project_id: projectId }, { limit: 5000 });
  const reqs = page?.items || page || [];
  const groups = {};
  reqs.forEach((r) => {
    const key = `${r.phase_name || ''}\u0000${(r.requirement_text || '').trim().toLowerCase()}`;
    (groups[key] = groups[key] || []).push(r);
  });
  let deduped = 0;
  for (const key of Object.keys(groups)) {
    const arr = groups[key];
    if (arr.length <= 1) continue;
    const completed = arr.filter((r) => r.status === 'completed');
    if (completed.length >= 1) {
      const keepIds = new Set(completed.map((r) => r.id));
      for (const r of arr) {
        if (keepIds.has(r.id)) continue;
        try { await base44Client.entities.PhaseRequirement.delete(r.id); deduped++; } catch (e) { console.warn('req dedupe delete', e); }
      }
    } else {
      arr.sort((a, b) => (a.created_date || '').localeCompare(b.created_date || ''));
      for (let i = 1; i < arr.length; i++) {
        try { await base44Client.entities.PhaseRequirement.delete(arr[i].id); deduped++; } catch (e) { console.warn('req dedupe delete', e); }
      }
    }
  }
  return { deduped };
}

// Dedupe a stage's field/money track items by text, merging completed state
// (an item stays ticked if ANY duplicate was ticked). Safe to run on any stage;
// never loses a tick.
export async function dedupeStageTrackItems(base44Client, projectId) {
  const page = await base44Client.entities.DualTrackStage.filter({ project_id: projectId }, { limit: 200 });
  const stages = page?.items || page || [];
  let deduped = 0;
  for (const s of stages) {
    const fieldItems = Object.values(byTextFrom(s.field_track_items));
    const moneyItems = Object.values(byTextFrom(s.money_track_items));
    const hadFieldDups = (s.field_track_items?.length || 0) !== fieldItems.length;
    const hadMoneyDups = (s.money_track_items?.length || 0) !== moneyItems.length;
    if (!hadFieldDups && !hadMoneyDups) continue;
    const fieldStatus = trackStatusFor(fieldItems);
    const moneyStatus = trackStatusFor(moneyItems);
    const gate = (fieldItems.length > 0 && moneyItems.length > 0 && fieldItems.every((i) => i.completed) && moneyItems.every((i) => i.completed))
      ? true : !!s.exit_gate_passed;
    const patch = {
      field_track_items: fieldItems,
      money_track_items: moneyItems,
      field_track_status: fieldStatus,
      money_track_status: moneyStatus,
      exit_gate_passed: gate,
    };
    try { await base44Client.entities.DualTrackStage.update(s.id, patch); deduped++; } catch (e) { console.warn('stage track dedupe update', e); }
  }
  return { deduped };
}

// Idempotently seed PhaseRequirements for a project from a phase template. Only
// (phase_name, requirement_text) pairs not already present are created, so
// re-running the seed (or running it after a carry-over) never duplicates.
export async function seedRequirementsIdempotent(base44Client, projectId, templatePhases) {
  const page = await base44Client.entities.PhaseRequirement.filter({ project_id: projectId }, { limit: 5000 });
  const existing = page?.items || page || [];
  const have = new Set(existing.map((r) => `${r.phase_name || ''}\u0000${(r.requirement_text || '').trim().toLowerCase()}`));
  const reqs = [];
  templatePhases.forEach((phase) => {
    const phaseName = phase.phase || phase.phase_name || phase.name || '';
    (phase.items || []).forEach((item) => {
      const text = (typeof item === 'string' ? item : item?.text || '').trim();
      if (!text) return;
      const key = `${phaseName}\u0000${text.toLowerCase()}`;
      if (have.has(key)) return;
      have.add(key);
      const completed = typeof item === 'object' && !!item?.completed;
      reqs.push({ project_id: projectId, phase_name: phaseName, requirement_text: text, status: completed ? 'completed' : 'pending' });
    });
  });
  if (reqs.length) await base44Client.entities.PhaseRequirement.bulkCreate(reqs);
  return { created: reqs.length };
}