import { state, loadFavorites, loadExpandedCategories, loadCategoryViewModes, loadFavoritesViewMode, saveFavoritesViewMode } from './state.js';
// ensureFavoritesSection is removed from favorites.js, removeFavoritesSectionIfEmpty is added
import { toggleFavorite, removeFavoritesSectionIfEmpty } from './favorites.js';
import { updateButtonStates, handleCategoryViewToggle } from './viewToggle.js';
import { initializeCollapsibles } from './collapsibles.js';
import { handleSearchInput } from './search.js';
// getLinkDataByUrl and sortItemsInSection are now imported from linkUtils.js
import { createLinkItem, getLinkDataByUrl, sortItemsInSection } from './linkUtils.js';

const DEBUG = false;
const listViewBtn = document.getElementById('list-view-btn');
const thumbnailViewBtn = document.getElementById('thumbnail-view-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const mainElement = document.querySelector('main');
const sidebarElement = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle');

// Helper function to create slugs for IDs and HREFs
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/&/g, '-and-')         // Replace & with 'and'
        .replace(/[^\w-]+/g, '')       // Remove all non-word chars (alphanumeric, underscore, hyphen)
        .replace(/--+/g, '-');          // Replace multiple - with single -
}

function applyTheme() {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(state.currentTheme + '-mode');
    if (themeToggleBtn) {
        themeToggleBtn.textContent = state.currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    // Apply theme to category view toggle buttons
    const categoryViewButtons = document.querySelectorAll('.category-view-btn');
    categoryViewButtons.forEach(button => {
        button.classList.remove('light-mode', 'dark-mode'); // Remove existing theme classes
        button.classList.add(state.currentTheme + '-mode'); // Add current theme class
    });
}

function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.currentTheme);
    applyTheme();
    // Update favorites section after theme change now that applyTheme no longer
    // triggers this refresh implicitly.
    refreshFavoritesDisplayIfNeeded();
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

// ** NEW FUNCTION: populateFavoritesContent **
function populateFavoritesContent(contentDiv, viewMode) {
    if (!contentDiv) return;
    contentDiv.innerHTML = ''; // Clear existing content
    contentDiv.classList.remove('list-view', 'thumbnail-view');
    contentDiv.classList.add(viewMode === 'list' ? 'list-view' : 'thumbnail-view');

    const favoriteLinkObjects = [];
    if (state.favorites && state.allLinksData) { // Ensure both lists are available
        state.favorites.forEach(favUrl => {
            const linkObj = getLinkDataByUrl(favUrl, state.allLinksData); // Call getLinkDataByUrl as per subtask
            if (linkObj) {
                favoriteLinkObjects.push(linkObj);
            }
        });
    }
    // Note: Sorting by name is now handled by sortItemsInSection

    const ul = viewMode === 'list' ? document.createElement('ul') : null;
    favoriteLinkObjects.forEach(linkObj => { // Iterate over the collected link objects
        // toggleFavorite is imported and no longer needs mainElement passed.
        const item = createLinkItem(linkObj, true, toggleFavorite, viewMode);
        if (ul) {
            ul.appendChild(item);
        } else {
            contentDiv.appendChild(item); // For thumbnail view
        }
    });

    if (ul) {
        contentDiv.appendChild(ul);
    }
    sortItemsInSection(contentDiv, viewMode);
}

// ** NEW FUNCTION: createFavoritesSectionElements **
function createFavoritesSectionElements() {
    const section = document.createElement('section');
    section.id = 'favorites-section';

    const h2 = document.createElement('h2');
    h2.id = 'favorites-header';
    h2.classList.add('collapsible');
    // h2.textContent = 'Favorites'; // Text content will be a span, buttons will be siblings

    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'Favorites';
    h2.appendChild(titleSpan);


    const toggleContainer = document.createElement('div');
    toggleContainer.classList.add('category-view-toggle'); // Reuse styles

    const listBtn = document.createElement('button');
    listBtn.textContent = 'List';
    listBtn.classList.add('category-view-btn', 'list-fav-btn', state.currentTheme + '-mode');
    listBtn.dataset.view = 'list';

    const thumbBtn = document.createElement('button');
    thumbBtn.textContent = 'Thumbnail';
    thumbBtn.classList.add('category-view-btn', 'thumb-fav-btn', state.currentTheme + '-mode');
    thumbBtn.dataset.view = 'thumbnail';

    if (state.favoritesViewMode === 'list') {
        listBtn.classList.add('active');
    } else {
        thumbBtn.classList.add('active');
    }

    toggleContainer.appendChild(listBtn);
    toggleContainer.appendChild(thumbBtn);

    const contentDiv = document.createElement('div');
    contentDiv.id = 'favorites-content';
    contentDiv.classList.add('content');
    // Initial view mode class will be set by populateFavoritesContent

    section.appendChild(h2);
    section.appendChild(toggleContainer); // Add toggle buttons to the section
    section.appendChild(contentDiv);

    // Event listeners for toggle buttons
    [listBtn, thumbBtn].forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newView = e.target.dataset.view;
            if (newView !== state.favoritesViewMode) {
                state.favoritesViewMode = newView;
                saveFavoritesViewMode();

                // Update active class on buttons
                listBtn.classList.toggle('active', newView === 'list');
                thumbBtn.classList.toggle('active', newView === 'thumbnail');

                populateFavoritesContent(contentDiv, newView);
            }
        });
    });

    // Apply theme classes to the new buttons without triggering further updates
    // to avoid recursion with applyTheme -> refreshFavoritesDisplayIfNeeded

    return section;
}

