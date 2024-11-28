
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
            const links = section.querySelectorAll("a");
            let sectionVisible = false;
            links.forEach((link) => {
                const linkText = link.textContent.toLowerCase();
                if (linkText.includes(searchQuery)) {
                    link.style.display = "block";
                    sectionVisible = true;
                } else {
                    link.style.display = "none";
                }
            });
            // Show or hide the section based on search results
            section.style.display = sectionVisible ? "block" : "none";
        });
    });
});
