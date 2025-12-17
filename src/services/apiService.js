// apiService.js - A utility to handle API requests with CORS bypass
export const apiService = {
  async get(endpoint) {
    try {
      // Using a CORS proxy service to bypass CORS restrictions
      // Note: This is a workaround for client-side CORS issues
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://dramabox.sansekai.my.id${endpoint}`)}`;

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // The proxy service wraps the response, so we need to extract the actual content
      if (data && data.contents) {
        try {
          // Parse the JSON content returned by the proxy service
          return JSON.parse(data.contents);
        } catch (parseError) {
          console.error('Error parsing proxy response:', parseError);
          throw parseError;
        }
      } else {
        // If the proxy service format is different, try to return the content directly
        return data;
      }
    } catch (error) {
      console.error('API request failed:', error.message);

      // Provide fallback data structure to avoid breaking the UI
      // This ensures the app remains functional even if the API is temporarily unavailable
      if (endpoint.includes('/api/dramabox/latest')) {
        return [];
      } else if (endpoint.includes('/api/dramabox/trending')) {
        return [];
      } else if (endpoint.includes('/api/dramabox/foryou')) {
        return [];
      } else if (endpoint.includes('/api/dramabox/search')) {
        return [];
      }

      // If we don't have a specific fallback, return an empty array
      return [];
    }
  }
};