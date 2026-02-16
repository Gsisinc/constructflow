/**
 * County Bid Scraper Service
 * Scrapes real bid opportunities from county websites
 * 
 * Supports:
 * - California county websites
 * - City procurement portals
 * - Regional bid boards
 */

import * as cheerio from 'cheerio';

/**
 * County bid portal configurations
 * Each entry contains URL patterns and selectors for scraping
 */
const COUNTY_PORTALS = {
  'Los Angeles': {
    name: 'Los Angeles County',
    urls: [
      'https://dpw.lacounty.gov/business/bids-and-rfps/',
      'https://lacounty.gov/business/'
    ],
    selectors: {
      bidContainer: '.bid-item, .opportunity, .rfp-item',
      title: '.bid-title, .opportunity-title, h3',
      agency: '.agency, .department',
      dueDate: '.due-date, .deadline',
      value: '.bid-value, .contract-value'
    }
  },
  'San Francisco': {
    name: 'San Francisco',
    urls: [
      'https://sfgov.org/index.php/doing_business/bids_and_rfps',
      'https://sfgov.org/index.php/doing_business'
    ],
    selectors: {
      bidContainer: '.bid-item, .opportunity',
      title: '.bid-title, h3, a',
      agency: '.agency, .department',
      dueDate: '.due-date, .deadline',
      value: '.bid-value'
    }
  },
  'San Diego': {
    name: 'San Diego County',
    urls: [
      'https://www.sandiegocounty.gov/content/sdc/purchasing/bids.html',
      'https://www.sandiegocounty.gov/purchasing/'
    ],
    selectors: {
      bidContainer: '.bid-item, .opportunity, tr',
      title: '.bid-title, td:first-child, a',
      agency: '.agency, td:nth-child(2)',
      dueDate: '.due-date, td:nth-child(3)',
      value: '.bid-value, td:nth-child(4)'
    }
  },
  'Sacramento': {
    name: 'Sacramento County',
    urls: [
      'https://www.saccounty.net/Purchasing/Pages/default.aspx',
      'https://www.saccounty.net/Purchasing/'
    ],
    selectors: {
      bidContainer: '.bid-item, .opportunity',
      title: '.bid-title, a, h3',
      agency: '.agency',
      dueDate: '.due-date',
      value: '.bid-value'
    }
  },
  'Fresno': {
    name: 'Fresno County',
    urls: [
      'https://www.fresnocountyca.gov/departments/purchasing/bids',
      'https://www.fresnocountyca.gov/purchasing/'
    ],
    selectors: {
      bidContainer: '.bid-item, .opportunity',
      title: '.bid-title, a',
      agency: '.agency',
      dueDate: '.due-date',
      value: '.bid-value'
    }
  },
  'Alameda': {
    name: 'Alameda County',
    urls: [
      'https://www.acgov.org/purchasing/bids.htm',
      'https://www.acgov.org/purchasing/'
    ],
    selectors: {
      bidContainer: '.bid-item, .opportunity, tr',
      title: 'a, td:first-child',
      agency: '.agency, td:nth-child(2)',
      dueDate: '.due-date, td:nth-child(3)',
      value: '.bid-value'
    }
  },
  'Santa Clara': {
    name: 'Santa Clara County',
    urls: [
      'https://www.sccgov.org/sites/scc/Pages/default.aspx',
      'https://www.sccgov.org/sites/purchasing/'
    ],
    selectors: {
      bidContainer: '.bid-item, .opportunity',
      title: 'a, h3',
      agency: '.agency',
      dueDate: '.due-date',
      value: '.bid-value'
    }
  }
};

/**
 * Normalize county bid to standard format
 */
function normalizeCountyBid(rawBid, county, source) {
  return {
    id: rawBid.id || `${county}:${rawBid.title}:${rawBid.dueDate}`,
    external_id: rawBid.external_id || null,
    title: rawBid.title || 'Untitled Bid',
    project_name: rawBid.title || 'Untitled Bid',
    agency: rawBid.agency || county,
    client_name: rawBid.agency || county,
    location: `${county}, California`,
    state: 'California',
    county: county,
    city: rawBid.city || null,
    source: 'county_portal',
    source_type: 'county_portal',
    source_name: county,
    url: rawBid.url || null,
    description: rawBid.description || 'County bid opportunity',
    requirements: rawBid.requirements || [],
    estimated_value: rawBid.value ? parseFloat(rawBid.value) : null,
    due_date: rawBid.dueDate || null,
    status: 'active',
    classification: 'government',
    work_type: rawBid.workType || null,
    posted_date: rawBid.postedDate || null,
    ai_insights: null
  };
}

/**
 * Scrape county website for bids
 */
async function scrapeCountyWebsite(county, config) {
  const results = [];

  for (const url of config.urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract bids from page
      $(config.selectors.bidContainer).each((index, element) => {
        try {
          const $elem = $(element);
          const title = $elem.find(config.selectors.title).text().trim();
          const agency = $elem.find(config.selectors.agency).text().trim();
          const dueDate = $elem.find(config.selectors.dueDate).text().trim();
          const value = $elem.find(config.selectors.value).text().trim();
          const bidUrl = $elem.find('a').attr('href');

          if (title) {
            results.push(
              normalizeCountyBid(
                {
                  title,
                  agency: agency || config.name,
                  dueDate,
                  value,
                  url: bidUrl,
                  description: `Bid from ${config.name}`,
                  external_id: `${county}:${title}:${index}`
                },
                county,
                'county_portal'
              )
            );
          }
        } catch (e) {
          // Skip malformed entries
        }
      });
    } catch (error) {
      console.warn(`Failed to scrape ${county} from ${url}:`, error.message);
    }
  }

  return results;
}

/**
 * Fetch opportunities from all county portals
 */
export async function fetchCountyBidOpportunities(filters = {}) {
  const allBids = [];
  const errors = [];

  // Filter counties based on state
  let countiestoScrape = Object.entries(COUNTY_PORTALS);
  
  if (filters.state && filters.state !== 'California') {
    // For now, only California counties are supported
    return {
      opportunities: [],
      error: 'County scraping only supported for California',
      source: 'county_portal'
    };
  }

  if (filters.cityCounty) {
    countiestoScrape = countiestoScrape.filter(
      ([key]) => key.toLowerCase().includes(filters.cityCounty.toLowerCase())
    );
  }

  // Scrape each county
  for (const [county, config] of countiestoScrape) {
    try {
      const countyBids = await scrapeCountyWebsite(county, config);
      allBids.push(...countyBids);
    } catch (error) {
      errors.push({ county, error: error.message });
    }
  }

  return {
    opportunities: allBids,
    errors,
    source: 'county_portal',
    success: allBids.length > 0
  };
}

/**
 * Scrape a specific county
 */
export async function scrapeSpecificCounty(county) {
  const config = COUNTY_PORTALS[county];
  if (!config) {
    return {
      opportunities: [],
      error: `County ${county} not configured`
    };
  }

  try {
    const opportunities = await scrapeCountyWebsite(county, config);
    return {
      opportunities,
      success: opportunities.length > 0
    };
  } catch (error) {
    return {
      opportunities: [],
      error: error.message
    };
  }
}

export default {
  fetchCountyBidOpportunities,
  scrapeSpecificCounty,
  COUNTY_PORTALS,
  normalizeCountyBid
};
