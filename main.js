import { state, loadFavorites, loadExpandedCategories, loadCategoryViewModes } from './state.js';
import { toggleFavorite, ensureFavoritesSection } from './favorites.js';
import { updateButtonStates, handleCategoryViewToggle } from './viewToggle.js';
import { initializeCollapsibles } from './collapsibles.js';
import { handleSearchInput } from './search.js';
import { createLinkItem } from './linkUtils.js';

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

// Helper function to create and populate the favorites section
// Uses global 'state' and 'mainElement' for toggleFavorite callback context.
function createFavoritesSection() {
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
            // Pass mainElement to toggleFavorite for context if needed, or adjust toggleFavorite
            const item = createLinkItem(linkObj, true, (url) => toggleFavorite(url, mainElement), 'list');
            ul.appendChild(item);
        });
        favContentDiv.appendChild(ul);
    } else {
        favoriteLinks.forEach(linkObj => {
            const item = createLinkItem(linkObj, true, (url) => toggleFavorite(url, mainElement), 'thumbnail');
            favContentDiv.appendChild(item);
        });
    }
    favSection.appendChild(favH2);
    favSection.appendChild(favContentDiv);
    return favSection;
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

// Main function to render the entire page content (favorites and categories)
function generateHTML(data) {
    if (!mainElement) return;
    mainElement.innerHTML = ''; // Clear existing content

    // Create and append favorites section if there are any favorites
    if (state.favorites.length > 0) {
        const favSection = createFavoritesSection();
        mainElement.appendChild(favSection);
    }

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
    state.allLinksData = await fetchLinks();
    if (state.allLinksData.length > 0) {
        state.allLinksData = sortLinks(state.allLinksData);
        updateButtonStates(listViewBtn, thumbnailViewBtn, mainElement);
        generateHTML(state.allLinksData); // Generates main content sections with IDs
        populateSidebar(state.allLinksData); // Populate sidebar after data is fetched
    } else if (mainElement) {
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

initializePage();
setupSidebarToggle(); // Initialize sidebar toggle functionality
