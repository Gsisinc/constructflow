import { getAgentWorkflow } from './agentWorkflows.js';

const DISCOVERY_KEYWORDS = [
  'find bids',
  'discover bids',
  'search bids',
  'scrape',
  'sam.gov',
  'find opportunities',
  'search opportunities',
  'discover opportunities',
  'rfp',
  'find public',
  'find low-voltage',
  'find low voltage',
  'find electrical',
  'find hvac',
  'find plumbing',
  'search for bids',
  'search for opportunities',
  'search for cctv',
  'search for security',
  'search for low-voltage',
  'search for low voltage',
  'search for electrical',
  'look for bids',
  'look for opportunities',
  'looking for bids',
  'looking for opportunities'
];

export const isLiveDiscoveryRequest = (text = '') => {
  const normalized = text.toLowerCase();
  
  // Check for explicit discovery keywords
  const hasDiscoveryKeyword = DISCOVERY_KEYWORDS.some((kw) => normalized.includes(kw));
  
  // Additional check: if it's just asking "what factors" or "how to evaluate" without action verbs, it's not discovery
  const isQuestionAboutDiscovery = (
    (normalized.includes('what') || normalized.includes('how') || normalized.includes('which')) &&
    (normalized.includes('factor') || normalized.includes('consider') || normalized.includes('evaluate') || normalized.includes('criteria'))
  );
  
  // It's discovery only if it has keywords AND it's not just asking about how to do discovery
  return hasDiscoveryKeyword && !isQuestionAboutDiscovery;
};

export const shouldInvokeLiveDiscovery = (agentId, messageText = '') => {
  const workflow = getAgentWorkflow(agentId);
  return Boolean(workflow?.supportsLiveBidDiscovery) && isLiveDiscoveryRequest(messageText);
};
