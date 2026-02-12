import { buildCostToComplete, buildVendorScorecards, levelSubcontractorBids } from '../src/lib/phase2.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const bids = [
  { vendor: 'Alpha', bid_amount: 120000, compliance_score: 90, risk_score: 20, schedule_days: 45 },
  { vendor: 'Beta', bid_amount: 125000, compliance_score: 80, risk_score: 40, schedule_days: 55 }
];

const leveled = levelSubcontractorBids(bids);
assert(leveled.length === 2, 'Expected leveled bids length.');
assert(leveled[0].weighted_score >= leveled[1].weighted_score, 'Bids should be sorted by weighted score desc.');

const scorecards = buildVendorScorecards(
  [
    { vendor: 'Alpha', amount: 5000, delivery_status: 'on_time' },
    { vendor: 'Alpha', amount: 4000, delivery_status: 'late' },
    { vendor: 'Beta', amount: 3000, status: 'received' }
  ],
  [
    { vendor: 'Alpha', amount: 8500 },
    { vendor: 'Beta', amount: 2800 }
  ]
);
assert(scorecards.length === 2, 'Expected two vendor scorecards.');
assert(scorecards[0].score >= scorecards[1].score, 'Scorecards sorted desc by score.');

const forecast = buildCostToComplete({
  projects: [{ id: 'p1', name: 'Test Project', budget: 100000, committed_cost: 20000 }],
  expenses: [{ project_id: 'p1', amount: 25000 }],
  changeOrders: [{ project_id: 'p1', cost_impact: 8000 }]
});

assert(forecast.length === 1, 'Expected one forecast row.');
assert(forecast[0].forecast_total === 53000, 'Forecast total should include spent+committed+CO impact.');
assert(forecast[0].cost_to_complete === 75000, 'Cost-to-complete should be budget-spent.');

console.log('Phase 2 utility tests passed.');
