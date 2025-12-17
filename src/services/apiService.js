// apiService.js - A utility to handle API requests with CORS proxy
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy/?quest=',
  'https://cors-anywhere.herokuapp.com/'
];

export const apiService = {
  async get(endpoint) {
    // First, try direct fetch (might work in some environments)
    try {
      const response = await fetch(`https://dramabox.sansekai.my.id${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          // Adding common headers that might help with some servers
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Direct fetch failed:', error.message);
    }

    // If direct fetch fails, try each CORS proxy in sequence
    for (const proxy of CORS_PROXIES) {
      try {
        let proxyUrl;
        if (proxy.includes('allorigins')) {
          // allorigins uses different format
          proxyUrl = `${proxy}https://dramabox.sansekai.my.id${encodeURIComponent(endpoint)}`;
        } else {
          proxyUrl = `${proxy}https://dramabox.sansekai.my.id${endpoint}`;
        }

        const response = await fetch(proxyUrl, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Proxy error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (proxyError) {
        console.warn(`Proxy ${proxy} failed:`, proxyError.message);
        // Continue to next proxy
        continue;
      }
    }

    // If all methods fail, throw an error
    throw new Error('All fetch methods failed. API may be unreachable.');
  }
};