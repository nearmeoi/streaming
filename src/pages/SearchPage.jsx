import React, { useState } from "react";
import { Search, X, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useDarkMode } from "../contexts/DarkModeContext";
import { apiService } from "../services/apiService";
import LazyImage from "../components/LazyImage";
import Skeleton from "../components/Skeleton";

const SearchPage = () => {
    const { darkMode } = useDarkMode();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setIsSearching(true);
        try {
            const results = await apiService.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            // Transform to expected format
            const transformedResults = (results || []).map(item => ({
                bookId: item.id,
                bookName: item.title,
                coverWap: item.poster,
                introduction: item.description || '',
                tags: item.genres || [],
                episodeCount: item.episodeCount
            }));
            setSearchResults(transformedResults);
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setIsSearching(false);
    };

    return (
        <div className={`min-h-screen pb-24 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            {/* Sticky Header */}
            <div className={`sticky top-0 z-30 px-6 py-4 ${darkMode ? 'bg-background-dark/80' : 'bg-background-light/80'} backdrop-blur-xl border-b ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>Temukan</h1>
                <form onSubmit={handleSearch} className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari CEO, Balas Dendam..." // Subtly suggesting tags in placeholder
                        className={`w-full rounded-2xl py-3.5 pl-12 pr-10 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium 
                            ${darkMode
                                ? 'bg-white/10 text-white placeholder-gray-400'
                                : 'bg-gray-100 text-black placeholder-gray-500'
                            }`}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? 'bg-white/20' : 'bg-gray-200 text-black'}`}
                        >
                            <X size={14} />
                        </button>
                    )}
                </form>
            </div>

            {/* Results */}
            <div className="px-6 mt-2">
                {loading ? (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <Skeleton variant="movieCard" />
                                <Skeleton className="w-3/4 h-4 mt-1" />
                                <Skeleton className="w-1/2 h-3" />
                            </div>
                        ))}
                    </div>
                ) : isSearching || searchResults.length > 0 ? (
                    <div>
                        <div className="flex justify-between items-center mb-4 mt-2">
                            <h2 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>Hasil untuk "{searchQuery}"</h2>
                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{searchResults.length} ditemukan</span>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {searchResults.map((item) => (
                                    <Link key={item.bookId} to={`/player/${item.bookId}`} state={{ drama: item }} className="group">
                                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-800 mb-2 shadow-lg">
                                            <LazyImage
                                                src={item.coverWap}
                                                alt={item.bookName}
                                                className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary rounded-full p-2">
                                                <Play size={16} fill="white" className="text-white" />
                                            </div>
                                        </div>
                                        <h3 className={`font-bold text-sm leading-tight line-clamp-1 ${darkMode ? 'text-white' : 'text-black'}`}>{item.bookName}</h3>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.introduction}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 opacity-50">
                                <Search size={48} className={`mx-auto mb-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Hasil tidak ditemukan</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State (Clean) */
                    <div className="mt-20 flex flex-col items-center justify-center text-center opacity-40">
                        <div className={`p-6 rounded-full mb-4 ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                            <Search size={48} className={darkMode ? 'text-white' : 'text-black'} />
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Ketik untuk mencari drama favoritmu
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
