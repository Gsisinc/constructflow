const SOURCE_PRIORITY = {
  sam_gov: 5,
  county_portal: 4,
  city_portal: 3,
  business_portal: 2,
  web: 1
};

const WORK_TYPE_KEYWORDS = {
  low_voltage: ['low voltage', 'structured cabling', 'access control', 'security camera', 'fire alarm'],
  data_cabling: ['data cabling', 'cat6', 'cat5e', 'structured wiring'],
  security_systems: ['security', 'camera', 'cctv', 'surveillance', 'access control'],
  av_systems: ['av', 'audio visual', 'conference room', 'video wall'],
  fiber_optic: ['fiber', 'fiber optic', 'osp', 'splice'],
  access_control: ['access control', 'badge', 'door controller'],
  fire_alarm: ['fire alarm', 'alarm system', 'notification appliance'],
  telecommunications: ['telecom', 'telecommunications', 'phone system'],
  electrical: ['electrical', 'switchgear', 'panel', 'wiring'],
  hvac: ['hvac', 'air handling', 'mechanical system'],
  plumbing: ['plumbing', 'pipe', 'fixtures'],
  mechanical: ['mechanical', 'chiller', 'boiler']
};

const normalizeCurrency = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const getObject = (payload) => (payload && typeof payload === 'object' ? payload : {});

export function normalizeOpportunity(raw = {}, source = 'web') {
  const data = getObject(raw);
  const title = data.project_name || data.title || data.rfp_name || data.name || 'Untitled opportunity';
  const agency = data.agency || data.client_name || data.department || data.owner || 'Unknown agency';
  const locationParts = [data.city || data.county, data.state].filter(Boolean);
  const location = data.location || locationParts.join(', ') || 'Location not specified';
  const estimatedValue =
    normalizeCurrency(data.estimated_value) ||
    normalizeCurrency(data.budget) ||
    normalizeCurrency(data.contract_value) ||
    null;
  const dueDate = normalizeDate(data.due_date || data.deadline || data.close_date);

  return {
    id: data.id || `${source}:${data.external_id || title}:${agency}`,
    external_id: data.external_id || data.notice_id || null,
    title,
    project_name: title,
    agency,
    client_name: agency,
    location,
    state: data.state || null,
    county: data.county || null,
    city: data.city || null,
    source,
    source_type: data.source_type || source,
    source_name: data.source_name || source,
    url: data.url || data.link || data.notice_url || null,
    description: data.description || data.scope || 'No description provided.',
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    estimated_value: estimatedValue,
    due_date: dueDate,
    status: data.status || 'active',
    classification: data.classification || null,
    work_type: data.work_type || null,
    posted_date: normalizeDate(data.posted_date || data.published_date),
    ai_insights: data.ai_insights || null
  };
}

const textContains = (text = '', keywords = []) => {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

export function scoreOpportunity(opportunity, filters = {}) {
  let score = SOURCE_PRIORITY[opportunity.source] || 0;
  const haystack = `${opportunity.title} ${opportunity.description}`.toLowerCase();

  if (filters.workType && filters.workType !== 'all') {
    const keywords = WORK_TYPE_KEYWORDS[filters.workType] || [filters.workType.replace('_', ' ')];
    if (textContains(haystack, keywords)) score += 6;
  }

  if (filters.classification && filters.classification !== 'all') {
    const classification = filters.classification.toLowerCase();
    if (haystack.includes(classification) || String(opportunity.classification || '').toLowerCase().includes(classification)) {
      score += 4;
    }
  }

  if (filters.state && String(opportunity.location || '').toLowerCase().includes(filters.state.toLowerCase())) {
    score += 3;
  }

  if (filters.cityCounty && String(opportunity.location || '').toLowerCase().includes(filters.cityCounty.toLowerCase())) {
    score += 2;
  }

  if (opportunity.estimated_value) score += 1;
  if (opportunity.due_date) score += 1;

  return score;
}

export function dedupeAndRankOpportunities(list = [], filters = {}) {
  const map = new Map();

  for (const item of list) {
    const key = `${(item.external_id || item.url || item.title || '').toLowerCase()}|${(item.agency || '').toLowerCase()}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, item);
      continue;
    }

    const currentScore = scoreOpportunity(current, filters);
    const nextScore = scoreOpportunity(item, filters);
    if (nextScore > currentScore) map.set(key, item);
  }

  return [...map.values()]
    .map((item) => ({ ...item, match_score: scoreOpportunity(item, filters) }))
    .sort((a, b) => b.match_score - a.match_score);
}

export function buildDiscoveryFingerprint(opportunity) {
  return `${opportunity.external_id || opportunity.title}|${opportunity.agency}|${opportunity.due_date || ''}`;
}

export function detectNewOpportunities({ previousFingerprints = [], opportunities = [] }) {
  const previous = new Set(previousFingerprints);
  return opportunities.filter((item) => !previous.has(buildDiscoveryFingerprint(item)));
}

async function invokeSafely(base44Client, functionName, payload) {
  try {
    const response = await base44Client.functions.invoke(functionName, payload);
    return getObject(response?.data);
  } catch (error) {
    return { success: false, functionName, error: error?.message || 'Invocation failed' };
  }
}

function parsePayloadResults(payload = {}) {
  const opportunities = payload.opportunities || payload.bids || payload.results || [];
  return Array.isArray(opportunities) ? opportunities : [];
}

export async function fetchDiscoveryFromSources({ base44Client, filters = {}, page = 1, pageSize = 50 }) {
  const request = {
    workType: filters.workType,
    classification: filters.classification,
    state: filters.state,
    county: filters.cityCounty,
    city: filters.cityCounty,
    page,
    pageSize
  };

  const calls = [
    { source: 'sam_gov', fn: 'scrapeSamGovBids' },
    ...(filters.state === 'California' ? [{ source: 'county_portal', fn: 'scrapeCaCounties' }] : []),
    { source: 'county_portal', fn: 'scrapeCountyBids' },
    { source: 'business_portal', fn: 'scrapeBusinessBids' },
    { source: 'web', fn: 'scrapeCaliforniaBids' }
  ];

  const responses = await Promise.all(calls.map((entry) => invokeSafely(base44Client, entry.fn, request)));

  const normalized = responses.flatMap((payload, index) => {
    const source = calls[index].source;
    return parsePayloadResults(payload).map((item) => normalizeOpportunity(item, source));
  });

  const ranked = dedupeAndRankOpportunities(normalized, filters);
  return {
    opportunities: ranked,
    sourceSummary: calls.map((entry, index) => ({
      source: entry.source,
      functionName: entry.fn,
      success: Boolean(responses[index]?.success),
      count: parsePayloadResults(responses[index]).length,
      error: responses[index]?.error || null
    }))
  };
}
