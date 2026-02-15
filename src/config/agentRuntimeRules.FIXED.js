import { getAgentWorkflow } from './agentWorkflows.js';

/**
 * Enhanced discovery keyword detection
 * Combines action words with target words for better accuracy
 * and includes exclusion patterns to prevent false positives
 */

const ACTION_WORDS = [
  'find',
  'search',
  'discover',
  'look for',
  'get',
  'pull',
  'scrape',
  'locate',
  'identify'
];

const TARGET_WORDS = [
  'bid',
  'bids',
  'rfp',
  'rfq',
  'opportunity',
  'opportunities',
  'solicitation',
  'solicitations'
];

const SPECIFIC_SOURCES = [
  'sam.gov',
  'bidnet',
  'planetbids',
  'bonfire',
  'procureware'
];

// Patterns that indicate conceptual/informational queries rather than action requests
const EXCLUSION_PATTERNS = [
  'what factors',
  'how to',
  'how do i',
  'should i',
  'would you',
  'can you explain',
  'tell me about',
  'what are',
  'what is',
  'why',
  'when to'
];

/**
 * Determines if a message is requesting live bid discovery
 * Uses a two-stage check:
 * 1. First checks exclusion patterns (conceptual questions)
 * 2. Then checks for action + target word combinations or specific sources
 */
export const isLiveDiscoveryRequest = (text = '') => {
  const normalized = text.toLowerCase();
  
  // Stage 1: Check exclusion patterns
  // If the query is asking "how to" or "what factors", it's not a discovery request
  for (const pattern of EXCLUSION_PATTERNS) {
    if (normalized.includes(pattern)) {
      return false;
    }
  }
  
  // Stage 2: Check for action + target combinations
  // e.g., "find bids", "search opportunities", "get RFPs"
  for (const action of ACTION_WORDS) {
    for (const target of TARGET_WORDS) {
      if (normalized.includes(action) && normalized.includes(target)) {
        return true;
      }
    }
  }
  
  // Stage 3: Check for specific source mentions
  // e.g., "sam.gov bids", "scrape planetbids"
  for (const source of SPECIFIC_SOURCES) {
    if (normalized.includes(source)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Determines if an agent should invoke live discovery for a given message
 * Only Market Intelligence agent supports live discovery
 */
export const shouldInvokeLiveDiscovery = (agentId, messageText = '') => {
  const workflow = getAgentWorkflow(agentId);
  return Boolean(workflow?.supportsLiveBidDiscovery) && isLiveDiscoveryRequest(messageText);
};
