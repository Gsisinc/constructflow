import { AGENT_WORKFLOWS, buildAgentSystemPrompt } from '../src/config/agentWorkflows.js';

const scenarios = {
  central_orchestrator: 'Coordinate a 3-week bid submission plan while field operations continue on two active jobs.',
  market_intelligence: 'Find low voltage opportunities in California due in the next 14 days from live sources.',
  bid_package_assembly: 'Convert this RFP into a checklist with required forms and pricing assumptions.',
  proposal_generation: 'Draft a municipal proposal highlighting safety and minimal downtime.',
  regulatory_intelligence: 'List permit checkpoints and compliance risks for a school low-voltage installation.',
  risk_prediction: 'Assess schedule and cost risks for a 12-week project with limited estimator capacity.',
  quality_assurance: 'Build QA checkpoints for installation, labeling, testing, and closeout.',
  safety_compliance: 'Create a hazard and control plan for night-shift conduit work in an occupied hospital.',
  sustainability_optimization: 'Recommend lower-carbon substitutions while preserving budget constraints.',
  stakeholder_communication: 'Draft owner, PM, and field-team updates for a schedule slip situation.'
};

let failed = 0;

for (const [agentId, workflow] of Object.entries(AGENT_WORKFLOWS)) {
  const scenario = scenarios[agentId];
  const prompt = buildAgentSystemPrompt(agentId);

  if (!scenario) {
    failed += 1;
    console.log(`❌ Missing scenario for ${agentId}`);
    continue;
  }

  if (!prompt.includes(workflow.purpose) || !prompt.includes('Execution workflow:')) {
    failed += 1;
    console.log(`❌ Prompt contract missing expected sections for ${workflow.name}`);
    continue;
  }

  console.log(`✅ ${workflow.name}`);
  console.log(`   Scenario Input: ${scenario}`);
  console.log(`   Expected Output Shape: ${workflow.outputs.join(' | ')}`);
  console.log(`   Representative Output: ${workflow.sampleOutput}`);
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('\nAll agent scenarios validated against workflow contracts.');
}
