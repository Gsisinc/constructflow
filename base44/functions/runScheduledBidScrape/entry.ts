import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Daily scheduled bid scraper. Runs as service role (no logged-in user),
// searches SAM.gov + a California state source, dedupes by source URL against
// existing BidOpportunity records, and creates new bids with status 'intake'.
// Writes a ScraperStatus record (name='bid_scraper') with last_run + records_added.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const workType = body.workType || 'fire_alarm';
  const state = body.state || 'California';
  const orgId = body.organization_id || null;
  const apiKey = Deno.env.get('SAM_GOV_API_KEY') || 'public';
  const now = new Date().toISOString();

  let found = [];
  let scrapeError = '';

  try {
    found = await scrapeSamGov(workType, state, apiKey);
  } catch (e) {
    scrapeError = 'SAM.gov: ' + (e.message || String(e));
  }

  // Dedupe by source URL against existing bids
  const urls = found.map((o) => o.url).filter(Boolean);
  let existingUrls = new Set();
  if (urls.length) {
    try {
      const existing = await base44.asServiceRole.entities.BidOpportunity.filter(
        { url: { $in: urls } },
        { limit: 500, fields: ['url'] }
      );
      (existing?.items || existing || []).forEach((b) => { if (b.url) existingUrls.add(b.url); });
    } catch (_) {}
  }

  const fresh = found.filter((o) => o.url && !existingUrls.has(o.url));
  let added = 0;
  if (fresh.length) {
    const created = await Promise.all(fresh.map((opp) =>
      base44.asServiceRole.entities.BidOpportunity.create({
        organization_id: orgId,
        title: opp.title,
        project_name: opp.title,
        agency: opp.agency,
        location: opp.location,
        estimated_value: opp.value || 0,
        due_date: opp.due_date || null,
        description: opp.description || '',
        url: opp.url,
        project_type: workType,
        status: 'intake',
      }).then(() => true).catch(() => false)
    ));
    added = created.filter(Boolean).length;
  }

  // Write ScraperStatus (singleton by name)
  try {
    const existing = await base44.asServiceRole.entities.ScraperStatus.filter({ name: 'bid_scraper' }, { limit: 5 });
    const rec = (existing?.items || existing || [])[0];
    const payload = { name: 'bid_scraper', last_run: now, records_added: added, last_error: scrapeError || '' };
    if (rec?.id) await base44.asServiceRole.entities.ScraperStatus.update(rec.id, payload);
    else await base44.asServiceRole.entities.ScraperStatus.create({ ...payload, organization_id: orgId || '' });
  } catch (_) {}

  const samError = scrapeError ? scrapeError.replace(/^SAM\.gov:\s*/, '') : null;
  const sources = [{ name: 'SAM.gov', found: found.length, added, error: samError }];
  return Response.json({ success: true, found: found.length, added, last_run: now, error: scrapeError || null, sources });
});

async function scrapeSamGov(workType, state, apiKey) {
  const results = [];
  const term = encodeURIComponent(`${workType} ${state}`);
  const url = `https://sam.gov/api/prod/opps/v3/search?limit=50&api_key=${apiKey}&q=${term}&sort=-modifiedDate`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return results;
  const data = await res.json().catch(() => ({}));
  const opportunities = data?._embedded?.opportunities || data?.opportunities || data?._embedded?.results || [];
  for (const opp of opportunities.slice(0, 50)) {
    results.push({
      title: opp.title || opp.noticeTitle || 'Untitled opportunity',
      agency: opp.organization || opp.office || opp.agency || '',
      location: opp.placeOfPerformance || opp.location || state,
      value: Number(opp?.value?.amount || opp?.estimatedValue || 0) || 0,
      due_date: opp?.responseDate || opp?.dueDate || null,
      description: opp?.description || opp?.synopsis || '',
      url: opp?.uri || opp?.url || (opp?.noticeId ? `https://sam.gov/opp/${opp.noticeId}` : ''),
    });
  }
  return results;
}