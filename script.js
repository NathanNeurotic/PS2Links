let allServices = [];
let deferredPrompt = null;
let sidebarObserver = null;
const MAX_CATEGORY_HEIGHT =
    parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
            '--category-max-height'
        )
    ) || 400; // px - limit for open category height

const STAR_FILLED_PATH = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.7881 3.21068C11.2364 2.13274 12.7635 2.13273 13.2118 3.21068L15.2938 8.2164L20.6979 8.64964C21.8616 8.74293 22.3335 10.1952 21.4469 10.9547L17.3295 14.4817L18.5874 19.7551C18.8583 20.8908 17.6229 21.7883 16.6266 21.1798L11.9999 18.3538L7.37329 21.1798C6.37697 21.7883 5.14158 20.8908 5.41246 19.7551L6.67038 14.4817L2.55303 10.9547C1.66639 10.1952 2.13826 8.74293 3.302 8.64964L8.70609 8.2164L10.7881 3.21068Z"/></svg>';
const STAR_OUTLINE_PATH = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4806 3.4987C11.6728 3.03673 12.3272 3.03673 12.5193 3.4987L14.6453 8.61016C14.7263 8.80492 14.9095 8.93799 15.1197 8.95485L20.638 9.39724C21.1367 9.43722 21.339 10.0596 20.959 10.3851L16.7546 13.9866C16.5945 14.1238 16.5245 14.3391 16.5734 14.5443L17.8579 19.9292C17.974 20.4159 17.4446 20.8005 17.0176 20.5397L12.2932 17.6541C12.1132 17.5441 11.8868 17.5441 11.7068 17.6541L6.98238 20.5397C6.55539 20.8005 6.02594 20.4159 6.14203 19.9292L7.42652 14.5443C7.47546 14.3391 7.4055 14.1238 7.24531 13.9866L3.04099 10.3851C2.661 10.0596 2.86323 9.43722 3.36197 9.39724L8.88022 8.95485C9.09048 8.93799 9.27363 8.80492 9.35464 8.61016L11.4806 3.4987Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON_SVG = '<svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.5303 16.2803C12.2374 16.5732 11.7626 16.5732 11.4697 16.2803L3.96967 8.78033C3.67678 8.48744 3.67678 8.01256 3.96967 7.71967C4.26256 7.42678 4.73744 7.42678 5.03033 7.71967L12 14.6893L18.9697 7.71967C19.2626 7.42678 19.7374 7.42678 20.0303 7.71967C20.3232 8.01256 20.3232 8.48744 20.0303 8.78033L12.5303 16.2803Z"/></svg>';
const HAMBURGER_ICON = '☰';
const CLOSE_ICON = '&times;'; // HTML entity for '×'

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    applySavedView(); // For body.block-view
    applySavedDesktopView();
    applySavedMobileView();

    // New logic to enforce mutual exclusivity and default
    let desktopIsActuallyActive = document.body.classList.contains('desktop-view');
    let mobileIsActuallyActive = document.body.classList.contains('mobile-view');

    if (desktopIsActuallyActive && mobileIsActuallyActive) {
        // Conflict: both classes are on body. Prioritize desktop.
        document.body.classList.remove('mobile-view');
        localStorage.setItem('mobileViewActive', 'false');
        mobileIsActuallyActive = false; // update local flag
    } else if (!desktopIsActuallyActive && !mobileIsActuallyActive) {
        // Neither is active (e.g., first visit or cleared storage). Default to desktop.
        document.body.classList.add('desktop-view');
        localStorage.setItem('desktopViewActive', 'true');
        localStorage.setItem('mobileViewActive', 'false'); // Ensure mobile is marked false
    } else if (desktopIsActuallyActive && !mobileIsActuallyActive) {
        // Desktop is solely active, ensure localStorage reflects this if it was ambiguous
        localStorage.setItem('desktopViewActive', 'true');
        localStorage.setItem('mobileViewActive', 'false');
    } else if (!desktopIsActuallyActive && mobileIsActuallyActive) {
        // Mobile is solely active, ensure localStorage reflects this
        localStorage.setItem('desktopViewActive', 'false');
        localStorage.setItem('mobileViewActive', 'true');
    }

    updateHeaderButtonStates(); // Call once after all states applied and resolved

    buildSidebar();
    setupSidebarHighlighting();

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    const desktopToggleBtn = document.getElementById('desktopToggle');
    if (desktopToggleBtn) {
        desktopToggleBtn.addEventListener('click', toggleDesktopView);
    }

    // Ensure mobileToggle event listener is correctly assigned
    const mobileToggleBtn = document.getElementById('mobileToggle');
    if (mobileToggleBtn) { // Check if onclick is not already set inline
         mobileToggleBtn.addEventListener('click', toggleMobileView);
    }
    // Ensure viewToggle event listener is correctly assigned
    const viewToggleBtn = document.getElementById('viewToggle');
    if (viewToggleBtn) { // Check if onclick is not already set inline
        viewToggleBtn.addEventListener('click', toggleView);
    }

    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    const headerExpandAllBtn = document.getElementById('headerExpandAllBtn');
    if (headerExpandAllBtn) {
        headerExpandAllBtn.addEventListener('click', expandAllCategories);
    }

    const headerCollapseAllBtn = document.getElementById('headerCollapseAllBtn');
    if (headerCollapseAllBtn) {
        headerCollapseAllBtn.addEventListener('click', collapseAllCategories);
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
    const textToType = 'PS2Links Hub'; // MODIFIED for PS2Links

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

    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').then(reg => {
            function notify(worker) {
                const bar = document.getElementById('updateNotification');
                if (!bar) return;
                bar.hidden = false;
                const refresh = document.getElementById('refreshBtn');
                if (refresh) {
                    refresh.addEventListener('click', () => {
                        worker.postMessage({ type: 'SKIP_WAITING' });
                    });
                }
            }

            if (reg.waiting) {
                notify(reg.waiting);
            }

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && reg.waiting) {
                            notify(reg.waiting);
                        }
                    });
                }
            });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        });
    }
});

