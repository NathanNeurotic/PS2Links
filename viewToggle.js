import { state, saveCategoryViewModes } from './state.js';

export function updateButtonStates(listViewBtn, thumbnailViewBtn, mainElement) {
    if (!listViewBtn || !thumbnailViewBtn || !mainElement) return;

    mainElement.classList.remove('thumbnail-categories-active', 'list-categories-active');

    if (state.currentView === 'list') {
        listViewBtn.classList.add('active');
        thumbnailViewBtn.classList.remove('active');
        mainElement.classList.add('list-categories-active');
    } else {
        thumbnailViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        mainElement.classList.add('thumbnail-categories-active');
    }
}

export function handleCategoryViewToggle(event, allLinksData, favorites, createListItem, createThumbItem) {
    const button = event.currentTarget;
    const categoryName = button.dataset.category;
    const newView = button.dataset.view;

    state.categoryViewModes[categoryName] = newView;
    saveCategoryViewModes();

    const toggleContainer = button.parentElement;
    toggleContainer.querySelectorAll('.category-view-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const sectionElement = toggleContainer.closest('section');
    const contentDiv = sectionElement.querySelector('.content');
    contentDiv.innerHTML = '';

    contentDiv.classList.remove('list-view', 'thumbnail-view');
    contentDiv.classList.add(newView === 'list' ? 'list-view' : 'thumbnail-view');

    const categoryObj = allLinksData.find(cat => cat.category === categoryName);
    if (!categoryObj) return;

    populateCategoryContent(contentDiv, categoryObj, newView, favorites, createListItem, createThumbItem);
}

// Helper function to populate category content (used by handleCategoryViewToggle)
function populateCategoryContent(contentDiv, categoryObj, viewMode, favorites, createListItem, createThumbItem) {
    contentDiv.innerHTML = ''; // Clear existing content first

    if (viewMode === 'list') {
        const ul = document.createElement('ul');
        categoryObj.links.forEach(linkObj => {
            // Ensure 'favorites' is an array, typically state.favorites
            const isFavorited = favorites.includes(linkObj.url);
            const listItem = createListItem(linkObj, isFavorited);
            ul.appendChild(listItem);
        });
        contentDiv.appendChild(ul);
    } else { // 'thumbnail' view
        categoryObj.links.forEach(linkObj => {
            const isFavorited = favorites.includes(linkObj.url);
            const thumbnailItem = createThumbItem(linkObj, isFavorited);
            contentDiv.appendChild(thumbnailItem);
        });
    }
}
