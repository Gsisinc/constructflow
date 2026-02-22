import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SYSTEM_PROMPT = `You are an expert construction estimator with 20+ years of experience reading ALL types of blueprints:
- Architectural (floor plans, elevations, sections)
- Structural (foundation, framing, steel)
- Electrical (power, lighting, panels, low voltage)
- Plumbing (water, sewer, gas)
- HVAC / Mechanical
- Fire protection
- Data / AV / Security / Low voltage
- Civil / Site plans

When analyzing a blueprint image you MUST:
1. Identify drawing type, trade/classification, and scale
2. Count every element precisely (outlets, fixtures, doors, windows, conduit runs, cable drops, etc.)
3. Estimate dimensions from scale or context
4. Produce a detailed quantity takeoff
5. Apply current US market pricing
6. Flag any assumptions

CRITICAL: You MUST return ONLY valid JSON matching this exact schema, no extra text:
{
  "drawing_overview": {
    "type": "string describing drawing type",
    "trade": "architectural|structural|electrical|plumbing|hvac|fire|low_voltage|civil|other",
    "scale": "scale if visible",
    "project_name": "if visible",
    "sheet_number": "if visible"
  },
  "line_items": [
    {
      "description": "Item description",
      "category": "labor|material|equipment|subcontractor",
      "trade": "trade category",
      "quantity": 0,
      "unit": "EA|LF|SF|CY|LS|HR|TON",
      "unit_cost": 0,
      "total_cost": 0,
      "notes": "optional notes"
    }
  ],
  "summary": {
    "subtotal_materials": 0,
    "subtotal_labor": 0,
    "subtotal_equipment": 0,
    "subtotal_subcontractor": 0,
    "overhead_percent": 15,
    "overhead_amount": 0,
    "profit_percent": 20,
    "profit_amount": 0,
    "total_estimate": 0
  },
  "assumptions": ["assumption 1", "assumption 2"],
  "confidence": "high|medium|low",
  "notes": "any important notes"
}`;

async function analyzeWithClaude(imageUrl, userPrompt, apiKey) {
  const modelsToTry = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
  ];

  let lastError = '';
  for (const model of modelsToTry) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: model.includes('haiku') ? 4096 : 8096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: imageUrl } },
              { type: 'text', text: userPrompt || 'Analyze this blueprint and return a complete quantity takeoff and cost estimate as JSON.' },
            ],
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.content?.[0]?.text || '';
      if (text) return { provider: 'claude', model, rawText: text };
    }

    const errText = await response.text();
    lastError = `${model} (${response.status}): ${errText}`;
    if (response.status === 401 || response.status === 403) break;
  }
  throw new Error(`Claude vision failed: ${lastError}`);
}

async function analyzeWithOpenAI(imageUrl, userPrompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 8096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            { type: 'text', text: userPrompt || 'Analyze this blueprint and return a complete quantity takeoff and cost estimate as JSON.' },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI vision failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  if (!rawText) throw new Error('OpenAI returned empty output');
  return { provider: 'openai', model: 'gpt-4o', rawText };
}

function parseResult(rawText) {
  // Try to extract JSON from the response
  try {
    // Direct parse
    return JSON.parse(rawText);
  } catch {
    // Try to extract JSON block
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { imageUrl, prompt, preferredProviders = ['claude', 'openai'] } = body || {};

    if (!imageUrl) return Response.json({ error: 'imageUrl is required' }, { status: 400 });

    const claudeKey = Deno.env.get('VITE_CLAUDE_API_KEY');
    const openaiKey = Deno.env.get('VITE_OPENAI_API_KEY');

    const errors = [];

    for (const provider of preferredProviders) {
      try {
        let result;
        if (provider === 'claude' && claudeKey) {
          result = await analyzeWithClaude(imageUrl, prompt, claudeKey);
        } else if (provider === 'openai' && openaiKey) {
          result = await analyzeWithOpenAI(imageUrl, prompt, openaiKey);
        } else {
          errors.push(`${provider}: API key not configured`);
          continue;
        }

        const parsed = parseResult(result.rawText);
        return Response.json({
          success: true,
          provider: result.provider,
          model: result.model,
          structured: parsed,
          rawText: result.rawText,
        });
      } catch (err) {
        errors.push(`${provider}: ${err.message}`);
      }
    }

    return Response.json({ success: false, error: 'All vision providers failed', details: errors }, { status: 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});