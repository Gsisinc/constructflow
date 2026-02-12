import { convertBidToProjectFromAI } from '../src/lib/bidConversion.js';

const calls = [];
const makeRecorder = (entity) => ({
  create: async (payload) => {
    calls.push({ entity, action: 'create', payload });
    return { id: `${entity.toLowerCase()}-1`, ...payload };
  },
  update: async (id, payload) => {
    calls.push({ entity, action: 'update', id, payload });
    return { id, ...payload };
  }
});

const mockBase44 = {
  entities: {
    Project: makeRecorder('Project'),
    PhaseBudget: makeRecorder('PhaseBudget'),
    OperationalTask: makeRecorder('OperationalTask'),
    Issue: makeRecorder('Issue'),
    BidOpportunity: makeRecorder('BidOpportunity')
  }
};

const bid = {
  id: 'bid-1',
  title: 'City CCTV Upgrade',
  client_name: 'City of Example',
  estimated_value: 500000,
  project_type: 'municipal',
  description: 'Install cameras',
  ai_analysis: {
    complexity_score: 8,
    risk_factors: ['Long lead time', 'Permit delay']
  }
};

const requirements = [
  { requirement_text: 'Submit permit package', category: 'legal', priority: 'high', status: 'pending' },
  { requirement_text: 'Provide QA report', category: 'technical', priority: 'medium', status: 'pending' }
];

const project = await convertBidToProjectFromAI({
  base44Client: mockBase44,
  bid,
  organizationId: 'org-1',
  requirements
});

const hasProjectCreate = calls.some((c) => c.entity === 'Project' && c.action === 'create');
const phaseCreates = calls.filter((c) => c.entity === 'PhaseBudget' && c.action === 'create').length;
const taskCreates = calls.filter((c) => c.entity === 'OperationalTask' && c.action === 'create').length;
const riskCreates = calls.filter((c) => c.entity === 'Issue' && c.action === 'create').length;
const bidUpdate = calls.some((c) => c.entity === 'BidOpportunity' && c.action === 'update' && c.id === 'bid-1');

if (!hasProjectCreate || phaseCreates < 1 || taskCreates !== 2 || riskCreates !== 2 || !bidUpdate) {
  console.log('❌ Bid conversion helper did not create expected records');
  process.exit(1);
}

console.log('✅ Bid conversion helper creates project, phases, tasks, risks, and updates bid status');
console.log(`Created project id: ${project.id}`);
console.log(`Counts => phases:${phaseCreates}, tasks:${taskCreates}, risks:${riskCreates}`);
