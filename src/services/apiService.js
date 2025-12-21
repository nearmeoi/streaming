// apiService.js - Modified to use our local DramaBoxDB API server
export const apiService = {
  async get(endpoint) {
    // Our local API server that scrapes DramaBoxDB
    const localApiUrl = `http://localhost:5000${endpoint}`;

    try {
      console.log(`Fetching from local API: ${localApiUrl}`);
      const response = await fetch(localApiUrl, {
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
      console.error('Local API request failed:', error.message);

      // Fallback to original proxy approach if local API fails
      console.log('Falling back to proxy services...');

      // Function to fetch from a specific proxy with timeout
      const fetchWithTimeout = async (proxyUrl, timeoutMs = 5000) => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        const fetchPromise = fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        return Promise.race([fetchPromise, timeoutPromise]);
      };

      // List of proxy services to try
      const proxyServices = [
        {
          name: 'api.allorigins',
          url: `https://api.allorigins.win/get?url=${encodeURIComponent(`https://dramabox.sansekai.my.id${endpoint}`)}`
        },
        {
          name: 'corsproxy',
          url: `https://corsproxy.io/?${encodeURIComponent(`https://dramabox.sansekai.my.id${endpoint}`)}`
        }
      ];

      // Try each proxy service
      for (const proxy of proxyServices) {
        try {
          console.log(`Trying ${proxy.name} proxy for ${endpoint}...`);
          const response = await fetch(proxy.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            console.warn(`${proxy.name} proxy response not OK: ${response.status} ${response.statusText}`);
            continue; // Try next proxy
          }

          const data = await response.json();

          // Handle response based on proxy service
          if (proxy.name === 'api.allorigins' && data && data.contents) {
            try {
              // Parse the JSON content returned by allorigins proxy service
              return JSON.parse(data.contents);
            } catch (parseError) {
              console.error('Error parsing allorigins response:', parseError);
              console.error('Raw allorigins response:', data.contents);
              continue; // Try next proxy
            }
          } else if (proxy.name === 'corsproxy') {
            // corsproxy returns the content directly
            return data;
          } else {
            // Fallback handling
            if (data && data.contents) {
              return JSON.parse(data.contents);
            }
            return data;
          }
        } catch (error) {
          console.warn(`${proxy.name} proxy failed:`, error.message);
          continue; // Try next proxy
        }
      }

      console.error('All proxy services failed for endpoint:', endpoint);

      // Provide fallback data structure to avoid breaking the UI
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
  },

  // Helper methods for specific endpoints
  async getHome() {
    return this.get('/api/dramabox/trending');
  },

  async search(query) {
    return this.get(`/api/dramabox/search?query=${encodeURIComponent(query)}`);
  },

  async getDetail(movieId) {
    return this.get(`/api/dramabox/detail/${movieId}`);
  },

  async getVideoUrl(movieId, episodeId) {
    return this.get(`/api/dramabox/episode/${movieId}/${episodeId}`);
  }
};
