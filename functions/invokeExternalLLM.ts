import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PROVIDER_MAP = {
  openai: {
    envKey: 'OPENAI_API_KEY',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  deepseek: {
    envKey: 'DEEPSEEK_API_KEY',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  }
};

function extractContent(payload: any): string {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('\n').trim();
  }
  return '';
}

async function invokeProvider({ provider, prompt, systemPrompt, temperature = 0.2 }: {
  provider: 'openai' | 'deepseek';
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}) {
  const config = PROVIDER_MAP[provider];
  if (!config) throw new Error(`Unsupported provider: ${provider}`);

  const apiKey = Deno.env.get(config.envKey);
  if (!apiKey) throw new Error(`${config.envKey} is not configured`);

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${provider} request failed (${response.status}): ${details}`);
  }

  const data = await response.json();
  const output = extractContent(data);
  if (!output) throw new Error(`${provider} returned empty output`);

  return {
    provider,
    model: config.model,
    output
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      prompt,
      systemPrompt,
      temperature = 0.2,
      preferredProviders = ['openai', 'deepseek']
    } = body || {};

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const providers = (Array.isArray(preferredProviders) ? preferredProviders : ['openai', 'deepseek'])
      .map((value: string) => String(value).toLowerCase())
      .filter((value: string) => value in PROVIDER_MAP) as Array<'openai' | 'deepseek'>;

    if (providers.length === 0) {
      return Response.json({ error: 'No valid providers requested' }, { status: 400 });
    }

    const errors: string[] = [];

    for (const provider of providers) {
      try {
        const result = await invokeProvider({ provider, prompt, systemPrompt, temperature });
        return Response.json({ success: true, ...result });
      } catch (error) {
        errors.push(`${provider}: ${(error as Error).message}`);
      }
    }

    return Response.json({ success: false, error: 'All providers failed', details: errors }, { status: 502 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
