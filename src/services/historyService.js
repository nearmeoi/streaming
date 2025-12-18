// historyService.js - LocalStorage service for watch history

const HISTORY_KEY = 'watch_history';
const MAX_HISTORY_ITEMS = 50;

export const historyService = {
    // Get all history items
    getHistory() {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading history:', error);
            return [];
        }
    },

    // Add item to history (or update if exists)
    addToHistory(item) {
        try {
            const history = this.getHistory();

            // Remove existing entry if present
            const filtered = history.filter(h => h.bookId !== item.bookId);

            // Add new entry at the beginning
            const newItem = {
                ...item,
                lastWatched: new Date().toISOString(),
                progress: item.progress || 0,
                episode: item.episode || 1
            };

            filtered.unshift(newItem);

            // Keep only the most recent items
            const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);

            localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
            return true;
        } catch (error) {
            console.error('Error saving history:', error);
            return false;
        }
    },

    // Update progress for an existing item
    updateProgress(bookId, progress, episode) {
        try {
            const history = this.getHistory();
            const index = history.findIndex(h => h.bookId === bookId);

            if (index !== -1) {
                history[index].progress = progress;
                history[index].episode = episode;
                history[index].lastWatched = new Date().toISOString();
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
            return true;
        } catch (error) {
            console.error('Error updating progress:', error);
            return false;
        }
    },

    // Remove item from history
    removeFromHistory(bookId) {
        try {
            const history = this.getHistory();
            const filtered = history.filter(h => h.bookId !== bookId);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error removing from history:', error);
            return false;
        }
    },

    // Clear all history
    clearHistory() {
        try {
            localStorage.removeItem(HISTORY_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }
};
