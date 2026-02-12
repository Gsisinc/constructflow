import { buildPortfolioMetrics, buildPortfolioRows, normalizeIntegrationState, toCsv } from '../src/lib/phase3.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const metrics = buildPortfolioMetrics({
  projects: [
    { id: 'p1', name: 'One', status: 'active', budget: 100000 },
    { id: 'p2', name: 'Two', status: 'completed', budget: 50000 }
  ],
  bids: [
    { status: 'submitted' },
    { status: 'won' },
    { status: 'lost' }
  ],
  expenses: [
    { project_id: 'p1', amount: 10000 },
    { project_id: 'p2', amount: 5000 }
  ]
});

assert(metrics.total_projects === 2, 'Expected total projects count.');
assert(metrics.active_projects === 1, 'Expected active projects count.');
assert(metrics.bid_win_rate > 0, 'Expected non-zero bid win rate.');

const rows = buildPortfolioRows({
  projects: [{ id: 'p1', name: 'One', status: 'active', budget: 100000 }],
  expenses: [{ project_id: 'p1', amount: 25000 }]
});

assert(rows.length === 1, 'Expected one portfolio row.');
assert(rows[0].variance === 75000, 'Variance should be budget-spend.');

const normalized = normalizeIntegrationState({ quickbooks: { connected: true, account_name: 'Ops QB' } });
assert(normalized.quickbooks.connected === true, 'Expected quickbooks connection preserved.');
assert(normalized.sage.connected === false, 'Expected missing providers default disconnected.');

const csv = toCsv(rows);
assert(csv.includes('project_name'), 'CSV should include headers.');
assert(csv.includes('One'), 'CSV should include data rows.');

console.log('Phase 3 utility tests passed.');
