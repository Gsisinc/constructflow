/**
 * LLM Service - Real AI only (Claude / OpenAI). No fallback templates.
 * Agent purpose is enforced via the system prompt passed from agentWorkflows.
 */

// (Fallback/template logic removed — real API responses only.)

const NO_LLM_ERROR = 'No LLM configured. Add VITE_CLAUDE_API_KEY or VITE_OPENAI_API_KEY to .env.local in the project root, then restart the dev server (stop and run npm run dev again).';

/** Call Anthropic Claude API */
async function callClaude(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  const key = import.meta.env.VITE_CLAUDE_API_KEY ?? import.meta.env.VITE_ANTHROPIC_API_KEY ?? import.meta.env.REACT_APP_CLAUDE_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude ${res.status}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty Claude response');
  return text;
}

/** Call OpenAI Chat Completions API */
async function callOpenAIAPI(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  const key = import.meta.env.VITE_OPENAI_API_KEY ?? import.meta.env.REACT_APP_OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty OpenAI response');
  return text;
}

/**
 * Try Claude, then OpenAI. No fallback — real responses only; throws if both fail or no keys.
 */
export async function callOpenAI(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  let lastError = null;
  try {
    const out = await callClaude(systemPrompt, userMessage, temperature, maxTokens);
    if (out) return out;
  } catch (e) {
    lastError = e;
  }
  try {
    const out = await callOpenAIAPI(systemPrompt, userMessage, temperature, maxTokens);
    if (out) return out;
  } catch (e) {
    lastError = e;
  }
  const keyClaude = import.meta.env.VITE_CLAUDE_API_KEY ?? import.meta.env.VITE_ANTHROPIC_API_KEY ?? import.meta.env.REACT_APP_CLAUDE_API_KEY;
  const keyOpenAI = import.meta.env.VITE_OPENAI_API_KEY ?? import.meta.env.REACT_APP_OPENAI_API_KEY;
  if (!keyClaude && !keyOpenAI) {
    throw new Error(NO_LLM_ERROR);
  }
  throw new Error(lastError?.message || 'LLM request failed. Check your API keys and try again.');
}

/**
 * Parse LLM response to extract structured data
 * @param {string} response - The raw response from LLM
 * @returns {string} Parsed and cleaned response
 */
export function parseLLMResponse(response) {
  if (!response) return '';

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(response);
    if (typeof parsed === 'string') return parsed;
    if (parsed.answer) return parsed.answer;
    if (parsed.response) return parsed.response;
    if (parsed.content) return parsed.content;
    if (parsed.text) return parsed.text;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Not JSON, return as-is
  }

  return response.trim();
}

/**
 * Call agent with system prompt (no tools).
 */
export async function callAgent(agentSystemPrompt, userMessage, options = {}) {
  const response = await callOpenAI(agentSystemPrompt, userMessage, 0.7, 2000);
  return parseLLMResponse(response);
}

/**
 * Call agent with tools so it can complete tasks (create tasks, run discovery, add opportunities, etc.).
 * Uses OpenAI or Claude with tool use; executes tools and loops until the model returns only text.
 * @param {string} agentSystemPrompt
 * @param {string} userMessage
 * @param {Array<{ name: string, description: string, input_schema: object }>} toolDefs
 * @param {{ executeTool: (name, args, ctx) => Promise<string>, context: object }} toolContext
 * @returns {Promise<{ content: string, actionsTaken: Array<{ name: string, result: string }> }>}
 */
