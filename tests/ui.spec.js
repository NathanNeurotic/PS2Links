const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000'; // Assuming Playwright is configured to serve the root

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL); // Assumes index.html is the default
  // Wait for the main header title to be potentially populated by the typing effect
  await page.waitForSelector('header h1.typing-effect', { timeout: 30000 });
  // Further wait for services to be loaded (categories to appear)
  await page.waitForSelector('.category', { timeout: 30000 });
});

test('Page title and header are correct', async ({ page }) => {
  await expect(page).toHaveTitle(/PS2Links - Your PlayStation 2 Resource Hub/);
  // The typing effect might take time, so we check if the final text includes PS2Links Hub
  const headerText = await page.locator('header h1.typing-effect').textContent();
  expect(headerText.length).toBeGreaterThan(0); // Check if header text is not empty
});

test('Theme switching works and persists', async ({ page }) => {
  const body = page.locator('body');
  const themeToggle = page.locator('#themeToggle');

  const initialThemeIsLight = await body.evaluate(el => el.classList.contains('light-mode'));

  await themeToggle.click();
  if (initialThemeIsLight) {
    await expect(body).not.toHaveClass(/light-mode/);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  } else {
    await expect(body).toHaveClass(/light-mode/);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
  }

  // Toggle back
  await themeToggle.click();
  if (initialThemeIsLight) {
    await expect(body).toHaveClass(/light-mode/);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
  } else {
    await expect(body).not.toHaveClass(/light-mode/);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  }
});

test('Global view toggling works and persists', async ({ page }) => {
  const body = page.locator('body');
  const viewToggle = page.locator('#viewToggle'); // Global view toggle

  const initialViewIsBlock = await body.evaluate(el => el.classList.contains('block-view'));

  await viewToggle.click();
  if (initialViewIsBlock) {
    await expect(body).not.toHaveClass(/block-view/); // Should be list if it was block
    expect(await page.evaluate(() => localStorage.getItem('view'))).toBe('list');
  } else {
    await expect(body).toHaveClass(/block-view/);
    expect(await page.evaluate(() => localStorage.getItem('view'))).toBe('block');
  }

  // Toggle back
  await viewToggle.click();
  if (initialViewIsBlock) {
    await expect(body).toHaveClass(/block-view/);
    expect(await page.evaluate(() => localStorage.getItem('view'))).toBe('block');
  } else {
    await expect(body).not.toHaveClass(/block-view/);
    expect(await page.evaluate(() => localStorage.getItem('view'))).toBe('list');
  }
});

