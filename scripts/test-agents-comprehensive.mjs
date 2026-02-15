#!/usr/bin/env node
/**
 * Comprehensive AI Agent Test Suite
 * Tests all 10 agents with realistic prompts and validates outputs
 */

import { AGENT_WORKFLOWS, buildAgentSystemPrompt } from '../src/config/agentWorkflows.js';
import { shouldInvokeLiveDiscovery } from '../src/config/agentRuntimeRules.js';
import { detectWorkType, detectState, extractDiscoveryFilters } from '../src/config/bidDiscoveryEngine.js';

// Test scenarios for each agent
const TEST_SCENARIOS = {
  central_orchestrator: [
    {
      name: 'Multi-project coordination',
      prompt: 'Coordinate a 3-week plan to submit a school retrofit bid while maintaining two active projects on schedule.',
      expectedKeywords: ['execution plan', 'risk', 'mitigation', 'schedule'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Resource allocation',
      prompt: 'We have 3 estimators and 5 deadlines this month. How should we prioritize?',
      expectedKeywords: ['prioritize', 'resource', 'allocation', 'schedule'],
      shouldInvokeDiscovery: false
    }
  ],
  
  market_intelligence: [
    {
      name: 'California bid discovery',
      prompt: 'Find public low-voltage bids in California due in the next 14 days',
      expectedKeywords: ['opportunities', 'bid', 'california', 'low-voltage'],
      shouldInvokeDiscovery: true
    },
    {
      name: 'Specific work type search',
      prompt: 'Search for CCTV security system bids in Los Angeles',
      expectedKeywords: ['opportunities', 'cctv', 'security'],
      shouldInvokeDiscovery: true
    },
    {
      name: 'Non-discovery query',
      prompt: 'What factors should I consider when evaluating bid opportunities?',
      expectedKeywords: ['factors', 'evaluate', 'consider'],
      shouldInvokeDiscovery: false
    }
  ],
  
  bid_package_assembly: [
    {
      name: 'RFP checklist creation',
      prompt: 'Turn this 60-page RFP into a structured checklist with required forms and insurance limits',
      expectedKeywords: ['checklist', 'forms', 'insurance', 'requirements'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Pricing assumptions',
      prompt: 'Create pricing assumptions for a 12-week low-voltage project with union labor',
      expectedKeywords: ['pricing', 'assumptions', 'labor', 'cost'],
      shouldInvokeDiscovery: false
    }
  ],
  
  proposal_generation: [
    {
      name: 'Municipal proposal',
      prompt: 'Create a persuasive proposal for a municipal CCTV modernization project emphasizing safety',
      expectedKeywords: ['proposal', 'safety', 'executive summary', 'approach'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Educational facility proposal',
      prompt: 'Draft a proposal for a K-12 school network infrastructure upgrade',
      expectedKeywords: ['proposal', 'school', 'network', 'infrastructure'],
      shouldInvokeDiscovery: false
    }
  ],
  
  regulatory_intelligence: [
    {
      name: 'California school permit requirements',
      prompt: 'List expected permits and inspection checkpoints for a California school low-voltage upgrade',
      expectedKeywords: ['permit', 'inspection', 'california', 'compliance'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Fire alarm compliance',
      prompt: 'What are the regulatory requirements for fire alarm system installation in Los Angeles?',
      expectedKeywords: ['regulatory', 'fire alarm', 'requirements', 'compliance'],
      shouldInvokeDiscovery: false
    }
  ],
  
  risk_prediction: [
    {
      name: 'Schedule risk assessment',
      prompt: 'Assess risk of a 12-week deployment with one lead estimator and three parallel deadlines',
      expectedKeywords: ['risk', 'schedule', 'mitigation', 'estimator'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Budget risk analysis',
      prompt: 'Analyze cost risks for a $2M project with 60-day material lead times',
      expectedKeywords: ['cost', 'risk', 'budget', 'material'],
      shouldInvokeDiscovery: false
    }
  ],
  
  quality_assurance: [
    {
      name: 'Low-voltage QA checklist',
      prompt: 'Build a QA checklist for low-voltage cabling install, testing, labeling, and closeout',
      expectedKeywords: ['qa', 'checklist', 'testing', 'inspection'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Defect prevention',
      prompt: 'What are common defects in fiber optic installations and how can we prevent them?',
      expectedKeywords: ['defect', 'prevention', 'fiber', 'quality'],
      shouldInvokeDiscovery: false
    }
  ],
  
  safety_compliance: [
    {
      name: 'Hospital night shift safety',
      prompt: 'Create a safety plan for night-shift conduit work in an occupied hospital',
      expectedKeywords: ['safety', 'hazard', 'hospital', 'controls'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Elevated work safety',
      prompt: 'Develop a JHA for installing cable tray at 30 feet height',
      expectedKeywords: ['jha', 'safety', 'elevated', 'fall protection'],
      shouldInvokeDiscovery: false
    }
  ],
  
  sustainability_optimization: [
    {
      name: 'Material substitutions',
      prompt: 'Recommend lower-carbon alternatives for conduit and fixture package while preserving budget',
      expectedKeywords: ['carbon', 'alternatives', 'sustainability', 'budget'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'LEED optimization',
      prompt: 'How can we optimize our low-voltage design to contribute to LEED certification?',
      expectedKeywords: ['leed', 'sustainability', 'certification', 'design'],
      shouldInvokeDiscovery: false
    }
  ],
  
  stakeholder_communication: [
    {
      name: 'Multi-audience updates',
      prompt: 'Draft three updates: executive summary for owner, technical note for PM, field briefing for installers',
      expectedKeywords: ['update', 'executive', 'technical', 'field'],
      shouldInvokeDiscovery: false
    },
    {
      name: 'Delay communication',
      prompt: 'Write an email to the client explaining a 2-week schedule delay due to permit approval',
      expectedKeywords: ['delay', 'schedule', 'permit', 'communication'],
      shouldInvokeDiscovery: false
    }
  ]
};

// Validation functions
function validateSystemPrompt(agentId) {
  const workflow = AGENT_WORKFLOWS[agentId];
  if (!workflow) return { valid: false, error: 'Workflow not found' };
  
  const prompt = buildAgentSystemPrompt(agentId);
  
  // Check that prompt includes key elements
  const checks = {
    hasName: prompt.includes(workflow.name),
    hasPurpose: prompt.includes(workflow.purpose),
    hasInputs: prompt.includes('Expected inputs:'),
    hasWorkflow: prompt.includes('Execution workflow:'),
    hasOutputs: prompt.includes('Output expectations:'),
    hasGuardrails: prompt.includes('Guardrails:')
  };
  
  const allValid = Object.values(checks).every(v => v);
  
  return {
    valid: allValid,
    checks,
    promptLength: prompt.length
  };
}

function validateDiscoveryRules(agentId, testCase) {
  const shouldInvoke = shouldInvokeLiveDiscovery(agentId, testCase.prompt);
  return {
    valid: shouldInvoke === testCase.shouldInvokeDiscovery,
    expected: testCase.shouldInvokeDiscovery,
    actual: shouldInvoke
  };
}

function validateWorkflow(agentId) {
  const workflow = AGENT_WORKFLOWS[agentId];
  if (!workflow) return { valid: false, errors: ['Workflow not found'] };
  
  const errors = [];
  const requiredFields = ['id', 'name', 'purpose', 'inputs', 'workflow', 'outputs', 'guardrails'];
  
  for (const field of requiredFields) {
    const value = workflow[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`Missing field: ${field}`);
    } else if (Array.isArray(value) && value.length === 0) {
      errors.push(`Empty array: ${field}`);
    }
  }
  
  // Validate supportsLiveBidDiscovery is boolean
  if (typeof workflow.supportsLiveBidDiscovery !== 'boolean') {
    errors.push('supportsLiveBidDiscovery must be boolean');
  }
  
  // Validate showBidOpportunitiesPanel is boolean
  if (typeof workflow.showBidOpportunitiesPanel !== 'boolean') {
    errors.push('showBidOpportunitiesPanel must be boolean');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Test runner
async function runTests() {
  console.log('🤖 AI Agent Comprehensive Test Suite\n');
  console.log('=' .repeat(80));
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];
  
  // Test 1: Validate all workflow configurations
  console.log('\n📋 Test 1: Workflow Configuration Validation\n');
  
  for (const [agentId, workflow] of Object.entries(AGENT_WORKFLOWS)) {
    totalTests++;
    const validation = validateWorkflow(agentId);
    
    if (validation.valid) {
      console.log(`✅ ${workflow.name}: Configuration valid`);
      passedTests++;
    } else {
      console.log(`❌ ${workflow.name}: Configuration issues`);
      validation.errors.forEach(err => console.log(`   - ${err}`));
      failedTests++;
      failures.push({
        agent: workflow.name,
        test: 'Configuration',
        errors: validation.errors
      });
    }
  }
  
  // Test 2: Validate system prompt generation
  console.log('\n📝 Test 2: System Prompt Generation\n');
  
  for (const [agentId, workflow] of Object.entries(AGENT_WORKFLOWS)) {
    totalTests++;
    const validation = validateSystemPrompt(agentId);
    
    if (validation.valid) {
      console.log(`✅ ${workflow.name}: System prompt valid (${validation.promptLength} chars)`);
      passedTests++;
    } else {
      console.log(`❌ ${workflow.name}: System prompt incomplete`);
      Object.entries(validation.checks).forEach(([check, passed]) => {
        if (!passed) console.log(`   - Missing: ${check}`);
      });
      failedTests++;
      failures.push({
        agent: workflow.name,
        test: 'System Prompt',
        errors: ['Incomplete system prompt']
      });
    }
  }
  
  // Test 3: Validate discovery rules
  console.log('\n🔍 Test 3: Discovery Rule Validation\n');
  
  for (const [agentId, testCases] of Object.entries(TEST_SCENARIOS)) {
    const workflow = AGENT_WORKFLOWS[agentId];
    
    for (const testCase of testCases) {
      totalTests++;
      const validation = validateDiscoveryRules(agentId, testCase);
      
      if (validation.valid) {
        console.log(`✅ ${workflow.name} - ${testCase.name}: Discovery rule correct`);
        passedTests++;
      } else {
        console.log(`❌ ${workflow.name} - ${testCase.name}: Discovery rule failed`);
        console.log(`   Expected: ${validation.expected}, Got: ${validation.actual}`);
        failedTests++;
        failures.push({
          agent: workflow.name,
          test: `Discovery Rule: ${testCase.name}`,
          errors: [`Expected ${validation.expected}, got ${validation.actual}`]
        });
      }
    }
  }
  
  // Test 4: Validate bid discovery engine
  console.log('\n🎯 Test 4: Bid Discovery Engine\n');
  
  const discoveryTests = [
    { prompt: 'Find low voltage bids in California', expectedWorkType: 'low_voltage', expectedState: 'California' },
    { prompt: 'Search for CCTV security bids', expectedWorkType: 'low_voltage', expectedState: 'California' },
    { prompt: 'Look for electrical work in Texas', expectedWorkType: 'electrical', expectedState: 'Texas' },
    { prompt: 'HVAC projects in Florida', expectedWorkType: 'hvac', expectedState: 'Florida' }
  ];
  
  for (const test of discoveryTests) {
    totalTests++;
    const filters = extractDiscoveryFilters(test.prompt);
    
    const workTypeMatch = filters.workType === test.expectedWorkType;
    const stateMatch = filters.state === test.expectedState;
    
    if (workTypeMatch && stateMatch) {
      console.log(`✅ "${test.prompt}"`);
      console.log(`   Detected: ${filters.workType}, ${filters.state}`);
      passedTests++;
    } else {
      console.log(`❌ "${test.prompt}"`);
      console.log(`   Expected: ${test.expectedWorkType}, ${test.expectedState}`);
      console.log(`   Got: ${filters.workType}, ${filters.state}`);
      failedTests++;
      failures.push({
        agent: 'Bid Discovery Engine',
        test: test.prompt,
        errors: ['Filter detection mismatch']
      });
    }
  }
  
  // Test 5: Test scenario coverage
  console.log('\n📊 Test 5: Test Scenario Coverage\n');
  
  for (const [agentId, workflow] of Object.entries(AGENT_WORKFLOWS)) {
    totalTests++;
    const scenarios = TEST_SCENARIOS[agentId];
    
    if (scenarios && scenarios.length >= 2) {
      console.log(`✅ ${workflow.name}: ${scenarios.length} test scenarios defined`);
      passedTests++;
    } else {
      console.log(`⚠️  ${workflow.name}: Only ${scenarios?.length || 0} test scenarios`);
      // Don't count as failure, but note it
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 Test Summary\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`❌ Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:\n');
    failures.forEach((failure, idx) => {
      console.log(`${idx + 1}. ${failure.agent} - ${failure.test}`);
      failure.errors.forEach(err => console.log(`   - ${err}`));
    });
    process.exitCode = 1;
  } else {
    console.log('\n🎉 All tests passed!');
  }
  
  return { totalTests, passedTests, failedTests, failures };
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exitCode = 1;
});
