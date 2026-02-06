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
    
    if (!workType || !state) {
      return Response.json({ 
        error: 'Missing required parameters: workType and state are required' 
      }, { status: 400 });
    }

    console.log(`Searching for ${workType} opportunities in ${state}, ${city || 'all cities'}`);
    
    const opportunities = [];
    
    const [samResults, stateResults, bidClerkResults, constructionResults] = await Promise.all([
      scrapeSAMGov(workType, state, city),
      scrapeStateSites(state, workType, city),
      scrapeBidClerk(workType, state, city),
      scrapeConstructionConnect(workType, state, city)
    ]);
    
    opportunities.push(...samResults);
    opportunities.push(...stateResults);
    opportunities.push(...bidClerkResults);
    opportunities.push(...constructionResults);
    
    const uniqueOpportunities = removeDuplicates(opportunities);
    const finalOpportunities = uniqueOpportunities.slice(0, 100);
    
    if (finalOpportunities.length > 0) {
      const bidPromises = finalOpportunities.map(opp => 
        base44.asServiceRole.entities.BidOpportunity.create({
          title: opp.title,
          project_name: opp.title,
          agency: opp.agency,
          location: opp.location,
          estimated_value: opp.value || 0,
          due_date: opp.due_date,
          description: opp.description || '',
          url: opp.url,
          project_type: workType,
          status: 'active'
        }).catch(err => {
          console.error('Failed to create bid opportunity:', err);
          return null;
        })
      );
      
      await Promise.all(bidPromises);
    }
    
    return Response.json({ 
      success: true, 
      count: finalOpportunities.length,
      opportunities: finalOpportunities
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return Response.json({ 
      error: 'Failed to fetch bid opportunities',
      details: error.message
    }, { status: 500 });
  }
});

async function scrapeSAMGov(workType, state, city) {
  const results = [];
  
  try {
    const searchTerms = [
      workType,
      ...getRelatedTerms(workType),
      getNAICSCodes(workType).map(code => `naics ${code}`)
    ].flat();
    
    for (const term of searchTerms.slice(0, 3)) {
      const searchTerm = encodeURIComponent(`${term} ${state} ${city || ''}`);
      const url = `https://sam.gov/api/prod/opps/v3/search?limit=50&api_key=public&q=${searchTerm}&sort=-modifiedDate`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://sam.gov/'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data._embedded?.opportunities) {
          for (const opp of data._embedded.opportunities) {
            const confidence = calculateConfidence(opp.title, workType, opp.description);
            
            if (confidence > 30) {
              results.push({
                title: opp.title || 'Untitled Opportunity',
                agency: opp.organizationName || 'Unknown Agency',
                location: `${opp.placeOfPerformanceAddress?.cityName || ''}, ${opp.placeOfPerformanceAddress?.stateCode || state}`.trim(),
                value: extractValue(opp.description || ''),
                due_date: opp.responseDeadLine || opp.activeDate,
                description: (opp.description || '').substring(0, 300),
                url: `https://sam.gov/opp/${opp.noticeId}/view`,
                source: 'SAM.gov',
                confidence_score: confidence
              });
            }
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('SAM.gov scraping error:', error);
  }
  
  return results;
}

async function scrapeStateSites(state, workType, city) {
  const results = [];
  
  const statePortals = {
    'California': 'https://caleprocure.ca.gov/pages/index.aspx',
    'Texas': 'https://www.txsmartbuy.com/sp',
    'Florida': 'https://vendor.myfloridamarketplace.com/',
    'New York': 'https://online.ogs.ny.gov/solicitation/search'
  };
  
  const portal = statePortals[state];
  
  if (portal) {
    try {
      const response = await fetch(portal, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const selectors = [
          '.bid-item', '.opportunity', '.solicitation',
          'table tr', '.list-item', '.result-item'
        ];
        
        for (const selector of selectors) {
          $(selector).each((i, elem) => {
            const titleElement = $(elem).find('a').first();
            const title = titleElement.text().trim();
            const href = titleElement.attr('href');
            
            if (title && href && isRelevant(title, workType)) {
              const fullUrl = href.startsWith('http') ? href : new URL(href, portal).toString();
              const description = $(elem).find('.description, .summary, p').text().trim() || '';
              
              results.push({
                title: title,
                agency: `${state} State Government`,
                location: city ? `${city}, ${state}` : state,
                value: extractValue($(elem).text()),
                due_date: extractDate($(elem).text()),
                description: description.substring(0, 200),
                url: fullUrl,
                source: `${state} Procurement Portal`,
                confidence_score: calculateConfidence(title, workType, description)
              });
            }
          });
          
          if (results.length >= 25) break;
        }
      }
    } catch (error) {
      console.error(`Error scraping ${state} portal:`, error);
    }
  }
  
  return results;
}

async function scrapeBidClerk(workType, state, city) {
  const results = [];
  
  try {
    const searchTerm = encodeURIComponent(`${workType} ${city || ''} ${state}`);
    const url = `https://www.bidclerk.com/search/projects?q=${searchTerm}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      $('.project-item, .bid-item').each((i, elem) => {
        const title = $(elem).find('.project-title, h3').text().trim();
        const href = $(elem).find('a').attr('href');
        
        if (title && href && isRelevant(title, workType)) {
          results.push({
            title: title,
            agency: 'Private/Commercial',
            location: $(elem).find('.location').text().trim() || state,
            value: extractValue($(elem).text()),
            due_date: extractDate($(elem).text()),
            description: $(elem).find('.description').text().trim().substring(0, 150),
            url: href.startsWith('http') ? href : `https://www.bidclerk.com${href}`,
            source: 'BidClerk',
            confidence_score: calculateConfidence(title, workType, $(elem).text())
          });
        }
      });
    }
  } catch (error) {
    console.error('BidClerk scraping error:', error);
  }
  
  return results.slice(0, 25);
}

