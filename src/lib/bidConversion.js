export const convertBidToProjectFromAI = async ({ base44Client, bid, organizationId, requirements = [] }) => {
  const aiAnalysis = bid.ai_analysis || {};
  const complexityScore = aiAnalysis.complexity_score || 5;
  const riskFactors = aiAnalysis.risk_factors || [];
  const estimatedValue = bid.estimated_value || 0;

  const contingencyPercent = Math.max(10, complexityScore * 1.5);
  const timelineDays = Math.max(30, Math.floor((estimatedValue / 10000) * (complexityScore / 5)) || 30);
  const endDate = new Date(Date.now() + timelineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const project = await base44Client.entities.Project.create({
    organization_id: organizationId,
    name: bid.title || bid.project_name,
    client_name: bid.client_name || bid.agency,
    client_email: bid.client_email,
    project_type: bid.project_type || 'commercial',
    status: 'awarded',
    current_phase: 'preconstruction',
    description: bid.description || bid.scope_of_work,
    budget: estimatedValue,
    contingency_percent: contingencyPercent,
    start_date: new Date().toISOString().split('T')[0],
    end_date: endDate,
    address: bid.location,
    health_status: complexityScore > 7 ? 'yellow' : 'green',
    projected_final_cost: estimatedValue * (1 + contingencyPercent / 100)
  });

  const phases = [
    { name: 'preconstruction', duration: Math.ceil(timelineDays * 0.1) },
    { name: 'foundation', duration: Math.ceil(timelineDays * 0.15) },
    { name: 'superstructure', duration: Math.ceil(timelineDays * 0.25) },
    { name: 'enclosure', duration: Math.ceil(timelineDays * 0.15) },
    { name: 'mep_rough', duration: Math.ceil(timelineDays * 0.15) },
    { name: 'interior_finishes', duration: Math.ceil(timelineDays * 0.15) },
    { name: 'commissioning', duration: Math.ceil(timelineDays * 0.05) }
  ];

  await Promise.all(phases.map((phase) =>
    base44Client.entities.PhaseBudget.create({
      project_id: project.id,
      phase_name: phase.name,
      allocated_budget: estimatedValue / phases.length,
      spent: 0,
      committed: 0
    })
  ));

  if (requirements.length > 0) {
    await Promise.all(requirements
      .filter((req) => req.status !== 'completed')
      .map((req) =>
        base44Client.entities.OperationalTask.create({
          organization_id: organizationId,
          project_id: project.id,
          title: `${req.category}: ${req.requirement_text.substring(0, 50)}`,
          description: req.requirement_text,
          category: req.category === 'technical' ? 'documentation'
            : req.category === 'legal' ? 'compliance'
            : req.category === 'financial' ? 'procurement'
            : 'other',
          priority: req.priority,
          status: 'pending',
          source: 'auto_generated',
          auto_generated_from: 'bid_conversion'
        })
      ));
  }

  if (riskFactors.length > 0) {
    await Promise.all(riskFactors.slice(0, 5).map((risk) =>
      base44Client.entities.Issue.create({
        project_id: project.id,
        title: `Risk: ${risk.substring(0, 50)}`,
        description: risk,
        type: 'other',
        severity: complexityScore > 7 ? 'high' : 'medium',
        status: 'open'
      })
    ));
  }

  await base44Client.entities.BidOpportunity.update(bid.id, { status: 'won' });

  return project;
};
