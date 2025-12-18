import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DarkModeProvider } from './contexts/DarkModeContext';
import { DataProvider } from './contexts/DataContext';

// Components
import BottomNav from "./components/BottomNav";

// Pages
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import PlayerPage from "./pages/PlayerPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryPage from "./pages/HistoryPage";

// --- MAIN APP ---
function App() {
    return (
        <DarkModeProvider>
            <DataProvider>
                <Router>
                    <div className="min-h-screen bg-background-light dark:bg-background-dark text-white font-sans">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/player/:bookId" element={<PlayerPage />} />
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                        </Routes>
                        <BottomNav />
                    </div>
                </Router>
            </DataProvider>
        </DarkModeProvider>
    );
};

export default App;
