import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Advanced Drawing/Blueprint Analysis
 * Performs AI-powered quantity takeoffs from construction drawings
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bidOpportunityId, documentId, fileUrl, drawingType = 'low_voltage' } = body;

    console.log('Analyzing drawing:', { bidOpportunityId, documentId, fileUrl, drawingType });

    // Comprehensive drawing analysis prompt
    const analysisPrompt = `You are an expert construction estimator and plan reader specializing in construction drawings and blueprints.

Analyze this ${drawingType} drawing/blueprint and perform a detailed quantity takeoff.

Extract and calculate:

1. DRAWING INFORMATION:
   - Drawing type (electrical, low voltage, mechanical, architectural, etc.)
   - Scale (if shown)
   - Sheet number
   - Revision date

2. ROOM/AREA INFORMATION:
   - List all rooms/spaces shown
   - Square footage of each area (if calculable)
   - Ceiling heights

3. QUANTITY TAKEOFF (count/measure ALL items shown):
   For each item/device visible on the drawing, extract:
   - Item type/description
   - Quantity count
   - Location (room number, area, zone)
   - Symbol or note reference
   - Approximate dimensions if relevant

Common items to look for:
- Low Voltage: cameras, card readers, door contacts, motion sensors, horns/strobes, control panels, network drops, speakers, access points
- Electrical: outlets, switches, panels, transformers, fixtures, conduit runs
- Mechanical: diffusers, grilles, thermostats, equipment
- Fire Alarm: smoke detectors, pull stations, notification devices, panels

4. CABLE/CONDUIT RUNS:
   - Estimate linear footage of cable/conduit runs
   - Note any homerun lengths to panels
   - Count number of circuits or home runs

5. SPECIAL REQUIREMENTS:
   - Any special mounting requirements
   - Height specifications
   - Special environmental conditions (outdoor, wet location, etc.)

6. ESTIMATED QUANTITIES FOR ESTIMATE:
   Based on what you see, provide line items with:
   - Description
   - Quantity
   - Unit of measure
   - Location reference
   - Your professional estimate of unit cost

Return your analysis as JSON with this EXACT structure:
{
  "drawing_type": "electrical|low_voltage|mechanical|plumbing|architectural|structural",
  "scale": "1/4\"=1'-0\" or as shown",
  "sheet_number": "sheet designation",
  "revision_date": "date if shown",
  "rooms": [
    {
      "room_number": "room id",
      "room_name": "room name/description",
      "square_footage": number or null,
      "ceiling_height": "height if shown"
    }
  ],
  "quantities": [
    {
      "item_type": "device/equipment type",
      "description": "detailed description",
      "quantity": number,
      "unit": "ea|ft|lf|sf",
      "location": "room/area reference",
      "symbol_reference": "symbol or note",
      "mounting_details": "height, type, etc",
      "notes": "special requirements"
    }
  ],
  "cable_conduit_estimates": [
    {
      "type": "cat6|coax|fiber|conduit type",
      "linear_feet": number,
      "description": "what it serves",
      "from_to": "origin to destination"
    }
  ],
  "estimate_line_items": [
    {
      "category": "material|labor|equipment",
      "trade": "low_voltage|electrical|hvac|plumbing",
      "description": "item for estimate",
      "specification": "specs or requirements",
      "quantity": number,
      "unit": "ea|ft|lf|sf|box|hour",
      "location_reference": "room/area",
      "estimated_unit_cost": number,
      "estimated_labor_hours": number (per unit),
      "notes": "installation notes"
    }
  ],
  "special_conditions": [
    "list any special installation requirements or site conditions noted"
  ],
  "confidence_score": 0.85 (0-1 scale)
}`;

    // Call AI to analyze drawing with vision
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: false,
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        required: ['drawing_type', 'quantities', 'estimate_line_items'],
        properties: {
          drawing_type: { type: 'string' },
          scale: { type: 'string' },
          sheet_number: { type: 'string' },
          revision_date: { type: 'string' },
          rooms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                room_number: { type: 'string' },
                room_name: { type: 'string' },
                square_footage: { type: ['number', 'null'] },
                ceiling_height: { type: 'string' }
              }
            }
          },
          quantities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_type: { type: 'string' },
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                location: { type: 'string' },
                symbol_reference: { type: 'string' },
                mounting_details: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          },
          cable_conduit_estimates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                linear_feet: { type: 'number' },
                description: { type: 'string' },
                from_to: { type: 'string' }
              }
            }
          },
          estimate_line_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                trade: { type: 'string' },
                description: { type: 'string' },
                specification: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                location_reference: { type: 'string' },
                estimated_unit_cost: { type: 'number' },
                estimated_labor_hours: { type: 'number' },
                notes: { type: 'string' }
              }
            }
          },
          special_conditions: {
            type: 'array',
            items: { type: 'string' }
          },
          confidence_score: { type: 'number' }
        }
      }
    });

    console.log('Drawing analysis completed:', {
      quantitiesFound: analysisResult.quantities?.length,
      lineItemsGenerated: analysisResult.estimate_line_items?.length,
      confidence: analysisResult.confidence_score
    });

    // Store analysis in database
    const analysisRecord = await base44.sql`
      INSERT INTO public.document_analysis (
        bid_document_id,
        bid_opportunity_id,
        organization_id,
        analysis_type,
        drawing_type,
        scale,
        sheet_number,
        extracted_quantities,
        room_counts,
        confidence_score,
        model_used,
        analyzed_by
      ) VALUES (
        ${documentId},
        ${bidOpportunityId},
        ${user.organization_id},
        ${'drawing'},
        ${analysisResult.drawing_type || drawingType},
        ${analysisResult.scale || null},
        ${analysisResult.sheet_number || null},
        ${JSON.stringify(analysisResult.quantities || [])},
        ${JSON.stringify(analysisResult.rooms || [])},
        ${analysisResult.confidence_score || 0.8},
        ${'gpt-4-vision'},
        ${user.id}
      )
      RETURNING id
    `.execute();

    const analysisId = analysisRecord[0].id;

    return Response.json({
      success: true,
      analysisId,
      analysis: {
        drawing_type: analysisResult.drawing_type,
        scale: analysisResult.scale,
        sheet_number: analysisResult.sheet_number,
        rooms: analysisResult.rooms,
        quantities: analysisResult.quantities,
        cable_estimates: analysisResult.cable_conduit_estimates,
        estimate_items: analysisResult.estimate_line_items,
        special_conditions: analysisResult.special_conditions,
        confidence_score: analysisResult.confidence_score
      },
      quantityCount: analysisResult.quantities?.length || 0,
      lineItemCount: analysisResult.estimate_line_items?.length || 0
    });

  } catch (error) {
    console.error('Error analyzing drawing:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});
