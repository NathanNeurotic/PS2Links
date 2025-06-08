export const state = {
    favorites: [],
    expandedCategories: [],
    allLinksData: [],
    currentView: 'list',
    currentTheme: localStorage.getItem('theme') || 'dark',
    categoryViewModes: {}
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
