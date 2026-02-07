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

    // 2. FBO.gov/Construction.com RSS Feeds - WORKING sources
    const rssFeeds = [
      'https://www.fbo.gov/feeds/active',
      'https://public.govwins.com/rss/active-opps.xml',
      'https://www.bidsync.com/bidsync-rss.cfm',
      'https://www.bidnet.com/bneattach/RSS/RssBids.aspx?st=CA',
      'https://www.planetbids.com/portal/rss.cfm',
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

    // 3. State APIs that actually work
    if (state === 'California') {
      try {
        // CA State Contracts Register - public API
        const caResponse = await fetch('https://www.dgs.ca.gov/PD/Resources/Page-Content/Procurement-Division-Resources-List-Folder/Open-Solicitations', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (caResponse.ok) {
          const html = await caResponse.text();
          const $ = cheerio.load(html);
          
          $('table tr').slice(1, 50).each((i, elem) => {
            const cells = $(elem).find('td');
            if (cells.length >= 3) {
              const title = cells.eq(0).text().trim();
              const dueDate = cells.eq(1).text().trim();
              const link = cells.eq(0).find('a').attr('href');
              
              if (title && title.length > 10) {
                opportunities.push({
                  title,
                  project_name: title,
                  agency: 'California Department of General Services',
                  location: `${city || ''}, ${state}`.trim(),
                  estimated_value: 0,
                  due_date: extractDate(dueDate),
                  description: title,
                  url: link ? `https://www.dgs.ca.gov${link}` : 'https://www.dgs.ca.gov/PD',
                  source: 'CA DGS',
                  project_type: workType,
                  status: 'active'
                });
              }
            }
          });
          sitesScraped.push('CA DGS Open Solicitations');
        }
      } catch (err) {
        errors.push(`CA DGS: ${err.message}`);
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