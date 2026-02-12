const WORK_TYPE_KEYWORDS = {
  low_voltage: ['low voltage', 'structured cabling', 'cctv', 'security', 'network', 'fiber'],
  electrical: ['electrical', 'power distribution', 'switchgear'],
  hvac: ['hvac', 'mechanical', 'air handling'],
  plumbing: ['plumbing', 'piping'],
  general_construction: ['general construction', 'tenant improvement', 'build-out', 'renovation']
};

export const detectWorkType = (prompt = '') => {
  const normalized = prompt.toLowerCase();

  for (const [workType, keywords] of Object.entries(WORK_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return workType;
    }
  }

  return 'all';
};

export const detectState = (prompt = '') => {
  const normalized = prompt.toLowerCase();
  const stateMatches = ['california', 'texas', 'florida', 'new york'];
  const found = stateMatches.find((state) => normalized.includes(state));
  return found ? found[0].toUpperCase() + found.slice(1) : 'California';
};

export const extractDiscoveryFilters = (prompt = '') => {
  return {
    workType: detectWorkType(prompt),
    state: detectState(prompt),
    page: 1,
    pageSize: 50
  };
};

export const normalizeOpportunities = (...responses) => {
  const merged = [];

  responses.forEach((response) => {
    const data = response?.data || {};
    const items = data.opportunities || data.bids || [];

    items.forEach((item) => {
      merged.push({
        ...item,
        _source_type: item.source || data.source || 'unknown'
      });
    });
  });

  const dedupedMap = new Map();
  for (const item of merged) {
    const key = `${item.url || ''}::${item.project_name || item.title || ''}::${item.due_date || ''}`;
    if (!dedupedMap.has(key)) dedupedMap.set(key, item);
  }

  return Array.from(dedupedMap.values());
};

export const rankOpportunities = (opportunities = []) => {
  const now = Date.now();

  return [...opportunities]
    .map((opp) => {
      const due = opp.due_date ? new Date(opp.due_date).getTime() : null;
      const dueScore = due ? Math.max(0, 30 - Math.floor((due - now) / (1000 * 60 * 60 * 24))) : 0;
      const valueScore = typeof opp.estimated_value === 'number' ? Math.min(20, opp.estimated_value / 50000) : 0;
      const qualityScore = opp.url ? 10 : 0;

      return {
        ...opp,
        _priority_score: Math.round(dueScore + valueScore + qualityScore)
      };
    })
    .sort((a, b) => b._priority_score - a._priority_score);
};

export const buildDiscoverySummary = (opportunities = [], filters = {}) => {
  if (opportunities.length === 0) {
    return `No live opportunities were found for ${filters.workType || 'selected work type'} in ${filters.state || 'selected state'}.`;
  }

  const top = opportunities.slice(0, 3).map((opp, index) => {
    const name = opp.project_name || opp.title || `Opportunity ${index + 1}`;
    const owner = opp.agency || opp.client_name || 'Unknown agency';
    const due = opp.due_date || 'No due date';
    return `${index + 1}) ${name} — ${owner} — Due: ${due}`;
  });

  return `Loaded ${opportunities.length} live opportunities. Top matches:\n${top.join('\n')}`;
};
