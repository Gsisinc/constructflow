/**
 * Advanced AI Agent Service - FULL TASK EXECUTION + ANALYSIS
 * Agents with scraping, document analysis, drawing analysis, and design capabilities
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
   * Market Intelligence Agent - REALISTIC VERSION
   * Does NOT fabricate bids. Only provides real market information or direct links.
   */
  async marketIntelligence(query) {
    console.log('🔍 Market Intelligence: Searching for real bid opportunities...');

    const systemPrompt = `You are a construction market analyst. 
IMPORTANT: You CANNOT access SAM.GOV or bid databases in real-time.
You CANNOT fabricate bids or create fake opportunities.

You CAN provide:
1. Real links to where bids are found (SAM.GOV, County portals)
2. General market analysis based on public information
3. Guidance on how to find opportunities

Be honest about limitations. Do NOT make up fake bids.`;

    const messages = [{
      role: 'user',
      content: `Market analysis for: ${query}

Provide:
1. Where to find real bids (SAM.GOV, county portals, etc)
2. General market insights
3. How to search effectively

Do NOT fabricate or make up fake opportunities.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);

      return {
        success: true,
        message: `📊 Market Intelligence Analysis:\n\n${response}\n\n⚠️ NOTE: These are real sources and guidance. For actual bids, visit the portals directly.`,
        type: 'market_analysis',
        action: 'market_intelligence'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error analyzing market: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Bid Document Analysis Agent - ANALYZES documents you upload
   * Only creates records if YOU upload actual documents
   */
  async analyzeBidDocument(bidDocumentContent, bidId) {
    console.log('📄 Bid Document Analysis: Analyzing uploaded document...');

    const systemPrompt = `You are an expert RFP and bid document analyzer. Extract ALL requirements and specifications.
Return ONLY valid JSON:
{
  "requirements": [
    {
      "category": "General|Technical|Insurance|Financial|Schedule|Safety|Legal|Submittals",
      "requirement": "Requirement name",
      "description": "Full requirement details",
      "isOptional": false,
      "priority": "Critical|High|Medium|Low",
      "deadline": "When due",
      "section": "Document section where found"
    }
  ],
  "specifications": [
    {
      "item": "What is specified",
      "value": "Required value or spec",
      "unit": "Unit (feet, PSI, etc)",
      "tolerance": "Acceptable range",
      "material": "Material type if applicable"
    }
  ],
  "summary": {
    "totalRequirements": 45,
    "criticalities": "Count of critical items",
    "scope": "Project scope from document",
    "budget": "Budget if mentioned"
  }
}`;

    const messages = [{
      role: 'user',
      content: `Analyze this bid/RFP document and extract ALL requirements:

${bidDocumentContent}

Extract:
- Every requirement (general, technical, insurance, financial, schedule, safety, legal, submittals)
- All specifications with values and tolerances
- Material requirements
- Timeline and deadlines
- Budget constraints
- Scope details

Be thorough and detailed. Return every requirement.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const analysisData = this.parseJSON(response);

      if (!analysisData || !analysisData.requirements) {
        throw new Error('Invalid analysis response');
      }

      const context = await this.getCurrentContext();
      const createdRequirements = [];
      const createdSpecs = [];

      // ✅ EXECUTE: Create Requirement records - AUTO-POPULATE in requirements section
      for (const req of analysisData.requirements) {
        try {
          const requirement = await base44.entities.Requirement.create({
            bid_id: bidId,
            category: req.category,
            requirement_name: req.requirement,
            description: req.description,
            is_optional: req.isOptional || false,
            priority: req.priority.toLowerCase(),
            deadline: req.deadline,
            section_reference: req.section,
            organization_id: context.organizationId,
            created_by: context.userId,
            status: 'open',
            auto_populated: true
          });
          createdRequirements.push(requirement);
          console.log(`✅ Auto-populated requirement: ${req.requirement}`);
        } catch (error) {
          console.warn(`Failed to create requirement: ${req.requirement}`, error);
        }
      }

      // ✅ EXECUTE: Create Specification records
      if (analysisData.specifications && analysisData.specifications.length > 0) {
        for (const spec of analysisData.specifications) {
          try {
            const specification = await base44.entities.Specification.create({
              bid_id: bidId,
              item: spec.item,
              value: spec.value,
              unit: spec.unit,
              tolerance: spec.tolerance,
              material: spec.material,
              organization_id: context.organizationId,
              created_by: context.userId
            });
            createdSpecs.push(specification);
            console.log(`✅ Auto-populated spec: ${spec.item}`);
          } catch (error) {
            console.warn(`Failed to create spec: ${spec.item}`, error);
          }
        }
      }

      return {
        success: true,
        message: `✅ Bid Analysis Complete: Extracted ${createdRequirements.length} requirements and ${createdSpecs.length} specifications, auto-populated in bid page`,
        requirementsCount: createdRequirements.length,
        specificationsCount: createdSpecs.length,
        requirements: createdRequirements,
        specifications: createdSpecs,
        summary: analysisData.summary,
        action: 'bid_analyzed_autopopulated'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Bid Analysis Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * ADVANCED: Drawing Analysis Agent - EXTRACTS Measurements & Creates EDITABLE Takeoff
   */
  async analyzeDrawing(drawingContent, drawingName, projectId) {
    console.log('🚀 Drawing Analysis: Extracting measurements and creating takeoff estimate...');

    const systemPrompt = `You are an expert construction estimator and takeoff specialist. Analyze drawings and extract all measurements.
Return ONLY valid JSON:
{
  "measurements": [
    {
      "item": "What is measured",
      "description": "Item description",
      "quantity": 1500,
      "unit": "LF|SF|CY|EA|Tons|Gallons",
      "materialType": "Material specifications",
      "location": "Location on drawing",
      "notes": "Special conditions or notes"
    }
  ],
  "takeoff": {
    "totalArea": 5000,
    "linearFeet": 1500,
    "squareFeet": 5000,
    "cubicYards": 150,
    "otherUnits": "Any other units found"
  },
  "estimateBreakdown": {
    "laborHours": 1200,
    "laborCost": 84000,
    "materialsEstimate": 250000,
    "equipmentCost": 50000,
    "subtotal": 384000,
    "contingency": "10-15%",
    "estimatedTotal": 422400
  }
}`;

    const messages = [{
      role: 'user',
      content: `Extract all measurements from this construction drawing for detailed takeoff:

${drawingContent}

Extract:
- Every dimension, measurement, and quantity
- Material specifications
- Location references
- Special conditions
- Calculate totals for all units
- Estimate labor hours and costs
- Estimate material costs

Provide detailed, accurate takeoff ready for editing.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const drawingData = this.parseJSON(response);

      if (!drawingData || !drawingData.measurements) {
        throw new Error('Invalid drawing analysis');
      }

      const context = await this.getCurrentContext();
      const createdMeasurements = [];

      // ✅ EXECUTE: Create Measurement records - EDITABLE in system
      for (const measurement of drawingData.measurements) {
        try {
          const measure = await base44.entities.Measurement.create({
            project_id: projectId,
            drawing_name: drawingName,
            item: measurement.item,
            description: measurement.description,
            quantity: measurement.quantity,
            unit: measurement.unit,
            material_type: measurement.materialType,
            location: measurement.location,
            notes: measurement.notes,
            organization_id: context.organizationId,
            created_by: context.userId,
            status: 'extracted',
            editable: true
          });
          createdMeasurements.push(measure);
          console.log(`✅ Extracted: ${measurement.item} - ${measurement.quantity} ${measurement.unit}`);
        } catch (error) {
          console.warn(`Failed to create measurement: ${measurement.item}`, error);
        }
      }

      // ✅ EXECUTE: Create EDITABLE Estimate record
      const estimate = await base44.entities.Estimate.create({
        project_id: projectId,
        source: 'drawing_analysis',
        source_drawing: drawingName,
        total_area: drawingData.takeoff.totalArea,
        linear_feet: drawingData.takeoff.linearFeet,
        square_feet: drawingData.takeoff.squareFeet,
        cubic_yards: drawingData.takeoff.cubicYards,
        estimated_labor_hours: drawingData.estimateBreakdown.laborHours,
        estimated_labor_cost: drawingData.estimateBreakdown.laborCost,
        estimated_materials: drawingData.estimateBreakdown.materialsEstimate,
        estimated_equipment: drawingData.estimateBreakdown.equipmentCost,
        subtotal: drawingData.estimateBreakdown.subtotal,
        contingency_percentage: drawingData.estimateBreakdown.contingency,
        total_estimate: drawingData.estimateBreakdown.estimatedTotal,
        organization_id: context.organizationId,
        created_by: context.userId,
        status: 'draft',
        editable: true
      });

      console.log(`✅ Created editable takeoff estimate`);

      return {
        success: true,
        message: `✅ Drawing Analysis Complete: Extracted ${createdMeasurements.length} measurements, created editable takeoff estimate ($${drawingData.estimateBreakdown.estimatedTotal?.toLocaleString()})`,
        measurementsCount: createdMeasurements.length,
        measurements: createdMeasurements,
        estimate: estimate,
        estimateTotal: drawingData.estimateBreakdown.estimatedTotal,
        takeoffSummary: drawingData.takeoff,
        action: 'drawing_analyzed_editable'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Drawing Analysis Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * ADVANCED: Detailed Bid Analysis Agent - COMPREHENSIVE Analysis of Bid Documents
   */
  async detailedBidAnalysis(bidContent, bidId) {
    console.log('🚀 Detailed Bid Analysis: Comprehensive analysis underway...');

    const systemPrompt = `You are a construction bid strategy expert. Perform comprehensive analysis of bid documents.
Return ONLY valid JSON:
{
  "analysis": {
    "bidType": "Public|Private|Government|Design-Build",
    "complexityScore": 75,
    "riskLevel": "High|Medium|Low",
    "estimatedTimeToCompete": "4-6 weeks",
    "keyRisks": ["Risk 1", "Risk 2", "Risk 3"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "competitiveLandscape": "Analysis of competition",
    "winProbability": 60,
    "strategicRecommendation": "Overall strategy recommendation"
  },
  "detailedAnalysis": {
    "scope": "Detailed scope analysis",
    "timeline": "Timeline analysis and risks",
    "budget": "Budget analysis and risks",
    "resources": "Resource requirements analysis",
    "technicalChallenges": "Technical challenges identified"
  },
  "recommendations": [
    {
      "area": "Staffing|Subcontractors|Resources|Strategy|Risk Management",
      "recommendation": "Specific recommendation",
      "priority": "Critical|High|Medium",
      "estimatedCost": 50000,
      "rationale": "Why this is important"
    }
  ]
}`;

    const messages = [{
      role: 'user',
      content: `Perform detailed analysis of this bid document:

${bidContent}

Analyze:
- Bid type and complexity
- Risks and opportunities
- Competitive landscape
- Win probability assessment
- Timeline requirements
- Budget constraints
- Resource needs
- Technical challenges
- Strategic recommendations

Provide comprehensive analysis for bid decision.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const analysisData = this.parseJSON(response);

      if (!analysisData || !analysisData.analysis) {
        throw new Error('Invalid analysis');
      }

      const context = await this.getCurrentContext();

      // ✅ EXECUTE: Create comprehensive BidAnalysis record
      const analysis = await base44.entities.BidAnalysis.create({
        bid_id: bidId,
        bid_type: analysisData.analysis.bidType,
        complexity_score: analysisData.analysis.complexityScore,
        risk_level: analysisData.analysis.riskLevel,
        estimated_time_to_compete: analysisData.analysis.estimatedTimeToCompete,
        key_risks: analysisData.analysis.keyRisks?.join('; ') || '',
        opportunities: analysisData.analysis.opportunities?.join('; ') || '',
        competitive_landscape: analysisData.analysis.competitiveLandscape,
        win_probability: analysisData.analysis.winProbability,
        strategic_recommendation: analysisData.analysis.strategicRecommendation,
        detailed_analysis: JSON.stringify(analysisData.detailedAnalysis),
        recommendations: JSON.stringify(analysisData.recommendations),
        organization_id: context.organizationId,
        created_by: context.userId,
        status: 'completed'
      });

      // ✅ EXECUTE: Create action tasks from recommendations
      const createdTasks = [];
      if (analysisData.recommendations && analysisData.recommendations.length > 0) {
        for (const rec of analysisData.recommendations) {
          try {
            const task = await base44.entities.Task.create({
              title: `[${rec.priority}] ${rec.recommendation}`,
              description: `Area: ${rec.area}\nRationale: ${rec.rationale}\nEstimated Cost: $${rec.estimatedCost}`,
              bid_id: bidId,
              category: 'bid-strategy',
              priority: rec.priority.toLowerCase(),
              status: 'open',
              organization_id: context.organizationId,
              created_by: context.userId
            });
            createdTasks.push(task);
            console.log(`✅ Created action task: ${rec.recommendation}`);
          } catch (error) {
            console.warn(`Failed to create task: ${rec.recommendation}`, error);
          }
        }
      }

      return {
        success: true,
        message: `✅ Detailed Analysis Complete: Complexity ${analysisData.analysis.complexityScore}/100, Risk ${analysisData.analysis.riskLevel}, Win Probability ${analysisData.analysis.winProbability}%, Created ${createdTasks.length} action items`,
        analysis: analysis,
        winProbability: analysisData.analysis.winProbability,
        complexityScore: analysisData.analysis.complexityScore,
        riskLevel: analysisData.analysis.riskLevel,
        recommendations: analysisData.recommendations,
        actionTasks: createdTasks,
        action: 'detailed_analysis_complete'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Analysis Failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * ADVANCED: Design Agent - CREATE EDITABLE BLUEPRINT from uploaded plan
   */
  async designBlueprint(uploadedPlanContent, projectName, projectId) {
    console.log('🚀 Design Agent: Creating editable blueprint design...');

    const systemPrompt = `You are a construction design expert. Create detailed blueprint design with symbols, text, wires, and dimensions.
Return ONLY valid JSON:
{
  "designElements": [
    {
      "type": "Symbol|Text|Wire|Line|Dimension|Annotation",
      "name": "Element name",
      "description": "What it represents",
      "location": "X,Y or section reference",
      "symbol": "★|◆|▲|—|→|⊥",
      "text": "Text content if applicable",
      "properties": {
        "color": "Color",
        "lineWeight": "1-3",
        "size": "Size",
        "rotation": "Degrees"
      }
    }
  ],
  "blueprint": {
    "title": "Blueprint title",
    "scale": "1/4\\\" = 1'",
    "format": "24x36",
    "northArrow": true,
    "scaleBar": true,
    "gridSpacing": "1 foot"
  },
  "notes": [
    {
      "note": "Note text",
      "category": "General|Construction|Safety|Materials|Electrical|Plumbing",
      "number": "Note number on drawing"
    }
  ],
  "editableElements": {
    "totalSymbols": 12,
    "totalAnnotations": 8,
    "totalDimensions": 25,
    "totalWires": 6
  }
}`;

    const messages = [{
      role: 'user',
      content: `Create a detailed, professional blueprint design from this uploaded plan:

${uploadedPlanContent}

Include:
- Electrical symbols and wiring diagrams
- Plumbing fixtures and lines
- HVAC equipment and ductwork
- Structural elements
- Dimensions and measurements
- Text labels and annotations
- Construction notes
- Material callouts
- Legend and details
- Professional scale and format

Make it fully editable with symbols, text, wires, dimensions. Ready for team to modify.`
    }];

    try {
      const response = await this.chatWithClaude(messages, systemPrompt);
      const designData = this.parseJSON(response);

      if (!designData || !designData.designElements) {
        throw new Error('Invalid design generated');
      }

      const context = await this.getCurrentContext();

      // ✅ EXECUTE: Create EDITABLE Design record
      const design = await base44.entities.Design.create({
        project_id: projectId,
        design_name: projectName,
        title: designData.blueprint.title,
        scale: designData.blueprint.scale,
        format: designData.blueprint.format,
        include_north_arrow: designData.blueprint.northArrow || true,
        include_scale_bar: designData.blueprint.scaleBar || true,
        grid_spacing: designData.blueprint.gridSpacing,
        design_elements: JSON.stringify(designData.designElements),
        notes: JSON.stringify(designData.notes),
        organization_id: context.organizationId,
        created_by: context.userId,
        status: 'draft',
        editable: true
      });

      console.log(`✅ Created editable blueprint with ${designData.designElements.length} elements`);

      // ✅ EXECUTE: Create design review and editing task
      const reviewTask = await base44.entities.Task.create({
        title: `Review & Edit Blueprint: ${projectName}`,
        description: `Blueprint created with:
- ${designData.editableElements.totalSymbols} symbols
- ${designData.editableElements.totalAnnotations} annotations
- ${designData.editableElements.totalDimensions} dimensions
- ${designData.editableElements.totalWires} wire runs

Edit symbols, add/remove text, adjust wires and dimensions as needed. Save when complete.`,
        project_id: projectId,
        category: 'design-creation',
        priority: 'high',
        status: 'open',
        organization_id: context.organizationId,
        created_by: context.userId,
        related_design_id: design.id
      });

      return {
        success: true,
        message: `✅ Blueprint Design Complete: Created editable blueprint with ${designData.designElements.length} design elements, ${designData.notes?.length || 0} notes. Design review task created.`,
        design: design,
        designElements: designData.designElements,
        notes: designData.notes,
        elementCount: designData.editableElements,
        reviewTask: reviewTask,
        action: 'blueprint_designed_editable'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Design Creation Failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

export default new AIAgentService();

