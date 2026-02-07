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

    // 1. LAUSD Procurement - Real California school district bids
    try {
      console.log('🔍 Fetching from LAUSD Procurement...');
      const lausdResponse = await fetch('https://procurement.lausd.org/apps/pages/Solicitations', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (lausdResponse.ok) {
        const html = await lausdResponse.text();
        const $ = cheerio.load(html);

        // Parse the three bid tables
        $('table tr').each((i, row) => {
          const $row = $(row);
          const cells = $row.find('td');

          if (cells.length >= 3) {
            const dueDate = cells.eq(0).text().trim();
            const bidNo = cells.eq(1).text().trim();
            const description = cells.eq(2).text().trim();

            if (description && description.length > 5 && !description.includes('Bid Description')) {
              opportunities.push({
                title: description,
                project_name: description,
                agency: 'Los Angeles Unified School District',
                location: 'Los Angeles, California',
                estimated_value: 0,
                due_date: extractDate(dueDate),
                description: `${bidNo}: ${description}`,
                url: 'https://procurement.lausd.org/apps/pages/Solicitations',
                source: 'LAUSD',
                project_type: workType,
                status: 'active'
              });
            }
          }
        });

        sitesScraped.push('LAUSD Procurement');
        console.log(`✓ LAUSD: Found ${opportunities.length} opportunities`);
      }
    } catch (err) {
      errors.push(`LAUSD: ${err.message}`);
      console.error('LAUSD error:', err.message);
    }

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
      const bsResponse = await fetch(bidSyncUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (bsResponse.ok) {
        const xml = await bsResponse.text();
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
      const pbResponse = await fetch(planetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (pbResponse.ok) {
        const xml = await pbResponse.text();
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
      const ccResponse = await fetch(ccUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (ccResponse.ok) {
        const html = await ccResponse.text();
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