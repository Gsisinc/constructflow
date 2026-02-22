import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: imageUrl },
              },
              {
                type: 'text',
                text: userPrompt || 'Analyze this blueprint. Extract all dimensions, quantities, and generate a complete material takeoff and cost estimate. Be specific with numbers.',
              },
            ],
          },
        ],
        system: `You are an expert construction estimator with 20+ years of experience reading blueprints, architectural drawings, electrical plans, plumbing drawings, and low voltage schematics.

When analyzing a blueprint image:
1. Identify the drawing type and scale
2. Count all elements precisely (outlets, fixtures, doors, windows, etc.)
3. Measure or estimate all dimensions
4. Generate a detailed quantity takeoff table
5. Apply current market pricing to produce a cost estimate
6. Note any assumptions or areas needing clarification

Always provide specific numbers. Format your response with clear sections:
- Drawing Overview
- Quantity Takeoff Table (markdown table)
- Cost Summary
- Notes & Assumptions`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.content?.[0]?.text || '';
      if (text) return { provider: 'claude', model, output: text };
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 8096,
      messages: [
        {
          role: 'system',
          content: `You are an expert construction estimator with 20+ years of experience reading blueprints, architectural drawings, electrical plans, plumbing drawings, and low voltage schematics.

When analyzing a blueprint image:
1. Identify the drawing type and scale
2. Count all elements precisely (outlets, fixtures, doors, windows, etc.)
3. Measure or estimate all dimensions
4. Generate a detailed quantity takeoff table
5. Apply current market pricing to produce a cost estimate
6. Note any assumptions or areas needing clarification

Always provide specific numbers. Format your response with clear sections:
- Drawing Overview
- Quantity Takeoff Table (markdown table)
- Cost Summary
- Notes & Assumptions`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: userPrompt || 'Analyze this blueprint. Extract all dimensions, quantities, and generate a complete material takeoff and cost estimate.',
            },
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
  const output = data?.choices?.[0]?.message?.content || '';
  if (!output) throw new Error('OpenAI returned empty output');
  return { provider: 'openai', model: 'gpt-4o', output };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { imageUrl, prompt, preferredProviders = ['claude', 'openai'] } = body || {};

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }

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
        return Response.json({ success: true, ...result });
      } catch (err) {
        errors.push(`${provider}: ${err.message}`);
      }
    }

    return Response.json(
      { success: false, error: 'All vision providers failed', details: errors },
      { status: 502 }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});