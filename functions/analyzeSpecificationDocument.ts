import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Advanced Specification Document Analysis
 * Extracts detailed requirements, scope, and generates initial estimate line items
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bidOpportunityId, documentId, fileUrl, documentType = 'specification' } = body;

    console.log('Analyzing document:', { bidOpportunityId, documentId, fileUrl });

    // Comprehensive AI analysis prompt
    const analysisPrompt = `You are an expert construction estimator specializing in low voltage, electrical, HVAC, and general construction projects.

Analyze this specification document and extract ALL relevant information for creating a detailed estimate.

Extract and organize the following:

1. PROJECT SCOPE:
   - Detailed scope of work
   - Project type and classification
   - Key deliverables

2. REQUIREMENTS:
   - Technical specifications for each system/trade
   - Performance requirements
   - Code and compliance requirements
   - Quality standards
   - Testing and commissioning requirements

3. SUBMITTAL REQUIREMENTS:
   - Shop drawings needed
   - Product data sheets required
   - Sample requirements
   - Closeout documentation

4. INSURANCE & BONDING:
   - General liability coverage amounts
   - Workers compensation requirements
   - Performance bond percentage
   - Payment bond percentage
   - Additional insured requirements

5. LABOR REQUIREMENTS:
   - Prevailing wage (yes/no)
   - Union requirements
   - Certified technicians needed
   - Special qualifications

6. SCHEDULE:
   - Project duration in days
   - Key milestones
   - Liquidated damages per day (if specified)
   - Substantial completion deadline
   - Final completion deadline

7. MATERIALS & EQUIPMENT (extract all mentioned items):
   For each item provide:
   - Item description
   - Quantity (if specified)
   - Unit of measure
   - Specifications/requirements
   - Manufacturer requirements
   - Model numbers (if specified)
   - Location/area (if specified)

Return your analysis as JSON with this EXACT structure:
{
  "scope_of_work": "detailed description",
  "project_type": "low_voltage|electrical|hvac|plumbing|general_construction",
  "key_requirements": [
    {
      "category": "technical|compliance|quality|testing",
      "requirement": "description",
      "priority": "critical|high|medium|low"
    }
  ],
  "submittal_requirements": [
    {
      "type": "shop_drawing|product_data|sample|closeout",
      "description": "what's needed",
      "due": "timing if specified"
    }
  ],
  "insurance_requirements": {
    "general_liability": "amount",
    "workers_comp": "requirement",
    "performance_bond_percent": number,
    "payment_bond_percent": number,
    "additional_insured": true/false
  },
  "bonding_requirements": {
    "performance_bond": true/false,
    "payment_bond": true/false,
    "bid_bond": true/false
  },
  "prevailing_wage": true/false,
  "project_duration_days": number,
  "liquidated_damages": "amount per day or null",
  "extracted_items": [
    {
      "category": "material|labor|equipment",
      "trade": "low_voltage|electrical|hvac|plumbing|general",
      "description": "item description",
      "specification": "detailed specs",
      "quantity": number or null,
      "unit": "ea|ft|lf|sf|box|hour|ls|etc",
      "manufacturer": "if specified",
      "model_number": "if specified",
      "location": "room/zone if specified",
      "estimated_unit_cost": number (your professional estimate),
      "notes": "any special notes"
    }
  ],
  "confidence_score": 0.85 (0-1 scale of how confident you are in this analysis)
}`;

    // Call AI to analyze document
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: false,
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        required: ['scope_of_work', 'key_requirements', 'extracted_items'],
        properties: {
          scope_of_work: { type: 'string' },
          project_type: { type: 'string' },
          key_requirements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                requirement: { type: 'string' },
                priority: { type: 'string' }
              }
            }
          },
          submittal_requirements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                description: { type: 'string' },
                due: { type: 'string' }
              }
            }
          },
          insurance_requirements: {
            type: 'object',
            properties: {
              general_liability: { type: 'string' },
              workers_comp: { type: 'string' },
              performance_bond_percent: { type: 'number' },
              payment_bond_percent: { type: 'number' },
              additional_insured: { type: 'boolean' }
            }
          },
          bonding_requirements: {
            type: 'object',
            properties: {
              performance_bond: { type: 'boolean' },
              payment_bond: { type: 'boolean' },
              bid_bond: { type: 'boolean' }
            }
          },
          prevailing_wage: { type: 'boolean' },
          project_duration_days: { type: 'number' },
          liquidated_damages: { type: ['string', 'null'] },
          extracted_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                trade: { type: 'string' },
                description: { type: 'string' },
                specification: { type: 'string' },
                quantity: { type: ['number', 'null'] },
                unit: { type: 'string' },
                manufacturer: { type: 'string' },
                model_number: { type: 'string' },
                location: { type: 'string' },
                estimated_unit_cost: { type: 'number' },
                notes: { type: 'string' }
              }
            }
          },
          confidence_score: { type: 'number' }
        }
      }
    });

    console.log('AI Analysis completed:', {
      itemsExtracted: analysisResult.extracted_items?.length,
      requirementsFound: analysisResult.key_requirements?.length,
      confidence: analysisResult.confidence_score
    });

    // Store analysis in database
    const analysisRecord = await base44.sql`
      INSERT INTO public.document_analysis (
        bid_document_id,
        bid_opportunity_id,
        organization_id,
        analysis_type,
        scope_of_work,
        key_requirements,
        submittal_requirements,
        insurance_requirements,
        bonding_requirements,
        prevailing_wage,
        project_duration_days,
        liquidated_damages,
        confidence_score,
        model_used,
        analyzed_by
      ) VALUES (
        ${documentId},
        ${bidOpportunityId},
        ${user.organization_id},
        ${documentType},
        ${analysisResult.scope_of_work},
        ${JSON.stringify(analysisResult.key_requirements)},
        ${JSON.stringify(analysisResult.submittal_requirements || [])},
        ${JSON.stringify(analysisResult.insurance_requirements || {})},
        ${JSON.stringify(analysisResult.bonding_requirements || {})},
        ${analysisResult.prevailing_wage || false},
        ${analysisResult.project_duration_days || 0},
        ${analysisResult.liquidated_damages},
        ${analysisResult.confidence_score || 0.8},
        ${'gpt-4'},
        ${user.id}
      )
      RETURNING id
    `.execute();

    const analysisId = analysisRecord[0].id;

    return Response.json({
      success: true,
      analysisId,
      analysis: {
        scope: analysisResult.scope_of_work,
        requirements: analysisResult.key_requirements,
        submittals: analysisResult.submittal_requirements,
        insurance: analysisResult.insurance_requirements,
        bonding: analysisResult.bonding_requirements,
        prevailing_wage: analysisResult.prevailing_wage,
        duration_days: analysisResult.project_duration_days,
        liquidated_damages: analysisResult.liquidated_damages,
        extracted_items: analysisResult.extracted_items,
        confidence_score: analysisResult.confidence_score
      },
      itemCount: analysisResult.extracted_items?.length || 0
    });

  } catch (error) {
    console.error('Error analyzing document:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});
