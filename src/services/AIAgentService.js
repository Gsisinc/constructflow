/**
 * AI Agent Service
 * Handles integration with OpenAI and Claude APIs
 */

class AIAgentService {
  constructor() {
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.claudeApiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1';
    this.claudeBaseUrl = 'https://api.anthropic.com/v1';
  }

  /**
   * Chat with OpenAI GPT-4
   */
  async chatWithOpenAI(messages, systemPrompt = '') {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: systemPrompt ? [
            { role: 'system', content: systemPrompt },
            ...messages
          ] : messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Chat with Claude (Anthropic)
   */
  async chatWithClaude(messages, systemPrompt = '') {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      const response = await fetch(`${this.claudeBaseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 2000,
          system: systemPrompt,
          messages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Market Intelligence Agent - Find bids
   */
  async marketIntelligence(query) {
    const systemPrompt = `You are a construction bid discovery expert. Help find and analyze construction bids and opportunities. Provide detailed information about bids including location, budget, timeline, and relevance.`;

    const messages = [
      {
        role: 'user',
        content: `Find construction bids matching: ${query}. Include details about location, estimated budget, timeline, and win probability.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Bid Package Assembly Agent
   */
  async bidPackageAssembly(projectDetails) {
    const systemPrompt = `You are an expert at assembling bid packages. Help organize RFP requirements, create checklists, and identify missing documents.`;

    const messages = [
      {
        role: 'user',
        content: `Help assemble a bid package for: ${projectDetails}. Create a checklist of required documents and identify potential gaps.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Proposal Generation Agent
   */
  async proposalGeneration(projectScope, clientInfo) {
    const systemPrompt = `You are an expert proposal writer for construction companies. Create compelling, professional proposals that highlight strengths and address client needs.`;

    const messages = [
      {
        role: 'user',
        content: `Generate a proposal outline for a project with scope: ${projectScope}. Client info: ${clientInfo}. Include executive summary, methodology, timeline, and pricing structure suggestions.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Regulatory Intelligence Agent
   */
  async regulatoryIntelligence(projectType, location) {
    const systemPrompt = `You are a construction regulatory compliance expert. Provide detailed information about permits, codes, and regulations.`;

    const messages = [
      {
        role: 'user',
        content: `What are the key regulatory requirements for a ${projectType} project in ${location}? Include permits, building codes, and AHJ coordination needs.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Risk Prediction Agent
   */
  async riskPrediction(projectDetails) {
    const systemPrompt = `You are a construction risk management expert. Identify potential risks, assess probability and impact, and suggest mitigation strategies.`;

    const messages = [
      {
        role: 'user',
        content: `Analyze risks for this project: ${projectDetails}. Provide a risk assessment with early warning indicators and mitigation strategies.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Quality Assurance Agent
   */
  async qualityAssurance(projectPhase, specifications) {
    const systemPrompt = `You are a construction quality control expert. Define quality standards, inspection checklists, and defect prevention measures.`;

    const messages = [
      {
        role: 'user',
        content: `Create a quality assurance plan for ${projectPhase} phase with these specs: ${specifications}. Include inspection points and quality standards.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Safety Compliance Agent
   */
  async safetyCompliance(projectType, hazards) {
    const systemPrompt = `You are a construction safety expert. Develop comprehensive safety plans, identify hazards, and create job hazard analyses.`;

    const messages = [
      {
        role: 'user',
        content: `Create a safety plan for a ${projectType} project with these hazards: ${hazards}. Include JHA, safety controls, and training requirements.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Sustainability Optimization Agent
   */
  async sustainabilityOptimization(projectScope) {
    const systemPrompt = `You are a green building and sustainability expert. Suggest eco-friendly materials, energy-efficient methods, and LEED strategies.`;

    const messages = [
      {
        role: 'user',
        content: `Optimize sustainability for: ${projectScope}. Suggest green materials, energy efficiency improvements, and LEED credit opportunities.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Stakeholder Communication Agent
   */
  async stakeholderCommunication(message, audience) {
    const systemPrompt = `You are an expert at construction communication. Tailor messages for different audiences (clients, teams, executives) with appropriate technical depth.`;

    const messages = [
      {
        role: 'user',
        content: `Rephrase this message for ${audience}: "${message}". Adjust technical depth and tone appropriately.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }

  /**
   * Central Orchestrator - Coordinate multiple agents
   */
  async orchestrateAgents(task, agents = []) {
    const systemPrompt = `You are the central orchestrator managing multiple specialized AI agents. Coordinate their activities, track dependencies, and ensure holistic project management.`;

    const messages = [
      {
        role: 'user',
        content: `Orchestrate these agents for task: ${task}. Agents involved: ${agents.join(', ')}. Provide coordination strategy and workflow.`
      }
    ];

    return await this.chatWithClaude(messages, systemPrompt);
  }
}

export default new AIAgentService();
