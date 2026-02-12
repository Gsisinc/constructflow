import {
  buildDiscoverySummary,
  detectState,
  detectWorkType,
  extractDiscoveryFilters,
  normalizeOpportunities,
  rankOpportunities
} from '../src/config/bidDiscoveryEngine.js';

const assert = (name, condition, details = '') => {
  if (!condition) {
    console.log(`❌ ${name}${details ? ` | ${details}` : ''}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✅ ${name}`);
};

const workType = detectWorkType('Find low voltage opportunities for CCTV projects');
assert('Detect low_voltage work type', workType === 'low_voltage', `got=${workType}`);

const state = detectState('Search bids in Texas for electrical jobs');
assert('Detect Texas state', state === 'Texas', `got=${state}`);

const filters = extractDiscoveryFilters('Find low voltage bids in California');
assert('Extract filters', filters.workType === 'low_voltage' && filters.state === 'California');

const countyResp = {
  data: {
    source: 'county',
    bids: [
      { title: 'LA County CCTV Upgrade', due_date: '2026-03-01', estimated_value: 250000, url: 'https://county.example/1' },
      { title: 'LA County CCTV Upgrade', due_date: '2026-03-01', estimated_value: 250000, url: 'https://county.example/1' }
    ]
  }
};

const generalResp = {
  data: {
    source: 'general',
    opportunities: [
      { title: 'San Diego Fiber Upgrade', due_date: '2026-02-18', estimated_value: 500000, url: 'https://state.example/2' }
    ]
  }
};

const normalized = normalizeOpportunities(countyResp, generalResp);
assert('Normalize and dedupe opportunities', normalized.length === 2, `got=${normalized.length}`);

const ranked = rankOpportunities(normalized);
assert('Rank opportunities with score metadata', ranked.length === 2 && typeof ranked[0]._priority_score === 'number');

const summary = buildDiscoverySummary(ranked, filters);
assert('Build discovery summary text', summary.includes('Loaded 2 live opportunities'));

console.log('\nExample discovery output:');
console.log(summary);
