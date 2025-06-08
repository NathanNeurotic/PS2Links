import { state } from './state.js';

export function handleSearchInput() {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar) return;
    const searchQuery = searchBar.value.toLowerCase();
    const sections = document.querySelectorAll('main > section');

    sections.forEach((section) => {
        const collapsibleHeader = section.querySelector('h2.collapsible');
        const contentElement = section.querySelector('.content');
        if (!collapsibleHeader || !contentElement) return;

        let hasMatches = false;
        const items = state.currentView === 'list'
            ? contentElement.querySelectorAll('ul > li')
            : contentElement.querySelectorAll('.thumbnail-item');

        items.forEach((item) => {
            const textElement = state.currentView === 'list' ? item.querySelector('a') : item.querySelector('figcaption');
            if (textElement) {
                const itemText = textElement.textContent.toLowerCase();
                if (itemText.includes(searchQuery)) {
                    item.style.display = '';
                    if (state.currentView === 'thumbnail') item.style.visibility = 'visible';
                    hasMatches = true;
                } else {
                    item.style.display = 'none';
                    if (state.currentView === 'thumbnail') item.style.visibility = 'hidden';
                }
            }
        });

        if (hasMatches) {
            section.style.display = '';
            contentElement.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
            collapsibleHeader.classList.add('search-match');
        } else {
            if (searchQuery.length > 0) {
                section.style.display = 'none';
            } else {
                section.style.display = '';
                contentElement.style.display = 'none';
            }
            collapsibleHeader.classList.remove('search-match');
        }
    });

    if (searchQuery === '') {
        sections.forEach(section => {
            section.style.display = '';
            const contentElement = section.querySelector('.content');
            if (contentElement) {
                contentElement.style.display = 'none';
            }
            const collapsibleHeader = section.querySelector('h2.collapsible');
            if (collapsibleHeader) {
                collapsibleHeader.classList.remove('search-match');
            }
        });
    }
}
