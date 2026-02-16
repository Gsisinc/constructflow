# Bot Detection Bypass & Proxy Configuration Guide

**Date:** February 15, 2026  
**Status:** ✅ IMPLEMENTED  
**Version:** 1.0

---

## Overview

The bid discovery system now includes advanced bot detection bypass mechanisms to handle website blocks and rate limiting. This guide explains how to configure and use these features.

---

## What's Included

### 1. **Bot Avoidance Service** (`botBypassService.js`)

Automatically handles:
- ✅ User agent rotation (8 different browsers)
- ✅ Random request delays (500-2000ms)
- ✅ Proper HTTP headers (Accept, Referer, etc.)
- ✅ Exponential backoff retry logic
- ✅ Rate limit detection (429, 503 responses)
- ✅ Request tracking and statistics

### 2. **Enhanced SAM.GOV Service**

Now includes:
- ✅ Bot avoidance headers
- ✅ Retry logic with exponential backoff
- ✅ Proper state filtering (fixed California-only issue)
- ✅ Double-check filtering on client side
- ✅ Debug logging for troubleshooting

### 3. **Proxy Support** (Optional)

For heavy scraping:
- ✅ Proxy URL configuration
- ✅ Proxy rotation support
- ✅ Fallback to direct requests

---

## Configuration

### Basic Setup (No Proxy)

1. **Get SAM.GOV API Key:**
   - Visit https://open.sam.gov/
   - Create free account
   - Generate API key in settings

2. **Add to Environment:**
   ```bash
   # .env file
   VITE_SAM_GOV_API_KEY=your_key_here
   ```

3. **No other configuration needed** - bot bypass is automatic!

### Advanced Setup (With Proxy)

For heavy scraping or if you hit rate limits:

#### Option A: Using ScraperAPI (Recommended)

1. **Sign up at:** https://www.scraperapi.com/
2. **Get API key**
3. **Configure:**
   ```bash
   VITE_PROXY_ENABLED=true
   VITE_PROXY_URL=http://api.scraperapi.com:8001
   VITE_PROXY_ROTATION=true
   ```

#### Option B: Using Bright Data

1. **Sign up at:** https://brightdata.com/
2. **Create residential proxy zone**
3. **Configure:**
   ```bash
   VITE_PROXY_ENABLED=true
   VITE_PROXY_URL=http://proxy.provider.com:port
   VITE_PROXY_ROTATION=true
   ```

#### Option C: Using Oxylabs

1. **Sign up at:** https://oxylabs.io/
2. **Get proxy credentials**
3. **Configure:**
   ```bash
   VITE_PROXY_ENABLED=true
   VITE_PROXY_URL=http://username:password@proxy.oxylabs.io:port
   VITE_PROXY_ROTATION=true
   ```

---

## How It Works

### Request Flow

```
User Request
    ↓
Bot Bypass Service
    ├─ Random User Agent
    ├─ Random Delay (500-2000ms)
    ├─ Proper Headers
    └─ Proxy (if configured)
    ↓
SAM.GOV / County Website
    ↓
Response Received
    ├─ Check Status Code
    ├─ Handle Rate Limits (429, 503)
    ├─ Retry with Backoff if needed
    └─ Return Data
    ↓
Client-Side Filtering
    ├─ Verify State Filter
    ├─ Deduplicate
    └─ Rank Results
    ↓
Display to User
```

### Retry Logic

**Exponential Backoff:**
- Attempt 1: Immediate
- Attempt 2: Wait 2 seconds
- Attempt 3: Wait 4 seconds
- Attempt 4: Wait 8 seconds

**Rate Limit Handling:**
- 429 (Too Many Requests): Wait time from header or exponential backoff
- 503 (Service Unavailable): Exponential backoff
- 500 (Server Error): Retry with exponential backoff

---

## Bot Avoidance Features

### 1. User Agent Rotation

Rotates between 8 different user agents:
- Chrome on Windows
- Chrome on Mac
- Chrome on Linux
- Firefox on Windows
- Firefox on Linux
- Safari on Mac
- Chrome on iPad

### 2. Request Delays

- **Min delay:** 500ms
- **Max delay:** 2000ms
- **Random:** Varies each request
- **Purpose:** Mimics human browsing patterns

### 3. HTTP Headers

Includes realistic headers:
```javascript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'Referer': 'https://sam.gov/',
  'Origin': 'https://sam.gov'
}
```

### 4. Request Tracking

Tracks:
- Total requests per session
- Last request time
- Request count per hour
- Auto-reset every hour

---

## State Filtering Fix

### Problem
Results were showing opportunities from all states instead of just California.

### Solution
Implemented **triple-layer filtering:**

1. **API Level:** State parameter in SAM.GOV API request
2. **Response Level:** Filter results after API response
3. **Client Level:** Double-check filtering before display

### Code Example
```javascript
// Layer 1: API Request
params.append('state', 'CA'); // Send to API

// Layer 2: Response Filtering
opportunities = opportunities.filter(opp => 
  opp.state === 'CA'
);

// Layer 3: Client-side verification
if (filters.state === 'California') {
  results = results.filter(opp => 
    opp.state === 'CA' || opp.state === 'California'
  );
}
```

---

## Troubleshooting

### Issue: Still Getting 500 Errors

**Solution 1: Increase Retry Attempts**
```javascript
// In samGovService.js
const response = await fetchWithRetry(url, options, 5); // Increase from 3 to 5
```

