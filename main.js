import { state, loadFavorites, loadExpandedCategories, loadCategoryViewModes } from './state.js';
import { toggleFavorite, ensureFavoritesSection } from './favorites.js';
import { updateButtonStates, handleCategoryViewToggle } from './viewToggle.js';
import { initializeCollapsibles } from './collapsibles.js';
import { handleSearchInput } from './search.js';
import { createLinkListItem, createLinkThumbnailItem } from './linkUtils.js';

const DEBUG = false;
const listViewBtn = document.getElementById('list-view-btn');
const thumbnailViewBtn = document.getElementById('thumbnail-view-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const mainElement = document.querySelector('main');

function applyTheme() {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(state.currentTheme + '-mode');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = state.currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.currentTheme);
    applyTheme();
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}
applyTheme();

async function fetchLinks() {
    try {
        const response = await fetch('links.json');
        if (DEBUG) console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (DEBUG) console.log('Parsed JSON data:', data);
        return data;
    } catch (error) {
        if (DEBUG) console.error('Could not fetch links.json:', error);
        return [];
    }
}

function sortLinks(data) {
    data.forEach(category => {
        category.links.sort((a, b) => a.name.localeCompare(b.name));
    });
    return data;
}

function generateHTML(data) {
    if (!mainElement) return;
    mainElement.innerHTML = '';

    if (state.favorites.length > 0) {
        const favSection = document.createElement('section');
        favSection.id = 'favorites-section';
        const favH2 = document.createElement('h2');
        favH2.id = 'favorites-header';
        favH2.classList.add('collapsible');
        favH2.textContent = 'Favorites';
        const favContentDiv = document.createElement('div');
        favContentDiv.classList.add('content');
        favContentDiv.classList.add(state.currentView === 'list' ? 'list-view' : 'thumbnail-view');
        favContentDiv.id = 'favorites-content';

        const favoriteLinks = [];
        state.allLinksData.forEach(category => {
            category.links.forEach(link => {
                if (state.favorites.includes(link.url)) {
                    favoriteLinks.push(link);
                }
            });
        });
        favoriteLinks.sort((a, b) => a.name.localeCompare(b.name));

        if (state.currentView === 'list') {
            const ul = document.createElement('ul');
            favoriteLinks.forEach(linkObj => {
                const item = createLinkListItem(linkObj, true, (u) => toggleFavorite(u, mainElement));
                ul.appendChild(item);
            });
            favContentDiv.appendChild(ul);
        } else {
            favoriteLinks.forEach(linkObj => {
                const item = createLinkThumbnailItem(linkObj, true, (u) => toggleFavorite(u, mainElement));
                favContentDiv.appendChild(item);
            });
        }
        favSection.appendChild(favH2);
        favSection.appendChild(favContentDiv);
        mainElement.appendChild(favSection);
    }

    data.forEach(categoryObj => {
        const section = document.createElement('section');
        const h2 = document.createElement('h2');
        h2.classList.add('collapsible');
        h2.textContent = categoryObj.category;

        const categoryName = categoryObj.category;
        let categoryCurrentView = state.categoryViewModes[categoryName] || state.currentView;
        if (!state.categoryViewModes[categoryName]) {
            state.categoryViewModes[categoryName] = categoryCurrentView;
        }

        const toggleContainer = document.createElement('div');
        toggleContainer.classList.add('category-view-toggle');

        const listBtn = document.createElement('button');
        listBtn.textContent = 'List';
        listBtn.classList.add('category-view-btn', 'list-cat-btn');
        listBtn.dataset.category = categoryName;
        listBtn.dataset.view = 'list';
        if (categoryCurrentView === 'list') listBtn.classList.add('active');

        const thumbBtn = document.createElement('button');
        thumbBtn.textContent = 'Thumbnail';
        thumbBtn.classList.add('category-view-btn', 'thumb-cat-btn');
        thumbBtn.dataset.category = categoryName;
        thumbBtn.dataset.view = 'thumbnail';
        if (categoryCurrentView === 'thumbnail') thumbBtn.classList.add('active');

        toggleContainer.appendChild(listBtn);
        toggleContainer.appendChild(thumbBtn);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        contentDiv.classList.add(categoryCurrentView === 'list' ? 'list-view' : 'thumbnail-view');
        contentDiv.dataset.categoryName = categoryName;

        if (categoryCurrentView === 'list') {
            const ul = document.createElement('ul');
            categoryObj.links.forEach(linkObj => {
                const li = createLinkListItem(linkObj, state.favorites.includes(linkObj.url), (u) => toggleFavorite(u, mainElement));
                ul.appendChild(li);
            });
            contentDiv.appendChild(ul);
        } else {
            categoryObj.links.forEach(linkObj => {
                const fig = createLinkThumbnailItem(linkObj, state.favorites.includes(linkObj.url), (u) => toggleFavorite(u, mainElement));
                contentDiv.appendChild(fig);
            });
        }

        section.appendChild(h2);
        section.appendChild(toggleContainer);
        section.appendChild(contentDiv);
        mainElement.appendChild(section);

        listBtn.addEventListener('click', (e) => handleCategoryViewToggle(e, state.allLinksData, state.favorites, (lo, fav) => createLinkListItem(lo, fav, (u) => toggleFavorite(u, mainElement)), (lo, fav) => createLinkThumbnailItem(lo, fav, (u) => toggleFavorite(u, mainElement))));
        thumbBtn.addEventListener('click', (e) => handleCategoryViewToggle(e, state.allLinksData, state.favorites, (lo, fav) => createLinkListItem(lo, fav, (u) => toggleFavorite(u, mainElement)), (lo, fav) => createLinkThumbnailItem(lo, fav, (u) => toggleFavorite(u, mainElement))));
    });

    initializeCollapsibles();
    const searchBar = document.getElementById('search-bar');
    if (searchBar && searchBar.value) {
        handleSearchInput();
    }
}

function setupViewButtons() {
    if (listViewBtn && thumbnailViewBtn) {
        listViewBtn.addEventListener('click', () => {
            if (state.currentView !== 'list') {
                state.currentView = 'list';
                for (const cat in state.categoryViewModes) {
                    state.categoryViewModes[cat] = state.currentView;
                }
                updateButtonStates(listViewBtn, thumbnailViewBtn, mainElement);
                generateHTML(state.allLinksData);
            }
        });

        thumbnailViewBtn.addEventListener('click', () => {
            if (state.currentView !== 'thumbnail') {
                state.currentView = 'thumbnail';
                for (const cat in state.categoryViewModes) {
                    state.categoryViewModes[cat] = state.currentView;
                }
                updateButtonStates(listViewBtn, thumbnailViewBtn, mainElement);
                generateHTML(state.allLinksData);
            }
        });
    }
}

export async function initializePage() {
    loadFavorites();
    loadExpandedCategories();
    loadCategoryViewModes();
    state.allLinksData = await fetchLinks();
    if (state.allLinksData.length > 0) {
        state.allLinksData = sortLinks(state.allLinksData);
        updateButtonStates(listViewBtn, thumbnailViewBtn, mainElement);
        generateHTML(state.allLinksData);
    } else if (mainElement) {
        mainElement.innerHTML = '<p>Could not load link data. Please try again later.</p>';
    }
}

setupViewButtons();
const searchBar = document.getElementById('search-bar');
if (searchBar) {
    searchBar.addEventListener('input', handleSearchInput);
}

initializePage();
