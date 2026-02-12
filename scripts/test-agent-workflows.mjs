import { AGENT_WORKFLOWS, buildAgentSystemPrompt } from '../src/config/agentWorkflows.js';

const requiredFields = ['id', 'name', 'purpose', 'inputs', 'workflow', 'outputs', 'typicalPrompt', 'sampleOutput', 'guardrails'];

let failures = 0;

for (const [agentId, workflow] of Object.entries(AGENT_WORKFLOWS)) {
  const missing = requiredFields.filter((field) => {
    const value = workflow[field];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    failures += 1;
    console.log(`❌ ${agentId}: missing ${missing.join(', ')}`);
    continue;
  }

  const prompt = buildAgentSystemPrompt(agentId);
  if (!prompt.includes(workflow.name) || !prompt.includes('Guardrails:')) {
    failures += 1;
    console.log(`❌ ${agentId}: generated system prompt is incomplete`);
    continue;
  }

  console.log(`✅ ${workflow.name}`);
  console.log(`   Prompt: ${workflow.typicalPrompt}`);
  console.log(`   Output: ${workflow.sampleOutput}`);
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`\nAll ${Object.keys(AGENT_WORKFLOWS).length} agent workflows validated.`);
}
