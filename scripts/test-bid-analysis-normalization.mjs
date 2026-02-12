import { buildBidAnalysisPrompt, normalizeBidAnalysis } from '../src/lib/bidAnalysis.js';

const prompt = buildBidAnalysisPrompt({
  formData: {
    project_name: 'City Hall Security Upgrade',
    agency: 'City of Example',
    description: 'Upgrade access control and CCTV',
    estimated_value: 350000,
    due_date: '2026-04-01'
  },
  phases: [
    { name: 'Design', duration_days: 5 },
    { name: 'Install', duration_days: 20 }
  ],
  fileCount: 2
});

if (!prompt.includes('Return strict JSON') || !prompt.includes('City Hall Security Upgrade')) {
  console.log('❌ Prompt generation failed');
  process.exit(1);
}
console.log('✅ Prompt generation includes required instructions and bid details');

const normalized = normalizeBidAnalysis(
  {
    summary: 'Analysis complete',
    project_overview: { scope_summary: 'Scope ok', timeline_days: 45, estimated_budget: 420000 },
    deadlines: [{ name: 'Submission', date: '2026-04-01' }],
    bid_requirements: [{ text: 'Provide bid bond', category: 'legal', priority: 'high' }],
    project_requirements: [{ text: 'Install 40 cameras', category: 'technical', priority: 'critical' }],
    phases: [{ name: 'Design', duration_days: 7, description: 'Design work', requirements: ['Survey'] }],
    risks: [{ risk: 'Lead time risk', severity: 'high', mitigation: 'Early PO' }],
    confidence_notes: ['Assumed permit timeline from prior projects']
  },
  {
    estimated_value: 100000,
    description: 'Fallback description',
    phases: [{ name: 'Fallback', duration_days: 3, requirements: [] }]
  }
);

if (normalized.bidRequirements.length !== 1 || normalized.projectRequirements.length !== 1) {
  console.log('❌ Requirement normalization failed');
  process.exit(1);
}
if (normalized.phases.length !== 1 || normalized.estimatedBudget !== 420000) {
  console.log('❌ Phase or budget normalization failed');
  process.exit(1);
}

console.log('✅ Analysis normalization works for requirements, phases, and budget');
console.log('Example normalized output:', JSON.stringify({
  summary: normalized.summary,
  estimatedBudget: normalized.estimatedBudget,
  timelineDays: normalized.timelineDays,
  bidRequirements: normalized.bidRequirements,
  projectRequirements: normalized.projectRequirements,
  deadlines: normalized.deadlines,
  risks: normalized.risks
}, null, 2));
