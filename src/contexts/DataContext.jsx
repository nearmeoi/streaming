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
            const [featuredData, trendingData] = await Promise.all([
                apiService.get('/api/dramabox/latest'),
                apiService.get('/api/dramabox/trending')
            ]);

            const newFeatured = featuredData && featuredData.length > 0 ? featuredData[0] : null;
            setFeatured(newFeatured);
            setTrending(trendingData || []);
            setIsHomeLoaded(true);
            setHomeError(null);

            return { featured: newFeatured, trending: trendingData || [], error: null };
        } catch (err) {
            setHomeError(err.message);
            return { featured: null, trending: [], error: err.message };
        }
    }, [isHomeLoaded, featured, trending, homeError]);

    // Fetch for you data only if not already loaded
    const fetchForYouData = useCallback(async (forceRefresh = false) => {
        if (isForYouLoaded && !forceRefresh) {
            return { forYou, error: forYouError };
        }

        try {
            const data = await apiService.get('/api/dramabox/foryou');
            setForYou(data || []);
            setIsForYouLoaded(true);
            setForYouError(null);

            return { forYou: data || [], error: null };
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
