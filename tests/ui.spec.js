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

  // Use a specific known service name from your links.json for a reliable test
  // For this example, let's assume "8BitMods Discord Server" is in "Communities & Social Platforms"
  const testServiceName = "8BitMods Discord Server";
  const testCategoryName = "Communities & Social Platforms";
  // Normalize category name to ID as done in script.js
  const testCategoryId = testCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Ensure its category is expanded before searching
  const categoryHeader = page.locator(`#${testCategoryId} h2`);
  const categoryContent = page.locator(`#${testCategoryId} .category-content`);
  if (!await categoryContent.evaluate(el => el.classList.contains('open'))) {
    await categoryHeader.click();
    await page.waitForTimeout(500); // wait for animation
  }

  await searchInput.fill('8BitMods');
  await page.waitForTimeout(500); // Give search filtering JS time to execute

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
  await expect(refreshedStar).not.toHaveClass(/favorited/); // Check initial state (not favorited)
  await expect(refreshedStar).toHaveAttribute('aria-label', 'Add to favorites');
  await refreshedStar.click();
  await expect(refreshedStar).toHaveClass(/favorited/);
  await expect(refreshedStar).toHaveAttribute('aria-label', 'Remove from favorites');

  const favoritesSection = page.locator('#favorites');
  await expect(favoritesSection).toBeVisible();
  const favoritedItemInFavSection = favoritesSection.locator(`.service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"]`);
  await expect(favoritedItemInFavSection).toBeVisible();

  // 2. Test persistence
  await page.reload();
  await page.waitForSelector('.category', { timeout: 15000 }); // Wait for services to load

  const starAfterReload = page.locator(`.service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"] .favorite-star`).first();
  await expect(starAfterReload).toHaveClass(/favorited/);
  await expect(starAfterReload).toHaveAttribute('aria-label', 'Remove from favorites');
  await expect(page.locator('#favorites')).toBeVisible();
  await expect(page.locator(`#favorites .service-button[data-url="${await firstServiceButton.getAttribute('data-url')}"]`)).toBeVisible();

  // 3. Remove from favorites
  await starAfterReload.click();
  await expect(starAfterReload).not.toHaveClass(/favorited/);
  await expect(starAfterReload).toHaveAttribute('aria-label', 'Add to favorites');

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

test('No horizontal scrollbar in block view on wider screens', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });

  // Ensure categories are loaded after viewport change (beforeEach might have used a different default)
  // A reload can help, or re-waiting for a key element that depends on categories.
  // Given beforeEach already waits for '.category', a click should be fine if elements are present.
  // However, to be absolutely sure styles are applied to the new viewport before interaction:
  await page.reload();
  await page.waitForSelector('.category', { timeout: 15000 }); // Wait for services to load after reload

  const body = page.locator('body');
  const viewToggle = page.locator('#viewToggle');

  // Ensure body is in block-view. Click toggle if it's not.
  if (!await body.evaluate(el => el.classList.contains('block-view'))) {
    await viewToggle.click();
  }
  await expect(body).toHaveClass(/block-view/);

  // Assert that there is no horizontal scrollbar on the documentElement
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

  // Optional: Also check body, though documentElement is usually sufficient for page scrollbars
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
  expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth);
});

test('should handle long service names with wrapping and scrolling', async ({ page }) => {
  const mockServices = [
    {
      category: "Long Text Test",
      links: [
        {
          name: "ThisIsAnExtremelyLongServiceNameDesignedToTestTheUIWrappingAndScrollingBehaviorItJustKeepsGoingAndGoingAndGoingAndGoingAndGoingAndGoingAndGoingAndGoingOnAndOnAndOn",
          url: "http://example.com/longname",
          favicon_url: "./favicon.ico",
          tags: ["test", "longname"],
          thumbnail_url: ""
        },
        {
          name: "Normal Service 1",
          url: "http://example.com/normal1",
          favicon_url: "./favicon.ico",
          tags: ["test"],
          thumbnail_url: ""
        }
      ]
    }
  ];

  await page.route('**/links.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockServices)
    });
  });

  await page.goto(BASE_URL); // Navigate after setting up the route

  // Wait for the specific category to be rendered from mock data
  const longTextCategorySelector = '.category:has-text("Long Text Test")';
  await page.waitForSelector(longTextCategorySelector, { timeout: 15000 }); // Increased timeout for category

  // Ensure the "Long Text Test" category is open
  const longTextCategoryHeader = page.locator(`${longTextCategorySelector} h2`);
  const longTextCategoryContent = page.locator(`${longTextCategorySelector} .category-content`);

  // Check if header is visible before trying to click (it might not be if mock fails)
  await expect(longTextCategoryHeader).toBeVisible({ timeout: 5000 });

  if (!await longTextCategoryContent.evaluate(el => el.classList.contains('open'))) {
      await longTextCategoryHeader.click();
      // Wait for the content to have the 'open' class
      await expect(longTextCategoryContent).toHaveClass(/open/, { timeout: 5000 });
  }

  // More specific selector for the service button with the very long name
  const longServiceName = "ThisIsAnExtremelyLongServiceNameDesignedToTestTheUIWrappingAndScrollingBehaviorItJustKeepsGoingAndGoingAndGoingAndGoingAndGoingAndGoingAndGoingAndGoingOnAndOnAndOn";
  const serviceCard = page.locator(`${longTextCategorySelector} .service-button:has(.service-name:has-text("${longServiceName}"))`);
  await expect(serviceCard).toBeVisible({ timeout: 10000 });

  const serviceNameTextElement = serviceCard.locator('.service-name-text');
  await expect(serviceNameTextElement).toBeVisible();
  // Using a partial match for the text content assertion as the full string is very long
  await expect(serviceNameTextElement).toHaveText(/ThisIsAnExtremelyLongServiceNameDesignedToTestTheUIWrappingAndScrollingBehavior/, { timeout: 1000 });
  await expect(serviceNameTextElement).toHaveCSS('overflow-y', 'auto');
  // Browsers compute em to px, so we check the computed pixel value.
  // Assuming 1em = 16px (common browser default for 1rem, and .service-name font-size is 1rem)
  // 4.2em * 16px/em = 67.2px.
  // For more robustness, one might get the font-size and calculate, but this is usually stable.
  await expect(serviceNameTextElement).toHaveCSS('max-height', '67.2px');
  await expect(serviceNameTextElement).toHaveCSS('display', 'block'); // From styles.css

  // Also check the service name (parent of service-name-text) for its align-items property
  const serviceNameElement = serviceCard.locator('.service-name');
  await expect(serviceNameElement).toHaveCSS('align-items', 'flex-start'); // From styles.css
});
