import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate Estimate from Document Analysis
 * Creates a full estimate with line items from analyzed specifications and drawings
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      bidOpportunityId, 
      analysisIds = [],
      estimateName,
      markupPercent = 15,
      taxRate = 0
    } = body;

    console.log('Generating estimate:', { bidOpportunityId, analysisIds, estimateName });

    // Generate estimate number
    const estimateNumberResult = await base44.sql`
      SELECT generate_estimate_number(${user.organization_id}) as estimate_number
    `.execute();
    const estimateNumber = estimateNumberResult[0].estimate_number;

    // Create estimate record
    const estimateResult = await base44.sql`
      INSERT INTO public.estimates (
        bid_opportunity_id,
        organization_id,
        estimate_number,
        estimate_name,
        status,
        markup_percent,
        tax_rate,
        created_by
      ) VALUES (
        ${bidOpportunityId},
        ${user.organization_id},
        ${estimateNumber},
        ${estimateName || 'Untitled Estimate'},
        ${'draft'},
        ${markupPercent},
        ${taxRate},
        ${user.id}
      )
      RETURNING id, estimate_number
    `.execute();

    const estimateId = estimateResult[0].id;
    const finalEstimateNumber = estimateResult[0].estimate_number;

    console.log('Created estimate:', { estimateId, estimateNumber: finalEstimateNumber });

    // Retrieve all analysis records
    const analyses = await base44.sql`
      SELECT * FROM public.document_analysis
      WHERE id = ANY(${analysisIds}::uuid[])
        AND organization_id = ${user.organization_id}
    `.execute();

    console.log('Found analyses:', analyses.length);

    let lineItemCount = 0;

    // Process each analysis and create line items
    for (const analysis of analyses) {
      // Process extracted items from specifications
      if (analysis.extracted_quantities && Array.isArray(analysis.extracted_quantities)) {
        for (const item of analysis.extracted_quantities) {
          // Skip if no quantity or description
          if (!item.description || (item.quantity === null && item.quantity === undefined)) {
            continue;
          }

          const quantity = item.quantity || 1;
          const unitCost = item.estimated_unit_cost || 0;
          const extendedCost = quantity * unitCost;
          const unitPrice = unitCost * (1 + markupPercent / 100);
          const totalPrice = extendedCost * (1 + markupPercent / 100);

          await base44.sql`
            INSERT INTO public.estimate_line_items (
              estimate_id,
              organization_id,
              category,
              trade,
              description,
              specification,
              quantity,
              unit,
              unit_cost,
              extended_cost,
              markup_percent,
              unit_price,
              total_price,
              source,
              source_document_id,
              location_reference,
              manufacturer,
              model_number,
              notes,
              sort_order,
              created_by
            ) VALUES (
              ${estimateId},
              ${user.organization_id},
              ${item.category || 'material'},
              ${item.trade || 'general'},
              ${item.description},
              ${item.specification || ''},
              ${quantity},
              ${item.unit || 'ea'},
              ${unitCost},
              ${extendedCost},
              ${markupPercent},
              ${unitPrice},
              ${totalPrice},
              ${analysis.analysis_type === 'drawing' ? 'ai_drawing' : 'ai_specification'},
              ${analysis.bid_document_id},
              ${item.location || ''},
              ${item.manufacturer || ''},
              ${item.model_number || ''},
              ${item.notes || ''},
              ${lineItemCount},
              ${user.id}
            )
          `.execute();

          lineItemCount++;
        }
      }
    }

    // Link estimates to analyses
    for (const analysisId of analysisIds) {
      await base44.sql`
        INSERT INTO public.estimate_assemblies (
          estimate_id,
          document_analysis_id
        ) VALUES (
          ${estimateId},
          ${analysisId}
        )
      `.execute();
    }

    // Recalculate estimate totals (trigger will handle this automatically)
    console.log('Created line items:', lineItemCount);

    // Fetch final estimate with totals
    const finalEstimate = await base44.sql`
      SELECT * FROM public.estimates WHERE id = ${estimateId}
    `.execute();

    return Response.json({
      success: true,
      estimateId,
      estimateNumber: finalEstimateNumber,
      lineItemCount,
      estimate: finalEstimate[0]
    });

  } catch (error) {
    console.error('Error generating estimate:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});
