import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as cheerio from 'npm:cheerio@1.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workType, state, city } = await req.json();

    const opportunities = [];
    const sitesScraped = [];

    // California state sites to scrape
    const sites = [
      { name: 'Cal eProcure', url: 'https://www.bidcalifornia.ca.gov/search/index', selector: '.bid-row' },
      { name: 'LA County', url: 'https://www.lacounty.gov/business/contracting-opportunities/', selector: '.opportunity' },
      { name: 'San Diego County', url: 'https://buynet.sdcounty.ca.gov/psp/SDPROD/SUPPLIER/ERP/h/?tab=DEFAULT', selector: '.bid-listing' },
    ];

    // Scrape each site
    for (const site of sites) {
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
        console.error(`Failed to scrape ${site.name}:`, err.message);
      }
    }

    // If we found opportunities, save them
    if (opportunities.length > 0) {
      await base44.asServiceRole.entities.BidOpportunity.bulkCreate(opportunities);
    }

    return Response.json({
      success: true,
      opportunities,
      sitesScraped,
      totalFound: opportunities.length
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