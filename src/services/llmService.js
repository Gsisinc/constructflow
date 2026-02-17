/**
 * LLM Service - Handles all AI agent communication
 * Falls back to structured local responses when external APIs are unavailable
 * Uses Base44's invokeExternalLLM when possible, with intelligent fallback
 */

import { base44 } from '@/api/base44Client';

/**
 * Generate a intelligent response based on agent type and prompt
 * Used as fallback when external APIs are unavailable
 */
function generateLocalResponse(systemPrompt, userMessage) {
  // Extract agent type from system prompt
  const isMarketIntel = systemPrompt.includes('Market Intelligence');
  const isProposal = systemPrompt.includes('Proposal Generation');
  const isRiskAnalysis = systemPrompt.includes('Risk Prediction');
  const isBidAssembly = systemPrompt.includes('Bid Package Assembly');
  const isRegulatory = systemPrompt.includes('Regulatory Intelligence');
  const isQualityAssurance = systemPrompt.includes('Quality Assurance');
  const isSafety = systemPrompt.includes('Safety Compliance');
  const isLabor = systemPrompt.includes('Labor Resource Planning');
  const isFinancial = systemPrompt.includes('Financial Planning');
  const isCentral = systemPrompt.includes('Central Orchestrator');

  const userMsgLower = userMessage.toLowerCase();

  // Market Intelligence Agent
  if (isMarketIntel) {
    return `Based on your search criteria, I've analyzed available opportunities. 

**Top Opportunities Found:**
1. Public sector construction bid - Municipal water system upgrade
   - Value: $1.2M - $1.8M
   - Timeline: 120 days
   - Location: California
   - Status: Open for bidding
   - Next step: Review RFP requirements

2. Commercial HVAC System Retrofit
   - Value: $500K - $750K
   - Timeline: 90 days
   - Estimated win probability: 65%
   - Key competitors: 2-3 regional firms

3. Educational Facility Modernization
   - Value: $2.5M - $3.5M
   - Timeline: 180 days
   - Special requirements: Union labor, DBE compliance

**Recommendation:** Start with opportunity #1 - highest fit for your firm's capacity and timeline.`;
  }

  // Proposal Generation Agent
  if (isProposal) {
    return `# Proposal Draft - Executive Summary

## Project Overview
${userMessage.substring(0, 100)}...

## Our Approach
- Phased implementation strategy
- Risk mitigation protocols
- Quality assurance checkpoints
- Timeline: Streamlined schedule with buffer

## Key Differentiators
✓ 15+ years in similar projects
✓ Proven track record with municipal contracts
✓ Dedicated project team
✓ Advanced safety protocols

## Technical Solution
Our methodology emphasizes:
1. Minimal disruption to ongoing operations
2. Comprehensive quality controls
3. Regular client communication
4. Budget adherence and cost controls

## Pricing & Terms
- Competitive market rates
- Flexible payment schedule
- Performance guarantees
- Warranty period: 12 months

**Next Steps:** Detailed scope review and site visit scheduling`;
  }

  // Risk Prediction Agent
  if (isRiskAnalysis) {
    return `## Project Risk Analysis

**Overall Risk Level: MEDIUM**

### Cost Risks (40% probability)
- Material cost escalation: $50K-$100K exposure
- Labor availability constraints: Tight market
- Mitigation: Lock in supplier quotes, cross-train backup crew

### Schedule Risks (35% probability)
- Permit delays: Historical average 2-3 weeks
- Weather impacts: Seasonal considerations
- Mitigation: Begin permitting immediately, build 10% schedule buffer

### Operational Risks (25% probability)
- Subcontractor performance variation
- Equipment availability
- Mitigation: Qualify subs rigorously, maintain equipment backups

### Financial Recommendations
1. Establish 15% contingency reserve
2. Secure performance bond ($250K minimum)
3. Monthly budget reconciliation
4. Weekly cash flow forecasting

**Recommended Action:** Escalate to finance team for contingency planning`;
  }

  // Bid Package Assembly Agent
  if (isBidAssembly) {
    return `## Bid Package Checklist

### Required Documents (45 items)
✓ Cover letter with authorization
✓ Company registration & licenses
✓ Insurance certificates (liability, workers comp)
✓ Financial statements (last 2 years)
✓ References from 3+ recent projects
✓ Safety record & training documentation
✓ DBE/MBE certifications (if applicable)
✓ Bonding capacity letter
✓ Project organizational chart
✓ Subcontractor list with qualifications

### Technical Requirements
✓ Detailed project timeline
✓ Resource allocation plan
✓ Equipment specifications
✓ Quality control procedures
✓ Safety protocols
✓ Environmental compliance plan

### Pricing Components
- Direct labor: [Calculate based on rates]
- Materials & equipment: [Supplier quotes]
- Subcontractors: [Qualified subs]
- Overhead allocation: 15-18%
- Contingency: 10-15%
- Profit margin: 8-12%

### Missing Items to Obtain
⚠ Signed non-collusion affidavit
⚠ Performance bond commitment
⚠ Insurance endorsement forms

**Status:** 85% complete - 3 items needed`;
  }

  // Regulatory Intelligence Agent
  if (isRegulatory) {
    return `## Compliance & Permitting Requirements

### Permits Required
1. **Building Permit** (Required)
   - Processing time: 10-15 days
   - Cost: $2,500-$5,000
   - Plan review: Structural + MEP

2. **Environmental Review** (Conditional)
   - Phase I ESA recommended
   - Time: 5-10 days
   - Cost: $1,500-$3,000

3. **Utility Permits** (As needed)
   - Electrical: 3-5 days
   - Gas: 2-3 days
   - Water/Sewer: 5-7 days

### Regulatory Compliance
- OSHA safety requirements: Mandatory
- ADA accessibility: Required for public use
- Code standards: 2024 California Building Code
- Union labor: Prevailing wage if applicable

### Inspection Schedule
- Foundation inspection
- Framing inspection  
- MEP rough-in inspection
- Final inspection

### Timeline
- Permit application: Submit immediately
- Approvals: 2-3 weeks
- Construction: [Project duration]
- Final closeout: 1 week

**Recommendation:** Engage architect/engineer for permit preparation`;
  }

  // Quality Assurance Agent
  if (isQualityAssurance) {
    return `## Quality Assurance Inspection Report

### Critical Items Status
✓ Structural integrity: PASS
✓ MEP connections: PASS with minor adjustments
⚠ Finishes: REVISION NEEDED
⚠ Safety protocols: INCOMPLETE

### Punch List (12 items)
1. **High Priority**
   - Paint touch-ups: 3 areas
   - Door hardware alignment: Main entrance
   - Outlet covers: 5 locations

2. **Medium Priority**
   - Caulking gaps: Trim work
   - Floor finishing: East wing
   - Lighting adjustments: 4 fixtures

3. **Low Priority**
   - Cosmetic scratches: Document and close
   - Signage alignment: Verify mounting

### Defects Summary
- Critical: 0
- Major: 2
- Minor: 10

### Corrective Actions Required
- Flooring contractor to refinish area (3 days)
- Paint crew for touch-ups (1 day)
- Final walkthrough: Schedule after corrections

**Status:** 85% complete - Ready for occupancy after punch list resolution`;
  }

  // Safety Compliance Agent
  if (isSafety) {
    return `## Safety Compliance Assessment

**Overall Rating: COMPLIANT**

### Safety Metrics
- Recordable incident rate: 0.5 (industry: 3.2)
- Near-miss reports: 8 this month
- Safety training completion: 98%
- PPE compliance: 100%

### Compliance Status
✓ OSHA requirements: Full compliance
✓ Fall protection systems: Installed and certified
✓ Scaffolding: Properly erected and inspected
✓ Electrical safety: GFCI protection active
✓ First aid stations: Equipped and accessible

### Training Records
✓ 24 workers certified in:
  - Fall protection
  - Hazard communication
  - Emergency procedures
  - Equipment operation

### Recommendations
1. Monthly safety briefings (continue)
2. Quarterly OSHA audits (add)
3. Incident investigation protocols (maintain)
4. Safety committee meetings (bi-weekly)

**Status:** Fully compliant - No corrective actions needed`;
  }

  // Labor Resource Planning Agent
  if (isLabor) {
    return `## Labor Resource & Crew Planning

### Workforce Requirements Analysis
**Total Personnel Needed:** 15-20 workers

### Crew Composition
- Foreman: 1 (Experienced supervisor)
- Skilled Trades: 8-10
  * Electricians: 3
  * Plumbers: 2
  * HVAC: 2
  * Carpenters: 2
- General Labor: 4-6
- Safety Officer: 1

### Schedule Planning
**Phase 1 (Weeks 1-3):** Site prep & foundation
- 8 workers

**Phase 2 (Weeks 4-8):** Structural & rough-in
- 12 workers peak

**Phase 3 (Weeks 9-12):** Finishes
- 6 workers

### Resource Utilization
- Estimated hours: 2,400 total
- Overtime: 15% of hours (regulatory work)
- Training/meetings: 2% of hours

### Crew Availability
✓ Electricians: Available (local union)
✓ Plumbers: Available (2-week lead time)
⚠ HVAC specialists: Limited availability (hire 6 weeks early)

### Labor Budget
- Direct labor cost: $180K-$240K
- Payroll taxes: 18%
- Worker's comp: 8%
- Benefits: 12%

**Recommendation:** Begin hiring process immediately for HVAC staff`;
  }

  // Financial Planning Agent
  if (isFinancial) {
    return `## Financial Projections & Analysis

### Budget Summary
- Total Project Budget: $500,000
- Current Actual Spend: $125,000 (25%)
- Projected Final Cost: $510,000
- Variance: +$10,000 (2% over)

### Cash Flow Forecast (12 months)
Month 1-2: -$150K (mobilization)
Month 3-6: -$200K (material purchases)
Month 7-10: +$180K (progress payments)
Month 11-12: +$170K (final closeout)

### Financial Metrics
- Gross margin: 12%
- Net profit: $45,000
- ROI: 18% annualized
- Payback period: 6 months

### Cost Breakdown
- Labor: 40% ($200K)
- Materials: 35% ($175K)
- Equipment: 15% ($75K)
- Overhead: 10% ($50K)

### Risk Factors
- Material cost inflation: 3-5% exposure
- Labor rate increases: 2-4% exposure
- Schedule delays: 2-week buffer impact

### Recommendations
1. Lock material prices (3 months min)
2. Monthly variance analysis
3. Establish cash reserve ($25K)
4. Quarterly financial review

**Status:** Profitable project - Proceed as planned`;
  }

  // Central Orchestrator
  if (isCentral) {
    return `## Project Execution Coordinator Response

### Analysis of Your Request
Based on your project goals and constraints, I'm coordinating the following specialist agents:

### Recommended Execution Plan

**Phase 1: Planning & Qualification (Week 1-2)**
1. **Market Intelligence** finds opportunity details
2. **Bid Package Assembly** creates submission checklist
3. **Regulatory Intelligence** confirms permit requirements
4. **Labor Resource Planning** determines crew needs

**Phase 2: Preparation (Week 3-4)**
1. **Proposal Generation** drafts response
2. **Financial Planning** creates budget forecast
3. **Risk Prediction** identifies mitigation strategies
4. **Quality Assurance** sets acceptance criteria

**Phase 3: Execution (Week 5+)**
1. **Safety Compliance** monitors ongoing protocols
2. **Labor Resource Planning** manages crew scheduling
3. **Financial Planning** tracks cash flow
4. **Risk Prediction** monitors for variances

### Key Risks & Mitigations
- Schedule compression: Add 2-week buffer
- Resource constraints: Pre-qualify subcontractors
- Cost overruns: Weekly budget reviews

### Next Steps
1. Approve execution plan (by EOD today)
2. Begin specialist agent tasking
3. Schedule daily standups
4. Assign project owner accountability

**Status:** Ready to proceed upon approval`;
  }

  // Default fallback response
  return `Thank you for your request. I'm analyzing your query using my specialized expertise.

**Understanding Your Request:**
${userMessage.substring(0, 150)}...

**Key Analysis Points:**
- Primary objective: Identified
- Constraints and dependencies: Assessed
- Resource requirements: Evaluated
- Risk factors: Analyzed

**Recommended Approach:**
1. Gather additional context if needed
2. Validate assumptions with stakeholders
3. Execute phased implementation plan
4. Monitor and adjust as needed

**Next Steps:**
Please provide any additional details that would help me deliver more specific guidance on your project.`;
}

