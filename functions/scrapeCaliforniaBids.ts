import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as cheerio from 'npm:cheerio@1.0.0';
import { parseFeed } from 'npm:htmlparser2@9.1.0';

// In-memory cache for scraping results
const scrapeCache = new Map();

// Check robots.txt before scraping
async function checkRobotsTxt(siteUrl) {
  try {
    const robotsUrl = new URL('/robots.txt', siteUrl).toString();
    const resp = await fetch(robotsUrl, { timeout: 5000 });
    if (resp.ok) {
      const text = await resp.text();
      if (text.includes('User-agent: *') && text.includes('Disallow: /')) {
        console.warn(`🚫 robots.txt disallows scraping for ${siteUrl}`);
        return false;
      }
    }
  } catch (error) {
    console.log(`No robots.txt found for ${siteUrl}, proceeding cautiously.`);
  }
  return true;
}

// Defensive fetch with anti-blocking measures
async function defensiveFetch(url, options = {}) {
  const cacheKey = `fetch:${url}`;
  const now = Date.now();
  const cacheEntry = scrapeCache.get(cacheKey);

  // Return cached result if less than 5 minutes old
  if (cacheEntry && (now - cacheEntry.timestamp < 300000)) {
    console.log(`✓ Using cached result for ${url}`);
    return cacheEntry.html;
  }

  // Random delay between 2-5 seconds
  const delay = 2000 + Math.random() * 3000;
  console.log(`⏳ Waiting ${Math.round(delay / 1000)}s before fetching...`);
  await new Promise(resolve => setTimeout(resolve, delay));

  // Comprehensive browser headers
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'DNT': '1'
  };

  const fetchOptions = {
    headers: { ...defaultHeaders, ...options.headers },
    redirect: 'follow',
    timeout: 30000,
    ...options
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle common blocks
    if (response.status === 403) {
      throw new Error('403 Forbidden - IP or user-agent blocked');
    }
    if (response.status === 429) {
      throw new Error('429 Rate Limited - too many requests');
    }
    if (response.status === 503) {
      throw new Error('503 Service Unavailable - anti-bot protection');
    }

    const html = await response.text();
    
    // Detect Cloudflare or anti-bot challenges
    if (html.includes('Checking your browser') || 
        html.includes('Enable JavaScript and cookies') ||
        html.includes('cloudflare-challenge')) {
      throw new Error('Anti-bot challenge detected (Cloudflare/security)');
    }

    // Cache successful result
    scrapeCache.set(cacheKey, {
      html: html,
      timestamp: now
    });

    console.log(`✓ Fetched ${url} - Status: ${response.status}`);
    return html;

  } catch (error) {
    console.error(`✗ Defensive fetch failed for ${url}:`, error.message);
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workType, state, city, page = 1, pageSize = 500 } = await req.json();

    const opportunities = [];
    const sitesScraped = [];
    const errors = [];

    // 1. REAL CALIFORNIA COUNTY SCRAPING
    console.log('🔍 Scraping real California county bid sites...');

    // Call the dedicated county scraper
    try {
      const countyResponse = await base44.functions.invoke('scrapeCaCounties', {
        workType: workType
      });

      if (countyResponse.data.success && countyResponse.data.bids?.length > 0) {
        opportunities.push(...countyResponse.data.bids);
        sitesScraped.push(...(countyResponse.data.sources?.map(s => s.name) || []));
        console.log(`✓ County scraper found ${countyResponse.data.bids.length} opportunities`);
      }
    } catch (err) {
      errors.push(`County Scraper: ${err.message}`);
      console.error('County scraper error:', err);
    }

    // 2. SAMPLE DATA (only if no real data found)
    if (opportunities.length === 0) {
      console.log('📊 No real data found, generating sample bids...');

    const sampleBids = [
      // Low Voltage (multiple samples)
      {
        title: 'Structured Cabling System - Elementary School',
        project_name: 'Structured Cabling System - Elementary School',
        agency: 'Los Angeles County Office of Education',
        location: 'Downey, California',
        estimated_value: 185000,
        due_date: '2026-03-12',
        description: 'Cat6A cabling installation throughout 3-story school building, 250+ data drops, fiber backbone, patch panels.',
        url: 'https://lacoe.edu',
        source: 'LA County Education',
        project_type: 'low_voltage',
        status: 'active'
      },
      {
        title: 'Low Voltage Infrastructure - New Office Complex',
        project_name: 'Low Voltage Infrastructure',
        agency: 'San Diego County',
        location: 'San Diego, California',
        estimated_value: 420000,
        due_date: '2026-03-22',
        description: 'Complete low voltage system including data cabling, fiber optics, AV, security, and access control infrastructure.',
        url: 'https://sandiegocounty.gov',
        source: 'San Diego County',
        project_type: 'low_voltage',
        status: 'active'
      },
      {
        title: 'Network Cabling Upgrade - Hospital Wing',
        project_name: 'Network Cabling Upgrade',
        agency: 'Riverside County',
        location: 'Riverside, California',
        estimated_value: 315000,
        due_date: '2026-03-18',
        description: 'Hospital-grade Cat6A installation, 400+ data points, medical equipment connectivity, redundant pathways.',
        url: 'https://rivco.org',
        source: 'Riverside County',
        project_type: 'low_voltage',
        status: 'active'
      },
      {
        title: 'Structured Cabling - Government Building',
        project_name: 'Structured Cabling',
        agency: 'Fresno County',
        location: 'Fresno, California',
        estimated_value: 225000,
        due_date: '2026-03-25',
        description: 'Low voltage cabling for new county administration building, 180 workstations, fiber backbone.',
        url: 'https://fresnocountyca.gov',
        source: 'Fresno County',
        project_type: 'low_voltage',
        status: 'active'
      },
      {
        title: 'Data Center Cabling Infrastructure',
        project_name: 'Data Center Cabling',
        agency: 'Orange County',
        location: 'Santa Ana, California',
        estimated_value: 580000,
        due_date: '2026-03-20',
        description: 'Category 8 cabling, fiber optic backbone, cable management, testing and certification for data center.',
        url: 'https://ocgov.com',
        source: 'Orange County',
        project_type: 'low_voltage',
        status: 'active'
      },

      // Electrical
      {
        title: 'Electrical System Upgrade - High School Campus',
        project_name: 'Electrical System Upgrade',
        agency: 'Los Angeles Unified School District',
        location: 'Los Angeles, California',
        estimated_value: 450000,
        due_date: '2026-03-15',
        description: 'Complete electrical system modernization including panel upgrades, LED lighting installation, emergency power.',
        url: 'https://lausd.org',
        source: 'LAUSD',
        project_type: 'electrical',
        status: 'active'
      },
      {
        title: 'Power Distribution Upgrade',
        project_name: 'Power Distribution Upgrade',
        agency: 'Santa Clara County',
        location: 'San Jose, California',
        estimated_value: 890000,
        due_date: '2026-03-18',
        description: 'Data center power distribution, UPS systems, PDUs, backup generators, redundant electrical feeds.',
        url: 'https://sccgov.org',
        source: 'Santa Clara County',
        project_type: 'electrical',
        status: 'active'
      },
      {
        title: 'Electrical Service Upgrade - Library',
        project_name: 'Electrical Service Upgrade',
        agency: 'San Bernardino County',
        location: 'San Bernardino, California',
        estimated_value: 275000,
        due_date: '2026-03-16',
        description: 'Upgrade main service to 2000A, new distribution panels, LED lighting retrofit, emergency systems.',
        url: 'https://sbcounty.gov',
        source: 'San Bernardino County',
        project_type: 'electrical',
        status: 'active'
      },

      // Fire Alarm
      {
        title: 'Fire Alarm System Replacement',
        project_name: 'Fire Alarm System',
        agency: 'Orange County Public Works',
        location: 'Orange County, California',
        estimated_value: 195000,
        due_date: '2026-03-10',
        description: 'Addressable fire alarm system, pull stations, smoke detectors, monitoring equipment.',
        url: 'https://ocpublicworks.com',
        source: 'OC Public Works',
        project_type: 'fire_alarm',
        status: 'active'
      },
      {
        title: 'Fire Detection System - Courthouse',
        project_name: 'Fire Detection System',
        agency: 'Ventura County',
        location: 'Ventura, California',
        estimated_value: 285000,
        due_date: '2026-03-14',
        description: 'New fire alarm system with voice evacuation, beam detectors, emergency communications.',
        url: 'https://ventura.org',
        source: 'Ventura County',
        project_type: 'fire_alarm',
        status: 'active'
      },

      // Security Systems
      {
        title: 'Security Camera and Access Control',
        project_name: 'Security System',
        agency: 'City of San Francisco',
        location: 'San Francisco, California',
        estimated_value: 520000,
        due_date: '2026-03-28',
        description: 'IP surveillance cameras, card access system, integrated security monitoring platform.',
        url: 'https://sf.gov',
        source: 'SF City',
        project_type: 'security_systems',
        status: 'active'
      },
      {
        title: 'Campus Security System Upgrade',
        project_name: 'Campus Security',
        agency: 'Kern County',
        location: 'Bakersfield, California',
        estimated_value: 395000,
        due_date: '2026-03-21',
        description: 'Video surveillance, access control, intrusion detection, integrated security platform.',
        url: 'https://kerncounty.com',
        source: 'Kern County',
        project_type: 'security_systems',
        status: 'active'
      },

      // AV Systems
      {
        title: 'Audiovisual System - Conference Center',
        project_name: 'AV System',
        agency: 'City of Los Angeles',
        location: 'Los Angeles, California',
        estimated_value: 325000,
        due_date: '2026-04-12',
        description: 'Conference center AV including projection, sound reinforcement, video conferencing, control systems.',
        url: 'https://lacity.org',
        source: 'LA City',
        project_type: 'av_systems',
        status: 'active'
      },
      {
        title: 'Boardroom AV Integration',
        project_name: 'Boardroom AV',
        agency: 'Sacramento County',
        location: 'Sacramento, California',
        estimated_value: 175000,
        due_date: '2026-03-19',
        description: 'Executive boardroom AV system, 4K displays, wireless presentation, video conferencing.',
        url: 'https://saccounty.net',
        source: 'Sacramento County',
        project_type: 'av_systems',
        status: 'active'
      },

      // HVAC
      {
        title: 'HVAC Controls Upgrade',
        project_name: 'HVAC Controls',
        agency: 'California Department of General Services',
        location: 'Sacramento, California',
        estimated_value: 380000,
        due_date: '2026-04-05',
        description: 'Building automation system for HVAC, DDC controllers, sensors, energy management software.',
        url: 'https://dgs.ca.gov',
        source: 'CA DGS',
        project_type: 'hvac',
        status: 'active'
      },
      {
        title: 'HVAC System Replacement - School',
        project_name: 'HVAC System',
        agency: 'Contra Costa County',
        location: 'Martinez, California',
        estimated_value: 465000,
        due_date: '2026-03-23',
        description: 'Replace aging HVAC systems, new air handlers, chillers, controls, building automation.',
        url: 'https://contracosta.ca.gov',
        source: 'Contra Costa County',
        project_type: 'hvac',
        status: 'active'
      },

      // Fiber Optic
      {
        title: 'Fiber Optic Network Expansion',
        project_name: 'Fiber Network',
        agency: 'Alameda County',
        location: 'Oakland, California',
        estimated_value: 650000,
        due_date: '2026-03-25',
        description: 'Fiber optic cabling connecting 15 county facilities, redundant network paths, high-speed connectivity.',
        url: 'https://acgov.org',
        source: 'Alameda County',
        project_type: 'fiber_optic',
        status: 'active'
      },
      {
        title: 'Fiber Backbone Installation',
        project_name: 'Fiber Backbone',
        agency: 'Monterey County',
        location: 'Salinas, California',
        estimated_value: 425000,
        due_date: '2026-03-27',
        description: 'Single-mode fiber installation, 10Gbps backbone, OTDR testing, documentation.',
        url: 'https://co.monterey.ca.us',
        source: 'Monterey County',
        project_type: 'fiber_optic',
        status: 'active'
      }
    ];

    // Filter by work type
    const filteredSamples = sampleBids.filter(bid => 
      workType === 'all' || bid.project_type === workType
    );

    opportunities.push(...filteredSamples);
    sitesScraped.push('Sample Data (Demo)');
    console.log(`✓ Generated ${filteredSamples.length} sample bids`);

    // Add note about sample data
    errors.push('NOTE: Showing sample data. Real bid aggregation requires paid API subscriptions to BidClerk, BidNet, Dodge, or similar services.');

    // 2. SAM.gov API - Federal (skip if rate limited)
    if (Deno.env.get('SAM_GOV_API_KEY')) {
      try {
        const naicsMap = {
          low_voltage: '238210', electrical: '238210', fire_alarm: '238210',
          data_cabling: '238210', security_systems: '238210', av_systems: '238210',
          telecommunications: '517311', hvac: '238220', plumbing: '238220',
          general_contractor: '236220', construction_management: '236220'
        };

        const naicsCode = naicsMap[workType] || '';
        const fromDate = new Date(Date.now() - 60*24*60*60*1000);
        const toDate = new Date();
        const postedFrom = `${String(fromDate.getMonth() + 1).padStart(2, '0')}/${String(fromDate.getDate()).padStart(2, '0')}/${fromDate.getFullYear()}`;
        const postedTo = `${String(toDate.getMonth() + 1).padStart(2, '0')}/${String(toDate.getDate()).padStart(2, '0')}/${toDate.getFullYear()}`;

        let samUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${Deno.env.get('SAM_GOV_API_KEY')}&postedFrom=${postedFrom}&postedTo=${postedTo}&limit=100&ptype=p,o,k`;
        if (naicsCode) samUrl += `&ncode=${naicsCode}`;

        const samResponse = await fetch(samUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'BidDiscovery/1.0' }
        });

        if (samResponse.ok) {
          const samData = await samResponse.json();
          if (samData.opportunitiesData && samData.opportunitiesData.length > 0) {
            samData.opportunitiesData.forEach(opp => {
              opportunities.push({
                title: opp.title,
                project_name: opp.title,
                agency: opp.department || opp.organizationName || 'Federal Agency',
                location: `${opp.placeOfPerformance?.city?.name || ''}, ${opp.placeOfPerformance?.state?.name || state}`.trim() || state,
                estimated_value: parseFloat(opp.award?.amount || 0),
                due_date: opp.responseDeadLine?.split('T')[0],
                description: opp.description?.substring(0, 500) || 'Federal opportunity',
                url: `https://sam.gov/opp/${opp.noticeId}/view`,
                source: 'SAM.gov',
                project_type: workType,
                status: 'active'
              });
            });
            sitesScraped.push('SAM.gov');
          }
        }
      } catch (err) {
        // Skip SAM.gov if rate limited - don't block other sources
        console.log('SAM.gov skipped:', err.message);
      }
    }



    // 3. BidSync Public API - Free tier access
    try {
      const bidSyncUrl = `https://www.bidsync.com/bidsync-xml/active.xml`;
      const canScrape = await checkRobotsTxt(bidSyncUrl);

      if (canScrape) {
        const xml = await defensiveFetch(bidSyncUrl);
        const $ = cheerio.load(xml, { xmlMode: true });
        
        $('bid').slice(0, 100).each((i, elem) => {
          const title = $(elem).find('title').text().trim();
          const agency = $(elem).find('agency').text().trim();
          const location = $(elem).find('state').text().trim();
          const dueDate = $(elem).find('due-date').text().trim();
          const link = $(elem).find('link').text().trim();
          const desc = $(elem).find('description').text().trim();
          
          // Filter by state and work type
          if (location.includes(state) && title.length > 10) {
            opportunities.push({
              title,
              project_name: title,
              agency: agency || 'Various Agencies',
              location: `${location}, ${state}`,
              estimated_value: extractValue(desc),
              due_date: extractDate(dueDate),
              description: desc.substring(0, 500),
              url: link || 'https://www.bidsync.com',
              source: 'BidSync',
              project_type: workType,
              status: 'active'
            });
          }
        });
        sitesScraped.push('BidSync XML Feed');
      }
    } catch (err) {
      errors.push(`BidSync: ${err.message}`);
    }

    // 4. PlanetBids Open Data
    try {
      const planetUrl = `https://www.planetbids.com/portal/rss/activebids.xml`;
      const canScrape = await checkRobotsTxt(planetUrl);

      if (canScrape) {
        const xml = await defensiveFetch(planetUrl);
        const $ = cheerio.load(xml, { xmlMode: true });
        
        $('item').slice(0, 100).each((i, elem) => {
          const title = $(elem).find('title').text().trim();
          const link = $(elem).find('link').text().trim();
          const desc = $(elem).find('description').text().trim();
          const pubDate = $(elem).find('pubDate').text().trim();
          
          if (title && title.length > 10 && desc.includes(state)) {
            opportunities.push({
              title,
              project_name: title,
              agency: 'Various Agencies',
              location: state,
              estimated_value: extractValue(desc),
              due_date: extractDate(desc) || extractDate(pubDate),
              description: desc.substring(0, 500),
              url: link,
              source: 'PlanetBids',
              project_type: workType,
              status: 'active'
            });
          }
        });
        sitesScraped.push('PlanetBids RSS');
      }
    } catch (err) {
      errors.push(`PlanetBids: ${err.message}`);
    }

    // 5. Construct Connect Public Leads
    try {
      const ccUrl = `https://public.construction.com/projects/search?state=${state}&type=bid`;
      const canScrape = await checkRobotsTxt(ccUrl);

      if (canScrape) {
        const html = await defensiveFetch(ccUrl);
        const $ = cheerio.load(html);
        
        $('.project-card, .bid-item, [data-project]').slice(0, 50).each((i, elem) => {
          const title = $(elem).find('h3, h4, .title, .project-title').first().text().trim();
          const location = $(elem).find('.location, .address').text().trim();
          const dueDate = $(elem).find('.due-date, .bid-date').text().trim();
          const link = $(elem).find('a').first().attr('href');
          const desc = $(elem).find('.description, .summary').text().trim();
          
          if (title && title.length > 10) {
            opportunities.push({
              title,
              project_name: title,
              agency: 'Various Contractors',
              location: location || state,
              estimated_value: extractValue(desc),
              due_date: extractDate(dueDate),
              description: desc.substring(0, 500) || title,
              url: link?.startsWith('http') ? link : `https://public.construction.com${link}`,
              source: 'Construction.com',
              project_type: workType,
              status: 'active'
            });
          }
        });
        sitesScraped.push('Construction.com Public');
      }
    } catch (err) {
      errors.push(`Construction.com: ${err.message}`);
    }

        console.log(`📊 Total opportunities found: ${opportunities.length}`);

        // Sort by date and limit results
        const sortedOpportunities = opportunities
          .filter(opp => opp.title && opp.url)
          .sort((a, b) => new Date(b.due_date || 0) - new Date(a.due_date || 0));

        // Pagination logic
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, sortedOpportunities.length);
        const paginatedOpportunities = sortedOpportunities.slice(startIndex, endIndex);
    return Response.json({
      success: true,
      opportunities: paginatedOpportunities,
      sitesScraped,
      errors: errors.length > 0 ? errors : undefined,
      totalFound: paginatedOpportunities.length,
      totalAvailable: sortedOpportunities.length,
      currentPage: page,
      totalPages: Math.ceil(sortedOpportunities.length / pageSize),
      hasMore: page < Math.ceil(sortedOpportunities.length / pageSize),
      message: opportunities.length === 0 ? 'No opportunities found. Try different search criteria or check back later.' : undefined
    });

  } catch (error) {
    console.error('Scraper error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});

// Helper to extract dollar amounts
function extractValue(text) {
  const match = text.match(/\$[\d,]+(?:\.\d{2})?/);
  if (match) {
    return parseFloat(match[0].replace(/[$,]/g, ''));
  }
  return 0;
}

// Helper to extract dates
function extractDate(text) {
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime()) && date > new Date()) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        continue;
      }
    }
  }
  return null;
}