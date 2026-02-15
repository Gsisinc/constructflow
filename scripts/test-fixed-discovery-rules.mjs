#!/usr/bin/env node
/**
 * Test the FIXED version of agentRuntimeRules
 */

// Import the fixed version
import { isLiveDiscoveryRequest, shouldInvokeLiveDiscovery } from '../src/config/agentRuntimeRules.FIXED.js';

const testCases = [
  // Should trigger discovery
  {
    name: 'Find bids in California',
    prompt: 'Find public low-voltage bids in California due in the next 14 days',
    expected: true
  },
  {
    name: 'Search for CCTV bids',
    prompt: 'Search for CCTV security system bids in Los Angeles',
    expected: true
  },
  {
    name: 'Get opportunities',
    prompt: 'Get bid opportunities for electrical work',
    expected: true
  },
  {
    name: 'Look for RFPs',
    prompt: 'Look for RFPs in Texas',
    expected: true
  },
  {
    name: 'Scrape sam.gov',
    prompt: 'Scrape sam.gov for construction bids',
    expected: true
  },
  {
    name: 'Discover solicitations',
    prompt: 'Discover solicitations in Florida',
    expected: true
  },
  
  // Should NOT trigger discovery (conceptual questions)
  {
    name: 'What factors question',
    prompt: 'What factors should I consider when evaluating bid opportunities?',
    expected: false
  },
  {
    name: 'How to question',
    prompt: 'How to find the best bids for my company?',
    expected: false
  },
  {
    name: 'Should I question',
    prompt: 'Should I bid on this opportunity?',
    expected: false
  },
  {
    name: 'Explain question',
    prompt: 'Can you explain how bid discovery works?',
    expected: false
  },
  {
    name: 'What are question',
    prompt: 'What are the key criteria for bid opportunities?',
    expected: false
  },
  
  // Edge cases
  {
    name: 'Summarize (not discovery)',
    prompt: 'Summarize this proposal intro section',
    expected: false
  },
  {
    name: 'Generic help',
    prompt: 'Help me understand the bidding process',
    expected: false
  }
];

console.log('🧪 Testing FIXED Discovery Keyword Detection\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const actual = isLiveDiscoveryRequest(testCase.prompt);
  const success = actual === testCase.expected;
  
  if (success) {
    console.log(`✅ ${testCase.name}`);
    console.log(`   "${testCase.prompt}"`);
    console.log(`   Result: ${actual} (expected: ${testCase.expected})\n`);
    passed++;
  } else {
    console.log(`❌ ${testCase.name}`);
    console.log(`   "${testCase.prompt}"`);
    console.log(`   Result: ${actual} (expected: ${testCase.expected})\n`);
    failed++;
  }
}

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`);

if (failed > 0) {
  console.log(`❌ ${failed} tests failed`);
  process.exitCode = 1;
} else {
  console.log('✅ All tests passed!');
}

// Test with Market Intelligence agent
console.log('\n' + '='.repeat(80));
console.log('\n🤖 Testing with Market Intelligence Agent\n');

const marketIntelligenceTests = [
  {
    prompt: 'Find public low-voltage bids in California',
    shouldInvoke: true
  },
  {
    prompt: 'What factors should I consider?',
    shouldInvoke: false
  }
];

for (const test of marketIntelligenceTests) {
  const result = shouldInvokeLiveDiscovery('market_intelligence', test.prompt);
  const success = result === test.shouldInvoke;
  
  if (success) {
    console.log(`✅ "${test.prompt}"`);
    console.log(`   Should invoke: ${test.shouldInvoke}, Got: ${result}\n`);
  } else {
    console.log(`❌ "${test.prompt}"`);
    console.log(`   Should invoke: ${test.shouldInvoke}, Got: ${result}\n`);
  }
}

// Test with non-discovery agent
console.log('🤖 Testing with Risk Prediction Agent (should never invoke)\n');

const riskPredictionTest = shouldInvokeLiveDiscovery('risk_prediction', 'Find bids in California');
console.log(`Prompt: "Find bids in California"`);
console.log(`Should invoke: false, Got: ${riskPredictionTest}`);

if (!riskPredictionTest) {
  console.log('✅ Correctly blocked discovery for non-discovery agent\n');
} else {
  console.log('❌ Failed to block discovery for non-discovery agent\n');
  process.exitCode = 1;
}
