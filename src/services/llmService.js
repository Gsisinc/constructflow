/**
 * LLM Service - Handles all AI agent communication with Base44's invokeExternalLLM function
 * Uses Base44 serverless functions for AI operations
 * Provides robust error handling, retries, and response parsing
 */

import { base44 } from '@/api/base44Client';

/**
 * Call Base44's invokeExternalLLM function
 * @param {string} systemPrompt - The system prompt for the agent
 * @param {string} userMessage - The user's message
 * @param {number} temperature - Temperature for response generation (0-1)
 * @param {number} maxTokens - Maximum tokens in response (not used by Base44 function)
 * @returns {Promise<string>} The agent's response
 */
export async function callOpenAI(systemPrompt, userMessage, temperature = 0.7, maxTokens = 2000) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Call Base44's invokeExternalLLM function with correct parameter names
      // The function expects: prompt, systemPrompt, temperature, preferredProviders
      const response = await base44.functions.invoke('invokeExternalLLM', {
        prompt: userMessage,           // User's message (required)
        systemPrompt: systemPrompt,    // System prompt for agent role
        temperature: temperature,      // 0.7 is good for balanced responses
        preferredProviders: ['openai', 'deepseek'] // Try OpenAI first, fallback to DeepSeek
      });

      if (!response) {
        throw new Error('No response from invokeExternalLLM function');
      }

      // Handle different response formats
      let content = response.output || response.content || response.text || response.message;
      
      if (!content) {
        throw new Error('Empty response from invokeExternalLLM function');
      }

      return content.toString().trim();
    } catch (error) {
      lastError = error;
      console.error(`invokeExternalLLM attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Don't retry on auth errors
      if (error.message && (error.message.includes('Unauthorized') || error.message.includes('Authentication'))) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`invokeExternalLLM call failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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
    // Call Base44's invokeExternalLLM function with correct parameters
    const response = await base44.functions.invoke('invokeExternalLLM', {
      prompt: userMessage,
      systemPrompt: agentSystemPrompt,
      temperature: 0.7,
      preferredProviders: ['openai', 'deepseek']
    });

    let fullResponse = response.output || response.content || response.text || response.message;
    
    if (!fullResponse) {
      throw new Error('Empty response from invokeExternalLLM');
    }

    fullResponse = fullResponse.toString().trim();

    // Simulate streaming by calling onChunk with the full response
    if (onChunk && fullResponse) {
      onChunk(fullResponse);
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