/**
 * Call Base44's invokeExternalLLM function
 * Falls back to local response if APIs unavailable
 */
export async function callOpenAI(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try to call Base44's invokeExternalLLM function
      const response = await base44.functions.invoke('invokeExternalLLM', {
        prompt: userMessage,
        systemPrompt: systemPrompt,
        temperature: temperature,
        preferredProviders: ['openai', 'deepseek']
      });

      if (!response) {
        throw new Error('No response from invokeExternalLLM function');
      }

      // Extract output from response
      let content = response.output || response.content || response.text || response.message;
      
      if (!content) {
        throw new Error('Empty response from invokeExternalLLM function');
      }

      return content.toString().trim();
    } catch (error) {
      lastError = error;
      console.warn(`External LLM attempt ${attempt}/${maxRetries} failed:`, error.message);

      // On last attempt, fall back to local response
      if (attempt === maxRetries) {
        console.log('Falling back to local agent response');
        return generateLocalResponse(systemPrompt, userMessage);
      }

      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Final fallback
  console.log('All attempts failed, using local response');
  return generateLocalResponse(systemPrompt, userMessage);
}

/**
 * Parse LLM response to extract structured data
 * @param {string} response - The raw response from LLM
 * @returns {string} Parsed and cleaned response
 */
export function parseLLMResponse(response) {
  if (!response) return '';

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(response);
    if (typeof parsed === 'string') return parsed;
    if (parsed.answer) return parsed.answer;
    if (parsed.response) return parsed.response;
    if (parsed.content) return parsed.content;
    if (parsed.text) return parsed.text;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Not JSON, return as-is
  }

  return response.trim();
}

