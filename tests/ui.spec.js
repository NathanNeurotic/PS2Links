const { test, expect } = require('@playwright/test');

// Helper to get first link star button
async function getFirstStar(page) {
  return page.locator('.content .favorite-btn').first();
}

const BASE = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await page.locator('.favorite-btn').first().waitFor();
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
