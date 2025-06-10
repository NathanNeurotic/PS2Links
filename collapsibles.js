import { state, saveExpandedCategories } from './state.js';

export function initializeCollapsibles() {
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach((collapsible) => {
        // Check if an event listener has already been added to this element
        if (collapsible.dataset.listenerAttached === 'true') {
            return; // Skip if listener is already attached
        }

        const categoryName = collapsible.textContent;
        const section = collapsible.parentElement;
        const content = section ? section.querySelector('.content') : null;

        collapsible.addEventListener('click', () => {
            if (content) {
                const isExpanded = content.style.display !== 'none' && content.style.display !== '';
                if (isExpanded) {
                    content.style.display = 'none';
                    collapsible.classList.remove('expanded');
                    collapsible.classList.add('collapsed');
                    state.expandedCategories = state.expandedCategories.filter(cat => cat !== categoryName);
                } else {
                    content.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
                    collapsible.classList.remove('collapsed');
                    collapsible.classList.add('expanded');
                    if (!state.expandedCategories.includes(categoryName)) {
                        state.expandedCategories.push(categoryName);
                    }
                }
                saveExpandedCategories();
            }
        });
        // Mark the element as having an event listener attached
        collapsible.dataset.listenerAttached = 'true';

        // Set initial state
        if (content) {
            if (state.expandedCategories.includes(categoryName)) {
                content.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
                collapsible.classList.add('expanded');
                collapsible.classList.remove('collapsed');
            } else {
                content.style.display = 'none';
                collapsible.classList.add('collapsed');
                collapsible.classList.remove('expanded');
            }
        }
    });
}
