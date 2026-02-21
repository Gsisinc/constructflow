/**
 * Bid discovery search: SAM.gov API only, no fake data.
 * Every result must have a URL. Uses VITE_SAM_GOV_API_KEY.
 */
import { fetchSamGovOpportunities, searchSamGov } from '@/services/samGovService';

/**
 * Run bid discovery from SAM.gov. Returns only opportunities that have a valid URL.
 * No fake data; empty array if API key missing or no results.
 */
export async function searchBidsFromSam({ state, workType, classification, keyword, page = 1, pageSize = 50 }) {
  const filters = {
    state: state || undefined,
    workType: workType && workType !== 'all' ? workType : undefined,
    classification: classification && classification !== 'all' ? classification : undefined,
    page,
    pageSize,
  };

  let opportunities = [];

  if (keyword && String(keyword).trim()) {
    const result = await searchSamGov(String(keyword).trim(), { state: filters.state });
    opportunities = result.opportunities || [];
  } else {
    const result = await fetchSamGovOpportunities(filters);
    opportunities = result.opportunities || [];
  }

  const withUrl = opportunities.filter((opp) => {
    const url = opp.url || opp.link || opp.notice_url;
    const valid = url && String(url).startsWith('http') && !String(url).includes('undefined') && (opp.title || opp.project_name);
    return valid;
  });

  return {
    opportunities: withUrl,
    total: withUrl.length,
    source: 'sam_gov',
    message: withUrl.length === 0
      ? 'No results with valid URL from SAM.gov. Try different filters or add VITE_SAM_GOV_API_KEY.'
      : null,
  };
}
