import React from "react";
import {
    Settings,
    ChevronRight,
    LogOut,
    Moon,
    Crown,
    Wallet,
    Bell,
    Shield,
    HelpCircle
} from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";

const ProfilePage = () => {
    const { darkMode, toggleDarkMode } = useDarkMode();

    return (
        <div className={`min-h-screen pb-24 ${darkMode ? 'bg-background-dark' : 'bg-gray-50'}`}>
            {/* Header / Avatar */}
            <div className="pt-12 pb-8 px-6 flex flex-col items-center">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-primary via-purple-500 to-blue-500 shadow-lg">
                        <div className={`w-full h-full rounded-full overflow-hidden border-4 ${darkMode ? 'border-background-dark' : 'border-gray-50'}`}>
                            <img
                                src="https://i.pravatar.cc/150?img=12"
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
                <h1 className={`mt-4 text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Alex Anderson</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: 88392019</p>
            </div>

            {/* Menu Groups */}
            <div className="px-6 space-y-6">
                {/* Mode Gelap */}
                <div className={`rounded-3xl p-2 ${darkMode ? 'bg-white/5' : 'bg-white shadow-lg shadow-gray-200/50'}`}>
                    <MenuItem
                        icon={<Moon size={20} className="text-purple-500" />}
                        label="Mode Gelap"
                        toggle={{ checked: darkMode, onChange: toggleDarkMode }}
                        darkMode={darkMode}
                    />
                </div>

                {/* Additional Settings */}
                <div className={`rounded-3xl p-2 ${darkMode ? 'bg-white/5' : 'bg-white shadow-lg shadow-gray-200/50'}`}>
                    <MenuItem icon={<Shield size={20} className="text-blue-500" />} label="Keamanan" darkMode={darkMode} />
                    <MenuItem icon={<HelpCircle size={20} className="text-pink-500" />} label="Pusat Bantuan" darkMode={darkMode} />
                </div>

                {/* Logout */}
                <button className="w-full py-4 text-white font-bold text-sm bg-red-500 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-red-500/20">
                    <LogOut size={18} />
                    Keluar
                </button>
            </div>
        </div>
    );
};

const MenuItem = ({ icon, label, value, badge, toggle, darkMode }) => (
    <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors cursor-pointer ${darkMode ? 'active:bg-white/5 hover:bg-white/5' : 'active:bg-gray-50 hover:bg-gray-50'}`}>
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl shadow-sm ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                {icon}
            </div>
            <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
        </div>
        <div className="flex items-center gap-3">
            {value && <span className={`text-xs font-medium ${darkMode ? 'text-white/60' : 'text-gray-500'}`}>{value}</span>}
            {badge && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{badge}</span>}
            {toggle ? (
                <div
                    onClick={toggle.onChange}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${toggle.checked ? 'bg-primary' : 'bg-gray-300'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${toggle.checked ? 'translate-x-5' : ''}`} />
                </div>
            ) : (
                <ChevronRight size={16} className={darkMode ? 'text-white/30' : 'text-gray-300'} />
            )}
        </div>
    </div>
);

export default ProfilePage;
