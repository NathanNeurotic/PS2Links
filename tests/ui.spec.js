const { test, expect } = require('@playwright/test');

// Helper to get first link star button
async function getFirstStar(page) {
  return page.locator('.content .favorite-btn').first();
}

const BASE = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  // Wait for the main element to be present, indicating basic HTML structure is loaded.
  // Further waits for specific content should be in individual tests or more specific setup helpers.
  await page.locator('main').waitFor({ timeout: 10000 });
});

test('view toggling and category layout', async ({ page }) => {
  const mainElement = page.locator('main');
  const firstContent = mainElement.locator('section .content').first();

  // Test Thumbnail View
  await page.click('#thumbnail-view-btn');
  await expect(mainElement).toHaveCSS('display', 'grid'); // New assertion for main layout
  await expect(firstContent).toHaveClass(/thumbnail-view/); // Existing assertion for content view

  // Test List View
  await page.click('#list-view-btn');
  await expect(mainElement).toHaveCSS('display', 'flex'); // Layout switches back to flex
  await expect(firstContent).toHaveClass(/list-view/);     // Existing assertion for content view
});

test('theme switching', async ({ page }) => {
  const body = page.locator('body');
  const initial = await body.getAttribute('class');
  await page.click('#theme-toggle-btn');
  const toggled = await body.getAttribute('class');
  expect(toggled).not.toBe(initial);
  const stored = await page.evaluate(() => localStorage.getItem('theme'));
  expect(stored).not.toBeNull();
});

test('favorites persistence', async ({ page }) => {
  const header = page.locator('main h2.collapsible').first();
  await header.click();
  const star = await getFirstStar(page);
  await star.click({ force: true });
  await expect(star).toHaveClass(/favorited/);

  await page.reload();
  const starAfter = await getFirstStar(page);
  await expect(starAfter).toHaveClass(/favorited/);
});

test('favorites section shows and hides without reload', async ({ page }) => {
  const header = page.locator('main h2.collapsible').first();
  await header.click();

  const star = await getFirstStar(page);
  await star.click({ force: true });

  const favoritesSection = page.locator('#favorites-section');
  await expect(favoritesSection).toBeVisible();
  await page.locator('section:not(#favorites-section) .favorite-btn.favorited').first().click({ force: true });
  await expect(favoritesSection).toHaveCount(0);
});

test('category collapsible toggle', async ({ page }) => {
  const firstSection = page.locator('main > section').first();
  const header = firstSection.locator('h2.collapsible');
  const content = firstSection.locator('.content');

  await expect(content).not.toBeVisible();
  await header.click();
  await expect(content).toBeVisible();
  await header.click();
  await expect(content).not.toBeVisible();
});

test('search filters categories', async ({ page }) => {
  const search = page.locator('#search-bar');
  await search.fill('Romhacking');

  const visibleSections = page.locator('main > section:visible');
  await expect(visibleSections).toHaveCount(1);
  await expect(visibleSections.first()).toContainText('Romhacking.net Forum');

  await search.fill('');
  await expect(page.locator('main > section:visible').first()).toBeVisible();
});

test('favorites section appears at the top', async ({ page }) => {
  // Prerequisite: Ensure at least one item is favorited.
  // Expand the first category
  const firstCategoryHeader = page.locator('main h2.collapsible').first();
  await firstCategoryHeader.click();
  // Favorite the first item in that category
  const firstFavoriteButton = page.locator('.content .favorite-btn').first();
  await firstFavoriteButton.click({ force: true }); // Use force if needed, e.g. if element is not "stable"

  // Check if the favorites section is now visible
  const favoritesSection = page.locator('#favorites-section');
  await expect(favoritesSection).toBeVisible();

  // Assert that the "Favorites" section is the first child of the main element
  await expect(page.locator('main > section:first-child')).toHaveId('favorites-section');

  // Clean up: Unfavorite the item to leave state as it was (optional, but good practice)
  await page.locator('section:not(#favorites-section) .favorite-btn.favorited').first().click({ force: true });
  await expect(favoritesSection).toHaveCount(0); // Or expect it to be hidden/not present
});

test('thumbnail items are square', async ({ page }) => {
  // Ensure the view is set to "thumbnail"
  await page.click('#thumbnail-view-btn');

  // Expand a category to make thumbnails visible
  const firstCategoryHeader = page.locator('main h2.collapsible').first();
  await firstCategoryHeader.click();
  // Ensure content is visible before trying to locate items within it
  await page.locator('main > section .content.thumbnail-view').first().waitFor({ state: 'visible' });


  const thumbnailItem = page.locator('.thumbnail-item').first();
  // It might take a moment for CSS to apply and items to render, especially in CI
  await thumbnailItem.waitFor({ state: 'visible' });


  const width = await thumbnailItem.evaluate(el => parseFloat(getComputedStyle(el).width));
  const height = await thumbnailItem.evaluate(el => parseFloat(getComputedStyle(el).height));
  expect(Math.abs(width - height)).toBeLessThan(1);
});

test('thumbnail images use object-fit contain', async ({ page }) => {
  // Ensure the view is set to "thumbnail"
  await page.click('#thumbnail-view-btn');

  // Expand a category
  const firstCategoryHeader = page.locator('main h2.collapsible').first();
  await firstCategoryHeader.click();
  // Ensure content is visible
  await page.locator('main > section .content.thumbnail-view').first().waitFor({ state: 'visible' });

  const thumbnailImage = page.locator('.thumbnail-item img').first();
  // Wait for the image to be loaded and visible
  await thumbnailImage.waitFor({ state: 'visible' });

  await expect(thumbnailImage).toHaveCSS('object-fit', 'contain');
});