// ** NEW FUNCTION: refreshFavoritesDisplayIfNeeded (and EXPORTED) **
export function refreshFavoritesDisplayIfNeeded() {
    const currentMainElement = document.querySelector('main'); // Ensure we're using the correct main element
    if (!currentMainElement) return;

    if (state.favorites && state.favorites.length > 0) {
        let favSection = document.getElementById('favorites-section');
        let favContentDiv = document.getElementById('favorites-content');

        if (!favSection) {
            favSection = createFavoritesSectionElements();
            // Prepend favorites so it appears at the top of the main element.
            currentMainElement.prepend(favSection);
            // Since createFavoritesSectionElements creates a new collapsible h2,
            // we need to re-initialize collapsibles for it.
            // initializeCollapsibles() typically queries all .collapsible elements.
            // If it's safe to call multiple times or if it correctly handles already initialized ones,
            // then calling it broadly is fine. Otherwise, target the specific new one.
            const newCollapsibleHeader = favSection.querySelector('h2.collapsible');
            if (newCollapsibleHeader) {
                 // Assuming initializeCollapsibles can be called on a specific element or re-run globally
                 // For simplicity, let's assume initializeCollapsibles() can be re-run:
                 initializeCollapsibles();
                 // Or, if initializeCollapsibles needs a specific element:
                 // initializeSingleCollapsible(newCollapsibleHeader); // (This function would need to exist)
            }
            favContentDiv = document.getElementById('favorites-content'); // Re-fetch after creation
        }

        // Ensure favContentDiv is valid before populating
        if (favContentDiv) {
            populateFavoritesContent(favContentDiv, state.favoritesViewMode);
        } else {
            console.error("Favorites content div not found after ensuring section exists.");
        }

    } else {
        // No favorites saved: remove the favorites section entirely if it exists
        const favSection = document.getElementById('favorites-section');
        if (favSection) {
            favSection.remove();
        }
    }
}

// Helper function to create and populate a category section
// Uses global 'state' and 'mainElement' for toggleFavorite callback context.
// Calls 'handleCategoryViewToggle' from viewToggle.js for category view changes.
function createCategorySection(categoryObj) {
    const section = document.createElement('section');
    const categoryName = categoryObj.category;
    const categorySlug = slugify(categoryName);
    section.id = categorySlug; // Add ID to section for sidebar navigation

    const h2 = document.createElement('h2');
    h2.classList.add('collapsible');
    h2.textContent = categoryName;

    const categoryCurrentView = state.categoryViewModes[categoryName] || state.currentView;

    // Add category description if it exists
    let descriptionParagraph = null;
    if (categoryObj.description) {
        descriptionParagraph = document.createElement('p');
        descriptionParagraph.textContent = categoryObj.description;
        descriptionParagraph.classList.add('category-description');
    }

    const toggleContainer = document.createElement('div');
    toggleContainer.classList.add('category-view-toggle');

    const listBtn = document.createElement('button');
    listBtn.textContent = 'List';
    listBtn.classList.add('category-view-btn', 'list-cat-btn', state.currentTheme + '-mode');
    listBtn.dataset.category = categoryName;
    listBtn.dataset.view = 'list';
    if (categoryCurrentView === 'list') listBtn.classList.add('active');

    const thumbBtn = document.createElement('button');
    thumbBtn.textContent = 'Thumbnail';
    thumbBtn.classList.add('category-view-btn', 'thumb-cat-btn', state.currentTheme + '-mode');
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
            const li = createLinkItem(linkObj, state.favorites.includes(linkObj.url), (url) => toggleFavorite(url, mainElement), 'list');
            ul.appendChild(li);
        });
        contentDiv.appendChild(ul);
    } else {
        categoryObj.links.forEach(linkObj => {
            const fig = createLinkItem(linkObj, state.favorites.includes(linkObj.url), (url) => toggleFavorite(url, mainElement), 'thumbnail');
            contentDiv.appendChild(fig);
        });
    }

    section.appendChild(h2);
    section.appendChild(toggleContainer);
    if (descriptionParagraph) {
        section.appendChild(descriptionParagraph); // Add description after toggle buttons
    }
    section.appendChild(contentDiv);

    // Attach event listeners for category view toggle buttons
    listBtn.addEventListener('click', (e) => handleCategoryViewToggle(e, state.allLinksData, state.favorites, (linkObject, isFav) => createLinkItem(linkObject, isFav, (url) => toggleFavorite(url, mainElement), 'list'), (linkObject, isFav) => createLinkItem(linkObject, isFav, (url) => toggleFavorite(url, mainElement), 'thumbnail')));
    thumbBtn.addEventListener('click', (e) => handleCategoryViewToggle(e, state.allLinksData, state.favorites, (linkObject, isFav) => createLinkItem(linkObject, isFav, (url) => toggleFavorite(url, mainElement), 'list'), (linkObject, isFav) => createLinkItem(linkObject, isFav, (url) => toggleFavorite(url, mainElement), 'thumbnail')));

    return section;
}

