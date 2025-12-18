import React from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useData } from "../contexts/DataContext";
import LazyImage from "../components/LazyImage";

import Skeleton from "../components/Skeleton";

const HomePage = () => {
    const { darkMode } = useDarkMode();
    const { featured, trending, isHomeLoaded, homeError, fetchHomeData } = useData();
    const [loading, setLoading] = React.useState(!isHomeLoaded);

    React.useEffect(() => {
        const loadData = async () => {
            if (!isHomeLoaded) {
                setLoading(true);
                await fetchHomeData();
                setLoading(false);
            }
        };
        loadData();
    }, [isHomeLoaded, fetchHomeData]);

    if (loading && !isHomeLoaded) return (
        <div className={`min-h-screen pb-32 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            {/* Hero Skeleton */}
            <Skeleton variant="hero" className="mb-8" />

            {/* Trending Section Skeleton */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-5">
                    <Skeleton className="w-32 h-7" />
                    <Skeleton className="w-16 h-5" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <Skeleton variant="movieCard" />
                            <Skeleton className="w-3/4 h-4 mt-1" />
                            <Skeleton className="w-1/2 h-3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (homeError && !featured && trending.length === 0) return (
        <div className={`flex flex-col items-center justify-center min-h-[60vh] px-8 text-center ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            <div className="bg-red-500/10 p-4 rounded-full mb-4">
                <p className="text-red-500 text-lg font-bold">Terjadi Kesalahan</p>
            </div>
            <p className={`text-sm opacity-60 mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>{homeError}</p>
            <button
                onClick={() => fetchHomeData(true)}
                className="bg-primary text-white px-6 py-2 rounded-full font-bold active:scale-95 transition-transform"
            >
                Coba Lagi
            </button>
        </div>
    );

    return (
        <div className={`min-h-screen pb-32 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            {/* Hero Section */}
            {featured && (
                <div className="relative h-[65vh] w-full mb-8">
                    <img
                        src={featured.coverWap}
                        alt={featured.bookName}
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/30 to-transparent" />

                    {/* Hero Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start">
                        <span className="bg-primary/90 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-2 tracking-wider uppercase">
                            Drama Unggulan
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-white leading-tight drop-shadow-lg">
                            {featured.bookName}
                        </h1>
                        <p className="text-sm text-gray-200 line-clamp-2 mb-6 font-medium max-w-md drop-shadow-md">
                            {featured.introduction}
                        </p>
                        <Link
                            to={`/player/${featured.bookId}`}
                            state={{ drama: featured }}
                            className="w-full sm:w-auto bg-white text-black font-extrabold py-3.5 px-8 rounded-full flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-transform active:scale-95"
                        >
                            <span className="flex items-center gap-2">
                                <Play size={20} fill="currentColor" />
                                <span>Tonton Sekarang</span>
                            </span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Trending Section */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-black'} tracking-tight`}>
                        Sedang Tren
                    </h2>
                    <span className="text-primary text-sm font-semibold">Lihat Semua</span>
                </div>

                {trending.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
                        {trending.map((drama) => (
                            <Link
                                key={drama.bookId}
                                to={`/player/${drama.bookId}`}
                                state={{ drama: drama }}
                                className="group flex flex-col gap-2"
                            >
                                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 shadow-md">
                                    <LazyImage
                                        src={drama.coverWap}
                                        alt={drama.bookName}
                                        className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Score/Tag Overlay */}
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                                        HD
                                    </div>
                                </div>
                                <div>
                                    <h3 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                                        {drama.bookName}
                                    </h3>
                                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                                        {drama.tags?.slice(0, 1).join(', ') || 'Romance'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <p>Konten tren tidak tersedia</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
