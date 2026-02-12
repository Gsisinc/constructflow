import assert from 'node:assert/strict';
import {
  buildExecutiveKpis,
  buildRevenueForecast,
  buildTenantUsageSummary,
  getPhase5Providers,
  normalizeTenantPolicy
} from '../src/lib/phase5.js';

const providers = getPhase5Providers();
assert.ok(providers.length >= 8, 'phase 5 providers should include marketplace catalog');
assert.ok(providers.some((p) => p.id === 'quickbooks'));

const policy = normalizeTenantPolicy({ retention_days: 1, seat_limit: 0, ai_monthly_token_limit: 10, region: 'eu-central' });
assert.equal(policy.retention_days, 30);
assert.equal(policy.seat_limit, 1);
assert.equal(policy.ai_monthly_token_limit, 1000);
assert.equal(policy.region, 'eu-central');

const usage = buildTenantUsageSummary({
  users: [{ status: 'active' }, { status: 'inactive' }, { status: 'active' }],
  documents: [{ file_size_mb: 512 }, { size_mb: 256 }],
  aiLogs: [{ token_estimate: 1000 }, { tokens: 750 }]
});
assert.equal(usage.active_users, 2);
assert.equal(usage.documents_count, 2);
assert.equal(usage.ai_tokens_used, 1750);

const kpis = buildExecutiveKpis({
  projects: [{ status: 'active', budget: 100000 }, { status: 'completed', budget: 50000 }],
  expenses: [{ amount: 30000 }],
  bids: [{ status: 'won' }, { status: 'lost' }, { status: 'submitted' }]
});
assert.equal(kpis.active_projects, 1);
assert.equal(kpis.margin_projection, 120000);
assert.equal(kpis.bid_win_rate, 33.3);

const forecast = buildRevenueForecast({
  projects: [
    { start_date: '2026-01-15', budget: 50000 },
    { start_date: '2026-01-20', budget: 25000 },
    { start_date: '2026-02-01', budget: 10000 }
  ]
});
assert.deepEqual(forecast, [
  { month: '2026-01', revenue: 75000 },
  { month: '2026-02', revenue: 10000 }
]);

console.log('✅ Phase 5 platform-scale utility tests passed.');
