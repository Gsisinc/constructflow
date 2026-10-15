import { getPhaseTemplate } from '@/components/projects/projectTemplates';

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

  const project = await base44Client.entities.Project.create({
    organization_id: organizationId,
    name: bid.title || bid.project_name || 'Converted Project',
    client_name: bid.client_name || bid.agency || '',
    client_email: bid.client_email || '',
    project_type: projectType,
    address: bid.location || '',
    budget: bid.estimated_value || 0,
    description: bid.scope_of_work || bid.description || '',
    status: 'awarded',
    current_phase: 'preconstruction',
    start_date: today,
    end_date: bid.due_date || '',
    project_manager: bid.owner_name || '',
    linked_bid_id: bid.id,
  });

  // Seed default phases + requirements for this project type (same as New Project)
  const tpl = getPhaseTemplate(projectType);
  const customPhases = tpl.map((phase, idx) => ({
    project_id: project.id,
    phase_name: phase.phase,
    display_name: phase.phase,
    order: idx,
    status: 'pending',
  }));
  if (customPhases.length) await base44Client.entities.CustomPhase.bulkCreate(customPhases);

  const reqs = [];
  tpl.forEach((phase) => (phase.items || []).forEach((item) => {
    if (item && item.trim()) reqs.push({ project_id: project.id, phase_name: phase.phase, requirement_text: item.trim(), status: 'pending' });
  }));
  if (reqs.length) await base44Client.entities.PhaseRequirement.bulkCreate(reqs);

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