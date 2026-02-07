import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bidData, fileUrls } = body;
    const customPhases = bidData.phases || [];

    // Call AI to analyze the documents
    const analysisPrompt = `You are a construction expert. Analyze the following bid opportunity and documents to provide a comprehensive project plan.

Project: ${bidData.project_name}
Agency: ${bidData.agency}
Description: ${bidData.description}
Estimated Value: $${bidData.estimated_value}
Due Date: ${bidData.due_date}

Based on typical ${bidData.agency || 'construction'} projects, provide:
1. A detailed scope of work
2. Estimated project budget breakdown by category (labor, materials, equipment, etc.)
3. Realistic project timeline in days
4. Key project phases and their estimated durations
5. Critical requirements and compliance items
6. Risk factors and contingency recommendations (as % of budget)

Return ONLY valid JSON with this exact structure:
{
  "scope_of_work": "detailed scope",
  "budget_breakdown": {
    "labor": number,
    "materials": number,
    "equipment": number,
    "subcontractors": number,
    "permits": number,
    "overhead": number,
    "other": number
  },
  "total_budget": number,
  "timeline_days": number,
  "contingency_percent": number,
  "phases": [
    {
      "name": "phase name",
      "duration_days": number,
      "description": "phase description",
      "requirements": ["requirement 1", "requirement 2"]
    }
  ],
  "key_requirements": ["requirement 1", "requirement 2"],
  "risk_factors": ["risk 1", "risk 2"]
}`;

    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: false,
      file_urls: fileUrls,
      response_json_schema: {
        type: 'object',
        properties: {
          scope_of_work: { type: 'string' },
          budget_breakdown: {
            type: 'object',
            properties: {
              labor: { type: 'number' },
              materials: { type: 'number' },
              equipment: { type: 'number' },
              subcontractors: { type: 'number' },
              permits: { type: 'number' },
              overhead: { type: 'number' },
              other: { type: 'number' }
            }
          },
          total_budget: { type: 'number' },
          timeline_days: { type: 'number' },
          contingency_percent: { type: 'number' },
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                duration_days: { type: 'number' },
                description: { type: 'string' },
                requirements: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          key_requirements: { type: 'array', items: { type: 'string' } },
          risk_factors: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    // Create the project
    const project = await base44.entities.Project.create({
      name: bidData.project_name,
      client_name: bidData.agency,
      project_type: 'commercial',
      status: 'bidding',
      current_phase: 'preconstruction',
      address: bidData.agency,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + analysisResult.timeline_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: analysisResult.total_budget,
      contingency_percent: analysisResult.contingency_percent,
      description: analysisResult.scope_of_work,
      progress: 0,
      health_status: 'green'
    });

    // Use custom phases if provided, otherwise use AI-generated phases
    const phasesToUse = customPhases.length > 0 ? customPhases : analysisResult.phases;

    // Create phase requirements
    const phaseRequirements = [];
    for (const phase of phasesToUse) {
      const created = await base44.entities.PhaseRequirement.create({
        project_id: project.id,
        phase: phase.name,
        description: phase.description || '',
        requirements: phase.requirements || [],
        estimated_duration_days: phase.duration_days
      });
      phaseRequirements.push(created);
    }

    // Create phase budget
    for (const phase of phasesToUse) {
      await base44.entities.PhaseBudget.create({
        project_id: project.id,
        phase_name: phase.name,
        allocated_budget: (analysisResult.total_budget / phasesToUse.length),
        spent: 0,
        committed: 0
      });
    }

    // Create bid opportunity record
    const bidOpp = await base44.entities.BidOpportunity.create({
      title: bidData.project_name,
      project_name: bidData.project_name,
      agency: bidData.agency,
      url: '',
      project_type: 'commercial',
      description: analysisResult.scope_of_work,
      due_date: bidData.due_date,
      estimated_value: analysisResult.total_budget,
      status: 'analyzing'
    });

    return Response.json({
      projectName: project.name,
      projectId: project.id,
      estimatedBudget: analysisResult.total_budget,
      timeline: analysisResult.timeline_days,
      phases: analysisResult.phases.map(p => p.name),
      scope: analysisResult.scope_of_work,
      requirements: analysisResult.key_requirements,
      risks: analysisResult.risk_factors
    });
  } catch (error) {
    console.error('Error analyzing bid:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});