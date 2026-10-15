import { getPhaseTemplate } from '@/components/projects/projectTemplates';
import { reconcileDualTrackFromPhases, seedRequirementsIdempotent } from '@/lib/phaseStageLink';

// Map a bid division to a Project project_type (mirrors Bids.jsx divisionToProjectType)
const divisionToProjectType = (d) => ({
  fire_alarm: 'fire_alarm_new_construction',
  low_voltage: 'low_voltage_structured_cabling',
  drone: 'other',
  software: 'other',
  other: 'other',
}[d] || 'other');

/**
 * Convert a won bid into a linked Project — the single source of truth used by
 * both the Bids page "Awarded" action and the BidDetail "Convert to Project" button.
 *
 * Copies client, title, value, division/type, owner, location and dates; seeds the
 * default phases for that project type; links the bid → project (linked_project_id)
 * and the project → bid (linked_bid_id). Idempotent: if the bid already has a
 * linked project, returns it without creating a duplicate.
 *
 * @returns {Promise<{ id: string, already_exists: boolean }>}
 */
export async function convertBidToProject({ base44Client, bid, organizationId }) {
  // Idempotent — never create a duplicate project
  if (bid.linked_project_id) {
    return { id: bid.linked_project_id, already_exists: true };
  }

  const projectType = divisionToProjectType(bid.division);
  const today = new Date().toISOString().split('T')[0];

  // Carry labor hours, labor rate and equipment cost over from the bid's
  // linked estimate so the project starts with the estimator's numbers.
  let estimate = null;
  try {
    if (bid.linked_estimate_id) {
      const ests = await base44Client.entities.BidEstimate.filter({ id: bid.linked_estimate_id });
      estimate = ests?.[0] || null;
    }
    // Fallback: the bid's linked_estimate_id is not always set (EstimateEditor
    // doesn't write it), so pull the latest estimate for this bid directly.
    if (!estimate) {
      const page = await base44Client.entities.BidEstimate.filter(
        { bid_opportunity_id: bid.id },
        { sort: '-created_date', limit: 1 }
      );
      estimate = Array.isArray(page) ? page[0] : page?.items?.[0] || null;
    }
  } catch (e) {
    console.warn('estimate carry-over lookup failed', e);
  }

  const project = await base44Client.entities.Project.create({
    organization_id: organizationId,
    name: bid.title || bid.project_name || 'Converted Project',
    client_name: bid.client_name || bid.agency || '',
    client_email: bid.client_email || '',
    project_type: projectType,
    address: bid.location || '',
    budget: Number(estimate?.total_bid_amount) || Number(estimate?.subtotal) || bid.estimated_value || 0, // B14-9 Sales: contract = estimate total
    labor_hours: estimate?.labor_hours || 0,
    labor_rate: estimate?.labor_rate || 0,
    equipment_cost: estimate?.equipment_cost || 0,
    description: bid.scope_of_work || bid.description || '',
    status: 'awarded',
    current_phase: 'preconstruction',
    start_date: today,
    end_date: bid.due_date || '',
    project_manager: bid.owner_name || '',
    linked_bid_id: bid.id,
  });

  // Carry over the bid's phases/stages/gates/requirements/notes/files EXACTLY.
  // While the bid was open, its phase entities were scoped to project_id = bid.id
  // (the PM did the logistics walk-down there). Re-point those same records to the
  // new project id — nothing is recreated, so tick state, notes and files survive.
  const phaseEntities = ['CustomPhase', 'PhaseGate', 'PhaseRequirement', 'PhaseFile', 'PhaseNote', 'DualTrackStage'];
  for (const e of phaseEntities) {
    try {
      await base44Client.entities[e].updateMany({ project_id: bid.id }, { $set: { project_id: project.id } });
    } catch (err) {
      console.warn('phase carry-over failed for', e, err);
    }
  }

  // Fallback: if the bid never opened its phase tabs (no CustomPhase carried over),
  // seed the default template on the project so it always has phases.
  let carriedPhases = 0;
  try {
    const existing = await base44Client.entities.CustomPhase.filter({ project_id: project.id }, { limit: 1 });
    carriedPhases = (existing?.items || existing || []).length;
  } catch {}
  if (carriedPhases === 0) {
    const tpl = getPhaseTemplate(projectType);
    const customPhases = tpl.map((phase, idx) => ({
      project_id: project.id,
      phase_name: phase.phase,
      display_name: phase.phase,
      order: idx,
      status: 'pending',
    }));
    if (customPhases.length) await base44Client.entities.CustomPhase.bulkCreate(customPhases);
    await seedRequirementsIdempotent(base44Client, project.id, tpl);
  }

  // Link the carried bid-stage phases/requirements to the 12 DualTrack stages:
  // a stage whose requirements were all completed at the bid stage is marked
  // cleared; partial progress shows as in progress. Stages 1-4 are NOT blindly
  // auto-cleared — only a stage whose own linked requirements were all done
  // clears. Also dedupes any duplicate stage records. Best-effort.
  try {
    await reconcileDualTrackFromPhases(base44Client, project.id);
  } catch (e) {
    console.warn('dualtrack reconcile failed', e);
  }

  // Hand off bid requirements → project tasks (Sales → PM) and AI risks → issues.
  // Best-effort: the project + phases + link already succeeded, so a failure here
  // must not roll back the conversion.
  try {
    const bidReqs = await base44Client.entities.BidRequirement.filter({ bid_opportunity_id: bid.id });
    const tasks = (bidReqs || [])
      .filter((r) => r.status !== 'completed')
      .map((r) => ({
        organization_id: organizationId,
        project_id: project.id,
        title: `${r.category || 'requirement'}: ${(r.requirement_text || '').substring(0, 50)}`,
        description: r.requirement_text || '',
        category: r.category === 'technical' ? 'documentation'
          : r.category === 'legal' ? 'compliance'
          : r.category === 'financial' ? 'procurement'
          : 'other',
        priority: r.priority || 'medium',
        status: 'pending',
        source: 'auto_generated',
        auto_generated_from: 'bid_conversion',
      }));
    if (tasks.length) await base44Client.entities.OperationalTask.bulkCreate(tasks);

    const risks = ((bid.ai_analysis && bid.ai_analysis.risk_factors) || []).slice(0, 5);
    const issues = risks.map((risk) => ({
      project_id: project.id,
      title: `Risk: ${(risk || '').substring(0, 50)}`,
      description: risk || '',
      type: 'other',
      severity: (bid.ai_analysis && bid.ai_analysis.complexity_score || 0) > 7 ? 'high' : 'medium',
      status: 'open',
    }));
    if (issues.length) await base44Client.entities.Issue.bulkCreate(issues);
  } catch (e) {
    console.warn('bid conversion extras failed', e);
  }

  // Link the bid → project and mark Won
  await base44Client.entities.BidOpportunity.update(bid.id, {
    status: 'won',
    linked_project_id: project.id,
  });

  // Carry drawings over to the project — same records, no re-upload.
  try {
    await base44Client.entities.Drawing.updateMany({ bid_id: bid.id }, { $set: { project_id: project.id } });
  } catch (e) {
    console.warn('drawing carry-over failed', e);
  }

  return { id: project.id, already_exists: false };
}

// Legacy alias kept for older callers (BidToProject component)
export const convertBidToProjectFromAI = convertBidToProject;