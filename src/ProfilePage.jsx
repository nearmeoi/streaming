import React, { useState, useEffect } from "react";
import {
    Home,
    Search,
    Library,
    Download,
    User,
    LogOut,
    Edit2,
    Gem,
    Shield,
    Sliders,
    Bell,
    Moon,
    ChevronRight,
    Play
} from "lucide-react";
import { Link } from "react-router-dom";

const ProfilePage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                // Fetch for you content as history
                const response = await fetch('https://dramabox.sansekai.my.id/api/dramabox/foryou');
                const data = await response.json();

                // Use the first 2 items as history
                setHistory(data.slice(0, 2));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <div className="flex flex-col md:flex-row h-screen w-full font-display bg-background-light dark:bg-background-dark text-text-primary-light dark:text-white overflow-hidden">
            {/* --- SIDEBAR (Hidden on Mobile, Visible on Desktop) --- */}
            <aside className="hidden md:flex w-64 lg:w-72 flex-col justify-between border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark p-4 lg:p-6 flex-shrink-0 z-20">
                <div className="flex flex-col gap-6 lg:gap-8">
                    <div className="flex items-center gap-3 lg:gap-4 px-2">
                        <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150"
                            alt="Profile"
                            className="rounded-full h-10 w-10 lg:h-12 lg:w-12 ring-2 ring-primary ring-offset-2 dark:ring-offset-surface-dark object-cover"
                            loading="lazy"
                        />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm lg:text-base font-bold text-black dark:text-white leading-tight truncate">
                                Alex Streamer
                            </h1>
                            <p className="text-primary text-[10px] lg:text-xs font-bold uppercase tracking-wider mt-0.5">
                                Premium
                            </p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-1 lg:gap-1.5">
                        {[
                            { icon: Home, label: "Home", to: "/" },
                            { icon: Search, label: "Search", to: "/search" },
                            {
                                icon: Library,
                                label: "My Library",
                                to: "/library"
                            },
                            {
                                icon: Download,
                                label: "Downloads",
                                to: "/downloads"
                            }
                        ].map((item) => (
                            <Link
                                key={item.label}
                                to={item.to}
                                className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 rounded-lg lg:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-all"
                            >
                                <item.icon
                                    className="text-gray-400 group-hover:text-black dark:text-gray-500 dark:group-hover:text-white transition-colors"
                                    size={18}
                                />
                                <p className="text-xs lg:text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white truncate">
                                    {item.label}
                                </p>
                            </Link>
                        ))}

                        {/* Active State Example */}
                        <div className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 rounded-lg lg:rounded-xl bg-primary text-white shadow-lg shadow-primary/30 cursor-pointer">
                            <User
                                size={18}
                                className="text-white fill-current"
                            />
                            <p className="text-xs lg:text-sm font-bold">Profile</p>
                        </div>
                    </nav>
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                    <button className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 rounded-lg lg:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-black dark:text-white transition-colors w-full text-left group">
                        <LogOut
                            className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors"
                            size={18}
                        />
                        <p className="text-xs lg:text-sm font-semibold">Log Out</p>
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 overflow-y-auto h-full w-full bg-background-light dark:bg-background-dark pb-24 md:pb-12">
                <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10 flex flex-col gap-6 sm:gap-8 lg:gap-10">
                    {/* Header Profile */}
                    <section className="flex flex-col items-center text-center gap-5 pt-4">
                        <div className="relative group">
                            <img
                                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300"
                                alt="Profile"
                                className="rounded-full h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 shadow-2xl ring-4 ring-white dark:ring-surface-dark object-cover"
                                loading="eager"
                            />
                            <button className="absolute bottom-0 right-0 bg-black dark:bg-white text-white dark:text-black p-2 rounded-full border-2 sm:border-[3px] border-white dark:border-background-dark flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                <Edit2 size={14} sm:size={16} className="font-bold" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white truncate">
                                Alex Streamer
                            </h1>
                            <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium text-sm">
                                @alexwatch
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-surface-light dark:bg-surface-dark rounded-full text-[10px] sm:text-xs font-bold text-black dark:text-white border border-gray-200 dark:border-gray-700">
                                    MEMBER SINCE 2021
                                </span>
                            </div>
                        </div>
                        <button className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 sm:px-8 rounded-full shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <span>Edit Account Details</span>
                        </button>
                    </section>

                    {/* Premium Card */}
                    <section className="relative overflow-hidden rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                        <div className="flex flex-col items-center sm:flex-row sm:items-center justify-between p-4 sm:p-5 md:p-6 gap-4 sm:gap-6 relative z-10">
                            <div className="flex items-center gap-3 sm:gap-4 md:gap-5 w-full max-w-full">
                                <div className="bg-primary p-2.5 sm:p-3.5 rounded-full text-white shadow-md shadow-blue-200 dark:shadow-none flex-shrink-0">
                                    <Gem size={20} sm:size={24} />
                                </div>
                                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1">
                                        <h2 className="text-base sm:text-lg font-bold text-black dark:text-white">
                                            Premium Plan
                                        </h2>
                                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold bg-black dark:bg-white text-white dark:text-black uppercase tracking-widest self-start sm:self-auto">
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs sm:text-sm">
                                        Renews on{" "}
                                        <span className="text-black dark:text-white font-bold">
                                            Oct 24, 2023
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-primary font-bold shadow-sm border border-gray-100 dark:border-gray-700 transition-all text-xs sm:text-sm">
                                    Manage
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Settings List */}
                    <section className="flex flex-col gap-4">
                        <h3 className="text-base sm:text-lg font-bold text-black dark:text-white px-1">
                            Settings
                        </h3>
                        <div className="flex flex-col bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                            <SettingsItem
                                icon={Shield}
                                title="Account Security"
                                subtitle="Password, 2FA"
                            />
                            <SettingsItem
                                icon={Sliders}
                                title="Playback"
                                subtitle="Video quality, Autoplay"
                            />
                            <SettingsItem
                                icon={Bell}
                                title="Notifications"
                                subtitle="Push, Email"
                            />

                            {/* Dark Mode Toggle Item */}
                            <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group w-full cursor-pointer">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="bg-black dark:bg-white p-1.5 sm:p-2 rounded-lg text-white dark:text-black flex-shrink-0">
                                        <Moon size={18} sm:size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-black dark:text-white truncate">
                                            Dark Mode
                                        </p>
                                        <p className="text-xs sm:text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 truncate">
                                            Adjust appearance
                                        </p>
                                    </div>
                                </div>
                                <div className="relative inline-flex h-6 w-10 sm:h-7 sm:w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-primary ml-2">
                                    <span className="translate-x-4 sm:translate-x-5 pointer-events-none inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* History */}
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-base sm:text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                History
                            </h3>
                            <a
                                href="#"
                                className="text-xs sm:text-sm font-bold text-primary hover:text-primary-dark"
                            >
                                View All
                            </a>
                        </div>
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {loading && (
                                <div className="text-center py-4 text-text-secondary-light dark:text-text-secondary-dark">
                                    Loading history...
                                </div>
                            )}
                            {error && (
                                <div className="text-center py-4 text-red-500">
                                    Error loading history: {error}
                                </div>
                            )}
                            {history.length > 0 ? (
                                history.map((item, index) => (
                                    <HistoryItem
                                        key={item.bookId || index}
                                        title={item.bookName}
                                        episode={`Chapter ${item.chapterCount || 1}`}
                                        progress="50%" // Using a default progress since API doesn't provide this
                                        image={item.coverWap}
                                    />
                                ))
                            ) : !loading && !error ? (
                                <div className="text-center py-4 text-text-secondary-light dark:text-text-secondary-dark">
                                    No history available
                                </div>
                            ) : null}
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center text-xs sm:text-xs text-text-secondary-light dark:text-text-secondary-dark gap-2">
                        <p>App Version 4.2.0 • Build 2023.10.24</p>
                        <a
                            href="#"
                            className="text-black dark:text-white font-semibold hover:underline"
                        >
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Sub-components untuk kerapihan ---

