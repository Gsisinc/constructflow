/**
 * LLM Service - Claude ONLY with strict agent constraints
 * No fallbacks. Agents operate within their defined system prompts.
 * Real AI functionality enforced through system prompt constraints.
 */

import { getClaudeKey } from '@/lib/apiKeys';

const CLAUDE_ERROR = 'Claude API is required. Add your Claude API key in Settings → API status.';

/**
 * Call Claude API with strict agent system prompt
 * No fallbacks - if Claude fails, the agent fails.
 * This ensures real AI functionality within agent constraints.
 */
async function callClaudeAPI(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  const key = getClaudeKey();
  if (!key) {
    throw new Error(CLAUDE_ERROR);
  }

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
    throw new Error(err.error?.message || `Claude API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');
  
  return text;
}

/**
 * Call agent with system prompt - Claude ONLY
 * The system prompt defines the agent's constraints and behavior.
 * No fallbacks, no compromises.
 */
export async function callAgent(agentSystemPrompt, userMessage, options = {}) {
  const response = await callClaudeAPI(agentSystemPrompt, userMessage, 0.7, 2000);
  return parseLLMResponse(response);
}

/**
 * Call agent with tools - Claude ONLY with tool use
 * Agents can execute tools within their defined scope.
 */
export async function callAgentWithTools(agentSystemPrompt, userMessage, toolDefs, toolContext) {
  const { executeTool, context } = toolContext;
  const actionsTaken = [];
  const maxRounds = 4;

  const claudeTools = (toolDefs || []).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema || { type: 'object', properties: {} },
  }));

  const key = getClaudeKey();
  if (!key) {
    throw new Error(CLAUDE_ERROR);
  }

  const messages = [
    { role: 'user', content: userMessage },
  ];

  for (let round = 0; round < maxRounds; round++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        system: agentSystemPrompt,
        messages: messages,
        tools: claudeTools.length > 0 ? claudeTools : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude API error: ${res.status}`);
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
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: tu.id, content: result }],
        });
      }
      continue;
    }

    return {
      content: (textBlock?.text || '').trim() || 'Done.',
      actionsTaken,
    };
  }

  const response = await callClaudeAPI(agentSystemPrompt, userMessage, 0.7, 2000);
  return {
    content: parseLLMResponse(response),
    actionsTaken,
  };
}

/**
 * Stream agent response - Claude ONLY
 */
export async function streamAgent(agentSystemPrompt, userMessage, onChunk) {
  const fullResponse = await callClaudeAPI(agentSystemPrompt, userMessage, 0.7, 2000);
  if (onChunk && fullResponse) onChunk(fullResponse);
  return parseLLMResponse(fullResponse);
}

/**
 * Parse LLM response to extract structured data
 */
export function parseLLMResponse(response) {
  if (!response) return '';

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
 * Legacy callOpenAI - now calls Claude only
 */
export async function callOpenAI(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  return callClaudeAPI(systemPrompt, userMessage, temperature, maxTokens);
}

export default {
  callAgent,
  callAgentWithTools,
  streamAgent,
  parseLLMResponse,
  callOpenAI,
};
