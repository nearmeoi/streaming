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

    // Fetch home data only if not already loaded
    const fetchHomeData = useCallback(async (forceRefresh = false) => {
        if (isHomeLoaded && !forceRefresh) {
            return { featured, trending, error: homeError };
        }

        try {
            // New API returns sections array: [{ title, movies: [...] }, ...]
            const sections = await apiService.get('/api/home?lang=in');

            // Extract movies from all sections
            const allMovies = [];
            if (Array.isArray(sections)) {
                sections.forEach(section => {
                    if (section.movies && Array.isArray(section.movies)) {
                        section.movies.forEach(movie => {
                            // Transform to expected format
                            allMovies.push({
                                bookId: movie.id,
                                bookName: movie.title,
                                coverWap: movie.poster,
                                introduction: movie.description || '',
                                tags: movie.genres || [],
                                episodeCount: movie.episodeCount
                            });
                        });
                    }
                });
            }

            // First movie as featured, rest as trending
            const newFeatured = allMovies.length > 0 ? allMovies[0] : null;
            const trendingMovies = allMovies.slice(1);

            setFeatured(newFeatured);
            setTrending(trendingMovies);
            setIsHomeLoaded(true);
            setHomeError(null);

            return { featured: newFeatured, trending: trendingMovies, error: null };
        } catch (err) {
            setHomeError(err.message);
            return { featured: null, trending: [], error: err.message };
        }
    }, [isHomeLoaded, featured, trending, homeError]);

    // Fetch for you data - reuse home data since we don't have separate API
    const fetchForYouData = useCallback(async (forceRefresh = false) => {
        if (isForYouLoaded && !forceRefresh) {
            return { forYou, error: forYouError };
        }

        try {
            // Reuse home data transformation
            const sections = await apiService.get('/api/home?lang=in');
            const allMovies = [];
            if (Array.isArray(sections)) {
                sections.forEach(section => {
                    if (section.movies && Array.isArray(section.movies)) {
                        section.movies.forEach(movie => {
                            allMovies.push({
                                bookId: movie.id,
                                bookName: movie.title,
                                coverWap: movie.poster,
                                introduction: movie.description || '',
                                tags: movie.genres || [],
                                episodeCount: movie.episodeCount
                            });
                        });
                    }
                });
            }

            setForYou(allMovies);
            setIsForYouLoaded(true);
            setForYouError(null);

            return { forYou: allMovies, error: null };
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
