import { state, saveExpandedCategories } from './state.js';

export function initializeCollapsibles() {
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach((collapsible) => {
        const newCollapsible = collapsible.cloneNode(true);
        collapsible.parentNode.replaceChild(newCollapsible, collapsible);

        const categoryName = newCollapsible.textContent;
        const section = newCollapsible.parentElement;
        const content = section ? section.querySelector('.content') : null;

        newCollapsible.addEventListener('click', () => {
            if (content) {
                const isExpanded = content.style.display !== 'none' && content.style.display !== '';
                if (isExpanded) {
                    content.style.display = 'none';
                    state.expandedCategories = state.expandedCategories.filter(cat => cat !== categoryName);
                } else {
                    content.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
                    if (!state.expandedCategories.includes(categoryName)) {
                        state.expandedCategories.push(categoryName);
                    }
                }
                saveExpandedCategories();
            }
        });
    });

    document.querySelectorAll('.collapsible').forEach(coll => {
        const categoryName = coll.textContent;
        const section = coll.parentElement;
        const content = section ? section.querySelector('.content') : null;
        if (content) {
            if (state.expandedCategories.includes(categoryName)) {
                content.style.display = state.currentView === 'thumbnail' ? 'grid' : 'block';
            } else {
                content.style.display = 'none';
            }
        }
    });
}