async function scrapeConstructionConnect(workType, state, city) {
  const results = [];
  
  try {
    const searchTerm = encodeURIComponent(`${workType} project ${city || ''} ${state}`);
    const url = `https://www.construction.com/search/projects?query=${searchTerm}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      $('[data-project-id], .project-card').each((i, elem) => {
        const title = $(elem).find('.project-name, h4').text().trim();
        const href = $(elem).find('a').attr('href');
        const description = $(elem).find('.project-description, .details').text().trim();
        
        if (title && href && (isRelevant(description, workType) || isRelevant(title, workType))) {
          results.push({
            title: title,
            agency: 'Construction Projects',
            location: $(elem).find('.location').text().trim() || state,
            value: extractValue($(elem).text()),
            due_date: null,
            description: description.substring(0, 200),
            url: href.startsWith('http') ? href : `https://www.construction.com${href}`,
            source: 'Construction Connect',
            confidence_score: calculateConfidence(title, workType, description)
          });
        }
      });
    }
  } catch (error) {
    console.error('Construction Connect scraping error:', error);
  }
  
  return results.slice(0, 25);
}

function getRelatedTerms(workType) {
  const termMap = {
    'low voltage': ['low-voltage', 'lv', 'structured cabling', 'voice data', 'security systems', 'fire alarm'],
    'fire alarm': ['fire alarm', 'fire detection', 'life safety', 'sprinkler'],
    'electrical': ['electrical', 'wiring', 'power distribution', 'lighting'],
    'plumbing': ['plumbing', 'piping', 'mechanical'],
    'hvac': ['hvac', 'heating', 'ventilation', 'air conditioning']
  };
  
  return termMap[workType.toLowerCase()] || [workType];
}

function getNAICSCodes(workType) {
  const codeMap = {
    'low voltage': ['334290', '238210', '561621'],
    'fire alarm': ['334290', '238210'],
    'electrical': ['238210'],
    'plumbing': ['238220'],
    'hvac': ['238220']
  };
  
  return codeMap[workType.toLowerCase()] || [];
}

function calculateConfidence(title, workType, description) {
  const text = (title + ' ' + description).toLowerCase();
  const searchTerm = workType.toLowerCase();
  const relatedTerms = getRelatedTerms(workType);
  
  let score = 0;
  
  if (text.includes(searchTerm)) score += 40;
  
  relatedTerms.forEach(term => {
    if (text.includes(term)) score += 20;
  });
  
  getNAICSCodes(workType).forEach(code => {
    if (text.includes(code)) score += 30;
  });
  
  if (/\$\d+(,\d+)*(\s*(million|thousand|k|m))?/i.test(text)) score += 15;
  if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(text)) score += 10;
  
  return Math.min(score, 100);
}

function extractValue(text) {
  const matches = text.match(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(million|thousand|k|m)?/i);
  if (matches) {
    let value = parseFloat(matches[1].replace(/,/g, ''));
    if (matches[2]) {
      const multiplier = {
        'million': 1000000,
        'm': 1000000,
        'thousand': 1000,
        'k': 1000
      }[matches[2].toLowerCase()];
      if (multiplier) value *= multiplier;
    }
    return value;
  }
  return 0;
}

function extractDate(text) {
  const datePatterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\w+\s+\d{1,2},\s+\d{4})\b/
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isRelevant(text, workType) {
  const lowerText = text.toLowerCase();
  const searchTerm = workType.toLowerCase();
  const relatedTerms = getRelatedTerms(workType);
  
  return lowerText.includes(searchTerm) || 
         relatedTerms.some(term => lowerText.includes(term)) ||
         getNAICSCodes(workType).some(code => lowerText.includes(code));
}

function removeDuplicates(opportunities) {
  const seen = new Set();
  return opportunities.filter(opp => {
    const key = `${opp.title}-${opp.url}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
}