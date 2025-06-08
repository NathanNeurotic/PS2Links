document.addEventListener("DOMContentLoaded", () => {
    let allLinksData = [];
    let currentView = 'list';
    let currentTheme = localStorage.getItem('theme') || 'dark';

    const listViewBtn = document.getElementById('list-view-btn');
    const thumbnailViewBtn = document.getElementById('thumbnail-view-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mainElement = document.querySelector("main");

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
        const mainElement = document.querySelector("main");
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
            // contentDiv.style.display = "none"; // Collapsed by default - search will manage this

            if (currentView === 'list') {
                const ul = document.createElement("ul");
                categoryObj.links.forEach(linkObj => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = linkObj.url;
                    a.textContent = linkObj.name;
                    a.target = "_blank";
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
                    img.src = linkObj.thumbnailUrl || 'https://via.placeholder.com/120x80?text=No+Image';
                    img.alt = linkObj.name;
                    img.loading = 'lazy';

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
        // Call search explicitly after HTML generation to ensure correct display
        const searchBar = document.getElementById("search-bar");
        if (searchBar && searchBar.value) { // If there's an active search term
             handleSearchInput(); // Re-apply search filtering
        } else { // If no search term, ensure sections are collapsed by default
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
                    const isSearchActive = document.getElementById("search-bar") && document.getElementById("search-bar").value.length > 0;
                    // Do not toggle if a search is active and the section is shown due to search match.
                    // Let search handle visibility in this case.
                    // However, if search is NOT active, or if search IS active but this section was NOT a match (so it's hidden by search), then allow toggle.
                    // A simpler approach: always allow toggle, but ensure search re-evaluates if content becomes visible.
                    content.style.display = content.style.display === "block" ? "none" : "block";
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
=======
        if (!listViewBtn || !thumbnailViewBtn) return;
        if (currentView === 'list') {
            listViewBtn.classList.add('active');
            thumbnailViewBtn.classList.remove('active');
        } else {
            thumbnailViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        }
    }

    if (listViewBtn && thumbnailViewBtn) {
        listViewBtn.addEventListener('click', () => {
            if (currentView !== 'list') {
                currentView = 'list';
                updateButtonStates(); // Update class on main before re-rendering
                generateHTML(allLinksData);
                generateHTML(allLinksData);
                updateButtonStates();
                // handleSearch(); // Search listener is persistent now
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

                generateHTML(allLinksData);
                updateButtonStates();
                // handleSearch();
            }
        });
    }

    // This function is called when search input changes
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
                const linkElement = currentView === 'list' ? item.querySelector("a") : item.querySelector("figcaption");
                if (linkElement) {
                    const linkText = linkElement.textContent.toLowerCase();
                    if (linkText.includes(searchQuery)) {
                        item.style.display = ""; // Show item
                        if (currentView === 'thumbnail') item.style.visibility = 'visible'; // Ensure visibility for grid items
                        hasMatchesInCurrentSection = true;
                    } else {
                        item.style.display = "none";
                        if (currentView === 'thumbnail') item.style.visibility = 'hidden';// Hide for grid items
                    }
                }
            });

            if (hasMatchesInCurrentSection) {
                section.style.display = "";
                contentElement.style.display = currentView === 'thumbnail' ? "grid" : "block";
                contentElement.style.display = currentView === 'thumbnail' ? "grid" : "block"; // Ensure correct display for view
                collapsibleHeader.classList.add('search-match');
            } else {
                if (searchQuery.length > 0) {
                    section.style.display = "none";
                } else {
                    section.style.display = "";
                    contentElement.style.display = "none";
                    contentElement.style.display = "none"; // Collapse if no search query and no match
                }
                collapsibleHeader.classList.remove('search-match');
            }
        });

        if (searchQuery === "") {
        if (searchQuery === "") { // If search is cleared
            sections.forEach(section => {
                section.style.display = "";
                const contentElement = section.querySelector(".content");
                if (contentElement) {
                    contentElement.style.display = "none";
                    contentElement.style.display = "none"; // Collapse all
                }
                const collapsibleHeader = section.querySelector("h2.collapsible");
                if (collapsibleHeader) {
                    collapsibleHeader.classList.remove('search-match');
                }
            });
        }
    }

    // Attach search listener once
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
            generateHTML(allLinksData); // Initial render
            updateButtonStates();
            // Search event listener is already attached, no need to call handleSearch() directly here for init
        } else {
            const mainElement = document.querySelector("main");
            if (mainElement) {
                mainElement.innerHTML = "<p>Could not load link data. Please try again later.</p>";
            }
        }
    }

    initializePage();
});
