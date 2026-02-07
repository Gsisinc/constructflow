import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as cheerio from 'npm:cheerio@1.0.0';

// In-memory cache
const scrapeCache = new Map();

// Defensive fetch with anti-blocking
async function defensiveFetch(url) {
  const cacheKey = `fetch:${url}`;
  const now = Date.now();
  const cached = scrapeCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp < 300000)) {
    console.log(`✓ Using cached result for ${url}`);
    return cached.html;
  }
  
  const delay = 2000 + Math.random() * 3000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'DNT': '1'
  };
  
  const response = await fetch(url, { headers, redirect: 'follow', timeout: 30000 });
  const html = await response.text();
  
  scrapeCache.set(cacheKey, { html, timestamp: now });
  console.log(`✓ Fetched ${url} - Status: ${response.status}`);
  return html;
}

// VERIFIED California county bid sources (real URLs confirmed by user)
const caCountySources = [
  // Priority 1: Verified active portals
  {
    id: 'la-county',
    name: 'Los Angeles County',
    url: 'https://camisvr.co.la.ca.us/lacobids/',
    active: true,
    priority: 1,
    verified: true
  },
  {
    id: 'orange-county',
    name: 'Orange County',
    url: 'https://cpo.oc.gov/open-bids-county-contracts-portal',
    active: true,
    priority: 1,
    verified: true
  },
  {
    id: 'del-norte',
    name: 'Del Norte County',
    url: 'https://www.co.del-norte.ca.us/BidOpportunities',
    active: true,
    priority: 1,
    verified: true
  },
  {
    id: 'ca-state-dgs',
    name: 'CA Dept of General Services',
    url: 'https://www.dgs.ca.gov/OBAS/Bid-Opportunities',
    active: true,
    priority: 1,
    verified: true,
    isState: true
  },
  
  // Priority 2: Large counties with procurement portals
  {
    id: 'san-diego',
    name: 'San Diego County',
    url: 'https://www.sandiegocounty.gov/content/sdc/purchasing.html',
    active: true,
    priority: 2
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
  },
  {
    id: 'riverside',
    name: 'Riverside County',
    url: 'https://www.rivco.org/purchasing',
    active: true,
    priority: 2
  },
  {
    id: 'san-bernardino',
    name: 'San Bernardino County',
    url: 'https://pws.sbcounty.gov/pws/default.aspx',
    active: true,
    priority: 2
  },
  {
    id: 'sacramento',
    name: 'Sacramento County',
    url: 'https://procurement.saccounty.net',
    active: true,
    priority: 3
  },
  {
    id: 'contra-costa',
    name: 'Contra Costa County',
    url: 'https://www.contracosta.ca.gov/1846/Bids-RFPs',
    active: true,
    priority: 3
  },
  {
    id: 'fresno',
    name: 'Fresno County',
    url: 'https://www.co.fresno.ca.us/departments/general-services-department/purchasing-division',
    active: true,
    priority: 3
  },
  {
    id: 'kern',
    name: 'Kern County',
    url: 'https://www.kerncounty.com/government/purchasing',
    active: true,
    priority: 3
  },
  {
    id: 'ventura',
    name: 'Ventura County',
    url: 'https://vcportal.ventura.org/Purchase/tabid/211/Default.aspx',
    active: true,
    priority: 3
  },
  {
    id: 'san-francisco',
    name: 'City and County of San Francisco',
    url: 'https://sfgov.org/oca/bidders-contractors',
    active: true,
    priority: 2
  }
];

