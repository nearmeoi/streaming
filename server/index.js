// index.js - Express server for DramaboxDB Scraper API
import express from 'express';
import cors from 'cors';
import { getHomePage, searchMovies, getMovieDetail, getVideoUrl } from './scraper.js';

const app = express();
const PORT = process.env.PORT || 3001;

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
            'GET /api/play/:movieId/:episodeId'
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
║     DramaboxDB Scraper API Server Started        ║
╠══════════════════════════════════════════════════╣
║  Port: ${PORT}                                        ║
║  Version: 2.1 (Resilient Scraper)                ║
║  Time: ${new Date().toISOString()}    ║
╠══════════════════════════════════════════════════╣
║  Endpoints:                                      ║
║  - GET /api/health                               ║
║  - GET /api/home                                 ║
║  - GET /api/search?q={query}                     ║
║  - GET /api/detail/:movieId                      ║
║  - GET /api/play/:movieId/:episodeId             ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
