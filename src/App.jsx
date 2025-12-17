import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation
} from "react-router-dom";
import { Home, Search, Play, User, X } from "lucide-react";
import ProfilePage from "./ProfilePage"; // Import design baru tadi

// --- COMPONENTS ---
const BottomNav = () => {
    const location = useLocation();
    const isActive = path =>
        location.pathname === path ? "text-primary" : "text-gray-400";

    // Sembunyikan Nav jika di halaman Player
    if (location.pathname === "/player") return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-14 sm:h-16 bg-surface-dark border-t border-gray-800 flex justify-around items-center z-50 md:hidden">
            <Link
                to="/"
                className={`flex flex-col items-center gap-0.5 sm:gap-1 ${isActive("/")}`}
            >
                <Home size={20} sm:size={24} />
                <span className="text-[8px] sm:text-[10px]">Home</span>
            </Link>
            <Link
                to="/search"
                className={`flex flex-col items-center gap-0.5 sm:gap-1 ${isActive(
                    "/search"
                )}`}
            >
                <Search size={20} sm:size={24} />
                <span className="text-[8px] sm:text-[10px]">Search</span>
            </Link>
            <Link
                to="/profile"
                className={`flex flex-col items-center gap-0.5 sm:gap-1 ${isActive(
                    "/profile"
                )}`}
            >
                <User size={20} sm:size={24} />
                <span className="text-[8px] sm:text-[10px]">Profile</span>
            </Link>
        </div>
    );
};

const HomePage = () => {
    const [featured, setFeatured] = React.useState(null);
    const [trending, setTrending] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoading(true);
                // Fetch featured content (using 'latest' as featured)
                const featuredResponse = await fetch('https://dramabox.sansekai.my.id/api/dramabox/latest');
                const featuredData = await featuredResponse.json();

                // Set featured to the first item from latest
                if (featuredData && featuredData.length > 0) {
                    setFeatured(featuredData[0]);
                }

                // Fetch trending content
                const trendingResponse = await fetch('https://dramabox.sansekai.my.id/api/dramabox/trending');
                const trendingData = await trendingResponse.json();

                // Set first 4 trending items
                setTrending(trendingData.slice(0, 4));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (loading) return (
        <div className="pb-20 sm:pb-24 flex justify-center items-center h-64">
            <div className="text-white text-lg">Loading...</div>
        </div>
    );

    if (error) return (
        <div className="pb-20 sm:pb-24 flex justify-center items-center h-64">
            <div className="text-red-500 text-lg">Error: {error}</div>
        </div>
    );

    return (
        <div className="pb-20 sm:pb-24">
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
                <h2 className="text-white font-bold mb-3 sm:mb-4 text-lg">Trending Now</h2>
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
        </div>
    );
};

const PlayerPage = () => (
    <div className="h-screen w-screen bg-black flex items-center justify-center relative">
        <Link
            to="/"
            className="absolute top-3 sm:top-4 left-3 sm:left-4 z-50 p-2 bg-white/20 rounded-full text-white"
        >
            <X size={20} sm:size={24} />
        </Link>
        <div className="text-white text-center">
            <p className="mb-4">Video player would display here</p>
            <p className="text-gray-400">In a real implementation, this would load video content from the API</p>
        </div>
    </div>
);

// --- MAIN APP ---
function App() {
    return (
        <Router>
            <div className="min-h-screen bg-background-dark text-white font-sans">
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
    );
};

// Search Page Component
const SearchPage = () => {
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
            const response = await fetch(`https://dramabox.sansekai.my.id/api/dramabox/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-background-dark min-h-screen">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for dramas..."
                            className="w-full p-4 pr-12 rounded-xl bg-surface-dark text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <div className="text-red-500 text-center py-4">
                        Error: {error}
                    </div>
                )}

                {loading && (
                    <div className="text-center py-10">
                        <div className="text-white">Searching...</div>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">Search Results</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {results.map((drama) => (
                                <div
                                    key={drama.bookId}
                                    className="bg-surface-dark rounded-lg overflow-hidden border border-gray-700 hover:border-primary transition-colors"
                                >
                                    <img
                                        src={drama.cover}
                                        alt={drama.bookName}
                                        className="w-full aspect-poster object-cover"
                                        loading="lazy"
                                    />
                                    <div className="p-2">
                                        <h3 className="text-white text-sm font-semibold truncate">{drama.bookName}</h3>
                                        <p className="text-gray-400 text-xs truncate">{drama.protagonist}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && results.length === 0 && query && (
                    <div className="text-center py-10">
                        <p className="text-gray-400">No results found for "{query}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
