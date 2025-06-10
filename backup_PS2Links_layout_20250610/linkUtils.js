export function getFaviconUrl(url) {
    try {
        const urlObject = new URL(url);
        return `${urlObject.protocol}//${urlObject.hostname}/favicon.ico`;
    } catch (error) {
        console.error('Invalid URL:', error);
        return 'favicon.ico';
    }
}

export function createLinkItem(linkObj, isFavorited, toggleFavorite, type) {
    const element = type === 'list' ? document.createElement('li') : document.createElement('figure');
    element.setAttribute('data-url', linkObj.url);
    if (type === 'thumbnail') {
        element.classList.add('thumbnail-item');
    }

    const a = document.createElement('a');
    a.href = linkObj.url;
    a.target = '_blank';

    const img = document.createElement('img');
    img.src = getFaviconUrl(linkObj.url);
    img.alt = type === 'list' ? '' : linkObj.name;
    img.loading = 'lazy';
    img.onerror = function() { this.src = 'favicon.ico'; };

    if (type === 'list') {
        img.classList.add('list-view-favicon');
        a.prepend(img);
        const textNode = document.createTextNode(' ' + linkObj.name);
        a.appendChild(textNode);
    } else {
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = linkObj.name;
        a.appendChild(img);
        a.appendChild(figcaption);

        const websiteSpan = document.createElement('span');
        websiteSpan.classList.add('thumbnail-website');
        websiteSpan.textContent = linkObj.url;
        a.appendChild(websiteSpan);
    }

    element.appendChild(a);

    const favButton = document.createElement('button');
    favButton.classList.add('favorite-btn');
    favButton.innerHTML = '★';
    if (isFavorited) {
        favButton.classList.add('favorited');
    }
    favButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(linkObj.url);
    });
    element.appendChild(favButton);

    return element;
}

// Added functions (originally from favorites.js)
// import { state } from './state.js'; // REMOVED - state.allLinksData is now passed as a parameter

export function getLinkDataByUrl(url, allLinksData) { // Added allLinksData parameter
    // Guard against allLinksData being undefined or null
    if (!allLinksData) {
        console.warn("getLinkDataByUrl called with null or undefined allLinksData.");
        return null;
    }
    for (const category of allLinksData) { // Use allLinksData parameter
        // Guard against category.links being undefined or null
        if (!category.links) continue;
        for (const link of category.links) {
            if (link.url === url) {
                return link;
            }
        }
    }
    return null;
}

export function sortItemsInSection(sectionContentElement, viewMode) {
    // Guard against sectionContentElement or its children being null/undefined
    if (!sectionContentElement || !sectionContentElement.children) {
        console.warn("sortItemsInSection called with invalid sectionContentElement.");
        return;
    }
    const items = Array.from(sectionContentElement.children);
    items.sort((a, b) => {
        let nameA = '';
        let nameB = '';

        try {
            if (viewMode === 'list') {
                const aLink = a.querySelector('a');
                // Ensure textContent is not null and gracefully handle missing img alt
                nameA = aLink && aLink.textContent ? (aLink.textContent.replace(aLink.querySelector('img') ? (aLink.querySelector('img').alt || '') : '', '')).trim().toLowerCase() : '';
                const bLink = b.querySelector('a');
                nameB = bLink && bLink.textContent ? (bLink.textContent.replace(bLink.querySelector('img') ? (bLink.querySelector('img').alt || '') : '', '')).trim().toLowerCase() : '';
            } else { // thumbnail view
                const aFigcaption = a.querySelector('figcaption');
                nameA = aFigcaption && aFigcaption.textContent ? aFigcaption.textContent.trim().toLowerCase() : '';
                const bFigcaption = b.querySelector('figcaption');
                nameB = bFigcaption && bFigcaption.textContent ? bFigcaption.textContent.trim().toLowerCase() : '';
            }
        } catch (e) {
            console.error("Error accessing properties for sorting in sortItemsInSection:", e, "Item A:", a, "Item B:", b);
            // Default to empty strings if error occurs, preventing further crashes
        }

        return nameA.localeCompare(nameB);
    });
    items.forEach(item => sectionContentElement.appendChild(item));
}