async function loadServices() {
    try {
        const response = await fetch('./links.json'); // MODIFIED for PS2Links
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json(); // jsonData is an array of category groups

        // MODIFICATION START: Flatten links.json structure
        allServices = [];
        jsonData.forEach(categoryGroup => {
            const categoryName = categoryGroup.category;
            if (categoryGroup.links && Array.isArray(categoryGroup.links)) {
                categoryGroup.links.forEach(link => {
                    const serviceTags = link.tags ? [...link.tags] : [];
                    const cleanCategoryName = categoryName.replace(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u, '').trim();
                    if (!serviceTags.includes(cleanCategoryName)) {
                        serviceTags.push(cleanCategoryName);
                    }
                    allServices.push({ ...link, category: categoryName, tags: serviceTags });
                });
            }
        });
        // MODIFICATION END: allServices is now a flat array

        const mainContainer = document.querySelector('main');
        const existingCategories = mainContainer.querySelectorAll('.category');
        existingCategories.forEach(cat => cat.remove());

        const categories = allServices.reduce((acc, service) => {
            const category = service.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {});

        const normalize = (name) => name.replace(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u, '').trim().toLowerCase();
        const sortedCategoryNames = Object.keys(categories).sort((a, b) => normalize(a).localeCompare(normalize(b)));
        for (const categoryName of sortedCategoryNames) {
            const servicesInCategory = categories[categoryName];
            servicesInCategory.sort((a, b) => a.name.localeCompare(b.name));
            const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            const categorySection = document.createElement('section');
            categorySection.className = 'category';
            categorySection.id = categoryId;

            const categoryHeader = document.createElement('h2');
            categoryHeader.setAttribute('aria-expanded', 'false');
            categoryHeader.addEventListener('click', () => toggleCategory(categoryHeader));
            categoryHeader.tabIndex = 0;
            categoryHeader.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(categoryHeader);
                }
            });

            const emojiMatch = categoryName.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u);
            let emojiSpan = '';
            let textContent = categoryName;

            if (emojiMatch) {
                emojiSpan = `<span class="category-emoji">${emojiMatch[0].trim()}</span> `;
                textContent = categoryName.substring(emojiMatch[0].length).trim();
            }

            categoryHeader.innerHTML = `${emojiSpan}<span class="category-title">${textContent}</span> ${CHEVRON_SVG}<span class="category-view-toggle" role="button" tabindex="0" aria-label="Toggle category view" title="Toggle category view">☰</span>`;
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
        setupSidebarHighlighting();
        setupSearch();
        populateTagDropdown();

    } catch (error) {
        console.error('Failed to load services:', error);
        const mainContainer = document.querySelector('main');
        mainContainer.innerHTML = '<p class="error-message">Failed to load services. Please try again later.</p>';
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const tokens = query.split(',').map(t => t.trim()).filter(Boolean);
        document.querySelectorAll('.service-button').forEach(button => {
            const name = button.querySelector('.service-name').textContent.toLowerCase();
            const url = button.querySelector('.service-url').textContent.toLowerCase();
            const tagsSpan = button.querySelector('.service-tags');
            let tagsMatch = false;
            if (tagsSpan && tagsSpan.textContent) {
                const tagsArray = tagsSpan.textContent.toLowerCase().split(',').map(tag => tag.trim());
                if (tokens.length > 0) {
                    tagsMatch = tokens.every(token => tagsArray.some(tag => tag.includes(token)));
                } else {
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
            if (query !== '' && visibleButtons === 0) {
                noResultsEl.hidden = false;
            } else {
                noResultsEl.hidden = true;
            }
        }

        document.querySelectorAll('.category').forEach(category => {
            const services = category.querySelectorAll('.service-button');
            const allHidden = Array.from(services).every(service => service.style.display === 'none');
            const categoryHeader = category.querySelector('h2');

            if (category.id === 'favorites') {
                category.style.display = '';
                if (categoryHeader) categoryHeader.style.display = '';
            } else
            if (query === '') {
                category.style.display = '';
                if (categoryHeader) categoryHeader.style.display = '';
            } else {
                if (allHidden) {
                    category.style.display = 'none';
                } else {
                    category.style.display = '';
                    if (categoryHeader) categoryHeader.style.display = '';
                }
            }
        });
    });
}

function toggleCategory(header) {
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

function expandAllCategories() {
    document.querySelectorAll('.category h2').forEach(header => {
        const content = header.parentElement.querySelector('.category-content');
        if (content && !content.classList.contains('open')) {
            toggleCategory(header);
        }
    });
}

function collapseAllCategories() {
    document.querySelectorAll('.category h2').forEach(header => {
        const content = header.parentElement.querySelector('.category-content');
        if (content && content.classList.contains('open')) {
            toggleCategory(header);
        }
    });
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
    favicon.src = service.favicon_url || './favicon.ico'; // Fallback to global favicon
    favicon.onerror = () => { favicon.src = './favicon.ico'; };

    serviceNameSpan.appendChild(favicon);
    const serviceNameText = document.createElement('span'); // Create a new span for the text
    serviceNameText.className = 'service-name-text';    // Add the class
    serviceNameText.appendChild(document.createTextNode(service.name));
    serviceNameSpan.appendChild(serviceNameText);        // Append the new span

    const serviceUrlSpan = document.createElement('span');
    serviceUrlSpan.className = 'service-url';
    serviceUrlSpan.textContent = service.url;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-link';
    copyBtn.textContent = '📋';
    copyBtn.setAttribute('aria-label', `Copy ${service.name} URL`);
    copyBtn.title = `Copy ${service.name} URL`;
    copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(service.url).then(() => {
            const original = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = original;
            }, 1000);
        });
    });
    serviceUrlSpan.appendChild(copyBtn);

    const serviceTagsSpan = document.createElement('span');
    serviceTagsSpan.className = 'service-tags';
    serviceTagsSpan.style.display = 'none';
    // Tags are now pushed into service.tags directly in loadServices
    if (service.tags && Array.isArray(service.tags)) {
        serviceTagsSpan.textContent = service.tags.join(',');
    }


    const star = document.createElement('span');
    star.classList.add('favorite-star');
    star.innerHTML = favoritesSet.has(service.url) ? STAR_FILLED_PATH : STAR_OUTLINE_PATH;
    star.tabIndex = 0;
    star.setAttribute('role', 'button');
    if (favoritesSet.has(service.url)) {
        star.classList.add('favorited');
        star.setAttribute('aria-label', 'Remove from favorites');
    } else {
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

function setStarState(star, filled) {
    star.innerHTML = filled ? STAR_FILLED_PATH : STAR_OUTLINE_PATH;
    star.classList.toggle('favorited', filled);
    star.setAttribute('aria-label', filled ? 'Remove from favorites' : 'Add to favorites');
    star.title = filled ? 'Remove from favorites' : 'Add to favorites';
}

function updateStars() {
    const favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
    document.querySelectorAll('.service-button').forEach(btn => {
        const url = btn.dataset.url;
        const star = btn.querySelector('.favorite-star');
        if (!star) return;
        setStarState(star, favorites.has(url));
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
        btn.classList.add('btn-small'); // Reference class for small buttons
        btn.id = 'clearFavoritesBtn';
        btn.textContent = 'Clear Favorites';
        btn.title = 'Clear all favorites';
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
    for (const service of allServices) { // allServices is now correctly populated and flat
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
             ${CHEVRON_SVG}
             <span class="category-view-toggle" role="button" tabindex="0" aria-label="Toggle category view" title="Toggle category view">☰</span>`;
        header.setAttribute('aria-expanded', 'true'); // Default favorites to expanded
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
        content.className = 'category-content open'; // Default favorites to open

        favoritesSection.appendChild(header);
        ensureClearFavoritesButton(header); // Add clear button
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
    content.innerHTML = ''; // Clear previous items

    if (favoriteServices.length === 0) {
        const msg = document.createElement('p');
        msg.id = 'noFavoritesMsg';
        msg.textContent = 'No favorites saved.';
        content.appendChild(msg);
    } else {
        favoriteServices.forEach(service => {
            const btn = createServiceButton(service, favoritesSet); // categoryName not strictly needed here if service.category is populated
            content.appendChild(btn);
        });
    }

    const clearBtn = header.querySelector('#clearFavoritesBtn'); // Query button again after ensuring it exists
    if (clearBtn) { // Check if button exists before trying to disable it
        clearBtn.disabled = favoriteServices.length === 0;
    }


    const storedState = localStorage.getItem('category-favorites');
    const chevron = header.querySelector('.chevron');

    let shouldBeOpen = favoriteServices.length === 0 || storedState === null || storedState === 'open';

    if (shouldBeOpen) {
        content.classList.add('open');
        if (chevron) chevron.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        const height = Math.min(content.scrollHeight, MAX_CATEGORY_HEIGHT);
        content.style.maxHeight = height + 'px';
        if ((favoriteServices.length === 0 && storedState === 'closed') || storedState === null) {
            localStorage.setItem('category-favorites', 'open');
        }
    } else {
        content.classList.remove('open');
        if (chevron) chevron.classList.remove('open');
        header.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = '0px';
    }

    const view = localStorage.getItem('view-favorites');
    if (view === 'list') {
        favoritesSection.classList.add('list-view');
        const toggle = favoritesSection.querySelector('.category-view-toggle');
        if (toggle) toggle.classList.add('active');
    } else {
        favoritesSection.classList.remove('list-view');
        const toggle = favoritesSection.querySelector('.category-view-toggle');
        if (toggle) toggle.classList.remove('active');
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
    updateHeaderButtonStates();
}

function applySavedView() {
    const saved = localStorage.getItem('view');
    if (saved === 'block') {
        document.body.classList.add('block-view');
    }
}

function applySavedDesktopView() {
    if (localStorage.getItem('desktopViewActive') === 'true') {
        document.body.classList.add('desktop-view');
    }
}

function applySavedMobileView() {
    let mobileShouldBeActive = false;
    const newMobileSetting = localStorage.getItem('mobileViewActive');
    const oldMobileSetting = localStorage.getItem('mobileView'); // 'on'/'off'

    if (newMobileSetting !== null) {
        mobileShouldBeActive = newMobileSetting === 'true';
    } else if (oldMobileSetting !== null) {
        mobileShouldBeActive = oldMobileSetting === 'on';
        localStorage.setItem('mobileViewActive', mobileShouldBeActive ? 'true' : 'false');
        // Consider removing old key: localStorage.removeItem('mobileView');
    }

    if (mobileShouldBeActive) {
        document.body.classList.add('mobile-view');
    }
}

function toggleView() { // This is for the global list/block view
    const isBlock = document.body.classList.toggle('block-view');
    localStorage.setItem('view', isBlock ? 'block' : 'list');
    updateHeaderButtonStates(); // Renamed
}

function toggleMobileView() {
    document.body.classList.add('mobile-view');
    document.body.classList.remove('desktop-view');
    localStorage.setItem('mobileViewActive', 'true');
    localStorage.setItem('desktopViewActive', 'false');
    // For backward compatibility if any other part of code reads old key before full migration
    localStorage.setItem('mobileView', 'on');
    updateHeaderButtonStates();
}
window.toggleMobileView = toggleMobileView;

function toggleDesktopView() {
    document.body.classList.add('desktop-view');
    document.body.classList.remove('mobile-view');
    localStorage.setItem('desktopViewActive', 'true');
    localStorage.setItem('mobileViewActive', 'false');
    // For backward compatibility if any other part of code reads old key
    localStorage.setItem('mobileView', 'off');
    updateHeaderButtonStates();
}
// window.toggleDesktopView = toggleDesktopView; // Not called by HTML onclick, but by JS event listener

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

function updateHeaderButtonStates() { // Renamed from updateToggleButtons
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const isLight = document.body.classList.contains('light-mode');
        themeBtn.classList.toggle('active', isLight);
        themeBtn.innerHTML = isLight ?
            '<svg id="themeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' :
            '<svg id="themeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
    const viewBtn = document.getElementById('viewToggle');
    if (viewBtn) {
        const isBlock = document.body.classList.contains('block-view');
        viewBtn.classList.toggle('active', isBlock);
        viewBtn.innerHTML = isBlock ?
            '<svg id="viewIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' :
            '<svg id="viewIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
    }
    const mobileBtn = document.getElementById('mobileToggle');
    if (mobileBtn) {
        const isMobileView = document.body.classList.contains('mobile-view');
        mobileBtn.classList.toggle('active', isMobileView);
        if (isMobileView) {
            mobileBtn.title = 'Switch to desktop view';
            mobileBtn.setAttribute('aria-label', 'Switch to desktop view');
        } else {
            mobileBtn.title = 'Switch to mobile view';
            mobileBtn.setAttribute('aria-label', 'Switch to mobile view');
        }
        // SVG for mobileToggle is static in HTML, no innerHTML change needed unless icon should change
    }
    const desktopBtn = document.getElementById('desktopToggle');
    if (desktopBtn) {
        const isDesktopView = document.body.classList.contains('desktop-view');
        desktopBtn.classList.toggle('active', isDesktopView);
        if (isDesktopView) {
            desktopBtn.title = 'Switch to mobile view';
            desktopBtn.setAttribute('aria-label', 'Switch to mobile view');
        } else {
            desktopBtn.title = 'Switch to desktop view';
            desktopBtn.setAttribute('aria-label', 'Switch to desktop view');
        }
        // Text for desktopToggle is static, no innerHTML change needed unless icon should change
    }
}

function buildSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = '';
    const sections = document.querySelectorAll('.category');
    sections.forEach(section => {
        const titleEl = section.querySelector('.category-title');
        if (!titleEl) return; // Should not happen if categories are built correctly
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = titleEl.textContent; // Use the text part of the title
        link.addEventListener('click', (e) => { // Added event arg
            e.preventDefault(); // Prevent default anchor jump
            document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            toggleSidebar(); // Close sidebar after clicking
        });
        sidebar.appendChild(link);
    });
    const repoLink = document.createElement('a');
    repoLink.href = 'https://www.github.com/NathanNeurotic/PS2Links/'; // MODIFIED for PS2Links
    repoLink.textContent = 'GitHub Repository';
    repoLink.target = '_blank';
    repoLink.rel = 'noopener noreferrer';
    sidebar.appendChild(repoLink);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (!sidebar || !sidebarToggleBtn || !sidebarOverlay) return;

    sidebar.classList.toggle('open');
    const isOpen = sidebar.classList.contains('open');
    document.body.classList.toggle('sidebar-open', isOpen);

    if (isOpen) {
        sidebarToggleBtn.innerHTML = CLOSE_ICON;
        sidebarOverlay.classList.add('active');
    } else {
        sidebarToggleBtn.innerHTML = HAMBURGER_ICON;
        sidebarOverlay.classList.remove('active');
    }
}
window.toggleSidebar = toggleSidebar; // Make it globally accessible if called by HTML onclick
// window.buildSidebar = buildSidebar; // Not typically called globally

function setupSidebarHighlighting() {
    if (sidebarObserver) {
        sidebarObserver.disconnect();
    }
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !('IntersectionObserver' in window)) return;
    const links = sidebar.querySelectorAll('a[href^="#"]');
    const sections = Array.from(document.querySelectorAll('.category')).filter(s => s.id !== 'favorites'); // Exclude favorites from main nav highlighting

    if (!links.length || !sections.length) return;

    sidebarObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = entry.target.id;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                links.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            } else { // If not intersecting enough, remove active class
                const link = sidebar.querySelector(`a[href="#${id}"]`);
                if (link) link.classList.remove('active');
            }
        });
    }, { threshold: 0.5 });

    sections.forEach(section => sidebarObserver.observe(section));
}


function populateTagDropdown() {
    const datalist = document.getElementById('tagOptions');
    if (!datalist) return;
    const tagSet = new Set();
    // allServices should be populated by loadServices before this is called
    for (const service of allServices) {
        if (Array.isArray(service.tags)) {
            service.tags.forEach(tag => tagSet.add(tag));
        }
    }
    datalist.innerHTML = ''; // Clear existing options
    Array.from(tagSet).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        datalist.appendChild(option);
    });
}

// Make functions globally available if they are called via HTML onclick attributes
window.populateTagDropdown = populateTagDropdown;
// window.setupSidebarHighlighting = setupSidebarHighlighting; // Usually called internally
