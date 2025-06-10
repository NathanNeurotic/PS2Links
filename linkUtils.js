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
