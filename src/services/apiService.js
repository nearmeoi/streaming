// apiService.js - Updated to use HippoReels API
const API_BASE = ''; // Vite proxy handles routing to backend

export const apiService = {
  async get(endpoint) {
    const fullUrl = `${API_BASE}${endpoint}`;

    try {
      console.log(`[API] Fetching: ${fullUrl}`);
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle { success, data } format from HippoReels endpoints
      if (data.success !== undefined) {
        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }
        return data.data;
      }

      return data;
    } catch (error) {
      console.error('[API] Request failed:', error.message);
      throw error;
    }
  },

  // ==================== HIPPOREELS API ====================

  /**
   * Get home portal data (portal 1003 contains movie listings)
   */
  async getHippoHome() {
    const data = await this.get('/api/hippo/portal/1003');
    return this.transformHippoData(data);
  },

  /**
   * Get portal by ID
   * @param {number} portalId - Portal ID (1000, 1001, 1003, etc.)
   */
  async getHippoPortal(portalId) {
    const data = await this.get(`/api/hippo/portal/${portalId}`);
    return data;
  },

  /**
   * Transform HippoReels API response to match our app format
   */
  transformHippoData(hippoResponse) {
    const movies = [];

    // HippoReels returns data in channelList with nested bookList
    if (hippoResponse?.data?.channelList) {
      const channels = hippoResponse.data.channelList;

      channels.forEach(channel => {
        if (channel.bookList && Array.isArray(channel.bookList)) {
          channel.bookList.forEach(book => {
            movies.push({
              bookId: book.bookId || book.id,
              bookName: book.bookName || book.name || book.title,
              coverWap: book.coverWap || book.cover || book.poster,
              introduction: book.introduction || book.desc || '',
              tags: book.tags || [],
              episodeCount: book.chapterCount || book.episodeCount || 0,
              score: book.score || 0,
              viewCount: book.readNumber || 0,
              // Keep original data for reference
              _raw: book
            });
          });
        }
      });
    }

    return movies;
  },

  // ==================== LEGACY API (Scraper fallback) ====================

  async getHome() {
    try {
      // Try HippoReels first
      const movies = await this.getHippoHome();
      if (movies && movies.length > 0) {
        console.log(`[API] Got ${movies.length} movies from HippoReels`);
        return movies;
      }
    } catch (err) {
      console.warn('[API] HippoReels failed, trying scraper...', err.message);
    }

    // Fallback to scraper
    return this.get('/api/home?lang=in');
  },

  async search(query) {
    // Scraper endpoint (HippoReels search needs different implementation)
    return this.get(`/api/search?q=${encodeURIComponent(query)}`);
  },

  async getDetail(movieId) {
    return this.get(`/api/detail/${movieId}`);
  },

  async getVideoUrl(movieId, episodeId) {
    return this.get(`/api/play/${movieId}/${episodeId}`);
  },

  // ==================== SIGNATURE MANAGEMENT ====================

  /**
   * Update HippoReels signatures
   */
  async updateSignatures(ft, xhel, xss) {
    const response = await fetch(`${API_BASE}/api/hippo/update-signatures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ft, xhel, xss })
    });

    if (!response.ok) {
      throw new Error('Failed to update signatures');
    }

    return response.json();
  }
};
