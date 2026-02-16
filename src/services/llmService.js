/**
 * LLM Service - Handles all AI agent communication with OpenAI
 * Provides robust error handling, retries, and response parsing
 */

import { OpenAI } from 'openai';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow browser-side requests
});

/**
 * Call OpenAI API with retry logic
 * @param {string} systemPrompt - The system prompt for the agent
 * @param {string} userMessage - The user's message
 * @param {number} temperature - Temperature for response generation (0-1)
 * @param {number} maxTokens - Maximum tokens in response
 * @returns {Promise<string>} The agent's response
 */
export async function callOpenAI(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: 0.95,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from OpenAI');
      }

      const content = response.choices[0].message.content;
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty response from OpenAI');
      }

      return content.trim();
    } catch (error) {
      lastError = error;
      console.error(`LLM call attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Don't retry on auth errors
      if (error.status === 401 || error.status === 403) {
        throw new Error('Authentication failed. Please check your OpenAI API key.');
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`LLM call failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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
 * Call agent with system prompt
 * @param {string} agentSystemPrompt - The agent's system prompt
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Agent's response
 */
export async function callAgent(agentSystemPrompt, userMessage, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 2000,
    retries = 3
  } = options;

  try {
    const response = await callOpenAI(
      agentSystemPrompt,
      userMessage,
      temperature,
      maxTokens
    );

    return parseLLMResponse(response);
  } catch (error) {
    console.error('Agent call failed:', error);
    throw error;
  }
}

/**
 * Stream agent response (for real-time updates)
 * @param {string} agentSystemPrompt - The agent's system prompt
 * @param {string} userMessage - User's message
 * @param {Function} onChunk - Callback for each chunk
 * @returns {Promise<string>} Full response
 */
export async function streamAgent(agentSystemPrompt, userMessage, onChunk) {
  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: agentSystemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        if (onChunk) onChunk(content);
      }
    }

    return parseLLMResponse(fullResponse);
  } catch (error) {
    console.error('Stream agent failed:', error);
    throw error;
  }
}

export default {
  callOpenAI,
  callAgent,
  streamAgent,
  parseLLMResponse
};
