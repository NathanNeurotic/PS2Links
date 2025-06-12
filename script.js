let allServices = [];
let deferredPrompt = null;
const MAX_CATEGORY_HEIGHT =
    parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
            '--category-max-height'
        )
    ) || 400; // px - limit for open category height

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    applySavedView();
    applySavedMobileView();
    updateToggleButtons();

    buildSidebar();

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'none';
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) {
            installBtn.style.display = 'inline-block';
        }
    });

    window.addEventListener('appinstalled', () => {
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    });
    // Typing Effect for Header
    const headerTextElement = document.querySelector('.typing-effect');
    const textToType = 'PS2Links Hub';

    if (headerTextElement) {
        headerTextElement.textContent = '';
        let charIndex = 0;
        function typeEffect() {
            if (charIndex < textToType.length) {
                headerTextElement.textContent += textToType.charAt(charIndex);
                charIndex++;
                setTimeout(typeEffect, 100);
            }
        }
        typeEffect();
    }

    // Load services and set up functionalities only if a <main> element exists
    if (document.querySelector('main')) {
        loadServices();
    }

    // Global click listener to hide suggestions
    document.addEventListener('click', (event) => {
        const searchInput = document.getElementById('searchInput');
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        if (suggestionsContainer && searchInput) {
            if (event.target !== searchInput && !suggestionsContainer.contains(event.target)) {
                suggestionsContainer.style.display = 'none';
            }
        }
    });
});

