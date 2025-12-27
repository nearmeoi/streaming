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

/**
 * GET /api/home
 * Returns homepage sections (trending, must-sees, etc.)
 */
app.get('/api/home', async (req, res) => {
    try {
        const lang = req.query.lang || 'in';
        const result = await getHomePage(lang);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/home:', error);
        res.status(500).json({ success: false, error: error.message, data: [] });
    }
});

/**
 * GET /api/search?q={query}
 * Search movies by keyword
 */
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || req.query.query || '';
        const lang = req.query.lang || 'in';
        if (!query) {
            return res.status(400).json({ success: false, error: 'Query required', data: [] });
        }
        const result = await searchMovies(query, lang);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({ success: false, error: error.message, data: [] });
    }
});

/**
 * GET /api/detail/:movieId
 * Get movie details and episode list
 */
app.get('/api/detail/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const lang = req.query.lang || 'in';
        if (!movieId) {
            return res.status(400).json({ success: false, error: 'Movie ID required', data: null });
        }
        const result = await getMovieDetail(movieId, lang);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/detail:', error);
        res.status(500).json({ success: false, error: error.message, data: null });
    }
});

/**
 * GET /api/play/:movieId/:episodeId
 * Get video URL for specific episode (uses Puppeteer)
 */
app.get('/api/play/:movieId/:episodeId', async (req, res) => {
    try {
        const { movieId, episodeId } = req.params;
        const lang = req.query.lang || 'in';
        if (!movieId || !episodeId) {
            return res.status(400).json({ success: false, error: 'Movie ID and Episode ID required', data: null });
        }

        console.log(`Fetching video for movie ${movieId}, episode ${episodeId} (lang: ${lang})...`);
        const result = await getVideoUrl(movieId, episodeId, lang);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
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
