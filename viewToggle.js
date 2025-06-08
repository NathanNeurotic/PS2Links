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

    if (newView === 'list') {
        const ul = document.createElement('ul');
        categoryObj.links.forEach(linkObj => {
            const li = createListItem(linkObj, favorites.includes(linkObj.url));
            ul.appendChild(li);
        });
        contentDiv.appendChild(ul);
    } else {
        categoryObj.links.forEach(linkObj => {
            const fig = createThumbItem(linkObj, favorites.includes(linkObj.url));
            contentDiv.appendChild(fig);
        });
    }
}
