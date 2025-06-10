import { state } from './state.js';
import { initializeCollapsibles } from './collapsibles.js';

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
                    item.style.display = ''; // Show item
                    hasMatches = true;
                } else {
                    item.style.display = 'none'; // Hide item
                }
            }
        });

        // Update section visibility based on matches
        if (hasMatches) {
            section.style.display = ''; // Show section
            // Ensure content area is visible; display type depends on the view mode.
            contentElement.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
            collapsibleHeader.classList.add('search-match'); // Mark header for styling
        } else {
            if (searchQuery.length > 0) {
                section.style.display = 'none'; // Hide section if no matches and search is active
            } else {
                // If search is empty, ensure section is visible but content is handled by collapsibles
                section.style.display = '';
                contentElement.style.display = 'none'; // Initially hide content; collapsibles will manage it
            }
            collapsibleHeader.classList.remove('search-match');
        }
    });

    // If the search query is empty, reset all sections to their default state
    if (searchQuery === '') {
        sections.forEach(section => {
            section.style.display = ''; // Ensure section is visible
            const contentElement = section.querySelector('.content');
            if (contentElement) {
                // Hide content; initializeCollapsibles will restore based on expanded/collapsed state
                contentElement.style.display = 'none';
            }
            const collapsibleHeader = section.querySelector('h2.collapsible');
            if (collapsibleHeader) {
                collapsibleHeader.classList.remove('search-match');
            }
        });
        // Re-initialize collapsibles to apply original expanded/collapsed states
        initializeCollapsibles();
    }
}
