// apiService.js - Using local server proxy to external DramaBox API
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
      return data;
    } catch (error) {
      console.error('[API] Request failed:', error.message);
      throw error;
    }
  },

  /**
   * Get home page dramas
   */
  async getHome() {
    const data = await this.get('/api/home');
    return this.transformHomeData(data);
  },

  /**
   * Transform home data to app format
   */
  transformHomeData(response) {
    const movies = [];
    const movieIds = new Set();

    // Handle array of sections or direct data
    const rawData = response?.data || response;
    const sections = Array.isArray(rawData) ? rawData : [rawData];

    sections.forEach(section => {
      // Support different structures: 
      // 1. Section with movies/items array
      // 2. Direct object with book/items array (from some endpoints)
      const items = section?.movies || section?.items || section?.bookList || section?.book || (Array.isArray(section) ? section : []);

      if (Array.isArray(items)) {
        items.forEach(item => {
          const id = item.bookId || item.id;
          if (id && !movieIds.has(id)) {
            movieIds.add(id);
            movies.push({
              bookId: id,
              bookName: item.bookName || item.title || item.name,
              coverWap: item.coverWap || item.cover || item.poster,
              introduction: item.introduction || item.description || '',
              tags: Array.isArray(item.tags)
                ? item.tags.map(t => typeof t === 'object' ? t.tagName : t)
                : (typeof item.bookTags === 'string' ? item.bookTags.split(' ') : []),
              episodeCount: item.chapterCount || item.episodeCount || 0,
            });
          }
        });
      }
    });

    console.log(`[API] Transformed ${movies.length} movies from home`);
    return movies;
  },

  /**
   * Get drama detail with chapters
   */
  async getDetail(bookId) {
    const data = await this.get(`/api/detail/${bookId}`);
    return this.transformDetailData(data, bookId);
  },

  /**
   * Transform detail data
   */
  transformDetailData(response, bookId) {
    const detail = response?.data || response;

    return {
      id: detail.bookId || bookId,
      title: detail.bookName || detail.title,
      description: detail.introduction || detail.description,
      poster: detail.coverWap || detail.cover,
      genres: Array.isArray(detail.genres)
        ? detail.genres.map(t => typeof t === 'object' ? t.tagName : t)
        : (typeof detail.bookTags === 'string' ? detail.bookTags.split(' ') : []),
      episodes: (detail.chapters || detail.chapterList || []).map((ch, idx) => ({
        id: ch.chapterId || ch.id || String(idx + 1),
        number: ch.sort || ch.index || idx + 1,
        title: ch.chapterName || `Episode ${idx + 1}`,
      })),
      episodeCount: detail.chapterCount || detail.allEps || detail.chapters?.length || 0
    };
  },

  /**
   * Get video stream URL for specific episode
   * @param {string} bookId - Book ID
   * @param {number|string} episodeNumber - Episode number (1-based)
   */
  async getVideoUrl(bookId, episodeNumber) {
    console.log(`[API] Getting stream for book ${bookId}, episode ${episodeNumber}`);
    const data = await this.get(`/api/stream?bookId=${bookId}&episode=${episodeNumber}`);

    // Response format: { status, data: { chapter: { video: { mp4, m3u8 } } } }
    const chapter = data?.data?.chapter;
    const video = chapter?.video;

    return {
      videoUrl: video?.m3u8 || video?.mp4,
      mp4Url: video?.mp4,
      m3u8Url: video?.m3u8,
      thumbnail: chapter?.cover,
      duration: chapter?.duration,
      totalEpisodes: data?.data?.allEps
    };
  },

  /**
   * Search dramas
   */
  async search(query) {
    const data = await this.get(`/api/search?q=${encodeURIComponent(query)}`);
    const results = data?.data || data || [];

    if (!Array.isArray(results)) return [];

    return results.map(item => ({
      bookId: item.bookId || item.id,
      bookName: item.bookName || item.title,
      coverWap: item.coverWap || item.cover,
      introduction: item.introduction || '',
      episodeCount: item.chapterCount || 0
    }));
  }
};
