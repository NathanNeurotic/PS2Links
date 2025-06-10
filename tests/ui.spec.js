const { test, expect } = require('@playwright/test');

// Helper to get first link star button
async function getFirstStar(page) {
  return page.locator('.content .favorite-btn').first();
}

const BASE = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  // Wait for the main element to signal it's likely populated by generateHTML
  await page.waitForSelector('main > section h2.collapsible', { timeout: 10000 });
  // Additional wait to ensure JS execution has progressed enough for buttons to be interactive if visible.
  // This is a bit of a safety net. A more robust way would be to wait for a specific app state if available.
  await page.waitForTimeout(500); // Wait for 500ms
});

test('view toggling', async ({ page }) => {
  await page.click('#thumbnail-view-btn');
  const firstContent = page.locator('main section .content').first();
  await expect(firstContent).toHaveClass(/thumbnail-view/);

  await page.click('#list-view-btn');
  await expect(firstContent).toHaveClass(/list-view/);
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
