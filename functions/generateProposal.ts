import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate Professional Proposal from Estimate
 * Creates a comprehensive, well-written proposal using AI
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { estimateId, proposalType = 'standard', customizations = {} } = body;

    console.log('Generating proposal:', { estimateId, proposalType });

    // Fetch estimate with all line items
    const estimate = await base44.sql`
      SELECT * FROM public.estimates WHERE id = ${estimateId}
    `.execute();

    if (!estimate || estimate.length === 0) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const estimateData = estimate[0];

    // Fetch line items
    const lineItems = await base44.sql`
      SELECT * FROM public.estimate_line_items 
      WHERE estimate_id = ${estimateId}
      ORDER BY sort_order, category, description
    `.execute();

    // Fetch bid opportunity details
    const bidData = await base44.entities.BidOpportunity.get(estimateData.bid_opportunity_id);

    // Fetch organization details
    const org = await base44.sql`
      SELECT * FROM public.organizations WHERE id = ${user.organization_id}
    `.execute();
    const orgData = org[0];

    // Group line items by category
    const itemsByCategory = {
      material: lineItems.filter(i => i.category === 'material'),
      labor: lineItems.filter(i => i.category === 'labor'),
      equipment: lineItems.filter(i => i.category === 'equipment'),
      subcontractor: lineItems.filter(i => i.category === 'subcontractor'),
      other: lineItems.filter(i => i.category === 'other')
    };

    // Build detailed scope summary
    const scopeSummary = lineItems.map(item => 
      `${item.quantity} ${item.unit} ${item.description} ${item.location_reference ? `at ${item.location_reference}` : ''}`
    ).join('\n');

    // Generate proposal content with AI
    const proposalPrompt = `You are an expert proposal writer for construction companies. Generate a professional, persuasive proposal.

PROJECT INFORMATION:
- Client/Agency: ${bidData.agency || bidData.client_name}
- Project: ${bidData.project_name || bidData.title}
- Bid Due Date: ${bidData.due_date}
- Description: ${bidData.description || 'Not specified'}

COMPANY INFORMATION:
- Company: ${orgData.name}

ESTIMATE DETAILS:
- Estimate Number: ${estimateData.estimate_number}
- Total Amount: $${estimateData.total_amount?.toLocaleString()}
- Subtotal: $${estimateData.subtotal?.toLocaleString()}
- Tax: $${estimateData.tax_amount?.toLocaleString()}

SCOPE OF WORK (based on line items):
${scopeSummary}

ITEMS BREAKDOWN:
- Materials: ${itemsByCategory.material.length} items
- Labor: ${itemsByCategory.labor.length} items
- Equipment: ${itemsByCategory.equipment.length} items
- Subcontractors: ${itemsByCategory.subcontractor.length} items

Generate a professional ${proposalType} proposal with these sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
   - Brief project overview
   - Your company's qualifications
   - Key benefits and value proposition

2. SCOPE OF WORK (detailed, organized)
   - Organize by phase or system
   - Be specific but readable
   - Highlight key deliverables

3. PROJECT APPROACH (2-3 paragraphs)
   - How you'll execute the work
   - Your methodology and process
   - Quality assurance approach

4. TIMELINE (realistic schedule)
   - Key milestones
   - Estimated duration
   - Critical path items

5. QUALIFICATIONS & EXPERIENCE (2 paragraphs)
   - Relevant experience
   - Certifications and licenses
   - Why choose your company

6. TERMS & CONDITIONS (professional, clear)
   - Payment terms
   - Warranty information
   - Change order process
   - Insurance and bonding

Return as JSON:
{
  "title": "Professional proposal title",
  "executive_summary": "compelling executive summary",
  "scope_of_work": "detailed scope organized by phases/systems",
  "project_approach": "how you'll execute",
  "timeline": "realistic timeline with milestones",
  "qualifications": "relevant experience and capabilities",
  "terms_and_conditions": "clear terms and conditions"
}`;

    const proposalResult = await base44.integrations.Core.InvokeLLM({
      prompt: proposalPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        required: ['title', 'executive_summary', 'scope_of_work'],
        properties: {
          title: { type: 'string' },
          executive_summary: { type: 'string' },
          scope_of_work: { type: 'string' },
          project_approach: { type: 'string' },
          timeline: { type: 'string' },
          qualifications: { type: 'string' },
          terms_and_conditions: { type: 'string' }
        }
      }
    });

    // Generate proposal number
    const proposalNumberResult = await base44.sql`
      SELECT generate_proposal_number(${user.organization_id}) as proposal_number
    `.execute();
    const proposalNumber = proposalNumberResult[0].proposal_number;

    // Create proposal record
    const proposal = await base44.sql`
      INSERT INTO public.proposals (
        estimate_id,
        bid_opportunity_id,
        organization_id,
        proposal_number,
        title,
        executive_summary,
        scope_of_work,
        project_approach,
        timeline,
        qualifications,
        terms_and_conditions,
        status,
        created_by
      ) VALUES (
        ${estimateId},
        ${estimateData.bid_opportunity_id},
        ${user.organization_id},
        ${proposalNumber},
        ${proposalResult.title || bidData.project_name},
        ${proposalResult.executive_summary},
        ${proposalResult.scope_of_work},
        ${proposalResult.project_approach || ''},
        ${proposalResult.timeline || ''},
        ${proposalResult.qualifications || ''},
        ${proposalResult.terms_and_conditions || ''},
        ${'draft'},
        ${user.id}
      )
      RETURNING id, proposal_number
    `.execute();

    console.log('Created proposal:', proposal[0]);

    return Response.json({
      success: true,
      proposalId: proposal[0].id,
      proposalNumber: proposal[0].proposal_number,
      proposal: proposalResult
    });

  } catch (error) {
    console.error('Error generating proposal:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});
