/**
 * Real Bid Discovery Service
 * Unified service that fetches real bids from SAM.GOV and county websites
 * Replaces fake/mock data with actual live opportunities
 */

import { fetchSamGovOpportunities } from './samGovService';
import { fetchCountyBidOpportunities } from './countyBidScraper';

/**
 * Deduplicate opportunities by external ID and title
 */
function deduplicateOpportunities(opportunities) {
  const seen = new Map();
  
  for (const opp of opportunities) {
    const key = `${opp.external_id || opp.title}|${opp.agency}|${opp.due_date || ''}`;
    
    if (!seen.has(key)) {
      seen.set(key, opp);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Score opportunity based on relevance filters
 */
function scoreOpportunity(opp, filters = {}) {
  let score = 0;

  // Source priority
  const sourcePriority = {
    'sam_gov': 10,
    'county_portal': 8,
    'city_portal': 7,
    'business_portal': 5,
    'web': 3
  };
  score += sourcePriority[opp.source] || 0;

  // Work type match
  if (filters.workType && filters.workType !== 'all') {
    const titleLower = `${opp.title} ${opp.description}`.toLowerCase();
    const workTypeLower = filters.workType.replace('_', ' ').toLowerCase();
    if (titleLower.includes(workTypeLower)) {
      score += 20;
    }
  }

  // Classification match
  if (filters.classification && filters.classification !== 'all') {
    if (opp.classification && opp.classification.toLowerCase().includes(filters.classification.toLowerCase())) {
      score += 15;
    }
  }

  // State match
  if (filters.state && opp.state) {
    if (opp.state.toLowerCase() === filters.state.toLowerCase()) {
      score += 10;
    }
  }

  // City/County match
  if (filters.cityCounty && opp.city) {
    if (opp.city.toLowerCase().includes(filters.cityCounty.toLowerCase())) {
      score += 8;
    }
  }

  // Has value
  if (opp.estimated_value && opp.estimated_value > 0) {
    score += 5;
  }

  // Has due date
  if (opp.due_date) {
    score += 3;
  }

  // Has URL
  if (opp.url) {
    score += 2;
  }

  return score;
}

/**
 * Rank opportunities by relevance
 */
function rankOpportunities(opportunities, filters = {}) {
  return opportunities
    .map(opp => ({
      ...opp,
      relevance_score: scoreOpportunity(opp, filters)
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * Fetch real bid opportunities from all sources
 */
export async function fetchRealBidOpportunities(filters = {}) {
  const results = {
    opportunities: [],
    sources: [],
    totalFound: 0,
    errors: []
  };

  // Fetch from SAM.GOV
  console.log('🔍 Fetching from SAM.GOV...');
  try {
    const samGovResult = await fetchSamGovOpportunities(filters);
    results.sources.push({
      name: 'SAM.GOV',
      source: 'sam_gov',
      count: samGovResult.opportunities.length,
      success: samGovResult.success !== false,
      error: samGovResult.error || null
    });
    
    if (samGovResult.opportunities && samGovResult.opportunities.length > 0) {
      results.opportunities.push(...samGovResult.opportunities);
      console.log(`✅ Found ${samGovResult.opportunities.length} opportunities from SAM.GOV`);
    } else if (samGovResult.error) {
      console.warn(`⚠️ SAM.GOV error: ${samGovResult.error}`);
    } else {
      console.log('ℹ️ No opportunities found from SAM.GOV for these filters');
    }
  } catch (error) {
    console.error('❌ SAM.GOV fetch failed:', error);
    results.errors.push({ source: 'sam_gov', error: error.message });
  }

  // Fetch from county portals (California only)
  if (!filters.state || filters.state === 'California') {
    console.log('🔍 Fetching from California county portals...');
    try {
      const countyResult = await fetchCountyBidOpportunities(filters);
      results.sources.push({
        name: 'County Portals',
        source: 'county_portal',
        count: countyResult.opportunities.length,
        success: countyResult.success !== false,
        error: countyResult.error || null
      });
      
      if (countyResult.opportunities && countyResult.opportunities.length > 0) {
        results.opportunities.push(...countyResult.opportunities);
        console.log(`✅ Found ${countyResult.opportunities.length} opportunities from county portals`);
      } else if (countyResult.error) {
        console.warn(`⚠️ County portal error: ${countyResult.error}`);
      } else {
        console.log('ℹ️ No opportunities found from county portals');
      }
    } catch (error) {
      console.error('❌ County portal fetch failed:', error);
      results.errors.push({ source: 'county_portal', error: error.message });
    }
  }

  // Deduplicate
  const deduped = deduplicateOpportunities(results.opportunities);
  
  // Rank by relevance
  const ranked = rankOpportunities(deduped, filters);
  
  results.opportunities = ranked;
  results.totalFound = ranked.length;

  return results;
}

/**
 * Search for specific bid opportunities
 */
export async function searchBidOpportunities(searchTerm, filters = {}) {
  const results = await fetchRealBidOpportunities({
    ...filters,
    searchTerm
  });

  // Filter by search term if provided
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    results.opportunities = results.opportunities.filter(opp =>
      opp.title.toLowerCase().includes(searchLower) ||
      opp.description.toLowerCase().includes(searchLower) ||
      opp.agency.toLowerCase().includes(searchLower)
    );
  }

  return results;
}

/**
 * Get bid opportunities for a specific work type
 */
export async function getBidsForWorkType(workType, filters = {}) {
  return fetchRealBidOpportunities({
    ...filters,
    workType
  });
}

/**
 * Get bid opportunities for a specific state
 */
export async function getBidsForState(state, filters = {}) {
  return fetchRealBidOpportunities({
    ...filters,
    state
  });
}

/**
 * Get bid opportunities for a specific county
 */
export async function getBidsForCounty(county, state = 'California', filters = {}) {
  return fetchRealBidOpportunities({
    ...filters,
    state,
    cityCounty: county
  });
}

export default {
  fetchRealBidOpportunities,
  searchBidOpportunities,
  getBidsForWorkType,
  getBidsForState,
  getBidsForCounty,
  deduplicateOpportunities,
  rankOpportunities,
  scoreOpportunity
};