const SettingsItem = ({ icon, title, subtitle }) => (
    <button className="flex items-center justify-between p-3 sm:p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group text-left w-full">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="bg-black dark:bg-white p-1.5 sm:p-2 rounded-lg text-white dark:text-black flex-shrink-0">
                {icon && React.createElement(icon, { size: 18 })}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-black dark:text-white truncate">
                    {title}
                </p>
                <p className="text-xs sm:text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 truncate">
                    {subtitle}
                </p>
            </div>
        </div>
        <ChevronRight size={18} sm:size={20} className="text-gray-400 flex-shrink-0 ml-2" />
    </button>
);

const HistoryItem = ({ title, episode, progress, image }) => (
    <div className="group flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-surface-light dark:bg-surface-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
        <div className="relative w-24 sm:w-32 lg:w-40 aspect-video rounded-xl overflow-hidden flex-shrink-0">
            <img
                src={image}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded-full p-1 sm:p-1.5 text-black shadow-lg">
                    <Play size={16} sm:size={20} fill="currentColor" />
                </div>
            </div>
        </div>
        <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
            <h4 className="text-xs sm:text-sm md:text-base font-bold text-black dark:text-white truncate">
                {title}
            </h4>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-[10px] sm:text-xs truncate mt-0.5">
                {episode}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 sm:h-1.5 rounded-full mt-2 sm:mt-3 overflow-hidden">
                <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: progress }}
                ></div>
            </div>
        </div>
    </div>
);

export default ProfilePage;