**Solution 2: Add Proxy**
```bash
VITE_PROXY_ENABLED=true
VITE_PROXY_URL=http://your_proxy:port
```

**Solution 3: Check API Key**
```bash
# Verify SAM.GOV API key is valid
curl "https://api.sam.gov/opportunities/v2/search?api_key=YOUR_KEY&limit=1"
```

### Issue: Results Still Not Filtered by State

**Check:**
1. Verify state parameter is being sent
2. Check browser console for debug logs
3. Verify STATE_CODES mapping includes your state

**Debug:**
```javascript
// In browser console
localStorage.setItem('bid_discovery_debug', 'true');
// Then search again and check console logs
```

### Issue: Requests Too Slow

**Solutions:**
1. Reduce delay range:
   ```javascript
   // In botBypassService.js
   min: 200,  // Reduce from 500
   max: 1000  // Reduce from 2000
   ```

2. Use proxy for faster requests
3. Batch requests instead of individual calls

### Issue: Proxy Not Working

**Check:**
1. Proxy URL is correct
2. Proxy credentials are valid
3. Proxy is accessible from your network
4. Try without proxy first

---

## Performance Tips

### 1. Cache Results
```javascript
// Cache for 15 minutes
const cacheKey = `bids_${filters.state}_${filters.workType}`;
const cached = localStorage.getItem(cacheKey);
if (cached && Date.now() - JSON.parse(cached).time < 15 * 60 * 1000) {
  return JSON.parse(cached).data;
}
```

### 2. Batch Requests
```javascript
// Instead of individual requests, batch them
const states = ['California', 'Texas', 'Florida'];
const results = await Promise.all(
  states.map(state => fetchRealBidOpportunities({ state }))
);
```

### 3. Reduce Delay for Trusted Sources
```javascript
// SAM.GOV is trusted, reduce delay
REQUEST_DELAYS.min = 300;
REQUEST_DELAYS.max = 800;
```

### 4. Use Pagination
```javascript
// Fetch one page at a time
const page1 = await fetchSamGovOpportunities({ ...filters, page: 1 });
const page2 = await fetchSamGovOpportunities({ ...filters, page: 2 });
```

---

## Monitoring

### Check Request Statistics

```javascript
import { getRequestStats } from '@/services/botBypassService';

const stats = getRequestStats();
console.log(stats);
// Output:
// {
//   totalRequests: 45,
//   lastRequestTime: "2026-02-15T18:36:00.000Z",
//   proxyEnabled: false,
//   userAgentCount: 8
// }
```

### Enable Debug Logging

```bash
# In .env
VITE_DEBUG_BID_DISCOVERY=true
```

Then check browser console for detailed logs:
```
🔍 Filtering by state: CA
📡 SAM.GOV Request: https://api.sam.gov/opportunities/v2/search?...
✅ Filtered 42 opportunities for California
```

---

## Best Practices

### 1. Respect Rate Limits
- Don't reduce delays too much
- Use caching when possible
- Batch requests efficiently

### 2. Use Proper User Agents
- Bot bypass automatically handles this
- Don't override unless necessary

### 3. Handle Errors Gracefully
- Implement retry logic (already done)
- Show clear error messages to users
- Log errors for debugging

### 4. Monitor Performance
- Track request times
- Monitor success rates
- Adjust delays if needed

### 5. Respect Website Terms
- Only scrape what's allowed
- Don't overload servers
- Follow robots.txt guidelines

---

## Legal Considerations

### SAM.GOV
- ✅ Public data
- ✅ Allowed to scrape
- ✅ API available
- ✅ No terms of service restrictions

### County Websites
- ⚠️ Check each website's terms
- ⚠️ Respect robots.txt
- ⚠️ Don't overload servers
- ⚠️ Consider reaching out for data feeds

### General
- ✅ Use bot bypass responsibly
- ✅ Don't use for malicious purposes
- ✅ Respect website policies
- ✅ Consider legal implications

---

## Support

### Debug Mode

Enable detailed logging:
```javascript
// In browser console
localStorage.setItem('bid_discovery_debug', 'true');
localStorage.setItem('bot_bypass_debug', 'true');
```

### Check Logs

```javascript
// View request statistics
import { getRequestStats } from '@/services/botBypassService';
console.log(getRequestStats());

// Reset tracker if needed
import { resetRequestTracker } from '@/services/botBypassService';
resetRequestTracker();
```

### Test Directly

```bash
# Test SAM.GOV API
curl -H "User-Agent: Mozilla/5.0" \
  "https://api.sam.gov/opportunities/v2/search?api_key=YOUR_KEY&state=CA&limit=10"

# Test county website
curl -H "User-Agent: Mozilla/5.0" \
  "https://dpw.lacounty.gov/business/bids-and-rfps/"
```

---

## Future Enhancements

- [ ] Implement JavaScript rendering for dynamic websites
- [ ] Add more proxy provider integrations
- [ ] Implement distributed scraping
- [ ] Add machine learning for better bot detection evasion
- [ ] Support for more data sources
- [ ] Real-time bid alerts via webhook

---

## Conclusion

The bot bypass system provides robust protection against bot detection while maintaining ethical scraping practices. With proper configuration, you can reliably fetch bid opportunities from SAM.GOV and county websites.

**Status:** ✅ **PRODUCTION READY**

---

**Report Generated:** February 15, 2026  
**Version:** 1.0 - Bot Bypass & Proxy Configuration  
**Status:** ✅ COMPLETE
