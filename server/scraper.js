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

// Helper: Extract Next.js data
function extractNextData($) {
    try {
        const script = $('#__NEXT_DATA__').html();
        if (!script) return null;
        return JSON.parse(script);
    } catch (e) {
        return null;
    }
}

// Singleton browser instance
let globalBrowser = null;
const BROWSER_TIMEOUT = 120000; // 2 minutes idle timeout

async function getBrowser() {
    if (globalBrowser) {
        if (globalBrowser.isConnected()) {
            return globalBrowser;
        }
        try {
            await globalBrowser.close();
        } catch (e) { }
        globalBrowser = null;
    }

    console.log('Launching new shared browser instance...');
    globalBrowser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--mute-audio',
            '--no-default-browser-check',
            '--autoplay-policy=user-gesture-required',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-notifications',
            '--disable-background-networking',
            '--disable-breakpad',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-sync',
        ]
    });

    return globalBrowser;
}

// Helper: Fetch HTML and parse with Cheerio
async function fetchHTML(url) {
    console.log(`[DEBUG] Fetching HTML: ${url}`);
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': BASE_URL
        }
    });
    console.log(`[DEBUG] Response Status: ${response.status} for ${url}`);
    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    const html = await response.text();
    return cheerio.load(html);
}

// ... existing code ...

/**
 * Get movie detail and episode list
 */
