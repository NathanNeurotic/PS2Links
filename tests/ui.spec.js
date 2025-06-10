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

  await star.click({ force: true });
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
