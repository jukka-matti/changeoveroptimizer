import { test, expect } from '@playwright/test';

test.describe('ChangeoverOptimizer Smoke Test', () => {
  test('should load the welcome screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('ChangeoverOptimizer');
    await expect(page.getByText('Production changeover sequence optimization')).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('Subscription & License')).toBeVisible();
  });

  test('should show sample data button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Load Example Schedule' })).toBeVisible();
  });
});


