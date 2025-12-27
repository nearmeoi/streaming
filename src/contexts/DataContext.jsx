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

            // apiService.getHome() now returns transformed array of movies
            const allMovies = await apiService.getHome();

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