async function loadServices() {
    try {
        const response = await fetch('./links.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json(); // jsonData is an array of category groups

        // Initialize allServices as a flat list of all link objects, augmented with categoryName and tags
        allServices = [];
        jsonData.forEach(categoryGroup => {
            const categoryName = categoryGroup.category;
            // Clean category name for use in tags (remove emoji)
            const cleanCategoryName = categoryName.replace(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u, '').trim();
            categoryGroup.links.forEach(link => {
                // Ensure each link object in allServices has a 'tags' array including its category
                const serviceTags = link.tags ? [...link.tags] : []; // Copy existing tags if any from links.json
                if (!serviceTags.includes(cleanCategoryName)) {
                    serviceTags.push(cleanCategoryName);
                }
                allServices.push({ ...link, category: categoryName, tags: serviceTags });
            });
        });

        const mainContainer = document.querySelector('main');

        // Clear existing static categories if any (optional, if HTML is pre-populated)
        const existingCategories = mainContainer.querySelectorAll('.category');
        existingCategories.forEach(cat => cat.remove());

        // Populate categories object: keys are category names, values are arrays of link objects
        const localCategories = {};
        jsonData.forEach(categoryGroup => {
            const categoryName = categoryGroup.category;
            if (!localCategories[categoryName]) {
                localCategories[categoryName] = [];
            }
            localCategories[categoryName].push(...categoryGroup.links);
        });

        // Generate HTML for categories and services in alphabetical order
        const normalize = (name) => name.replace(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u, '').trim().toLowerCase();
        const sortedCategoryNames = Object.keys(localCategories).sort((a, b) => normalize(a).localeCompare(normalize(b)));
        for (const categoryName of sortedCategoryNames) {
            const servicesInCategory = localCategories[categoryName];
            servicesInCategory.sort((a, b) => a.name.localeCompare(b.name)); // Assuming link objects have a 'name' property
            const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            const categorySection = document.createElement('section');
            categorySection.className = 'category';
            categorySection.id = categoryId;

            const categoryHeader = document.createElement('h2');
            categoryHeader.setAttribute('aria-expanded', 'false');
            categoryHeader.onclick = () => toggleCategory(categoryHeader); // Use arrow function to ensure 'this' context or pass element directly
            categoryHeader.tabIndex = 0;
            categoryHeader.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(categoryHeader);
                }
            });

            // Extract emoji and text for category title
            const emojiMatch = categoryName.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u);
            let emojiSpan = '';
            let textContent = categoryName;

            if (emojiMatch) {
                emojiSpan = `<span class="category-emoji">${emojiMatch[0].trim()}</span> `;
                textContent = categoryName.substring(emojiMatch[0].length).trim();
            }

            categoryHeader.innerHTML = `${emojiSpan}<span class="category-title">${textContent}</span> <span class="chevron">▼</span><span class="category-view-toggle" role="button" tabindex="0" aria-label="Toggle category view">☰</span>`;
            const viewToggle = categoryHeader.querySelector('.category-view-toggle');
            viewToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCategoryView(categoryId);
            });
            viewToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCategoryView(categoryId);
                }
            });


            const categoryContent = document.createElement('div');
            categoryContent.className = 'category-content';

            servicesInCategory.forEach(service => {
                const serviceButton = createServiceButton(
                    service,
                    new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
                    categoryName
                );
                categoryContent.appendChild(serviceButton);
            });

            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(categoryContent);
            mainContainer.appendChild(categorySection);
        }
        
        renderFavoritesCategory();

        // Restore Category States from localStorage after dynamic loading
        document.querySelectorAll('.category').forEach(category => {
            const id = category.id;
            const header = category.querySelector('h2');
            const content = category.querySelector('.category-content');
            const chevron = header.querySelector('.chevron');
            const isOpen = localStorage.getItem(`category-${id}`) === 'open';
            if (isOpen) {
                content.classList.add('open');
                const height = Math.min(content.scrollHeight, MAX_CATEGORY_HEIGHT);
                content.style.maxHeight = height + 'px';
                chevron.classList.add('open');
                header.setAttribute('aria-expanded', 'true');
            }

            const view = localStorage.getItem(`view-${id}`);
            if (view === 'list') {
                category.classList.add('list-view');
                const toggle = header.querySelector('.category-view-toggle');
                if (toggle) {
                    toggle.classList.add('active');
                }
            }
        });

        buildSidebar();

        // Create suggestions container
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'suggestionsContainer';
            // Initial styles are set via CSS (e.g., display: none)
            searchContainer.appendChild(suggestionsContainer);
        }

        // Re-initialize search functionality
        setupSearch();
        populateTagDropdown();

    } catch (error) {
        console.error('Failed to load services:', error);
        const mainContainer = document.querySelector('main');
        const failureMsg =
            `<p class="error-message">Failed to load services: ${error.message}. If you opened this page using the file:// protocol, start a local server and reload the page:<br><code>python3 -m http.server</code></p>`;
        if (mainContainer) {
            mainContainer.innerHTML = failureMsg;
        }
    }
}