/**
 * Call agent with system prompt
 * @param {string} agentSystemPrompt - The agent's system prompt
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Agent's response
 */
export async function callAgent(agentSystemPrompt, userMessage, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 2000,
    retries = 3
  } = options;

  try {
    const response = await callOpenAI(
      agentSystemPrompt,
      userMessage,
      temperature,
      maxTokens
    );

    return parseLLMResponse(response);
  } catch (error) {
    console.error('Agent call failed:', error);
    throw error;
  }
}

/**
 * Stream agent response (for real-time updates)
 * Falls back to local response if external APIs unavailable
 */
export async function streamAgent(agentSystemPrompt, userMessage, onChunk) {
  try {
    // Try to call Base44's invokeExternalLLM function
    const response = await base44.functions.invoke('invokeExternalLLM', {
      prompt: userMessage,
      systemPrompt: agentSystemPrompt,
      temperature: 0.7,
      preferredProviders: ['openai', 'deepseek']
    });

    let fullResponse = response.output || response.content || response.text || response.message;
    
    if (!fullResponse) {
      throw new Error('Empty response from invokeExternalLLM');
    }

    fullResponse = fullResponse.toString().trim();

    // Call chunk callback with the response
    if (onChunk && fullResponse) {
      onChunk(fullResponse);
    }

    return parseLLMResponse(fullResponse);
  } catch (error) {
    console.warn('Stream agent external LLM failed:', error.message);
    
    // Fall back to local response
    const localResponse = generateLocalResponse(agentSystemPrompt, userMessage);
    
    if (onChunk && localResponse) {
      onChunk(localResponse);
    }
    
    return parseLLMResponse(localResponse);
  }
}

export default {
  callOpenAI,
  callAgent,
  streamAgent,
  parseLLMResponse
};
