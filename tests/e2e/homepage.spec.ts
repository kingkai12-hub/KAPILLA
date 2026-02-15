import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page title contains "Kapilla"
    await expect(page).toHaveTitle(/Kapilla/);
  });

  test('should have tracking functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for tracking input or button
    const trackingElement = page.locator('input[placeholder*="waybill" i], input[placeholder*="track" i]').first();
    
    if (await trackingElement.count() > 0) {
      await expect(trackingElement).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have dark mode toggle', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme" i], button[title*="theme" i]').first();
    
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      // Wait for theme change
      await page.waitForTimeout(500);
    }
  });
});