function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    if (!searchInput || !suggestionsContainer) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        suggestionsContainer.innerHTML = ''; // Clear previous suggestions

        if (query === '') {
            suggestionsContainer.style.display = 'none';
            // Restore visibility of all services and categories when query is cleared
            document.querySelectorAll('.service-button').forEach(button => button.style.display = 'flex');
            document.querySelectorAll('.category').forEach(category => category.style.display = '');
            const noResultsEl = document.getElementById('noResults');
            if (noResultsEl) noResultsEl.hidden = true;
            return;
        }

        const uniqueSuggestions = new Set();
        const maxSuggestions = 7; // Max number of suggestions to show

        allServices.forEach(service => {
            if (uniqueSuggestions.size >= maxSuggestions) return;
            if (service.name.toLowerCase().includes(query)) {
                uniqueSuggestions.add(service.name);
            }
            if (uniqueSuggestions.size >= maxSuggestions) return;
            if (Array.isArray(service.tags)) {
                service.tags.forEach(tag => {
                    if (uniqueSuggestions.size >= maxSuggestions) return;
                    if (tag.toLowerCase().includes(query)) {
                        uniqueSuggestions.add(tag);
                    }
                });
            }
        });

        // Also search category names for suggestions
        const categoryElements = document.querySelectorAll('.category .category-title');
        categoryElements.forEach(catTitleElement => {
            if (uniqueSuggestions.size >= maxSuggestions) return;
            const catName = catTitleElement.textContent.toLowerCase();
            if(catName.includes(query)) {
                uniqueSuggestions.add(catTitleElement.textContent.trim()); // Add original case for display
            }
        });


        if (uniqueSuggestions.size > 0) {
            suggestionsContainer.style.display = 'block';
            uniqueSuggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = suggestion;
                item.addEventListener('click', () => {
                    searchInput.value = suggestion;
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.style.display = 'none';
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                });
                suggestionsContainer.appendChild(item);
            });
        } else {
            suggestionsContainer.style.display = 'none';
        }

        // Original search filtering logic
        const tokens = query.split(',').map(t => t.trim()).filter(Boolean);
        document.querySelectorAll('.service-button').forEach(button => {
            const name = button.querySelector('.service-name').textContent.toLowerCase();
            const url = button.querySelector('.service-url').textContent.toLowerCase();
            const tagsSpan = button.querySelector('.service-tags');
            let tagsMatch = false;
            if (tagsSpan && tagsSpan.textContent) {
                const tagsArray = tagsSpan.textContent.toLowerCase().split(',').map(tag => tag.trim());
                if (tokens.length > 0) { // Multi-token/tag search
                    tagsMatch = tokens.every(token => tagsArray.some(tag => tag.includes(token)));
                } else { // Single term search
                    tagsMatch = tagsArray.some(tag => tag.includes(query));
                }
            }
            const textMatch = name.includes(query) || url.includes(query);
            button.style.display = (textMatch || tagsMatch) ? 'flex' : 'none';
        });

        const visibleButtons = Array.from(document.querySelectorAll('.service-button'))
            .filter(btn => btn.style.display !== 'none').length;
        const noResultsEl = document.getElementById('noResults');
        if (noResultsEl) {
            noResultsEl.hidden = !(query !== '' && visibleButtons === 0);
        }

        document.querySelectorAll('.category').forEach(category => {
            const services = category.querySelectorAll('.service-button');
            const allHidden = Array.from(services).every(service => service.style.display === 'none');
            const categoryHeader = category.querySelector('h2');

            if (category.id === 'favorites') {
                category.style.display = ''; // Always show favorites category
                if (categoryHeader) categoryHeader.style.display = '';
            } else
            if (query === '') { // If search query is empty, show all categories normally
                category.style.display = '';
                if (categoryHeader) categoryHeader.style.display = '';
            } else {
                if (allHidden) {
                    category.style.display = 'none'; // Hide the whole category section
                } else {
                    category.style.display = ''; // Show category if some services are visible
                    if (categoryHeader) categoryHeader.style.display = '';
                }
            }
        });
    });
}

function toggleCategory(header) {
    // Always target the category content element even if other elements
    // are inserted between the header and the content (e.g. clear button)
    const content = header.parentElement.querySelector('.category-content');
    const chevron = header.querySelector('.chevron');
    const isOpen = content.classList.contains('open');
    const categoryId = header.parentElement.id;

    if (isOpen) {
        content.style.maxHeight = '0px';
        content.classList.remove('open');
        chevron.classList.remove('open');
        header.setAttribute('aria-expanded', 'false');
        localStorage.setItem(`category-${categoryId}`, 'closed');
    } else {
        content.classList.add('open');
        const height = Math.min(content.scrollHeight, MAX_CATEGORY_HEIGHT);
        content.style.maxHeight = height + 'px';
        chevron.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        localStorage.setItem(`category-${categoryId}`, 'open');
    }
}