// Main function to render the entire page content (now only categories)
function generateHTML(data) {
    if (!mainElement) return;
    mainElement.innerHTML = ''; // Clear existing content

    // Favorites section is now handled by refreshFavoritesDisplayIfNeeded()
    // and added/removed dynamically.

    // Create and append each category section
    data.forEach(categoryObj => {
        const categorySection = createCategorySection(categoryObj);
        mainElement.appendChild(categorySection);
    });

    // Initialize collapsibles for expand/collapse functionality
    initializeCollapsibles();

    // Re-apply search filter if there's an active search term
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
                // When global view changes, individual category overrides are preserved.
                // Re-render will naturally pick up the new global view for categories without overrides.
                updateButtonStates(listViewBtn, thumbnailViewBtn, mainElement);
                generateHTML(state.allLinksData);
            }
        });

        thumbnailViewBtn.addEventListener('click', () => {
            if (state.currentView !== 'thumbnail') {
                state.currentView = 'thumbnail';
                // When global view changes, individual category overrides are preserved.
                // Re-render will naturally pick up the new global view for categories without overrides.
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
    loadFavoritesViewMode(); // Load the favorites view mode
    state.allLinksData = await fetchLinks();
    if (state.allLinksData.length > 0) {
        state.allLinksData = sortLinks(state.allLinksData);
        updateButtonStates(listViewBtn, thumbnailViewBtn, mainElement); // mainElement here is the global one
        generateHTML(state.allLinksData); // Generates category sections
        refreshFavoritesDisplayIfNeeded(); // Create or update favorites section
        populateSidebar(state.allLinksData); // Populate sidebar
    } else if (mainElement) { // mainElement here is the global one
        mainElement.innerHTML = '<p>Could not load link data. Please try again later.</p>';
    }
}

function populateSidebar(data) {
    if (!sidebarElement || !data) return;
    sidebarElement.innerHTML = ''; // Clear existing sidebar content

    data.forEach(categoryObj => {
        const categoryName = categoryObj.category;
        const categorySlug = slugify(categoryName);

        const anchor = document.createElement('a');
        anchor.href = `#${categorySlug}`;
        anchor.textContent = categoryName;
        // Optional: Add click listener to close sidebar on navigation
        anchor.addEventListener('click', () => {
            if (sidebarElement.classList.contains('open')) {
                sidebarElement.classList.remove('open');
            }
        });
        sidebarElement.appendChild(anchor);
    });
}

function setupSidebarToggle() {
    if (sidebarToggleBtn && sidebarElement) {
        sidebarToggleBtn.textContent = '>'; // Set initial icon

        sidebarToggleBtn.addEventListener('click', () => {
            sidebarElement.classList.toggle('open');
            // Update icon based on sidebar state
            if (sidebarElement.classList.contains('open')) {
                sidebarToggleBtn.textContent = '<';
            } else {
                sidebarToggleBtn.textContent = '>';
            }
        });
    }
}

setupViewButtons();
const searchBar = document.getElementById('search-bar');
if (searchBar) {
    searchBar.addEventListener('input', handleSearchInput);
}

initializePage().then(() => {
    document.body.addEventListener('favoritesUpdated', refreshFavoritesDisplayIfNeeded);
    setupSidebarToggle(); // Initialize sidebar toggle functionality
});
