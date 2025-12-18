// scraper.js - Web scraper for dramaboxdb.com
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const BASE_URL = 'https://www.dramaboxdb.com';

// Get base URL with language prefix if needed
function getUrl(path = '', lang = 'in') {
    const prefix = lang && lang !== 'en' ? `/${lang}` : '';
    return `${BASE_URL}${prefix}${path}`;
}

// Clean title from URL slug as fallback
function cleanTitleFromSlug(url) {
    if (!url) return '';
    try {
        const parts = url.replace(/\/$/, '').split('/');
        const slug = parts.pop();
        if (!slug || /^\d+$/.test(slug) || slug === 'movie') return '';

        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    } catch (e) {
        return '';
    }
}

// Helper: Fetch HTML and parse with Cheerio
async function fetchHTML(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    });
    const html = await response.text();
    return cheerio.load(html);
}

// Extract movie ID from URL path
function extractMovieId(href) {
    const match = href.match(/\/(?:in\/)?movie\/(\d+)/);
    return match ? match[1] : null;
}

// Extract episode ID from URL path
function extractEpisodeId(href) {
    const match = href.match(/\/(?:in\/)?ep\/\d+_[^\/]+\/(\d+)_/);
    return match ? match[1] : null;
}

// Parse movie card from homepage/search results
function parseMovieCard($, element) {
    const $el = $(element);
    const link = $el.find('a').first();
    const href = link.attr('href') || '';
    const movieId = extractMovieId(href);

    // Handle various text structures - Prioritize visible text for localization
    let title = $el.find('h3, .title, [class*="title"]').first().text().trim() ||
        link.text().trim() ||
        link.attr('title');

    if (!title || title.toLowerCase() === 'unknown') {
        title = cleanTitleFromSlug(href) || 'Unknown';
    }

    const img = $el.find('img').first();
    const poster = img.attr('src') || img.attr('data-src') || '';

    // Episode count text like "80 Episodes"
    const episodesText = $el.text().match(/(\d+)\s*[Ee]pisodes?/);
    const episodeCount = episodesText ? parseInt(episodesText[1]) : null;

    // Genre badges
    const genres = [];
    $el.find('a[href*="/genres/"]').each((i, g) => {
        genres.push($(g).text().trim());
    });

    return {
        id: movieId,
        title: title,
        poster: poster && poster !== '' ? (poster.startsWith('//') ? 'https:' + poster : poster) : null,
        episodeCount,
        genres,
        url: href.startsWith('/') ? BASE_URL + href : href
    };
}

/**
 * Get homepage data (trending, must-sees, hidden gems)
 */
