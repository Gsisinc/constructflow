/**
 * Proxy API to bypass X-Frame-Options restrictions
 * Fetches website content and serves it through our backend
 */

export const fetchWithProxy = async (url) => {
  try {
    // Use cors-anywhere or similar service
    const corsProxyUrl = 'https://cors-proxy.htmldriven.com/?url=';
    const response = await fetch(corsProxyUrl + encodeURIComponent(url));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Proxy fetch error:', error);
    throw error;
  }
};

export const loadPageContent = async (url) => {
  try {
    const html = await fetchWithProxy(url);
    return html;
  } catch (error) {
    throw new Error(`Failed to load ${url}: ${error.message}`);
  }
};
