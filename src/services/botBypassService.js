/**
 * Bot Detection Bypass Service
 * Handles anti-bot measures like user agent rotation, delays, and proxy support
 */

// Rotating user agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
];

// Request delay configuration (in milliseconds)
const REQUEST_DELAYS = {
  min: 500,
  max: 2000
};

// Proxy configuration (optional)
const PROXY_CONFIG = {
  enabled: import.meta.env.VITE_PROXY_ENABLED === 'true' || process.env.PROXY_ENABLED === 'true',
  url: import.meta.env.VITE_PROXY_URL || process.env.PROXY_URL || null,
  rotation: import.meta.env.VITE_PROXY_ROTATION === 'true' || process.env.PROXY_ROTATION === 'true'
};

// Request tracking for rate limiting
const requestTracker = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTime: Date.now()
};

/**
 * Get random user agent
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Get random delay between requests
 */
function getRandomDelay() {
  return Math.random() * (REQUEST_DELAYS.max - REQUEST_DELAYS.min) + REQUEST_DELAYS.min;
}

/**
 * Wait for specified milliseconds
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build request headers to avoid bot detection
 */
export function buildBotAvoidanceHeaders() {
  return {
    'User-Agent': getRandomUserAgent(),
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
  };
}

/**
 * Rate-limited fetch with bot avoidance
 */
export async function rateLimitedFetch(url, options = {}) {
  // Calculate time since last request
  const timeSinceLastRequest = Date.now() - requestTracker.lastRequestTime;
  const randomDelay = getRandomDelay();
  
  // Wait if necessary
  if (timeSinceLastRequest < randomDelay) {
    await delay(randomDelay - timeSinceLastRequest);
  }

  // Update tracker
  requestTracker.lastRequestTime = Date.now();
  requestTracker.requestCount++;

  // Reset counter every hour
  if (Date.now() - requestTracker.resetTime > 3600000) {
    requestTracker.requestCount = 0;
    requestTracker.resetTime = Date.now();
  }

  // Build request with bot avoidance headers
  const headers = {
    ...buildBotAvoidanceHeaders(),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await rateLimitedFetch(url, options);

      // Handle 429 (Too Many Requests) and 503 (Service Unavailable)
      if (response.status === 429 || response.status === 503) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        
        console.warn(`Rate limited (${response.status}). Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }

      // Handle 500 errors with retry
      if (response.status === 500) {
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`Server error (500). Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
          await delay(waitTime);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Fetch failed (attempt ${attempt}/${maxRetries}). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }

  throw lastError || new Error(`Failed after ${maxRetries} attempts`);
}

/**
 * Get proxy URL if configured
 */
export function getProxyUrl() {
  if (!PROXY_CONFIG.enabled || !PROXY_CONFIG.url) {
    return null;
  }
  return PROXY_CONFIG.url;
}

/**
 * Check if proxy is enabled
 */
export function isProxyEnabled() {
  return PROXY_CONFIG.enabled && Boolean(PROXY_CONFIG.url);
}

/**
 * Get request statistics
 */
export function getRequestStats() {
  return {
    totalRequests: requestTracker.requestCount,
    lastRequestTime: new Date(requestTracker.lastRequestTime).toISOString(),
    proxyEnabled: isProxyEnabled(),
    userAgentCount: USER_AGENTS.length
  };
}

/**
 * Reset request tracker
 */
export function resetRequestTracker() {
  requestTracker.lastRequestTime = 0;
  requestTracker.requestCount = 0;
  requestTracker.resetTime = Date.now();
}

export default {
  buildBotAvoidanceHeaders,
  rateLimitedFetch,
  fetchWithRetry,
  getProxyUrl,
  isProxyEnabled,
  getRequestStats,
  resetRequestTracker,
  getRandomUserAgent,
  getRandomDelay
};
