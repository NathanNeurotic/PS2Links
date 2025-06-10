export const state = {
    favorites: [],
    expandedCategories: [],
    allLinksData: [],
    currentView: 'list',
    currentTheme: localStorage.getItem('theme') || 'dark',
    categoryViewModes: {},
    favoritesViewMode: 'list' // Default view mode for favorites
};

export function loadFavorites() {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
        try {
            state.favorites = JSON.parse(storedFavorites);
        } catch (e) {
            console.error('Error parsing favorites from localStorage:', e);
            state.favorites = [];
        }
    }
}

export function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
}

export function loadExpandedCategories() {
    const storedExpanded = localStorage.getItem('expandedCategories');
    if (storedExpanded) {
        try {
            state.expandedCategories = JSON.parse(storedExpanded);
        } catch (e) {
            console.error('Error parsing expandedCategories from localStorage:', e);
            state.expandedCategories = [];
        }
    }
}

export function saveExpandedCategories() {
    localStorage.setItem('expandedCategories', JSON.stringify(state.expandedCategories));
}

export function loadCategoryViewModes() {
    const storedModes = localStorage.getItem('categoryViewModes');
    if (storedModes) {
        try {
            state.categoryViewModes = JSON.parse(storedModes);
        } catch (e) {
            console.error('Error parsing categoryViewModes from localStorage:', e);
            state.categoryViewModes = {};
        }
    }
}

export function saveCategoryViewModes() {
    localStorage.setItem('categoryViewModes', JSON.stringify(state.categoryViewModes));
}

// Load and Save Favorites View Mode
export function loadFavoritesViewMode() {
    const storedMode = localStorage.getItem('favoritesViewMode');
    if (storedMode) {
        try {
            // Ensure it's a valid view mode, otherwise default
            const parsedMode = JSON.parse(storedMode);
            if (['list', 'thumbnail'].includes(parsedMode)) {
                state.favoritesViewMode = parsedMode;
            } else {
                console.warn(`Invalid favoritesViewMode '${parsedMode}' found in localStorage. Defaulting to 'list'.`);
                state.favoritesViewMode = 'list';
            }
        } catch (e) {
            console.error('Error parsing favoritesViewMode from localStorage:', e);
            state.favoritesViewMode = 'list'; // Default to 'list' on error
        }
    } else {
        state.favoritesViewMode = 'list'; // Default if not found
    }
}

export function saveFavoritesViewMode() {
    localStorage.setItem('favoritesViewMode', JSON.stringify(state.favoritesViewMode));
}
