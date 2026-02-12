import assert from 'node:assert/strict';
import {
  buildAiReliabilityStats,
  buildAutomationPreview,
  buildPromptTraceRows,
  normalizeAiPolicy,
  normalizeModelPolicy
} from '../src/lib/phase4.js';

const traces = buildPromptTraceRows([
  {
    id: 'm1',
    agent_name: 'market_intelligence',
    message: 'Find electrical bids in Texas this week',
    response: 'Found 4 bids from county portals.',
    confidence_score: 0.82,
    model: 'gpt-4.1-mini',
    created_date: '2026-02-01T12:00:00Z'
  },
  {
    id: 'm2',
    agent_name: 'risk_prediction',
    prompt: 'Analyze risk for Project Alpha',
    assistant_message: 'Risk score is elevated due to schedule compression.',
    metadata: { confidence: 0.61, tokens: 320 },
    created_date: '2026-02-02T09:15:00Z'
  }
]);

assert.equal(traces.length, 2, 'trace rows should be mapped');
assert.equal(traces[0].id, 'm2', 'newest trace should sort first');

const stats = buildAiReliabilityStats(traces);
assert.equal(stats.total_runs, 2);
assert.equal(stats.low_confidence_runs, 1);
assert.ok(stats.avg_confidence > 0.7 && stats.avg_confidence < 0.8, 'avg confidence should be in expected range');

const automation = buildAutomationPreview({
  rules: [
    { id: 'r1', trigger_type: 'risk_threshold', threshold: 0.7 },
    { id: 'r2', trigger_type: 'bid_deadline_window', threshold: 5 }
  ],
  projects: [{ id: 'p1', risk_score: 0.8 }],
  bids: [{ id: 'b1', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() }]
});

assert.equal(automation[0].shouldTrigger, true);
assert.equal(automation[1].shouldTrigger, true);

const policy = normalizeAiPolicy({ confidence_threshold: 5, keep_prompt_history_days: 1 });
assert.equal(policy.confidence_threshold, 1);
assert.equal(policy.keep_prompt_history_days, 7);

const models = normalizeModelPolicy({ high_reasoning: 'o4-mini' });
assert.equal(models.high_reasoning, 'o4-mini');
assert.ok(models.standard_assistant, 'model policy should retain defaults');

console.log('✅ Phase 4 AI governance/automation utility tests passed.');
