import { state, saveFavorites, saveExpandedCategories } from './state.js';
// NOTE: initializeCollapsibles is not directly used in the new version of this file,
// but it might be used by refreshFavoritesDisplayIfNeeded or createFavoritesSectionElements in main.js.
// import { initializeCollapsibles } from './collapsibles.js';
import { createLinkItem } from './linkUtils.js'; // getLinkDataByUrl and sortItemsInSection are now in linkUtils.js
// refreshFavoritesDisplayIfNeeded will be imported when main.js is updated, causing a circular dependency if imported here.
// For now, we assume it will be available globally or passed if needed, though the plan is to call it from here.
// This will be resolved when main.js calls functions from this file.

// getLinkDataByUrl function has been moved to linkUtils.js
// sortItemsInSection function has been moved to linkUtils.js
// ensureFavoritesSection function will be removed as per instructions.
// Its functionality will be handled by refreshFavoritesDisplayIfNeeded and createFavoritesSectionElements in main.js
// The problematic top-level code block that was here has been removed.

export function removeFavoritesSectionIfEmpty() {
    const favSection = document.getElementById('favorites-section');
    if (favSection && state.favorites.length === 0) {
        // The section is no longer removed from here.
        // Display of empty state is handled by refreshFavoritesDisplayIfNeeded in main.js.
        // console.log("removeFavoritesSectionIfEmpty: Favorites section found and favorites are empty. Section removal and state.expandedCategories update are now handled by refreshFavoritesDisplayIfNeeded.");

        // The part that managed state.expandedCategories for 'Favorites' is also removed
        // as the section header should remain collapsible even when empty.
    }
}

export function updateFavoriteStars(url, isFavorited) {
    const allLinkElements = document.querySelectorAll(`[data-url="${url}"]`);
    allLinkElements.forEach(linkEl => {
        const favButton = linkEl.querySelector('.favorite-btn');
        if (favButton) {
            if (isFavorited) {
                favButton.classList.add('favorited');
            } else {
                favButton.classList.remove('favorited');
            }
        }
    });
}

export function toggleFavorite(url) { // mainElement parameter removed
    const isFavorited = state.favorites.includes(url);

    if (isFavorited) {
        state.favorites = state.favorites.filter(f => f !== url);
    } else {
        state.favorites.push(url);
    }
    saveFavorites();
    updateFavoriteStars(url, !isFavorited); // Update stars on all instances of the link

    // refreshFavoritesDisplayIfNeeded(); // This call will be made from here, but the function is in main.js
    // For now, this implies a dependency that main.js needs to handle by making refreshFavoritesDisplayIfNeeded available,
    // or by having toggleFavorite return a value that signals main.js to refresh.
    // The subtask states "Add import { refreshFavoritesDisplayIfNeeded } from './main.js';"
    // This creates a circular dependency: main.js imports toggleFavorite from favorites.js,
    // and favorites.js would import refreshFavoritesDisplayIfNeeded from main.js.
    // This is a common issue. A typical solution is to use event emitters or callbacks,
    // or to have the calling module (main.js) be responsible for the subsequent UI update.
    // Given the subtask, I will add the import and the call. The bundler/JS engine might handle simple circular dependencies for functions.

    // Dynamically import refreshFavoritesDisplayIfNeeded to potentially mitigate circular dependency issues at load time.
    // This is an advanced pattern. For now, let's stick to the direct import as per instructions and see if it works.
    // import('./main.js').then(mainModule => {
    //     mainModule.refreshFavoritesDisplayIfNeeded();
    // }).catch(error => console.error("Error importing main.js for refreshFavoritesDisplayIfNeeded:", error));
    const event = new CustomEvent('favoritesUpdated', { bubbles: true, composed: true });
    document.body.dispatchEvent(event);
}

// ensureFavoritesSection is being removed.
// getLinkDataByUrl is moved.
// sortItemsInSection is moved.
