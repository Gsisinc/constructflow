/**
 * AI Agent Service - FULL TASK EXECUTION
 * Agents now execute actual tasks, not just provide information
 */

import { base44 } from '@/api/base44Client';

class AIAgentService {
  constructor() {
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.claudeApiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    this.claudeBaseUrl = 'https://api.anthropic.com/v1';
  }

  /**
   * Chat with Claude
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
   * Parse JSON from response
   */
  parseJSON(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get current user and organization
   */
  async getCurrentContext() {
    try {
      const user = await base44.auth.me();
      return {
        userId: user.id,
        organizationId: user.organization_id,
        userName: user.full_name || user.email
      };
    } catch (error) {
      console.error('Failed to get user context:', error);
      throw new Error('Unable to get current user');
    }
  }

  /**
   * Market Intelligence Agent - EXECUTES: Finds bids AND creates BidOpportunity records
   */
  async marketIntelligence(query) {
    console.log('🚀 Market Intelligence Agent: Finding and recording bid opportunities...');

    const systemPrompt = `You are a construction bid discovery expert. Respond with ONLY valid JSON:
{
  "opportunities": [
    {
      "title": "Project Name",
      "location": "City, State", 
      "workType": "Type of work",
      "estimatedValue": 1000000,
      "dueDate": "2026-03-15",
      "source": "SAM.GOV or source",
      "winProbability": 65,
      "description": "Project details"
    }
  ]
}`;

    const messages = [{
      role: 'user',
      content: `Find construction bid opportunities for: ${query}. Return minimum 3 realistic opportunities.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const opportunitiesData = this.parseJSON(response);

      if (!opportunitiesData || !opportunitiesData.opportunities || opportunitiesData.opportunities.length === 0) {
        throw new Error('No opportunities generated');
      }

      const context = await this.getCurrentContext();
      const createdOpportunities = [];

      // ✅ TASK EXECUTION: Create BidOpportunity records in database
      for (const opp of opportunitiesData.opportunities) {
        try {
          const bidOpp = await base44.entities.BidOpportunity.create({
            project_name: opp.title,
            location: opp.location,
            work_type: opp.workType,
            estimated_value: opp.estimatedValue,
            due_date: opp.dueDate,
            source: opp.source,
            win_probability: opp.winProbability,
            description: opp.description,
            status: 'opportunity',
            organization_id: context.organizationId,
            created_by: context.userId
          });
          createdOpportunities.push(bidOpp);
          console.log(`✅ Created opportunity: ${opp.title}`);
        } catch (error) {
          console.warn(`⚠️ Failed to create opportunity: ${opp.title}`, error);
        }
      }

      if (createdOpportunities.length === 0) {
        throw new Error('Failed to create any opportunities');
      }

      return {
        success: true,
        message: `✅ Market Intelligence Complete: Found and recorded ${createdOpportunities.length} bid opportunities in your pipeline`,
        count: createdOpportunities.length,
        opportunities: createdOpportunities,
        action: 'opportunities_created'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Market Intelligence Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Bid Package Assembly Agent - EXECUTES: Creates task items for bid submission
   */
  async bidPackageAssembly(projectDetails, projectId) {
    console.log('🚀 Bid Package Assembly Agent: Creating bid submission checklist...');

    const systemPrompt = `You are a bid assembly expert. Respond with ONLY valid JSON:
{
  "checklist": [
    {
      "item": "Specific document/requirement name",
      "category": "Forms|Insurance|Financial|Technical|Legal",
      "priority": "High|Medium|Low",
      "dueInDays": 7,
      "description": "What is needed and why"
    }
  ]
}`;

    const messages = [{
      role: 'user',
      content: `Create a comprehensive bid package checklist for: ${projectDetails}. Include all required documents, insurance, financial, technical, and legal requirements. Return minimum 15 items.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const checklistData = this.parseJSON(response);

      if (!checklistData || !checklistData.checklist || checklistData.checklist.length === 0) {
        throw new Error('No checklist items generated');
      }

      const context = await this.getCurrentContext();
      const createdTasks = [];

      // ✅ TASK EXECUTION: Create Task items in system
      for (const item of checklistData.checklist) {
        try {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (item.dueInDays || 7));

          const task = await base44.entities.Task.create({
            title: item.item,
            description: item.description,
            status: 'open',
            priority: item.priority.toLowerCase(),
            project_id: projectId,
            category: 'bid-package',
            due_date: dueDate.toISOString(),
            organization_id: context.organizationId,
            created_by: context.userId,
            tags: [item.category]
          });
          createdTasks.push(task);
          console.log(`✅ Created task: ${item.item}`);
        } catch (error) {
          console.warn(`⚠️ Failed to create task: ${item.item}`, error);
        }
      }

      if (createdTasks.length === 0) {
        throw new Error('Failed to create any tasks');
      }

      return {
        success: true,
        message: `✅ Bid Package Complete: Created ${createdTasks.length} submission tasks in your project`,
        count: createdTasks.length,
        tasks: createdTasks,
        action: 'bid_package_created'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Bid Package Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Proposal Generation Agent - EXECUTES: Generates proposal AND creates document record
   */
  async proposalGeneration(scope, clientInfo, projectId) {
    console.log('🚀 Proposal Generation Agent: Generating and recording proposal...');

    const systemPrompt = `You are an expert proposal writer for construction companies. Generate a professional, detailed proposal with these sections formatted clearly:

# Executive Summary
# Project Approach & Methodology
# Project Schedule & Timeline
# Team Qualifications
# Pricing & Cost Structure
# Risk Management
# Quality Assurance`;

    const messages = [{
      role: 'user',
      content: `Generate a comprehensive, professional proposal for:
Project Scope: ${scope}
Client Information: ${clientInfo}

Make it detailed, professional, and ready for client submission.`
    }];

    try {
      const proposalText = await this.chatWithClaude(messages, systemPrompt);

      if (!proposalText || proposalText.length < 500) {
        throw new Error('Generated proposal is too short');
      }

      const context = await this.getCurrentContext();

      // ✅ TASK EXECUTION: Create proposal document record
      const document = await base44.entities.Document.create({
        title: `Proposal - ${clientInfo}`,
        content: proposalText,
        type: 'proposal',
        project_id: projectId,
        status: 'draft',
        organization_id: context.organizationId,
        created_by: context.userId,
        created_date: new Date().toISOString()
      });

      console.log(`✅ Created proposal document: ${document.id}`);

      // ✅ TASK EXECUTION: Create review task
      const reviewTask = await base44.entities.Task.create({
        title: `Review & Finalize Proposal for ${clientInfo}`,
        description: 'Review the generated proposal, make any necessary edits, and prepare for client submission',
        project_id: projectId,
        status: 'open',
        priority: 'high',
        category: 'proposal-review',
        organization_id: context.organizationId,
        created_by: context.userId,
        related_document_id: document.id
      });

      console.log(`✅ Created review task: ${reviewTask.id}`);

      return {
        success: true,
        message: `✅ Proposal Complete: Generated and saved proposal document. Review task created.`,
        document: document,
        reviewTask: reviewTask,
        proposalLength: proposalText.length,
        action: 'proposal_created'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Proposal Generation Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Risk Prediction Agent - EXECUTES: Analyzes risks AND creates Risk records + mitigation tasks
   */
  async riskPrediction(projectDetails, projectId) {
    console.log('🚀 Risk Prediction Agent: Analyzing and recording project risks...');

    const systemPrompt = `You are a construction risk management expert. Analyze risks and respond with ONLY valid JSON:
{
  "risks": [
    {
      "title": "Risk name",
      "description": "Detailed description of what could go wrong",
      "probability": "High|Medium|Low",
      "impact": "High|Medium|Low",
      "mitigation": "Specific mitigation strategy",
      "earlyWarningSignals": ["indicator 1", "indicator 2"]
    }
  ]
}`;

    const messages = [{
      role: 'user',
      content: `Analyze all risks for this project: ${projectDetails}. Be comprehensive and identify minimum 8 potential risks across schedule, budget, technical, resource, regulatory, and external categories.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const riskData = this.parseJSON(response);

      if (!riskData || !riskData.risks || riskData.risks.length === 0) {
        throw new Error('No risks identified');
      }

      const context = await this.getCurrentContext();
      const createdRisks = [];
      const createdTasks = [];

      // ✅ TASK EXECUTION: Create Risk records and mitigation tasks
      for (const risk of riskData.risks) {
        try {
          const riskRecord = await base44.entities.Risk.create({
            title: risk.title,
            description: risk.description,
            probability: risk.probability.toLowerCase(),
            impact: risk.impact.toLowerCase(),
            mitigation_strategy: risk.mitigation,
            early_warning_signals: risk.earlyWarningSignals?.join('; ') || '',
            project_id: projectId,
            status: 'open',
            organization_id: context.organizationId,
            created_by: context.userId
          });

          console.log(`✅ Created risk: ${risk.title}`);
          createdRisks.push(riskRecord);

          // Create mitigation task
          const mitigationTask = await base44.entities.Task.create({
            title: `Mitigate Risk: ${risk.title}`,
            description: `Strategy: ${risk.mitigation}\n\nEarly Warning Signs: ${risk.earlyWarningSignals?.join(', ') || 'Monitor project closely'}`,
            project_id: projectId,
            priority: risk.impact.toLowerCase(),
            category: 'risk-mitigation',
            status: 'open',
            organization_id: context.organizationId,
            created_by: context.userId,
            related_risk_id: riskRecord.id
          });

          console.log(`✅ Created mitigation task for: ${risk.title}`);
          createdTasks.push(mitigationTask);
        } catch (error) {
          console.warn(`⚠️ Failed to create risk: ${risk.title}`, error);
        }
      }

      if (createdRisks.length === 0) {
        throw new Error('Failed to create any risk records');
      }

      return {
        success: true,
        message: `✅ Risk Analysis Complete: Identified ${createdRisks.length} risks and created ${createdTasks.length} mitigation tasks`,
        risksCount: createdRisks.length,
        tasksCount: createdTasks.length,
        risks: createdRisks,
        tasks: createdTasks,
        action: 'risk_analysis_complete'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Risk Analysis Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Quality Assurance Agent - EXECUTES: Creates QA plan and inspection tasks
   */
  async qualityAssurance(projectPhase, specifications, projectId) {
    console.log('🚀 Quality Assurance Agent: Creating QA plan and inspection checklist...');

    const systemPrompt = `You are a construction QA expert. Respond with ONLY valid JSON:
{
  "qaItems": [
    {
      "item": "What to inspect",
      "phase": "Construction phase when inspection occurs",
      "criteria": "Pass/fail acceptance criteria",
      "frequency": "When to inspect (daily, weekly, milestone)",
      "inspector": "Who should inspect (trades person, foreman, QA engineer)",
      "documentation": "How to document the inspection"
    }
  ]
}`;

    const messages = [{
      role: 'user',
      content: `Create a comprehensive QA plan for the ${projectPhase} phase with specifications: ${specifications}. Include minimum 12 inspection points with clear acceptance criteria and documentation requirements.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const qaData = this.parseJSON(response);

      if (!qaData || !qaData.qaItems || qaData.qaItems.length === 0) {
        throw new Error('No QA items generated');
      }

      const context = await this.getCurrentContext();
      const createdTasks = [];

      // ✅ TASK EXECUTION: Create inspection tasks
      for (const item of qaData.qaItems) {
        try {
          const task = await base44.entities.Task.create({
            title: `QA Inspection: ${item.item}`,
            description: `Phase: ${item.phase}\nCriteria: ${item.criteria}\nFrequency: ${item.frequency}\nInspector: ${item.inspector}\nDocumentation: ${item.documentation}`,
            project_id: projectId,
            category: 'quality-assurance',
            priority: 'high',
            status: 'open',
            organization_id: context.organizationId,
            created_by: context.userId,
            tags: ['QA', item.phase]
          });
          createdTasks.push(task);
          console.log(`✅ Created QA task: ${item.item}`);
        } catch (error) {
          console.warn(`⚠️ Failed to create QA task: ${item.item}`, error);
        }
      }

      if (createdTasks.length === 0) {
        throw new Error('Failed to create any QA tasks');
      }

      return {
        success: true,
        message: `✅ QA Plan Complete: Created ${createdTasks.length} inspection tasks for ${projectPhase} phase`,
        count: createdTasks.length,
        tasks: createdTasks,
        action: 'qa_plan_created'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ QA Plan Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Safety Compliance Agent - EXECUTES: Creates safety plan and training tasks
   */
  async safetyCompliance(projectType, hazards, projectId) {
    console.log('🚀 Safety Compliance Agent: Creating safety plan and training requirements...');

    const systemPrompt = `You are a construction safety expert. Respond with ONLY valid JSON:
{
  "safetyPlan": {
    "hazards": ["list of identified hazards"],
    "controls": ["control measures for each hazard"],
    "trainings": [
      {
        "training": "Training course name",
        "reason": "Why it's required",
        "duration": "hours needed",
        "frequency": "How often refresher needed"
      }
    ],
    "ppe": ["Required PPE items"],
    "emergencyProcedures": ["Emergency response procedures"]
  }
}`;

    const messages = [{
      role: 'user',
      content: `Create comprehensive safety plan for ${projectType} project with these hazards: ${hazards}. Include all required trainings, PPE, and emergency procedures.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const safetyData = this.parseJSON(response)?.safetyPlan;

      if (!safetyData) {
        throw new Error('Invalid safety plan generated');
      }

      const context = await this.getCurrentContext();
      const createdTasks = [];

      // ✅ TASK EXECUTION: Create safety training and prep tasks
      // Create training tasks
      if (safetyData.trainings && safetyData.trainings.length > 0) {
        for (const training of safetyData.trainings) {
          try {
            const trainingTask = await base44.entities.Task.create({
              title: `Complete Training: ${training.training}`,
              description: `Required for: ${training.reason}\nDuration: ${training.duration} hours\nRefresher Frequency: ${training.frequency}`,
              project_id: projectId,
              category: 'safety-training',
              priority: 'high',
              status: 'open',
              organization_id: context.organizationId,
              created_by: context.userId
            });
            createdTasks.push(trainingTask);
            console.log(`✅ Created training task: ${training.training}`);
          } catch (error) {
            console.warn(`⚠️ Failed to create training: ${training.training}`, error);
          }
        }
      }

      // Create safety prep task
      const prepTask = await base44.entities.Task.create({
        title: `Pre-Project Safety Preparation & Briefing`,
        description: `Hazards: ${safetyData.hazards?.join(', ')}\nControls: ${safetyData.controls?.join('; ')}\nRequired PPE: ${safetyData.ppe?.join(', ')}\nEmergency Procedures: ${safetyData.emergencyProcedures?.join('; ')}`,
        project_id: projectId,
        category: 'safety-prep',
        priority: 'high',
        status: 'open',
        organization_id: context.organizationId,
        created_by: context.userId
      });
      createdTasks.push(prepTask);

      if (createdTasks.length === 0) {
        throw new Error('Failed to create safety tasks');
      }

      return {
        success: true,
        message: `✅ Safety Plan Complete: Created ${createdTasks.length} safety and training tasks`,
        count: createdTasks.length,
        safetyPlan: safetyData,
        tasks: createdTasks,
        action: 'safety_plan_created'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Safety Plan Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Regulatory Intelligence Agent - EXECUTES: Identifies permits and creates tracking tasks
   */
  async regulatoryIntelligence(projectType, location, projectId) {
    console.log('🚀 Regulatory Intelligence Agent: Identifying permits and creating tracking...');

    const systemPrompt = `You are a construction regulatory expert. Respond with ONLY valid JSON:
{
  "permits": [
    {
      "name": "Permit type name",
      "agency": "Issuing government agency",
      "processingDays": 14,
      "estimatedCost": 2500,
      "requirements": ["Required documents/items"],
      "criticality": "Critical|Important|Standard"
    }
  ]
}`;

    const messages = [{
      role: 'user',
      content: `What permits and regulatory approvals are required for a ${projectType} project in ${location}? Include building permits, environmental, electrical, mechanical, and any specialized permits. Return minimum 8 permits.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const permitsData = this.parseJSON(response)?.permits || [];

      if (permitsData.length === 0) {
        throw new Error('No permits identified');
      }

      const context = await this.getCurrentContext();
      const createdTasks = [];

      // ✅ TASK EXECUTION: Create permit tracking tasks
      for (const permit of permitsData) {
        try {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (permit.processingDays || 30));

          const task = await base44.entities.Task.create({
            title: `Obtain Permit: ${permit.name}`,
            description: `Agency: ${permit.agency}\nProcessing Time: ${permit.processingDays} days\nEstimated Cost: $${permit.estimatedCost}\nRequired: ${permit.requirements?.join(', ')}`,
            project_id: projectId,
            category: 'permits',
            priority: permit.criticality.toLowerCase() === 'critical' ? 'high' : 'medium',
            status: 'open',
            due_date: dueDate.toISOString(),
            organization_id: context.organizationId,
            created_by: context.userId,
            tags: ['Permit', permit.agency]
          });
          createdTasks.push(task);
          console.log(`✅ Created permit tracking: ${permit.name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to create permit task: ${permit.name}`, error);
        }
      }

      if (createdTasks.length === 0) {
        throw new Error('Failed to create permit tracking tasks');
      }

      return {
        success: true,
        message: `✅ Regulatory Analysis Complete: Identified ${permitsData.length} permits and created ${createdTasks.length} tracking tasks`,
        permitCount: permitsData.length,
        taskCount: createdTasks.length,
        permits: permitsData,
        tasks: createdTasks,
        action: 'permits_identified'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Regulatory Analysis Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Central Orchestrator - EXECUTES: Coordinates multiple agents and creates workflow
   */
  async orchestrateAgents(task, agentNames, projectId) {
    console.log('🚀 Central Orchestrator: Coordinating agent execution...');

    const systemPrompt = `You are a construction project orchestrator. Create a detailed workflow plan. Respond with JSON:
{
  "workflow": [
    {
      "phase": "Phase name",
      "agent": "Agent to execute",
      "tasks": ["specific tasks to execute"],
      "dependencies": ["phases that must complete first"],
      "duration": "estimated duration",
      "criticality": "Critical|Important"
    }
  ]
}`;

    const messages = [{
      role: 'user',
      content: `Create project workflow for: ${task}. Use these agents: ${agentNames.join(', ')}. Create realistic phases with dependencies and timelines.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const workflowData = this.parseJSON(response);

      if (!workflowData || !workflowData.workflow) {
        throw new Error('Invalid workflow generated');
      }

      const context = await this.getCurrentContext();
      const createdTasks = [];

      // ✅ TASK EXECUTION: Create workflow phase tasks
      for (const phase of workflowData.workflow) {
        try {
          const phaseTask = await base44.entities.Task.create({
            title: `[${phase.phase}] - Execute: ${phase.agent}`,
            description: `Agent: ${phase.agent}\nTasks: ${phase.tasks?.join(', ')}\nDependencies: ${phase.dependencies?.join(', ') || 'None'}\nDuration: ${phase.duration}`,
            project_id: projectId,
            category: 'orchestration',
            priority: phase.criticality.toLowerCase(),
            status: 'open',
            organization_id: context.organizationId,
            created_by: context.userId
          });
          createdTasks.push(phaseTask);
          console.log(`✅ Created workflow phase: ${phase.phase}`);
        } catch (error) {
          console.warn(`⚠️ Failed to create workflow phase: ${phase.phase}`, error);
        }
      }

      if (createdTasks.length === 0) {
        throw new Error('Failed to create workflow tasks');
      }

      return {
        success: true,
        message: `✅ Orchestration Complete: Created ${createdTasks.length} workflow phases coordinating ${agentNames.length} agents`,
        workflow: workflowData.workflow,
        tasks: createdTasks,
        action: 'workflow_orchestrated'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Orchestration Failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

export default new AIAgentService();

