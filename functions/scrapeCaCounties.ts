import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as cheerio from 'npm:cheerio@1.0.0';

// California county bid sources - start with top 3
const caCountySources = [
  {
    id: 'la-county',
    name: 'Los Angeles County',
    url: 'https://www.lacounty.gov/government/purchasing-and-contract-services/bids-and-rfps/',
    active: true,
    priority: 1
  },
  {
    id: 'san-diego',
    name: 'San Diego County',
    url: 'https://www.sandiegocounty.gov/content/sdc/purchasing/bids.html',
    active: true,
    priority: 1
  },
  {
    id: 'orange-county',
    name: 'Orange County',
    url: 'https://www.ocprocurement.com/bids',
    active: true,
    priority: 1
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara County',
    url: 'https://www.sccgov.org/sites/prc/Pages/solicitations.aspx',
    active: true,
    priority: 2
  },
  {
    id: 'alameda',
    name: 'Alameda County',
    url: 'https://www.acgov.org/gsa/purchasing/bidopportunities.htm',
    active: true,
    priority: 2
  }
];

// Check if bid is relevant to work type
function isRelevantBid(title, description, workType) {
  const text = (title + ' ' + description).toLowerCase();
  
  const keywordMap = {
    low_voltage: ['low voltage', 'low-voltage', 'structured cabling', 'data cabling', 'cat6', 'cat5e', 'network cabling'],
    fire_alarm: ['fire alarm', 'fire detection', 'fire safety', 'fire protection', 'fire panel', 'fire system'],
    electrical: ['electrical', 'power distribution', 'lighting', 'electrical system', 'electrical work'],
    security_systems: ['security system', 'access control', 'cctv', 'video surveillance', 'intrusion detection'],
    av_systems: ['audio visual', 'av system', 'sound system', 'presentation system', 'conference room av'],
    telecommunications: ['telecommunications', 'telecom', 'telephone system', 'voip', 'pbx'],
    hvac: ['hvac', 'heating', 'ventilation', 'air conditioning', 'cooling'],
    plumbing: ['plumbing', 'plumbing system', 'water', 'sewer', 'drainage']
  };
  
  const keywords = keywordMap[workType] || [workType.replace('_', ' ')];
  return keywords.some(keyword => text.includes(keyword));
}

// Extract date from various formats
function extractDate(text) {
  const patterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/i
  ];
  
  for (const pattern of patterns) {
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

// Extract dollar value
function extractValue(text) {
  const match = text.match(/\$[\d,]+(?:\.\d{2})?/);
  if (match) {
    return parseFloat(match[0].replace(/[$,]/g, ''));
  }
  return 0;
}

// Scrape a single county website
async function scrapeCounty(source, workType) {
  const bids = [];
  
  try {
    console.log(`🔍 Scraping ${source.name}...`);
    
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Generic scraping - look for common patterns
    // Tables
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header
      
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const titleCell = cells.first();
        const title = titleCell.text().trim() || titleCell.find('a').text().trim();
        const link = titleCell.find('a').attr('href') || $row.find('a').attr('href');
        const rowText = $row.text();
        
        if (title && title.length > 10 && isRelevantBid(title, rowText, workType)) {
          const fullUrl = link ? (link.startsWith('http') ? link : new URL(link, source.url).href) : source.url;
          
          bids.push({
            title,
            project_name: title,
            agency: source.name,
            location: `${source.name}, California`,
            estimated_value: extractValue(rowText),
            due_date: extractDate(rowText),
            description: rowText.substring(0, 300).trim(),
            url: fullUrl,
            source: source.name,
            source_url: source.url,
            project_type: workType,
            status: 'active'
          });
        }
      }
    });
    
    // Lists with links
    $('ul li, ol li').each((i, item) => {
      const $item = $(item);
      const link = $item.find('a');
      const title = link.text().trim() || $item.text().trim();
      const href = link.attr('href');
      const itemText = $item.text();
      
      if (title && title.length > 10 && href && isRelevantBid(title, itemText, workType)) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, source.url).href;
        
        bids.push({
          title,
          project_name: title,
          agency: source.name,
          location: `${source.name}, California`,
          estimated_value: extractValue(itemText),
          due_date: extractDate(itemText),
          description: itemText.substring(0, 300).trim(),
          url: fullUrl,
          source: source.name,
          source_url: source.url,
          project_type: workType,
          status: 'active'
        });
      }
    });
    
    // Div containers
    $('div.bid-item, div.opportunity, div.solicitation, article').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h2, h3, h4, .title').text().trim() || $elem.find('a').first().text().trim();
      const link = $elem.find('a').attr('href');
      const elemText = $elem.text();
      
      if (title && title.length > 10 && isRelevantBid(title, elemText, workType)) {
        const fullUrl = link ? (link.startsWith('http') ? link : new URL(link, source.url).href) : source.url;
        
        bids.push({
          title,
          project_name: title,
          agency: source.name,
          location: `${source.name}, California`,
          estimated_value: extractValue(elemText),
          due_date: extractDate(elemText),
          description: elemText.substring(0, 300).trim(),
          url: fullUrl,
          source: source.name,
          source_url: source.url,
          project_type: workType,
          status: 'active'
        });
      }
    });
    
    console.log(`✓ ${source.name}: Found ${bids.length} relevant bids`);
    return { success: true, bids, source: source.name };
    
  } catch (error) {
    console.error(`✗ ${source.name}: ${error.message}`);
    return { 
      success: false, 
      bids: [], 
      source: source.name, 
      error: error.message 
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { workType, testMode } = await req.json();
    
    if (!workType) {
      return Response.json({ error: 'workType is required' }, { status: 400 });
    }
    
    console.log(`🚀 Starting California county scrape for ${workType}`);
    
    // Get active sources
    const activeSources = caCountySources.filter(s => s.active);
    const allResults = [];
    const errors = [];
    
    // Scrape each county with 2 second delay between requests
    for (const source of activeSources) {
      const result = await scrapeCounty(source, workType);
      
      if (result.success) {
        allResults.push(...result.bids);
      } else {
        errors.push({ source: result.source, error: result.error });
      }
      
      // Polite delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Remove duplicates
    const uniqueBids = [];
    const seen = new Set();
    
    allResults.forEach(bid => {
      const key = `${bid.title}-${bid.source}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBids.push(bid);
      }
    });
    
    console.log(`📊 Total: ${uniqueBids.length} unique bids from ${activeSources.length} counties`);
    
    // Save to database unless test mode
    let savedCount = 0;
    if (!testMode && uniqueBids.length > 0) {
      try {
        await base44.asServiceRole.entities.BidOpportunity.bulkCreate(uniqueBids);
        savedCount = uniqueBids.length;
        console.log(`✓ Saved ${savedCount} bids to database`);
      } catch (dbError) {
        console.error('Database error:', dbError.message);
        errors.push({ source: 'database', error: dbError.message });
      }
    }
    
    return Response.json({
      success: true,
      summary: {
        countiesScraped: activeSources.length,
        countiesSucceeded: activeSources.length - errors.length,
        bidsFound: allResults.length,
        uniqueBids: uniqueBids.length,
        savedToDb: savedCount
      },
      bids: testMode ? uniqueBids.slice(0, 20) : uniqueBids,
      errors: errors.length > 0 ? errors : undefined,
      sources: activeSources.map(s => ({ name: s.name, url: s.url }))
    });
    
  } catch (error) {
    console.error('Scraper error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});