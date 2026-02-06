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
    
    // SAM.gov federal contracts
    const samResults = await scrapeSAMGov(workType, state);
    opportunities.push(...samResults);
    
    // State-specific portals
    const stateResults = await scrapeStateSites(state, workType);
    opportunities.push(...stateResults);
    
    // Create all opportunities in database
    if (opportunities.length > 0) {
      await base44.asServiceRole.entities.BidOpportunity.bulkCreate(
        opportunities.map(opp => ({
          title: opp.title,
          project_name: opp.title,
          agency: opp.agency,
          location: opp.location,
          estimated_value: opp.value || 0,
          due_date: opp.due_date,
          description: opp.description,
          url: opp.url,
          project_type: workType,
          status: 'active'
        }))
      );
    }
    
    return Response.json({ 
      success: true, 
      count: opportunities.length,
      opportunities 
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function scrapeSAMGov(workType, state) {
  const results = [];
  
  try {
    // SAM.gov search URL
    const searchTerm = encodeURIComponent(`${workType} ${state}`);
    const url = `https://sam.gov/api/prod/opps/v3/opportunities?limit=100&api_key=null&ptype=o&title=${searchTerm}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.opportunitiesData) {
        for (const opp of data.opportunitiesData.slice(0, 50)) {
          results.push({
            title: opp.title,
            agency: opp.departmentName || opp.fullParentPathName,
            location: opp.placeOfPerformance?.city?.name + ', ' + opp.placeOfPerformance?.state?.name || state,
            value: opp.award?.amount || 0,
            due_date: opp.responseDeadLine?.split('T')[0],
            description: opp.description?.substring(0, 500),
            url: `https://sam.gov/opp/${opp.noticeId}/view`
          });
        }
      }
    }
  } catch (error) {
    console.error('SAM.gov scraping error:', error);
  }
  
  return results;
}

async function scrapeStateSites(state, workType) {
  const results = [];
  
  // State-specific bid portals
  const statePortals = {
    'California': 'https://caleprocure.ca.gov/pages/index.aspx',
    'Texas': 'https://www.txsmartbuy.com/sp',
    'Florida': 'https://www.myflorida.com/apps/vbs/vbs_www.main_menu',
    'New York': 'https://www.ogs.ny.gov/procurement',
    'Illinois': 'https://www.illinois.gov/cms/business/sell2/Pages/default.aspx',
    'Pennsylvania': 'https://www.dgs.pa.gov/Pages/default.aspx',
    'Ohio': 'https://procure.ohio.gov/proc/',
    'Georgia': 'https://ssl.doas.ga.gov/gpr/',
    'North Carolina': 'https://www.ips.state.nc.us/',
    'Michigan': 'https://www.michigan.gov/dtmb/procurement',
    'New Jersey': 'https://www.njstart.gov/',
    'Virginia': 'https://eva.virginia.gov/',
    'Washington': 'https://omwbe.wa.gov/',
    'Arizona': 'https://www.azspcs.state.az.us/',
    'Massachusetts': 'https://www.mass.gov/orgs/operational-services-division',
    'Tennessee': 'https://www.tn.gov/generalservices/procurement.html',
    'Indiana': 'https://www.in.gov/idoa/procurement/',
    'Missouri': 'https://oa.mo.gov/purchasing/',
    'Maryland': 'https://procurement.maryland.gov/',
    'Wisconsin': 'https://vendornet.state.wi.us/',
    'Colorado': 'https://www.colorado.gov/dpa/dfp/spo',
    'Minnesota': 'https://mn.gov/admin/osp/',
    'South Carolina': 'https://procurement.sc.gov/',
    'Alabama': 'https://purchasing.alabama.gov/',
    'Louisiana': 'https://www.doa.la.gov/osp/',
    'Kentucky': 'https://eprocurement.ky.gov/',
    'Oregon': 'https://orpin.oregon.gov/',
    'Oklahoma': 'https://ok.gov/dcs/',
    'Connecticut': 'https://portal.ct.gov/DAS/Procurement',
    'Utah': 'https://purchasing.utah.gov/',
    'Iowa': 'https://das.iowa.gov/procurement',
    'Nevada': 'https://purchasing.nv.gov/',
    'Arkansas': 'https://www.dfa.arkansas.gov/offices/procurement/',
    'Kansas': 'https://admin.ks.gov/offices/procurement-and-contracts',
    'New Mexico': 'https://www.generalservices.state.nm.us/state-purchasing/',
    'Nebraska': 'https://das.nebraska.gov/materiel/',
    'West Virginia': 'https://purchasing.wv.gov/',
    'Idaho': 'https://purchasing.idaho.gov/',
    'Hawaii': 'https://spo.hawaii.gov/',
    'New Hampshire': 'https://www.das.nh.gov/purchasing/',
    'Maine': 'https://www.maine.gov/dafs/bbm/procurementservices',
    'Rhode Island': 'https://purchasing.ri.gov/',
    'Montana': 'https://gsd.mt.gov/',
    'Delaware': 'https://gss.omb.delaware.gov/',
    'South Dakota': 'https://boa.sd.gov/procurement/',
    'North Dakota': 'https://www.nd.gov/omb/public/procurement',
    'Alaska': 'https://online.doa.alaska.gov/',
    'Vermont': 'https://bgs.vermont.gov/',
    'Wyoming': 'https://ai.wyo.gov/divisions/procurement-and-property-management',
  };
  
  const portal = statePortals[state];
  
  if (portal) {
    try {
      const response = await fetch(portal, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Generic scraping - look for links with "bid", "rfp", "solicitation"
        $('a').each((i, elem) => {
          const text = $(elem).text().toLowerCase();
          const href = $(elem).attr('href');
          
          if (href && (text.includes('bid') || text.includes('rfp') || text.includes('solicitation'))) {
            results.push({
              title: $(elem).text().trim(),
              agency: `${state} State Government`,
              location: state,
              value: 0,
              due_date: null,
              description: '',
              url: href.startsWith('http') ? href : portal + href
            });
          }
        });
      }
    } catch (error) {
      console.error(`Error scraping ${state} portal:`, error);
    }
  }
  
  return results.slice(0, 20);
}