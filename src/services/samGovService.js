/**
 * SAM.GOV Bid Discovery Service
 * Fetches real federal contracting opportunities from SAM.GOV API
 * 
 * API Documentation: https://open.sam.gov/api/opportunities/v2/search
 */

const SAM_GOV_API_BASE = 'https://api.sam.gov/opportunities/v2/search';
const SAM_GOV_API_KEY = import.meta.env.VITE_SAM_GOV_API_KEY || process.env.SAM_GOV_API_KEY;

/**
 * Map work types to SAM.GOV NAICS codes
 */
const WORK_TYPE_TO_NAICS = {
  low_voltage: ['334210', '335999', '238210'], // Electronic components, Electrical equipment, Electrical contractors
  electrical: ['238210', '335999'], // Electrical contractors, Electrical equipment
  hvac: ['238220', '333415'], // Plumbing, heating, and air-conditioning contractors
  plumbing: ['238220'], // Plumbing contractors
  security_systems: ['334290', '561621'], // Other communications equipment, Security systems services
  data_cabling: ['334210', '238210'], // Electronic components, Electrical contractors
  general_construction: ['236000', '236210', '236220'], // Construction of buildings
  telecommunications: ['517311', '334210'], // Wired telecommunications carriers
  mechanical: ['238220', '333415'], // HVAC and mechanical contractors
  fiber_optic: ['334210', '238210'] // Electronic components, Electrical contractors
};

/**
 * Map states to SAM.GOV state codes
 */
const STATE_CODES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN',
  'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

/**
 * Normalize SAM.GOV opportunity to standard format
 */
function normalizeSamGovOpportunity(samOpp) {
  return {
    id: samOpp.id || samOpp.notice_id,
    external_id: samOpp.notice_id,
    title: samOpp.title || samOpp.opportunity_title || 'Untitled',
    project_name: samOpp.title || samOpp.opportunity_title || 'Untitled',
    agency: samOpp.department_name || samOpp.agency || 'Federal Government',
    client_name: samOpp.department_name || samOpp.agency || 'Federal Government',
    location: [samOpp.city, samOpp.state].filter(Boolean).join(', ') || 'United States',
    state: samOpp.state,
    county: samOpp.county || null,
    city: samOpp.city,
    source: 'sam_gov',
    source_type: 'sam_gov',
    source_name: 'SAM.GOV',
    url: `https://sam.gov/opp/${samOpp.id}`,
    description: samOpp.description || samOpp.summary || 'No description provided',
    requirements: samOpp.requirements || [],
    estimated_value: samOpp.estimated_value ? Number(samOpp.estimated_value) : null,
    due_date: samOpp.response_deadline || samOpp.deadline || null,
    status: samOpp.status || 'active',
    classification: samOpp.classification || 'government',
    work_type: samOpp.work_type || null,
    posted_date: samOpp.posted_date || samOpp.publish_date || null,
    naics_code: samOpp.naics_code || null,
    set_aside: samOpp.set_aside || null,
    ai_insights: null
  };
}

/**
 * Build SAM.GOV API query
 */
function buildSamGovQuery(filters = {}) {
  const query = {
    keyword: [],
    ncode: [],
    state: [],
    limit: 100,
    offset: (filters.page - 1) * 100 || 0
  };

  // Add work type keywords
  if (filters.workType && filters.workType !== 'all') {
    const naicsCodes = WORK_TYPE_TO_NAICS[filters.workType] || [];
    query.ncode = naicsCodes;
    query.keyword.push(filters.workType.replace('_', ' '));
  }

  // Add state
  if (filters.state) {
    const stateCode = STATE_CODES[filters.state];
    if (stateCode) {
      query.state.push(stateCode);
    }
  }

  // Add classification
  if (filters.classification && filters.classification !== 'all') {
    query.keyword.push(filters.classification);
  }

  return query;
}

/**
 * Fetch opportunities from SAM.GOV
 */
export async function fetchSamGovOpportunities(filters = {}) {
  if (!SAM_GOV_API_KEY) {
    console.warn('SAM.GOV API key not configured');
    return {
      opportunities: [],
      error: 'SAM.GOV API key not configured',
      source: 'sam_gov'
    };
  }

  try {
    const query = buildSamGovQuery(filters);
    
    // Build query string
    const params = new URLSearchParams();
    params.append('api_key', SAM_GOV_API_KEY);
    params.append('limit', query.limit);
    params.append('offset', query.offset);
    
    if (query.keyword.length > 0) {
      params.append('keyword', query.keyword.join(' '));
    }
    
    if (query.ncode.length > 0) {
      params.append('ncode', query.ncode.join(','));
    }
    
    if (query.state.length > 0) {
      params.append('state', query.state.join(','));
    }

    const url = `${SAM_GOV_API_BASE}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SAM.GOV API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    const opportunities = (data.opportunitiesData || data.results || [])
      .map(normalizeSamGovOpportunity)
      .filter(opp => opp.id && opp.title);

    return {
      opportunities,
      total: data.totalRecords || opportunities.length,
      source: 'sam_gov',
      success: true
    };
  } catch (error) {
    console.error('SAM.GOV fetch error:', error);
    return {
      opportunities: [],
      error: error.message,
      source: 'sam_gov',
      success: false
    };
  }
}

/**
 * Search SAM.GOV with custom query
 */
export async function searchSamGov(searchTerm = '', filters = {}) {
  if (!SAM_GOV_API_KEY) {
    return { opportunities: [], error: 'API key not configured' };
  }

  try {
    const params = new URLSearchParams();
    params.append('api_key', SAM_GOV_API_KEY);
    params.append('keyword', searchTerm);
    params.append('limit', 100);

    if (filters.state) {
      const stateCode = STATE_CODES[filters.state];
      if (stateCode) {
        params.append('state', stateCode);
      }
    }

    const url = `${SAM_GOV_API_BASE}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SAM.GOV API error: ${response.status}`);
    }

    const data = await response.json();
    const opportunities = (data.opportunitiesData || [])
      .map(normalizeSamGovOpportunity);

    return { opportunities, total: data.totalRecords || 0 };
  } catch (error) {
    console.error('SAM.GOV search error:', error);
    return { opportunities: [], error: error.message };
  }
}

export default {
  fetchSamGovOpportunities,
  searchSamGov,
  normalizeSamGovOpportunity,
  buildSamGovQuery,
  STATE_CODES,
  WORK_TYPE_TO_NAICS
};
