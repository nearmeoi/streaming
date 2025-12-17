import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation
} from "react-router-dom";
import { Home, Search, Play, User, X } from "lucide-react";
import { DarkModeProvider, useDarkMode } from './contexts/DarkModeContext';
import { apiService } from './services/apiService';
import ProfilePage from "./ProfilePage"; // Import design baru tadi

// --- COMPONENTS ---
const BottomNav = () => {
    const { darkMode } = useDarkMode();
    const location = useLocation();
    const isActive = path =>
        location.pathname === path ? (darkMode ? "text-primary" : "text-primary") : (darkMode ? "text-gray-400" : "text-gray-500");

    // Sembunyikan Nav jika di halaman Player
    if (location.pathname === "/player") return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 h-14 sm:h-16 ${darkMode ? 'bg-surface-dark border-gray-700' : 'bg-surface-light border-gray-200'} border-t flex justify-around items-center z-50 md:hidden`}>
            <Link
                to="/"
                className={`flex flex-col items-center gap-0.5 sm:gap-1 ${isActive("/")}`}
            >
                <Home size={20} sm:size={24} />
                <span className={`text-[8px] sm:text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Home</span>
            </Link>
            <Link
                to="/search"
                className={`flex flex-col items-center gap-0.5 sm:gap-1 ${isActive(
                    "/search"
                )}`}
            >
                <Search size={20} sm:size={24} />
                <span className={`text-[8px] sm:text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Search</span>
            </Link>
            <Link
                to="/profile"
                className={`flex flex-col items-center gap-0.5 sm:gap-1 ${isActive(
                    "/profile"
                )}`}
            >
                <User size={20} sm:size={24} />
                <span className={`text-[8px] sm:text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Profile</span>
            </Link>
        </div>
    );
};