// Check if bid is relevant to work type
function isRelevantBid(title, description, workType) {
  const text = (title + ' ' + description).toLowerCase();
  
  const keywordMap = {
    low_voltage: ['low voltage', 'low-voltage', 'structured cabling', 'data cabling', 'cat6', 'cat5e', 'cat 6', 'network cabling', 'voice data', 'telecommunications cabling', 'it infrastructure', 'network infrastructure'],
    fire_alarm: ['fire alarm', 'fire detection', 'fire safety', 'fire protection', 'fire panel', 'fire system', 'smoke detector'],
    electrical: ['electrical', 'power distribution', 'lighting', 'electrical system', 'electrical work', 'power system', 'generator', 'panel upgrade'],
    security_systems: ['security system', 'access control', 'cctv', 'video surveillance', 'intrusion detection', 'camera system', 'security camera'],
    av_systems: ['audio visual', 'av system', 'audiovisual', 'sound system', 'presentation system', 'conference room av', 'multimedia'],
    telecommunications: ['telecommunications', 'telecom', 'telephone system', 'voip', 'pbx', 'phone system'],
    hvac: ['hvac', 'heating', 'ventilation', 'air conditioning', 'cooling', 'mechanical', 'climate control'],
    plumbing: ['plumbing', 'plumbing system', 'water', 'sewer', 'drainage', 'pipe'],
    all: ['construction', 'project', 'contract', 'work']
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
    
    const html = await defensiveFetch(source.url);
    const $ = cheerio.load(html);
    
    // AGGRESSIVE PARSING - Find ALL links mentioning bids/RFPs
    const allLinks = [];
    $('a').each((i, link) => {
      const $link = $(link);
      const linkText = $link.text().trim();
      const href = $link.attr('href');
      
      if (!href || !linkText || linkText.length < 10) return;
      
      // Get context around the link
      const parent = $link.parent();
      const contextText = parent.text();
      
      // Check if looks like a bid
      const isBidLink = linkText.toLowerCase().includes('bid') ||
                       linkText.toLowerCase().includes('rfp') ||
                       linkText.toLowerCase().includes('rfq') ||
                       linkText.toLowerCase().includes('solicitation') ||
                       linkText.toLowerCase().includes('project') ||
                       contextText.toLowerCase().includes('bid') ||
                       contextText.toLowerCase().includes('solicitation');
      
      if (isBidLink) {
        allLinks.push({
          title: linkText,
          href: href,
          context: contextText,
          element: parent
        });
      }
    });
    
    console.log(`  Found ${allLinks.length} potential bid links`);
    
    // Process links and filter by work type
    allLinks.forEach(item => {
      const fullText = item.title + ' ' + item.context;
      
      if (!isRelevantBid(item.title, item.context, workType)) return;
      
      try {
        const fullUrl = item.href.startsWith('http') ? item.href : new URL(item.href, source.url).href;
        
        bids.push({
          title: item.title.substring(0, 200),
          project_name: item.title.substring(0, 200),
          agency: source.name,
          location: `${source.name}, California`,
          estimated_value: extractValue(fullText),
          due_date: extractDate(fullText),
          description: fullText.substring(0, 400).replace(/\s+/g, ' ').trim(),
          url: fullUrl,
          source: source.name,
          source_url: source.url,
          project_type: workType,
          status: 'active'
        });
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    // FALLBACK: Parse tables if links didn't work
    if (bids.length === 0) {
      $('table tr').each((i, row) => {
        if (i === 0) return;
        const $row = $(row);
        const rowText = $row.text();
        const link = $row.find('a').first();
        const title = link.text().trim() || $row.find('td').first().text().trim();
        
        if (title.length > 15 && isRelevantBid(title, rowText, workType)) {
          const href = link.attr('href');
          const fullUrl = href ? (href.startsWith('http') ? href : new URL(href, source.url).href) : source.url;
          
          bids.push({
            title: title.substring(0, 200),
            project_name: title.substring(0, 200),
            agency: source.name,
            location: `${source.name}, California`,
            estimated_value: extractValue(rowText),
            due_date: extractDate(rowText),
            description: rowText.substring(0, 400).replace(/\s+/g, ' ').trim(),
            url: fullUrl,
            source: source.name,
            source_url: source.url,
            project_type: workType,
            status: 'active'
          });
        }
      });
    }
    
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
    
    // Prioritize verified sources first
    const verifiedSources = caCountySources.filter(s => s.active && s.verified);
    const otherSources = caCountySources.filter(s => s.active && !s.verified);
    const allSources = [...verifiedSources, ...otherSources];
    
    const allResults = [];
    const errors = [];
    
    console.log(`📋 Scanning ${verifiedSources.length} verified + ${otherSources.length} other sources`);
    
    // Scrape each county with delays
    for (const source of allSources) {
      const result = await scrapeCounty(source, workType);
      
      if (result.success) {
        allResults.push(...result.bids);
        console.log(`  ✓ ${source.name}: ${result.bids.length} bids`);
      } else {
        errors.push({ source: result.source, error: result.error });
        console.log(`  ✗ ${source.name}: ${result.error}`);
      }
      
      // Polite delay only between requests (not after last one)
      if (allSources.indexOf(source) < allSources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
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
    
    console.log(`📊 Total: ${uniqueBids.length} unique bids from ${allSources.length} counties`);
    
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
        countiesScraped: allSources.length,
        countiesSucceeded: allSources.length - errors.length,
        bidsFound: allResults.length,
        uniqueBids: uniqueBids.length,
        savedToDb: savedCount
      },
      bids: testMode ? uniqueBids.slice(0, 20) : uniqueBids,
      errors: errors.length > 0 ? errors : undefined,
      sources: allSources.map(s => ({ name: s.name, url: s.url }))
    });
    
  } catch (error) {
    console.error('Scraper error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});