function createServiceButton(service, favoritesSet, categoryName) {
    const serviceButton = document.createElement('a');
    serviceButton.className = 'service-button';
    serviceButton.href = service.url;
    serviceButton.target = '_blank';
    serviceButton.rel = 'noopener noreferrer';
    serviceButton.dataset.url = service.url;

    let thumbnail;
    if (service.thumbnail_url) {
        thumbnail = document.createElement('img');
        thumbnail.className = 'service-thumbnail';
        thumbnail.alt = `${service.name} thumbnail`;
        thumbnail.src = service.thumbnail_url;
        thumbnail.onerror = () => { thumbnail.style.display = 'none'; };
    }

    const serviceNameSpan = document.createElement('span');
    serviceNameSpan.className = 'service-name';

    const favicon = document.createElement('img');
    favicon.alt = `${service.name} favicon`;
    favicon.className = 'service-favicon';

    const customFaviconUrl = service.favicon_url;
    const defaultFaviconUrl = './favicon.ico'; // Ensure this path is correct

    favicon.src = customFaviconUrl || defaultFaviconUrl;

    favicon.onerror = () => {
        if (customFaviconUrl && favicon.src !== defaultFaviconUrl) {
            // The custom favicon failed, and we haven't tried the default one yet in this handler.
            favicon.src = defaultFaviconUrl;
        } else if (favicon.src === defaultFaviconUrl || !customFaviconUrl) {
            // The default favicon (either as fallback or initial) also failed,
            // or there was no custom favicon in the first place and the default failed.
            // Prevent further onerror calls for this image.
            favicon.onerror = null;
            // Optionally, hide the icon or set a very minimal placeholder if the default also fails:
            // favicon.style.display = 'none';
        }
    };

    serviceNameSpan.appendChild(favicon);
    serviceNameSpan.appendChild(document.createTextNode(service.name));

    const serviceUrlSpan = document.createElement('span');
    serviceUrlSpan.className = 'service-url';
    serviceUrlSpan.textContent = service.url;

    const serviceTagsSpan = document.createElement('span');
    serviceTagsSpan.className = 'service-tags';
    serviceTagsSpan.style.display = 'none';

    let tags = [];
    if (service.tags && Array.isArray(service.tags)) {
        tags = service.tags.slice();
    }

    if (categoryName) {
        const catText = categoryName.replace(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u, '').trim();
        if (!tags.includes(catText)) {
            tags.push(catText);
        }
    }
    serviceTagsSpan.textContent = tags.join(',');

    const star = document.createElement('span');
    star.className = 'favorite-star';
    star.tabIndex = 0;
    star.setAttribute('role', 'button');
    if (favoritesSet.has(service.url)) {
        star.textContent = '★';
        star.classList.add('favorited');
        star.setAttribute('aria-label', 'Remove from favorites');
    } else {
        star.textContent = '☆';
        star.setAttribute('aria-label', 'Add to favorites');
    }
    star.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(service.url);
        }
    });
    star.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(service.url);
    });

    if (thumbnail) {
        serviceButton.appendChild(thumbnail);
    }
    serviceButton.appendChild(serviceNameSpan);
    serviceButton.appendChild(serviceUrlSpan);
    serviceButton.appendChild(serviceTagsSpan);
    serviceButton.appendChild(star);

    return serviceButton;
}

function toggleFavorite(url) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favorites.includes(url)) {
        favorites = favorites.filter(u => u !== url);
    } else {
        favorites.push(url);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateStars();
}

function updateStars() {
    const favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
    document.querySelectorAll('.service-button').forEach(btn => {
        const url = btn.dataset.url;
        const star = btn.querySelector('.favorite-star');
        if (!star) return;
        if (favorites.has(url)) {
            star.textContent = '★';
            star.classList.add('favorited');
            star.setAttribute('aria-label', 'Remove from favorites');
        } else {
            star.textContent = '☆';
            star.classList.remove('favorited');
            star.setAttribute('aria-label', 'Add to favorites');
        }
    });
    renderFavoritesCategory();
}

function clearFavorites() {
    localStorage.removeItem('favorites');
    localStorage.removeItem('category-favorites');
    localStorage.removeItem('view-favorites');
    updateStars();
}

window.clearFavorites = clearFavorites;

