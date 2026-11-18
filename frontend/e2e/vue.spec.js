import { test, expect } from '@playwright/test';
// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'AutoSeller — início' })).toBeVisible();
    await expect(page.getByLabel('CPF')).toBeVisible();
    await expect(page.locator('#login-senha')).toBeVisible();
    await page.getByRole('button', { name: 'Mostrar senha' }).click();
    await expect(page.locator('#login-senha')).toHaveAttribute('type', 'text');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
    await page.getByLabel('CPF').fill('123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Informe um CPF válido.')).toBeVisible();
});
