/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { planFileUrl, manualScale, specs } = await req.json();

    if (!planFileUrl) {
      return Response.json({ error: 'No plan file URL provided' }, { status: 400 });
    }

    // Use LLM vision to analyze the construction plan
    const analysisPrompt = `You are a professional low-voltage construction estimator. Analyze this construction plan/drawing image.

Your task is to:
1. Identify all electrical/low-voltage symbols in the legend or title block
2. Count how many of each device type appear on the plan
3. Identify the scopes of work (e.g., Fire Alarm, Data/IT, AV, Security/CCTV, Access Control)
4. Estimate cable runs based on device locations and drawing scale: ${manualScale || 'unknown'}

Return a JSON object with:
- symbolMap: object where keys are symbol IDs and values are {name, description, scope, quantity, cablePerDevice}
- detectedDevices: array of {id, name, scope, quantity, unitPrice}
- detectedScopes: object where keys are scope names and values are {deviceCount, estimatedCableRuns}
- cableRuns: object where keys are scope names and values are {totalLF, wastedLF, type}

Scopes to look for: FireAlarm, Data, AV, Security, AccessControl, Nurse_Call, PA
For cablePerDevice: FireAlarm uses 18/2 or 18/4 (about 50LF avg), Data uses Cat6 (about 100LF avg), Security uses RG59 or Cat6 (about 75LF avg).

If this is not a construction plan or no symbols are found, return empty objects but do NOT return an error.

IMPORTANT: quantity fields must be numbers (not strings). Return valid JSON only.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      file_urls: [planFileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          symbolMap: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                scope: { type: 'string' },
                quantity: { type: 'number' },
                cablePerDevice: { type: 'number' }
              }
            }
          },
          detectedDevices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                scope: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' }
              }
            }
          },
          detectedScopes: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                deviceCount: { type: 'number' },
                estimatedCableRuns: { type: 'number' }
              }
            }
          },
          cableRuns: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                totalLF: { type: 'number' },
                wastedLF: { type: 'number' },
                type: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Ensure all quantity values are numbers
    const symbolMap = result?.symbolMap || {};
    for (const key of Object.keys(symbolMap)) {
      if (symbolMap[key]) {
        symbolMap[key].quantity = parseFloat(symbolMap[key].quantity) || 0;
        symbolMap[key].cablePerDevice = parseFloat(symbolMap[key].cablePerDevice) || 0;
      }
    }

    // Ensure cable totalLF values are numbers
    const cableRuns = result?.cableRuns || {};
    for (const key of Object.keys(cableRuns)) {
      if (cableRuns[key]) {
        cableRuns[key].totalLF = parseFloat(cableRuns[key].totalLF) || 0;
        cableRuns[key].wastedLF = parseFloat(cableRuns[key].wastedLF) || 0;
      }
    }

    return Response.json({
      symbolMap,
      detectedDevices: result?.detectedDevices || [],
      detectedScopes: result?.detectedScopes || {},
      cableRuns,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});