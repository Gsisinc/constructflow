import assert from 'node:assert/strict';
import {
  normalizeOpportunity,
  dedupeAndRankOpportunities,
  detectNewOpportunities,
  fetchDiscoveryFromSources
} from '../src/lib/bidDiscoveryOrchestrator.js';

const normalized = normalizeOpportunity(
  {
    title: 'County Low Voltage Upgrade',
    agency: 'Orange County',
    city: 'Irvine',
    state: 'California',
    budget: '$250000',
    due_date: '2026-06-01',
    external_id: 'OC-100'
  },
  'county_portal'
);

assert.equal(normalized.title, 'County Low Voltage Upgrade');
assert.equal(normalized.estimated_value, 250000);
assert.equal(normalized.source, 'county_portal');

const ranked = dedupeAndRankOpportunities(
  [
    normalized,
    { ...normalized, source: 'web', title: 'County Low Voltage Upgrade' },
    { ...normalized, external_id: 'SAM-1', title: 'Federal Structured Cabling', source: 'sam_gov', description: 'structured cabling' }
  ],
  { workType: 'low_voltage', state: 'California', cityCounty: 'Irvine' }
);
assert.equal(ranked.length, 2);
assert.ok(ranked[0].match_score >= ranked[1].match_score);

const onlyNew = detectNewOpportunities({
  previousFingerprints: ['OC-100|Orange County|2026-06-01T00:00:00.000Z'],
  opportunities: ranked
});
assert.equal(onlyNew.length, 1);

const fakeBase44 = {
  functions: {
    invoke: async (fn) => {
      if (fn === 'scrapeSamGovBids') {
        return {
          data: {
            success: true,
            opportunities: [{ title: 'SAM Fiber Project', agency: 'USACE', external_id: 'SAM-2', due_date: '2026-07-01' }]
          }
        };
      }
      return { data: { success: true, opportunities: [] } };
    }
  }
};

const aggregated = await fetchDiscoveryFromSources({
  base44Client: fakeBase44,
  filters: { workType: 'fiber_optic', state: 'Texas', cityCounty: '', classification: 'government' },
  page: 1,
  pageSize: 50
});

assert.equal(aggregated.opportunities.length, 1);
assert.ok(aggregated.sourceSummary.length >= 3);

console.log('test-bid-discovery-orchestrator: ok');