export async function getHomePage(lang = 'in') {
    try {
        const url = getUrl('', lang);
        const $ = await fetchHTML(url);

        const sections = [];

        // Find section headers and their content
        $('h2, .section-title, [class*="sectionTitle"]').each((i, header) => {
            const $header = $(header);
            const title = $header.text().trim();

            if (!title || title.length > 50) return;

            // Find movie cards following this header
            const $section = $header.closest('section, [class*="section"], div').first();
            const movies = [];

            $section.find('a[href*="/movie/"]').each((j, el) => {
                const $link = $(el);
                const href = $link.attr('href');
                const movieId = extractMovieId(href);

                if (movieId && !movies.find(m => m.id === movieId)) {
                    const $card = $link.closest('[class*="card"], [class*="item"], li, article') || $link.parent();
                    let img = $link.find('img').first();
                    if (!img.length) img = $card.find('img').first();
                    if (!img.length) img = $card.parent().find('img').first();

                    let movieTitle = $link.text().trim().split('\n')[0] || $link.attr('title') || $link.find('img').attr('alt');

                    // If title is just "XX Episodes" or "Unknown", fall back to slug
                    if (!movieTitle || movieTitle.toLowerCase() === 'unknown' || /^\d+\s*[Ee]pisodes?$/.test(movieTitle)) {
                        movieTitle = cleanTitleFromSlug(href) || movieTitle || 'Unknown';
                    }

                    const posterUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || null;

                    movies.push({
                        id: movieId,
                        title: movieTitle,
                        poster: posterUrl,
                        url: BASE_URL + href
                    });
                }
            });

            if (movies.length > 0) {
                sections.push({ title, movies: movies.slice(0, 20) });
            }
        });

        // If no sections found, try alternative parsing
        if (sections.length === 0) {
            const allMovies = [];
            $('a[href*="/movie/"]').each((i, el) => {
                const $link = $(el);
                const href = $link.attr('href');
                const movieId = extractMovieId(href);

                if (movieId && !allMovies.find(m => m.id === movieId)) {
                    const $parent = $link.parent();
                    const $grandparent = $parent.parent();
                    let img = $link.find('img').first();
                    if (!img.length) img = $parent.find('img').first();
                    if (!img.length) img = $grandparent.find('img').first();
                    if (!img.length) img = $grandparent.parent().find('img').first();

                    let movieTitle = $link.text().trim().split('\n')[0] || $link.attr('title') || img.attr('alt');

                    // If title is just "XX Episodes" or "Unknown", fall back to slug
                    if (!movieTitle || movieTitle.toLowerCase() === 'unknown' || /^\d+\s*[Ee]pisodes?$/.test(movieTitle)) {
                        movieTitle = cleanTitleFromSlug(href) || movieTitle || 'Unknown';
                    }

                    const posterUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || null;

                    allMovies.push({
                        id: movieId,
                        title: movieTitle,
                        poster: posterUrl,
                        url: BASE_URL + href
                    });
                }
            });

            if (allMovies.length > 0) {
                const sectionTitle = lang === 'in' ? 'Sedang Tren' : 'Trending';
                sections.push({ title: sectionTitle, movies: allMovies.slice(0, 20) });
            }
        }

        return { success: true, data: sections };
    } catch (error) {
        console.error('Error fetching homepage:', error);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Search movies by query
 */
export async function searchMovies(query, lang = 'in') {
    try {
        // Try search endpoint
        const url = getUrl('/search', lang);
        const searchUrl = `${url}?keyword=${encodeURIComponent(query)}`;
        const $ = await fetchHTML(searchUrl);

        const results = [];

        $('a[href*="/movie/"]').each((i, el) => {
            const $link = $(el);
            const href = $link.attr('href');
            const movieId = extractMovieId(href);

            if (movieId && !results.find(m => m.id === movieId)) {
                const $parent = $link.parent();
                const $card = $link.closest('[class*="card"], [class*="item"], li, article') || $parent;
                let img = $link.find('img').first();
                if (!img.length) img = $parent.find('img').first();
                if (!img.length) img = $card.find('img').first();
                if (!img.length) img = $card.parent().find('img').first();

                const episodeMatch = $parent.text().match(/(\d+)\s*[Ee]pisodes?/);

                let movieTitle = $link.text().trim().split('\n')[0] || $link.attr('title') || img.attr('alt');

                // If title is just "XX Episodes" or "Unknown", fall back to slug
                if (!movieTitle || movieTitle.toLowerCase() === 'unknown' || /^\d+\s*[Ee]pisodes?$/.test(movieTitle)) {
                    movieTitle = cleanTitleFromSlug(href) || movieTitle || 'Unknown';
                }

                const posterUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || null;

                results.push({
                    id: movieId,
                    title: movieTitle,
                    poster: posterUrl,
                    episodeCount: episodeMatch ? parseInt(episodeMatch[1]) : null,
                    url: BASE_URL + href
                });
            }
        });

        return { success: true, data: results };
    } catch (error) {
        console.error('Error searching:', error);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Get movie detail and episode list
 */
export async function getMovieDetail(movieId, lang = 'in') {
    try {
        // Find the movie page with slug
        const url = getUrl(`/movie/${movieId}`, lang);
        const $ = await fetchHTML(url);

        // Get title from h1 or meta
        let title = $('h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') || '';

        if (!title || title.toLowerCase() === 'unknown') {
            title = cleanTitleFromSlug(url) || 'Unknown';
        }

        // Get description
        const description = $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') || '';

        // Get poster
        const poster = $('meta[property="og:image"]').attr('content') ||
            $('img[class*="poster"], img[class*="cover"]').first().attr('src') || null;

        // Get genres
        const genres = [];
        $('a[href*="/genres/"]').each((i, el) => {
            const text = $(el).text().trim();
            if (text && !genres.includes(text)) {
                genres.push(text);
            }
        });

        // Get episode list
        const episodes = [];
        $('a[href*="/ep/"]').each((i, el) => {
            const $link = $(el);
            const href = $link.attr('href');
            const episodeId = extractEpisodeId(href);

            if (episodeId && !episodes.find(e => e.id === episodeId)) {
                const text = $link.text().trim();
                const epMatch = text.match(/[Ee][Pp]\.?\s*(\d+)|[Ee]pisode\s*(\d+)|^(\d+)$/);
                const episodeNumber = epMatch ? parseInt(epMatch[1] || epMatch[2] || epMatch[3]) : episodes.length + 1;

                episodes.push({
                    id: episodeId,
                    number: episodeNumber,
                    title: `Episode ${episodeNumber}`,
                    url: href.startsWith('/') ? BASE_URL + href : href
                });
            }
        });

        // Sort episodes by number
        episodes.sort((a, b) => a.number - b.number);

        return {
            success: true,
            data: {
                id: movieId,
                title,
                description,
                poster,
                genres,
                episodeCount: episodes.length,
                episodes
            }
        };
    } catch (error) {
        console.error('Error getting movie detail:', error);
        return { success: false, error: error.message, data: null };
    }
}

/**
 * Get video URL using Puppeteer (headless browser)
 */
export async function getVideoUrl(movieId, episodeId, lang = 'in') {
    let browser = null;

    try {
        // First, find the episode URL
        const detailResult = await getMovieDetail(movieId, lang);
        if (!detailResult.success || !detailResult.data) {
            throw new Error('Movie not found');
        }

        const episode = detailResult.data.episodes.find(e => e.id === episodeId);
        if (!episode) {
            throw new Error('Episode not found');
        }

        console.log(`Launching browser for: ${episode.url}`);

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Intercept network requests to find video URLs
        let videoUrl = null;
        const videoUrls = [];

        page.on('response', async (response) => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';

            // Check for video URLs
            if (url.includes('.m3u8') ||
                url.includes('.mp4') ||
                contentType.includes('video') ||
                contentType.includes('mpegurl') ||
                url.includes('/video/') ||
                url.includes('manifest')) {
                console.log('Found video URL:', url);
                videoUrls.push(url);
            }
        });

        // Navigate to episode page
        await page.goto(episode.url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait a bit for dynamic content
        await page.waitForTimeout(3000);

        // Try to get video src from DOM
        const videoSrc = await page.evaluate(() => {
            const video = document.querySelector('video');
            if (video) {
                return video.src || video.querySelector('source')?.src;
            }
            return null;
        });

        if (videoSrc) {
            videoUrl = videoSrc;
        } else if (videoUrls.length > 0) {
            // Prefer m3u8 over mp4
            videoUrl = videoUrls.find(u => u.includes('.m3u8')) || videoUrls[0];
        }

        // If still no video, try clicking play button
        if (!videoUrl) {
            try {
                await page.click('[class*="play"], button[class*="play"], .play-btn');
                await page.waitForTimeout(3000);

                videoUrl = await page.evaluate(() => {
                    const video = document.querySelector('video');
                    return video?.src || video?.querySelector('source')?.src;
                });

                if (!videoUrl && videoUrls.length > 0) {
                    videoUrl = videoUrls.find(u => u.includes('.m3u8')) || videoUrls[0];
                }
            } catch (e) {
                console.log('No play button found or click failed');
            }
        }

        await browser.close();
        browser = null;

        if (!videoUrl) {
            return { success: false, error: 'Video URL not found', data: null };
        }

        return {
            success: true,
            data: {
                movieId,
                episodeId,
                episodeNumber: episode.number,
                title: `${detailResult.data.title} - Episode ${episode.number}`,
                videoUrl,
                allVideoUrls: videoUrls
            }
        };

    } catch (error) {
        console.error('Error getting video URL:', error);
        return { success: false, error: error.message, data: null };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export default {
    getHomePage,
    searchMovies,
    getMovieDetail,
    getVideoUrl
};
