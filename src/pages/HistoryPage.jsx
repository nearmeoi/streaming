import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Play, Clock, Trash2 } from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { historyService } from "../services/historyService";
import LazyImage from "../components/LazyImage";

const HistoryPage = () => {
    const { darkMode } = useDarkMode();
    const [history, setHistory] = useState([]);

    // Load history from localStorage on mount
    useEffect(() => {
        const loadedHistory = historyService.getHistory();
        setHistory(loadedHistory);
    }, []);

    const handleDelete = (bookId) => {
        historyService.removeFromHistory(bookId);
        setHistory(prev => prev.filter(item => item.bookId !== bookId));
    };

    const handleClearAll = () => {
        if (window.confirm('Hapus semua riwayat tontonan?')) {
            historyService.clearHistory();
            setHistory([]);
        }
    };

    // Format relative time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
        return date.toLocaleDateString('id-ID');
    };

    return (
        <div className={`min-h-screen pb-24 ${darkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
            {/* Header */}
            <div className={`sticky top-0 z-20 px-6 py-4 flex items-center justify-between ${darkMode ? 'bg-background-dark/80' : 'bg-background-light/80'} backdrop-blur-xl border-b ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                <div className="flex items-center gap-3">
                    <Link to="/" className={`p-2 rounded-full ${darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}>
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>Riwayat Tontonan</h1>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className={`p-2 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    >
                        <Trash2 size={20} className="text-red-500" />
                    </button>
                )}
            </div>

            {/* List */}
            <div className="px-4 mt-4 space-y-4">
                {history.map((item) => (
                    <div key={item.bookId} className={`flex gap-4 p-3 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-white shadow-sm border border-gray-100'}`}>
                        {/* Thumbnail */}
                        <Link to={`/player/${item.bookId}`} state={{ drama: { bookId: item.bookId, bookName: item.title, coverWap: item.cover, introduction: '' } }} className="relative w-28 aspect-[16/9] rounded-xl overflow-hidden flex-shrink-0 group">
                            <LazyImage src={item.cover} alt={item.title} className="w-full h-full" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={24} className="fill-white text-white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
                            </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <h3 className={`font-bold text-sm line-clamp-1 mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Episode {item.episode}
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <div className={`flex items-center gap-1 text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Clock size={10} />
                                    <span>{formatTime(item.lastWatched)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(item.bookId)}
                                        className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                    <Link
                                        to={`/player/${item.bookId}`}
                                        className={`p-1.5 rounded-full ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
                                    >
                                        <Play size={14} className="fill-current" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Clock size={48} className={`mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Belum ada riwayat tontonan</p>
                        <Link to="/search" className="mt-4 text-primary font-medium text-sm">
                            Mulai menonton sekarang
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
