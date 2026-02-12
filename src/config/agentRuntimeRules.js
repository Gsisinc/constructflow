import { getAgentWorkflow } from './agentWorkflows.js';

const DISCOVERY_KEYWORDS = ['find bids', 'discover bids', 'search bids', 'scrape', 'sam.gov', 'opportunities', 'rfp'];

export const isLiveDiscoveryRequest = (text = '') => {
  const normalized = text.toLowerCase();
  return DISCOVERY_KEYWORDS.some((kw) => normalized.includes(kw));
};

export const shouldInvokeLiveDiscovery = (agentId, messageText = '') => {
  const workflow = getAgentWorkflow(agentId);
  return Boolean(workflow?.supportsLiveBidDiscovery) && isLiveDiscoveryRequest(messageText);
};
