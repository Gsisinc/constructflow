import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as cheerio from 'npm:cheerio@1.0.0';
import { parseFeed } from 'npm:htmlparser2@9.1.0';

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

    // 1. SAM.gov API - Federal government bids
    try {
      console.log('🔍 Fetching from SAM.gov API...');
      
      // Build NAICS codes based on work type
      const naicsMap = {
        low_voltage: '238210',
        electrical: '238210',
        fire_alarm: '238210',
        data_cabling: '238210',
        security_systems: '238210',
        av_systems: '238210',
        telecommunications: '517311',
        hvac: '238220',
        plumbing: '238220',
        general_contractor: '236220',
        construction_management: '236220'
      };
      
      const naicsCode = naicsMap[workType] || '';
      
      // SAM.gov API v2 - search for construction opportunities
      const postedFrom = new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0];
      const postedTo = new Date().toISOString().split('T')[0];
      
      let samUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${Deno.env.get('SAM_GOV_API_KEY')}&postedFrom=${postedFrom}&postedTo=${postedTo}&limit=1000&ptype=p,o,k`;
      
      if (naicsCode) {
        samUrl += `&ncode=${naicsCode}`;
      }
      
      console.log('SAM.gov URL:', samUrl.replace(Deno.env.get('SAM_GOV_API_KEY'), 'API_KEY'));
      
      const samResponse = await fetch(samUrl, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'BidDiscovery/1.0'
        }
      });

      if (samResponse.ok) {
        const samData = await samResponse.json();
        console.log(`SAM.gov response: ${samData.totalRecords || 0} total records`);
        
        if (samData.opportunitiesData && samData.opportunitiesData.length > 0) {
          samData.opportunitiesData.forEach(opp => {
            // Add ALL federal opportunities - no filtering
            opportunities.push({
              title: opp.title,
              project_name: opp.title,
              agency: opp.department || opp.organizationName || opp.fullParentPathName || 'Federal Agency',
              location: `${opp.placeOfPerformance?.city?.name || ''}, ${opp.placeOfPerformance?.state?.name || state}`.trim() || 'United States',
              estimated_value: parseFloat(opp.award?.amount || 0),
              due_date: opp.responseDeadLine?.split('T')[0],
              description: opp.description?.substring(0, 500) || 'Federal construction opportunity',
              url: `https://sam.gov/opp/${opp.noticeId}/view`,
              source: 'SAM.gov (Federal)',
              project_type: workType,
              status: 'active'
            });
          });
          sitesScraped.push('SAM.gov API');
          console.log(`✓ SAM.gov: Found ${opportunities.length} federal opportunities`);
        } else {
          console.log('SAM.gov returned no opportunitiesData');
        }
      } else {
        const errorText = await samResponse.text();
        console.error('SAM.gov API error:', samResponse.status, errorText);
        errors.push(`SAM.gov API: ${samResponse.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (err) {
      errors.push(`SAM.gov API: ${err.message}`);
      console.error('SAM.gov API error:', err.message);
    }

    // 2. RSS Feeds from government sites
    const rssFeeds = [
      `https://www.bidnet.com/bneattach/RSS/RssBids.aspx`,
      `https://www.publicpurchase.com/gems/rss/`,
    ];

      for (const feedUrl of rssFeeds) {
      try {
        const response = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BidBot/1.0)' }
        });

        if (response.ok) {
          const xml = await response.text();
          const $ = cheerio.load(xml, { xmlMode: true });

          $('item').each((i, elem) => {
            const title = $(elem).find('title').text();
            const link = $(elem).find('link').text();
            const description = $(elem).find('description').text();
            const pubDate = $(elem).find('pubDate').text();

            if (title && link && (title.toLowerCase().includes(workType.toLowerCase().replace('_', ' ')) || 
                                 description.toLowerCase().includes(workType.toLowerCase().replace('_', ' ')))) {
              opportunities.push({
                title,
                project_name: title,
                agency: 'Various Agencies',
                location: `${city || ''} ${state}`.trim(),
                estimated_value: extractValue(description),
                due_date: extractDate(description) || new Date(pubDate).toISOString().split('T')[0],
                description: description.substring(0, 500),
                url: link,
                source: new URL(feedUrl).hostname,
                project_type: workType,
                status: 'active'
              });
            }
          });

          sitesScraped.push(new URL(feedUrl).hostname);
          console.log(`✓ RSS ${new URL(feedUrl).hostname}: Found opportunities`);
        }
      } catch (err) {
        errors.push(`RSS ${feedUrl}: ${err.message}`);
        console.error(`RSS error ${feedUrl}:`, err.message);
      }
      }

      // 3. Web scraping - improved with better selectors
      const webScrapeSites = [
      // BidNet
      { name: 'BidNet', url: `https://www.bidnet.com/bneattach/find-bids?keywords=${workType}`, selector: '.bid-item' },
      // DemandStar
      { name: 'DemandStar', url: `https://www.demandstar.com/supplier/bids/open`, selector: '.bid-listing' },
      // PlanetBids
      { name: 'PlanetBids', url: `https://www.planetbids.com/portal/portal.cfm`, selector: 'table tr' },
      // PublicPurchase.com
      { name: 'PublicPurchase', url: `https://www.publicpurchase.com/gems/register,search/`, selector: '.solicitation' },
      // BidSync
      { name: 'BidSync', url: `https://www.bidsync.com/bidsync-browse.cfm`, selector: '.bid-row' },
      // Periscope
      { name: 'Periscope S2G', url: `https://ws.periscopeholdings.com/PublicBids/search`, selector: '.bid-result' },
      // State portals
      { name: `${state} Procurement`, url: `https://procurement.${state.toLowerCase().replace(' ', '')}.gov`, selector: 'table tr, .bid-item' },
      ];

    // Scrape websites
    for (const site of webScrapeSites) {
      try {
        const response = await fetch(site.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) continue;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Look for common bid listing patterns
        const bidElements = $('table tr, .bid-item, .opportunity-row, article').slice(0, 20);

        bidElements.each((i, elem) => {
          const text = $(elem).text();
          const links = $(elem).find('a');
          
          // Filter by work type
          const workTypeKeywords = {
            fire_alarm: ['fire alarm', 'fire detection', 'fire safety', 'fire protection'],
            low_voltage: ['low voltage', 'data cabling', 'security system', 'access control'],
            electrical: ['electrical', 'power', 'lighting'],
            hvac: ['hvac', 'heating', 'ventilation', 'cooling'],
          };

          const keywords = workTypeKeywords[workType] || [workType];
          const matchesWorkType = keywords.some(kw => 
            text.toLowerCase().includes(kw.toLowerCase())
          );

          if (!matchesWorkType) return;

          // Extract opportunity details
          const title = $(elem).find('h3, h4, .title, strong').first().text().trim() || 
                       text.substring(0, 100).trim();
          
          const url = links.first().attr('href');
          const fullUrl = url?.startsWith('http') ? url : `${site.url}${url}`;

          if (title && title.length > 10) {
            opportunities.push({
              title,
              agency: site.name,
              location: city ? `${city}, ${state}` : state,
              estimated_value: extractValue(text),
              due_date: extractDate(text),
              description: text.substring(0, 300).trim(),
              url: fullUrl,
              source: site.name,
              project_type: workType
            });
          }
        });

        sitesScraped.push(site.name);
        } catch (err) {
        errors.push(`${site.name}: ${err.message}`);
        console.error(`Failed to scrape ${site.name}:`, err.message);
        }
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