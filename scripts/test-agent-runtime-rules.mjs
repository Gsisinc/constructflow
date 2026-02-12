import { shouldInvokeLiveDiscovery } from '../src/config/agentRuntimeRules.js';

const cases = [
  {
    name: 'Market Intelligence with discovery prompt should invoke',
    agentId: 'market_intelligence',
    prompt: 'Find bids from sam.gov for low voltage work',
    expected: true
  },
  {
    name: 'Market Intelligence with non-discovery prompt should not invoke',
    agentId: 'market_intelligence',
    prompt: 'Summarize this proposal intro section',
    expected: false
  },
  {
    name: 'Non-discovery agent with discovery prompt should not invoke',
    agentId: 'risk_prediction',
    prompt: 'Scrape opportunities in California',
    expected: false
  }
];

let failed = 0;

for (const testCase of cases) {
  const actual = shouldInvokeLiveDiscovery(testCase.agentId, testCase.prompt);
  if (actual !== testCase.expected) {
    failed += 1;
    console.log(`❌ ${testCase.name} | expected=${testCase.expected} actual=${actual}`);
  } else {
    console.log(`✅ ${testCase.name}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('\nAll runtime rule checks passed.');
}
