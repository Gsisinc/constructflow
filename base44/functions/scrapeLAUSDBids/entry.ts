import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as cheerio from 'npm:cheerio@1.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔍 Fetching LAUSD bids...');
    
    const response = await fetch('https://procurement.lausd.org/apps/pages/Solicitations', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return Response.json({ 
        error: `Failed to fetch: ${response.status}`,
        success: false 
      }, { status: 500 });
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const bids = [];
    
    // Parse all table rows
    $('table tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 3) {
        const dueDate = cells.eq(0).text().trim();
        const bidNo = cells.eq(1).text().trim();
        const description = cells.eq(2).text().trim();
        
        // Skip headers and empty rows
        if (description && 
            description.length > 5 && 
            !description.includes('Bid Description') &&
            bidNo && 
            bidNo.length > 3) {
          
          bids.push({
            title: description,
            project_name: description,
            agency: 'Los Angeles Unified School District',
            location: 'Los Angeles, California',
            estimated_value: 0,
            due_date: parseDueDate(dueDate),
            description: `${bidNo}: ${description}`,
            url: 'https://procurement.lausd.org/apps/pages/Solicitations',
            source: 'LAUSD',
            source_url: 'https://procurement.lausd.org/apps/pages/Solicitations',
            project_type: classifyWorkType(description),
            status: 'active'
          });
        }
      }
    });
    
    console.log(`✓ Found ${bids.length} LAUSD bids`);
    
    // Save to database
    let savedCount = 0;
    if (bids.length > 0) {
      try {
        // Check for existing bids to avoid duplicates
        const existingBids = await base44.asServiceRole.entities.BidOpportunity.filter({
          source: 'LAUSD'
        });
        
        const existingTitles = new Set(existingBids.map(b => b.title));
        const newBids = bids.filter(b => !existingTitles.has(b.title));
        
        if (newBids.length > 0) {
          await base44.asServiceRole.entities.BidOpportunity.bulkCreate(newBids);
          savedCount = newBids.length;
          console.log(`✓ Saved ${savedCount} new bids`);
        }
      } catch (dbError) {
        console.error('Database error:', dbError.message);
      }
    }
    
    return Response.json({
      success: true,
      bids: bids,
      totalFound: bids.length,
      savedToDatabase: savedCount,
      source: 'LAUSD Procurement'
    });
    
  } catch (error) {
    console.error('Scraper error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});

function parseDueDate(dateStr) {
  try {
    // Format: "02/16/2026 12:15 PM"
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return `${match[3]}-${match[1]}-${match[2]}`;
    }
  } catch (e) {
    console.error('Date parse error:', e);
  }
  return null;
}

function classifyWorkType(description) {
  const text = description.toLowerCase();
  
  if (text.includes('electrical') || text.includes('lighting')) return 'electrical';
  if (text.includes('hvac') || text.includes('air conditioning') || text.includes('heating')) return 'hvac';
  if (text.includes('plumbing') || text.includes('water')) return 'plumbing';
  if (text.includes('low voltage') || text.includes('data') || text.includes('network')) return 'low_voltage';
  if (text.includes('fire alarm') || text.includes('fire protection')) return 'fire_alarm';
  if (text.includes('security') || text.includes('access control')) return 'security_systems';
  if (text.includes('audio') || text.includes('visual') || text.includes('av')) return 'av_systems';
  
  return 'general_contractor';
}