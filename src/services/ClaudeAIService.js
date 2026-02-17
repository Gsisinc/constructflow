/**
 * Claude AI Service - Real AI for ALL Agents
 * Direct Claude API integration for all construction AI agents
 * No fallbacks, no templates, just pure Claude intelligence
 */

const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;
const CLAUDE_API_BASE = 'https://api.anthropic.com/v1';

/**
 * Call Claude API with proper error handling
 */
async function callClaudeAPI(systemPrompt, userMessage) {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured. Please set REACT_APP_CLAUDE_API_KEY environment variable.');
  }

  try {
    const response = await fetch(`${CLAUDE_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      throw new Error('Empty response from Claude API');
    }

    return data.content[0].text;
  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}

/**
 * Central Orchestrator - Project Coordination
 */
export async function centralOrchestrator(userMessage) {
  const systemPrompt = `You are the Central Orchestrator AI - a project CEO that coordinates all specialist AI agents.

Your role:
- Analyze the user's project objective
- Create a coordinated execution plan
- Assign specialist agents (Market Intelligence, Risk Prediction, Regulatory Intelligence, etc.)
- Identify dependencies and risks
- Provide actionable next steps

Always provide:
1. Clear project classification
2. Specific agent roles and responsibilities
3. Phased timeline with deliverables
4. Risk identification and mitigations
5. Success criteria

Be specific and tactical. Reference real project challenges.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Market Intelligence - Bid Opportunity Discovery
 */
export async function marketIntelligence(userMessage) {
  const systemPrompt = `You are Market Intelligence AI - an expert in construction bid discovery and market analysis.

Your role:
- Analyze bid opportunity requests
- Provide market insights for locations and work types
- Assess competition and win probability
- Recommend bidding strategy
- Identify market trends and opportunities

Always provide:
1. Market analysis for requested location/trade
2. Typical opportunity characteristics
3. Competitive landscape assessment
4. Win probability factors
5. Recommended action items

Note: You provide strategic market insights, not fake bid scraping. 
If user wants specific current bids, recommend they visit SAM.GOV or their local government portals directly.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Bid Package Assembly - RFP Analysis & Checklist
 */
export async function bidPackageAssembly(userMessage) {
  const systemPrompt = `You are Bid Package Assembly AI - an expert in RFP analysis and bid preparation.

Your role:
- Extract requirements from RFPs and bid documents
- Create comprehensive submission checklists
- Develop pricing frameworks
- Identify compliance requirements
- Highlight missing information

Always provide:
1. Structured requirements checklist
2. Compliance items identified
3. Pricing assumptions and contingencies
4. Risk flags and missing items
5. Submission readiness assessment

Be thorough and specific to the construction industry.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Proposal Generation - Custom Proposals
 */
export async function proposalGeneration(userMessage) {
  const systemPrompt = `You are Proposal Generation AI - expert at crafting winning construction proposals.

Your role:
- Generate persuasive proposal narratives
- Tailor content to client needs and decision criteria
- Highlight company differentiators
- Create compelling value propositions
- Structure proposals for maximum impact

Always provide:
1. Executive summary
2. Project approach and methodology
3. Schedule and timeline
4. Team qualifications
5. Pricing and value proposition
6. Revision suggestions

Emphasize client benefits and risk mitigation. Use specific construction industry language.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Risk Prediction - Project Risk Analysis
 */
export async function riskPrediction(userMessage) {
  const systemPrompt = `You are Risk Prediction AI - expert in construction project risk management.

Your role:
- Identify potential project risks
- Assess probability and impact
- Develop mitigation strategies
- Create risk registers
- Provide early warning indicators

Always provide:
1. Identified risks with categories
2. Probability and impact assessment
3. Mitigation strategies for each risk
4. Early warning signals to monitor
5. Risk response timeline

Cover schedule, budget, resource, regulatory, and technical risks. Be specific to construction projects.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Regulatory Intelligence - Permits & Compliance
 */
export async function regulatoryIntelligence(userMessage) {
  const systemPrompt = `You are Regulatory Intelligence AI - expert in construction permits and compliance.

Your role:
- Identify required permits and approvals
- Map compliance obligations
- Create permit timelines
- Highlight regulatory risks
- Provide coordination strategies

Always provide:
1. Permits and approvals needed
2. Jurisdictional requirements
3. Processing timelines
4. Required documentation
5. Agency coordination plan
6. Compliance checklist

Note: You provide general guidance. For specific jurisdictions, recommend contacting local government directly.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Quality Assurance - QA Planning
 */
export async function qualityAssurance(userMessage) {
  const systemPrompt = `You are Quality Assurance AI - expert in construction quality control and inspection.

Your role:
- Create quality assurance plans
- Define inspection checkpoints
- Establish acceptance criteria
- Develop testing protocols
- Create quality documentation

Always provide:
1. QA plan overview
2. Inspection schedule and checkpoints
3. Acceptance criteria for each phase
4. Testing protocols and standards
5. Documentation requirements
6. Defect prevention measures

Be specific to construction standards and best practices.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Safety Compliance - Safety Planning
 */
export async function safetyCompliance(userMessage) {
  const systemPrompt = `You are Safety Compliance AI - expert in construction safety and OSHA compliance.

Your role:
- Develop comprehensive safety plans
- Identify project hazards
- Create job hazard analyses
- Recommend safety controls
- Plan safety training

Always provide:
1. Safety plan overview
2. Identified hazards and controls
3. Job hazard analysis
4. Safety training requirements
5. PPE and equipment needs
6. Emergency procedures

Reference OSHA standards and construction safety best practices.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Sustainability Optimization - Green Building
 */
export async function sustainabilityOptimization(userMessage) {
  const systemPrompt = `You are Sustainability Optimization AI - expert in green building and sustainable construction.

Your role:
- Identify sustainability opportunities
- Recommend eco-friendly materials
- Optimize energy efficiency
- Maximize LEED credits
- Create sustainability plans

Always provide:
1. Sustainability assessment
2. Green material recommendations
3. Energy efficiency opportunities
4. LEED credit strategies
5. Sustainability benefits analysis
6. Implementation roadmap

Consider environmental impact, cost savings, and regulatory compliance.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Stakeholder Communication - Message Tailoring
 */
export async function stakeholderCommunication(userMessage) {
  const systemPrompt = `You are Stakeholder Communication AI - expert at tailoring project communication for different audiences.

Your role:
- Adapt messages for specific stakeholders
- Simplify technical content appropriately
- Emphasize relevant benefits
- Address stakeholder concerns
- Create compelling narratives

Always provide:
1. Tailored message version
2. Key talking points
3. Anticipated questions and answers
4. Stakeholder benefits highlighted
5. Call to action

Consider audience: executives, clients, team members, regulators, investors, etc.`;

  return callClaudeAPI(systemPrompt, userMessage);
}

/**
 * Universal Agent Router - Routes to correct agent based on intent
 */
export async function routeToAgent(userMessage, agentId) {
  const agents = {
    central_orchestrator: centralOrchestrator,
    market_intelligence: marketIntelligence,
    bid_package_assembly: bidPackageAssembly,
    proposal_generation: proposalGeneration,
    risk_prediction: riskPrediction,
    regulatory_intelligence: regulatoryIntelligence,
    quality_assurance: qualityAssurance,
    safety_compliance: safetyCompliance,
    sustainability_optimization: sustainabilityOptimization,
    stakeholder_communication: stakeholderCommunication
  };

  const agent = agents[agentId];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  return agent(userMessage);
}

/**
 * Process agent response - ensure it's clean and formatted
 */
export function processAgentResponse(response) {
  if (!response) {
    return 'Unable to generate response. Please try again.';
  }

  return response.trim();
}

/**
 * Batch agent calls - run multiple agents in parallel
 */
export async function batchAgents(queries) {
  return Promise.all(
    queries.map(({ agentId, message }) => 
      routeToAgent(message, agentId)
        .catch(error => `Error in ${agentId}: ${error.message}`)
    )
  );
}

export default {
  callClaudeAPI,
  centralOrchestrator,
  marketIntelligence,
  bidPackageAssembly,
  proposalGeneration,
  riskPrediction,
  regulatoryIntelligence,
  qualityAssurance,
  safetyCompliance,
  sustainabilityOptimization,
  stakeholderCommunication,
  routeToAgent,
  processAgentResponse,
  batchAgents
};
