document.addEventListener("DOMContentLoaded", () => {
    let allLinksData = [];
    let currentView = 'list';
    let currentTheme = localStorage.getItem('theme') || 'dark';

    const listViewBtn = document.getElementById('list-view-btn');
    const thumbnailViewBtn = document.getElementById('thumbnail-view-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mainElement = document.querySelector("main");

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

        data.forEach(categoryObj => {
            const section = document.createElement("section");
            // section.classList.add("category-section"); // Add a common class for styling sections if needed
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

                    // Then add the text. We need to create a text node for proper spacing.
                    const textNode = document.createTextNode(" " + linkObj.name); // Add a space before the name
                    a.appendChild(textNode);

                    li.appendChild(a);
                    ul.appendChild(li);
                });
                contentDiv.appendChild(ul);
            } else {
                categoryObj.links.forEach(linkObj => {
                    const thumbnailFigure = document.createElement("figure");
                    thumbnailFigure.classList.add("thumbnail-item");

                    const a = document.createElement("a");
                    a.href = linkObj.url;
                    a.target = "_blank";

                    const img = document.createElement("img");
                    // Use getFaviconUrl and add onerror fallback
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
        }
    }

    function initializeCollapsibles() {
        const collapsibles = document.querySelectorAll(".collapsible");
        collapsibles.forEach((collapsible) => {
            const newCollapsible = collapsible.cloneNode(true);
            collapsible.parentNode.replaceChild(newCollapsible, collapsible);

            newCollapsible.addEventListener("click", () => {
                const content = newCollapsible.nextElementSibling;
                if (content) {
                    if (content.style.display === 'none' || content.style.display === '') {
                        // When expanding, choose display based on currentView
                        content.style.display = currentView === 'thumbnail' ? 'grid' : 'block';
                    } else {
                        // When collapsing, always set to none
                        content.style.display = 'none';
                    }
                }
            });
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