export async function callAgentWithTools(agentSystemPrompt, userMessage, toolDefs, toolContext) {
  const { executeTool, context } = toolContext;
  const actionsTaken = [];
  const maxRounds = 4;

  const openAITools = (toolDefs || []).map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema || { type: 'object', properties: {} },
    },
  }));

  const keyOpenAI = import.meta.env.VITE_OPENAI_API_KEY ?? import.meta.env.REACT_APP_OPENAI_API_KEY;
  const keyClaude = import.meta.env.VITE_CLAUDE_API_KEY ?? import.meta.env.REACT_APP_CLAUDE_API_KEY;

  const messages = [
    { role: 'system', content: agentSystemPrompt + '\n\nWhen the user asks you to do something (find bids, create a task, add to pipeline, create a project), use the provided tools to actually perform the action. After using tools, summarize what you did in a short reply.' },
    { role: 'user', content: userMessage },
  ];

  for (let round = 0; round < maxRounds; round++) {
    if (keyOpenAI && openAITools.length > 0) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keyOpenAI}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 2000,
          temperature: 0.7,
          messages,
          tools: openAITools,
          tool_choice: 'auto',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI ${res.status}`);
      }
      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) throw new Error('Empty OpenAI response');

      const content = msg.content?.trim();
      const toolCalls = msg.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        messages.push(msg);
        for (const tc of toolCalls) {
          const name = tc.function?.name;
          const args = (() => { try { return JSON.parse(tc.function?.arguments || '{}'); } catch (_) { return {}; } })();
          const result = await executeTool(name, args, context);
          actionsTaken.push({ name, result });
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result,
          });
        }
        continue;
      }

      return {
        content: content || 'Done.',
        actionsTaken,
      };
    }

    if (keyClaude && openAITools.length > 0) {
      const claudeMessages = messages.map((m) => {
        if (m.role === 'system') return null;
        if (m.role === 'user') return { role: 'user', content: m.content };
        if (m.role === 'assistant' && m.content) return { role: 'assistant', content: m.content };
        if (m.role === 'assistant' && m.tool_calls) {
          const content = m.tool_calls.map((tc) => ({
            type: 'tool_use',
            id: tc.id,
            name: tc.function?.name,
            input: (() => { try { return JSON.parse(tc.function?.arguments || '{}'); } catch (_) { return {}; } })(),
          }));
          return { role: 'assistant', content };
        }
        if (m.role === 'tool') {
          return { role: 'user', content: [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }] };
        }
        return null;
      }).filter(Boolean);

      const system = messages.find((m) => m.role === 'system')?.content || agentSystemPrompt;
      const claudeTools = (toolDefs || []).map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema || { type: 'object', properties: {} },
      }));

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keyClaude,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.7,
          system: system,
          messages: claudeMessages,
          tools: claudeTools,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Claude ${res.status}`);
      }
      const data = await res.json();
      const contentBlocks = data.content || [];
      const textBlock = contentBlocks.find((b) => b.type === 'text');
      const toolUseBlocks = contentBlocks.filter((b) => b.type === 'tool_use');

      if (toolUseBlocks.length > 0) {
        const assistantContent = contentBlocks.map((b) => {
          if (b.type === 'text') return { type: 'text', text: b.text };
          return { type: 'tool_use', id: b.id, name: b.name, input: b.input };
        });
        messages.push({ role: 'assistant', content: assistantContent });
        for (const tu of toolUseBlocks) {
          const result = await executeTool(tu.name, tu.input || {}, context);
          actionsTaken.push({ name: tu.name, result });
          messages.push({
            role: 'tool',
            tool_call_id: tu.id,
            content: result,
          });
        }
        continue;
      }

      return {
        content: (textBlock?.text || '').trim() || 'Done.',
        actionsTaken,
      };
    }

    break;
  }

  const response = await callOpenAI(agentSystemPrompt, userMessage, 0.7, 2000);
  return {
    content: parseLLMResponse(response),
    actionsTaken,
  };
}

/**
 * Stream agent response (real API only; no fallback).
 */
export async function streamAgent(agentSystemPrompt, userMessage, onChunk) {
  const fullResponse = await callOpenAI(agentSystemPrompt, userMessage, 0.7, 2000);
  if (onChunk && fullResponse) onChunk(fullResponse);
  return parseLLMResponse(fullResponse);
}

export default {
  callOpenAI,
  callAgent,
  callAgentWithTools,
  streamAgent,
  parseLLMResponse
};
