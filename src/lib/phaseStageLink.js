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
  if (!projectId) return { reconciled: 0, deduped: 0 };

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

  // Map each phase -> stage, merging requirements when several phases map to one
  const stagePatch = {};
  phases.forEach((p) => {
    const stageNum = stageForPhase(p.phase_name);
    if (!stageNum) return;
    const phaseReqs = reqsByPhase[p.phase_name] || [];
    if (!phaseReqs.length) return;
    const items = phaseReqs.map((r) => ({ text: r.requirement_text, completed: r.status === 'completed' }));
    const allDone = items.every((i) => i.completed);
    const someDone = items.some((i) => i.completed);
    const prev = stagePatch[stageNum];
    const fieldItems = prev ? [...prev.fieldItems, ...items] : items;
    const mergedAll = (prev ? prev.allDone : true) && allDone;
    const mergedSome = (prev ? prev.someDone : false) || someDone;
    stagePatch[stageNum] = { fieldItems, allDone: mergedAll, someDone: mergedSome };
  });

  let reconciled = 0;
  for (const num of Object.keys(stagePatch)) {
    const stage = keepers[num];
    if (!stage) continue;
    const { fieldItems, allDone } = stagePatch[num];
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

  return { reconciled, deduped };
}