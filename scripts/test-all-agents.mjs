#!/usr/bin/env node

/**
 * Comprehensive Test Suite for All AI Agents
 * Tests each of the 10 agents with their typical prompts
 */

import { AGENT_WORKFLOWS, buildAgentSystemPrompt } from '../src/config/agentWorkflows.js';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test cases for each agent
const testCases = {
  central_orchestrator: {
    name: 'Central Orchestrator',
    prompt: 'Coordinate a 3-week plan to submit a school retrofit bid while current projects remain on schedule. We have a team of 5 people and need to manage resources carefully.',
    expectedKeywords: ['plan', 'coordination', 'timeline', 'resources', 'risk']
  },
  market_intelligence: {
    name: 'Market Intelligence',
    prompt: 'Find public low-voltage bids in California due in the next 14 days and rank top 10 by fit for a 25-person contractor with experience in school projects.',
    expectedKeywords: ['opportunities', 'California', 'low-voltage', 'bid', 'rank']
  },
  bid_package_assembly: {
    name: 'Bid Package Assembly',
    prompt: 'Turn this RFP into a checklist with required forms, insurance limits, and pricing assumptions. Key requirements: $500K budget, 8-week timeline, LEED certification.',
    expectedKeywords: ['checklist', 'requirements', 'insurance', 'pricing', 'compliance']
  },
  proposal_generation: {
    name: 'Proposal Generation',
    prompt: 'Create a persuasive proposal for a municipal CCTV modernization project emphasizing safety and minimal downtime. Budget is $250K and timeline is 12 weeks.',
    expectedKeywords: ['proposal', 'approach', 'schedule', 'value', 'safety']
  },
  regulatory_intelligence: {
    name: 'Regulatory Intelligence',
    prompt: 'For a California school low-voltage upgrade, list expected permits and inspection checkpoints. Project is in San Francisco with 8-week timeline.',
    expectedKeywords: ['permit', 'compliance', 'inspection', 'agency', 'timeline']
  },
  risk_prediction: {
    name: 'Risk Prediction',
    prompt: 'Assess risk of a 12-week deployment with one lead estimator and three parallel submittal deadlines. Budget is $500K with 10% contingency.',
    expectedKeywords: ['risk', 'mitigation', 'probability', 'impact', 'monitoring']
  },
  quality_assurance: {
    name: 'Quality Assurance',
    prompt: 'Build a QA checklist for low-voltage cabling install, testing, labeling, and closeout docs. Project has zero-defect requirement.',
    expectedKeywords: ['quality', 'inspection', 'checklist', 'defect', 'testing']
  },
  safety_compliance: {
    name: 'Safety Compliance',
    prompt: 'Create a safety plan for night-shift conduit work in an occupied hospital. Team of 8 electricians, high-risk environment.',
    expectedKeywords: ['safety', 'hazard', 'control', 'training', 'incident']
  },
  sustainability_optimization: {
    name: 'Sustainability Optimization',
    prompt: 'Recommend lower-carbon alternatives for conduit and fixture package while preserving budget. Target is 20% carbon reduction with LEED certification.',
    expectedKeywords: ['sustainability', 'carbon', 'material', 'LEED', 'alternative']
  },
  stakeholder_communication: {
    name: 'Stakeholder Communication',
    prompt: 'Draft three updates: executive summary for owner, technical note for PM, and field briefing for installers. Current status: 60% complete, on schedule.',
    expectedKeywords: ['communication', 'update', 'audience', 'status', 'message']
  }
};

/**
 * Call OpenAI API for a single agent
 */
async function testAgent(agentId, testCase) {
  try {
    const systemPrompt = buildAgentSystemPrompt(agentId);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${testCase.name} (${agentId})`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Prompt: ${testCase.prompt.substring(0, 100)}...`);
    
    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: testCase.prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const content = response.choices[0].message.content;
    
    if (!content || content.trim().length === 0) {
      throw new Error('Empty response from OpenAI');
    }

    // Check for expected keywords
    const contentLower = content.toLowerCase();
    const foundKeywords = testCase.expectedKeywords.filter(kw => 
      contentLower.includes(kw.toLowerCase())
    );

    const keywordMatch = (foundKeywords.length / testCase.expectedKeywords.length) * 100;

    console.log(`\n✅ Response received (${content.length} chars)`);
    console.log(`Keywords found: ${foundKeywords.length}/${testCase.expectedKeywords.length} (${keywordMatch.toFixed(0)}%)`);
    console.log(`\nResponse preview:`);
    console.log(content.substring(0, 300) + '...\n');

    return {
      agentId,
      name: testCase.name,
      success: true,
      responseLength: content.length,
      keywordMatch: keywordMatch,
      keywords: foundKeywords
    };
  } catch (error) {
    console.error(`\n❌ Test failed for ${testCase.name}:`);
    console.error(`Error: ${error.message}\n`);

    return {
      agentId,
      name: testCase.name,
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('CONSTRUCTFLOW AI AGENTS - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Testing ${Object.keys(testCases).length} agents with OpenAI API`);
  console.log(`API Key: ${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);
  console.log('='.repeat(80));

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const [agentId, testCase] of Object.entries(testCases)) {
    const result = await testAgent(agentId, testCase);
    results.push(result);
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  // Detailed results
  console.log('\nDETAILED RESULTS:');
  console.log('='.repeat(80));

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`\n${index + 1}. ${status} ${result.name}`);
    
    if (result.success) {
      console.log(`   Response Length: ${result.responseLength} chars`);
      console.log(`   Keyword Match: ${result.keywordMatch.toFixed(0)}%`);
      console.log(`   Keywords Found: ${result.keywords.join(', ')}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
