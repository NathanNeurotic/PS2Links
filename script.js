
document.addEventListener("DOMContentLoaded", () => {
    const collapsibles = document.querySelectorAll(".collapsible");
    collapsibles.forEach((collapsible) => {
        collapsible.addEventListener("click", () => {
            const content = collapsible.nextElementSibling;
            content.style.display = content.style.display === "block" ? "none" : "block";
        });
    });

    const searchBar = document.getElementById("search-bar");
    searchBar.addEventListener("input", () => {
        const searchQuery = searchBar.value.toLowerCase();
        const sections = document.querySelectorAll("section");

        sections.forEach((section) => {
            const collapsibleHeader = section.querySelector("h2.collapsible");
            if (!collapsibleHeader) return; // Should not happen with current HTML structure

            const contentElement = collapsibleHeader.nextElementSibling;
            if (!contentElement || !contentElement.classList.contains("content")) return; // Should not happen

            const listItems = contentElement.querySelectorAll("ul > li");
            let sectionHasVisibleLinks = false;

            listItems.forEach((listItem) => {
                const link = listItem.querySelector("a");
                if (link) {
                    const linkText = link.textContent.toLowerCase();
                    if (linkText.includes(searchQuery)) {
                        listItem.style.display = ""; // Show list item
                        sectionHasVisibleLinks = true;
                    } else {
                        listItem.style.display = "none"; // Hide list item
                    }
                }
            });

            // Section header (h2) is part of the <section> and always visible by default
            // The section element itself is not hidden anymore.
            // section.style.display = ""; // Ensure section is visible

            if (sectionHasVisibleLinks) {
                contentElement.style.display = "block"; // Show content if links match
            } else {
                contentElement.style.display = "none"; // Hide content if no links match
            }
        });
    });
});
