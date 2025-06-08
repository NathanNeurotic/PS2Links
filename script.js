document.addEventListener("DOMContentLoaded", () => {
    let favorites = [];
    let expandedCategories = [];
    let allLinksData = [];
    let currentView = 'list';
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let categoryViewModes = {}; // To store view mode per category

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

    function loadCategoryViewModes() {
        const storedModes = localStorage.getItem('categoryViewModes');
        if (storedModes) {
            try {
                categoryViewModes = JSON.parse(storedModes);
            } catch (e) {
                console.error("Error parsing categoryViewModes from localStorage:", e);
                categoryViewModes = {};
            }
        }
    }

    function saveCategoryViewModes() {
        localStorage.setItem('categoryViewModes', JSON.stringify(categoryViewModes));
    }

    function toggleFavorite(url) {
        const isCurrentlyFavorited = favorites.includes(url);
        const linkObj = getLinkDataByUrl(url);

        if (!linkObj) {
            console.error("Link data not found for URL:", url);
            return;
        }

        if (isCurrentlyFavorited) {
            favorites = favorites.filter(favUrl => favUrl !== url);
        } else {
            favorites.push(url);
        }
        saveFavorites();
        updateFavoriteStars(url, !isCurrentlyFavorited);

        const favContentDiv = document.getElementById("favorites-content");

        if (!isCurrentlyFavorited) { // Item is being favorited
            const favoritesContainer = ensureFavoritesSection(); // Ensures section exists and returns content div
            if (!favoritesContainer.querySelector(`[data-url="${url}"]`)) { // Avoid duplicates if already there
                let newItem;
                if (currentView === 'list') {
                    newItem = createLinkListItem(linkObj, true);
                } else {
                    newItem = createLinkThumbnailItem(linkObj, true);
                }
                favoritesContainer.appendChild(newItem);
            }
            // Sort items in the favorites section
            sortItemsInSection(favoritesContainer, currentView);

            // Ensure the section is visible and collapsible state is correct
            const favSection = document.getElementById("favorites-section");
            if (favSection && favSection.style.display === 'none') {
                favSection.style.display = '';
            }
            const favContent = document.getElementById("favorites-content");
            const favHeader = document.getElementById("favorites-header");
            if (favContent && favHeader && expandedCategories.includes("Favorites") && favContent.style.display === 'none') {
                 favContent.style.display = currentView === 'thumbnail' ? 'grid' : 'block';
            } else if (favContent && favHeader && !expandedCategories.includes("Favorites") && favContent.style.display !== 'none'){
                // If it shouldn't be expanded but is, hide it (respecting search, etc.)
                // This case is less likely if ensureFavoritesSection sets it up right
            }


        } else { // Item is being unfavorited
            if (favContentDiv) {
                const itemToRemove = favContentDiv.querySelector(`[data-url="${url}"]`);
                if (itemToRemove) {
                    itemToRemove.remove();
                }
            }
            removeFavoritesSectionIfEmpty();
        }
    }

    // Helper function to sort items within a section (e.g., favorites)
    function sortItemsInSection(sectionContentElement, viewMode) {
        const items = Array.from(sectionContentElement.children);
        items.sort((a, b) => {
            const nameA = (viewMode === 'list' ? a.querySelector('a').textContent : a.querySelector('figcaption').textContent).trim().toLowerCase();
            const nameB = (viewMode === 'list' ? b.querySelector('a').textContent : b.querySelector('figcaption').textContent).trim().toLowerCase();
            return nameA.localeCompare(nameB);
        });
        // Re-append sorted items
        items.forEach(item => sectionContentElement.appendChild(item));
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

    // Helper function to find link data by URL
    function getLinkDataByUrl(url) {
        for (const category of allLinksData) {
            for (const link of category.links) {
                if (link.url === url) {
                    return link;
                }
            }
        }
        return null; // Should not happen if URL is from a link
    }

    // Helper function to create a list item for a link
    function createLinkListItem(linkObj, isFavorited) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = linkObj.url;
        a.target = "_blank";
        a.setAttribute('data-url', linkObj.url); // For easy selection

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
        if (isFavorited) {
            favButton.classList.add('favorited');
        }
        favButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click on parent <li> if any
            toggleFavorite(linkObj.url);
        });

        li.appendChild(a);
        li.appendChild(favButton);
        return li;
    }

    // Helper function to create a thumbnail item for a link
    function createLinkThumbnailItem(linkObj, isFavorited) {
        const figure = document.createElement("figure");
        figure.classList.add("thumbnail-item");
        figure.setAttribute('data-url', linkObj.url); // For easy selection

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
        figure.appendChild(a);

        const favButton = document.createElement("button");
        favButton.classList.add('favorite-btn');
        favButton.innerHTML = '★';
        if (isFavorited) {
            favButton.classList.add('favorited');
        }
        favButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click on parent <figure> if any
            toggleFavorite(linkObj.url);
        });
        figure.appendChild(favButton);
        return figure;
    }

    // Helper to ensure the favorites section exists and returns its content div
    function ensureFavoritesSection() {
        let favSection = document.getElementById("favorites-section");
        if (!favSection) {
            favSection = document.createElement("section");
            favSection.id = "favorites-section";

            const favH2 = document.createElement("h2");
            favH2.id = "favorites-header";
            favH2.classList.add("collapsible");
            favH2.textContent = "Favorites";
            // Make it collapsible
            favH2.addEventListener("click", () => {
                 const content = favH2.nextElementSibling;
                 if (content) {
                    const isCurrentlyExpanded = content.style.display !== 'none' && content.style.display !== '';
                    if (isCurrentlyExpanded) {
                        content.style.display = 'none';
                        expandedCategories = expandedCategories.filter(cat => cat !== "Favorites");
                    } else {
                        content.style.display = currentView === 'thumbnail' ? 'grid' : 'block';
                        if (!expandedCategories.includes("Favorites")) {
                            expandedCategories.push("Favorites");
                        }
                    }
                    saveExpandedCategories();
                }
            });


            const favContentDiv = document.createElement("div");
            favContentDiv.id = "favorites-content";
            favContentDiv.classList.add("content", currentView === 'list' ? 'list-view' : 'thumbnail-view');

            // Determine if it should be expanded by default
            if (expandedCategories.includes("Favorites")) {
                favContentDiv.style.display = currentView === 'thumbnail' ? 'grid' : 'block';
            } else {
                favContentDiv.style.display = 'none';
            }

            favSection.appendChild(favH2);
            favSection.appendChild(favContentDiv);

            // Insert before the first category section or at the end of main if no categories
            const firstCategorySection = mainElement.querySelector("section:not(#favorites-section)");
            if (firstCategorySection) {
                mainElement.insertBefore(favSection, firstCategorySection);
            } else {
                mainElement.appendChild(favSection);
            }
            initializeCollapsibles(); // Re-init for the new section
        }
        return document.getElementById("favorites-content");
    }

    // Helper to remove the favorites section if it's empty
    function removeFavoritesSectionIfEmpty() {
        const favSection = document.getElementById("favorites-section");
        if (favSection && favorites.length === 0) {
            favSection.remove();
            // Remove "Favorites" from expandedCategories if it's there
            const favIndex = expandedCategories.indexOf("Favorites");
            if (favIndex > -1) {
                expandedCategories.splice(favIndex, 1);
                saveExpandedCategories();
            }
        }
    }

    // Helper to update all favorite star icons for a given URL
    function updateFavoriteStars(url, isFavorited) {
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
            favSection.id = "favorites-section"; // ID for the section
            const favH2 = document.createElement("h2");
            favH2.id = "favorites-header"; // ID for the header
            favH2.classList.add("collapsible");
            favH2.textContent = "Favorites";

            const favContentDiv = document.createElement("div");
            favContentDiv.classList.add("content");
            favContentDiv.classList.add(currentView === 'list' ? 'list-view' : 'thumbnail-view');
            // Assign an ID to the content div for easier access
            favContentDiv.id = "favorites-content";


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
                    // Use helper to create list item
                    const listItem = createLinkListItem(linkObj, true); // True because it's in favorites
                    ul.appendChild(listItem);
                });
                favContentDiv.appendChild(ul);
            } else { // Thumbnail view
                favoriteLinks.forEach(linkObj => {
                    // Use helper to create thumbnail item
                    const thumbnailItem = createLinkThumbnailItem(linkObj, true); // True because it's in favorites
                    favContentDiv.appendChild(thumbnailItem);
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

            // --- Category-specific View Toggle Buttons ---
            const categoryName = categoryObj.category;
            let categoryCurrentView = categoryViewModes[categoryName] || currentView; // Default to global
            if (!categoryViewModes[categoryName]) { // Ensure it's set for next time if it was default
                categoryViewModes[categoryName] = categoryCurrentView;
            }

            const catToggleContainer = document.createElement("div");
            catToggleContainer.classList.add("category-view-toggle");

            const listBtn = document.createElement("button");
            listBtn.textContent = "List";
            listBtn.classList.add("category-view-btn", "list-cat-btn");
            listBtn.dataset.category = categoryName;
            listBtn.dataset.view = "list";
            if (categoryCurrentView === 'list') listBtn.classList.add("active");

            const thumbBtn = document.createElement("button");
            thumbBtn.textContent = "Thumbnail";
            thumbBtn.classList.add("category-view-btn", "thumb-cat-btn");
            thumbBtn.dataset.category = categoryName;
            thumbBtn.dataset.view = "thumbnail";
            if (categoryCurrentView === 'thumbnail') thumbBtn.classList.add("active");

            catToggleContainer.appendChild(listBtn);
            catToggleContainer.appendChild(thumbBtn);
            // -----------------------------------------

            const contentDiv = document.createElement("div");
            contentDiv.classList.add("content");
            // Apply view class based on this category's specific view mode
            contentDiv.classList.add(categoryCurrentView === 'list' ? 'list-view' : 'thumbnail-view');
            contentDiv.dataset.categoryName = categoryName; // For easier selection later

            // Prepend toggle buttons to content, but they should appear above items.
            // So, section will have h2, then catToggleContainer, then contentDiv
            // This means contentDiv should not be prepended to, but rather the container inserted before contentDiv.
            // The current structure is: section -> h2, section -> contentDiv.
            // We want: section -> h2, section -> catToggleContainer, section -> contentDiv.
            // So, after creating h2, and before creating contentDiv, would be ideal for catToggleContainer.
            // Let's adjust: insert catToggleContainer after h2.

            if (categoryCurrentView === 'list') {
                const ul = document.createElement("ul");
                categoryObj.links.forEach(linkObj => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = linkObj.url;
                    a.target = "_blank";

                    // Use helper to create list item
                    const listItem = createLinkListItem(linkObj, favorites.includes(linkObj.url));
                    ul.appendChild(listItem);
                });
                contentDiv.appendChild(ul);
            } else { // Thumbnail view
                categoryObj.links.forEach(linkObj => {
                    // Use helper to create thumbnail item
                    const thumbnailItem = createLinkThumbnailItem(linkObj, favorites.includes(linkObj.url));
                    contentDiv.appendChild(thumbnailItem);
                });
            }

            section.appendChild(h2);
            // Insert the category toggle buttons container right after the h2
            section.appendChild(catToggleContainer);
            section.appendChild(contentDiv);
            mainElement.appendChild(section);

            // Add event listeners for these new buttons
            listBtn.addEventListener('click', handleCategoryViewToggle);
            thumbBtn.addEventListener('click', handleCategoryViewToggle);
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
                // Update all category views to the new global view
                for (const categoryName in categoryViewModes) {
                    categoryViewModes[categoryName] = currentView;
                }
                saveCategoryViewModes();
                updateButtonStates();
                generateHTML(allLinksData); // Re-render all
            }
        });

        thumbnailViewBtn.addEventListener('click', () => {
            if (currentView !== 'thumbnail') {
                currentView = 'thumbnail';
                 // Update all category views to the new global view
                for (const categoryName in categoryViewModes) {
                    categoryViewModes[categoryName] = currentView;
                }
                saveCategoryViewModes();
                updateButtonStates();
                generateHTML(allLinksData); // Re-render all
            }
        });
    }

    // Function to handle category-specific view toggling
    function handleCategoryViewToggle(event) {
        const button = event.currentTarget;
        const categoryName = button.dataset.category;
        const newView = button.dataset.view;

        categoryViewModes[categoryName] = newView;
        saveCategoryViewModes();

        // Update active state for this category's buttons
        const toggleContainer = button.parentElement;
        toggleContainer.querySelectorAll('.category-view-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Re-render content for this specific category
        const sectionElement = toggleContainer.closest('section');
        const contentDiv = sectionElement.querySelector('.content');
        contentDiv.innerHTML = ''; // Clear current content

        contentDiv.classList.remove('list-view', 'thumbnail-view');
        contentDiv.classList.add(newView === 'list' ? 'list-view' : 'thumbnail-view');

        // Find the category object
        const categoryObj = allLinksData.find(cat => cat.category === categoryName);
        if (!categoryObj) return;

        if (newView === 'list') {
            const ul = document.createElement("ul");
            categoryObj.links.forEach(linkObj => {
                const listItem = createLinkListItem(linkObj, favorites.includes(linkObj.url));
                ul.appendChild(listItem);
            });
            contentDiv.appendChild(ul);
        } else { // Thumbnail view
            categoryObj.links.forEach(linkObj => {
                const thumbnailItem = createLinkThumbnailItem(linkObj, favorites.includes(linkObj.url));
                contentDiv.appendChild(thumbnailItem);
            });
        }
        // Collapsible state might need to be re-evaluated if content height changes drastically
        // but typically content is revealed/hidden by initializeCollapsibles or direct click.
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
        loadCategoryViewModes(); // Load category view modes
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
