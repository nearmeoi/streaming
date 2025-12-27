import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiService } from '../services/apiService';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    // Cache state
    const [featured, setFeatured] = useState(null);
    const [trending, setTrending] = useState([]);
    const [forYou, setForYou] = useState([]);
    const [isHomeLoaded, setIsHomeLoaded] = useState(false);
    const [isForYouLoaded, setIsForYouLoaded] = useState(false);
    const [homeError, setHomeError] = useState(null);
    const [forYouError, setForYouError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch home data - uses HippoReels API with scraper fallback
    const fetchHomeData = useCallback(async (forceRefresh = false) => {
        if (isHomeLoaded && !forceRefresh) {
            return { featured, trending, error: homeError };
        }

        setIsLoading(true);

        try {
            console.log('[DataContext] Fetching home data...');

            // apiService.getHome() tries HippoReels first, then falls back to scraper
            const movies = await apiService.getHome();

            let allMovies = [];

            // Handle different response formats
            if (Array.isArray(movies)) {
                // Direct array of movies (HippoReels format after transform)
                allMovies = movies;
            } else if (movies?.sections || Array.isArray(movies)) {
                // Scraper format with sections
                const sections = movies.sections || movies;
                const movieMap = new Map();

                sections.forEach(section => {
                    if (section.movies && Array.isArray(section.movies)) {
                        section.movies.forEach(movie => {
                            if (!movieMap.has(movie.id)) {
                                movieMap.set(movie.id, {
                                    bookId: movie.id,
                                    bookName: movie.title,
                                    coverWap: movie.poster,
                                    introduction: movie.description || '',
                                    tags: movie.genres || [],
                                    episodeCount: movie.episodeCount
                                });
                            }
                        });
                    }
                });

                allMovies = Array.from(movieMap.values());
            }

            console.log(`[DataContext] Got ${allMovies.length} movies`);

            // First movie as featured, rest as trending
            const newFeatured = allMovies.length > 0 ? allMovies[0] : null;
            const trendingMovies = allMovies.slice(1, 20); // Limit to 20 for performance

            setFeatured(newFeatured);
            setTrending(trendingMovies);
            setIsHomeLoaded(true);
            setHomeError(null);
            setIsLoading(false);

            return { featured: newFeatured, trending: trendingMovies, error: null };
        } catch (err) {
            console.error('[DataContext] Home fetch error:', err.message);
            setHomeError(err.message);
            setIsLoading(false);
            return { featured: null, trending: [], error: err.message };
        }
    }, [isHomeLoaded, featured, trending, homeError]);

    // Fetch for you data - reuse home data
    const fetchForYouData = useCallback(async (forceRefresh = false) => {
        if (isForYouLoaded && !forceRefresh) {
            return { forYou, error: forYouError };
        }

        try {
            const movies = await apiService.getHome();

            let allMovies = [];
            if (Array.isArray(movies)) {
                allMovies = movies;
            }

            // Shuffle for "For You" feel
            const shuffled = [...allMovies].sort(() => Math.random() - 0.5);

            setForYou(shuffled.slice(0, 30)); // Limit to 30
            setIsForYouLoaded(true);
            setForYouError(null);

            return { forYou: shuffled, error: null };
        } catch (err) {
            setForYouError(err.message);
            return { forYou: [], error: err.message };
        }
    }, [isForYouLoaded, forYou, forYouError]);

    // Force refresh all data
    const refreshAll = useCallback(async () => {
        setIsHomeLoaded(false);
        setIsForYouLoaded(false);
        await Promise.all([
            fetchHomeData(true),
            fetchForYouData(true)
        ]);
    }, [fetchHomeData, fetchForYouData]);

    return (
        <DataContext.Provider value={{
            featured,
            trending,
            forYou,
            isHomeLoaded,
            isForYouLoaded,
            isLoading,
            homeError,
            forYouError,
            fetchHomeData,
            fetchForYouData,
            refreshAll
        }}>
            {children}
        </DataContext.Provider>
    );
};
