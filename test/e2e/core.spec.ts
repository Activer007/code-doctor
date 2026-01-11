import { test, expect } from '@playwright/test';

test.describe('Code Doctor Core Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the application', async ({ page }) => {
    await expect(page.getByText('CODE DOCTOR')).toBeVisible();
    await expect(page.getByText('输入终端')).toBeVisible();
  });

  test('should run code and show output in console', async ({ page }) => {
    const editor = page.locator('.monaco-editor').first();
    await editor.click();
    // Use keyboard to type into Monaco
    await page.keyboard.type('print("Hello from E2E")');
    
    await page.getByRole('button', { name: /运行/i }).click();
    
    const consoleOutput = page.locator('.font-mono', { hasText: 'Hello from E2E' });
    await expect(consoleOutput).toBeVisible();
  });

  test('should diagnose code and show trace map', async ({ page }) => {
    const editor = page.locator('.monaco-editor').first();
    await editor.click();
    await page.keyboard.type('df["A"]');
    
    await page.getByRole('button', { name: /启动扫描/i }).click();
    
    // Wait for analysis to complete
    await expect(page.getByText('诊断摘要')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('步骤 1')).toBeVisible();
  });

  test('should open flashcard review mode', async ({ page }) => {
    // Inject some flashcards to localStorage first to enable the button
    await page.evaluate(() => {
      localStorage.setItem('code-doctor-storage', JSON.stringify({
        state: {
          flashcards: [{
            id: 'e2e-card',
            concept: 'E2E Concept',
            frontCode: 'bad',
            backCode: 'good',
            explanation: 'desc',
            stats: { correctStreak: 0, incorrectCount: 0, status: 'new' }
          }]
        },
        version: 0
      }));
    });
    
    await page.reload();
    
    const flashcardBtn = page.getByRole('button', { name: /错题闪卡/i });
    await expect(flashcardBtn).toBeEnabled();
    await flashcardBtn.click();
    
    await expect(page.getByText('E2E Concept')).toBeVisible();
    await expect(page.getByText('PATHOLOGY')).toBeVisible();
  });
});
