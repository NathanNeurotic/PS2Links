document.addEventListener("DOMContentLoaded", () => {
    let favorites = [];
    let expandedCategories = [];
    let allLinksData = [];
    let currentView = 'list';
    let currentTheme = localStorage.getItem('theme') || 'dark';

    const listViewBtn = document.getElementById('list-view-btn');
    const thumbnailViewBtn = document.getElementById('thumbnail-view-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mainElement = document.querySelector("main");

    function loadExpandedCategories() {
        const storedExpanded = localStorage.getItem('expandedCategories');
        if (storedExpanded) {
            try {
                expandedCategories = JSON.parse(storedExpanded);
            } catch (e) {
                console.error("Error parsing expandedCategories from localStorage:", e);
                expandedCategories = [];
            }
        }
    }

    function saveExpandedCategories() {
        localStorage.setItem('expandedCategories', JSON.stringify(expandedCategories));
    }

    function loadFavorites() {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
            try {
                favorites = JSON.parse(storedFavorites);
            } catch (e) {
                console.error("Error parsing favorites from localStorage:", e);
                favorites = []; // Reset to empty if parsing fails
            }
        }
    }

    function saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    function toggleFavorite(url) {
        const index = favorites.indexOf(url);
        if (index > -1) {
            favorites.splice(index, 1); // Remove from favorites
        } else {
            favorites.push(url); // Add to favorites
        }
        saveFavorites();
        generateHTML(allLinksData); // Re-render the UI
    }

    function getFaviconUrl(url) {
        try {
            const urlObject = new URL(url);
            return `${urlObject.protocol}//${urlObject.hostname}/favicon.ico`;
        } catch (error) {
            console.error("Invalid URL:", error);
            return 'favicon.ico'; // Fallback to local if URL parsing fails
        }
    }

    function applyTheme() {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(currentTheme + '-mode');
        if (themeToggleBtn) {
            themeToggleBtn.textContent = currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
    }

    function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    applyTheme(); // Apply initial theme on load

    async function fetchLinks() {
        try {
            const response = await fetch('links.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Could not fetch links.json:", error);
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
        if (!mainElement) {
            console.error("Main element not found!");
            return;
        }
        mainElement.innerHTML = '';

        // Favorites Section
        if (favorites.length > 0) {
            const favSection = document.createElement("section");
            const favH2 = document.createElement("h2");
            favH2.classList.add("collapsible");
            favH2.textContent = "Favorites";

            const favContentDiv = document.createElement("div");
            favContentDiv.classList.add("content");
            favContentDiv.classList.add(currentView === 'list' ? 'list-view' : 'thumbnail-view');

            let favoriteLinks = [];
            allLinksData.forEach(category => {
                category.links.forEach(link => {
                    if (favorites.includes(link.url)) {
                        favoriteLinks.push(link);
                    }
                });
            });

            // Sort favorite links alphabetically by name
            favoriteLinks.sort((a, b) => a.name.localeCompare(b.name));


            if (currentView === 'list') {
                const ul = document.createElement("ul");
                favoriteLinks.forEach(linkObj => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = linkObj.url;
                    a.target = "_blank";

                    const img = document.createElement("img");
                    img.src = getFaviconUrl(linkObj.url);
                    img.alt = ""; // Decorative
                    img.loading = 'lazy';
                    img.onerror = function() { this.src = 'favicon.ico'; };
                    img.classList.add("list-view-favicon");
                    a.prepend(img);
                    const textNode = document.createTextNode(" " + linkObj.name);
                    a.appendChild(textNode);

                    const favButton = document.createElement("button");
                    favButton.classList.add('favorite-btn');
                    favButton.innerHTML = '★';
                    if (favorites.includes(linkObj.url)) {
                        favButton.classList.add('favorited');
                    }
                    favButton.addEventListener('click', () => toggleFavorite(linkObj.url));

                    li.appendChild(a);
                    li.appendChild(favButton); // Append button to li
                    ul.appendChild(li);
                });
                favContentDiv.appendChild(ul);
            } else { // Thumbnail view
                favoriteLinks.forEach(linkObj => {
                    const thumbnailFigure = document.createElement("figure");
                    thumbnailFigure.classList.add("thumbnail-item");
                    const a = document.createElement("a");
                    a.href = linkObj.url;
                    a.target = "_blank";
                    const img = document.createElement("img");
                    img.src = getFaviconUrl(linkObj.url);
                    img.alt = linkObj.name;
                    img.loading = 'lazy';
                    img.onerror = function() { this.src = 'favicon.ico'; };
                    const figcaption = document.createElement("figcaption");
                    figcaption.textContent = linkObj.name;
                    a.appendChild(img);
                    a.appendChild(figcaption);
                    thumbnailFigure.appendChild(a);

                    const favButton = document.createElement("button");
                    favButton.classList.add('favorite-btn');
                    favButton.innerHTML = '★';
                    if (favorites.includes(linkObj.url)) {
                        favButton.classList.add('favorited');
                    }
                    favButton.addEventListener('click', () => toggleFavorite(linkObj.url));
                    thumbnailFigure.appendChild(favButton); // Append button to figure

                    favContentDiv.appendChild(thumbnailFigure);
                });
            }
            favSection.appendChild(favH2);
            favSection.appendChild(favContentDiv);
            mainElement.appendChild(favSection);
        }

        // Process all other categories
        data.forEach(categoryObj => {
            const section = document.createElement("section");
            // section.classList.add("category-section");
            const h2 = document.createElement("h2");
            h2.classList.add("collapsible");
            h2.textContent = categoryObj.category;

            const contentDiv = document.createElement("div");
            contentDiv.classList.add("content");
            contentDiv.classList.add(currentView === 'list' ? 'list-view' : 'thumbnail-view');

            if (currentView === 'list') {
                const ul = document.createElement("ul");
                categoryObj.links.forEach(linkObj => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = linkObj.url;
                    a.target = "_blank";

                    const img = document.createElement("img");
                    img.src = getFaviconUrl(linkObj.url);
                    img.alt = ""; // Decorative
                    img.loading = 'lazy';
                    img.onerror = function() {
                        this.src = 'favicon.ico'; // Fallback
                    };
                    img.classList.add("list-view-favicon");

                    a.prepend(img); // Add the icon first
                    const textNode = document.createTextNode(" " + linkObj.name);
                    a.appendChild(textNode);

                    const favButton = document.createElement("button");
                    favButton.classList.add('favorite-btn');
                    favButton.innerHTML = '★';
                    if (favorites.includes(linkObj.url)) {
                        favButton.classList.add('favorited');
                    }
                    favButton.addEventListener('click', () => toggleFavorite(linkObj.url));

                    li.appendChild(a);
                    li.appendChild(favButton); // Append button to li
                    ul.appendChild(li);
                });
                contentDiv.appendChild(ul);
            } else { // Thumbnail view
                categoryObj.links.forEach(linkObj => {
                    const thumbnailFigure = document.createElement("figure");
                    thumbnailFigure.classList.add("thumbnail-item");

                    const a = document.createElement("a");
                    a.href = linkObj.url;
                    a.target = "_blank";

                    const img = document.createElement("img");
                    img.src = getFaviconUrl(linkObj.url);
                    img.alt = linkObj.name;
                    img.loading = 'lazy';
                    img.onerror = function() {
                        this.src = 'favicon.ico'; // Fallback to local favicon
                    };

                    const figcaption = document.createElement("figcaption");
                    figcaption.textContent = linkObj.name;

                    a.appendChild(img);
                    a.appendChild(figcaption);
                    thumbnailFigure.appendChild(a);

                    const favButton = document.createElement("button");
                    favButton.classList.add('favorite-btn');
                    favButton.innerHTML = '★';
                    if (favorites.includes(linkObj.url)) {
                        favButton.classList.add('favorited');
                    }
                    favButton.addEventListener('click', () => toggleFavorite(linkObj.url));
                    thumbnailFigure.appendChild(favButton); // Append button to figure

                    contentDiv.appendChild(thumbnailFigure);
                });
            }

            section.appendChild(h2);
            section.appendChild(contentDiv);
            mainElement.appendChild(section);
        });

        initializeCollapsibles();
        const searchBar = document.getElementById("search-bar");
        if (searchBar && searchBar.value) {
             handleSearchInput();
        } else {
            document.querySelectorAll("main > section .content").forEach(content => {
                content.style.display = 'none';
            });
            // NOTE: The incorrect 'content.style.display = 'none';' was here and is now removed.
        }
    }

    function initializeCollapsibles() {
        const collapsibles = document.querySelectorAll(".collapsible");
        collapsibles.forEach((collapsible) => {
            // Remove old event listeners by replacing the node
            const newCollapsible = collapsible.cloneNode(true);
            collapsible.parentNode.replaceChild(newCollapsible, collapsible);

            const categoryName = newCollapsible.textContent;
            const content = newCollapsible.nextElementSibling;

            newCollapsible.addEventListener("click", () => {
                if (content) {
                    const isCurrentlyExpanded = content.style.display !== 'none' && content.style.display !== '';
                    if (isCurrentlyExpanded) {
                        content.style.display = 'none';
                        expandedCategories = expandedCategories.filter(cat => cat !== categoryName);
                    } else {
                        content.style.display = currentView === 'thumbnail' ? 'grid' : 'block';
                        if (!expandedCategories.includes(categoryName)) {
                            expandedCategories.push(categoryName);
                        }
                    }
                    saveExpandedCategories();
                }
            });
        });

        // Restore expanded states
        document.querySelectorAll(".collapsible").forEach(coll => {
            const categoryName = coll.textContent;
            const content = coll.nextElementSibling;
            if (content) { // Ensure content element exists
                if (expandedCategories.includes(categoryName)) {
                    content.style.display = currentView === 'thumbnail' ? 'grid' : 'block';
                } else {
                    content.style.display = 'none'; // Default to collapsed
                }
            }
        });
    }


    function updateButtonStates() {
        if (!listViewBtn || !thumbnailViewBtn || !mainElement) return;

        mainElement.classList.remove('thumbnail-categories-active', 'list-categories-active');

        if (currentView === 'list') {
            listViewBtn.classList.add('active');
            thumbnailViewBtn.classList.remove('active');
            mainElement.classList.add('list-categories-active'); // Class for single column sections
        } else {
            thumbnailViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            mainElement.classList.add('thumbnail-categories-active'); // Class for multi-column sections
        }
    }

    if (listViewBtn && thumbnailViewBtn) {
        listViewBtn.addEventListener('click', () => {
            if (currentView !== 'list') {
                currentView = 'list';
                updateButtonStates(); // Update class on main before re-rendering
                generateHTML(allLinksData);
            }
        });

        thumbnailViewBtn.addEventListener('click', () => {
            if (currentView !== 'thumbnail') {
                currentView = 'thumbnail';
                updateButtonStates(); // Update class on main before re-rendering
                generateHTML(allLinksData);
            }
        });
    }

    function handleSearchInput() {
        const searchBar = document.getElementById("search-bar");
        if (!searchBar) return;
        const searchQuery = searchBar.value.toLowerCase();
        const sections = document.querySelectorAll("main > section");

        sections.forEach((section) => {
            const collapsibleHeader = section.querySelector("h2.collapsible");
            const contentElement = collapsibleHeader ? collapsibleHeader.nextElementSibling : null;
            if (!collapsibleHeader || !contentElement) return;

            let hasMatchesInCurrentSection = false;

            const itemsToSearch = currentView === 'list'
                ? contentElement.querySelectorAll("ul > li")
                : contentElement.querySelectorAll(".thumbnail-item");

            itemsToSearch.forEach((item) => {
                const textElement = currentView === 'list' ? item.querySelector("a") : item.querySelector("figcaption");
                if (textElement) {
                    const itemText = textElement.textContent.toLowerCase();
                    if (itemText.includes(searchQuery)) {
                        item.style.display = "";
                        if (currentView === 'thumbnail') item.style.visibility = 'visible';
                        hasMatchesInCurrentSection = true;
                    } else {
                        item.style.display = "none";
                        if (currentView === 'thumbnail') item.style.visibility = 'hidden';
                    }
                }
            });

            if (hasMatchesInCurrentSection) {
                section.style.display = "";
                contentElement.style.display = currentView === 'thumbnail' ? "grid" : "block";
                collapsibleHeader.classList.add('search-match');
            } else {
                if (searchQuery.length > 0) {
                    section.style.display = "none";
                } else {
                    section.style.display = "";
                    contentElement.style.display = "none";
                }
                collapsibleHeader.classList.remove('search-match');
            }
        });

        if (searchQuery === "") {
            sections.forEach(section => {
                section.style.display = "";
                const contentElement = section.querySelector(".content");
                if (contentElement) {
                    contentElement.style.display = "none";
                }
                const collapsibleHeader = section.querySelector("h2.collapsible");
                if (collapsibleHeader) {
                    collapsibleHeader.classList.remove('search-match');
                }
            });
        }
    }

    const searchBar = document.getElementById("search-bar");
    if (searchBar) {
        searchBar.addEventListener("input", handleSearchInput);
    }

    async function initializePage() {
        loadFavorites();
        loadExpandedCategories(); // Load expanded states
        allLinksData = await fetchLinks();
        if (allLinksData.length > 0) {
            allLinksData = sortLinks(allLinksData);
            updateButtonStates(); // Set initial class on main
            generateHTML(allLinksData);
        } else {
            if (mainElement) {
                mainElement.innerHTML = "<p>Could not load link data. Please try again later.</p>";
            }
        }
    }

    initializePage();
});
