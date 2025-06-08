export function getFaviconUrl(url) {
    try {
        const urlObject = new URL(url);
        return `${urlObject.protocol}//${urlObject.hostname}/favicon.ico`;
    } catch (error) {
        console.error('Invalid URL:', error);
        return 'favicon.ico';
    }
}

export function createLinkListItem(linkObj, isFavorited, toggleFavorite) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = linkObj.url;
    a.target = '_blank';
    a.setAttribute('data-url', linkObj.url);

    const img = document.createElement('img');
    img.src = getFaviconUrl(linkObj.url);
    img.alt = '';
    img.loading = 'lazy';
    img.onerror = function() { this.src = 'favicon.ico'; };
    img.classList.add('list-view-favicon');
    a.prepend(img);

    const textNode = document.createTextNode(' ' + linkObj.name);
    a.appendChild(textNode);

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

    li.appendChild(a);
    li.appendChild(favButton);
    return li;
}

export function createLinkThumbnailItem(linkObj, isFavorited, toggleFavorite) {
    const figure = document.createElement('figure');
    figure.classList.add('thumbnail-item');
    figure.setAttribute('data-url', linkObj.url);

    const a = document.createElement('a');
    a.href = linkObj.url;
    a.target = '_blank';

    const img = document.createElement('img');
    img.src = getFaviconUrl(linkObj.url);
    img.alt = linkObj.name;
    img.loading = 'lazy';
    img.onerror = function() { this.src = 'favicon.ico'; };

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = linkObj.name;

    a.appendChild(img);
    a.appendChild(figcaption);
    figure.appendChild(a);

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
    figure.appendChild(favButton);
    return figure;
}
