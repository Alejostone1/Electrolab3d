import { expect, test } from '@playwright/test';

test('la portada presenta el proyecto y el equipo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ELECTROLAB/ }).first()).toBeVisible();
  await expect(page.getByText('Alejandro Piedrahita').first()).toBeVisible();
});

test('el laboratorio recalcula la clasificación al cambiar R', async ({ page }) => {
  await page.goto('/laboratorio');
  const panel = page.locator('.laboratorio__lateral--izquierdo, .laboratorio__movil').first();
  if (await page.locator('.laboratorio__movil').isVisible()) await page.getByRole('tab', { name: 'Parámetros' }).click();
  await panel.getByRole('button', { name: /Sobreamortiguado/ }).click();
  if (await page.locator('.laboratorio__movil').isVisible()) await page.getByRole('tab', { name: 'Resultados' }).click();
  await expect(page.locator('.clasificacion strong').first()).toHaveText('Sobreamortiguado');
});

test('la presentación avanza entre diapositivas', async ({ page }) => {
  await page.goto('/presentacion');
  await expect(page.getByText('1/15').or(page.locator('.presentacion__punto--activo'))).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('heading', { name: /circuito RLC en serie/ })).toBeVisible();
});

test('el modo oscuro/claro se alterna', async ({ page }) => {
  await page.goto('/aplicaciones');
  const antes = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /Activar modo/ }).first().click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', antes ?? '');
});
