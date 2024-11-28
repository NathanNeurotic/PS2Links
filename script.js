
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
        const links = document.querySelectorAll("a");
        links.forEach((link) => {
            const linkText = link.textContent.toLowerCase();
            if (linkText.includes(searchQuery)) {
                link.style.display = "block";
            } else {
                link.style.display = "none";
            }
        });
    });
});
