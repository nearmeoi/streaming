// apiService.js
export const apiService = {
  async get(endpoint) {
    try {
      // Use relative path to leverage Vite proxy (dev) or Vercel rewrites (prod)
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error.message);

      // Provide fallback data structure to avoid breaking the UI
      if (endpoint.includes('/api/dramabox/latest')) {
        return [];
      } else if (endpoint.includes('/api/dramabox/trending')) {
        return [];
      } else if (endpoint.includes('/api/dramabox/foryou')) {
        return [];
      } else if (endpoint.includes('/api/dramabox/search?query=')) {
        return [];
      } else if (endpoint.includes('/api/dramabox/detail/')) {
        return null;
      } else if (endpoint.includes('/api/dramabox/play/')) {
        return null;
      }

      return [];
    }
  }
};