function ensureClearFavoritesButton(header) {
    let btn = header.querySelector('#clearFavoritesBtn');
    if (!btn) {
        btn = document.createElement('button');
        btn.classList.add('btn-small');
        btn.id = 'clearFavoritesBtn';
        btn.textContent = 'Clear Favorites';
        btn.type = 'button';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearFavorites();
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                clearFavorites();
            }
        });
        header.appendChild(btn);
    }
}

function renderFavoritesCategory() {
    const mainContainer = document.querySelector('main');
    let favoritesSection = document.getElementById('favorites');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoritesSet = new Set(favorites);
    const favoriteServices = [];
    const seen = new Set();
    for (const service of allServices) {
        if (favoritesSet.has(service.url) && !seen.has(service.url)) {
            favoriteServices.push(service);
            seen.add(service.url);
        }
    }

    let header;
    if (!favoritesSection) {
        favoritesSection = document.createElement('section');
        favoritesSection.className = 'category';
        favoritesSection.id = 'favorites';

        header = document.createElement('h2');
        header.innerHTML =
            `<span class="category-emoji">⭐</span>
             <span class="category-title">Favorites</span>
             <span class="chevron">▼</span>
             <span class="category-view-toggle" role="button" tabindex="0" aria-label="Toggle category view">☰</span>`;
        header.setAttribute('aria-expanded', 'true');
        header.onclick = () => toggleCategory(header);
        header.tabIndex = 0;
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCategory(header);
            }
        });

        const viewToggle = header.querySelector('.category-view-toggle');
        viewToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCategoryView('favorites');
        });
        viewToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                toggleCategoryView('favorites');
            }
        });

        const content = document.createElement('div');
        content.className = 'category-content open';

        favoritesSection.appendChild(header);
        ensureClearFavoritesButton(header);
        favoritesSection.appendChild(content);

        const searchContainer = mainContainer.querySelector('.search-container');
        if (searchContainer) {
            mainContainer.insertBefore(favoritesSection, searchContainer.nextSibling);
        } else {
            mainContainer.prepend(favoritesSection);
        }
    } else {
        header = favoritesSection.querySelector('h2');
        if (header) {
            ensureClearFavoritesButton(header);
        }
    }

    const content = favoritesSection.querySelector('.category-content');
    content.innerHTML = '';

    if (favoriteServices.length === 0) {
        const msg = document.createElement('p');
        msg.id = 'noFavoritesMsg';
        msg.textContent = 'No favorites saved.';
        content.appendChild(msg);
    } else {
        favoriteServices.forEach(service => {
            const btn = createServiceButton(service, favoritesSet);
            content.appendChild(btn);
        });
    }

    ensureClearFavoritesButton(header);
    const btn = header.querySelector('#clearFavoritesBtn');
    if (btn) {
        btn.disabled = favoriteServices.length === 0;
    }

    // Determine and apply the collapsed or expanded state for the Favorites category
    const storedState = localStorage.getItem('category-favorites');
    const chevron = header.querySelector('.chevron');
    // Note: 'content' is favoritesSection.querySelector('.category-content')
    //       'header' is favoritesSection.querySelector('h2')
    //       'favoriteServices' is an array of favorite service objects
    //       'MAX_CATEGORY_HEIGHT' is a globally available constant

    let shouldBeOpen = false;
    // Determine if the category should be open:
    // 1. If it's empty.
    // 2. If no state is stored (first time).
    // 3. If the stored state is 'open'.
    if (favoriteServices.length === 0 || storedState === null || storedState === 'open') {
        shouldBeOpen = true;
    }
    // Otherwise, it remains closed (i.e., it's not empty AND storedState is 'closed')

    if (shouldBeOpen) {
        content.classList.add('open');
        if (chevron) {
            chevron.classList.add('open');
        }
        header.setAttribute('aria-expanded', 'true');

        // Calculate and set maxHeight. This code runs after content.innerHTML is populated.
        const height = Math.min(content.scrollHeight, MAX_CATEGORY_HEIGHT);
        content.style.maxHeight = height + 'px';

        // If the section is empty and it was previously closed, or if it's the first time loading (no state stored),
        // default to open and save this state.
        if ((favoriteServices.length === 0 && storedState === 'closed') || storedState === null) {
            localStorage.setItem('category-favorites', 'open');
        }
    } else {
        // This case means: favoriteServices.length > 0 AND storedState === 'closed'
        content.classList.remove('open');
        if (chevron) {
            chevron.classList.remove('open');
        }
        header.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = '0px';
    }

    const view = localStorage.getItem('view-favorites');
    if (view === 'list') {
        favoritesSection.classList.add('list-view');
        const toggle = favoritesSection.querySelector('.category-view-toggle');
        if (toggle) {
            toggle.classList.add('active');
        }
    } else {
        favoritesSection.classList.remove('list-view');
        const toggle = favoritesSection.querySelector('.category-view-toggle');
        if (toggle) {
            toggle.classList.remove('active');
        }
    }
}

function applySavedTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        document.documentElement.classList.add('light-mode');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    document.documentElement.classList.toggle('light-mode', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateToggleButtons();
}

window.toggleTheme = toggleTheme;

function applySavedView() {
    const saved = localStorage.getItem('view');
    if (saved === 'block') {
        document.body.classList.add('block-view');
    }
}

function applySavedMobileView() {
    const saved = localStorage.getItem('mobileView');
    if (saved === 'on') {
        document.body.classList.add('mobile-view');
    }
}

function toggleView() {
    const isBlock = document.body.classList.toggle('block-view');
    localStorage.setItem('view', isBlock ? 'block' : 'list');
    updateToggleButtons();
}

window.toggleView = toggleView;

function toggleMobileView() {
    const isMobile = document.body.classList.toggle('mobile-view');
    localStorage.setItem('mobileView', isMobile ? 'on' : 'off');
    updateToggleButtons();
}

window.toggleMobileView = toggleMobileView;

function toggleCategoryView(categoryId) {
    const section = document.getElementById(categoryId);
    if (!section) return;
    const isList = section.classList.toggle('list-view');
    localStorage.setItem(`view-${categoryId}`, isList ? 'list' : 'grid');
    const toggle = section.querySelector('.category-view-toggle');
    if (toggle) {
        toggle.classList.toggle('active', isList);
    }
}

window.toggleCategoryView = toggleCategoryView;

function updateToggleButtons() {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.classList.toggle('active', document.body.classList.contains('light-mode'));
    }
    const viewBtn = document.getElementById('viewToggle');
    if (viewBtn) {
        viewBtn.classList.toggle('active', document.body.classList.contains('block-view'));
    }
    const mobileBtn = document.getElementById('mobileToggle');
    if (mobileBtn) {
        mobileBtn.classList.toggle('active', document.body.classList.contains('mobile-view'));
    }
}

function buildSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = '';
    const sections = document.querySelectorAll('.category');
    sections.forEach(section => {
        const titleEl = section.querySelector('.category-title');
        if (!titleEl) return;
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = titleEl.textContent;
        link.addEventListener('click', () => {
            toggleSidebar();
        });
        sidebar.appendChild(link);
    });
    const repoLink = document.createElement('a');
    repoLink.href = 'https://www.github.com/NathanNeurotic/PS2Links/';
    repoLink.textContent = 'GitHub Repository';
    repoLink.target = '_blank';
    repoLink.rel = 'noopener noreferrer';
    sidebar.appendChild(repoLink);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', sidebar.classList.contains('open'));
}

window.toggleSidebar = toggleSidebar;
window.buildSidebar = buildSidebar;

function populateTagDropdown() {
    const datalist = document.getElementById('tagOptions');
    if (!datalist) return;
    const tagSet = new Set();
    for (const service of allServices) {
        if (Array.isArray(service.tags)) {
            service.tags.forEach(tag => tagSet.add(tag));
        }
    }
    datalist.innerHTML = '';
    Array.from(tagSet).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        datalist.appendChild(option);
    });
}

window.populateTagDropdown = populateTagDropdown;