export async function getMovieDetail(movieId, lang = 'in') {
    const url = getUrl(`/movie/${movieId}`, lang);
    console.log(`[DEBUG] getMovieDetail fetching: ${url}`);
    try {
        const $ = await fetchHTML(url);

        const nextData = extractNextData($);
        if (nextData && nextData.props && nextData.props.pageProps && nextData.props.pageProps.bookDetail) {
            console.log(`[DEBUG] Found JSON Detail for ${movieId}`);
            const detail = nextData.props.pageProps.bookDetail;
            return {
                success: true,
                data: {
                    id: detail.bookId || detail.action,
                    title: detail.bookName || detail.name,
                    description: detail.introduction,
                    poster: detail.cover,
                    genres: detail.typeTwoNames || detail.tags || [],
                    episodes: (detail.chapters || []).map(ch => ({
                        id: ch.chapterId || ch.action,
                        title: `Episode ${ch.sort}`,
                        episodeNumber: ch.sort,
                        url: BASE_URL + (lang === 'en' ? '' : '/' + lang) + `/ep/${detail.bookId}_${detail.bookNameLower}/${ch.chapterId}_Episode-${ch.sort}`
                    }))
                }
            };
        }

        // Fallback to DOM Scraping
        console.log(`[DEBUG] JSON failed, parsing HTML DOM for ${movieId}...`);

        // Get title
        let title = $('h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') || '';

        if (!title || title.toLowerCase() === 'unknown') {
            title = cleanTitleFromSlug(url) || 'Unknown';
        }

        // Get description & poster
        const description = $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') || '';
        const poster = $('meta[property="og:image"]').attr('content') ||
            $('img[class*="poster"]').attr('src') || null;

        // Get genres
        const genres = [];
        $('a[href*="/genres/"]').each((i, el) => {
            genres.push($(el).text().trim());
        });

        // Get episodes
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

        // Use Puppeteer Fallback if DOM also fails to find episodes (Dynamic Loading?)
        if (episodes.length === 0) {
            console.log('[DEBUG] No episodes found in DOM, falling back to Puppeteer to render page...');
            // We can't use Puppeteer inside getMovieDetail easily without refactoring, 
            // but usually DOM is enough. If this fails, we return error.
            if (!title) {
                return { success: false, error: 'Detail not found in JSON or DOM', data: null };
            }
        }

        episodes.sort((a, b) => a.number - b.number);

        return {
            success: true,
            data: {
                id: movieId,
                title,
                description,
                poster,
                genres,
                episodes,
                episodeCount: episodes.length
            }
        };
    } catch (error) {
        console.error(`[DEBUG] Error getting movie detail for ${url}:`, error);
        return { success: false, error: error.message, data: null };
    }
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

// Helper: Extract encrypted/signed video data from JSON
function findVideoDataInJson(data) {
    if (!data) return null;
    try {
        // Recursively search for 'videoUrl', 'm3u8', or 'url' in the nested JSON
        const jsonStr = JSON.stringify(data);
        const m3u8Match = jsonStr.match(/https:\\?\/\\?\/[^"]+\.m3u8[^"]*/);
        if (m3u8Match) return m3u8Match[0].replace(/\\\//g, '/');

        const mp4Match = jsonStr.match(/https:\\?\/\\?\/[^"]+\.mp4[^"]*/);
        if (mp4Match) return mp4Match[0].replace(/\\\//g, '/');

        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Get homepage data (trending, must-sees, hidden gems)
 */
export async function getHomePage(lang = 'in') {
    try {
        const url = getUrl('', lang);
        const $ = await fetchHTML(url);

        const nextData = extractNextData($);
        if (nextData && nextData.props && nextData.props.pageProps) {
            const sections = [];
            const { bigList, smallData } = nextData.props.pageProps;

            if (bigList && bigList.length > 0) {
                sections.push({
                    title: lang === 'in' ? 'Drama Unggulan' : 'Featured Drama',
                    movies: bigList.map(item => ({
                        id: item.bookId || item.action,
                        title: item.bookName || item.name,
                        poster: item.cover,
                        description: item.introduction,
                        episodeCount: item.chapterCount,
                        url: BASE_URL + (lang === 'en' ? '' : '/' + lang) + `/movie/${item.bookId || item.action}/${item.bookNameLower || item.bookNameEn}`
                    }))
                });
            }

            if (smallData) {
                const sectionEntries = Array.isArray(smallData) ? smallData : Object.values(smallData);

                sectionEntries.forEach(section => {
                    if (section.items && section.items.length > 0) {
                        sections.push({
                            title: section.name || 'Untitled',
                            movies: section.items.map(item => ({
                                id: item.bookId || item.action,
                                title: item.bookName || item.name,
                                poster: item.cover,
                                description: item.introduction,
                                episodeCount: item.chapterCount,
                                url: BASE_URL + (lang === 'en' ? '' : '/' + lang) + `/movie/${item.bookId || item.action}/${item.bookNameLower || item.bookNameEn}`
                            })).slice(0, 20)
                        });
                    }
                });
            }
            if (sections.length > 0) {
                return { success: true, data: sections };
            }
        }

        return { success: true, data: [] }; // Minimal fallback for now since JSON is preferred
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
        const url = getUrl('/search', lang);
        const searchUrl = `${url}?keyword=${encodeURIComponent(query)}`;
        const $ = await fetchHTML(searchUrl);

        const nextData = extractNextData($);
        if (nextData && nextData.props && nextData.props.pageProps && nextData.props.pageProps.searchData) {
            const { list } = nextData.props.pageProps.searchData;
            if (list && list.length > 0) {
                return {
                    success: true,
                    data: list.map(item => ({
                        id: item.bookId || item.action,
                        title: item.bookName || item.name,
                        poster: item.cover,
                        episodeCount: item.chapterCount,
                        url: BASE_URL + (lang === 'en' ? '' : '/' + lang) + `/movie/${item.bookId || item.action}/${item.bookNameLower || item.bookNameEn}`
                    }))
                };
            }
        }

        return { success: true, data: [] };
    } catch (error) {
        console.error('Error searching:', error);
        return { success: false, error: error.message, data: [] };
    }
}


/**
 * Get video URL using Direct JSON Extraction (FAST API)
 */
export async function getVideoUrl(movieId, episodeId, lang = 'in') {
    try {
        // 1. Get Episode URL
        const detailResult = await getMovieDetail(movieId, lang);
        if (!detailResult.success || !detailResult.data) {
            throw new Error('Movie not found');
        }

        const episode = detailResult.data.episodes.find(e => e.id === episodeId);
        if (!episode) {
            throw new Error('Episode not found');
        }

        console.log(`[FAST API] Fetching metadata: ${episode.url}`);

        // 2. Fetch Page HTML (Lightweight)
        const $ = await fetchHTML(episode.url);

        // 3. Extract __NEXT_DATA__
        const nextData = extractNextData($);
        if (!nextData) {
            console.log('No NEXT_DATA found, falling back to Puppeteer...');
            return await getVideoUrlPuppeteer(episode); // Fallback
        }

        // 4. Dig for Video URL in Props
        let videoUrl = findVideoDataInJson(nextData);

        if (videoUrl) {
            if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
            console.log('[FAST API] Found video URL instantly:', videoUrl);
            return {
                success: true,
                data: {
                    movieId,
                    episodeId,
                    episodeNumber: episode.number,
                    title: `${detailResult.data.title} - Episode ${episode.number}`,
                    videoUrl,
                    allVideoUrls: [videoUrl]
                }
            };
        }

        console.log('Video not found in JSON, using fallback...');
        return await getVideoUrlPuppeteer(episode);

    } catch (error) {
        console.error('Error getting video URL:', error);
        return { success: false, error: error.message, data: null };
    }
}

// Fallback: Legacy Puppeteer Method (renamed & safe)
async function getVideoUrlPuppeteer(episode) {
    let page = null;
    try {
        console.log(`[SCRAPER FALLBACK] Launching browser: ${episode.url}`);
        const browser = await getBrowser();
        page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const rType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(rType)) req.abort();
            else req.continue();
        });

        let videoUrl = null;
        const videoUrls = [];

        page.on('response', response => {
            const url = response.url();
            if ((url.includes('.mp4') || url.includes('.m3u8')) && !url.includes('blob:')) {
                videoUrls.push(url);
            }
        });

        await page.goto(episode.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Polling logic (Simpler for fallback)
        let poll = 0;
        while (poll < 10 && !videoUrl) {
            const found = videoUrls.find(u => u.includes('.m3u8') && !u.includes('.jpg'));
            if (found) videoUrl = found;
            await new Promise(r => setTimeout(r, 1000));
            poll++;
        }

        if (page) {
            try { if (!page.isClosed()) await page.close(); } catch (e) { }
        }

        if (videoUrl) {
            return {
                success: true,
                data: {
                    videoUrl,
                    allVideoUrls: videoUrls
                }
            };
        }
        throw new Error("Video not found in fallback");
    } catch (e) {
        if (page) {
            try { if (!page.isClosed()) await page.close(); } catch (e) { }
        }
        throw e;
    }
}

export default {
    getHomePage,
    searchMovies,
    getMovieDetail,
    getVideoUrl
};
