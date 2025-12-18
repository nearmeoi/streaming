// apiService.js - Frontend API service for DramaboxDB Scraper
export const apiService = {
  async get(endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle new API response format { success, data, error }
      if (data.success !== undefined) {
        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }
        return data.data;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error.message);

      // Provide fallback data structure to avoid breaking the UI
      if (endpoint.includes('/api/home')) {
        return [];
      } else if (endpoint.includes('/api/search')) {
        return [];
      } else if (endpoint.includes('/api/detail/')) {
        return null;
      } else if (endpoint.includes('/api/play/')) {
        return null;
      }

      return [];
    }
  },

  // Helper methods for specific endpoints
  async getHome() {
    return this.get('/api/home');
  },

  async search(query) {
    return this.get(`/api/search?q=${encodeURIComponent(query)}`);
  },

  async getDetail(movieId) {
    return this.get(`/api/detail/${movieId}`);
  },

  async getVideoUrl(movieId, episodeId) {
    return this.get(`/api/play/${movieId}/${episodeId}`);
  }
};
