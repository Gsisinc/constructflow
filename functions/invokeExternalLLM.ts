import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Claude via Anthropic API
async function invokeClaudeAPI({ prompt, systemPrompt, temperature = 0.2 }) {
  const apiKey = Deno.env.get('VITE_CLAUDE_API_KEY');
  if (!apiKey) throw new Error('VITE_CLAUDE_API_KEY is not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature,
      system: systemPrompt || 'You are a helpful AI assistant specializing in construction project management.',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Claude request failed (${response.status}): ${details}`);
  }

  const data = await response.json();
  const output = data?.content?.[0]?.text || '';
  if (!output) throw new Error('Claude returned empty output');
  return { provider: 'claude', model: 'claude-3-5-sonnet-20241022', output };
}

// OpenAI API
async function invokeOpenAIAPI({ prompt, systemPrompt, temperature = 0.2 }) {
  const apiKey = Deno.env.get('VITE_OPENAI_API_KEY');
  if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${details}`);
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
    const { prompt, systemPrompt, temperature = 0.2, preferredProviders = ['claude', 'openai'] } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const errors = [];

    for (const provider of preferredProviders) {
      try {
        let result;
        if (provider === 'claude') {
          result = await invokeClaudeAPI({ prompt, systemPrompt, temperature });
        } else if (provider === 'openai') {
          result = await invokeOpenAIAPI({ prompt, systemPrompt, temperature });
        } else {
          continue;
        }
        return Response.json({ success: true, ...result });
      } catch (error) {
        errors.push(`${provider}: ${error.message}`);
      }
    }

    return Response.json({ success: false, error: 'All providers failed', details: errors }, { status: 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});