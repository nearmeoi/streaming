// index.js - Express server for DramaboxDB Scraper API
import express from 'express';
import cors from 'cors';
import { getHomePage, searchMovies, getMovieDetail, getVideoUrl } from './scraper.js';
import hippoReels from './hipporeels.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// External API base URL
const EXTERNAL_API = 'https://dramabox-api-rho.vercel.app';

/**
 * Proxy helper function
 */
async function proxyRequest(endpoint) {
    const url = `${EXTERNAL_API}${endpoint}`;
    console.log(`[Proxy] Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
}

/**
 * GET /api/home
 * Proxy to external API for homepage data
 */
app.get('/api/home', async (req, res) => {
    try {
        const data = await proxyRequest('/api/home');
        res.json(data);
    } catch (error) {
        console.error('Error in /api/home:', error);
        res.status(500).json({ success: false, error: error.message, data: [] });
    }
});

/**
 * GET /api/search?q={query}
 * Proxy to external API for search
 */
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || req.query.query || '';
        if (!query) {
            return res.status(400).json({ success: false, error: 'Query required', data: [] });
        }
        const data = await proxyRequest(`/api/search?q=${encodeURIComponent(query)}`);
        res.json(data);
    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({ success: false, error: error.message, data: [] });
    }
});

/**
 * GET /api/detail/:movieId
 * Proxy to external API for movie details
 */
app.get('/api/detail/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const data = await proxyRequest(`/api/detail/${movieId}/v2`);
        res.json(data);
    } catch (error) {
        console.error('Error in /api/detail:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * GET /api/stream?bookId=X&episode=Y
 * Proxy to external API for video stream URL
 */
app.get('/api/stream', async (req, res) => {
    try {
        const { bookId, episode } = req.query;
        if (!bookId || !episode) {
            return res.status(400).json({ success: false, error: 'bookId and episode required' });
        }
        const data = await proxyRequest(`/api/stream?bookId=${bookId}&episode=${episode}`);
        res.json(data);
    } catch (error) {
        console.error('Error in /api/stream:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * GET /api/play/:movieId/:episodeId (Legacy - redirect to stream)
 * For backward compatibility
 */
app.get('/api/play/:movieId/:episodeId', async (req, res) => {
    try {
        const { movieId, episodeId } = req.params;
        // episodeId could be a number or chapterId, try to use it as episode number
        const episode = parseInt(episodeId) || 1;
        const data = await proxyRequest(`/api/stream?bookId=${movieId}&episode=${episode}`);

        // Transform to expected format
        const chapter = data?.data?.chapter;
        const video = chapter?.video;

        res.json({
            success: true,
            data: {
                movieId,
                episodeId,
                episodeNumber: episode,
                videoUrl: video?.m3u8 || video?.mp4,
                allVideoUrls: [video?.m3u8, video?.mp4].filter(Boolean)
            }
        });
    } catch (error) {
        console.error('Error in /api/play:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

// ============== HIPPOREELS API ENDPOINTS ==============

/**
 * GET /api/hippo/portal/:portalId
 * Generic endpoint for any HippoReels portal
 */
app.get('/api/hippo/portal/:portalId', async (req, res) => {
    try {
        const { portalId } = req.params;
        console.log(`[HippoReels] Fetching portal ${portalId}...`);
        const result = await hippoReels.getPortal(parseInt(portalId), {});
        res.json(result);
    } catch (error) {
        console.error('Error in /api/hippo/portal:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * GET /api/hippo/home
 * Get HippoReels home config (portal 1000)
 */
app.get('/api/hippo/home', async (req, res) => {
    try {
        const result = await hippoReels.getHomeConfig();
        res.json(result);
    } catch (error) {
        console.error('Error in /api/hippo/home:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * GET /api/hippo/book/:bookId
 * Get book detail and chapters using portal 1040
 */
app.get('/api/hippo/book/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log(`[HippoReels] Fetching book detail for ${bookId} via portal 1040...`);
        const result = await hippoReels.getPortal(1040, { bookId });
        res.json(result);
    } catch (error) {
        console.error('Error in /api/hippo/book:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * GET /api/hippo/chapter/:chapterId
 * Get chapter/episode video URL
 */
app.get('/api/hippo/chapter/:chapterId', async (req, res) => {
    try {
        const { chapterId } = req.params;
        const { bookId } = req.query;
        console.log(`[HippoReels] Fetching chapter ${chapterId} for book ${bookId}...`);
        // Try portal 1040 with chapterId or find the right endpoint
        const result = await hippoReels.getPortal(1040, { bookId, chapterId });
        res.json(result);
    } catch (error) {
        console.error('Error in /api/hippo/chapter:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * GET /api/hippo/play/:bookId/:chapterId
 * Get video URL using portal 1008 (returns mp4720p direct URLs)
 */
app.get('/api/hippo/play/:bookId/:chapterId', async (req, res) => {
    try {
        const { bookId, chapterId } = req.params;
        console.log(`[HippoReels] Fetching video for book ${bookId}, chapter ${chapterId} via portal 1008...`);

        const result = await hippoReels.getPortal(1008, { bookId, chapterId });

        if (result.success && result.data?.data?.chapterContentList) {
            const chapters = result.data.data.chapterContentList;
            const targetChapter = chapters.find(ch => ch.chapterId === chapterId);

            if (targetChapter && targetChapter.mp4720p) {
                res.json({
                    success: true,
                    data: {
                        bookId,
                        chapterId,
                        chapterName: targetChapter.chapterName,
                        videoUrl: targetChapter.mp4720p,
                        thumbnail: targetChapter.chapterImg,
                        allChapters: chapters.map(ch => ({
                            chapterId: ch.chapterId,
                            chapterName: ch.chapterName,
                            videoUrl: ch.mp4720p,
                            thumbnail: ch.chapterImg
                        }))
                    }
                });
                return;
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error in /api/hippo/play:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * POST /api/hippo/update-signatures
 * Update the API signatures when they expire
 */
app.post('/api/hippo/update-signatures', (req, res) => {
    try {
        const { ft, xhel, xss } = req.body;
        if (!ft || !xhel || !xss) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: ft, xhel, xss'
            });
        }
        hippoReels.updateSignatures(ft, xhel, xss);
        res.json({ success: true, message: 'Signatures updated successfully' });
    } catch (error) {
        console.error('Error updating signatures:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        availableEndpoints: [
            'GET /api/health',
            'GET /api/home',
            'GET /api/search?q={query}',
            'GET /api/detail/:movieId',
            'GET /api/play/:movieId/:episodeId',
            '--- HippoReels API ---',
            'GET /api/hippo/home',
            'GET /api/hippo/portal/:portalId',
            'POST /api/hippo/update-signatures'
        ]
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║     DramaboxDB + HippoReels API Server           ║
╠══════════════════════════════════════════════════╣
║  Port: ${PORT}                                        ║
║  Version: 3.0 (+ HippoReels Direct API)          ║
║  Time: ${new Date().toISOString()}    ║
╠══════════════════════════════════════════════════╣
║  Scraper Endpoints:                              ║
║  - GET /api/health                               ║
║  - GET /api/home                                 ║
║  - GET /api/search?q={query}                     ║
║  - GET /api/detail/:movieId                      ║
║  - GET /api/play/:movieId/:episodeId             ║
╠══════════════════════════════════════════════════╣
║  HippoReels Direct API:                          ║
║  - GET /api/hippo/home                           ║
║  - GET /api/hippo/portal/:portalId               ║
║  - POST /api/hippo/update-signatures             ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