const HomePage = () => {
    const { darkMode } = useDarkMode();
    const [featured, setFeatured] = React.useState(null);
    const [trending, setTrending] = React.useState([]);
    const [forYou, setForYou] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoading(true);

                // Fetch featured content (using 'latest' as featured)
                const featuredData = await apiService.get('/api/dramabox/latest');

                // Set featured to the first item from latest
                if (featuredData && featuredData.length > 0) {
                    setFeatured(featuredData[0]);
                }

                // Fetch trending content
                const trendingResponse = await apiService.get('/api/dramabox/trending');

                // Set trending items
                setTrending(trendingResponse || []);

                // Fetch "for you" content
                const forYouResponse = await apiService.get('/api/dramabox/foryou');

                // Set "for you" items
                setForYou(forYouResponse || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (loading) return (
        <div className={`pb-20 sm:pb-24 flex justify-center items-center h-64 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            <div className={darkMode ? 'text-white' : 'text-black'}>Loading...</div>
        </div>
    );

    if (error) return (
        <div className={`pb-20 sm:pb-24 flex justify-center items-center h-64 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            <div className="text-red-500 text-lg">Error: {error}</div>
        </div>
    );

    return (
        <div className={`pb-20 sm:pb-24 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            {/* Hero */}
            {featured && (
                <div className="relative h-[50vh] sm:h-[60vh] w-full mb-6">
                    <img
                        src={featured.coverWap}
                        alt={featured.bookName}
                        className="w-full h-full object-cover"
                        loading="eager"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 sm:p-6 w-full">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 text-white">
                            {featured.bookName}
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 mb-4 sm:mb-6">
                            {featured.introduction?.substring(0, 100)}...
                        </p>
                        <Link
                            to="/player"
                            className="bg-primary text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Play size={16} sm:size={20} fill="currentColor" /> Play Now
                        </Link>
                    </div>
                </div>
            )}
            {/* Categories */}
            <div className="px-4">
                <h2 className={`font-bold mb-3 sm:mb-4 text-lg ${darkMode ? 'text-white' : 'text-black'}`}>Trending Now</h2>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {trending.map((drama, i) => (
                        <div
                            key={drama.bookId || i}
                            className="flex-shrink-0 w-24 sm:w-32 aspect-poster bg-gray-800 rounded-lg overflow-hidden min-w-[96px] sm:min-w-[128px]"
                        >
                            <img
                                src={drama.coverWap}
                                alt={drama.bookName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 128px"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* For You Section */}
            <div className="px-4 mt-8">
                <h2 className={`font-bold mb-3 sm:mb-4 text-lg ${darkMode ? 'text-white' : 'text-black'}`}>For You</h2>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {forYou.slice(0, 4).map((drama, i) => (
                        <div
                            key={`foryou-${drama.bookId || i}`}
                            className="flex-shrink-0 w-24 sm:w-32 aspect-poster bg-gray-800 rounded-lg overflow-hidden min-w-[96px] sm:min-w-[128px]"
                        >
                            <img
                                src={drama.coverWap || drama.cover}
                                alt={drama.bookName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 128px"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PlayerPage = () => {
    const { darkMode } = useDarkMode();

    return (
        <div className={`h-screen w-screen ${darkMode ? 'bg-black' : 'bg-gray-900'} flex flex-col`}>
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-50">
                <Link
                    to="/"
                    className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                    <X size={20} sm:size={24} />
                </Link>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-4">
                    <div className="w-full max-w-4xl aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center">
                            <div className="inline-block p-4 bg-primary/20 rounded-full mb-4">
                                <Play size={48} className="text-primary" />
                            </div>
                            <p className="text-white text-lg">Video Player</p>
                            <p className="text-gray-400 mt-2">In a real implementation, actual video content would play here</p>
                        </div>
                    </div>
                    <h2 className="text-white text-xl font-bold mt-4">Featured Content</h2>
                    <p className="text-gray-400">This would display detailed information about the currently playing video</p>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
function App() {
    return (
        <DarkModeProvider>
            <Router>
                <div className="min-h-screen bg-background-light dark:bg-background-dark text-white font-sans">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/player" element={<PlayerPage />} />
                        <Route
                            path="/search"
                            element={<SearchPage />}
                        />
                    </Routes>
                    <BottomNav />
                </div>
            </Router>
        </DarkModeProvider>
    );
};

// Search Page Component
const SearchPage = () => {
    const { darkMode } = useDarkMode();
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const data = await apiService.get(`/api/dramabox/search?query=${encodeURIComponent(query)}`);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`p-4 ${darkMode ? 'bg-background-dark' : 'bg-background-light'} min-h-screen`}>
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for dramas..."
                            className={`w-full p-4 pr-12 rounded-xl ${darkMode ? 'bg-surface-dark text-white border-gray-700' : 'bg-surface-light text-black border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-primary`}
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary p-2 rounded-lg"
                        >
                            <Search size={20} className="text-white" />
                        </button>
                    </div>
                </form>

                {error && (
                    <div className={`${darkMode ? 'text-red-400' : 'text-red-500'} text-center py-4`}>
                        Error: {error}
                    </div>
                )}

                {loading && (
                    <div className="text-center py-10">
                        <div className={darkMode ? 'text-white' : 'text-black'}>Searching...</div>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div>
                        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'} mb-4`}>Search Results</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {results.map((drama) => (
                                <div
                                    key={drama.bookId}
                                    className={`${darkMode ? 'bg-surface-dark border-gray-700' : 'bg-surface-light border-gray-300'} rounded-lg overflow-hidden border hover:border-primary transition-colors`}
                                >
                                    <img
                                        src={drama.cover}
                                        alt={drama.bookName}
                                        className="w-full aspect-poster object-cover"
                                        loading="lazy"
                                    />
                                    <div className="p-2">
                                        <h3 className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-black'}`}>{drama.bookName}</h3>
                                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{drama.protagonist}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && results.length === 0 && query && (
                    <div className="text-center py-10">
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No results found for "{query}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