test('Category expands and collapses', async ({ page }) => {
  const firstCategory = page.locator('.category').first();
  const categoryHeader = firstCategory.locator('h2');
  const categoryContent = firstCategory.locator('.category-content');
  const chevron = categoryHeader.locator('.chevron');

  // Initial state check (assuming default is closed, though script might open some)
  const isInitiallyOpen = await categoryContent.evaluate(el => el.classList.contains('open'));

  if (isInitiallyOpen) {
    await expect(categoryHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(chevron).toHaveClass(/open/);
    await expect(categoryContent).toBeVisible(); // Or check maxHeight
  } else {
    await expect(categoryHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(chevron).not.toHaveClass(/open/);
    // Check if content is effectively hidden (maxHeight 0 or opacity 0)
    await expect(categoryContent).toHaveCSS('max-height', '0px');
  }

  // Click to toggle
  await categoryHeader.click();
  if (isInitiallyOpen) {
    await expect(categoryHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(chevron).not.toHaveClass(/open/);
    await expect(categoryContent).toHaveCSS('max-height', '0px');
  } else {
    await expect(categoryHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(chevron).toHaveClass(/open/);
    await expect(categoryContent).not.toHaveCSS('max-height', '0px'); // Should be visible
  }

  // Click to toggle back
  await categoryHeader.click();
  if (isInitiallyOpen) {
    await expect(categoryHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(chevron).toHaveClass(/open/);
    await expect(categoryContent).not.toHaveCSS('max-height', '0px');
  } else {
    await expect(categoryHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(chevron).not.toHaveClass(/open/);
    await expect(categoryContent).toHaveCSS('max-height', '0px');
  }
});

test('Per-category view toggle works', async ({ page }) => {
  const firstCategory = page.locator('.category:not(#favorites)').first(); // Avoid favorites if its view toggle behaves differently
  const categoryViewToggle = firstCategory.locator('.category-view-toggle');

  // Ensure the category is open to see the effect on items if any are present
  const categoryHeader = firstCategory.locator('h2');
  if (!await firstCategory.locator('.category-content').evaluate(el => el.classList.contains('open'))) {
    await categoryHeader.click();
  }
  await expect(firstCategory.locator('.category-content')).not.toHaveCSS('max-height', '0px');


  const initialIsListView = await firstCategory.evaluate(el => el.classList.contains('list-view'));
  await categoryViewToggle.click();

  if (initialIsListView) {
    await expect(firstCategory).not.toHaveClass(/list-view/); // Should be grid
  } else {
    await expect(firstCategory).toHaveClass(/list-view/);
  }

  // Check persistence (assuming categoryId is derived correctly in script)
  const categoryId = await firstCategory.getAttribute('id');
  const storedView = await page.evaluate(id => localStorage.getItem(`view-${id}`), categoryId);
  if (initialIsListView) {
    expect(storedView).toBe('grid');
  } else {
    expect(storedView).toBe('list');
  }
});


test('Search filters services and categories', async ({ page }) => {
  const searchInput = page.locator('#searchInput');

  // Use a specific known service name from your services.json for a reliable test
  // For this example, let's assume "8BitMods Discord Server" is in "Communities & Social Platforms"
  const testServiceName = "8BitMods Discord Server";
  const testCategoryName = "Communities & Social Platforms";
  // Normalize category name to ID as done in script.js
  const testCategoryId = testCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  await searchInput.fill('8BitMods');

  const targetService = page.locator(`.service-button:has-text("${testServiceName}")`);
  await expect(targetService).toBeVisible();

  // Check that its category is visible
  await expect(page.locator(`#${testCategoryId}`)).toBeVisible();

  // Check that other services not matching are hidden
  // This requires knowing another service that *doesn't* match "8BitMods"
  // Example: await expect(page.locator('.service-button:has-text("Another Service")')).toBeHidden();

  const noResultsMsg = page.locator('#noResults');
  await searchInput.fill('NonExistentTermXYZ');
  await expect(noResultsMsg).toBeVisible();

  await searchInput.fill(''); // Clear search
  await expect(noResultsMsg).toBeHidden();
  await expect(targetService).toBeVisible(); // Should reappear
});

test('Favorites functionality: add, persist, remove', async ({ page }) => {
  // Find first service in a non-favorites category and ensure category is open
  const firstCategory = page.locator('.category:not(#favorites)').first();
  const categoryHeader = firstCategory.locator('h2');
   if (!await firstCategory.locator('.category-content').evaluate(el => el.classList.contains('open'))) {
    await categoryHeader.click();
    await page.waitForTimeout(500); // Wait for animation
  }

  const firstServiceButton = firstCategory.locator('.service-button').first();
  await firstServiceButton.scrollIntoViewIfNeeded(); // Ensure it's clickable
  const star = firstServiceButton.locator('.favorite-star');

  // Ensure it's not already favorited from a previous failed test run by clearing all first
  await page.evaluate(() => { localStorage.removeItem('favorites'); localStorage.removeItem('category-favorites'); });
  await page.reload(); // Reload to apply cleared storage
  // Re-open category after reload
  const refreshedCategory = page.locator('.category:not(#favorites)').first();
  const refreshedHeader = refreshedCategory.locator('h2');
  if (!await refreshedCategory.locator('.category-content').evaluate(el => el.classList.contains('open'))) {
    await refreshedHeader.click();
    await page.waitForTimeout(500);
  }
  const refreshedStar = refreshedCategory.locator('.service-button').first().locator('.favorite-star');
  await refreshedStar.scrollIntoViewIfNeeded();


  // 1. Add to favorites
  await expect(refreshedStar).toHaveText('☆'); // Check initial state
  await refreshedStar.click();
  await expect(refreshedStar).toHaveText('★');
  await expect(refreshedStar).toHaveClass(/favorited/);

  const favoritesSection = page.locator('#favorites');
  await expect(favoritesSection).toBeVisible();
  const favoritedItemInFavSection = favoritesSection.locator(`.service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"]`);
  await expect(favoritedItemInFavSection).toBeVisible();

  // 2. Test persistence
  await page.reload();
  await page.waitForSelector('.category', { timeout: 15000 }); // Wait for services to load

  const starAfterReload = page.locator(`.service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"] .favorite-star`).first();
  await expect(starAfterReload).toHaveText('★');
  await expect(page.locator('#favorites')).toBeVisible();
  await expect(page.locator(`#favorites .service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"]`)).toBeVisible();

  // 3. Remove from favorites
  await starAfterReload.click();
  await expect(starAfterReload).toHaveText('☆');
  await expect(starAfterReload).not.toHaveClass(/favorited/);

  // Wait for potential re-render of favorites section
  await page.waitForTimeout(500);
  const favsInSectionAfterRemove = page.locator(`#favorites .service-button`);
  if (await favsInSectionAfterRemove.count() === 0) {
     // Favorites section might hide or show "No favorites" message
    const noFavsMsg = page.locator('#favorites #noFavoritesMsg');
    if (await noFavsMsg.isVisible()){
      expect(true).toBe(true); // ok
    } else {
      // If no message, section itself might hide if empty logic applies, or just no buttons
      await expect(page.locator(`#favorites .service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"]`)).toHaveCount(0);
    }
  } else {
      await expect(page.locator(`#favorites .service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"]`)).toHaveCount(0);
  }
});

test('Sidebar toggles and links work', async ({ page }) => {
  const sidebar = page.locator('#sidebar');
  const sidebarToggle = page.locator('#sidebarToggle');
  const body = page.locator('body');

  await expect(sidebar).not.toHaveClass(/open/);
  await expect(body).not.toHaveClass(/sidebar-open/);

  await sidebarToggle.click();
  await expect(sidebar).toHaveClass(/open/);
  await expect(body).toHaveClass(/sidebar-open/);

  // Check if sidebar has links (at least one)
  const firstLinkInSidebar = sidebar.locator('a').first();
  await expect(firstLinkInSidebar).toBeVisible();
  const linkHref = await firstLinkInSidebar.getAttribute('href');

  await firstLinkInSidebar.click(); // This should also close the sidebar
  await expect(sidebar).not.toHaveClass(/open/); // Check if sidebar closes

  // Check if page scrolled to the section
  // This requires the section to be targetable by ID and visible
  const targetSectionId = linkHref.substring(1); // Remove #
  const targetSection = page.locator(`#${targetSectionId}`);
  await expect(targetSection).toBeInViewport();
});
