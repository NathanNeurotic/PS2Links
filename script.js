function displayErrorInMain(message) {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
        mainContainer.innerHTML = `<p class='error-message' style='color: red; text-align: center; padding: 20px;'><strong>Initialization Error:</strong> ${message}</p>`;
    }
    console.error(message); // Keep console error as well
}

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
    if (document.querySelector('main')) {
        loadServices();
    }
});

async function loadServices() {
    const mainContainer = document.querySelector('main'); // Moved for early access for error display
    try {
        const response = await fetch('./services.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Failed to fetch services.json. Status: ${response.status}`);
        }
        const services = await response.json();
        if (!services || !Array.isArray(services) || services.length === 0) {
            throw new Error('services.json was loaded but is empty or not a valid array of services.');
        }
        allServices = services;
        // Original content of try block continues here...
        const existingCategories = mainContainer.querySelectorAll('.category');
        existingCategories.forEach(cat => cat.remove());
        const categories = services.reduce((acc, service) => {
            const category = service.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {});
        const normalize = (name) => name.replace(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u, '').trim().toLowerCase();
        const sortedCategoryNames = Object.keys(categories).sort((a, b) => norma
lize(a).localeCompare(normalize(b)));
        for (const categoryName of sortedCategoryNames) {
            const servicesInCategory = categories[categoryName];
            servicesInCategory.sort((a, b) => a.name.localeCompare(b.name));
            const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-').r
eplace(/[^a-z0-9-]/g, '');
            const categorySection = document.createElement('section');
            categorySection.className = 'category';
            categorySection.id = categoryId;
            const categoryHeader = document.createElement('h2');
            categoryHeader.setAttribute('aria-expanded', 'false');
            categoryHeader.onclick = () => toggleCategory(categoryHeader);
            categoryHeader.tabIndex = 0;
            categoryHeader.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(categoryHeader);
                }
            });
            const emojiMatch = categoryName.match(/^(\p{Emoji_Presentation}|\p{E
moji})\s*/u);
            let emojiSpan = '';
            let textContent = categoryName;
            if (emojiMatch) {
                emojiSpan = `<span class="category-emoji">${emojiMatch[0].trim()
}</span> `;
                textContent = categoryName.substring(emojiMatch[0].length).trim(
);
            }
            categoryHeader.innerHTML = `${emojiSpan}<span class="category-title"
>${textContent}</span> <span class="chevron">▼</span><span class="category-view-
toggle" role="button" tabindex="0" aria-label="Toggle category view">☰</span>`;
            const viewToggle = categoryHeader.querySelector('.category-view-togg
le');
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
                    new Set(JSON.parse(localStorage.getItem('favorites') || '[]'
)),
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
                const height = Math.min(content.scrollHeight, MAX_CATEGORY_HEIGH
T);
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
        setupSearch();
    } catch (error) {
        displayErrorInMain('Failed to load or process services.json: ' + error.message);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.service-button').forEach(button => {
            const name = button.querySelector('.service-name').textContent.toLow
erCase();
            const url = button.querySelector('.service-url').textContent.toLower
Case();
            const tagsSpan = button.querySelector('.service-tags');
            let tagsMatch = false;
            if (tagsSpan && tagsSpan.textContent) {
                const tagsArray = tagsSpan.textContent.toLowerCase().split(',').
map(tag => tag.trim());
                tagsMatch = tagsArray.some(tag => tag.includes(query));
            }
            button.style.display = (name.includes(query) || url.includes(query)
|| tagsMatch) ? 'flex' : 'none';
        });

        const visibleButtons = Array.from(document.querySelectorAll('.service-bu
tton'))
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
            const allHidden = Array.from(services).every(service => service.styl
e.display === 'none');
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
    favicon.src = service.favicon_url || './favicon.ico';
    favicon.onerror = () => { favicon.src = './favicon.ico'; };

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
    const favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[
]'));
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
             <span class="category-view-toggle" role="button" tabindex="0" aria-
label="Toggle category view">☰</span>`;
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

        const searchContainer = mainContainer.querySelector('.search-container')
;
        if (searchContainer) {
            mainContainer.insertBefore(favoritesSection, searchContainer.nextSib
ling);
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

    const storedState = localStorage.getItem('category-favorites');
    const chevron = header.querySelector('.chevron');
    let shouldBeOpen = false;
    if (favoriteServices.length === 0 || storedState === null || storedState ===
 'open') {
        shouldBeOpen = true;
    }

    if (shouldBeOpen) {
        content.classList.add('open');
        if (chevron) {
            chevron.classList.add('open');
        }
        header.setAttribute('aria-expanded', 'true');
        const height = Math.min(content.scrollHeight, MAX_CATEGORY_HEIGHT);
        content.style.maxHeight = height + 'px';
        if ((favoriteServices.length === 0 && storedState === 'closed') || store
dState === null) {
            localStorage.setItem('category-favorites', 'open');
        }
    } else {
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

function toggleView() {
    const isBlock = document.body.classList.toggle('block-view');
    localStorage.setItem('view', isBlock ? 'block' : 'list');
    updateToggleButtons();
}

window.toggleView = toggleView;

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
        themeBtn.classList.toggle('active', document.body.classList.contains('li
ght-mode'));
    }
    const viewBtn = document.getElementById('viewToggle');
    if (viewBtn) {
        viewBtn.classList.toggle('active', document.body.classList.contains('blo
ck-view'));
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
    repoLink.href = 'https://github.com/your-repo/PS2Links';
    repoLink.textContent = 'GitHub Repository';
    repoLink.target = '_blank';
    repoLink.rel = 'noopener noreferrer';
    sidebar.appendChild(repoLink);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', sidebar.classList.contains('o
pen'));
}

window.toggleSidebar = toggleSidebar;
window.buildSidebar = buildSidebar;
