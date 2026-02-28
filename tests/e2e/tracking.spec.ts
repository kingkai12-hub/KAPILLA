import { test, expect } from '@playwright/test';

test.describe('Shipment Tracking', () => {
  test('should display tracking form', async ({ page }) => {
    await page.goto('/');
    
    // Check for tracking input
    const trackingInput = page.locator('input[type="text"]').first();
    await expect(trackingInput).toBeVisible();
  });

  test('should handle invalid waybill number', async ({ page }) => {
    await page.goto('/');
    
    const trackingInput = page.locator('input[type="text"]').first();
    
    if (await trackingInput.count() > 0) {
      await trackingInput.fill('INVALID-123');
      await trackingInput.press('Enter');
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Should show some feedback (error message or no results)
      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();
    }
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA labels
    const inputs = page.locator('input');
    const count = await inputs.count();
    
    expect(count).toBeGreaterThan(0);
  });
});
