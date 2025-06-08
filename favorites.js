import { state, saveFavorites } from './state.js';
import { saveExpandedCategories } from './state.js';
import { initializeCollapsibles } from './collapsibles.js';
import { createLinkListItem, createLinkThumbnailItem } from './linkUtils.js';

function getLinkDataByUrl(url) {
    for (const category of state.allLinksData) {
        for (const link of category.links) {
            if (link.url === url) {
                return link;
            }
        }
    }
    return null;
}

function sortItemsInSection(sectionContentElement, viewMode) {
    const items = Array.from(sectionContentElement.children);
    items.sort((a, b) => {
        const nameA = (viewMode === 'list' ? a.querySelector('a').textContent : a.querySelector('figcaption').textContent).trim().toLowerCase();
        const nameB = (viewMode === 'list' ? b.querySelector('a').textContent : b.querySelector('figcaption').textContent).trim().toLowerCase();
        return nameA.localeCompare(nameB);
    });
    items.forEach(item => sectionContentElement.appendChild(item));
}

export function ensureFavoritesSection(mainElement) {
    let favSection = document.getElementById('favorites-section');
    if (!favSection) {
        favSection = document.createElement('section');
        favSection.id = 'favorites-section';

        const favH2 = document.createElement('h2');
        favH2.id = 'favorites-header';
        favH2.classList.add('collapsible');
        favH2.textContent = 'Favorites';
        favH2.addEventListener('click', () => {
            const content = favH2.nextElementSibling;
            if (content) {
                const isExpanded = content.style.display !== 'none' && content.style.display !== '';
                if (isExpanded) {
                    content.style.display = 'none';
                    state.expandedCategories = state.expandedCategories.filter(cat => cat !== 'Favorites');
                } else {
                    content.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
                    if (!state.expandedCategories.includes('Favorites')) {
                        state.expandedCategories.push('Favorites');
                    }
                }
                saveExpandedCategories();
            }
        });

        const favContentDiv = document.createElement('div');
        favContentDiv.id = 'favorites-content';
        favContentDiv.classList.add('content', state.currentView === 'list' ? 'list-view' : 'thumbnail-view');

        if (state.expandedCategories.includes('Favorites')) {
            favContentDiv.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
        } else {
            favContentDiv.style.display = 'none';
        }

        favSection.appendChild(favH2);
        favSection.appendChild(favContentDiv);

        const firstSection = mainElement.querySelector('section');
        if (firstSection) {
            mainElement.insertBefore(favSection, firstSection);
        } else {
            mainElement.appendChild(favSection);
        }
        initializeCollapsibles();
    }
    return document.getElementById('favorites-content');
}

export function removeFavoritesSectionIfEmpty() {
    const favSection = document.getElementById('favorites-section');
    if (favSection && state.favorites.length === 0) {
        favSection.remove();
        const idx = state.expandedCategories.indexOf('Favorites');
        if (idx > -1) {
            state.expandedCategories.splice(idx, 1);
            saveExpandedCategories();
        }
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

export function toggleFavorite(url, mainElement) {
    const isFavorited = state.favorites.includes(url);
    const linkObj = getLinkDataByUrl(url);
    if (!linkObj) return;

    if (isFavorited) {
        state.favorites = state.favorites.filter(f => f !== url);
    } else {
        state.favorites.push(url);
    }
    saveFavorites();
    updateFavoriteStars(url, !isFavorited);

    const favContainer = document.getElementById('favorites-content');

    if (!isFavorited) {
        const container = ensureFavoritesSection(mainElement);
        if (!container.querySelector(`[data-url="${url}"]`)) {
            let newItem;
            if (state.currentView === 'list') {
                newItem = createLinkListItem(linkObj, true, (u) => toggleFavorite(u, mainElement));
            } else {
                newItem = createLinkThumbnailItem(linkObj, true, (u) => toggleFavorite(u, mainElement));
            }
            container.appendChild(newItem);
        }
        sortItemsInSection(container, state.currentView);
    } else if (favContainer) {
        const itemToRemove = favContainer.querySelector(`[data-url="${url}"]`);
        if (itemToRemove) itemToRemove.remove();
        removeFavoritesSectionIfEmpty();
    }
}
