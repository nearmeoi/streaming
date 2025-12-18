import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, Clock } from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";

const BottomNav = () => {
    const { darkMode } = useDarkMode();
    const location = useLocation();

    // Sembunyikan Nav jika di halaman Player
    if (location.pathname.startsWith("/player")) return null;

    const isActive = (path) => {
        const active = location.pathname === path;

        if (darkMode) {
            return active
                ? "text-white scale-110"
                : "text-white/50 hover:text-white/80 hover:scale-105";
        } else {
            return active
                ? "text-black scale-110"
                : "text-black/50 hover:text-black/80 hover:scale-105";
        }
    };

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-6 flex justify-center pointer-events-none md:hidden transition-all duration-300">
            <div className={`
                flex items-center justify-between pointer-events-auto
                w-full max-w-[320px] px-6 py-4 rounded-2xl
                ${darkMode
                    ? 'bg-black/80 border-white/10 shadow-black/40'
                    : 'bg-white/80 border-black/10 shadow-gray-200/50'
                }
                backdrop-blur-xl border shadow-2xl
                transition-all duration-300 ease-out
            `}>
                <Link
                    to="/"
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive("/")}`}
                >
                    <Home size={24} strokeWidth={2.5} className={darkMode ? 'text-current' : ''} />
                </Link>
                <Link
                    to="/search"
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive("/search")}`}
                >
                    <Search size={24} strokeWidth={2.5} className={darkMode ? 'text-current' : ''} />
                </Link>
                <Link
                    to="/history"
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive("/history")}`}
                >
                    <Clock size={24} strokeWidth={2.5} className={darkMode ? 'text-current' : ''} />
                </Link>
                <Link
                    to="/profile"
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive("/profile")}`}
                >
                    <User size={24} strokeWidth={2.5} className={darkMode ? 'text-current' : ''} />
                </Link>
            </div>
        </div>
    );
};

export default BottomNav;
